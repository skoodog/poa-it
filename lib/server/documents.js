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
 * Sprint 6 — attorney-review correction. Two attention-required behaviors
 * are enforced here, in one place, so every entry path (pro fill-for-client
 * AND unauthenticated client intake) goes through identical rules:
 *
 *   1. CLIENT-SUBMITTED INTAKE: when actor="client" (the unauthenticated
 *      send-link finalize path), the resulting draft is marked
 *      attentionRequired=true with reason "client_submitted_intake". This
 *      encodes our hard product rule — client-submitted intake creates a
 *      draft only; an attorney must review before lock/execute/present.
 *      The rule used to live only in the absence of code that bypassed it;
 *      now it lives in the data.
 *
 *   2. POSSIBLE REPLACEMENT DETECTION: if this client already has another
 *      POA of the same documentType in an active legal state (locked or
 *      executed), the OLDER document is moved to status
 *      "potential_replacement_review_required". The older document is NOT
 *      auto-revoked or auto-superseded — under Texas law, executing a new
 *      durable POA does not by itself revoke a prior durable POA unless
 *      the new instrument expressly says so. The platform's job is to
 *      surface the situation; the legal call belongs to the attorney.
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

  // Determine attention-required state for the new draft. Client-submitted
  // intake always requires attorney review before progressing past draft.
  const isClientSubmittedIntake = actor === "client";
  const newDocAttention = isClientSubmittedIntake
    ? {
        attentionRequired: true,
        attentionReason: "client_submitted_intake",
      }
    : { attentionRequired: false, attentionReason: null };

  const documentType = session.documentType || "tx_durable_financial_poa";

  const [created] = await db
    .insert(documents)
    .values({
      wizardSessionId: session.id,
      userId: session.userId,
      clientId: session.clientId,
      firmId: session.firmId,
      documentType,
      status: "draft",
      isWatermarked: true,
      templateVersion: TEMPLATE_VERSION,
      taxonomyVersion: TAXONOMY_VERSION,
      renderEngineVersion: RENDER_ENGINE_VERSION,
      ...newDocAttention,
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
      origin: isClientSubmittedIntake ? "send_link_intake" : "fill_for_client",
      attentionRequired: created.attentionRequired,
      attentionReason: created.attentionReason,
      templateVersion: TEMPLATE_VERSION,
      taxonomyVersion: TAXONOMY_VERSION,
    },
  });

  // Possible-replacement detection. Find any OTHER document for this client,
  // same documentType, currently in an active legal state (locked or
  // executed). If one (or more) exists, flag each for attorney review —
  // without changing its legal status. The new draft itself is unaffected by
  // this detection; the flag attaches to the older document(s).
  try {
    const existingActive = await db
      .select({
        id: documents.id,
        status: documents.status,
        userId: documents.userId,
        firmId: documents.firmId,
      })
      .from(documents)
      .where(
        and(
          eq(documents.clientId, session.clientId),
          eq(documents.documentType, documentType)
        )
      );

    for (const other of existingActive) {
      if (other.id === created.id) continue;
      const isLegallyOperative =
        other.status === "locked_for_signing" || other.status === "executed";
      if (!isLegallyOperative) continue;

      await db
        .update(documents)
        .set({
          status: "potential_replacement_review_required",
          attentionRequired: true,
          attentionReason: "newer_poa_exists",
          updatedAt: new Date(),
        })
        .where(eq(documents.id, other.id));

      await db.insert(auditEvents).values({
        sessionId: session.id,
        userId: session.userId,
        firmId: session.firmId,
        clientId: session.clientId,
        documentId: other.id, // event attaches to the OLDER document
        eventType: "document_attention_required",
        actor,
        eventData: {
          reason: "newer_poa_exists",
          newerDocumentId: created.id,
          previousStatus: other.status,
          legalNote:
            "Under Texas law, executing a later durable POA does not by " +
            "itself revoke a prior durable POA unless the new instrument " +
            "expressly says so. Attorney review required to determine the " +
            "legal status of this document.",
        },
      });
    }
  } catch (err) {
    // Detection is best-effort — never let it block document creation.
    // The audit event is the durable record; we surface this in logs.
    console.error("[createDraftDocumentForSession] replacement detection failed:", err);
  }

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
