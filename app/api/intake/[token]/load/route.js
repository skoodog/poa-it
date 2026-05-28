/**
 * GET /api/intake/[token]/load
 *
 * Token-gated (unauthenticated). Resolves the intake token to its wizard
 * session and returns the current state, or a gate status the client UI can
 * render. The session id is NEVER returned to the client — the token is the
 * only credential they hold.
 *
 * Returns: { status: "valid", state } | { status: "invalid"|"expired"|"consumed" }
 *
 * Sprint 5 Round 3.
 */

import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "../../../../../lib/db";
import { wizardSessions } from "../../../../../lib/db/schema";
import {
  hashIntakeToken,
  classifyIntakeToken,
} from "../../../../../lib/server/intakeToken";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  try {
    const { token } = await params;
    if (!token) {
      return NextResponse.json({ status: "invalid" });
    }

    const tokenHash = hashIntakeToken(token);
    const [session] = await db
      .select()
      .from(wizardSessions)
      .where(eq(wizardSessions.intakeTokenHash, tokenHash))
      .limit(1);

    const classification = classifyIntakeToken(session);
    if (classification !== "valid") {
      return NextResponse.json({ status: classification });
    }

    // Strip the session id out of the state we hand back — the client should
    // only ever operate via the token.
    const { sessionId, ...safeState } = session.state || {};
    return NextResponse.json({ status: "valid", state: safeState });
  } catch (err) {
    console.error("[/api/intake/[token]/load] error:", err);
    return NextResponse.json(
      { status: "invalid", error: "internal_error" },
      { status: 500 }
    );
  }
}
