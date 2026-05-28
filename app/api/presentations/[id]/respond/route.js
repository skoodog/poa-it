/**
 * POST /api/presentations/[id]/respond
 *
 * Records an institution's response to a presentation packet. Creates a
 * presentation_responses row and updates the parent presentation's status
 * to reflect the latest response.
 *
 * Response type → presentation status mapping:
 *   accepted                 → accepted
 *   rejected                 → rejected
 *   requested_certification  → pending_followup
 *   requested_opinion        → pending_followup
 *   requested_translation    → pending_followup
 *   pending                  → presented   (acknowledged receipt, awaiting decision)
 *
 * Emits a presentation_status_changed audit event.
 *
 * Sprint 4d Round 3.
 */

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "../../../../../lib/db";
import {
  institutionPresentations,
  presentationResponses,
  auditEvents,
  users,
} from "../../../../../lib/db/schema";
import { isValidPresentationResponseType } from "../../../../../lib/taxonomy/poaTaxonomy";

export const runtime = "nodejs";

// Response type → resulting presentation status
const RESPONSE_TO_STATUS = {
  accepted: "accepted",
  rejected: "rejected",
  requested_certification: "pending_followup",
  requested_opinion: "pending_followup",
  requested_translation: "pending_followup",
  pending: "presented",
};

export async function POST(request, { params }) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const {
      responseType,
      refusalReason,
      requestedItems,
      notes,
      respondedAt,
    } = body;

    if (!responseType || !isValidPresentationResponseType(responseType)) {
      return NextResponse.json(
        {
          error: "invalid_response_type",
          message: `responseType must be one of: accepted, rejected, requested_certification, requested_opinion, requested_translation, pending`,
        },
        { status: 400 }
      );
    }

    // Rejection requires a reason — enforce so the record is always useful
    if (responseType === "rejected" && !refusalReason?.trim()) {
      return NextResponse.json(
        {
          error: "refusal_reason_required",
          message: "A refusal reason is required when recording a rejection.",
        },
        { status: 400 }
      );
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkUserId))
      .limit(1);
    if (!user) {
      return NextResponse.json({ error: "user_not_found" }, { status: 404 });
    }

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

    // A draft presentation can't receive a response — it hasn't been generated
    if (presentation.status === "draft") {
      return NextResponse.json(
        {
          error: "presentation_not_generated",
          message: "Generate the packet before recording an institution response.",
        },
        { status: 400 }
      );
    }

    const now = respondedAt ? new Date(respondedAt) : new Date();

    // Create the response row
    const [created] = await db
      .insert(presentationResponses)
      .values({
        presentationId: id,
        respondedAt: now,
        responseType,
        refusalReason: refusalReason?.trim() || null,
        requestedItems: Array.isArray(requestedItems) ? requestedItems : [],
        notes: notes?.trim() || null,
      })
      .returning();

    // Update the parent presentation's status + response timestamp
    const newStatus = RESPONSE_TO_STATUS[responseType] || presentation.status;
    const [updatedPresentation] = await db
      .update(institutionPresentations)
      .set({
        status: newStatus,
        responseReceivedAt: now,
        updatedAt: new Date(),
      })
      .where(eq(institutionPresentations.id, id))
      .returning();

    // Audit event
    await db.insert(auditEvents).values({
      userId: user.id,
      firmId: user.firmId,
      clientId: presentation.clientId,
      eventType: "presentation_status_changed",
      eventData: {
        presentationId: id,
        institutionName: presentation.institutionName,
        responseType,
        newStatus,
        previousStatus: presentation.status,
      },
    });

    return NextResponse.json({
      response: created,
      presentation: updatedPresentation,
    });
  } catch (err) {
    console.error("Presentation respond error:", err);
    return NextResponse.json(
      { error: "respond_failed", message: err?.message },
      { status: 500 }
    );
  }
}
