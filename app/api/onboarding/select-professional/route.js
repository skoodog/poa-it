/**
 * POST /api/onboarding/select-professional
 *
 * Called when the user clicks "For my clients" on the onboarding page.
 * Redirects to the professional firm-name capture form.
 */

import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/server/auth";

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  return NextResponse.redirect(new URL("/onboarding/professional", request.url));
}
