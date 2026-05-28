/**
 * POA Taxonomy — Canonical Vocabulary
 *
 * Single source of truth for every enum-like value in the POA-IT codebase.
 * Replaces ad-hoc string literals scattered across components, PDF templates,
 * server helpers, and seed data.
 *
 * Rules:
 *   1. Never hardcode a string like "real_property" or "ron" outside this file.
 *      Import the constant or the appropriate lookup helper instead.
 *   2. The "key" field is what's stored in the database. The other fields
 *      are display/derivative. Database values must always be a `key`, never
 *      a `displayName` or `letter`.
 *   3. If a value isn't here, it doesn't exist. The validator helpers
 *      throw on unknown keys so typos surface immediately.
 *   4. Statutory citations live next to the values they describe. When the
 *      Texas Estates Code changes, you should be able to update this file
 *      and have every affected feature reflect the change.
 *
 * Architecture note: this module is plain JS and has no runtime dependencies
 * on Drizzle, Next.js, or React. It can be safely imported from any layer:
 *   - Server components and API routes
 *   - Client components
 *   - PDF templates
 *   - Seed scripts
 *   - Future analytics scripts
 *
 * Sprint 4d.5 — Schema Consistency Sprint.
 */

// ===========================================================================
// GENERAL POWERS — Texas Statutory Durable POA, lines (A)–(O)
// ===========================================================================
// Each entry's `key` is the canonical id used everywhere in the system:
//   - wizardSessions.answers.powersGranted (database)
//   - institution_profiles.recommended_powers (database)
//   - all UI labels and PDF rendering
//
// Sourced from Tex. Est. Code §§ 752.051-752.115 (each subsection enumerated).
// Citations precise to the subchapter for line-item powers; the umbrella
// "all powers" line (O) cites § 752.051(a)(15).
// ===========================================================================

