import { notFound } from "next/navigation";
import { PresentationDetailView } from "../../../../../../components/presentation/PresentationDetailView";
import { getPresentationById } from "../../../../../../lib/server/presentations";

/**
 * /app/clients/[id]/presentations/[presentationId]
 *
 * Post-generation lifecycle view for a single institution presentation.
 * Shows summary metadata + response tracker. Users navigate here from the
 * Presentations section on the client profile.
 *
 * Sprint 4d — Round 3.
 */

export const dynamic = "force-dynamic";

export default async function PresentationDetailPage({ params }) {
  const { id: clientId, presentationId } = await params;

  const presentation = await getPresentationById(presentationId);
  if (!presentation) notFound();
  if (presentation.clientId !== clientId) notFound();

  // Hydrate snapshot fields from wizardState if the columns weren't
  // persisted directly (snapshot lives in wizardState for draft-era rows)
  const ws = presentation.wizardState || {};
  const enriched = {
    ...presentation,
    principalNameSnapshot:
      presentation.principalNameSnapshot || ws.principalNameSnapshot || "",
    agentNameSnapshot:
      presentation.agentNameSnapshot || ws.agentNameSnapshot || "",
    originalPoaStatus:
      presentation.originalPoaStatus || ws.originalPoaStatus || null,
  };

  return (
    <PresentationDetailView
      presentation={enriched}
      client={presentation.client}
    />
  );
}
