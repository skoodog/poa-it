"use client";

import { Clock, Plus, Edit, Archive, RotateCcw, FileText, Shield, ShieldOff, Sparkles, MapPin, Mail, Send, AlertTriangle, Check } from "lucide-react";
import { TOKENS, FONTS } from "../wizard/shared/tokens";

/**
 * ActivityTimeline
 *
 * Vertical timeline rendering audit events for a single client. Sprint 3b
 * shows whatever events exist (client_created, client_updated, etc).
 * Sprints 4-7 will surface their own event types here: wizard_started,
 * document_generated, payment_completed, notarization_scheduled, etc.
 *
 * Designed to look credible when empty (just a single "client_created" event)
 * AND when rich (dozens of events over months). The visual rhythm comes from
 * the vertical line connecting events, with each event a small dot on the line.
 *
 * Props:
 *   events  — array of audit_events rows from the database
 *   loading — show skeleton state
 *   empty   — optional override message when events list is empty
 */

// Maps event types to icon + label + color. Add entries as new events appear.
const EVENT_DISPLAY = {
  client_created: { icon: Plus, label: "Client created", tone: "neutral" },
  client_updated: { icon: Edit, label: "Client details updated", tone: "neutral" },
  client_status_changed: { icon: Sparkles, label: "Status changed", tone: "info" },
  client_updated_with_status: { icon: Edit, label: "Client updated and status changed", tone: "info" },
  client_archived: { icon: Archive, label: "Client archived", tone: "warning" },
  client_restored: { icon: RotateCcw, label: "Client restored", tone: "neutral" },
  // Sprint 4+ event types — surface meaningfully when they appear
  wizard_started: { icon: Sparkles, label: "Wizard started", tone: "info" },
  step_completed: { icon: Clock, label: "Step completed", tone: "neutral" },
  document_generated: { icon: FileText, label: "Document generated", tone: "info" },
  // Sprint 7+
  notarization_scheduled: { icon: Clock, label: "Notarization scheduled", tone: "info" },
  notarization_completed: { icon: Shield, label: "Notarization completed", tone: "success" },
  // Sprint 4c — revocation lifecycle
  revocation_executed: { icon: ShieldOff, label: "Revocation executed", tone: "warning" },
  poa_status_changed: { icon: ShieldOff, label: "POA status changed", tone: "warning" },
  revocation_notice_status_changed: { icon: Mail, label: "Notice status updated", tone: "info" },
  revocation_recording_completed: { icon: MapPin, label: "County recording filed", tone: "success" },
  // Sprint 4d — institution presentation lifecycle
  presentation_generated: { icon: Send, label: "Institution packet generated", tone: "info" },
  presentation_status_changed: { icon: Send, label: "Institution response recorded", tone: "info" },
  // Sprint 5 — document lifecycle
  document_created: { icon: FileText, label: "Draft POA created", tone: "info" },
  document_locked_for_signing: { icon: Shield, label: "Locked for signing", tone: "success" },
  intake_link_created: { icon: Send, label: "Intake link sent to client", tone: "info" },
  intake_link_extended: { icon: Send, label: "Intake link extended", tone: "neutral" },
  // Sprint 6 (post-attorney-review correction): replacement detection +
  // attorney-review-required client intake. The platform surfaces the
  // situation; the legal call belongs to the attorney.
  document_attention_required: { icon: AlertTriangle, label: "Attorney review required", tone: "warning" },
  document_attention_dismissed: { icon: Check, label: "Attorney reviewed and dismissed flag", tone: "neutral" },
};

const TONE_COLORS = {
  neutral: { dot: TOKENS.INK_60, bg: TOKENS.PAPER_2, border: TOKENS.LINE },
  info: { dot: TOKENS.ACCENT, bg: "#EFF6FF", border: "#BFDBFE" },
  warning: { dot: "#D97706", bg: "#FFFBEB", border: "#FCD34D" },
  success: { dot: TOKENS.LIVE_GREEN, bg: "#ECFDF5", border: "#A7F3D0" },
};

