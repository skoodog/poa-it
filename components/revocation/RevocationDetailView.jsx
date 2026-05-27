"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldOff,
  ArrowLeft,
  FileText,
  Loader2,
  Calendar,
  User,
  Layers,
  UserMinus,
} from "lucide-react";
import { TOKENS, FONTS } from "../wizard/shared/tokens";
import { NoticeTracker } from "./NoticeTracker";
import { RecordingTracker } from "./RecordingTracker";

/**
 * RevocationDetailView
 *
 * The post-execution workspace surface for a single revocation. Shows
 * summary metadata + notice tracker + recording tracker. Users land here
 * after executing a revocation, and return to it as they work through
 * notice delivery and county filings.
 *
 * Sprint 4c — Round 3.
 */

const STATUS_CONFIG = {
  draft: { label: "Draft", bg: "#E5E7EB", color: "#374151" },
  executed: { label: "Executed — Notices Pending", bg: "#FEF3C7", color: "#92400E" },
  notice_in_progress: { label: "Notice In Progress", bg: "#DBEAFE", color: "#1E40AF" },
  complete: { label: "Complete", bg: "#D1FAE5", color: "#065F46" },
};

const SCOPE_ICONS = {
  specific_poa: ShieldOff,
  all_prior: Layers,
  agent_only: UserMinus,
};

const SCOPE_LABELS = {
  specific_poa: "Revokes this specific POA",
  all_prior: "Revokes this POA plus all prior financial durable POAs",
  agent_only: "Revokes only the named agent's authority",
};

export function RevocationDetailView({ revocation, client }) {
  const router = useRouter();
  const [notices, setNotices] = useState(revocation.notices || []);
  const [recordings, setRecordings] = useState(revocation.recordings || []);
  const [previewing, setPreviewing] = useState(false);

  const ScopeIcon = SCOPE_ICONS[revocation.scope] || ShieldOff;
  const status = STATUS_CONFIG[revocation.status] || STATUS_CONFIG.draft;

  function onNoticeUpdated(updatedNotice) {
    setNotices((prev) =>
      prev.map((n) => (n.id === updatedNotice.id ? updatedNotice : n))
    );
    // Reload page on terminal-status transitions so revocation.status reflects
    // the latest computed value. Cheap and reliable for Sprint 4c.
    router.refresh();
  }

  function onRecordingUpdated(updated) {
    setRecordings((prev) =>
      prev.map((r) => (r.id === updated.id ? updated : r))
    );
  }

  async function generatePreview() {
    setPreviewing(true);
    try {
      const res = await fetch("/api/revocations/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revocationId: revocation.id }),
      });
      if (!res.ok) throw new Error("Preview failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setPreviewing(false);
    }
  }

  return (
    <div
      style={{
        maxWidth: 900,
        margin: "0 auto",
        padding: "24px 24px 80px",
        fontFamily: FONTS.SANS,
      }}
    >
      {/* Back link */}
      <a
        href={`/app/clients/${client.id}`}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: 12.5,
          color: TOKENS.INK_60,
          textDecoration: "none",
          marginBottom: 16,
          padding: "6px 10px 6px 6px",
          borderRadius: 6,
        }}
      >
        <ArrowLeft size={14} strokeWidth={2} />
        Back to {client.fullLegalName || "client"}
      </a>

      {/* Top branding strip — same red treatment as the wizard */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "12px 16px",
          background: "#FEF2F2",
          border: `1px solid #FECACA`,
          borderRadius: 10,
          marginBottom: 20,
        }}
      >
        <ShieldOff size={18} strokeWidth={2} color="#B91C1C" />
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 14,
              color: "#991B1B",
              fontWeight: 600,
              letterSpacing: 0.2,
            }}
          >
            Revocation of Power of Attorney
          </div>
          <div style={{ fontSize: 12, color: "#991B1B", opacity: 0.75, marginTop: 2 }}>
            Executed{" "}
            {revocation.executedAt
              ? new Date(revocation.executedAt).toLocaleDateString()
              : "—"}{" "}
            ·{" "}
            <span style={{ fontFamily: FONTS.MONO, fontSize: 11 }}>
              ID {String(revocation.id).slice(0, 8)}
            </span>
          </div>
        </div>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "5px 11px",
            background: status.bg,
            color: status.color,
            borderRadius: 999,
            fontSize: 11.5,
            fontWeight: 600,
            letterSpacing: 0.3,
          }}
        >
          {status.label}
        </span>
      </div>

      {/* Summary card */}
      <SectionCard
        label="Summary"
        rightAction={
          <button
            type="button"
            onClick={generatePreview}
            disabled={previewing}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              background: TOKENS.PAPER,
              color: TOKENS.INK,
              border: `1px solid ${TOKENS.LINE}`,
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              cursor: previewing ? "not-allowed" : "pointer",
            }}
          >
            {previewing ? (
              <Loader2 size={11} className="animate-spin" />
            ) : (
              <FileText size={11} strokeWidth={2} />
            )}
            View revocation PDF
          </button>
        }
      >
        <SummaryGrid>
          <SummaryItem icon={User} label="Principal" value={revocation.principalNameSnapshot} />
          <SummaryItem
            icon={ScopeIcon}
            label="Scope"
            value={SCOPE_LABELS[revocation.scope]}
          />
          {revocation.scope === "agent_only" && revocation.revokedAgentName && (
            <SummaryItem
              icon={UserMinus}
              label="Agent revoked"
              value={revocation.revokedAgentName}
            />
          )}
          <SummaryItem
            icon={Calendar}
            label="Original POA dated"
            value={
              revocation.originalPoaDateSnapshot
                ? new Date(revocation.originalPoaDateSnapshot).toLocaleDateString()
                : "—"
            }
          />
          <SummaryItem
            icon={FileText}
            label="Execution method"
            value={
              revocation.executionMethod === "ron"
                ? "Texas online notarization (RON)"
                : revocation.executionMethod === "in_person"
                ? "Texas in-person notarization"
                : "—"
            }
          />
        </SummaryGrid>
      </SectionCard>

      {/* Notice tracker */}
      <SectionCard
        label="Notice Tracker"
        description={
          notices.length > 0
            ? `${notices.length} recipient${notices.length === 1 ? "" : "s"} captured. Mark each as sent → delivered → acknowledged as you progress.`
            : "No recipients captured for this revocation."
        }
        rightBadge={`${countNonQueued(notices)} of ${notices.length} sent`}
      >
        <NoticeTracker
          revocationId={revocation.id}
          notices={notices}
          onNoticeUpdated={onNoticeUpdated}
        />
      </SectionCard>

      {/* Recording tracker — only shown if recordings exist */}
      {recordings.length > 0 && (
        <SectionCard
          label="County Recording Tracker"
          description="Track recordings of this revocation at the county clerk's office. Fill in the details after you've filed."
          rightBadge={`${countRecorded(recordings)} of ${recordings.length} recorded`}
        >
          <RecordingTracker
            revocationId={revocation.id}
            recordings={recordings}
            onRecordingUpdated={onRecordingUpdated}
          />
        </SectionCard>
      )}
    </div>
  );
}

