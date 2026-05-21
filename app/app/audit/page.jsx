import { Shield } from "lucide-react";
import { TopBar } from "../../../components/workspace/TopBar";
import { EmptyState } from "../../../components/workspace/EmptyState";

/**
 * /app/audit
 *
 * Sprint 2 ships the empty state. The per-session audit log already exists
 * at /wizard/audit. This page becomes the firm-wide audit view across all
 * clients once those are wired up in Sprints 3 and 5.
 */

export default function AuditPage() {
  return (
    <>
      <TopBar
        title="Audit"
        subtitle="Counsel-grade evidentiary log of every action across your firm."
      />

      <EmptyState
        icon={Shield}
        title="No audit events yet"
        description="As clients walk the wizard, every meaningful action — acknowledgments, warnings shown, attorney referrals offered — is logged here with timestamps and PII redaction. Built for malpractice defense and bar review, with one-click export."
        roadmap={[
          { sprint: "Sprint 3", text: "Per-client audit log exposed on client profile pages" },
          { sprint: "Sprint 5", text: "Firm-wide audit feed across all clients" },
          { sprint: "Sprint 8", text: "Audit packet export (PDF) for malpractice defense files" },
        ]}
      />
    </>
  );
}
