"use server";

/**
 * Client Server Module
 *
 * Centralizes all client-related database queries. Pages and API routes
 * both import from here, so a change to the query logic happens in exactly
 * one place. This is the right pattern even for "simple" lookups because
 * Sprint 3b's profile page and Sprint 5's intake flows will reuse them.
 *
 * Naming convention:
 *   getXxxForFirm()   — list queries scoped to the current firm
 *   getXxxById()      — single-record lookups (firm-scoped for auth)
 *   searchXxx()       — substring search with sane defaults
 *   createXxx()       — write with validation
 *   updateXxx()       — partial update with validation
 *   archiveXxx()      — soft delete (sets status, doesn't remove rows)
 *
 * All queries are firm-scoped — a user can only see/touch records belonging
 * to their own firm. This is enforced at the query level, not just in the
 * UI, so a malicious request can't escape its tenant boundary.
 */

import { and, desc, eq, ilike, or, ne } from "drizzle-orm";
import { db } from "../db";
import { clients, wizardSessions, documents, auditEvents } from "../db/schema";
import { getCurrentUser } from "./auth";

/**
 * Returns the firm ID for the current user, throwing if they're not a
 * professional or don't have a firm. Used as a guard at the top of every
 * server action so we can trust `firmId` in subsequent queries.
 */
async function requireProfessionalFirmId() {
  const user = await getCurrentUser();
  if (!user) throw new Error("unauthenticated");
  if (user.userType !== "professional") throw new Error("forbidden: not_professional");
  if (!user.firmId) throw new Error("forbidden: no_firm");
  return { userId: user.id, firmId: user.firmId };
}

/**
 * Returns clients for the current firm, filtered/searched/sorted.
 *
 * @param {Object} options
 * @param {string} [options.search] - substring matched against name + email
 * @param {string} [options.status] - exact status filter, or "all" / undefined
 * @param {boolean} [options.includeArchived=false] - include archived clients
 * @param {number} [options.limit=100]
 */
export async function getClientsForFirm(options = {}) {
  const { firmId } = await requireProfessionalFirmId();
  const {
    search,
    status,
    includeArchived = false,
    limit = 100,
  } = options;

  const conditions = [eq(clients.firmId, firmId)];

  if (!includeArchived && status !== "archived") {
    conditions.push(ne(clients.status, "archived"));
  }

  if (status && status !== "all") {
    conditions.push(eq(clients.status, status));
  }

  if (search && search.trim()) {
    const pattern = `%${search.trim()}%`;
    conditions.push(
      or(
        ilike(clients.name, pattern),
        ilike(clients.email, pattern)
      )
    );
  }

  const rows = await db
    .select()
    .from(clients)
    .where(and(...conditions))
    .orderBy(desc(clients.updatedAt))
    .limit(limit);

  return rows;
}

/**
 * Returns a single client by ID, scoped to the current firm. Returns null
 * if not found OR if the client belongs to a different firm.
 */
export async function getClientById(clientId) {
  const { firmId } = await requireProfessionalFirmId();

  const [client] = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, clientId), eq(clients.firmId, firmId)))
    .limit(1);

  return client || null;
}

/**
 * Returns the N most-recently-updated clients for the current firm. Used by
 * the dashboard "Recent activity" widget.
 */
export async function getRecentClientsForFirm(limit = 5) {
  return getClientsForFirm({ limit, includeArchived: false });
}

/**
 * Creates a new client. Only `name` is required. Other fields are optional;
 * we accept whatever the caller provides and ignore unknown fields.
 *
 * Throws on validation failure. Caller (API route) catches and translates
 * to a 400.
 */
