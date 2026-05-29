/**
 * POST /api/documents/[id]/dismiss-attention
 *
 * Attorney's "reviewed; this is fine" action on a document that was flagged
 * for review. Two scenarios it serves:
 *
 *   1. CLIENT-SUBMITTED INTAKE REVIEW: the document was created via the
 *      send-link path. Attorney has opened it, confirmed the contents, and
 *      is releasing it to be locked. The draft remains a draft; only the
 *      flag clears.
 *
 *   2. POTENTIAL REPLACEMENT REVIEW: the document is an older POA that the
 *      platform flagged when a newer POA was created for the same client.
 *      Attorney has reviewed and determined that the older POA is NOT
 *      replaced (e.g., the new POA addresses a different scope, or the
 *      attorney intends to execute a proper revocation separately). The
 *      document returns to its prior active legal status — we infer that
 *      status from the absence of any revocation linkage; "locked_for_signing"
 *      and "executed" are the only states a document could have been in to
 *      have reached "potential_replacement_review_required" in the first
 *      place, so we restore from a stored prior-status hint in the eventData.
 *
 * Auth required. Per L001, uses await auth().
 *
 * Body: { dismissalReason }
 *
 * Sprint 6 (attorney-review correction round).
 */

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { eq, and, desc } from "drizzle-orm";
import { db } from "../../../../../lib/db";
import { documents, users, auditEvents } from "../../../../../lib/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request, { params }) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { dismissalReason } = body;

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkUserId))
      .limit(1);
    if (!user) {
      return NextResponse.json({ error: "user_not_found" }, { status: 404 });
    }

    const [doc] = await db
      .select()
      .from(documents)
      .where(eq(documents.id, id))
      .limit(1);
    if (!doc || doc.userId !== user.id) {
      return NextResponse.json({ error: "document_not_found" }, { status: 404 });
    }
    if (!doc.attentionRequired) {
      return NextResponse.json(
        { error: "nothing_to_dismiss", message: "This document has no attention flag set." },
        { status: 400 }
      );
    }

    const now = new Date();
    const updates = {
      attentionRequired: false,
      attentionDismissedAt: now,
      attentionDismissedBy: user.id,
      attentionDismissalReason: dismissalReason || null,
      updatedAt: now,
    };

    // If this was a potential-replacement flag, restore the document's
    // legal status to its prior active value. We pull the most recent
    // document_attention_required event for this document and use the
    // previousStatus it recorded.
    if (doc.status === "potential_replacement_review_required") {
      const [attentionEvent] = await db
        .select({ eventData: auditEvents.eventData })
        .from(auditEvents)
        .where(
          and(
            eq(auditEvents.documentId, doc.id),
            eq(auditEvents.eventType, "document_attention_required")
          )
        )
        .orderBy(desc(auditEvents.timestamp))
        .limit(1);

      const priorStatus = attentionEvent?.eventData?.previousStatus;
      // Defense in depth: if for any reason we can't recover the prior
      // status, default back to "executed" (the more legally significant
      // of the two possible prior states) rather than leaving the
      // document in an attention-required state.
      const restoredStatus =
        priorStatus === "locked_for_signing" || priorStatus === "executed"
          ? priorStatus
          : "executed";
      updates.status = restoredStatus;
    }

    const [updated] = await db
      .update(documents)
      .set(updates)
      .where(eq(documents.id, doc.id))
      .returning();

    await db.insert(auditEvents).values({
      sessionId: doc.wizardSessionId,
      userId: user.id,
      firmId: doc.firmId,
      clientId: doc.clientId,
      documentId: doc.id,
      eventType: "document_attention_dismissed",
      actor: "user",
      eventData: {
        previousAttentionReason: doc.attentionReason,
        dismissalReason: dismissalReason || null,
        statusAfter: updated.status,
      },
    });

    return NextResponse.json({ document: updated });
  } catch (err) {
    console.error("[/api/documents/[id]/dismiss-attention] error:", err);
    return NextResponse.json(
      { error: "dismiss_failed", message: err?.message },
      { status: 500 }
    );
  }
}
