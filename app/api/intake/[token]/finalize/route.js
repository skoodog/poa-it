/**
 * POST /api/intake/[token]/finalize
 *
 * Token-gated terminal action for send-link intake. Validates the token,
 * creates the draft document (tied to the pro's user/client/firm from the
 * session — NOT the unauthenticated client), and marks the token consumed so
 * the link can't be reused to create a second document.
 *
 * Document creation goes through the shared createDraftDocumentForSession
 * helper, with actor "client" so the audit trail records the send-link origin.
 *
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
import { createDraftDocumentForSession } from "../../../../../lib/server/documents";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request, { params }) {
  try {
    const { token } = await params;
    if (!token) {
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

    if (!session.clientId) {
      return NextResponse.json(
        { status: "invalid", message: "Session is not client-bound." },
        { status: 400 }
      );
    }

    // Create the draft document (idempotent) on the pro's behalf.
    const { document } = await createDraftDocumentForSession(session, "client");

    // Consume the token + mark the session completed so the link can't be
    // reused and the gate shows the thank-you state on a return visit.
    await db
      .update(wizardSessions)
      .set({
        intakeTokenConsumedAt: new Date(),
        status: "completed",
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(wizardSessions.id, session.id));

    return NextResponse.json({ ok: true, documentId: document.id });
  } catch (err) {
    console.error("[/api/intake/[token]/finalize] error:", err);
    return NextResponse.json(
      { status: "invalid", error: "internal_error", message: err?.message },
      { status: 500 }
    );
  }
}
