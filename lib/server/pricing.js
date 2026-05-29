/**
 * Pricing Configuration — Stripe Price IDs from env
 *
 * Per the project's data-driven principle, Stripe Price IDs are NEVER
 * hardcoded in source. They live in the environment, one per offering:
 *
 *   STRIPE_PRICE_CONSUMER_POA            — one-time $X per consumer POA (R2)
 *   STRIPE_PRICE_TIER_SOLO               — recurring monthly, Solo tier (R3)
 *   STRIPE_PRICE_TIER_SOLO_ANNUAL        — recurring annual, Solo tier (R3, optional)
 *   STRIPE_PRICE_TIER_FAMILY_OFFICE      — recurring monthly, Family Office (R3)
 *   STRIPE_PRICE_TIER_FAMILY_OFFICE_ANNUAL — recurring annual, Family Office (R3, optional)
 *
 * The Firm tier is intentionally not priced here — it's sales-led, captured
 * via the `leads` table, not self-serve Checkout.
 *
 * Each accessor throws a clear, action-oriented error if its price ID is
 * missing. That's deliberate: we'd rather fail loudly at the moment Checkout
 * is invoked than silently send a customer to a broken page. Configuration
 * gaps are not the user's problem to discover.
 *
 * Sprint 6 Round 1.
 */

const REQUIRED_PRICES = Object.freeze({
  consumerPoa: {
    env: "STRIPE_PRICE_CONSUMER_POA",
    label: "Consumer one-time POA",
    sprint: "Sprint 6 R2",
  },
  tierSolo: {
    env: "STRIPE_PRICE_TIER_SOLO",
    label: "Solo tier (monthly)",
    sprint: "Sprint 6 R3",
  },
  tierSoloAnnual: {
    env: "STRIPE_PRICE_TIER_SOLO_ANNUAL",
    label: "Solo tier (annual)",
    sprint: "Sprint 6 R3",
    optional: true,
  },
  tierFamilyOffice: {
    env: "STRIPE_PRICE_TIER_FAMILY_OFFICE",
    label: "Family Office tier (monthly)",
    sprint: "Sprint 6 R3",
  },
  tierFamilyOfficeAnnual: {
    env: "STRIPE_PRICE_TIER_FAMILY_OFFICE_ANNUAL",
    label: "Family Office tier (annual)",
    sprint: "Sprint 6 R3",
    optional: true,
  },
});

function readPrice(key) {
  const spec = REQUIRED_PRICES[key];
  if (!spec) throw new Error(`Unknown pricing key: ${key}`);
  const value = process.env[spec.env];
  if (!value) {
    throw new Error(
      `Pricing not configured: ${spec.label} (${spec.env}). ` +
        `Create the Price in the Stripe Dashboard, copy its price_... ID, and ` +
        `set it in .env.local AND Vercel env. See BILLING_SETUP.md.`
    );
  }
  return value;
}

// --- Consumer one-time ---
export function getConsumerPoaPriceId() {
  return readPrice("consumerPoa");
}

// --- B2B subscription tiers ---
const TIER_TO_PRICE_KEY = Object.freeze({
  solo: "tierSolo",
  family_office: "tierFamilyOffice",
  // firm: sales-led, intentionally absent
});

export function getTierPriceId(tier, { annual = false } = {}) {
  const base = TIER_TO_PRICE_KEY[tier];
  if (!base) {
    throw new Error(
      `Tier "${tier}" is not self-serve. ` +
        `Solo and Family Office have prices; Firm is sales-led (leads pipeline).`
    );
  }
  const key = annual ? `${base}Annual` : base;
  return readPrice(key);
}

/**
 * Diagnostic — returns which price keys are configured vs missing. Useful
 * for a health-check endpoint or admin surface. Never throws.
 */
export function pricingConfigStatus() {
  return Object.fromEntries(
    Object.entries(REQUIRED_PRICES).map(([key, spec]) => [
      key,
      {
        env: spec.env,
        label: spec.label,
        sprint: spec.sprint,
        optional: !!spec.optional,
        configured: Boolean(process.env[spec.env]),
      },
    ])
  );
}