function countNonQueued(notices) {
  return notices.filter((n) => n.deliveryStatus !== "queued").length;
}

function countRecorded(recordings) {
  return recordings.filter((r) => !!r.recordedAt).length;
}

function SectionCard({ label, description, rightAction, rightBadge, children }) {
  return (
    <section
      style={{
        background: TOKENS.PAPER,
        border: `1px solid ${TOKENS.LINE}`,
        borderRadius: 12,
        padding: 18,
        marginBottom: 18,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: description ? 6 : 14,
        }}
      >
        <div
          style={{
            fontSize: 11.5,
            fontFamily: FONTS.MONO,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: TOKENS.INK_60,
            fontWeight: 600,
          }}
        >
          {label}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {rightBadge && (
            <span
              style={{
                fontSize: 11,
                fontFamily: FONTS.MONO,
                color: TOKENS.INK_60,
                background: TOKENS.PAPER_2,
                padding: "3px 8px",
                borderRadius: 999,
                border: `1px solid ${TOKENS.LINE}`,
              }}
            >
              {rightBadge}
            </span>
          )}
          {rightAction}
        </div>
      </div>
      {description && (
        <div
          style={{
            fontSize: 12.5,
            color: TOKENS.INK_60,
            lineHeight: 1.5,
            marginBottom: 14,
          }}
        >
          {description}
        </div>
      )}
      {children}
    </section>
  );
}

function SummaryGrid({ children }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 12,
      }}
    >
      {children}
    </div>
  );
}

function SummaryItem({ icon: Icon, label, value }) {
  return (
    <div
      style={{
        padding: "10px 12px",
        background: TOKENS.PAPER_2,
        border: `1px solid ${TOKENS.LINE}`,
        borderRadius: 8,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 10.5,
          fontFamily: FONTS.MONO,
          letterSpacing: 0.6,
          textTransform: "uppercase",
          color: TOKENS.INK_60,
          fontWeight: 600,
          marginBottom: 4,
        }}
      >
        <Icon size={11} strokeWidth={1.8} />
        {label}
      </div>
      <div style={{ fontSize: 13, color: TOKENS.INK, fontWeight: 500, lineHeight: 1.4 }}>
        {value || "—"}
      </div>
    </div>
  );
}