const POWERS_RAW = [
  {
    key: "real_property",
    letter: "A",
    displayName: "Real property transactions",
    statutoryCitation: "Tex. Est. Code §§ 752.051(a)(1), 752.102",
    plainEnglishExamples:
      "Buy or sell your house, lease property, refinance a mortgage, sign closing documents.",
    statutoryLanguage: "(A) Real property transactions;",
  },
  {
    key: "tangible_personal_property",
    letter: "B",
    displayName: "Tangible personal property transactions",
    statutoryCitation: "Tex. Est. Code §§ 752.051(a)(2), 752.103",
    plainEnglishExamples:
      "Buy, sell, or manage your vehicles, furniture, jewelry, and other physical possessions.",
    statutoryLanguage: "(B) Tangible personal property transactions;",
  },
  {
    key: "stocks_and_bonds",
    letter: "C",
    displayName: "Stock and bond transactions",
    statutoryCitation: "Tex. Est. Code §§ 752.051(a)(3), 752.104",
    plainEnglishExamples:
      "Buy, sell, or manage your investment accounts; vote on shareholder matters.",
    statutoryLanguage: "(C) Stock and bond transactions;",
  },
  {
    key: "commodity_and_option",
    letter: "D",
    displayName: "Commodity and option transactions",
    statutoryCitation: "Tex. Est. Code §§ 752.051(a)(4), 752.105",
    plainEnglishExamples:
      "Trade commodities and options contracts on your behalf.",
    statutoryLanguage: "(D) Commodity and option transactions;",
  },
  {
    key: "banking_and_financial",
    letter: "E",
    displayName: "Banking and financial institution transactions",
    statutoryCitation: "Tex. Est. Code §§ 752.051(a)(5), 752.106",
    plainEnglishExamples:
      "Open, close, and manage your bank accounts; deposit and withdraw funds; sign checks.",
    statutoryLanguage: "(E) Banking and other financial institution transactions;",
  },
  {
    key: "business_operating",
    letter: "F",
    displayName: "Business operating transactions",
    statutoryCitation: "Tex. Est. Code §§ 752.051(a)(6), 752.107",
    plainEnglishExamples:
      "Operate and manage your business; sign contracts; hire employees.",
    statutoryLanguage: "(F) Business operating transactions;",
  },
  {
    key: "insurance_and_annuity",
    letter: "G",
    displayName: "Insurance and annuity transactions",
    statutoryCitation: "Tex. Est. Code §§ 752.051(a)(7), 752.108",
    plainEnglishExamples:
      "Purchase, surrender, or modify life, health, property, or annuity contracts.",
    statutoryLanguage: "(G) Insurance and annuity transactions;",
  },
  {
    key: "estate_trust_beneficiary",
    letter: "H",
    displayName: "Estate, trust, and other beneficiary transactions",
    statutoryCitation: "Tex. Est. Code §§ 752.051(a)(8), 752.109",
    plainEnglishExamples:
      "Receive and manage inheritances; act on your behalf as trust beneficiary.",
    statutoryLanguage: "(H) Estate, trust, and other beneficiary transactions;",
  },
  {
    key: "claims_and_litigation",
    letter: "I",
    displayName: "Claims and litigation",
    statutoryCitation: "Tex. Est. Code §§ 752.051(a)(9), 752.110",
    plainEnglishExamples:
      "Pursue or defend lawsuits on your behalf; settle claims.",
    statutoryLanguage: "(I) Claims and litigation;",
  },
  {
    // Note: clause library uses "personal_and_family_maintenance". Canonical
    // form follows that. Sprint 4d R2 had this as "personal_family_maintenance"
    // (no leading "_and") — that was a bug; this taxonomy fixes it.
    key: "personal_and_family_maintenance",
    letter: "J",
    displayName: "Personal and family maintenance",
    statutoryCitation: "Tex. Est. Code §§ 752.051(a)(10), 752.111",
    plainEnglishExamples:
      "Pay your bills, manage household expenses, and provide for your family's needs.",
    statutoryLanguage: "(J) Personal and family maintenance;",
  },
  {
    key: "government_benefits",
    letter: "K",
    displayName:
      "Government benefits (Social Security, Medicare, Medicaid, etc.)",
    statutoryCitation: "Tex. Est. Code §§ 752.051(a)(11), 752.112",
    plainEnglishExamples:
      "Apply for and manage Social Security, Medicare, Medicaid, veteran benefits.",
    statutoryLanguage:
      "(K) Benefits from social security, Medicare, Medicaid, or other governmental programs, or civil or military service;",
  },
  {
    key: "retirement_plan",
    letter: "L",
    displayName: "Retirement plan transactions",
    statutoryCitation: "Tex. Est. Code §§ 752.051(a)(12), 752.113",
    plainEnglishExamples:
      "Manage IRAs, 401(k)s, pensions; make distributions and rollovers.",
    statutoryLanguage: "(L) Retirement plan transactions;",
  },
  {
    key: "tax_matters",
    letter: "M",
    displayName: "Tax matters",
    statutoryCitation: "Tex. Est. Code §§ 752.051(a)(13), 752.114",
    plainEnglishExamples:
      "File tax returns, represent you before tax authorities, sign IRS Form 2848.",
    statutoryLanguage: "(M) Tax matters;",
  },
  {
    key: "digital_assets",
    letter: "N",
    displayName: "Digital assets and electronic communications",
    statutoryCitation: "Tex. Est. Code §§ 752.051(a)(14), 752.115",
    plainEnglishExamples:
      "Manage your online accounts, digital files, and electronic communications.",
    statutoryLanguage:
      "(N) Digital assets and the content of an electronic communication;",
  },
  {
    key: "all_powers",
    letter: "O",
    displayName: "All of the powers listed above (A through N)",
    statutoryCitation: "Tex. Est. Code § 752.051(a)(15)",
    plainEnglishExamples:
      "Grant your agent every general power available under Texas law.",
    statutoryLanguage:
      "(O) All of the powers listed in (A) through (N) above.",
    isBlanket: true,
  },
];

/**
 * Frozen array of all general powers, in statutory order (A–O).
 */
