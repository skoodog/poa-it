"use server";

/**
 * Documents Server Module
 *
 * Queries for the firm-wide Documents view. Sprint 5 Round 1.
 */

import { desc, eq, and } from "drizzle-orm";
import { db } from "../db";
import { documents, clients } from "../db/schema";
import { getCurrentUser } from "./auth";

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
