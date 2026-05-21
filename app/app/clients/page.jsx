import { ClientsPageView } from "../../../components/workspace/ClientsPageView";
import { getClientsForFirm } from "../../../lib/server/clients";

/**
 * /app/clients (Server Component)
 *
 * Fetches all clients for the current firm (including archived — the client
 * component filters based on UI state) and hands them to ClientsPageView.
 *
 * We fetch everything in one go because the soft-launch scale assumption
 * is under 100 clients per firm. If a firm hits 1,000+ clients, we add
 * pagination — but doing it now would be premature complexity.
 *
 * The page is dynamic (no caching) because client list changes frequently.
 */

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const clients = await getClientsForFirm({ includeArchived: true });
  return <ClientsPageView initialClients={clients} />;
}
