/**
 * POST /api/wizard/create-intake-link
 *
 * Send-link intake (Sprint 5 R3). Creates a client-bound wizard session and
 * issues a secure, expiring token. Returns the raw link ONCE — we store only
 * the token's hash, so the link can never be re-displayed (shown-once, like a
 * personal access token).
 *
 * Auth required (pro action). Per L001, uses await auth().
 *
 * Body: { clientId, expiryDays? }
 * Returns: { url, expiresAt }
 */

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "../../../../lib/db";
import { wizardSessions, clients, users, auditEvents } from "../../../../lib/db/schema";
import {
  generateIntakeToken,
  computeExpiry,
} from "../../../../lib/server/intakeToken";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { clientId, expiryDays } = body;
    if (!clientId) {
      return NextResponse.json(
        { error: "missing_client_id", message: "clientId is required" },
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

    const [client] = await db
      .select()
      .from(clients)
      .where(eq(clients.id, clientId))
      .limit(1);
    if (!client || (client.firmId && client.firmId !== user.firmId)) {
      return NextResponse.json({ error: "client_not_found" }, { status: 404 });
    }

    const { token, tokenHash } = generateIntakeToken();
    const expiresAt = computeExpiry(expiryDays);
    const now = new Date();

    // Seed an intake-mode wizard state (mirrors start-for-client, but mode is
    // "intake" so the wizard's terminal step finalizes via the token endpoint
    // and shows a client-facing confirmation instead of the pro redirect).
    const nowIso = now.toISOString();
    const initialState = {
      sessionId: null,
      mode: "intake",
      userId: user.id,
      clientId,
      documentType: "tx_durable_financial_poa",
      currentStep: "eligibility_gate",
      completedSteps: [],
      createdAt: nowIso,
      lastUpdatedAt: nowIso,
      isTexasResident: null,
      isAdult: null,
      forSelf: null,
      underGuardianship: null,
      documentTypeAcknowledged: false,
      principalFullLegalName: client.name || "",
      principalDob: "",
      principalAddress: "",
      principalCity: "",
      principalZip: "",
      principalCounty: "",
      principalPhone: client.phone || "",
      principalEmail: client.email || "",
      agentFullLegalName: "",
      successorAgentFullLegalName: "",
      powersGranted: [],
      powersScope: null,
      hotPowersGranted: [],
      effectiveDateChoice: null,
      executionMethod: null,
      agentCompensation: null,
    };

    const [created] = await db
      .insert(wizardSessions)
      .values({
        userId: user.id,
        clientId,
        firmId: user.firmId,
        state: initialState,
        status: "active",
        currentStep: "eligibility_gate",
        documentType: "tx_durable_financial_poa",
        intakeTokenHash: tokenHash,
        intakeTokenCreatedAt: now,
        intakeTokenExpiresAt: expiresAt,
      })
      .returning();

    await db
      .update(wizardSessions)
      .set({ state: { ...initialState, sessionId: created.id } })
      .where(eq(wizardSessions.id, created.id));

    await db.insert(auditEvents).values({
      sessionId: created.id,
      userId: user.id,
      firmId: user.firmId,
      clientId,
      eventType: "intake_link_created",
      eventData: { expiresAt: expiresAt.toISOString() },
    });

    // Build the absolute link from the request origin.
    const origin = new URL(request.url).origin;
    const url = `${origin}/intake/${token}`;

    return NextResponse.json({ url, expiresAt: expiresAt.toISOString() });
  } catch (err) {
    console.error("[/api/wizard/create-intake-link] error:", err);
    return NextResponse.json(
      { error: "create_failed", message: err?.message },
      { status: 500 }
    );
  }
}
