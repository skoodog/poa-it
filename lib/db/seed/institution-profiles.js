/**
 * Institution Profile Seed Data
 *
 * Defines the system-default institution profiles that ship with POA-IT.
 * Each profile maps an institution category to the subset of POA powers
 * typically relevant for that institution, plus standard disclosures/notes.
 *
 * Power keys reference the canonical taxonomy in lib/taxonomy/poaTaxonomy.js.
 * The validator below ensures every recommended power resolves against the
 * taxonomy at seed time — typos surface immediately rather than silently
 * breaking the wizard.
 *
 * Sprint 4d Round 1. Refactored in Sprint 4d.5 to import from taxonomy.
 */

import { POWERS, isValidPowerKey } from "../../taxonomy/poaTaxonomy.js";

export const SYSTEM_INSTITUTION_PROFILES = [
  {
    slug: "banking",
    displayName: "Banking & Deposit Accounts",
    description:
      "For commercial banks, credit unions, and other deposit institutions. Includes banking authority plus retirement-account access if also granted.",
    recommendedPowers: [
      "banking_and_financial",
      "retirement_plan",
    ],
    recommendedNotes: [
      {
        id: "banking-acceptance",
        text:
          "Per Tex. Est. Code § 751.201–§ 751.213, a financial institution is required to accept a properly executed durable power of attorney unless the institution has specific statutory grounds to refuse. Standard acceptance procedures include verification of the principal's identity and signature.",
        contextual: null,
      },
    ],
    isSystemDefault: true,
    sortOrder: 10,
  },
  {
    slug: "brokerage",
    displayName: "Brokerage / Investment Account",
    description:
      "For broker-dealers, RIAs, and other securities firms. Covers securities trading, commodities, and retirement accounts.",
    recommendedPowers: [
      "stocks_and_bonds",
      "commodity_and_option",
      "retirement_plan",
    ],
    recommendedNotes: [
      {
        id: "brokerage-acknowledgment",
        text:
          "Brokerage acceptance is subject to firm-specific policies in addition to Tex. Est. Code § 751.201–§ 751.213. Most major brokerages require the principal's signature on the firm's own POA form in addition to the statutory durable POA; this packet is provided to facilitate that supplemental process.",
        contextual: null,
      },
    ],
    isSystemDefault: true,
    sortOrder: 20,
  },
  {
    slug: "real_estate_title",
    displayName: "Real Estate / Title Company",
    description:
      "For title companies, attorneys, or lenders handling real-property transactions. Includes the standard home-equity exclusion when the POA was executed via RON.",
    recommendedPowers: [
      "real_property",
    ],
    recommendedNotes: [
      {
        id: "real-estate-recording",
        text:
          "Per Tex. Est. Code § 751.151, a durable power of attorney used for certain recordable real-property transactions must be recorded in the county where the property is located. The principal or agent is responsible for ensuring proper recording before execution of any recordable instrument.",
        contextual: null,
      },
      {
        id: "real-estate-home-equity",
        text:
          "Texas home-equity loan closings require execution at the permanent physical office of a lender, attorney at law, or title company per Tex. Const. art. XVI § 50(a)(6)(N). When the underlying durable POA was executed via remote online notarization (RON) without verification of execution at such a location, the agent's real-property authority excludes execution of Texas home-equity loan closing documents.",
        contextual: "ron_execution",
      },
    ],
    isSystemDefault: true,
    sortOrder: 30,
  },
  {
    slug: "insurance",
    displayName: "Insurance & Annuity",
    description:
      "For life insurance carriers, annuity providers, and long-term care insurers.",
    recommendedPowers: [
      "insurance_and_annuity",
    ],
    recommendedNotes: [
      {
        id: "insurance-beneficiary",
        text:
          "Note: changes to beneficiary designations require a separately granted specific authority under Tex. Est. Code § 751.031. If beneficiary changes are within the agent's intended scope, the underlying durable POA must include that specific authority.",
        contextual: null,
      },
    ],
    isSystemDefault: true,
    sortOrder: 40,
  },
  {
    slug: "retirement",
    displayName: "Retirement Plan Custodian (IRA, 401(k), Pension)",
    description:
      "For IRA custodians, 401(k) administrators, and pension plan administrators.",
    recommendedPowers: [
      "retirement_plan",
    ],
    recommendedNotes: [
      {
        id: "retirement-custodial",
        text:
          "Retirement plan custodians may have additional requirements beyond Tex. Est. Code § 751.201–§ 751.213, including their own custodial POA forms. Federal ERISA regulations may also apply for qualified plans.",
        contextual: null,
      },
    ],
    isSystemDefault: true,
    sortOrder: 50,
  },
  {
    slug: "tax_authority",
    displayName: "Tax Authority (IRS, State)",
    description:
      "For the IRS, Texas Comptroller, or other tax authorities. Tax matters generally require IRS Form 2848 or state equivalents in addition to a durable POA.",
    recommendedPowers: [
      "tax_matters",
    ],
    recommendedNotes: [
      {
        id: "tax-form-2848",
        text:
          "IRS matters generally require Form 2848 (Power of Attorney and Declaration of Representative) in addition to a Texas durable power of attorney. State tax matters may require an equivalent state-specific form. This packet provides the underlying authority basis; supplemental tax-specific forms must be filed separately.",
        contextual: null,
      },
    ],
    isSystemDefault: true,
    sortOrder: 60,
  },
  {
    slug: "government_benefits",
    displayName: "Government Benefits (Social Security, Medicare, Medicaid)",
    description:
      "For the Social Security Administration, Medicare, Medicaid, or VA benefits agencies.",
    recommendedPowers: [
      "government_benefits",
    ],
    recommendedNotes: [
      {
        id: "ssa-representative-payee",
        text:
          "The Social Security Administration does not recognize durable powers of attorney for direct receipt of benefits. A separate Representative Payee designation is required under 20 C.F.R. § 404.2010 et seq. This packet provides the underlying authority basis; the SSA Representative Payee application must be filed separately.",
        contextual: null,
      },
    ],
    isSystemDefault: true,
    sortOrder: 70,
  },
  {
    slug: "generic",
    displayName: "Generic / Custom Institution",
    description:
      "For institutions that don't fit a standard category, or when you want to manually select which powers to surface. Start with no recommended powers and configure everything yourself.",
    recommendedPowers: [],
    recommendedNotes: [],
    isSystemDefault: true,
    sortOrder: 999,
  },
];

/**
 * Shape validator. Now also validates that every recommendedPower key
 * resolves to a real power in the canonical taxonomy.
 */
export function isValidProfile(profile) {
  if (typeof profile.slug !== "string" || !profile.slug.length) return false;
  if (typeof profile.displayName !== "string" || !profile.displayName.length) return false;
  if (!Array.isArray(profile.recommendedPowers)) return false;
  if (!Array.isArray(profile.recommendedNotes)) return false;

  // Every recommendedPower must resolve to a canonical power key
  for (const powerKey of profile.recommendedPowers) {
    if (!isValidPowerKey(powerKey)) {
      console.error(
        `[seed-validator] Profile "${profile.slug}" references unknown power key: "${powerKey}". ` +
        `Valid keys: ${POWERS.map((p) => p.key).join(", ")}`
      );
      return false;
    }
  }

  return true;
}
