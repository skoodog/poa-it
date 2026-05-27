import { notFound, redirect } from "next/navigation";
import { eq, and, desc } from "drizzle-orm";
import { db } from "../../../../../lib/db";
import {
  documents,
  clients,
  institutionPresentations,
  users,
} from "../../../../../lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { PresentationWizardPage } from "../../../../../components/presentation/PresentationWizardPage";
import {
  getInstitutionProfilesForUser,
  snapshotPoaForPresentation,
} from "../../../../../lib/server/presentations";

/**
 * /app/clients/[id]/present?documentId=...&presentationId=...
 *
 * Entry point to the presentation wizard.
 *
 * If presentationId is provided, resume that draft.
 * If documentId is provided (no presentationId), create a new draft for that POA.
 * If neither is provided, redirect to the client profile to pick a POA first.
 *
 * Sprint 4d — Round 2.
 */

export const dynamic = "force-dynamic";

export default async function PresentPage({ params, searchParams }) {
  const { id: clientId } = await params;
  const sp = await searchParams;
  const presentationId = sp?.presentationId;
  const documentId = sp?.documentId;

  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) redirect("/sign-in");

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkUserId))
    .limit(1);
  if (!user) redirect("/sign-in");

  const [client] = await db
    .select()
    .from(clients)
    .where(eq(clients.id, clientId))
    .limit(1);
  if (!client) notFound();
  if (client.firmId && client.firmId !== user.firmId) notFound();

  const profiles = await getInstitutionProfilesForUser();

  // Resolve which presentation to load (or create)
  let presentation = null;

  if (presentationId) {
    const [p] = await db
      .select()
      .from(institutionPresentations)
      .where(eq(institutionPresentations.id, presentationId))
      .limit(1);
    if (!p || p.userId !== user.id) notFound();
    presentation = p;
  } else if (documentId) {
    // Verify the POA belongs to this client
    const [poa] = await db
      .select()
      .from(documents)
      .where(
        and(eq(documents.id, documentId), eq(documents.clientId, clientId))
      )
      .limit(1);
    if (!poa) notFound();

    // Create a draft
    const snapshot = await snapshotPoaForPresentation(documentId);
    if (!snapshot) notFound();

    const [created] = await db
      .insert(institutionPresentations)
      .values({
        clientId,
        userId: user.id,
        firmId: user.firmId,
        originalPoaId: documentId,
        institutionName: "Draft Presentation (institution TBD)",
        selectedPowers: [],
        customNotes: [],
        status: "draft",
        wizardState: { ...snapshot },
      })
      .returning();
    presentation = created;
  } else {
    redirect(`/app/clients/${clientId}`);
  }

  // Resolve POA snapshot — prefer wizardState (already saved), fall back to live fetch
  let poaSnapshot;
  if (presentation.wizardState?.principalNameSnapshot) {
    poaSnapshot = {
      originalPoaId: presentation.originalPoaId,
      originalPoaDateSnapshot: presentation.wizardState.originalPoaDateSnapshot,
      originalPoaDocumentIdSnapshot: presentation.wizardState.originalPoaDocumentIdSnapshot,
      originalPoaStatus: presentation.wizardState.originalPoaStatus,
      originalPoaExecutionMethod: presentation.wizardState.originalPoaExecutionMethod,
      originalPoaPowersGranted: presentation.wizardState.originalPoaPowersGranted || [],
      principalNameSnapshot: presentation.wizardState.principalNameSnapshot,
      agentNameSnapshot: presentation.wizardState.agentNameSnapshot,
      successorAgentNameSnapshot: presentation.wizardState.successorAgentNameSnapshot,
      poaIsSpringingType: presentation.wizardState.poaIsSpringingType,
    };
  } else {
    poaSnapshot = await snapshotPoaForPresentation(presentation.originalPoaId);
  }

  return (
    <PresentationWizardPage
      initialPresentation={presentation}
      profiles={profiles}
      clientId={clientId}
      poaSnapshot={poaSnapshot}
    />
  );
}
