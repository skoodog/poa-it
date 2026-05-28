/**
 * POST /api/wizard/extend-intake
 *
 * Pushes out the expiry of an existing intake link. The pro already holds the
 * link (they sent it); extending keeps that same link working longer without
 * re-issuing. Logged as an audit event (Rob's requirement: extension is an
 * explicit, recorded action).
 *
 * Identified by sessionId (not the token) because this is an authenticated
 * pro action — the raw token is never re-sent to the server after issuance.
 *
 * Auth required. Per L001, uses await auth().
 *
 * Body: { sessionId, expiryDays }
 * Returns: { expiresAt }
 */

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "../../../../lib/db";
import { wizardSessions, users, auditEvents } from "../../../../lib/db/schema";
import { computeExpiry } from "../../../../lib/server/intakeToken";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { sessionId, expiryDays } = body;
    if (!sessionId) {
      return NextResponse.json({ error: "missing_session_id" }, { status: 400 });
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkUserId))
      .limit(1);
    if (!user) {
      return NextResponse.json({ error: "user_not_found" }, { status: 404 });
    }

    const [session] = await db
      .select()
      .from(wizardSessions)
      .where(eq(wizardSessions.id, sessionId))
      .limit(1);
    if (!session || session.userId !== user.id || !session.intakeTokenHash) {
      return NextResponse.json({ error: "intake_not_found" }, { status: 404 });
    }
    if (session.intakeTokenConsumedAt) {
      return NextResponse.json(
        { error: "already_consumed", message: "This intake link was already used." },
        { status: 400 }
      );
    }

    const previousExpiry = session.intakeTokenExpiresAt;
    const expiresAt = computeExpiry(expiryDays);

    await db
      .update(wizardSessions)
      .set({ intakeTokenExpiresAt: expiresAt, updatedAt: new Date() })
      .where(eq(wizardSessions.id, sessionId));

    await db.insert(auditEvents).values({
      sessionId,
      userId: user.id,
      firmId: user.firmId,
      clientId: session.clientId,
      eventType: "intake_link_extended",
      eventData: {
        previousExpiry: previousExpiry ? new Date(previousExpiry).toISOString() : null,
        newExpiry: expiresAt.toISOString(),
      },
    });

    return NextResponse.json({ expiresAt: expiresAt.toISOString() });
  } catch (err) {
    console.error("[/api/wizard/extend-intake] error:", err);
    return NextResponse.json(
      { error: "extend_failed", message: err?.message },
      { status: 500 }
    );
  }
}