export async function createClient(input) {
  const { userId, firmId } = await requireProfessionalFirmId();

  const name = (input.name || "").trim();
  if (!name) throw new Error("validation: name_required");
  if (name.length > 200) throw new Error("validation: name_too_long");

  const email = input.email ? input.email.trim().toLowerCase() : null;
  const phone = input.phone ? input.phone.trim() : null;
  const relationship = input.relationship ? input.relationship.trim() : null;
  const notes = input.notes ? input.notes.trim() : null;

  const [created] = await db
    .insert(clients)
    .values({
      firmId,
      name,
      email,
      phone,
      relationship,
      notes,
      status: "intake",
    })
    .returning();

  // Audit event: client created. Fields with PII (email/phone) are flagged
  // present-or-absent rather than stored verbatim — the timeline shows
  // "Client created with email and phone" without leaking the values.
  await db.insert(auditEvents).values({
    clientId: created.id,
    userId,
    firmId,
    eventType: "client_created",
    actor: "professional",
    eventData: {
      had_email: !!email,
      had_phone: !!phone,
      had_relationship: !!relationship,
      had_notes: !!notes,
    },
    piiScrubStatus: "no_pii",
  });

  return created;
}

/**
 * Updates an existing client. Only fields explicitly provided in `input`
 * are modified; absent fields are left alone (partial update). Validates
 * the client belongs to the current firm before allowing the write.
 */
export async function updateClient(clientId, input) {
  const { userId, firmId } = await requireProfessionalFirmId();

  // Confirm ownership
  const existing = await getClientById(clientId);
  if (!existing) throw new Error("not_found");

  const updates = { updatedAt: new Date() };
  const changedFields = [];

  if ("name" in input) {
    const name = (input.name || "").trim();
    if (!name) throw new Error("validation: name_required");
    if (name.length > 200) throw new Error("validation: name_too_long");
    if (name !== existing.name) {
      updates.name = name;
      changedFields.push("name");
    }
  }
  if ("email" in input) {
    const newEmail = input.email ? input.email.trim().toLowerCase() : null;
    if (newEmail !== existing.email) {
      updates.email = newEmail;
      changedFields.push("email");
    }
  }
  if ("phone" in input) {
    const newPhone = input.phone ? input.phone.trim() : null;
    if (newPhone !== existing.phone) {
      updates.phone = newPhone;
      changedFields.push("phone");
    }
  }
  if ("relationship" in input) {
    const newRel = input.relationship ? input.relationship.trim() : null;
    if (newRel !== existing.relationship) {
      updates.relationship = newRel;
      changedFields.push("relationship");
    }
  }
  if ("notes" in input) {
    const newNotes = input.notes ? input.notes.trim() : null;
    if (newNotes !== existing.notes) {
      updates.notes = newNotes;
      changedFields.push("notes");
    }
  }
  if ("status" in input) {
    const validStatuses = [
      "intake",
      "in_progress",
      "ready_for_review",
      "signed",
      "notarized",
      "revoked",
      "archived",
    ];
    if (!validStatuses.includes(input.status)) {
      throw new Error("validation: invalid_status");
    }
    if (input.status !== existing.status) {
      updates.status = input.status;
      changedFields.push("status");
    }
  }

  // If nothing actually changed, skip the write
  if (changedFields.length === 0) {
    return existing;
  }

  const [updated] = await db
    .update(clients)
    .set(updates)
    .where(and(eq(clients.id, clientId), eq(clients.firmId, firmId)))
    .returning();

  // Audit event: client updated. Status changes get their own event type
  // because they're semantically significant for the timeline UI.
  const eventType = changedFields.includes("status")
    ? changedFields.length === 1
      ? "client_status_changed"
      : "client_updated_with_status"
    : "client_updated";

  await db.insert(auditEvents).values({
    clientId: updated.id,
    userId,
    firmId,
    eventType,
    actor: "professional",
    eventData: {
      changed_fields: changedFields,
      ...(changedFields.includes("status")
        ? { from_status: existing.status, to_status: updated.status }
        : {}),
    },
    piiScrubStatus: "no_pii",
  });

  return updated;
}