export const POWERS = Object.freeze(
  POWERS_RAW.map((p) => Object.freeze({ ...p }))
);

/**
 * Lookup map by key. Built once at module load.
 */
const POWERS_BY_KEY = Object.freeze(
  POWERS.reduce((acc, p) => {
    acc[p.key] = p;
    return acc;
  }, {})
);

/**
 * Set of all valid power keys, for O(1) validation.
 */
const POWER_KEY_SET = new Set(POWERS.map((p) => p.key));

/**
 * Returns the canonical power record for a key, or null if not found.
 * Use this when you have an unknown-source key (e.g., loaded from DB) and
 * want to render display fields without crashing on legacy values.
 */
export function getPowerByKey(key) {
  return POWERS_BY_KEY[key] || null;
}

/**
 * Returns the canonical power record for a key, or throws if not found.
 * Use this in seed data validators, server-side validation, and anywhere
 * else where an unknown key indicates a bug that should fail loudly.
 */
export function requirePowerByKey(key) {
  const found = POWERS_BY_KEY[key];
  if (!found) {
    throw new Error(
      `Unknown power key: "${key}". Valid keys: ${Object.keys(POWERS_BY_KEY).join(", ")}`
    );
  }
  return found;
}

/**
 * O(1) validation. Returns true if the key references a real power.
 */
export function isValidPowerKey(key) {
  return POWER_KEY_SET.has(key);
}

/**
 * Returns the powers granted in `keys`, in canonical (statutory) order,
 * skipping any keys that aren't valid. Used by UI components that want
 * to render a user's selections in proper A→O order.
 */
export function sortPowerKeysCanonically(keys) {
  if (!Array.isArray(keys)) return [];
  const set = new Set(keys);
  return POWERS.filter((p) => set.has(p.key)).map((p) => p.key);
}

/**
 * Convenience: returns the display label for a key.
 * For unknown keys, returns the key itself (graceful degradation in UIs).
 */
export function getPowerDisplayName(key) {
  return POWERS_BY_KEY[key]?.displayName || key;
}

/**
 * Convenience: returns the statutory letter for a key (A–O), or null.
 */
export function getPowerLetter(key) {
  return POWERS_BY_KEY[key]?.letter || null;
}

// ===========================================================================
// HOT POWERS — § 751.031(b) statutorily significant authorities
// ===========================================================================
// Key names match what the consumer wizard stores in
// wizardSessions.answers.hotPowersGranted. These differ from the clause
// library's internal clause_id values (which use longer "create_amend_trust"
// style names) — the wizard uses short tokens, so the canonical taxonomy
// uses the same short tokens. Verified against Step5_HotPowers.jsx and
// confirmed by db:audit-taxonomy reporting clean.

const HOT_POWERS_RAW = [
  {
    key: "hot_power_gifts",
    displayName: "Authority to make gifts",
    statutoryCitation: "Tex. Est. Code § 751.031(b)(1)",
    summary:
      "Permits the agent to make gifts on the principal's behalf. Default limit: annual gift-tax exclusion ($18,000 in 2024) per donee.",
  },
  {
    key: "hot_power_trust",
    displayName: "Create, amend, revoke, or terminate a trust",
    statutoryCitation: "Tex. Est. Code § 751.031(b)(2)",
    summary:
      "Permits the agent to act on inter vivos trusts the principal has settled.",
  },
  {
    key: "hot_power_survivorship",
    displayName: "Change rights of survivorship",
    statutoryCitation: "Tex. Est. Code § 751.031(b)(3)",
    summary:
      "Permits the agent to add or remove rights-of-survivorship on jointly held property.",
  },
  {
    key: "hot_power_beneficiary",
    displayName: "Change beneficiary designations",
    statutoryCitation: "Tex. Est. Code § 751.031(b)(4)",
    summary:
      "Permits the agent to change designated beneficiaries on financial accounts, life insurance, retirement plans, etc.",
  },
  {
    key: "hot_power_delegate",
    displayName: "Delegate authority granted under the POA",
    statutoryCitation: "Tex. Est. Code § 751.031(b)(5)",
    summary:
      "Permits the agent to delegate the granted authority to a third party.",
  },
];

