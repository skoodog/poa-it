/**
 * GET /api/wizard/load?anonymousId=xxx
 *
 * Returns the wizard session for an anonymous ID, if one exists.
 * Returns { session: null } if not found (browser falls back to localStorage).
 */

import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "../../../../lib/db";
import { wizardSessions } from "../../../../lib/db/schema";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const anonymousId = searchParams.get("anonymousId");

    if (!anonymousId) {
      return NextResponse.json(
        { error: "anonymousId query param is required" },
        { status: 400 }
      );
    }

    const [session] = await db
      .select()
      .from(wizardSessions)
      .where(eq(wizardSessions.anonymousId, anonymousId))
      .limit(1);

    return NextResponse.json({ session: session || null });
  } catch (err) {
    console.error("[/api/wizard/load] error:", err);
    return NextResponse.json(
      { error: "internal_error", message: err.message },
      { status: 500 }
    );
  }
}
