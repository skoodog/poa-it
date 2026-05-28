/**
 * PATCH /api/presentations/[id]/responses/[responseId]
 *
 * Edits an existing presentation response (correct a typo, add notes,
 * update requested items). If the responseType changes, the parent
 * presentation's status is recomputed from the edited value.
 *
 * Sprint 4d Round 3.
 */

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { eq, desc } from "drizzle-orm";
import { db } from "../../../../../../lib/db";
import {
  institutionPresentations,
  presentationResponses,
  auditEvents,
  users,
} from "../../../../../../lib/db/schema";
import { isValidPresentationResponseType } from "../../../../../../lib/taxonomy/poaTaxonomy";

export const runtime = "nodejs";

const RESPONSE_TO_STATUS = {
  accepted: "accepted",
  rejected: "rejected",
  requested_certification: "pending_followup",
  requested_opinion: "pending_followup",
  requested_translation: "pending_followup",
  pending: "presented",
};

const EDITABLE_FIELDS = new Set([
  "responseType",
  "refusalReason",
  "requestedItems",
  "notes",
  "respondedAt",
]);

export async function PATCH(request, { params }) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }

    const { id, responseId } = await params;
    const body = await request.json().catch(() => ({}));

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkUserId))
      .limit(1);
    if (!user) {
      return NextResponse.json({ error: "user_not_found" }, { status: 404 });
    }

    // Verify the presentation belongs to this user
    const [presentation] = await db
      .select()
      .from(institutionPresentations)
      .where(eq(institutionPresentations.id, id))
      .limit(1);
    if (!presentation || presentation.userId !== user.id) {
      return NextResponse.json(
        { error: "presentation_not_found" },
        { status: 404 }
      );
    }

    // Verify the response exists and belongs to this presentation
    const [existing] = await db
      .select()
      .from(presentationResponses)
      .where(eq(presentationResponses.id, responseId))
      .limit(1);
    if (!existing || existing.presentationId !== id) {
      return NextResponse.json(
        { error: "response_not_found" },
        { status: 404 }
      );
    }

    // Validate responseType if it's being changed
    if (
      body.responseType !== undefined &&
      !isValidPresentationResponseType(body.responseType)
    ) {
      return NextResponse.json(
        { error: "invalid_response_type" },
        { status: 400 }
      );
    }

    // Build whitelisted updates
    const updates = {};
    for (const [key, value] of Object.entries(body)) {
      if (!EDITABLE_FIELDS.has(key)) continue;
      if (key === "respondedAt") {
        updates.respondedAt = value ? new Date(value) : existing.respondedAt;
      } else if (key === "refusalReason" || key === "notes") {
        updates[key] = value?.trim() || null;
      } else {
        updates[key] = value;
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "no_editable_fields" }, { status: 400 });
    }

    // Enforce refusal reason when responseType is (or stays) rejected
    const effectiveType = updates.responseType || existing.responseType;
    const effectiveReason =
      updates.refusalReason !== undefined
        ? updates.refusalReason
        : existing.refusalReason;
    if (effectiveType === "rejected" && !effectiveReason) {
      return NextResponse.json(
        {
          error: "refusal_reason_required",
          message: "A refusal reason is required for a rejection.",
        },
        { status: 400 }
      );
    }

    updates.updatedAt = new Date();

    const [updated] = await db
      .update(presentationResponses)
      .set(updates)
      .where(eq(presentationResponses.id, responseId))
      .returning();

    // If responseType changed, recompute the presentation status — but only
    // if this is the most recent response (older edits shouldn't override a
    // newer response's status).
    let updatedPresentation = presentation;
    if (updates.responseType) {
      const [latest] = await db
        .select()
        .from(presentationResponses)
        .where(eq(presentationResponses.presentationId, id))
        .orderBy(desc(presentationResponses.respondedAt))
        .limit(1);

      if (latest && latest.id === responseId) {
        const newStatus =
          RESPONSE_TO_STATUS[updates.responseType] || presentation.status;
        const [p] = await db
          .update(institutionPresentations)
          .set({ status: newStatus, updatedAt: new Date() })
          .where(eq(institutionPresentations.id, id))
          .returning();
        updatedPresentation = p;

        await db.insert(auditEvents).values({
          userId: user.id,
          firmId: user.firmId,
          clientId: presentation.clientId,
          eventType: "presentation_status_changed",
          eventData: {
            presentationId: id,
            institutionName: presentation.institutionName,
            responseType: updates.responseType,
            newStatus,
            previousStatus: presentation.status,
            edited: true,
          },
        });
      }
    }

    return NextResponse.json({
      response: updated,
      presentation: updatedPresentation,
    });
  } catch (err) {
    console.error("Presentation response edit error:", err);
    return NextResponse.json(
      { error: "edit_failed", message: err?.message },
      { status: 500 }
    );
  }
}
