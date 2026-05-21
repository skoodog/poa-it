/**
 * POST /api/onboarding/complete-professional
 *
 * Receives the firm name and tier from the professional onboarding form,
 * creates the firm record, links it to the user, marks onboarded.
 */

import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "../../../../lib/db";
import { users } from "../../../../lib/db/schema";
import { getCurrentUser, promoteToProfessional } from "../../../../lib/server/auth";

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  const formData = await request.formData();
  const firmName = formData.get("firmName")?.toString().trim();
  const firmTier = formData.get("firmTier")?.toString().trim() || "solo";

  if (!firmName) {
    return NextResponse.redirect(new URL("/onboarding/professional?error=firmName", request.url));
  }

  const validTiers = ["solo", "family_office", "firm"];
  const tier = validTiers.includes(firmTier) ? firmTier : "solo";

  await promoteToProfessional({ firmName, firmTier: tier });

  // Mark onboarded
  await db
    .update(users)
    .set({ onboardedAt: new Date(), updatedAt: new Date() })
    .where(eq(users.id, user.id));

  return NextResponse.redirect(new URL("/app", request.url));
}