export const HOT_POWERS = Object.freeze(
  HOT_POWERS_RAW.map((p) => Object.freeze({ ...p }))
);

const HOT_POWERS_BY_KEY = Object.freeze(
  HOT_POWERS.reduce((acc, p) => {
    acc[p.key] = p;
    return acc;
  }, {})
);

const HOT_POWER_KEY_SET = new Set(HOT_POWERS.map((p) => p.key));

export function getHotPowerByKey(key) {
  return HOT_POWERS_BY_KEY[key] || null;
}

export function isValidHotPowerKey(key) {
  return HOT_POWER_KEY_SET.has(key);
}

// ===========================================================================
// EXECUTION METHODS — how the POA was signed and notarized
// ===========================================================================

export const EXECUTION_METHODS = Object.freeze([
  Object.freeze({
    key: "ron",
    displayName: "Remote online notarization (RON)",
    statutoryCitation: "Tex. Gov't Code Chapter 406, Subchapter C",
    summary:
      "Executed via online notarization with audio-video session and electronic notary platform.",
  }),
  Object.freeze({
    key: "in_person",
    displayName: "In-person notarization",
    statutoryCitation: "Tex. Gov't Code Chapter 406, Subchapter A",
    summary:
      "Executed in person before a Texas notary public.",
  }),
]);

const EXECUTION_METHOD_KEY_SET = new Set(EXECUTION_METHODS.map((m) => m.key));

export function isValidExecutionMethod(key) {
  return EXECUTION_METHOD_KEY_SET.has(key);
}

export function getExecutionMethodDisplayName(key) {
  return EXECUTION_METHODS.find((m) => m.key === key)?.displayName || key;
}

// ===========================================================================
// EFFECTIVE DATE TYPES — when does the POA take effect
// ===========================================================================

export const EFFECTIVE_DATE_TYPES = Object.freeze([
  Object.freeze({
    key: "immediate",
    displayName: "Immediately upon signing",
    summary:
      "The agent has authority as soon as the principal signs the document.",
  }),
  Object.freeze({
    key: "springing",
    displayName: "Upon principal's incapacity (springing)",
    statutoryCitation: "Tex. Est. Code § 751.0023",
    summary:
      "The agent's authority is triggered only upon a documented finding of the principal's incapacity. Requires explicit definition of who determines incapacity.",
  }),
]);

const EFFECTIVE_DATE_TYPE_KEY_SET = new Set(
  EFFECTIVE_DATE_TYPES.map((m) => m.key)
);

export function isValidEffectiveDateType(key) {
  return EFFECTIVE_DATE_TYPE_KEY_SET.has(key);
}

// ===========================================================================
// POWERS SCOPES — the three Sprint 4b.1 R3 scope choices
// ===========================================================================

export const POWERS_SCOPES = Object.freeze([
  Object.freeze({
    key: "broad",
    displayName: "Broad authority (line O — all powers)",
    summary:
      "Grants every general power available under Texas law. Recommended for spouses or fully trusted agents.",
  }),
  Object.freeze({
    key: "limited",
    displayName: "Limited authority (specific powers only)",
    summary:
      "Grant only specific powers from the A-N list. The agent has no authority outside those powers.",
  }),
  Object.freeze({
    key: "custom",
    displayName: "Custom (specific powers plus special instructions)",
    summary:
      "Grant specific powers plus written limits or extensions on the agent's authority.",
  }),
]);

const POWERS_SCOPE_KEY_SET = new Set(POWERS_SCOPES.map((s) => s.key));

export function isValidPowersScope(key) {
  return POWERS_SCOPE_KEY_SET.has(key);
}

// ===========================================================================
// AGENT COMPENSATION — how the agent is reimbursed
// ===========================================================================

