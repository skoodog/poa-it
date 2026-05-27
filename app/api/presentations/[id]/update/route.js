/**
 * PATCH /api/presentations/[id]/update
 *
 * Autosave endpoint for the presentation wizard. Whitelisted fields only.
 * Locked once status != "draft" (except wizardState, which can still hold
 * tracking metadata after generation).
 *
 * Sprint 4d Round 2.
 */

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "../../../../../lib/db";
import { institutionPresentations, users } from "../../../../../lib/db/schema";

export const runtime = "nodejs";

const DRAFT_UPDATABLE_FIELDS = new Set([
  "institutionProfileId",
  "institutionName",
  "institutionAddress",
  "institutionCity",
  "institutionState",
  "institutionZip",
  "institutionContactName",
  "institutionContactEmail",
  "institutionContactPhone",
  "selectedPowers",
  "customNotes",
  "wizardState",
]);

const POST_GENERATION_UPDATABLE_FIELDS = new Set(["wizardState"]);

export async function PATCH(request, { params }) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkUserId))
      .limit(1);
    if (!user) {
      return NextResponse.json({ error: "user_not_found" }, { status: 404 });
    }

    const [row] = await db
      .select()
      .from(institutionPresentations)
      .where(eq(institutionPresentations.id, id))
      .limit(1);
    if (!row || row.userId !== user.id) {
      return NextResponse.json({ error: "presentation_not_found" }, { status: 404 });
    }

    const allowed =
      row.status === "draft"
        ? DRAFT_UPDATABLE_FIELDS
        : POST_GENERATION_UPDATABLE_FIELDS;

    const updates = {};
    for (const [key, value] of Object.entries(body)) {
      if (allowed.has(key)) {
        updates[key] = value;
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "no_updatable_fields" },
        { status: 400 }
      );
    }

    updates.updatedAt = new Date();

    const [updated] = await db
      .update(institutionPresentations)
      .set(updates)
      .where(eq(institutionPresentations.id, id))
      .returning();

    return NextResponse.json({ presentation: updated });
  } catch (err) {
    console.error("Presentation update error:", err);
    return NextResponse.json(
      { error: "update_failed", message: err?.message },
      { status: 500 }
    );
  }
}
