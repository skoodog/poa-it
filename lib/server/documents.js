"use server";

/**
 * Documents Server Module
 *
 * Queries for the firm-wide Documents view. Sprint 5 Round 1.
 */

import { desc, eq, and } from "drizzle-orm";
import { db } from "../db";
import { documents, clients, wizardSessions, auditEvents } from "../db/schema";
import { getCurrentUser } from "./auth";
import { TAXONOMY_VERSION } from "../taxonomy/poaTaxonomy";
import {
  TEMPLATE_VERSION,
  RENDER_ENGINE_VERSION,
} from "../pdf/documentVersion";

/**
 * Create a draft document from a client-bound wizard session. Shared by the
 * authed fill-for-client path (/api/documents/create) and the token-authed
 * send-link path (/api/intake/[token]/finalize) so the two never drift.
 *
 * Idempotent: if a document already exists for this session, returns it.
 * Captures the version manifest and emits a document-scoped audit event.
 *
 * @param {object} session - the wizard session row (must have clientId)
 * @param {string} actor - "user" (pro) or "client" (intake), for the audit row
 */
export async function createDraftDocumentForSession(session, actor = "user") {
  if (!session?.clientId) {
    throw new Error("session is not client-bound");
  }

  const [existing] = await db
    .select()
    .from(documents)
    .where(eq(documents.wizardSessionId, session.id))
    .limit(1);
  if (existing) return { document: existing, alreadyExisted: true };

  const [created] = await db
    .insert(documents)
    .values({
      wizardSessionId: session.id,
      userId: session.userId,
      clientId: session.clientId,
      firmId: session.firmId,
      documentType: session.documentType || "tx_durable_financial_poa",
      status: "draft",
      isWatermarked: true,
      templateVersion: TEMPLATE_VERSION,
      taxonomyVersion: TAXONOMY_VERSION,
      renderEngineVersion: RENDER_ENGINE_VERSION,
    })
    .returning();

  await db.insert(auditEvents).values({
    sessionId: session.id,
    userId: session.userId,
    firmId: session.firmId,
    clientId: session.clientId,
    documentId: created.id,
    eventType: "document_created",
    actor,
    eventData: {
      documentType: created.documentType,
      status: "draft",
      origin: actor === "client" ? "send_link_intake" : "fill_for_client",
      templateVersion: TEMPLATE_VERSION,
      taxonomyVersion: TAXONOMY_VERSION,
    },
  });

  return { document: created, alreadyExisted: false };
}

/**
 * Returns the pending send-link intakes for a client — client-bound wizard
 * sessions that carry an intake token and haven't been consumed. Used by the
 * "Pending intake links" surface on the client profile so the pro can see
 * outstanding links and extend them. The raw token is never returned (we
 * don't store it); only lifecycle metadata.
 */
export async function getPendingIntakesForClient(clientId) {
  const user = await getCurrentUser();
  if (!user) return [];

  const rows = await db
    .select({
      id: wizardSessions.id,
      createdAt: wizardSessions.intakeTokenCreatedAt,
      expiresAt: wizardSessions.intakeTokenExpiresAt,
      consumedAt: wizardSessions.intakeTokenConsumedAt,
      currentStep: wizardSessions.currentStep,
      status: wizardSessions.status,
    })
    .from(wizardSessions)
    .where(
      and(
        eq(wizardSessions.clientId, clientId),
        eq(wizardSessions.userId, user.id)
      )
    )
    .orderBy(desc(wizardSessions.intakeTokenCreatedAt));

  // Only sessions that actually have a token, and aren't consumed.
  return rows
    .filter((r) => r.createdAt && !r.consumedAt)
    .map((r) => ({
      ...r,
      expired: r.expiresAt ? new Date(r.expiresAt).getTime() < Date.now() : false,
    }));
}

/**
 * Returns all documents owned by the current user (joined to their client),
 * most recent first. Used by the top-level /app/documents page.
 *
 * Each row is { ...document, clientName }.
 */
export async function getDocumentsForUser() {
  const user = await getCurrentUser();
  if (!user) return [];

  const rows = await db
    .select({
      id: documents.id,
      status: documents.status,
      documentType: documents.documentType,
      clientId: documents.clientId,
      createdAt: documents.createdAt,
      updatedAt: documents.updatedAt,
      lockedAt: documents.lockedAt,
      executedAt: documents.executedAt,
      clientName: clients.name,
    })
    .from(documents)
    .leftJoin(clients, eq(documents.clientId, clients.id))
    .where(eq(documents.userId, user.id))
    .orderBy(desc(documents.createdAt));

  return rows;
}
