import { notFound } from "next/navigation";
import { ClientProfileView } from "../../../../components/workspace/ClientProfileView";
import { getClientWithRelations } from "../../../../lib/server/clients";

/**
 * /app/clients/[id]
 *
 * Fetches the client and their related documents, wizard sessions, and
 * audit events in one round trip via getClientWithRelations.
 *
 * 404 if the client doesn't exist or belongs to a different firm.
 */

export const dynamic = "force-dynamic";

export default async function ClientProfilePage({ params }) {
  const { id } = await params;

  const result = await getClientWithRelations(id);
  if (!result) notFound();

  const { documents, wizardSessions, auditEvents, ...client } = result;

  return (
    <ClientProfileView
      client={client}
      documents={documents}
      wizardSessions={wizardSessions}
      auditEvents={auditEvents}
    />
  );
}
