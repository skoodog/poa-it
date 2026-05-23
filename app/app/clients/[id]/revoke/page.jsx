import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { eq, and, desc } from "drizzle-orm";
import { db } from "../../../../../lib/db";
import {
  clients,
  documents,
  revocations,
  users,
  wizardSessions,
} from "../../../../../lib/db/schema";
import { RevocationWizardPage } from "../../../../../components/revocation/RevocationWizardPage";

/**
 * /app/clients/[id]/revoke
 *
 * Entry point for the revocation wizard. On first visit (no draft revocation
 * exists), this page creates a new draft revocation tied to the client and
 * the most recent active POA, then renders the wizard. On subsequent visits
 * with the wizard already in progress, it loads the existing draft.
 *
 * Query params:
 *   ?revocationId=...  → load this specific draft revocation
 *   ?documentId=...    → preselect this document as the original POA
 *
 * Sprint 4c — Round 2.
 */

export const dynamic = "force-dynamic";

export default async function RevocationWizardRoute({ params, searchParams }) {
  const { id: clientId } = await params;
  const { revocationId, documentId } = (await searchParams) || {};

  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    redirect(`/sign-in?redirect=/app/clients/${clientId}/revoke`);
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.clerkUserId, clerkUserId))
    .limit(1);
  if (!user) notFound();

  // Load client
  const [client] = await db
    .select()
    .from(clients)
    .where(eq(clients.id, clientId))
    .limit(1);
  if (!client) notFound();
  if (client.firmId && client.firmId !== user.firmId) notFound();

  // Load active documents for this client
  const allDocs = await db
    .select()
    .from(documents)
    .where(eq(documents.clientId, clientId))
    .orderBy(desc(documents.createdAt));

  const activeDocuments = allDocs.filter(
    (d) =>
      d.status === "generated" ||
      d.status === "signed" ||
      d.status === "notarized" ||
      d.status === "delivered"
  );

  // If no active documents, the wizard has nothing to revoke
  if (activeDocuments.length === 0 && !revocationId) {
    return (
      <NoActivePOAsView clientId={clientId} clientName={client.fullLegalName} />
    );
  }

  // Determine which revocation to use:
  //   - if revocationId in query: load that one
  //   - otherwise: create a new draft tied to documentId (or first active doc)
  let revocation;

  if (revocationId) {
    const [existing] = await db
      .select()
      .from(revocations)
      .where(eq(revocations.id, revocationId))
      .limit(1);
    if (!existing || existing.userId !== user.id || existing.clientId !== clientId) {
      notFound();
    }
    revocation = existing;
  } else {
    // Create a new draft revocation
    const preselectedDocId = documentId || activeDocuments[0]?.id;
    if (!preselectedDocId) notFound();

    const [doc] = await db
      .select()
      .from(documents)
      .where(eq(documents.id, preselectedDocId))
      .limit(1);
    if (!doc || doc.clientId !== clientId) notFound();

    let principalNameSnapshot = client.fullLegalName || "Unknown Principal";
    let originalPoaPowersGranted = [];
    if (doc.wizardSessionId) {
      const [session] = await db
        .select()
        .from(wizardSessions)
        .where(eq(wizardSessions.id, doc.wizardSessionId))
        .limit(1);
      if (session?.answers) {
        principalNameSnapshot =
          session.answers.principalFullLegalName || principalNameSnapshot;
        originalPoaPowersGranted = session.answers.powersGranted || [];
      }
    }

    const [created] = await db
      .insert(revocations)
      .values({
        clientId,
        userId: user.id,
        firmId: user.firmId,
        originalPoaId: doc.id,
        scope: "specific_poa",
        principalNameSnapshot,
        originalPoaDateSnapshot: doc.createdAt,
        originalPoaDocumentIdSnapshot: doc.id,
        status: "draft",
        wizardState: { originalPoaPowersGranted },
      })
      .returning();

    revocation = created;
  }

  // Load original POA wizard answers so Step 4 can prefill recipients
  let originalPoaAnswers = null;
  if (revocation.originalPoaId) {
    const [doc] = await db
      .select()
      .from(documents)
      .where(eq(documents.id, revocation.originalPoaId))
      .limit(1);
    if (doc?.wizardSessionId) {
      const [session] = await db
        .select()
        .from(wizardSessions)
        .where(eq(wizardSessions.id, doc.wizardSessionId))
        .limit(1);
      if (session) {
        originalPoaAnswers = session.answers || null;
      }
    }
  }

  return (
    <RevocationWizardPage
      client={client}
      initialRevocation={revocation}
      activeDocuments={activeDocuments}
      originalPoaAnswers={originalPoaAnswers}
    />
  );
}

function NoActivePOAsView({ clientId, clientName }) {
  return (
    <div
      style={{
        maxWidth: 560,
        margin: "0 auto",
        padding: "80px 32px",
        textAlign: "center",
        fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 12 }}>
        No active POAs to revoke
      </h1>
      <p style={{ fontSize: 14, color: "#666", lineHeight: 1.55, marginBottom: 24 }}>
        {clientName ? `${clientName}` : "This client"} has no Powers of Attorney
        in an active state. Revocation requires at least one POA that is
        generated, signed, notarized, or delivered.
      </p>
      <a
        href={`/app/clients/${clientId}`}
        style={{
          display: "inline-block",
          padding: "10px 16px",
          background: "#0A0A0A",
          color: "white",
          textDecoration: "none",
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        Back to client profile
      </a>
    </div>
  );
}
