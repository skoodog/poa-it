/**
 * Stripe Client — server-side singleton
 *
 * Lazily constructs a single Stripe instance per process and reuses it on
 * every request. Throws a clear error if STRIPE_SECRET_KEY isn't configured,
 * so missing env surfaces immediately instead of as cryptic API errors.
 *
 * API version is pinned (not left as the account default) per Stripe's own
 * guidance: "specify the API version that you're integrating against in your
 * code instead of relying on your account's default API version." This locks
 * the request/response contract so dashboard-side API upgrades can't change
 * our integration's behavior without an explicit code change.
 *
 * Pinned to 2026-04-22.dahlia (the version Stripe SDK 22.x ships with).
 *
 * Sprint 6 Round 1.
 */

import Stripe from "stripe";

const PINNED_API_VERSION = "2026-04-22.dahlia";

let _stripe = null;

export function getStripe() {
  if (_stripe) return _stripe;

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY is not configured. Add it to .env.local (for local) " +
        "and Vercel project env (for prod). See BILLING_SETUP.md."
    );
  }

  _stripe = new Stripe(key, {
    apiVersion: PINNED_API_VERSION,
    typescript: false,
    appInfo: {
      name: "poa-it",
      version: "0.4.0",
      url: "https://poa-it.com",
    },
  });
  return _stripe;
}

/**
 * Webhook signature verification — uses the raw request body and the
 * STRIPE_WEBHOOK_SECRET to verify the request actually came from Stripe.
 * Throws if signature is missing/invalid; callers should return 400.
 *
 * @param {string} rawBody - the request body as text (NOT parsed JSON)
 * @param {string} signature - the Stripe-Signature header value
 */
export function verifyWebhookSignature(rawBody, signature) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error(
      "STRIPE_WEBHOOK_SECRET is not configured. See BILLING_SETUP.md."
    );
  }
  return getStripe().webhooks.constructEvent(rawBody, signature, secret);
}
