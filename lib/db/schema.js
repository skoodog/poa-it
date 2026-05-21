/**
 * POA-IT Database Schema
 *
 * Canonical model for all data. Sprint 1 establishes the foundation tables:
 * users, firms, clients, wizard_sessions, documents, audit_events, leads.
 *
 * Design principles:
 *   - Every table has UUID primary keys (resists enumeration attacks)
 *   - Every table has created_at + updated_at
 *   - Hard deletes are rare; status columns track lifecycle instead
 *   - Foreign keys are explicit with onDelete behavior chosen per relationship
 *   - JSON columns for flexible state (wizard answers, audit event data)
 *   - All PII columns are marked in comments for future TDPSA scrubbing
 */

import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  boolean,
  integer,
  index,
  pgEnum,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ===========================================================================
// ENUMS
// ===========================================================================

export const userTypeEnum = pgEnum("user_type", ["consumer", "professional"]);

export const firmTierEnum = pgEnum("firm_tier", [
  "solo",
  "family_office",
  "firm",
]);

export const clientStatusEnum = pgEnum("client_status", [
  "intake",
  "in_progress",
  "ready_for_review",
  "signed",
  "notarized",
  "revoked",
  "archived",
]);

export const documentStatusEnum = pgEnum("document_status", [
  "draft",
  "generated",
  "preview_shown",
  "purchased",
  "awaiting_signature",
  "signed",
  "awaiting_notarization",
  "notarized",
  "delivered",
  "revoked",
]);

export const wizardSessionStatusEnum = pgEnum("wizard_session_status", [
  "active",
  "abandoned",
  "completed",
  "purchased",
]);

export const leadStatusEnum = pgEnum("lead_status", [
  "new",
  "contacted",
  "qualified",
  "converted",
  "lost",
]);

// ===========================================================================
// USERS
// ===========================================================================
// Mirror of Clerk's user table. We store our own copy because Clerk's user
// IDs are the source of truth for auth, but we need foreign keys to user
// records for everything else, and we don't want every query hitting Clerk.
// ===========================================================================

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clerkId: text("clerk_id").notNull().unique(), // from Clerk
    email: text("email").notNull(), // PII
    firstName: text("first_name"), // PII
    lastName: text("last_name"), // PII
    userType: userTypeEnum("user_type").notNull().default("consumer"),
    firmId: uuid("firm_id").references(() => firms.id, { onDelete: "set null" }),
    onboardedAt: timestamp("onboarded_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    clerkIdIdx: index("users_clerk_id_idx").on(table.clerkId),
    emailIdx: index("users_email_idx").on(table.email),
    firmIdIdx: index("users_firm_id_idx").on(table.firmId),
  })
);

// ===========================================================================
// FIRMS
// ===========================================================================
// A "firm" represents the professional org: a solo practitioner's
// solo practice, a family office, or a law firm. Consumers don't have firms.
// One firm can have many users (multi-user firms in future), one billing
// relationship, many clients.
// ===========================================================================

export const firms = pgTable(
  "firms",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    tier: firmTierEnum("tier").notNull().default("solo"),
    logoUrl: text("logo_url"), // For white-label branding
    primaryContactEmail: text("primary_contact_email"), // PII
    primaryContactPhone: text("primary_contact_phone"), // PII
    address: text("address"), // PII
    // Sales metadata (filled in for Firm-tier leads converted from sales flow)
    expectedMonthlyVolume: integer("expected_monthly_volume"),
    notes: text("notes"),
    // Stripe relationship — null until Sprint 6
    stripeCustomerId: text("stripe_customer_id"),
    stripeSubscriptionId: text("stripe_subscription_id"),
    subscriptionStatus: text("subscription_status"), // active|trialing|past_due|canceled
    subscriptionCurrentPeriodEnd: timestamp("subscription_current_period_end"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    stripeCustomerIdx: index("firms_stripe_customer_idx").on(table.stripeCustomerId),
  })
);

// ===========================================================================
// CLIENTS
// ===========================================================================
// A "client" is the end-person whose POA is being created. For consumer
// flow, the user IS the client and we link client.userId. For professional
// flow, the client is created by a firm and has no userId.
//
// parent_client_id supports family-office hierarchies — a client can have a
// parent client (e.g., spouse, family head). Schema-only for soft launch;
// the UI doesn't expose this until family-office features are built.
// ===========================================================================

