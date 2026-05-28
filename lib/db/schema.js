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
  // Sprint 4c: when a newer POA replaces this one without explicit
  // revocation — recipient documents informally treat the older one as
  // inactive but the user did not formally execute a revocation instrument.
  "superseded",
  // Sprint 5: the lawyer-blessed three-state lifecycle. New code uses these
  // active states (draft → locked_for_signing → executed → revoked/superseded);
  // the legacy values above remain present-but-unused to avoid risky enum
  // surgery (Postgres can't drop enum values without recreating the type).
  "locked_for_signing", // immutable signing copy frozen in Blob + hash
  "executed",           // signed/notarized legally-operative original
]);

export const wizardSessionStatusEnum = pgEnum("wizard_session_status", [
  "active",
  "abandoned",
  "completed",
  "purchased",
]);

// Sprint 4c: Revocation scope — what the revocation instrument covers
export const revocationScopeEnum = pgEnum("revocation_scope", [
  "specific_poa",      // revokes this single POA only
  "all_prior",         // revokes this POA plus any other prior financial durable POAs
  "agent_only",        // revokes a named agent's authority while leaving the POA active for other agents
]);

// Sprint 4c: Revocation lifecycle status
export const revocationStatusEnum = pgEnum("revocation_status", [
  "draft",              // wizard in progress
  "executed",           // signed + notarized, but notices not all sent
  "notice_in_progress", // some notices sent, others pending
  "complete",           // all notices sent and acknowledged or aged out
]);

// Sprint 4c: Notice recipient type — drives UI and pre-population
export const noticeRecipientTypeEnum = pgEnum("notice_recipient_type", [
  "agent",
  "successor_agent",
  "institution",
  "family_contact",
  "law_firm",
  "other",
]);

// Sprint 4c: Notice delivery method
export const noticeDeliveryMethodEnum = pgEnum("notice_delivery_method", [
  "email",
  "certified_mail",
  "regular_mail",
  "in_person",
  "fax",
  "other",
]);

// Sprint 4c: Notice delivery status — captures the full lifecycle
export const noticeDeliveryStatusEnum = pgEnum("notice_delivery_status", [
  "queued",         // notice prepared but not yet sent
  "sent",           // we have evidence of sending
  "delivered",      // we have evidence of delivery (e.g., certified mail return receipt, email delivered)
  "opened",         // for email — recipient opened
  "acknowledged",   // recipient acknowledged receipt (explicit reply or sign-back)
  "refused",        // recipient refused to accept
  "bounced",        // delivery failed
]);

export const leadStatusEnum = pgEnum("lead_status", [
  "new",
  "contacted",
  "qualified",
  "converted",
  "lost",
]);

// Sprint 4d: Institution presentation lifecycle status
export const presentationStatusEnum = pgEnum("presentation_status", [
  "draft",              // wizard in progress
  "generated",          // packet PDF generated, not yet presented
  "presented",          // user reports they've handed the packet to the institution
  "accepted",           // institution accepted the POA
  "rejected",           // institution refused the POA
  "pending_followup",   // institution requested additional items (certification, opinion, translation)
]);

