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
    const { anonymousId, sessionId, state } = body;

    if (!state || (!anonymousId && !sessionId)) {
      return NextResponse.json(
        { error: "state and (anonymousId or sessionId) are required" },
        { status: 400 }
      );
    }

    // Client-bound session (fill-for-client): the session was created
    // server-side with a clientId; we update it directly by id and never
    // touch the anonymous path.
    if (sessionId) {
      const { session: updated } = await updateSession({ sessionId, state });
      return NextResponse.json({ session: updated });
    }

    // Anonymous consumer session: find-or-create by anonymousId, then update.
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
