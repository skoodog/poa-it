/**
 * GET /api/wizard/load?anonymousId=xxx  OR  ?sessionId=xxx
 *
 * Returns the wizard session for an anonymous ID or a session ID.
 * - anonymousId: the consumer flow (anonymous, localStorage-backed)
 * - sessionId: the client-bound flow (fill-for-client; the session was
 *   created server-side with a clientId attached)
 *
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
    const sessionId = searchParams.get("sessionId");

    if (!anonymousId && !sessionId) {
      return NextResponse.json(
        { error: "anonymousId or sessionId query param is required" },
        { status: 400 }
      );
    }

    const where = sessionId
      ? eq(wizardSessions.id, sessionId)
      : eq(wizardSessions.anonymousId, anonymousId);

    const [session] = await db
      .select()
      .from(wizardSessions)
      .where(where)
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
