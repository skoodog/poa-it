import { FileText } from "lucide-react";
import { TopBar } from "../../../components/workspace/TopBar";
import { EmptyState } from "../../../components/workspace/EmptyState";
import { DocumentsPageView } from "../../../components/workspace/DocumentsPageView";
import { getDocumentsForUser } from "../../../lib/server/documents";

/**
 * /app/documents
 *
 * Firm-wide document list across all of the current user's clients. Sprint 5
 * Round 1 wired this to real data (it was a hardcoded stub through Sprint 4).
 * When there are no documents yet, shows an honest empty state pointing the
 * user at the per-client "Create POA" action.
 */

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  const docs = await getDocumentsForUser();

  return (
    <>
      <TopBar
        title="Documents"
        subtitle="Generated POAs, drafts, and notarized originals across all your clients."
      />

      {docs.length > 0 ? (
        <DocumentsPageView documents={docs} />
      ) : (
        <EmptyState
          icon={FileText}
          title="No documents yet"
          description="Documents appear here as you create POAs for your clients. Open a client and use the Create POA action to fill one out — it'll show up here and on the client's profile."
        />
      )}
    </>
  );
}
