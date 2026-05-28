/**
 * Intake Token — secure tokens for send-link intake
 *
 * Security model (per Rob's spec):
 *   - Cryptographically secure: 256 bits from crypto.randomBytes, base64url.
 *   - Stored hashed: only the SHA-256 hash lives in the DB. The raw token
 *     exists solely in the link the pro sends. A DB leak can't be replayed.
 *   - Configurable expiry: the issuing action chooses a lifetime; the default
 *     is deliberately SHORT (shorter = less exposure window).
 *   - Extendable: a separate, logged pro action can push the expiry out.
 *
 * Sprint 5 Round 3.
 */

import { randomBytes, createHash } from "crypto";

// Expiry options offered in the UI (days). Short default by design.
export const INTAKE_EXPIRY_OPTIONS = Object.freeze([
  { days: 1, label: "1 day" },
  { days: 3, label: "3 days (default)" },
  { days: 7, label: "7 days" },
  { days: 14, label: "14 days" },
]);

export const DEFAULT_INTAKE_EXPIRY_DAYS = 3;
// Hard ceiling — even an explicit/extended choice can't exceed this, to bound
// the exposure window of a credential that grants wizard access.
export const MAX_INTAKE_EXPIRY_DAYS = 30;

/**
 * Generate a new raw token (URL-safe, 256-bit) and its storage hash.
 * Returns { token, tokenHash }. Persist tokenHash; put token in the link.
 */
export function generateIntakeToken() {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashIntakeToken(token);
  return { token, tokenHash };
}

/**
 * SHA-256 hex of a raw token. Used both to store and to look up.
 */
export function hashIntakeToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Clamp a requested expiry (in days) to [1, MAX], defaulting when missing or
 * invalid. Returns a Date.
 */
export function computeExpiry(requestedDays) {
  let days = Number(requestedDays);
  if (!Number.isFinite(days) || days <= 0) days = DEFAULT_INTAKE_EXPIRY_DAYS;
  if (days > MAX_INTAKE_EXPIRY_DAYS) days = MAX_INTAKE_EXPIRY_DAYS;
  const expires = new Date();
  expires.setUTCDate(expires.getUTCDate() + Math.round(days));
  return expires;
}

/**
 * Classify a session's token state for gating. Returns one of:
 *   "valid" | "invalid" | "expired" | "consumed"
 *
 * @param {object|null} session - the wizard session row (or null if not found)
 */
export function classifyIntakeToken(session) {
  if (!session || !session.intakeTokenHash) return "invalid";
  if (session.intakeTokenConsumedAt) return "consumed";
  if (
    session.intakeTokenExpiresAt &&
    new Date(session.intakeTokenExpiresAt).getTime() < Date.now()
  ) {
    return "expired";
  }
  return "valid";
}
