/**
 * POST /api/revocations/preview
 *
 * Generates a watermarked preview PDF of a revocation instrument.
 *
 * The preview endpoint accepts EITHER:
 *   - revocationId: an existing draft revocation in the database, OR
 *   - inline revocation data: principalNameSnapshot, scope, etc. (used by
 *     the revocation wizard before the user persists the revocation)
 *
 * This dual mode mirrors the wizard's preview pattern: we want a smooth
 * "as you build it" preview experience without forcing a database write
 * for every preview attempt.
 *
 * Auth: requires authenticated user via Clerk. Revocations are workspace
 * features only — there's no anonymous revocation path.
 *
 * Sprint 4c — Round 1.
 */

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "../../../../lib/db";
import { revocations, users } from "../../../../lib/db/schema";
import {
  generateRevocationPdf,
  revocationPdfFilename,
} from "../../../../lib/pdf/revocation/generateRevocationPdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json(
        { error: "unauthenticated", message: "Sign in to preview revocations" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { revocationId, inlineRevocation } = body;

    let revocation;

    if (revocationId) {
      // Load persisted revocation, ensure it belongs to this user
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.clerkUserId, clerkUserId))
        .limit(1);

      if (!user) {
        return NextResponse.json(
          { error: "user_not_found" },
          { status: 404 }
        );
      }

      const [row] = await db
        .select()
        .from(revocations)
        .where(eq(revocations.id, revocationId))
        .limit(1);

      if (!row || row.userId !== user.id) {
        return NextResponse.json(
          { error: "revocation_not_found" },
          { status: 404 }
        );
      }

      revocation = row;
    } else if (inlineRevocation) {
      // Wizard-time preview — use the inline data directly
      if (!inlineRevocation.principalNameSnapshot || !inlineRevocation.scope) {
        return NextResponse.json(
          {
            error: "invalid_inline_revocation",
            message: "Inline revocation requires principalNameSnapshot and scope",
          },
          { status: 400 }
        );
      }
      revocation = inlineRevocation;
    } else {
      return NextResponse.json(
        {
          error: "missing_identifier",
          message: "Provide revocationId or inlineRevocation",
        },
        { status: 400 }
      );
    }

    // Generate the PDF
    const buffer = await generateRevocationPdf(revocation, { watermarked: true });
    const filename = revocationPdfFilename(revocation, { suffix: "DRAFT" });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (err) {
    console.error("Revocation preview error:", err);
    return NextResponse.json(
      {
        error: "preview_failed",
        message: err?.message || "Failed to generate revocation preview",
      },
      { status: 500 }
    );
  }
}