// Sprint 4d: How the institution responded to the packet
export const presentationResponseTypeEnum = pgEnum("presentation_response_type", [
  "accepted",
  "rejected",
  "requested_certification",
  "requested_opinion",
  "requested_translation",
  "pending",
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
    // Sprint 5 R3 — send-link intake. A pro can issue a tokenized link that
    // lets an unauthenticated client walk the wizard; the finished POA lands
    // on the pro's client record. We store only the SHA-256 HASH of the token
    // (never the raw token — like a password reset token), so a DB leak can't
    // be replayed. The raw token lives only in the link the pro sends.
    intakeTokenHash: text("intake_token_hash").unique(),
    intakeTokenCreatedAt: timestamp("intake_token_created_at"),
    intakeTokenExpiresAt: timestamp("intake_token_expires_at"),
    intakeTokenConsumedAt: timestamp("intake_token_consumed_at"),
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
    // Sprint 4c — Revocation linkage. When a document's status transitions
    // to "revoked" or "superseded", this links to the revocation instrument
    // that caused the change. Null for active documents.
    revokedByRevocationId: uuid("revoked_by_revocation_id"),
    // Sprint 5 — Lawyer-blessed lock/execute immutability model.
    // Version manifest captured at lock time (the lawyer's evidentiary
    // requirement: know exactly which template/taxonomy/engine produced
    // the frozen artifact).
    templateVersion: text("template_version"),
    taxonomyVersion: text("taxonomy_version"),
    renderEngineVersion: text("render_engine_version"),
    // Locked signing copy — the immutable PDF the principal reviews/signs.
    // Frozen in Blob the moment the document leaves draft. Populated in
    // Sprint 5 Round 2 (Blob wiring); columns added now.
    lockedPdfBlobKey: text("locked_pdf_blob_key"),
    lockedPdfSha256: text("locked_pdf_sha256"),
    lockedAt: timestamp("locked_at"),
    // Executed copy — the signed/notarized legally-operative original.
    // Stored separately; never overwrites the locked copy. Populated in
    // Sprint 7 (RON); columns added now.
    executedPdfBlobKey: text("executed_pdf_blob_key"),
    executedPdfSha256: text("executed_pdf_sha256"),
    executedAt: timestamp("executed_at"),
    // When superseded, points at the document that replaced this one.
    supersededByDocumentId: uuid("superseded_by_document_id"),
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
// REVOCATIONS  (Sprint 4c)
// ===========================================================================
// Each revocation is its own legal instrument that supersedes one (or more)
// existing POAs. Per attorney guidance: "Never delete the old POA. Mark it:
// Revoked — do not use. Store revocation instrument. Store notice log.
// Preserve audit trail."
//
// A revocation has three scope modes (see revocationScopeEnum):
//   1. specific_poa — revokes one named POA
//   2. all_prior   — revokes the named POA plus any prior financial durable POAs
//   3. agent_only  — removes one named agent while leaving the POA active
//
// Snapshot columns capture key facts from the original POA at the moment of
// revocation. We snapshot rather than relying on joins because the original
// POA's wizard session could be edited later, and revocation must be tied to
// a stable, immutable record of what was revoked.
// ===========================================================================

export const revocations = pgTable(
  "revocations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clientId: uuid("client_id")
      .references(() => clients.id, { onDelete: "set null" }),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "set null" }),
    firmId: uuid("firm_id")
      .references(() => firms.id, { onDelete: "set null" }),
    // The original POA being revoked. SET NULL on delete so revocation
    // records survive even if the original document is removed.
    originalPoaId: uuid("original_poa_id")
      .references(() => documents.id, { onDelete: "set null" }),
    // Scope and target
    scope: revocationScopeEnum("scope").notNull(),
    // Only populated when scope = "agent_only" — the named agent being removed.
    // PII; consider scrubbing per TDPSA when revocation is closed out.
    revokedAgentName: text("revoked_agent_name"), // PII
    // Immutable snapshots from the original POA at revocation time
    principalNameSnapshot: text("principal_name_snapshot").notNull(), // PII
    originalPoaDateSnapshot: timestamp("original_poa_date_snapshot"),
    originalPoaDocumentIdSnapshot: text("original_poa_document_id_snapshot"),
    // The revocation instrument PDF
    revocationInstrumentUrl: text("revocation_instrument_url"),
    revocationInstrumentKey: text("revocation_instrument_key"),
    revocationInstrumentHash: text("revocation_instrument_hash"),
    // Lifecycle
    status: revocationStatusEnum("status").notNull().default("draft"),
    executedAt: timestamp("executed_at"),
    // Execution details
    executionMethod: text("execution_method"), // "ron" | "in_person"
    notarizationProvider: text("notarization_provider"),
    notarizationSessionId: text("notarization_session_id"),
    notarizedAt: timestamp("notarized_at"),
    // Flexible state for the revocation wizard (similar to wizardSessions)
    wizardState: jsonb("wizard_state").default({}),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    clientIdIdx: index("revocations_client_id_idx").on(table.clientId),
    userIdIdx: index("revocations_user_id_idx").on(table.userId),
    firmIdIdx: index("revocations_firm_id_idx").on(table.firmId),
    originalPoaIdIdx: index("revocations_original_poa_id_idx").on(table.originalPoaId),
    statusIdx: index("revocations_status_idx").on(table.status),
  })
);

