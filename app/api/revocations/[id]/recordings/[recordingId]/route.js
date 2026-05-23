/**
 * PATCH /api/revocations/[id]/recordings/[recordingId]
 *
 * Updates a county-recording row. Users hit this when they've actually
 * gone to the county clerk and recorded the revocation, then come back
 * to mark it complete and capture the recording document number, book/page,
 * fees, etc.
 *
 * Allowed updates:
 *   recordedAt, recordingDocumentNumber, recordingBookPage,
 *   recordingFeesPaid, notes
 *
 * Side effects:
 *   - Audit event when recordedAt transitions from null → set (i.e., the
 *     recording is "completed")
 *
 * Sprint 4c — Round 3.
 */

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
import { db } from "../../../../../../lib/db";
import {
  revocations,
  revocationRecordings,
  auditEvents,
  users,
} from "../../../../../../lib/db/schema";

export const runtime = "nodejs";

const UPDATABLE_FIELDS = new Set([
  "recordedAt",
  "recordingDocumentNumber",
  "recordingBookPage",
  "recordingFeesPaid",
  "notes",
]);

export async function PATCH(request, { params }) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }

    const { id: revocationId, recordingId } = await params;
    const body = await request.json().catch(() => ({}));

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, clerkUserId))
      .limit(1);
    if (!user) {
      return NextResponse.json({ error: "user_not_found" }, { status: 404 });
    }

    // Ownership check via the parent revocation
    const [revocation] = await db
      .select()
      .from(revocations)
      .where(eq(revocations.id, revocationId))
      .limit(1);
    if (!revocation || revocation.userId !== user.id) {
      return NextResponse.json({ error: "revocation_not_found" }, { status: 404 });
    }

    // Recording must belong to this revocation
    const [existing] = await db
      .select()
      .from(revocationRecordings)
      .where(
        and(
          eq(revocationRecordings.id, recordingId),
          eq(revocationRecordings.revocationId, revocationId)
        )
      )
      .limit(1);
    if (!existing) {
      return NextResponse.json({ error: "recording_not_found" }, { status: 404 });
    }

    // Whitelist updates
    const updates = {};
    for (const [key, value] of Object.entries(body)) {
      if (UPDATABLE_FIELDS.has(key)) {
        updates[key] = value;
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "no_updatable_fields" }, { status: 400 });
    }

    updates.updatedAt = new Date();

    const result = await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(revocationRecordings)
        .set(updates)
        .where(eq(revocationRecordings.id, recordingId))
        .returning();

      // Audit when recording transitions to "completed" (recordedAt set for first time)
      const transitioningToRecorded =
        !existing.recordedAt && updates.recordedAt;
      if (transitioningToRecorded) {
        await tx.insert(auditEvents).values({
          userId: user.id,
          firmId: user.firmId,
          clientId: revocation.clientId,
          eventType: "revocation_recording_completed",
          eventData: {
            revocationId,
            recordingId,
            countyName: existing.countyName,
            state: existing.state,
            documentNumber: updates.recordingDocumentNumber || null,
          },
        });
      }

      return updated;
    });

    return NextResponse.json({ recording: result });
  } catch (err) {
    console.error("Recording update error:", err);
    return NextResponse.json(
      { error: "update_failed", message: err?.message },
      { status: 500 }
    );
  }
}
