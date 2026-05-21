/**
 * POST /api/wizard/audit
 *
 * Browser-side audit logger calls this on every event. Persists to Postgres
 * `audit_events` with automatic PII scrubbing.
 *
 * Body: { anonymousId, eventType, eventData, actor? }
 * Returns: { event: { id, timestamp, ... } }
 */

import { NextResponse } from "next/server";
import { recordAuditEvent } from "../../../../lib/server/wizardSession";

export async function POST(request) {
  try {
    const body = await request.json();
    const { anonymousId, sessionId, eventType, eventData, actor } = body;

    if (!eventType) {
      return NextResponse.json(
        { error: "eventType is required" },
        { status: 400 }
      );
    }

    const result = await recordAuditEvent({
      sessionId,
      anonymousId,
      eventType,
      eventData,
      actor,
    });

    if (result.error === "session_not_found") {
      // Non-fatal — the session may not exist yet on the server. The browser
      // will retry once getOrCreateSession has been called.
      return NextResponse.json(
        { event: null, deferred: true },
        { status: 202 }
      );
    }

    return NextResponse.json({ event: result.event });
  } catch (err) {
    console.error("[/api/wizard/audit] error:", err);
    return NextResponse.json(
      { error: "internal_error", message: err.message },
      { status: 500 }
    );
  }
}