// ===========================================================================
// REVOCATION NOTICES  (Sprint 4c)
// ===========================================================================
// One row per recipient that the principal wants to notify of a revocation.
// Per Tex. Est. Code § 751: "Termination of this durable power of attorney
// is not effective as to a third party until the third party has actual
// knowledge of the termination." This table tracks who's been notified and
// what evidence we have of their actual knowledge.
//
// MVP scope (Sprint 4c): captures recipient + delivery method + status.
// Does NOT actually send notices — that's Sprint 7 (Resend integration).
// For now, users mark notices as "sent" manually after sending themselves.
// ===========================================================================

export const revocationNotices = pgTable(
  "revocation_notices",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    revocationId: uuid("revocation_id")
      .notNull()
      .references(() => revocations.id, { onDelete: "cascade" }),
    recipientType: noticeRecipientTypeEnum("recipient_type").notNull(),
    // Recipient identity (all PII)
    recipientName: text("recipient_name").notNull(), // PII
    recipientEmail: text("recipient_email"), // PII
    recipientPhone: text("recipient_phone"), // PII
    recipientInstitutionName: text("recipient_institution_name"),
    // Mailing address subfields, matching the structured pattern used elsewhere
    recipientAddress: text("recipient_address"), // PII
    recipientCity: text("recipient_city"), // PII
    recipientState: text("recipient_state"),
    recipientZip: text("recipient_zip"), // PII
    // Delivery details
    deliveryMethod: noticeDeliveryMethodEnum("delivery_method").notNull(),
    deliveryStatus: noticeDeliveryStatusEnum("delivery_status").notNull().default("queued"),
    // Lifecycle timestamps
    sentAt: timestamp("sent_at"),
    deliveredAt: timestamp("delivered_at"),
    openedAt: timestamp("opened_at"),
    acknowledgmentReceivedAt: timestamp("acknowledgment_received_at"),
    refusedAt: timestamp("refused_at"),
    bouncedAt: timestamp("bounced_at"),
    // Evidence + notes
    acknowledgmentNotes: text("acknowledgment_notes"),
    trackingNumber: text("tracking_number"), // e.g., USPS certified-mail tracking
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    revocationIdIdx: index("revocation_notices_revocation_id_idx").on(table.revocationId),
    statusIdx: index("revocation_notices_status_idx").on(table.deliveryStatus),
  })
);

// ===========================================================================
// REVOCATION RECORDINGS  (Sprint 4c)
// ===========================================================================
// Per Tex. Est. Code § 751.151: a durable POA used for certain recordable
// real-property transactions must be recorded in the county where the
// property is located. When such a POA is revoked, the revocation should
// also be recorded in those counties.
//
// This table tracks the recording status of the revocation in each
// relevant county. Population is manual for Sprint 4c — the user enters
// county clerk recording details after they've recorded the revocation.
// Sprint 7.6 will add proactive prompting based on the original POA's
// recording history.
// ===========================================================================

export const revocationRecordings = pgTable(
  "revocation_recordings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    revocationId: uuid("revocation_id")
      .notNull()
      .references(() => revocations.id, { onDelete: "cascade" }),
    countyName: text("county_name").notNull(),
    state: text("state").notNull().default("Texas"),
    // Recording details — populated after user records in the county clerk's office
    recordedAt: timestamp("recorded_at"),
    recordingDocumentNumber: text("recording_document_number"),
    recordingBookPage: text("recording_book_page"),
    recordingFeesPaid: text("recording_fees_paid"),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    revocationIdIdx: index("revocation_recordings_revocation_id_idx").on(table.revocationId),
  })
);

// ===========================================================================
// INSTITUTION PROFILES  (Sprint 4d)
// ===========================================================================
// Seed table of institution-type templates. Each row defines a category of
// institution (Banking, Brokerage, Real Estate / Title, etc.) plus the
// recommended subset of POA powers to surface for that institution type.
//
// System profiles ship via the seed script (lib/db/seed/institution-profiles.js)
// with firmId = null and isSystemDefault = true. They're idempotent: re-running
// the seed never modifies existing rows, only inserts missing ones by slug.
//
// Future: firms will be able to define their own profiles by inserting rows
// with firmId set and isSystemDefault = false. The "Generic / Custom" system
// profile gives users a path to fully bespoke selections without needing a
// pre-defined profile.
//
// Why this is a table and not hardcoded constants: a "profile discovery
// dashboard" planned for later will query usage of profiles across all firms
// to surface patterns. That's only possible if profiles are queryable data.
// ===========================================================================

