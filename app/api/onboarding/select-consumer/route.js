/**
 * POST /api/onboarding/select-consumer
 *
 * Called when the user clicks "For myself" on the onboarding page. Marks
 * the user as onboarded with userType=consumer (default) and redirects
 * to the homepage.
 */

import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "../../../../lib/db";
import { users } from "../../../../lib/db/schema";
import { getCurrentUser } from "../../../../lib/server/auth";

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  // User type is already "consumer" by default; just mark onboarded
  await db
    .update(users)
    .set({ onboardedAt: new Date(), updatedAt: new Date() })
    .where(eq(users.id, user.id));

  return NextResponse.redirect(new URL("/", request.url));
}