export const AGENT_COMPENSATIONS = Object.freeze([
  Object.freeze({
    key: "reasonable",
    displayName: "Reasonable compensation",
    statutoryCitation: "Tex. Est. Code § 751.024",
    summary:
      "The agent may receive reasonable compensation for services rendered, in addition to reimbursement of out-of-pocket expenses.",
  }),
  Object.freeze({
    key: "no_compensation",
    displayName: "No compensation (reimbursement only)",
    summary:
      "The agent serves without compensation. Out-of-pocket expenses may still be reimbursed.",
  }),
]);

const AGENT_COMPENSATION_KEY_SET = new Set(
  AGENT_COMPENSATIONS.map((c) => c.key)
);

export function isValidAgentCompensation(key) {
  return AGENT_COMPENSATION_KEY_SET.has(key);
}

// ===========================================================================
// DOCUMENT STATUSES — every value of the documentStatusEnum
// ===========================================================================
// Mirrors documentStatusEnum in lib/db/schema.js. If schema enum values are
// added or renamed, this must change too. Tone helps UI components apply
// consistent color treatments.
// ===========================================================================

export const DOCUMENT_STATUSES = Object.freeze([
  Object.freeze({ key: "draft", displayName: "Draft", tone: "neutral" }),
  Object.freeze({ key: "generated", displayName: "Generated", tone: "info" }),
  Object.freeze({ key: "preview_shown", displayName: "Preview shown", tone: "info" }),
  Object.freeze({ key: "purchased", displayName: "Purchased", tone: "success" }),
  Object.freeze({ key: "awaiting_signature", displayName: "Awaiting signature", tone: "warning" }),
  Object.freeze({ key: "signed", displayName: "Signed", tone: "success" }),
  Object.freeze({ key: "awaiting_notarization", displayName: "Awaiting notarization", tone: "warning" }),
  Object.freeze({ key: "notarized", displayName: "Notarized", tone: "success" }),
  Object.freeze({ key: "delivered", displayName: "Delivered", tone: "success" }),
  Object.freeze({ key: "revoked", displayName: "Revoked", tone: "danger" }),
  Object.freeze({ key: "superseded", displayName: "Superseded", tone: "warning" }),
]);

const DOCUMENT_STATUS_KEY_SET = new Set(DOCUMENT_STATUSES.map((s) => s.key));

export function isValidDocumentStatus(key) {
  return DOCUMENT_STATUS_KEY_SET.has(key);
}

export function getDocumentStatusDisplay(key) {
  return DOCUMENT_STATUSES.find((s) => s.key === key) || {
    key,
    displayName: key,
    tone: "neutral",
  };
}

// ===========================================================================
// REVOCATION STATUSES — every value of revocationStatusEnum
// ===========================================================================

export const REVOCATION_STATUSES = Object.freeze([
  Object.freeze({ key: "draft", displayName: "Draft", tone: "neutral" }),
  Object.freeze({ key: "executed", displayName: "Executed", tone: "warning" }),
  Object.freeze({ key: "notice_in_progress", displayName: "Notice in progress", tone: "info" }),
  Object.freeze({ key: "complete", displayName: "Complete", tone: "success" }),
]);

const REVOCATION_STATUS_KEY_SET = new Set(REVOCATION_STATUSES.map((s) => s.key));

export function isValidRevocationStatus(key) {
  return REVOCATION_STATUS_KEY_SET.has(key);
}

// ===========================================================================
// REVOCATION SCOPE TYPES — what the revocation revokes
// ===========================================================================

export const REVOCATION_SCOPES = Object.freeze([
  Object.freeze({
    key: "specific_poa",
    displayName: "Specific Power of Attorney",
    summary: "Revokes one specific POA, identified by document.",
  }),
  Object.freeze({
    key: "all_prior",
    displayName: "This and all prior financial POAs",
    summary: "Revokes the named POA and any other financial POA the principal may have executed prior.",
  }),
  Object.freeze({
    key: "agent_only",
    displayName: "Specific agent's authority only",
    summary: "Revokes a specific agent's authority, leaving the POA itself in effect for any successor agents.",
  }),
]);