export const institutionProfiles = pgTable(
  "institution_profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    // Stable, human-readable identifier. Used as the natural key for seed
    // idempotency. Examples: "banking", "brokerage", "real_estate_title".
    slug: text("slug").notNull().unique(),
    // Display name shown to users in the presentation wizard.
    displayName: text("display_name").notNull(),
    // Short description shown beneath the displayName in the selector UI.
    description: text("description"),
    // Array of POA power keys this profile recommends. References match
    // the keys used in wizardSession.answers.powersGranted (e.g.,
    // "real_property", "banking_and_financial").
    recommendedPowers: jsonb("recommended_powers").notNull().default([]),
    // Array of standard notes / disclosures to include in the packet for
    // this institution type. Each item is { id, text, contextual } where
    // contextual notes only render under specific conditions (e.g., the
    // home-equity exclusion only renders for real_estate_title profiles
    // when the original POA was executed via RON).
    recommendedNotes: jsonb("recommended_notes").notNull().default([]),
    // True for system-shipped profiles, false for firm-custom additions.
    isSystemDefault: boolean("is_system_default").notNull().default(false),
    // Null for system defaults; set when a firm creates a custom profile.
    firmId: uuid("firm_id").references(() => firms.id, { onDelete: "cascade" }),
    // Display order in the picker UI. Lower numbers appear first.
    sortOrder: integer("sort_order").notNull().default(100),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    slugIdx: index("institution_profiles_slug_idx").on(table.slug),
    firmIdIdx: index("institution_profiles_firm_id_idx").on(table.firmId),
    sortOrderIdx: index("institution_profiles_sort_order_idx").on(table.sortOrder),
  })
);

// ===========================================================================
// INSTITUTION PRESENTATIONS  (Sprint 4d)
// ===========================================================================
// One row per packet generated for a specific institution. Created when the
// user starts the presentation wizard; finalized when they click "Generate
// packet"; updated through the response tracker as the institution responds.
//
// Snapshot pattern: like revocations, we snapshot key facts from the original
// POA at creation time so the presentation is tied to a stable record even
// if the underlying POA is later modified.
// ===========================================================================

export const institutionPresentations = pgTable(
  "institution_presentations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clientId: uuid("client_id")
      .references(() => clients.id, { onDelete: "set null" }),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "set null" }),
    firmId: uuid("firm_id")
      .references(() => firms.id, { onDelete: "set null" }),
    // The POA being presented. SET NULL on delete so presentations survive
    // even if the source document is removed (rare but possible).
    originalPoaId: uuid("original_poa_id")
      .references(() => documents.id, { onDelete: "set null" }),
    // Profile chosen for this presentation. Null = fully custom (the user
    // bypassed profile selection and configured everything manually).
    institutionProfileId: uuid("institution_profile_id")
      .references(() => institutionProfiles.id, { onDelete: "set null" }),
    // The actual institution receiving the packet. PII per TDPSA.
    institutionName: text("institution_name").notNull(), // PII
    institutionAddress: text("institution_address"), // PII
    institutionCity: text("institution_city"), // PII
    institutionState: text("institution_state"),
    institutionZip: text("institution_zip"), // PII
    institutionContactName: text("institution_contact_name"), // PII
    institutionContactEmail: text("institution_contact_email"), // PII
    institutionContactPhone: text("institution_contact_phone"), // PII
    // The subset of POA powers this packet surfaces. Starts from the
    // profile's recommendedPowers; user can override in the wizard.
    selectedPowers: jsonb("selected_powers").notNull().default([]),
    // Optional notes/disclosures specific to this presentation, beyond
    // whatever came from the profile.
    customNotes: jsonb("custom_notes").default([]),
    // Packet PDF storage
    packetPdfUrl: text("packet_pdf_url"),
    packetPdfKey: text("packet_pdf_key"),
    packetPdfHash: text("packet_pdf_hash"),
    // Lifecycle
    status: presentationStatusEnum("status").notNull().default("draft"),
    presentedAt: timestamp("presented_at"),
    responseReceivedAt: timestamp("response_received_at"),
    // Wizard state blob for in-progress edits (analog of revocation pattern)
    wizardState: jsonb("wizard_state").default({}),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    clientIdIdx: index("institution_presentations_client_id_idx").on(table.clientId),
    userIdIdx: index("institution_presentations_user_id_idx").on(table.userId),
    firmIdIdx: index("institution_presentations_firm_id_idx").on(table.firmId),
    originalPoaIdIdx: index("institution_presentations_original_poa_id_idx").on(table.originalPoaId),
    statusIdx: index("institution_presentations_status_idx").on(table.status),
  })
);

