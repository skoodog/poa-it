/**
 * POST /api/workspace/update-firm
 *
 * Handles the Settings page form submission. Updates the firm record with
 * new firm name, tier, and contact info. Only the currently-authenticated
 * user can modify their own firm.
 *
 * Validates inputs server-side regardless of HTML constraints (which can be
 * bypassed). Tier is whitelisted against the firmTierEnum values.
 *
 * Redirects back to /app/settings?saved=1 on success.
 */

import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "../../../../lib/db";
import { firms } from "../../../../lib/db/schema";
import { getCurrentUser } from "../../../../lib/server/auth";

const VALID_TIERS = ["solo", "family_office", "firm"];

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }
  if (user.userType !== "professional" || !user.firmId) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const formData = await request.formData();
  const firmName = formData.get("firmName")?.toString().trim();
  const firmTier = formData.get("firmTier")?.toString().trim();
  const primaryContactEmail = formData
    .get("primaryContactEmail")
    ?.toString()
    .trim();
  const primaryContactPhone = formData
    .get("primaryContactPhone")
    ?.toString()
    .trim();
  const address = formData.get("address")?.toString().trim();

  // Validate
  if (!firmName) {
    return NextResponse.redirect(
      new URL("/app/settings?error=firmName", request.url)
    );
  }
  const tier = VALID_TIERS.includes(firmTier) ? firmTier : "solo";

  // Update
  await db
    .update(firms)
    .set({
      name: firmName,
      tier,
      primaryContactEmail: primaryContactEmail || null,
      primaryContactPhone: primaryContactPhone || null,
      address: address || null,
      updatedAt: new Date(),
    })
    .where(eq(firms.id, user.firmId));

  return NextResponse.redirect(new URL("/app/settings?saved=1", request.url));
}
