/**
 * GET /api/workspace/clients/check-duplicate-email?email=foo@bar.com&excludeClientId=xxx
 *
 * Returns the count of other active clients in the firm with the given email.
 * Used by the AddClientModal to show a soft warning if the email is already
 * associated with another client.
 *
 * Returns: { count: number }
 */

import { NextResponse } from "next/server";
import { countDuplicatesByEmail } from "../../../../../lib/server/clients";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const excludeClientId = searchParams.get("excludeClientId");

    if (!email) {
      return NextResponse.json({ count: 0 });
    }

    const count = await countDuplicatesByEmail(email, {
      excludeClientId: excludeClientId || undefined,
    });

    return NextResponse.json({ count });
  } catch (err) {
    console.error(
      "[/api/workspace/clients/check-duplicate-email] error:",
      err.message
    );

    if (err.message === "unauthenticated") {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }
    if (err.message.startsWith("forbidden")) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    // Don't fail loud on this — it's a UX nicety, not critical
    return NextResponse.json({ count: 0 });
  }
}
