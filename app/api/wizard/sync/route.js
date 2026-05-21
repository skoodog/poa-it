/**
 * POST /api/wizard/sync
 *
 * Browser-side wizard calls this on every state update. Accepts the full
 * state object and persists to Postgres via the wizardSession server action.
 *
 * Anonymous sessions are first-class — no auth required. The server uses
 * the anonymousId to find or create the matching session row.
 *
 * Returns: { session: { id, anonymousId, status, ... } }
 */

import { NextResponse } from "next/server";
import { getOrCreateSession, updateSession } from "../../../../lib/server/wizardSession";

export async function POST(request) {
  try {
    const body = await request.json();
    const { anonymousId, state } = body;

    if (!anonymousId || !state) {
      return NextResponse.json(
        { error: "anonymousId and state are required" },
        { status: 400 }
      );
    }

    // Ensure a session exists, then update it
    const { session: existing } = await getOrCreateSession({
      anonymousId,
      initialState: state,
    });

    const { session: updated } = await updateSession({
      sessionId: existing.id,
      state,
    });

    return NextResponse.json({ session: updated });
  } catch (err) {
    console.error("[/api/wizard/sync] error:", err);
    return NextResponse.json(
      { error: "internal_error", message: err.message },
      { status: 500 }
    );
  }
}