// ===========================================================================
// PRESENTATION RESPONSES  (Sprint 4d)
// ===========================================================================
// Captures the institution's response after the packet is presented. One
// presentation can have multiple responses over time (e.g., institution
// initially requests certification, then accepts after certification is
// provided). The most-recent response drives the presentation's status.
// ===========================================================================

export const presentationResponses = pgTable(
  "presentation_responses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    presentationId: uuid("presentation_id")
      .notNull()
      .references(() => institutionPresentations.id, { onDelete: "cascade" }),
    respondedAt: timestamp("responded_at").defaultNow().notNull(),
    responseType: presentationResponseTypeEnum("response_type").notNull(),
    // Free-text reason when rejected. Required field on the rejection
    // response so users always capture why.
    refusalReason: text("refusal_reason"),
    // Array of strings when institution requests additional items.
    // Examples: ["agent certification per § 751.203", "opinion of counsel"].
    requestedItems: jsonb("requested_items").default([]),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    presentationIdIdx: index("presentation_responses_presentation_id_idx").on(table.presentationId),
    respondedAtIdx: index("presentation_responses_responded_at_idx").on(table.respondedAt),
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
    // Sprint 5: optional document linkage. Lets us query a single document's
    // full event history (created → locked → executed → presented → revoked)
    // without a separate document_events table — one audit system, not two.
    documentId: uuid("document_id"),
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
    documentIdIdx: index("audit_events_document_id_idx").on(table.documentId),
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

export const documentsRelations = relations(documents, ({ one, many }) => ({
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
  // Sprint 4c
  revocationsAsOriginal: many(revocations),
}));

// Sprint 4c: revocation relations
export const revocationsRelations = relations(revocations, ({ one, many }) => ({
  client: one(clients, {
    fields: [revocations.clientId],
    references: [clients.id],
  }),
  user: one(users, {
    fields: [revocations.userId],
    references: [users.id],
  }),
  firm: one(firms, {
    fields: [revocations.firmId],
    references: [firms.id],
  }),
  originalPoa: one(documents, {
    fields: [revocations.originalPoaId],
    references: [documents.id],
  }),
  notices: many(revocationNotices),
  recordings: many(revocationRecordings),
}));

export const revocationNoticesRelations = relations(revocationNotices, ({ one }) => ({
  revocation: one(revocations, {
    fields: [revocationNotices.revocationId],
    references: [revocations.id],
  }),
}));

export const revocationRecordingsRelations = relations(revocationRecordings, ({ one }) => ({
  revocation: one(revocations, {
    fields: [revocationRecordings.revocationId],
    references: [revocations.id],
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

// Sprint 4d: institution presentation relations
export const institutionProfilesRelations = relations(institutionProfiles, ({ one, many }) => ({
  firm: one(firms, {
    fields: [institutionProfiles.firmId],
    references: [firms.id],
  }),
  presentations: many(institutionPresentations),
}));

export const institutionPresentationsRelations = relations(institutionPresentations, ({ one, many }) => ({
  client: one(clients, {
    fields: [institutionPresentations.clientId],
    references: [clients.id],
  }),
  user: one(users, {
    fields: [institutionPresentations.userId],
    references: [users.id],
  }),
  firm: one(firms, {
    fields: [institutionPresentations.firmId],
    references: [firms.id],
  }),
  originalPoa: one(documents, {
    fields: [institutionPresentations.originalPoaId],
    references: [documents.id],
  }),
  profile: one(institutionProfiles, {
    fields: [institutionPresentations.institutionProfileId],
    references: [institutionProfiles.id],
  }),
  responses: many(presentationResponses),
}));

export const presentationResponsesRelations = relations(presentationResponses, ({ one }) => ({
  presentation: one(institutionPresentations, {
    fields: [presentationResponses.presentationId],
    references: [institutionPresentations.id],
  }),
}));
