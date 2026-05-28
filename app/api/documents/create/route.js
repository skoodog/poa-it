/**
 * POST /api/documents/create
 *
 * Turns a completed (or far-enough-along) wizard session into a DRAFT
 * document tied to a client. This is the document-creation foundation that
 * has been missing since the beginning — the first code path that inserts a
 * row into the `documents` table.
 *
 * Sprint 5 Round 1 scope: creates a DRAFT only. Drafts regenerate on demand
 * (watermarked) and carry no immutable artifact — fully compliant with the
 * lawyer's rule (nothing here is presented as final). The version manifest
 * (template/taxonomy/render-engine) is captured at creation so it's already
 * on the row when Round 2's lock-for-signing freezes the binary.
 *
 * Auth required. Per L001, uses await auth().
 *
 * Sprint 5 Round 1.
 */

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "../../../../lib/db";
import {
  wizardSessions,
  documents,
  clients,
  users,
  auditEvents,
} from "../../../../lib/db/schema";
import { TAXONOMY_VERSION } from "../../../../lib/taxonomy/poaTaxonomy";
import {
  TEMPLATE_VERSION,
  RENDER_ENGINE_VERSION,
} from "../../../../lib/pdf/documentVersion";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { wizardSessionId } = body;
    if (!wizardSessionId) {
      return NextResponse.json(
        { error: "missing_session_id", message: "wizardSessionId is required" },
        { status: 400 }
      );
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkUserId))
      .limit(1);
    if (!user) {
      return NextResponse.json({ error: "user_not_found" }, { status: 404 });
    }

    // Load the session and verify ownership
    const [session] = await db
      .select()
      .from(wizardSessions)
      .where(eq(wizardSessions.id, wizardSessionId))
      .limit(1);
    if (!session) {
      return NextResponse.json({ error: "session_not_found" }, { status: 404 });
    }
    if (session.userId && session.userId !== user.id) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    // Must be a client-bound session (fill-for-client). Anonymous consumer
    // sessions can't create pro documents in this round.
    if (!session.clientId) {
      return NextResponse.json(
        {
          error: "session_not_client_bound",
          message: "This wizard session is not associated with a client.",
        },
        { status: 400 }
      );
    }

    // Verify the client still belongs to this firm
    const [client] = await db
      .select()
      .from(clients)
      .where(eq(clients.id, session.clientId))
      .limit(1);
    if (!client || (client.firmId && client.firmId !== user.firmId)) {
      return NextResponse.json({ error: "client_not_found" }, { status: 404 });
    }

    // Guard: don't create a second draft for the same session. If a document
    // already exists for this wizardSessionId, return it (idempotent).
    const [existingDoc] = await db
      .select()
      .from(documents)
      .where(eq(documents.wizardSessionId, wizardSessionId))
      .limit(1);
    if (existingDoc) {
      return NextResponse.json({ document: existingDoc, alreadyExisted: true });
    }

    // Create the draft document with the version manifest captured up front.
    const [created] = await db
      .insert(documents)
      .values({
        wizardSessionId,
        userId: user.id,
        clientId: session.clientId,
        firmId: user.firmId,
        documentType: session.documentType || "tx_durable_financial_poa",
        status: "draft",
        isWatermarked: true,
        templateVersion: TEMPLATE_VERSION,
        taxonomyVersion: TAXONOMY_VERSION,
        renderEngineVersion: RENDER_ENGINE_VERSION,
      })
      .returning();

    // Audit event — document-scoped (uses the new documentId column).
    await db.insert(auditEvents).values({
      sessionId: wizardSessionId,
      userId: user.id,
      firmId: user.firmId,
      clientId: session.clientId,
      documentId: created.id,
      eventType: "document_created",
      eventData: {
        documentType: created.documentType,
        status: "draft",
        templateVersion: TEMPLATE_VERSION,
        taxonomyVersion: TAXONOMY_VERSION,
      },
    });

    return NextResponse.json({ document: created });
  } catch (err) {
    console.error("[/api/documents/create] error:", err);
    return NextResponse.json(
      { error: "create_failed", message: err?.message },
      { status: 500 }
    );
  }
}
