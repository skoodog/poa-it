"use client";

import { useEffect, useState } from "react";
import {
  Database,
  Download,
  FileText,
  ArrowLeft,
  Search,
  Trash2,
} from "lucide-react";
import { TOKENS, FONTS } from "../../../components/wizard/shared/tokens";
import { getAuditLog, clearAuditLog } from "../../../lib/audit/logger";
import { loadState } from "../../../lib/wizard/state";

/**
 * /wizard/audit
 *
 * The audit log viewer. Shows the full evidentiary record of the user's
 * wizard session — every tooltip opened, every acknowledgment recorded,
 * every step completed, every warning shown. This is the foundation of
 * the UPL safe-harbor defense file.
 *
 * For now (Phase 4), this reads from localStorage. In Phase 6 production,
 * it pulls from the server-side audit table.
 *
 * Accessible from:
 *   - Wizard completion screen ("View the audit log of my session")
 *   - Direct URL (for counsel review during pre-launch)
 *   - Future: account dashboard
 */
export default function AuditLogPage() {
  const [events, setEvents] = useState([]);
  const [state, setState] = useState(null);
  const [filter, setFilter] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState("all");

  useEffect(() => {
    setEvents(getAuditLog());
    setState(loadState());
  }, []);

  function handleClear() {
    if (typeof window === "undefined") return;
    if (!window.confirm("Clear all audit log entries? This cannot be undone.")) return;
    clearAuditLog();
    setEvents([]);
  }

  function handleExport() {
    const exportData = {
      exportedAt: new Date().toISOString(),
      sessionId: state?.sessionId || "unknown",
      wizardState: state,
      events,
      meta: {
        eventCount: events.length,
        firstEventAt: events[0]?.timestamp,
        lastEventAt: events[events.length - 1]?.timestamp,
        note:
          "This audit log represents the evidentiary record of the user's wizard session. " +
          "It captures every decision, warning, acknowledgment, and tooltip view, with " +
          "timestamps and PII scrubbed at write time.",
      },
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `poa-it-audit-${state?.sessionId?.slice(-8) || "session"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Derive unique event types for the filter
  const eventTypes = ["all", ...Array.from(new Set(events.map((e) => e.eventType))).sort()];

  // Apply filters
  const filteredEvents = events.filter((e) => {
    if (eventTypeFilter !== "all" && e.eventType !== eventTypeFilter) return false;
    if (filter) {
      const haystack = JSON.stringify(e).toLowerCase();
      if (!haystack.includes(filter.toLowerCase())) return false;
    }
    return true;
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        background: TOKENS.PAPER,
        fontFamily: FONTS.SANS,
        color: TOKENS.INK,
        WebkitFontSmoothing: "antialiased",
      }}
    >
      <style suppressHydrationWarning>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; background: ${TOKENS.PAPER}; }
        button { font-family: inherit; }
      `}</style>

      {/* Top nav */}
      <header
        style={{
          borderBottom: `1px solid ${TOKENS.LINE}`,
          background: TOKENS.PAPER,
          padding: "16px 32px",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div
          style={{
            maxWidth: 1080,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <a
              href="/"
              style={{
                fontSize: 17,
                fontWeight: 600,
                letterSpacing: "-0.02em",
                textDecoration: "none",
                color: TOKENS.INK,
              }}
            >
              poa-it
            </a>
            <span
              style={{
                fontSize: 11,
                fontFamily: FONTS.MONO,
                color: TOKENS.INK_40,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                fontWeight: 600,
              }}
            >
              Audit Log
            </span>
          </div>
          <a
            href="/wizard"
            style={{
              fontSize: 13,
              color: TOKENS.INK_60,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <ArrowLeft size={12} strokeWidth={2} /> Back to wizard
          </a>
        </div>
      </header>

      {/* Banner */}
      <div
        style={{
          background: TOKENS.WARN_BG,
          borderBottom: `1px solid ${TOKENS.WARN_BORDER}`,
          padding: "14px 32px",
        }}
      >
        <div
          style={{
            maxWidth: 1080,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              background: TOKENS.WARN_INK_STRONG,
              color: TOKENS.PAPER,
              padding: "3px 8px",
              borderRadius: 4,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              flexShrink: 0,
            }}
          >
            Pre-launch
          </span>
          <div style={{ fontSize: 13, color: TOKENS.WARN_INK, lineHeight: 1.5 }}>
            This audit log is stored in your browser (localStorage). In production,
            this data will be persisted server-side with retention and PII scrubbing
            per Tex. Bus. & Com. Code Ch. 541 (TDPSA).
          </div>
        </div>
      </div>

      {/* Title + summary */}
      <div
        style={{
          background: TOKENS.PAPER_2,
          borderBottom: `1px solid ${TOKENS.LINE}`,
          padding: "32px 32px",
        }}
      >
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <h1
            style={{
              fontSize: 32,
              fontWeight: 600,
              letterSpacing: "-0.025em",
              margin: "0 0 8px",
              lineHeight: 1.15,
            }}
          >
            Your wizard session — evidentiary record
          </h1>
          <p style={{ fontSize: 15, color: TOKENS.INK_60, margin: 0, lineHeight: 1.5, maxWidth: 720 }}>
            Every choice you made, every warning we showed, every acknowledgment
            you clicked. This is the complete record. If you (or a Texas attorney
            you engage later) ever need to verify what happened, it's all here.
          </p>

          {/* Summary stats */}
          <div
            style={{
              marginTop: 22,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 12,
            }}
          >
            <SummaryStat icon={Database} label="Total events" value={events.length} />
            <SummaryStat
              icon={FileText}
              label="Session ID"
              value={state?.sessionId?.slice(-12) || "—"}
              mono
            />
            <SummaryStat
              icon={FileText}
              label="Started"
              value={
                events[0]
                  ? new Date(events[0].timestamp).toLocaleString()
                  : "—"
              }
            />
            <SummaryStat
              icon={FileText}
              label="Last activity"
              value={
                events[events.length - 1]
                  ? new Date(events[events.length - 1].timestamp).toLocaleString()
                  : "—"
              }
            />
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div
        style={{
          borderBottom: `1px solid ${TOKENS.LINE}`,
          background: TOKENS.PAPER,
          padding: "14px 32px",
        }}
      >
        <div
          style={{
            maxWidth: 1080,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
            <Search
              size={14}
              strokeWidth={2}
              color={TOKENS.INK_40}
              style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}
            />
            <input
              type="text"
              placeholder="Search events…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 12px 9px 34px",
                fontSize: 13,
                fontFamily: FONTS.SANS,
                border: `1px solid ${TOKENS.LINE}`,
                borderRadius: 7,
                outline: "none",
                background: TOKENS.PAPER_2,
              }}
            />
          </div>
          <select
            value={eventTypeFilter}
            onChange={(e) => setEventTypeFilter(e.target.value)}
            style={{
              padding: "9px 12px",
              fontSize: 13,
              fontFamily: FONTS.SANS,
              border: `1px solid ${TOKENS.LINE}`,
              borderRadius: 7,
              background: TOKENS.PAPER_2,
              cursor: "pointer",
            }}
          >
            {eventTypes.map((t) => (
              <option key={t} value={t}>
                {t === "all" ? "All event types" : t}
              </option>
            ))}
          </select>
          <button
            onClick={handleExport}
            style={{
              padding: "9px 14px",
              fontSize: 13,
              fontWeight: 500,
              background: TOKENS.INK,
              color: TOKENS.PAPER,
              border: "none",
              borderRadius: 7,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Download size={13} strokeWidth={2} /> Export JSON
          </button>
          <button
            onClick={handleClear}
            style={{
              padding: "9px 14px",
              fontSize: 13,
              fontWeight: 500,
              background: TOKENS.PAPER,
              color: TOKENS.ERR_INK,
              border: `1px solid ${TOKENS.ERR_BORDER}`,
              borderRadius: 7,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Trash2 size={13} strokeWidth={2} /> Clear log
          </button>
        </div>
      </div>

      {/* Event table */}
      <main style={{ maxWidth: 1080, margin: "0 auto", padding: "32px 32px 80px" }}>
        {filteredEvents.length === 0 ? (
          <div
            style={{
              padding: "60px 32px",
              textAlign: "center",
              background: TOKENS.PAPER_2,
              border: `1px solid ${TOKENS.LINE}`,
              borderRadius: 12,
              color: TOKENS.INK_60,
            }}
          >
            <Database size={28} strokeWidth={1.5} color={TOKENS.INK_40} />
            <div style={{ marginTop: 12, fontSize: 14 }}>
              {events.length === 0
                ? "No audit events yet. Walk through the wizard to populate the log."
                : "No events match your filter."}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[...filteredEvents].reverse().map((event) => (
              <EventRow key={event.eventId} event={event} />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: `1px solid ${TOKENS.LINE}`,
          background: TOKENS.PAPER_2,
          padding: "24px 32px",
        }}
      >
        <div style={{ maxWidth: 1080, margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontSize: 11, color: TOKENS.INK_40, lineHeight: 1.6, maxWidth: 600, margin: "0 auto" }}>
            POA-IT is not a law firm and does not provide legal advice. The forms and
            information on this site are not a substitute for the advice of an attorney
            licensed in Texas. Tex. Gov't Code § 81.101(c).
          </div>
        </div>
      </footer>
    </div>
  );
}

function SummaryStat({ icon: Icon, label, value, mono }) {
  return (
    <div
      style={{
        background: TOKENS.PAPER,
        border: `1px solid ${TOKENS.LINE}`,
        borderRadius: 8,
        padding: "12px 14px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 10,
          fontFamily: FONTS.MONO,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: TOKENS.INK_40,
          fontWeight: 600,
          marginBottom: 6,
        }}
      >
        <Icon size={10} strokeWidth={2} />
        {label}
      </div>
      <div
        style={{
          fontSize: mono ? 13 : 16,
          fontWeight: 600,
          color: TOKENS.INK,
          fontFamily: mono ? FONTS.MONO : FONTS.SANS,
          letterSpacing: mono ? "0" : "-0.01em",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function EventRow({ event }) {
  const [expanded, setExpanded] = useState(false);
  const ts = new Date(event.timestamp);

  // Color-code event types for scannability
  const typeColor = {
    step_entered: TOKENS.ACCENT,
    step_completed: TOKENS.LIVE_GREEN,
    acknowledgment_recorded: TOKENS.LIVE_GREEN,
    warning_shown: TOKENS.WARN_INK_STRONG,
    attorney_referral_offered: TOKENS.REF_INK,
    attorney_referral_clicked: TOKENS.REF_INK,
    field_changed: TOKENS.INK_60,
    tooltip_opened: TOKENS.INK_40,
    wizard_completed: TOKENS.LIVE_GREEN,
    validation_blocked: TOKENS.ERR_INK,
    preview_generated: TOKENS.ACCENT,
  }[event.eventType] || TOKENS.INK_60;

  return (
    <div
      style={{
        background: TOKENS.PAPER,
        border: `1px solid ${TOKENS.LINE}`,
        borderRadius: 8,
        padding: "12px 14px",
        cursor: "pointer",
        transition: "all 0.15s",
      }}
      onClick={() => setExpanded(!expanded)}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: typeColor,
            flexShrink: 0,
          }}
        />
        <div
          style={{
            fontSize: 11,
            fontFamily: FONTS.MONO,
            color: TOKENS.INK_40,
            width: 110,
            flexShrink: 0,
          }}
        >
          {ts.toLocaleTimeString()}
        </div>
        <div
          style={{
            fontSize: 12,
            fontFamily: FONTS.MONO,
            color: typeColor,
            fontWeight: 600,
            flex: 1,
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {event.eventType}
        </div>
        <div
          style={{
            fontSize: 11,
            fontFamily: FONTS.MONO,
            color: TOKENS.INK_40,
            flexShrink: 0,
          }}
        >
          {event.eventId.slice(-8)}
        </div>
      </div>
      {expanded && (
        <div
          style={{
            marginTop: 12,
            paddingTop: 12,
            borderTop: `1px solid ${TOKENS.LINE}`,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontFamily: FONTS.MONO,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: TOKENS.INK_40,
              fontWeight: 600,
              marginBottom: 8,
            }}
          >
            Event data
          </div>
          <pre
            style={{
              margin: 0,
              fontSize: 11,
              fontFamily: FONTS.MONO,
              background: TOKENS.PAPER_2,
              padding: "10px 12px",
              borderRadius: 6,
              border: `1px solid ${TOKENS.LINE}`,
              color: TOKENS.INK,
              overflow: "auto",
              lineHeight: 1.5,
            }}
          >
            {JSON.stringify(event.eventData, null, 2)}
          </pre>
          <div style={{ marginTop: 8, fontSize: 10, fontFamily: FONTS.MONO, color: TOKENS.INK_40 }}>
            PII status: {event.piiScrubStatus} · Actor: {event.actor} · Full timestamp: {event.timestamp}
          </div>
        </div>
      )}
    </div>
  );
}
