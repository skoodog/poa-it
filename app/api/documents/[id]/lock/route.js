/**
 * POST /api/documents/[id]/lock
 *
 * Lock-for-signing — the freeze. Transitions a draft document to
 * `locked_for_signing`:
 *   1. Render the clean (non-watermarked) PDF once from the wizard session.
 *   2. Store that exact binary in Vercel Blob (private).
 *   3. Compute + store its SHA-256.
 *   4. Stamp lockedAt and the version manifest (already captured at draft
 *      creation; re-affirmed here).
 *   5. The document becomes read-only — future views serve the stored binary,
 *      never a regeneration.
 *
 * This is the lawyer's rule made real: the moment a document becomes a
 * signing package, it freezes. Any later change must create a NEW version.
 *
 * Auth required. Per L001, uses await auth().
 *
 * Sprint 5 Round 2.
 */

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "../../../../../lib/db";
import {
  documents,
  wizardSessions,
  users,
  auditEvents,
} from "../../../../../lib/db/schema";
import { generateTexasPoaPdf } from "../../../../../lib/pdf/generatePdf";
import { storeLockedSigningCopy } from "../../../../../lib/server/documentStorage";
import { TAXONOMY_VERSION } from "../../../../../lib/taxonomy/poaTaxonomy";
import {
  TEMPLATE_VERSION,
  RENDER_ENGINE_VERSION,
} from "../../../../../lib/pdf/documentVersion";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request, { params }) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }

    const { id } = await params;

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

    // Only a draft can be locked. A document that's already locked or
    // executed is immutable — re-locking would violate the freeze rule.
    if (doc.status !== "draft") {
      return NextResponse.json(
        {
          error: "not_lockable",
          message: `Only draft documents can be locked for signing (this one is "${doc.status}").`,
        },
        { status: 400 }
      );
    }

    // Sprint 6 — attorney-review correction: drafts flagged for attention
    // (e.g., created via client-submitted intake) must be reviewed and the
    // flag dismissed before they can be locked. This encodes the hard
    // product rule: an unauthenticated client's intake never auto-progresses
    // past draft; an attorney must affirmatively review.
    if (doc.attentionRequired) {
      return NextResponse.json(
        {
          error: "attention_required",
          message:
            "This draft was created via client intake and requires attorney " +
            "review before it can be locked for signing. Open the document " +
            "and confirm the contents, then dismiss the review flag to proceed.",
          attentionReason: doc.attentionReason,
        },
        { status: 400 }
      );
    }

    // Load the wizard session to render from
    const [session] = await db
      .select()
      .from(wizardSessions)
      .where(eq(wizardSessions.id, doc.wizardSessionId))
      .limit(1);
    if (!session?.state) {
      return NextResponse.json(
        { error: "session_not_found", message: "Cannot render — wizard session missing." },
        { status: 404 }
      );
    }

    // Render the CLEAN (non-watermarked) signing copy and freeze it.
    const renderState = { ...session.state, sessionId: session.id };
    const pdfBuffer = await generateTexasPoaPdf(renderState, { watermarked: false });

    const { blobKey, sha256 } = await storeLockedSigningCopy(pdfBuffer, doc.id);

    const now = new Date();
    const [updated] = await db
      .update(documents)
      .set({
        status: "locked_for_signing",
        lockedPdfBlobKey: blobKey,
        lockedPdfSha256: sha256,
        lockedAt: now,
        // Re-affirm the manifest (captured at draft creation; ensures it's
        // populated even for documents created before manifest capture).
        templateVersion: doc.templateVersion || TEMPLATE_VERSION,
        taxonomyVersion: doc.taxonomyVersion || TAXONOMY_VERSION,
        renderEngineVersion: doc.renderEngineVersion || RENDER_ENGINE_VERSION,
        isWatermarked: false,
        updatedAt: now,
      })
      .where(eq(documents.id, id))
      .returning();

    // Document-scoped audit event
    await db.insert(auditEvents).values({
      sessionId: doc.wizardSessionId,
      userId: user.id,
      firmId: user.firmId,
      clientId: doc.clientId,
      documentId: doc.id,
      eventType: "document_locked_for_signing",
      eventData: {
        sha256,
        byteSize: pdfBuffer.length,
        templateVersion: updated.templateVersion,
        taxonomyVersion: updated.taxonomyVersion,
        renderEngineVersion: updated.renderEngineVersion,
      },
    });

    return NextResponse.json({ document: updated });
  } catch (err) {
    console.error("[/api/documents/[id]/lock] error:", err);
    return NextResponse.json(
      { error: "lock_failed", message: err?.message },
      { status: 500 }
    );
  }
}
