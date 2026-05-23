/**
 * POST /api/revocations/create
 *
 * Creates a new draft revocation tied to a client + original POA.
 * Snapshots key fields from the original POA at creation time so the
 * revocation has a stable record of what's being revoked.
 *
 * Auth: requires authenticated user via Clerk.
 *
 * Request body (JSON):
 *   { clientId: string, originalPoaId: string }
 *
 * Response:
 *   200 OK { revocation: {...} }
 *   400 Bad Request — missing fields
 *   401 Unauthorized — no Clerk session
 *   404 Not Found — client or POA missing or not owned by user
 *
 * Sprint 4c — Round 2.
 */

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
import { db } from "../../../../lib/db";
import {
  revocations,
  documents,
  clients,
  users,
  wizardSessions,
} from "../../../../lib/db/schema";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json(
        { error: "unauthenticated" },
        { status: 401 }
      );
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

    // Resolve user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, clerkUserId))
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
      .where(and(eq(documents.id, originalPoaId), eq(documents.clientId, clientId)))
      .limit(1);
    if (!poa) {
      return NextResponse.json({ error: "original_poa_not_found" }, { status: 404 });
    }

    // Snapshot the principal name + powers from the linked wizard session
    let principalNameSnapshot = client.fullLegalName || "Unknown Principal";
    let originalPoaPowersGranted = [];
    if (poa.wizardSessionId) {
      const [session] = await db
        .select()
        .from(wizardSessions)
        .where(eq(wizardSessions.id, poa.wizardSessionId))
        .limit(1);
      if (session?.answers) {
        principalNameSnapshot =
          session.answers.principalFullLegalName || principalNameSnapshot;
        originalPoaPowersGranted = session.answers.powersGranted || [];
      }
    }

    // Create the revocation
    const [created] = await db
      .insert(revocations)
      .values({
        clientId,
        userId: user.id,
        firmId: user.firmId,
        originalPoaId,
        scope: "specific_poa", // default; user picks in Step 2
        principalNameSnapshot,
        originalPoaDateSnapshot: poa.createdAt,
        originalPoaDocumentIdSnapshot: poa.id,
        status: "draft",
        wizardState: {
          originalPoaPowersGranted,
        },
      })
      .returning();

    return NextResponse.json({ revocation: created }, { status: 200 });
  } catch (err) {
    console.error("Revocation create error:", err);
    return NextResponse.json(
      { error: "create_failed", message: err?.message },
      { status: 500 }
    );
  }
}