export const clients = pgTable(
  "clients",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    firmId: uuid("firm_id").references(() => firms.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }), // Consumers
    parentClientId: uuid("parent_client_id"), // Self-reference for family hierarchy
    name: text("name").notNull(), // PII
    email: text("email"), // PII
    phone: text("phone"), // PII
    relationship: text("relationship"), // for family-office: spouse|child|parent|trustee|etc
    notes: text("notes"),
    status: clientStatusEnum("status").notNull().default("intake"),
    // Magic link for send-to-client flow (Sprint 5b)
    magicLinkToken: text("magic_link_token"),
    magicLinkExpiresAt: timestamp("magic_link_expires_at"),
    magicLinkUsedAt: timestamp("magic_link_used_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    firmIdIdx: index("clients_firm_id_idx").on(table.firmId),
    userIdIdx: index("clients_user_id_idx").on(table.userId),
    parentClientIdIdx: index("clients_parent_client_id_idx").on(table.parentClientId),
    magicLinkIdx: index("clients_magic_link_idx").on(table.magicLinkToken),
  })
);

// ===========================================================================
// WIZARD SESSIONS
// ===========================================================================
// Replaces the localStorage-only wizard state. Every wizard run creates a
// session, which can be anonymous (no userId, no clientId — just a
// browser session) or claimed (associated with a user and/or client).
//
// The `state` JSONB column holds the entire wizard state object — the same
// shape as createInitialState() returns. This means we don't need columns
// for every field; we just persist the state object as-is. Indexes on
// specific extracted fields could come later.
// ===========================================================================

export const wizardSessions = pgTable(
  "wizard_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    // Browser session — generated client-side, lets us claim anonymous sessions
    anonymousId: text("anonymous_id").unique(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    clientId: uuid("client_id").references(() => clients.id, { onDelete: "set null" }),
    firmId: uuid("firm_id").references(() => firms.id, { onDelete: "set null" }),
    state: jsonb("state").notNull(), // The full wizard state object
    status: wizardSessionStatusEnum("status").notNull().default("active"),
    currentStep: text("current_step"), // For analytics — where users abandon
    documentType: text("document_type").default("tx_durable_financial_poa"),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    anonymousIdIdx: index("wizard_sessions_anonymous_id_idx").on(table.anonymousId),
    userIdIdx: index("wizard_sessions_user_id_idx").on(table.userId),
    clientIdIdx: index("wizard_sessions_client_id_idx").on(table.clientId),
    statusIdx: index("wizard_sessions_status_idx").on(table.status),
  })
);

// ===========================================================================
// DOCUMENTS
// ===========================================================================
// Generated PDFs. Each document is tied to a wizard session that produced
// it. A wizard session can produce multiple documents over its lifecycle
// (draft preview → clean → signed → notarized are stored as separate
// records so we have full version history).
// ===========================================================================

export const documents = pgTable(
  "documents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    wizardSessionId: uuid("wizard_session_id")
      .notNull()
      .references(() => wizardSessions.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    clientId: uuid("client_id").references(() => clients.id, { onDelete: "set null" }),
    firmId: uuid("firm_id").references(() => firms.id, { onDelete: "set null" }),
    documentType: text("document_type").notNull(),
    status: documentStatusEnum("status").notNull().default("draft"),
    // The PDF file in Vercel Blob storage
    storageUrl: text("storage_url"),
    storageKey: text("storage_key"),
    // For watermark/preview tracking
    isWatermarked: boolean("is_watermarked").default(true).notNull(),
    // Sprint 7 — notarization tracking (Proof session ID)
    notarizationSessionId: text("notarization_session_id"),
    notarizationProvider: text("notarization_provider"), // "proof" | "manual_in_person"
    notarizedAt: timestamp("notarized_at"),
    notarizedDocumentUrl: text("notarized_document_url"),
    // Delivery tracking
    deliveredAt: timestamp("delivered_at"),
    deliveryEmail: text("delivery_email"), // PII
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    sessionIdIdx: index("documents_session_id_idx").on(table.wizardSessionId),
    userIdIdx: index("documents_user_id_idx").on(table.userId),
    clientIdIdx: index("documents_client_id_idx").on(table.clientId),
    firmIdIdx: index("documents_firm_id_idx").on(table.firmId),
    statusIdx: index("documents_status_idx").on(table.status),
  })
);

// ===========================================================================
// AUDIT EVENTS
// ===========================================================================
// Server-side audit log. Replaces the localStorage-only audit logger. Every
// event from the existing audit logger gets persisted here. PII is scrubbed
// at write time (eventData uses the same scrubPii logic from lib/audit/logger.js).
//
// This is the evidentiary record — Phase 4's localStorage version was the
// proof of concept; this is the production version.
// ===========================================================================

