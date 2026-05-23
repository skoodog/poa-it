/**
 * PATCH /api/revocations/[id]/update
 *
 * Updates a draft revocation. The wizard calls this on each meaningful state
 * change (step transition, recipient add/edit, etc.).
 *
 * Allowed updates (non-exhaustive):
 *   scope, revokedAgentName, executionMethod,
 *   principalNameSnapshot, wizardState (the JSON state blob)
 *
 * Locked once status != "draft" — only "wizardState" can be modified after
 * execution (e.g., for notice tracking).
 *
 * Sprint 4c — Round 2.
 */

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "../../../../../lib/db";
import { revocations, users } from "../../../../../lib/db/schema";

export const runtime = "nodejs";

// Whitelist of fields the wizard can update on a draft revocation.
const DRAFT_UPDATABLE_FIELDS = new Set([
  "scope",
  "revokedAgentName",
  "executionMethod",
  "principalNameSnapshot",
  "originalPoaDateSnapshot",
  "originalPoaDocumentIdSnapshot",
  "wizardState",
]);

// Once executed, only wizardState (which can hold notice/recording metadata)
// can be modified through this endpoint.
const POST_EXECUTION_UPDATABLE_FIELDS = new Set(["wizardState"]);

export async function PATCH(request, { params }) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    // Resolve user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, clerkUserId))
      .limit(1);
    if (!user) {
      return NextResponse.json({ error: "user_not_found" }, { status: 404 });
    }

    // Load revocation
    const [row] = await db
      .select()
      .from(revocations)
      .where(eq(revocations.id, id))
      .limit(1);
    if (!row || row.userId !== user.id) {
      return NextResponse.json({ error: "revocation_not_found" }, { status: 404 });
    }

    // Determine field whitelist based on status
    const allowed =
      row.status === "draft"
        ? DRAFT_UPDATABLE_FIELDS
        : POST_EXECUTION_UPDATABLE_FIELDS;

    // Build the update set from whitelisted fields only
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
      .update(revocations)
      .set(updates)
      .where(eq(revocations.id, id))
      .returning();

    return NextResponse.json({ revocation: updated });
  } catch (err) {
    console.error("Revocation update error:", err);
    return NextResponse.json(
      { error: "update_failed", message: err?.message },
      { status: 500 }
    );
  }
}