export function ActivityTimeline({ events, loading, empty }) {
  if (loading) {
    return (
      <div style={{ padding: "20px 0", fontFamily: FONTS.SANS }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              display: "flex",
              gap: 14,
              alignItems: "flex-start",
              marginBottom: 16,
              opacity: 0.4,
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: TOKENS.LINE,
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1 }}>
              <div
                style={{
                  height: 12,
                  width: "60%",
                  background: TOKENS.LINE,
                  borderRadius: 4,
                  marginBottom: 6,
                }}
              />
              <div
                style={{
                  height: 10,
                  width: "30%",
                  background: TOKENS.LINE,
                  borderRadius: 4,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div
        style={{
          padding: "32px 24px",
          textAlign: "center",
          background: TOKENS.PAPER_2,
          border: `1px dashed ${TOKENS.LINE}`,
          borderRadius: 8,
          fontFamily: FONTS.SANS,
        }}
      >
        <Clock
          size={20}
          strokeWidth={1.6}
          color={TOKENS.INK_40}
          style={{ marginBottom: 8 }}
        />
        <div style={{ fontSize: 13, color: TOKENS.INK_60, lineHeight: 1.5 }}>
          {empty ||
            "Activity events will appear here as this client moves through the wizard, document generation, and notarization."}
        </div>
      </div>
    );
  }

  // Sort newest-first for display
  const sortedEvents = [...events].sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  );

  return (
    <div
      style={{
        position: "relative",
        padding: "8px 0",
        fontFamily: FONTS.SANS,
      }}
    >
      {/* Vertical line connecting dots */}
      <div
        style={{
          position: "absolute",
          left: 13,
          top: 14,
          bottom: 14,
          width: 1,
          background: TOKENS.LINE,
        }}
      />

      {sortedEvents.map((event) => (
        <TimelineRow key={event.id} event={event} />
      ))}
    </div>
  );
}

function TimelineRow({ event }) {
  const display = EVENT_DISPLAY[event.eventType] || {
    icon: Clock,
    label: humanizeEventType(event.eventType),
    tone: "neutral",
  };
  const tone = TONE_COLORS[display.tone] || TONE_COLORS.neutral;
  const Icon = display.icon;

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        gap: 14,
        alignItems: "flex-start",
        padding: "8px 0",
      }}
    >
      {/* Dot */}
      <div
        style={{
          width: 27,
          height: 27,
          borderRadius: "50%",
          background: tone.bg,
          border: `1.5px solid ${tone.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: tone.dot,
          flexShrink: 0,
          zIndex: 1,
          position: "relative",
        }}
      >
        <Icon size={12} strokeWidth={2} />
      </div>

      {/* Event content */}
      <div style={{ flex: 1, minWidth: 0, paddingTop: 4 }}>
        <div
          style={{
            fontSize: 13.5,
            fontWeight: 500,
            color: TOKENS.INK,
            letterSpacing: "-0.005em",
            marginBottom: 2,
            lineHeight: 1.4,
          }}
        >
          {display.label}
        </div>
        <div
          style={{
            fontSize: 11,
            color: TOKENS.INK_40,
            fontFamily: FONTS.MONO,
            letterSpacing: "0.03em",
          }}
        >
          {formatTimestamp(event.timestamp)}
          {event.actor && event.actor !== "user" && (
            <span style={{ marginLeft: 8 }}>· by {event.actor}</span>
          )}
        </div>
      </div>
    </div>
  );
}

function humanizeEventType(eventType) {
  return eventType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMin = Math.floor((now - date) / 60000);
  const diffHr = Math.floor((now - date) / 3600000);
  const diffDay = Math.floor((now - date) / 86400000);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay === 1) return "yesterday";
  if (diffDay < 7) return `${diffDay}d ago`;

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
