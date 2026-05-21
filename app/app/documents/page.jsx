import { FileText } from "lucide-react";
import { TopBar } from "../../../components/workspace/TopBar";
import { EmptyState } from "../../../components/workspace/EmptyState";

/**
 * /app/documents
 *
 * Sprint 2 ships the empty state. Sprint 4 builds the PDF generator, and
 * Sprint 5 wires intake flows that produce documents tied to clients.
 */

export default function DocumentsPage() {
  return (
    <>
      <TopBar
        title="Documents"
        subtitle="Generated POAs, drafts, and notarized originals across all your clients."
      />

      <EmptyState
        icon={FileText}
        title="No documents yet"
        description="Documents appear here as your clients complete the wizard. You'll be able to download drafts, send for signature, and track notarization status — all in one place."
        roadmap={[
          { sprint: "Sprint 4", text: "Generate the Texas Statutory Durable POA as a real PDF" },
          { sprint: "Sprint 4", text: "Watermarked preview shown at Step 8 of the wizard" },
          { sprint: "Sprint 5", text: "Documents tied to client records with status tracking" },
          { sprint: "Sprint 7", text: "Notarization status from Proof, signed-PDF storage" },
        ]}
      />
    </>
  );
}
