/**
 * POST /api/presentations/[id]/finalize
 *
 * Finalizes a draft presentation. Transitions status: draft → generated.
 * Emits an audit event.
 *
 * Does NOT yet persist the generated PDF to blob storage — that's Sprint 5
 * territory when we integrate Vercel Blob. For now, "generated" status
 * means the user has reviewed and indicated they want to use this packet;
 * the actual PDF is regenerated on demand via the preview endpoint.
 *
 * Sprint 4d Round 2.
 */

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "../../../../../lib/db";
import {
  institutionPresentations,
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
      return NextResponse.json({ error: "presentation_not_found" }, { status: 404 });
    }
    if (presentation.status !== "draft") {
      return NextResponse.json(
        {
          error: "already_finalized",
          message: "Presentation has already been finalized.",
        },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!presentation.institutionName?.trim() ||
        presentation.institutionName === "Draft Presentation (institution TBD)") {
      return NextResponse.json(
        {
          error: "missing_institution_name",
          message: "Institution name is required to finalize.",
        },
        { status: 400 }
      );
    }

    const now = new Date();

    const [updated] = await db
      .update(institutionPresentations)
      .set({
        status: "generated",
        updatedAt: now,
      })
      .where(eq(institutionPresentations.id, id))
      .returning();

    // Audit event
    await db.insert(auditEvents).values({
      userId: user.id,
      firmId: user.firmId,
      clientId: presentation.clientId,
      eventType: "presentation_generated",
      eventData: {
        presentationId: id,
        institutionName: presentation.institutionName,
        institutionProfileId: presentation.institutionProfileId,
        originalPoaId: presentation.originalPoaId,
        selectedPowersCount: (presentation.selectedPowers || []).length,
      },
    });

    return NextResponse.json({ presentation: updated });
  } catch (err) {
    console.error("Presentation finalize error:", err);
    return NextResponse.json(
      { error: "finalize_failed", message: err?.message },
      { status: 500 }
    );
  }
}
