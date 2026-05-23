/**
 * POST /api/revocations/[id]/execute
 *
 * Finalizes a revocation. Performs a transaction:
 *   1. Transitions revocation.status: draft → executed
 *   2. Sets revocation.executedAt = now
 *   3. Transitions the original POA's status to "revoked" and links
 *      documents.revokedByRevocationId to this revocation
 *   4. Creates revocationNotices rows from the wizard's recipients list
 *   5. Creates revocationRecordings rows from the wizard's recordings list
 *   6. Emits audit events
 *
 * For Sprint 4c MVP, "execute" doesn't actually invoke RON/notarization or
 * send notices. It's a manual confirmation that the user has executed the
 * physical/notarized document outside the system. Sprint 7 wires real
 * notarization and email delivery.
 *
 * Sprint 4c — Round 2.
 */

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { eq, and, inArray } from "drizzle-orm";
import { db } from "../../../../../lib/db";
import {
  revocations,
  documents,
  revocationNotices,
  revocationRecordings,
  auditEvents,
  users,
} from "../../../../../lib/db/schema";

export const runtime = "nodejs";

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
      .where(eq(users.clerkUserId, clerkUserId))
      .limit(1);
    if (!user) {
      return NextResponse.json({ error: "user_not_found" }, { status: 404 });
    }

    const [revocation] = await db
      .select()
      .from(revocations)
      .where(eq(revocations.id, id))
      .limit(1);
    if (!revocation || revocation.userId !== user.id) {
      return NextResponse.json({ error: "revocation_not_found" }, { status: 404 });
    }
    if (revocation.status !== "draft") {
      return NextResponse.json(
        { error: "already_executed", message: "Revocation has already been executed." },
        { status: 400 }
      );
    }

    const wizardState = revocation.wizardState || {};
    const recipients = Array.isArray(wizardState.recipients) ? wizardState.recipients : [];
    const recordings = Array.isArray(wizardState.realPropertyRecordings)
      ? wizardState.realPropertyRecordings
      : [];

    // Begin transaction
    const result = await db.transaction(async (tx) => {
      const now = new Date();

      // 1+2. Update revocation status + executedAt
      const [updatedRevocation] = await tx
        .update(revocations)
        .set({
          status: "executed",
          executedAt: now,
          updatedAt: now,
        })
        .where(eq(revocations.id, id))
        .returning();

      // 3. Transition original POA to "revoked"
      if (revocation.originalPoaId) {
        await tx
          .update(documents)
          .set({
            status: "revoked",
            revokedByRevocationId: id,
            updatedAt: now,
          })
          .where(eq(documents.id, revocation.originalPoaId));
      }

      // 3a. If scope = "all_prior", also revoke any other prior active POAs
      // for the same client. Note: Sprint 4c handles "all_prior" only at the
      // documents-table-status level. We don't generate separate revocation
      // certificates for each other prior POA — they're collectively
      // revoked by this single instrument.
      if (revocation.scope === "all_prior" && revocation.clientId) {
        const otherPriorPoas = await tx
          .select({ id: documents.id })
          .from(documents)
          .where(
            and(
              eq(documents.clientId, revocation.clientId),
              inArray(documents.status, [
                "generated",
                "signed",
                "notarized",
                "delivered",
              ])
            )
          );
        const otherPriorIds = otherPriorPoas
          .map((d) => d.id)
          .filter((dId) => dId !== revocation.originalPoaId);
        if (otherPriorIds.length > 0) {
          await tx
            .update(documents)
            .set({
              status: "revoked",
              revokedByRevocationId: id,
              updatedAt: now,
            })
            .where(inArray(documents.id, otherPriorIds));
        }
      }

      // 4. Persist recipients to revocationNotices table
      if (recipients.length > 0) {
        const noticeRows = recipients.map((r) => ({
          revocationId: id,
          recipientType: r.recipientType || "other",
          recipientName: r.recipientName,
          recipientEmail: r.recipientEmail || null,
          recipientPhone: r.recipientPhone || null,
          recipientInstitutionName: r.recipientInstitutionName || null,
          recipientAddress: r.recipientAddress || null,
          recipientCity: r.recipientCity || null,
          recipientState: r.recipientState || null,
          recipientZip: r.recipientZip || null,
          deliveryMethod: r.deliveryMethod || "email",
          deliveryStatus: "queued",
          notes: r.notes || null,
        }));
        await tx.insert(revocationNotices).values(noticeRows);
      }

      // 5. Persist recordings
      if (recordings.length > 0) {
        const recordingRows = recordings.map((rec) => ({
          revocationId: id,
          countyName: rec.countyName,
          state: rec.state || "Texas",
          notes: rec.notes || null,
        }));
        await tx.insert(revocationRecordings).values(recordingRows);
      }

      // 6. Audit events
      await tx.insert(auditEvents).values([
        {
          userId: user.id,
          firmId: user.firmId,
          clientId: revocation.clientId,
          eventType: "revocation_executed",
          eventData: {
            revocationId: id,
            originalPoaId: revocation.originalPoaId,
            scope: revocation.scope,
            recipientCount: recipients.length,
            recordingCount: recordings.length,
          },
        },
        {
          userId: user.id,
          firmId: user.firmId,
          clientId: revocation.clientId,
          eventType: "poa_status_changed",
          eventData: {
            documentId: revocation.originalPoaId,
            from: "active",
            to: "revoked",
            revokedByRevocationId: id,
          },
        },
      ]);

      return updatedRevocation;
    });

    return NextResponse.json({ revocation: result });
  } catch (err) {
    console.error("Revocation execute error:", err);
    return NextResponse.json(
      { error: "execute_failed", message: err?.message },
      { status: 500 }
    );
  }
}