// ===========================================================================
// PRESENTATION STATUSES — every value of presentationStatusEnum
// ===========================================================================

export const PRESENTATION_STATUSES = Object.freeze([
  Object.freeze({ key: "draft", displayName: "Draft", tone: "neutral" }),
  Object.freeze({ key: "generated", displayName: "Generated", tone: "info" }),
  Object.freeze({ key: "presented", displayName: "Presented", tone: "info" }),
  Object.freeze({ key: "accepted", displayName: "Accepted", tone: "success" }),
  Object.freeze({ key: "rejected", displayName: "Rejected", tone: "danger" }),
  Object.freeze({ key: "pending_followup", displayName: "Pending follow-up", tone: "warning" }),
]);

const PRESENTATION_STATUS_KEY_SET = new Set(PRESENTATION_STATUSES.map((s) => s.key));

export function isValidPresentationStatus(key) {
  return PRESENTATION_STATUS_KEY_SET.has(key);
}

export function getPresentationStatusDisplay(key) {
  return (
    PRESENTATION_STATUSES.find((s) => s.key === key) || {
      key,
      displayName: key,
      tone: "neutral",
    }
  );
}

// ===========================================================================
// PRESENTATION RESPONSE TYPES — every value of presentationResponseTypeEnum
// ===========================================================================
// What an institution does after receiving a packet. The first three map to
// terminal-ish presentation statuses (accepted/rejected); the "requested_*"
// types map to pending_followup; "pending" means receipt acknowledged but
// no decision yet.

export const PRESENTATION_RESPONSE_TYPES = Object.freeze([
  Object.freeze({
    key: "accepted",
    displayName: "Accepted",
    tone: "success",
    summary: "The institution accepted the Power of Attorney.",
  }),
  Object.freeze({
    key: "rejected",
    displayName: "Rejected",
    tone: "danger",
    summary: "The institution refused to accept the Power of Attorney.",
  }),
  Object.freeze({
    key: "requested_certification",
    displayName: "Requested agent certification",
    tone: "warning",
    summary:
      "The institution requested an agent's certification per Tex. Est. Code § 751.203.",
  }),
  Object.freeze({
    key: "requested_opinion",
    displayName: "Requested opinion of counsel",
    tone: "warning",
    summary:
      "The institution requested an opinion of counsel per Tex. Est. Code § 751.204.",
  }),
  Object.freeze({
    key: "requested_translation",
    displayName: "Requested English translation",
    tone: "warning",
    summary:
      "The institution requested an English translation per Tex. Est. Code § 751.205.",
  }),
  Object.freeze({
    key: "pending",
    displayName: "Pending (receipt acknowledged)",
    tone: "info",
    summary:
      "The institution acknowledged receipt but has not yet made a decision.",
  }),
]);

const PRESENTATION_RESPONSE_TYPE_KEY_SET = new Set(
  PRESENTATION_RESPONSE_TYPES.map((r) => r.key)
);

export function isValidPresentationResponseType(key) {
  return PRESENTATION_RESPONSE_TYPE_KEY_SET.has(key);
}

export function getPresentationResponseTypeDisplay(key) {
  return (
    PRESENTATION_RESPONSE_TYPES.find((r) => r.key === key) || {
      key,
      displayName: key,
      tone: "neutral",
    }
  );
}

// ===========================================================================
// INSTITUTION PROFILE SLUGS — every system-default profile slug
// ===========================================================================

export const INSTITUTION_PROFILE_SLUGS = Object.freeze([
  "banking",
  "brokerage",
  "real_estate_title",
  "insurance",
  "retirement",
  "tax_authority",
  "government_benefits",
  "generic",
]);

const INSTITUTION_PROFILE_SLUG_SET = new Set(INSTITUTION_PROFILE_SLUGS);

export function isValidInstitutionProfileSlug(slug) {
  return INSTITUTION_PROFILE_SLUG_SET.has(slug);
}
