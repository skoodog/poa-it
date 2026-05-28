/**
 * GET /api/documents/[id]/pdf
 *
 * Serves a document's PDF, respecting the freeze rule:
 *   - draft              → regenerate on demand, WATERMARKED (never frozen)
 *   - locked_for_signing → stream the exact frozen binary from Blob (clean)
 *   - executed           → stream the executed binary from Blob (Sprint 7)
 *
 * A locked/executed document is NEVER regenerated — it serves the stored
 * bytes that were hashed at lock time, so what the user sees is provably the
 * same document that was frozen.
 *
 * Auth required. Per L001, uses await auth().
 *
 * Sprint 5 Round 2.
 */

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "../../../../../lib/db";
import { documents, wizardSessions, users } from "../../../../../lib/db/schema";
import { generateTexasPoaPdf, pdfFilename } from "../../../../../lib/pdf/generatePdf";
import { fetchBlobStream } from "../../../../../lib/server/documentStorage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }

    const { id } = await params;

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkUserId))
      .limit(1);
    if (!user) {
      return NextResponse.json({ error: "user_not_found" }, { status: 404 });
    }

    const [doc] = await db
      .select()
      .from(documents)
      .where(eq(documents.id, id))
      .limit(1);
    if (!doc || doc.userId !== user.id) {
      return NextResponse.json({ error: "document_not_found" }, { status: 404 });
    }

    // Frozen states: serve the stored binary, never regenerate.
    const frozenKey =
      doc.status === "executed"
        ? doc.executedPdfBlobKey
        : doc.status === "locked_for_signing"
        ? doc.lockedPdfBlobKey
        : null;

    if (frozenKey) {
      const blob = await fetchBlobStream(frozenKey);
      if (!blob) {
        return NextResponse.json(
          { error: "blob_not_found", message: "Frozen PDF is missing from storage." },
          { status: 404 }
        );
      }
      return new NextResponse(blob.stream, {
        status: 200,
        headers: {
          "Content-Type": blob.contentType,
          "Content-Disposition": "inline",
          "Cache-Control": "private, no-store",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    // Draft: regenerate watermarked on demand from the wizard session.
    const [session] = await db
      .select()
      .from(wizardSessions)
      .where(eq(wizardSessions.id, doc.wizardSessionId))
      .limit(1);
    if (!session?.state) {
      return NextResponse.json({ error: "session_not_found" }, { status: 404 });
    }

    const renderState = { ...session.state, sessionId: session.id };
    const pdfBuffer = await generateTexasPoaPdf(renderState, { watermarked: true });
    const filename = pdfFilename(renderState, { suffix: "draft" });

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
    console.error("[/api/documents/[id]/pdf] error:", err);
    return NextResponse.json(
      { error: "internal_error", message: err?.message },
      { status: 500 }
    );
  }
}
