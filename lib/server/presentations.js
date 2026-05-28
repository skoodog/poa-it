"use server";

/**
 * Presentations Server Module
 *
 * Centralizes database queries for institution presentations. Pattern matches
 * lib/server/revocations.js.
 *
 * Sprint 4d Round 2.
 */

import { and, desc, eq, isNull, or } from "drizzle-orm";
import { db } from "../db";
import {
  institutionPresentations,
  institutionProfiles,
  presentationResponses,
  documents,
  clients,
  wizardSessions,
} from "../db/schema";
import { getCurrentUser } from "./auth";

/**
 * Get a single presentation by id, with all relations hydrated for the
 * detail view. Includes ownership check.
 */
export async function getPresentationById(presentationId) {
  const user = await getCurrentUser();
  if (!user) return null;

  const [presentation] = await db
    .select()
    .from(institutionPresentations)
    .where(eq(institutionPresentations.id, presentationId))
    .limit(1);

  if (!presentation) return null;
  if (presentation.userId !== user.id) return null;

  const [originalPoa] = presentation.originalPoaId
    ? await db
        .select()
        .from(documents)
        .where(eq(documents.id, presentation.originalPoaId))
        .limit(1)
    : [null];

  const responses = await db
    .select()
    .from(presentationResponses)
    .where(eq(presentationResponses.presentationId, presentationId))
    .orderBy(desc(presentationResponses.respondedAt));

  let client = null;
  if (presentation.clientId) {
    const rows = await db
      .select()
      .from(clients)
      .where(eq(clients.id, presentation.clientId))
      .limit(1);
    client = rows[0] || null;
  }

  let profile = null;
  if (presentation.institutionProfileId) {
    const rows = await db
      .select()
      .from(institutionProfiles)
      .where(eq(institutionProfiles.id, presentation.institutionProfileId))
      .limit(1);
    profile = rows[0] || null;
  }

  return {
    ...presentation,
    originalPoa,
    responses,
    client,
    profile,
  };
}

/**
 * Get the list of institution profiles available to the current user. System
 * defaults are always visible; firm-custom profiles are only visible to users
 * of that firm. Sorted by sortOrder ascending.
 */
export async function getInstitutionProfilesForUser() {
  const user = await getCurrentUser();
  if (!user) return [];

  // System defaults (firmId IS NULL) + this user's firm's custom profiles
  const rows = await db
    .select()
    .from(institutionProfiles)
    .where(
      user.firmId
        ? or(
            isNull(institutionProfiles.firmId),
            eq(institutionProfiles.firmId, user.firmId)
          )
        : isNull(institutionProfiles.firmId)
    )
    .orderBy(institutionProfiles.sortOrder);

  return rows;
}

/**
 * Get all presentations for a client, with response counts attached.
 * Used by the Presentations section on the client profile (Round 3).
 */
export async function getPresentationsForClient(clientId) {
  const user = await getCurrentUser();
  if (!user) return [];

  const rows = await db
    .select()
    .from(institutionPresentations)
    .where(eq(institutionPresentations.clientId, clientId))
    .orderBy(desc(institutionPresentations.createdAt));

  const owned = rows.filter((r) => r.userId === user.id);
  if (owned.length === 0) return [];

  // Hydrate response counts
  const enriched = await Promise.all(
    owned.map(async (p) => {
      const responseRows = await db
        .select()
        .from(presentationResponses)
        .where(eq(presentationResponses.presentationId, p.id));

      const responsesTotal = responseRows.length;
      const latestResponse = responseRows.length > 0
        ? responseRows.reduce((latest, r) =>
            !latest || new Date(r.respondedAt) > new Date(latest.respondedAt) ? r : latest
          , null)
        : null;

      return {
        ...p,
        responsesTotal,
        latestResponse,
      };
    })
  );

  return enriched;
}

/**
 * Snapshot the principal/agent/POA metadata from the linked wizard session.
 * Used during presentation creation. Returns an object with fields ready to
 * populate the presentation's snapshot columns.
 */
export async function snapshotPoaForPresentation(documentId) {
  const [doc] = await db
    .select()
    .from(documents)
    .where(eq(documents.id, documentId))
    .limit(1);

  if (!doc) return null;

  let principalNameSnapshot = "";
  let agentNameSnapshot = "";
  let successorAgentNameSnapshot = "";
  let originalPoaPowersGranted = [];
  let originalPoaExecutionMethod = null;
  let poaIsSpringingType = false;

  if (doc.wizardSessionId) {
    const [session] = await db
      .select()
      .from(wizardSessions)
      .where(eq(wizardSessions.id, doc.wizardSessionId))
      .limit(1);

    // Sprint 5 fix: wizard answers live in session.state (the jsonb column),
    // NOT session.answers — and the springing flag is effectiveDateChoice,
    // not effectiveDateType. The Sprint 4d R2 version read the wrong field
    // names and silently snapshotted blanks; it never surfaced because no
    // documents existed to snapshot from until now.
    const s = session?.state || {};
    principalNameSnapshot = s.principalFullLegalName || "";
    agentNameSnapshot = s.agentFullLegalName || "";
    successorAgentNameSnapshot = s.successorAgentFullLegalName || "";
    originalPoaPowersGranted = s.powersGranted || [];
    originalPoaExecutionMethod = s.executionMethod || null;
    poaIsSpringingType = s.effectiveDateChoice === "springing";
  }

  return {
    originalPoaId: doc.id,
    originalPoaDateSnapshot: doc.createdAt,
    originalPoaDocumentIdSnapshot: doc.id,
    originalPoaStatus: doc.status,
    originalPoaExecutionMethod,
    originalPoaPowersGranted,
    principalNameSnapshot,
    agentNameSnapshot,
    successorAgentNameSnapshot,
    poaIsSpringingType,
  };
}
