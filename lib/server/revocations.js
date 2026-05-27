"use server";

/**
 * Revocations Server Module
 *
 * Centralizes all revocation-related database queries used by pages and
 * API routes. Mirrors the pattern from lib/server/clients.js.
 *
 * Sprint 4c — Round 2 (initial) + Round 3 (list + counts helpers).
 */

import { and, desc, eq } from "drizzle-orm";
import { db } from "../db";
import {
  revocations,
  revocationNotices,
  revocationRecordings,
  documents,
  clients,
  wizardSessions,
} from "../db/schema";
import { getCurrentUser } from "./auth";

/**
 * Get all revocations for a client, with simple aggregate counts attached.
 * Used by the Revocations section on the client profile.
 *
 * Returns an array of revocation rows enriched with:
 *   - noticesTotal, noticesSent, noticesAcknowledged
 *   - recordingsTotal, recordingsCompleted
 */
export async function getRevocationsForClient(clientId) {
  const user = await getCurrentUser();
  if (!user) return [];

  const rows = await db
    .select()
    .from(revocations)
    .where(eq(revocations.clientId, clientId))
    .orderBy(desc(revocations.createdAt));

  // Filter to user ownership (already enforced by firm scoping in most flows,
  // but explicit here for defense-in-depth)
  const owned = rows.filter((r) => r.userId === user.id);

  if (owned.length === 0) return [];

  // Hydrate counts for each revocation
  const enriched = await Promise.all(
    owned.map(async (r) => {
      const noticeRows = await db
        .select()
        .from(revocationNotices)
        .where(eq(revocationNotices.revocationId, r.id));
      const recordingRows = await db
        .select()
        .from(revocationRecordings)
        .where(eq(revocationRecordings.revocationId, r.id));

      const noticesTotal = noticeRows.length;
      const noticesSent = noticeRows.filter(
        (n) => n.deliveryStatus !== "queued"
      ).length;
      const noticesAcknowledged = noticeRows.filter(
        (n) =>
          n.deliveryStatus === "acknowledged" ||
          n.deliveryStatus === "refused" ||
          n.deliveryStatus === "bounced"
      ).length;
      const recordingsTotal = recordingRows.length;
      const recordingsCompleted = recordingRows.filter(
        (rec) => !!rec.recordedAt
      ).length;

      return {
        ...r,
        noticesTotal,
        noticesSent,
        noticesAcknowledged,
        recordingsTotal,
        recordingsCompleted,
      };
    })
  );

  return enriched;
}

export async function getRevocationById(revocationId) {
  const user = await getCurrentUser();
  if (!user) return null;

  const [revocation] = await db
    .select()
    .from(revocations)
    .where(eq(revocations.id, revocationId))
    .limit(1);

  if (!revocation) return null;
  if (revocation.userId !== user.id) return null; // simple ownership check

  // Load related: original POA, notices, recordings, client
  const [originalPoa] = revocation.originalPoaId
    ? await db
        .select()
        .from(documents)
        .where(eq(documents.id, revocation.originalPoaId))
        .limit(1)
    : [null];

  const notices = await db
    .select()
    .from(revocationNotices)
    .where(eq(revocationNotices.revocationId, revocationId))
    .orderBy(desc(revocationNotices.createdAt));

  const recordings = await db
    .select()
    .from(revocationRecordings)
    .where(eq(revocationRecordings.revocationId, revocationId))
    .orderBy(desc(revocationRecordings.createdAt));

  let client = null;
  if (revocation.clientId) {
    const rows = await db
      .select()
      .from(clients)
      .where(eq(clients.id, revocation.clientId))
      .limit(1);
    client = rows[0] || null;
  }

  return {
    ...revocation,
    originalPoa,
    notices,
    recordings,
    client,
  };
}

/**
 * Get the list of documents on a client that are active enough to be
 * revoked. Used by Step 1 of the revocation wizard.
 */
export async function getActiveDocumentsForRevocation(clientId) {
  const user = await getCurrentUser();
  if (!user) return [];

  // Load documents for this client. Active = anything that's been signed,
  // notarized, delivered, or is at least at "generated" status.
  const docs = await db
    .select()
    .from(documents)
    .where(eq(documents.clientId, clientId))
    .orderBy(desc(documents.createdAt));

  return docs.filter(
    (d) =>
      d.status === "generated" ||
      d.status === "signed" ||
      d.status === "notarized" ||
      d.status === "delivered"
  );
}

/**
 * Get wizard session answers for a document (so we can snapshot principal
 * details when starting a revocation).
 */
export async function getWizardAnswersForDocument(documentId) {
  const user = await getCurrentUser();
  if (!user) return null;

  const [doc] = await db
    .select()
    .from(documents)
    .where(eq(documents.id, documentId))
    .limit(1);

  if (!doc || !doc.wizardSessionId) return null;

  const [session] = await db
    .select()
    .from(wizardSessions)
    .where(eq(wizardSessions.id, doc.wizardSessionId))
    .limit(1);

  return session?.answers || null;
}
