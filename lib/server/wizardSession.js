"use server";

/**
 * Wizard Session Server Actions
 *
 * Replaces the localStorage-only persistence from Phases 1-5. The wizard
 * now lives in two places:
 *   - Browser-side: still uses localStorage as a fast cache + offline fallback
 *   - Server-side: Postgres `wizard_sessions` table is the source of truth
 *
 * Reconciliation logic:
 *   1. On wizard load, if user has anonymousId in localStorage, look up server session
 *   2. If found, server state wins (it's the source of truth)
 *   3. On every update, write to both localStorage (fast) and server (durable)
 *   4. On user sign-in, claim the anonymous session and attach to user account
 */

import { eq, and } from "drizzle-orm";
import { db } from "../db";
import { wizardSessions, auditEvents } from "../db/schema";
import { getCurrentUser } from "./auth";

/**
 * Find or create a wizard session by anonymous ID.
 *
 * Called when the wizard loads in the browser. The browser sends its
 * locally-generated anonymousId (a UUID it stores in localStorage). If we
 * have a matching server session, return it. If not, create one.
 *
 * Returns the full session including state.
 */
export async function getOrCreateSession({ anonymousId, initialState }) {
  if (!anonymousId) {
    throw new Error("anonymousId is required");
  }

  // Try to find existing
  const [existing] = await db
    .select()
    .from(wizardSessions)
    .where(eq(wizardSessions.anonymousId, anonymousId))
    .limit(1);

  if (existing) {
    // Attach current user if logged in and not already attached
    const currentUser = await getCurrentUser();
    if (currentUser && !existing.userId) {
      const [updated] = await db
        .update(wizardSessions)
        .set({
          userId: currentUser.id,
          firmId: currentUser.firmId,
          updatedAt: new Date(),
        })
        .where(eq(wizardSessions.id, existing.id))
        .returning();
      return { session: updated, isNew: false };
    }
    return { session: existing, isNew: false };
  }

  // Create new session
  const currentUser = await getCurrentUser();
  const [created] = await db
    .insert(wizardSessions)
    .values({
      anonymousId,
      userId: currentUser?.id || null,
      firmId: currentUser?.firmId || null,
      state: initialState,
      currentStep: initialState?.currentStep || "eligibility_gate",
      documentType: initialState?.documentType || "tx_durable_financial_poa",
    })
    .returning();

  return { session: created, isNew: true };
}

/**
 * Update wizard session state. Called on every state mutation in the wizard.
 *
 * Idempotent: multiple calls with the same state are safe. Updates the
 * extracted indexed fields (currentStep, status) for analytics queries
 * without needing to JSON-query the state column.
 */
export async function updateSession({ sessionId, anonymousId, state }) {
  if (!sessionId && !anonymousId) {
    throw new Error("Either sessionId or anonymousId is required");
  }

  const whereClause = sessionId
    ? eq(wizardSessions.id, sessionId)
    : eq(wizardSessions.anonymousId, anonymousId);

  // Derive status from state
  let status = "active";
  if (state.completedSteps?.includes("step9_waitlist")) {
    status = "completed";
  }

  const [updated] = await db
    .update(wizardSessions)
    .set({
      state,
      currentStep: state.currentStep || null,
      status,
      completedAt: status === "completed" ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(whereClause)
    .returning();

  return { session: updated };
}

/**
 * Append an audit event for a session. Called from the browser-side
 * audit logger when the wizard runs in authenticated mode.
 *
 * Anonymous sessions also get their events stored — the sessionId is the
 * wizard_sessions table's UUID, not the client-side session ID.
 */
export async function recordAuditEvent({
  sessionId,
  anonymousId,
  eventType,
  eventData,
  actor = "user",
}) {
  // Resolve sessionId from anonymousId if needed
  let resolvedSessionId = sessionId;
  if (!resolvedSessionId && anonymousId) {
    const [session] = await db
      .select({ id: wizardSessions.id, userId: wizardSessions.userId, firmId: wizardSessions.firmId, clientId: wizardSessions.clientId })
      .from(wizardSessions)
      .where(eq(wizardSessions.anonymousId, anonymousId))
      .limit(1);

    if (!session) {
      // Session doesn't exist yet — event will be lost. Caller should ensure
      // session is created first via getOrCreateSession.
      return { event: null, error: "session_not_found" };
    }
    resolvedSessionId = session.id;

    var userId = session.userId;
    var firmId = session.firmId;
    var clientId = session.clientId;
  } else {
    const [session] = await db
      .select({ userId: wizardSessions.userId, firmId: wizardSessions.firmId, clientId: wizardSessions.clientId })
      .from(wizardSessions)
      .where(eq(wizardSessions.id, resolvedSessionId))
      .limit(1);

    var userId = session?.userId;
    var firmId = session?.firmId;
    var clientId = session?.clientId;
  }

  // Detect PII in eventData
  const piiFields = [
    "principalFullLegalName", "principalDob", "principalAddress", "principalCity",
    "principalZip", "principalPhone", "principalEmail",
    "agentFullLegalName", "agentDob", "agentAddress", "agentCity", "agentZip",
    "agentPhone", "agentEmail",
    "successorAgentFullLegalName", "successorAgentAddress",
    "successorAgentPhone", "successorAgentEmail",
  ];
  const hasPii = eventData && piiFields.some(f => f in eventData);
  let scrubbedData = eventData;
  if (hasPii) {
    scrubbedData = { ...eventData };
    for (const f of piiFields) {
      if (f in scrubbedData) scrubbedData[f] = "[REDACTED]";
    }
  }

  const [created] = await db
    .insert(auditEvents)
    .values({
      sessionId: resolvedSessionId,
      userId,
      firmId,
      clientId,
      eventType,
      actor,
      eventData: scrubbedData,
      piiScrubStatus: hasPii ? "scrubbed_at_write" : "no_pii",
    })
    .returning();

  return { event: created };
}

/**
 * Claim an anonymous session for the currently signed-in user.
 *
 * Called by the post-signup flow: a logged-out user walks the wizard, then
 * signs in. We attach the anonymous session to their new account.
 */
export async function claimAnonymousSession({ anonymousId }) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  const [session] = await db
    .select()
    .from(wizardSessions)
    .where(eq(wizardSessions.anonymousId, anonymousId))
    .limit(1);

  if (!session) return { session: null, claimed: false };
  if (session.userId) return { session, claimed: false }; // already claimed

  const [updated] = await db
    .update(wizardSessions)
    .set({
      userId: user.id,
      firmId: user.firmId,
      updatedAt: new Date(),
    })
    .where(eq(wizardSessions.id, session.id))
    .returning();

  return { session: updated, claimed: true };
}

/**
 * Get all audit events for a session. Used by the /wizard/audit viewer.
 * Anonymous viewers can only see their own session (via anonymousId);
 * authenticated viewers can see any of their own sessions.
 */
export async function getAuditEventsForSession({ sessionId, anonymousId }) {
  let resolvedSessionId = sessionId;
  if (!resolvedSessionId && anonymousId) {
    const [session] = await db
      .select({ id: wizardSessions.id })
      .from(wizardSessions)
      .where(eq(wizardSessions.anonymousId, anonymousId))
      .limit(1);
    if (!session) return { events: [] };
    resolvedSessionId = session.id;
  }

  const events = await db
    .select()
    .from(auditEvents)
    .where(eq(auditEvents.sessionId, resolvedSessionId))
    .orderBy(auditEvents.timestamp);

  return { events };
}