/**
 * Soft-delete: set the client's status to "archived". Documents and audit
 * events remain intact. The client disappears from default list views but
 * can be recovered via restoreClient().
 *
 * Emits a `client_archived` audit event for semantic clarity in the timeline
 * (rather than the generic `client_status_changed` that updateClient emits).
 */
export async function archiveClient(clientId) {
  const { userId, firmId } = await requireProfessionalFirmId();

  const existing = await getClientById(clientId);
  if (!existing) throw new Error("not_found");
  if (existing.status === "archived") return existing;

  const [updated] = await db
    .update(clients)
    .set({ status: "archived", updatedAt: new Date() })
    .where(and(eq(clients.id, clientId), eq(clients.firmId, firmId)))
    .returning();

  await db.insert(auditEvents).values({
    clientId: updated.id,
    userId,
    firmId,
    eventType: "client_archived",
    actor: "professional",
    eventData: { from_status: existing.status },
    piiScrubStatus: "no_pii",
  });

  return updated;
}

/**
 * Restore an archived client back to "intake" status. We don't track the
 * prior status, so we default to "intake" — the user can change it via the
 * profile page once restored.
 *
 * Emits a `client_restored` audit event for semantic clarity.
 */
export async function restoreClient(clientId) {
  const { userId, firmId } = await requireProfessionalFirmId();

  const existing = await getClientById(clientId);
  if (!existing) throw new Error("not_found");
  if (existing.status !== "archived") return existing;

  const [updated] = await db
    .update(clients)
    .set({ status: "intake", updatedAt: new Date() })
    .where(and(eq(clients.id, clientId), eq(clients.firmId, firmId)))
    .returning();

  await db.insert(auditEvents).values({
    clientId: updated.id,
    userId,
    firmId,
    eventType: "client_restored",
    actor: "professional",
    eventData: { to_status: "intake" },
    piiScrubStatus: "no_pii",
  });

  return updated;
}

/**
 * Checks whether any other client in the same firm shares this email.
 * Returns the count. Used to drive the "another client uses this email"
 * warning on the add-client modal.
 *
 * Excludes archived clients (those don't count as live duplicates).
 */
export async function countDuplicatesByEmail(email, { excludeClientId } = {}) {
  const { firmId } = await requireProfessionalFirmId();
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return 0;

  const conditions = [
    eq(clients.firmId, firmId),
    eq(clients.email, normalizedEmail),
    ne(clients.status, "archived"),
  ];
  if (excludeClientId) {
    conditions.push(ne(clients.id, excludeClientId));
  }

  const rows = await db
    .select({ id: clients.id })
    .from(clients)
    .where(and(...conditions));

  return rows.length;
}

/**
 * Fetches a client along with their associated documents, wizard sessions,
 * and audit events. Used by the profile page to render everything in a
 * single round trip.
 *
 * Returns null if the client doesn't exist or doesn't belong to this firm.
 *
 * Limits: documents and audit events are capped at sensible numbers for
 * the soft-launch scale. Profile pages will paginate later if needed.
 */
export async function getClientWithRelations(clientId) {
  const { firmId } = await requireProfessionalFirmId();

  const [client] = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, clientId), eq(clients.firmId, firmId)))
    .limit(1);

  if (!client) return null;

  // Fetch related documents, sessions, and audit events in parallel
  const [docs, sessions, events] = await Promise.all([
    db
      .select()
      .from(documents)
      .where(eq(documents.clientId, clientId))
      .orderBy(desc(documents.updatedAt))
      .limit(50),
    db
      .select()
      .from(wizardSessions)
      .where(eq(wizardSessions.clientId, clientId))
      .orderBy(desc(wizardSessions.updatedAt))
      .limit(20),
    db
      .select()
      .from(auditEvents)
      .where(eq(auditEvents.clientId, clientId))
      .orderBy(desc(auditEvents.timestamp))
      .limit(100),
  ]);

  return {
    ...client,
    documents: docs,
    wizardSessions: sessions,
    auditEvents: events,
  };
}
