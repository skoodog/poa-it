/**
 * POST /api/presentations/create
 *
 * Creates a draft institution presentation tied to a client + original POA.
 * Snapshots key fields from the original POA at creation time.
 *
 * Pattern matches /api/revocations/create from Sprint 4c.
 *
 * Sprint 4d Round 2.
 */

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
import { db } from "../../../../lib/db";
import {
  institutionPresentations,
  documents,
  clients,
  users,
} from "../../../../lib/db/schema";
import { snapshotPoaForPresentation } from "../../../../lib/server/presentations";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    // Per L001: use the established await auth() pattern from Sprint 4c API routes
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { clientId, originalPoaId } = body;

    if (!clientId || !originalPoaId) {
      return NextResponse.json(
        {
          error: "missing_fields",
          message: "clientId and originalPoaId are required",
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

    // Verify the client belongs to this user's firm
    const [client] = await db
      .select()
      .from(clients)
      .where(eq(clients.id, clientId))
      .limit(1);
    if (!client || (client.firmId && client.firmId !== user.firmId)) {
      return NextResponse.json({ error: "client_not_found" }, { status: 404 });
    }

    // Verify the original POA belongs to the same client
    const [poa] = await db
      .select()
      .from(documents)
      .where(
        and(
          eq(documents.id, originalPoaId),
          eq(documents.clientId, clientId)
        )
      )
      .limit(1);
    if (!poa) {
      return NextResponse.json({ error: "original_poa_not_found" }, { status: 404 });
    }

    // Snapshot POA + wizard data into the presentation
    const snapshot = await snapshotPoaForPresentation(originalPoaId);
    if (!snapshot) {
      return NextResponse.json({ error: "snapshot_failed" }, { status: 500 });
    }

    // Create the presentation. institutionName is required by the schema
    // but we don't know it yet at create time — placeholder filled in by
    // wizard Step 2. We seed with a non-empty default so the NOT NULL holds.
    const [created] = await db
      .insert(institutionPresentations)
      .values({
        clientId,
        userId: user.id,
        firmId: user.firmId,
        originalPoaId,
        institutionName: "Draft Presentation (institution TBD)",
        selectedPowers: [],
        customNotes: [],
        status: "draft",
        wizardState: {
          // Persist snapshot fields into wizardState too so the client
          // wizard can rehydrate them without an extra round trip.
          ...snapshot,
        },
      })
      .returning();

    return NextResponse.json({ presentation: created }, { status: 200 });
  } catch (err) {
    console.error("Presentation create error:", err);
    return NextResponse.json(
      { error: "create_failed", message: err?.message },
      { status: 500 }
    );
  }
}
