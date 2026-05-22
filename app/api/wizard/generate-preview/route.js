/**
 * POST /api/wizard/generate-preview
 *
 * Generates the watermarked preview PDF for a wizard session. Streams the
 * PDF bytes back as application/pdf with inline disposition so browsers
 * display it directly.
 *
 * Authentication: accepts either an authenticated user's session OR an
 * anonymousId in the body. Wizard sessions don't require login — anonymous
 * users walking the wizard can also generate previews.
 *
 * Request body (JSON):
 *   { anonymousId?: string, sessionId?: string }
 *
 * Response: application/pdf (binary stream)
 * Error responses: JSON with error code
 *
 * Audit: emits a `preview_generated` event so the document audit trail
 * records when previews were created (counts as a meaningful action for
 * malpractice-defense purposes — proves we were transparent about the
 * draft state of the document at preview time).
 */

import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "../../../../lib/db";
import { wizardSessions, auditEvents } from "../../../../lib/db/schema";
import { generateTexasPoaPdf, pdfFilename } from "../../../../lib/pdf/generatePdf";

export const runtime = "nodejs"; // PDF generation needs Node, not Edge
export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { anonymousId, sessionId } = body;

    if (!anonymousId && !sessionId) {
      return NextResponse.json(
        { error: "missing_identifier", message: "Provide anonymousId or sessionId" },
        { status: 400 }
      );
    }

    // Fetch the wizard session
    const whereClause = sessionId
      ? eq(wizardSessions.id, sessionId)
      : eq(wizardSessions.anonymousId, anonymousId);

    const [session] = await db
      .select()
      .from(wizardSessions)
      .where(whereClause)
      .limit(1);

    if (!session) {
      return NextResponse.json(
        { error: "session_not_found" },
        { status: 404 }
      );
    }

    // Generate the PDF
    const state = { ...(session.state || {}), sessionId: session.id };
    const pdfBuffer = await generateTexasPoaPdf(state, { watermarked: true });

    // Audit event (best-effort; failure shouldn't block the response)
    try {
      await db.insert(auditEvents).values({
        sessionId: session.id,
        userId: session.userId,
        firmId: session.firmId,
        clientId: session.clientId,
        eventType: "preview_generated",
        actor: "user",
        eventData: {
          watermarked: true,
          document_type: "tx_durable_financial_poa",
          byte_size: pdfBuffer.length,
        },
        piiScrubStatus: "no_pii",
      });
    } catch (auditErr) {
      console.warn("[generate-preview] audit write failed:", auditErr.message);
    }

    const filename = pdfFilename(state, { suffix: "preview" });

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "private, no-store",
        "Content-Length": String(pdfBuffer.length),
      },
    });
  } catch (err) {
    console.error("[/api/wizard/generate-preview] error:", err);
    return NextResponse.json(
      { error: "internal_error", message: err.message },
      { status: 500 }
    );
  }
}