export const auditEvents = pgTable(
  "audit_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionId: uuid("session_id").references(() => wizardSessions.id, {
      onDelete: "set null",
    }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    clientId: uuid("client_id").references(() => clients.id, { onDelete: "set null" }),
    firmId: uuid("firm_id").references(() => firms.id, { onDelete: "set null" }),
    eventType: text("event_type").notNull(),
    actor: text("actor").notNull().default("user"), // user|system|notary|support
    eventData: jsonb("event_data"),
    piiScrubStatus: text("pii_scrub_status").default("no_pii").notNull(),
    timestamp: timestamp("timestamp").defaultNow().notNull(),
  },
  (table) => ({
    sessionIdIdx: index("audit_events_session_id_idx").on(table.sessionId),
    userIdIdx: index("audit_events_user_id_idx").on(table.userId),
    clientIdIdx: index("audit_events_client_id_idx").on(table.clientId),
    eventTypeIdx: index("audit_events_event_type_idx").on(table.eventType),
    timestampIdx: index("audit_events_timestamp_idx").on(table.timestamp),
  })
);

// ===========================================================================
// LEADS
// ===========================================================================
// Sales pipeline for the Firm tier and other interest captures. When someone
// clicks "Reserve your spot" on the Firm tier, their info lands here. You
// follow up via email.
// ===========================================================================

export const leads = pgTable(
  "leads",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    firmName: text("firm_name").notNull(),
    contactName: text("contact_name").notNull(), // PII
    contactEmail: text("contact_email").notNull(), // PII
    contactPhone: text("contact_phone"), // PII
    firmSize: text("firm_size"), // "1" | "2-10" | "11-50" | "50+"
    expectedMonthlyVolume: text("expected_monthly_volume"), // free text
    tierInterest: firmTierEnum("tier_interest"),
    notes: text("notes"),
    source: text("source").default("pricing_page"),
    status: leadStatusEnum("status").notNull().default("new"),
    convertedFirmId: uuid("converted_firm_id").references(() => firms.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    statusIdx: index("leads_status_idx").on(table.status),
    emailIdx: index("leads_email_idx").on(table.contactEmail),
  })
);

// ===========================================================================
// RELATIONS
// ===========================================================================
// Drizzle relations for type-safe joins.
// ===========================================================================

export const usersRelations = relations(users, ({ one, many }) => ({
  firm: one(firms, {
    fields: [users.firmId],
    references: [firms.id],
  }),
  wizardSessions: many(wizardSessions),
  documents: many(documents),
  auditEvents: many(auditEvents),
}));

export const firmsRelations = relations(firms, ({ many }) => ({
  users: many(users),
  clients: many(clients),
  documents: many(documents),
  auditEvents: many(auditEvents),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  firm: one(firms, {
    fields: [clients.firmId],
    references: [firms.id],
  }),
  user: one(users, {
    fields: [clients.userId],
    references: [users.id],
  }),
  wizardSessions: many(wizardSessions),
  documents: many(documents),
}));

export const wizardSessionsRelations = relations(wizardSessions, ({ one, many }) => ({
  user: one(users, {
    fields: [wizardSessions.userId],
    references: [users.id],
  }),
  client: one(clients, {
    fields: [wizardSessions.clientId],
    references: [clients.id],
  }),
  firm: one(firms, {
    fields: [wizardSessions.firmId],
    references: [firms.id],
  }),
  documents: many(documents),
  auditEvents: many(auditEvents),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  wizardSession: one(wizardSessions, {
    fields: [documents.wizardSessionId],
    references: [wizardSessions.id],
  }),
  user: one(users, {
    fields: [documents.userId],
    references: [users.id],
  }),
  client: one(clients, {
    fields: [documents.clientId],
    references: [clients.id],
  }),
  firm: one(firms, {
    fields: [documents.firmId],
    references: [firms.id],
  }),
}));

export const auditEventsRelations = relations(auditEvents, ({ one }) => ({
  session: one(wizardSessions, {
    fields: [auditEvents.sessionId],
    references: [wizardSessions.id],
  }),
  user: one(users, {
    fields: [auditEvents.userId],
    references: [users.id],
  }),
  client: one(clients, {
    fields: [auditEvents.clientId],
    references: [clients.id],
  }),
  firm: one(firms, {
    fields: [auditEvents.firmId],
    references: [firms.id],
  }),
}));
