/**
 * POST /api/presentations/preview
 *
 * Generates a watermarked preview PDF of an institution presentation packet.
 *
 * Two modes:
 *   - { presentationId } — load persisted presentation from DB
 *   - { inlinePresentation: {...} } — preview from wizard data, no persistence
 *
 * Auth: requires authenticated user via Clerk (workspace feature only).
 *
 * Sprint 4d Round 1.
 */

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "../../../../lib/db";
import { institutionPresentations, users } from "../../../../lib/db/schema";
import {
  generatePresentationPdf,
  presentationPdfFilename,
} from "../../../../lib/pdf/presentation/generatePresentationPdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    // Sprint 4c learning L001: matches the await auth() pattern used in
    // all other Sprint 4c API routes (which deploy and run successfully)
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json(
        { error: "unauthenticated", message: "Sign in to preview presentations" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { presentationId, inlinePresentation } = body;

    let presentation;

    if (presentationId) {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.clerkId, clerkUserId))
        .limit(1);

      if (!user) {
        return NextResponse.json({ error: "user_not_found" }, { status: 404 });
      }

      const [row] = await db
        .select()
        .from(institutionPresentations)
        .where(eq(institutionPresentations.id, presentationId))
        .limit(1);

      if (!row || row.userId !== user.id) {
        return NextResponse.json(
          { error: "presentation_not_found" },
          { status: 404 }
        );
      }

      presentation = row;
    } else if (inlinePresentation) {
      if (
        !inlinePresentation.principalNameSnapshot ||
        !inlinePresentation.agentNameSnapshot ||
        !inlinePresentation.institutionName
      ) {
        return NextResponse.json(
          {
            error: "invalid_inline_presentation",
            message:
              "Inline presentation requires principalNameSnapshot, agentNameSnapshot, and institutionName",
          },
          { status: 400 }
        );
      }
      presentation = inlinePresentation;
    } else {
      return NextResponse.json(
        {
          error: "missing_identifier",
          message: "Provide presentationId or inlinePresentation",
        },
        { status: 400 }
      );
    }

    const buffer = await generatePresentationPdf(presentation, {
      watermarked: true,
    });
    const filename = presentationPdfFilename(presentation, { suffix: "DRAFT" });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (err) {
    console.error("Presentation preview error:", err);
    return NextResponse.json(
      {
        error: "preview_failed",
        message: err?.message || "Failed to generate presentation preview",
      },
      { status: 500 }
    );
  }
}
