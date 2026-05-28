/**
 * POST /api/intake/[token]/sync
 *
 * Token-gated autosave for the client-facing intake wizard. Validates the
 * token (hash lookup + not expired + not consumed), then updates the bound
 * session's state. The client never sees or sends the session id.
 *
 * Body: { state }
 * Returns: { ok: true } | { status: "invalid"|"expired"|"consumed" }
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

export async function POST(request, { params }) {
  try {
    const { token } = await params;
    const body = await request.json().catch(() => ({}));
    const { state } = body;
    if (!token || !state) {
      return NextResponse.json({ status: "invalid" }, { status: 400 });
    }

    const tokenHash = hashIntakeToken(token);
    const [session] = await db
      .select()
      .from(wizardSessions)
      .where(eq(wizardSessions.intakeTokenHash, tokenHash))
      .limit(1);

    const classification = classifyIntakeToken(session);
    if (classification !== "valid") {
      return NextResponse.json({ status: classification }, { status: 403 });
    }

    // Preserve the server-side identity fields; never let the client overwrite
    // userId/clientId/mode or inject a sessionId.
    const merged = {
      ...state,
      sessionId: session.id,
      mode: "intake",
      userId: session.userId,
      clientId: session.clientId,
    };

    await db
      .update(wizardSessions)
      .set({
        state: merged,
        currentStep: state.currentStep || session.currentStep,
        updatedAt: new Date(),
      })
      .where(eq(wizardSessions.id, session.id));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[/api/intake/[token]/sync] error:", err);
    return NextResponse.json(
      { status: "invalid", error: "internal_error" },
      { status: 500 }
    );
  }
}
