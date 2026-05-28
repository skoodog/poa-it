/**
 * POST /api/wizard/start-for-client
 *
 * Fill-for-client intake (Sprint 5 Round 1). Creates a client-bound wizard
 * session — one that carries clientId/userId/firmId from the start, rather
 * than the anonymous localStorage flow consumers use. Returns the session id;
 * the caller redirects the pro into /wizard?session=<id>, where the wizard
 * runs in server-bound mode and ultimately produces a draft document tied to
 * this client.
 *
 * Auth required (this is a pro action). Per L001, uses await auth().
 *
 * Sprint 5 Round 1.
 */

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "../../../../lib/db";
import { wizardSessions, clients, users } from "../../../../lib/db/schema";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { clientId } = body;
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

    // Verify the client belongs to this user's firm
    const [client] = await db
      .select()
      .from(clients)
      .where(eq(clients.id, clientId))
      .limit(1);
    if (!client || (client.firmId && client.firmId !== user.firmId)) {
      return NextResponse.json({ error: "client_not_found" }, { status: 404 });
    }

    // Seed an initial wizard state. We pre-fill the principal's name from the
    // client record (the pro is filling this out on the client's behalf, and
    // the client IS the principal). Everything else starts blank. The state
    // shape mirrors lib/wizard/state.js createInitialState().
    const now = new Date().toISOString();
    const initialState = {
      sessionId: null, // set to the DB id below once we have it
      mode: "pro", // fill-for-client mode — drives terminal behavior in the wizard
      userId: user.id,
      clientId,
      documentType: "tx_durable_financial_poa",
      currentStep: "eligibility_gate",
      completedSteps: [],
      createdAt: now,
      lastUpdatedAt: now,

      // Eligibility gate
      isTexasResident: null,
      isAdult: null,
      forSelf: null,
      underGuardianship: null,

      // Step 1
      documentTypeAcknowledged: false,

      // Step 2 — Principal (pre-seeded from the client record)
      principalFullLegalName: client.name || "",
      principalDob: "",
      principalAddress: "",
      principalCity: "",
      principalZip: "",
      principalCounty: "",
      principalPhone: client.phone || "",
      principalEmail: client.email || "",

      // Step 3 — Agent
      agentFullLegalName: "",
      successorAgentFullLegalName: "",

      // Powers / hot powers / dates / execution
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
      })
      .returning();

    // Write the real session id back into the state blob so the client knows
    // its own id (used for syncing by sessionId).
    const stateWithId = { ...initialState, sessionId: created.id };
    await db
      .update(wizardSessions)
      .set({ state: stateWithId })
      .where(eq(wizardSessions.id, created.id));

    return NextResponse.json({ sessionId: created.id });
  } catch (err) {
    console.error("[/api/wizard/start-for-client] error:", err);
    return NextResponse.json(
      { error: "start_failed", message: err?.message },
      { status: 500 }
    );
  }
}
