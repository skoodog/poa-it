/**
 * PATCH /api/revocations/[id]/notices/[noticeId]
 *
 * Updates a notice's delivery status and related metadata. This is the
 * primary endpoint for the notice tracker UI — when the user clicks
 * "Mark as Sent", "Mark as Acknowledged", etc., the UI POSTs here.
 *
 * Allowed updates:
 *   deliveryStatus, sentAt, deliveredAt, openedAt,
 *   acknowledgmentReceivedAt, refusedAt, bouncedAt,
 *   acknowledgmentNotes, trackingNumber, notes
 *
 * Side effects:
 *   - Emits an audit event capturing the status transition
 *   - Recomputes the parent revocation's status:
 *     - If all notices acknowledged or refused → revocation.status = "complete"
 *     - If any notice has been sent → revocation.status = "notice_in_progress"
 *     - Otherwise stays at "executed"
 *
 * Sprint 4c — Round 3.
 */

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
import { db } from "../../../../../../lib/db";
import {
  revocations,
  revocationNotices,
  auditEvents,
  users,
} from "../../../../../../lib/db/schema";

export const runtime = "nodejs";

const STATUS_TIMESTAMP_MAP = {
  sent: "sentAt",
  delivered: "deliveredAt",
  opened: "openedAt",
  acknowledged: "acknowledgmentReceivedAt",
  refused: "refusedAt",
  bounced: "bouncedAt",
};

const UPDATABLE_FIELDS = new Set([
  "deliveryStatus",
  "sentAt",
  "deliveredAt",
  "openedAt",
  "acknowledgmentReceivedAt",
  "refusedAt",
  "bouncedAt",
  "acknowledgmentNotes",
  "trackingNumber",
  "notes",
]);

const TERMINAL_STATUSES = new Set(["acknowledged", "refused", "bounced"]);

export async function PATCH(request, { params }) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }

    const { id: revocationId, noticeId } = await params;
    const body = await request.json().catch(() => ({}));

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, clerkUserId))
      .limit(1);
    if (!user) {
      return NextResponse.json({ error: "user_not_found" }, { status: 404 });
    }

    // Ensure the revocation belongs to this user
    const [revocation] = await db
      .select()
      .from(revocations)
      .where(eq(revocations.id, revocationId))
      .limit(1);
    if (!revocation || revocation.userId !== user.id) {
      return NextResponse.json({ error: "revocation_not_found" }, { status: 404 });
    }

    // Ensure the notice belongs to this revocation
    const [existing] = await db
      .select()
      .from(revocationNotices)
      .where(
        and(
          eq(revocationNotices.id, noticeId),
          eq(revocationNotices.revocationId, revocationId)
        )
      )
      .limit(1);
    if (!existing) {
      return NextResponse.json({ error: "notice_not_found" }, { status: 404 });
    }

    // Build the update set from whitelisted fields
    const updates = {};
    for (const [key, value] of Object.entries(body)) {
      if (UPDATABLE_FIELDS.has(key)) {
        updates[key] = value;
      }
    }

    // If deliveryStatus changed, auto-set the matching timestamp to "now"
    // unless one was explicitly provided
    if (updates.deliveryStatus) {
      const tsField = STATUS_TIMESTAMP_MAP[updates.deliveryStatus];
      if (tsField && !updates[tsField]) {
        updates[tsField] = new Date();
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "no_updatable_fields" }, { status: 400 });
    }

    updates.updatedAt = new Date();

    const result = await db.transaction(async (tx) => {
      // Update the notice
      const [updatedNotice] = await tx
        .update(revocationNotices)
        .set(updates)
        .where(eq(revocationNotices.id, noticeId))
        .returning();

      // Audit event for the status transition (if status changed)
      if (updates.deliveryStatus && updates.deliveryStatus !== existing.deliveryStatus) {
        await tx.insert(auditEvents).values({
          userId: user.id,
          firmId: user.firmId,
          clientId: revocation.clientId,
          eventType: "revocation_notice_status_changed",
          eventData: {
            revocationId,
            noticeId,
            recipientType: existing.recipientType,
            // Recipient name is PII — pii_scrub_status default handles this
            from: existing.deliveryStatus,
            to: updates.deliveryStatus,
          },
        });
      }

      // Recompute the parent revocation's status
      const allNotices = await tx
        .select()
        .from(revocationNotices)
        .where(eq(revocationNotices.revocationId, revocationId));

      const hasSent = allNotices.some(
        (n) => n.deliveryStatus !== "queued"
      );
      const allTerminal =
        allNotices.length > 0 &&
        allNotices.every((n) => TERMINAL_STATUSES.has(n.deliveryStatus));

      let newRevocationStatus = revocation.status;
      if (allTerminal) {
        newRevocationStatus = "complete";
      } else if (hasSent) {
        newRevocationStatus = "notice_in_progress";
      }
      // Note: we never roll BACK from notice_in_progress to executed, even if
      // all notice rows somehow got reset. That state machine moves forward.

      if (
        newRevocationStatus !== revocation.status &&
        revocation.status !== "draft" // never auto-transition out of draft
      ) {
        await tx
          .update(revocations)
          .set({ status: newRevocationStatus, updatedAt: new Date() })
          .where(eq(revocations.id, revocationId));
      }

      return updatedNotice;
    });

    return NextResponse.json({ notice: result });
  } catch (err) {
    console.error("Notice update error:", err);
    return NextResponse.json(
      { error: "update_failed", message: err?.message },
      { status: 500 }
    );
  }
}
