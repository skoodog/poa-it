import { Users, Plus } from "lucide-react";
import { TopBar } from "../../../components/workspace/TopBar";
import { EmptyState } from "../../../components/workspace/EmptyState";
import { TOKENS, FONTS } from "../../../components/wizard/shared/tokens";

/**
 * /app/clients
 *
 * Sprint 2 ships the empty state. Sprint 3 builds the actual client list,
 * search, profile pages, and add-client flow.
 */

export default function ClientsPage() {
  return (
    <>
      <TopBar
        title="Clients"
        subtitle="Manage the people your firm represents."
        actions={
          <button
            disabled
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              fontSize: 13,
              fontWeight: 600,
              background: TOKENS.INK_20,
              color: TOKENS.PAPER,
              border: "none",
              borderRadius: 6,
              cursor: "not-allowed",
              fontFamily: FONTS.SANS,
            }}
            title="Available in Sprint 3"
          >
            <Plus size={13} strokeWidth={2.4} />
            Add client
          </button>
        }
      />

      <EmptyState
        icon={Users}
        title="No clients yet"
        description="When Sprint 3 ships, you'll be able to create client records here, walk them through the wizard yourself, or send them a magic link to fill it out themselves."
        roadmap={[
          { sprint: "Sprint 3", text: "Create, edit, and search clients" },
          { sprint: "Sprint 3", text: "Per-client profile pages with documents and audit log" },
          { sprint: "Sprint 5", text: "Two intake flows: fill-for-client and send-link-to-client" },
          { sprint: "Sprint 5", text: "Family-office hierarchies — group clients by family" },
        ]}
      />
    </>
  );
}
