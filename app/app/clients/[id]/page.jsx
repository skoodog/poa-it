import { notFound } from "next/navigation";
import { ClientProfileView } from "../../../../components/workspace/ClientProfileView";
import { getClientWithRelations } from "../../../../lib/server/clients";
import { getRevocationsForClient } from "../../../../lib/server/revocations";
import { getPresentationsForClient } from "../../../../lib/server/presentations";
import { getPendingIntakesForClient } from "../../../../lib/server/documents";

/**
 * /app/clients/[id]
 *
 * Fetches the client and their related documents, wizard sessions, audit
 * events, and revocations in one server-side bundle. Passes them all to
 * the client component for rendering.
 *
 * 404 if the client doesn't exist or belongs to a different firm.
 */

export const dynamic = "force-dynamic";

export default async function ClientProfilePage({ params }) {
  const { id } = await params;

  const result = await getClientWithRelations(id);
  if (!result) notFound();

  const { documents, wizardSessions, auditEvents, ...client } = result;
  const revocations = await getRevocationsForClient(id);
  const presentations = await getPresentationsForClient(id);
  const pendingIntakes = await getPendingIntakesForClient(id);

  return (
    <ClientProfileView
      client={client}
      documents={documents}
      wizardSessions={wizardSessions}
      auditEvents={auditEvents}
      revocations={revocations}
      presentations={presentations}
      pendingIntakes={pendingIntakes}
    />
  );
}
