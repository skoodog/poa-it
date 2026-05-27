"use client";

import { useState } from "react";
import {
  Mail,
  MapPin,
  Phone,
  User,
  Building2,
  Loader2,
  Check,
  X,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { TOKENS, FONTS } from "../wizard/shared/tokens";

/**
 * NoticeTracker
 *
 * Lists every recipient on a revocation with their current delivery status
 * and the actions a user can take to advance that status. This is the
 * post-execution lifecycle UI Sprint 4c R3 ships.
 *
 * For Sprint 4c, the tracker is MANUAL — the user marks notices as sent,
 * delivered, acknowledged, refused, or bounced based on their own outbound
 * activity (sending emails, mailing certified letters, etc.). Sprint 7
 * will wire real email delivery via Resend so "sent" becomes automatic.
 *
 * Visual treatment:
 *   - "Queued" = neutral gray
 *   - "Sent" / "Delivered" / "Opened" = blue (in-progress)
 *   - "Acknowledged" = green (best outcome — confirmed notice)
 *   - "Refused" = amber (still counts as notice but flag for follow-up)
 *   - "Bounced" = red (delivery failed; this notice is not effective)
 */

const STATUS_CONFIG = {
  queued: {
    label: "Queued",
    bg: "#E5E7EB",
    color: "#374151",
    icon: Clock,
  },
  sent: {
    label: "Sent",
    bg: "#DBEAFE",
    color: "#1E40AF",
    icon: Mail,
  },
  delivered: {
    label: "Delivered",
    bg: "#DBEAFE",
    color: "#1E40AF",
    icon: Check,
  },
  opened: {
    label: "Opened",
    bg: "#DBEAFE",
    color: "#1E40AF",
    icon: Check,
  },
  acknowledged: {
    label: "Acknowledged",
    bg: "#D1FAE5",
    color: "#065F46",
    icon: Check,
  },
  refused: {
    label: "Refused",
    bg: "#FEF3C7",
    color: "#92400E",
    icon: AlertTriangle,
  },
  bounced: {
    label: "Bounced",
    bg: "#FEE2E2",
    color: "#991B1B",
    icon: X,
  },
};

const RECIPIENT_TYPE_LABELS = {
  agent: "Original Agent",
  successor_agent: "Successor Agent",
  institution: "Institution",
  family_contact: "Family Member",
  law_firm: "Law Firm",
  other: "Other",
};

const DELIVERY_METHOD_LABELS = {
  email: "Email",
  certified_mail: "Certified Mail",
  regular_mail: "Regular Mail",
  in_person: "In Person",
  fax: "Fax",
  other: "Other",
};

const RECIPIENT_TYPE_ICONS = {
  agent: User,
  successor_agent: User,
  institution: Building2,
  family_contact: User,
  law_firm: Building2,
  other: User,
};

export function NoticeTracker({ revocationId, notices, onNoticeUpdated }) {
  if (!notices || notices.length === 0) {
    return (
      <div
        style={{
          padding: 24,
          background: TOKENS.PAPER_2,
          border: `1px dashed ${TOKENS.LINE}`,
          borderRadius: 10,
          textAlign: "center",
          fontSize: 13,
          color: TOKENS.INK_60,
          lineHeight: 1.55,
          fontFamily: FONTS.SANS,
        }}
      >
        No recipients were captured for this revocation. If this is
        unexpected, you may need to add recipients before notice tracking
        becomes useful.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {notices.map((notice) => (
        <NoticeRow
          key={notice.id}
          revocationId={revocationId}
          notice={notice}
          onUpdated={onNoticeUpdated}
        />
      ))}
    </div>
  );
}

function NoticeRow({ revocationId, notice, onUpdated }) {
  const [updating, setUpdating] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [notesDraft, setNotesDraft] = useState(notice.acknowledgmentNotes || "");
  const [trackingDraft, setTrackingDraft] = useState(notice.trackingNumber || "");

  const status = STATUS_CONFIG[notice.deliveryStatus] || STATUS_CONFIG.queued;
  const StatusIcon = status.icon;
  const RecipientIcon = RECIPIENT_TYPE_ICONS[notice.recipientType] || User;
  const isTerminal =
    notice.deliveryStatus === "acknowledged" ||
    notice.deliveryStatus === "refused" ||
    notice.deliveryStatus === "bounced";

  async function updateStatus(newStatus, extraFields = {}) {
    setUpdating(true);
    try {
      const res = await fetch(
        `/api/revocations/${revocationId}/notices/${notice.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            deliveryStatus: newStatus,
            ...extraFields,
          }),
        }
      );
      if (!res.ok) throw new Error("Failed to update notice");
      const data = await res.json();
      onUpdated?.(data.notice);
    } catch (err) {
      console.error(err);
      alert("Could not update notice: " + err.message);
    } finally {
      setUpdating(false);
    }
  }

  async function saveNotes() {
    setUpdating(true);
    try {
      const res = await fetch(
        `/api/revocations/${revocationId}/notices/${notice.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            acknowledgmentNotes: notesDraft,
            trackingNumber: trackingDraft,
          }),
        }
      );
      if (!res.ok) throw new Error("Failed to save notes");
      const data = await res.json();
      onUpdated?.(data.notice);
    } catch (err) {
      console.error(err);
      alert("Could not save notes: " + err.message);
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div
      style={{
        padding: 14,
        background: TOKENS.PAPER,
        border: `1px solid ${TOKENS.LINE}`,
        borderRadius: 10,
        fontFamily: FONTS.SANS,
      }}
    >
      {/* Header row — recipient + status badge */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: TOKENS.PAPER_2,
            border: `1px solid ${TOKENS.LINE}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            color: TOKENS.INK_60,
          }}
        >
          <RecipientIcon size={14} strokeWidth={1.8} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: TOKENS.INK,
              marginBottom: 2,
            }}
          >
            {notice.recipientName}
            {notice.recipientInstitutionName && (
              <span
                style={{
                  marginLeft: 6,
                  fontSize: 12,
                  fontWeight: 500,
                  color: TOKENS.INK_60,
                }}
              >
                · {notice.recipientInstitutionName}
              </span>
            )}
          </div>
          <div
            style={{
              fontSize: 11.5,
              color: TOKENS.INK_60,
              fontFamily: FONTS.MONO,
              letterSpacing: 0.2,
            }}
          >
            {RECIPIENT_TYPE_LABELS[notice.recipientType] || notice.recipientType}
            {" · "}
            {DELIVERY_METHOD_LABELS[notice.deliveryMethod] || notice.deliveryMethod}
          </div>
        </div>

        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "4px 9px",
            background: status.bg,
            color: status.color,
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: 0.2,
            whiteSpace: "nowrap",
          }}
        >
          <StatusIcon size={10} strokeWidth={2.5} />
          {status.label}
        </span>
      </div>

      {/* Contact info row */}
      <div
        style={{
          marginTop: 10,
          paddingTop: 10,
          borderTop: `1px dashed ${TOKENS.LINE}`,
          display: "flex",
          flexWrap: "wrap",
          gap: "6px 14px",
          fontSize: 12,
          color: TOKENS.INK_60,
        }}
      >
        {notice.recipientEmail && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <Mail size={11} strokeWidth={1.8} />
            {notice.recipientEmail}
          </span>
        )}
        {notice.recipientPhone && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <Phone size={11} strokeWidth={1.8} />
            {notice.recipientPhone}
          </span>
        )}
        {(notice.recipientAddress || notice.recipientCity) && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <MapPin size={11} strokeWidth={1.8} />
            {[
              notice.recipientAddress,
              notice.recipientCity,
              notice.recipientState,
              notice.recipientZip,
            ]
              .filter(Boolean)
              .join(", ")}
          </span>
        )}
      </div>

      {/* Status actions */}
      {!isTerminal && (
        <div
          style={{
            marginTop: 12,
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
          }}
        >
          {notice.deliveryStatus === "queued" && (
            <ActionButton
              label="Mark as Sent"
              icon={Mail}
              onClick={() => updateStatus("sent")}
              disabled={updating}
            />
          )}
          {(notice.deliveryStatus === "sent" || notice.deliveryStatus === "opened") && (
            <ActionButton
              label="Mark as Delivered"
              icon={Check}
              onClick={() => updateStatus("delivered")}
              disabled={updating}
            />
          )}
          {(notice.deliveryStatus === "sent" ||
            notice.deliveryStatus === "delivered" ||
            notice.deliveryStatus === "opened") && (
            <ActionButton
              label="Mark as Acknowledged"
              icon={Check}
              variant="success"
              onClick={() => updateStatus("acknowledged")}
              disabled={updating}
            />
          )}
          {(notice.deliveryStatus === "sent" ||
            notice.deliveryStatus === "delivered" ||
            notice.deliveryStatus === "opened") && (
            <ActionButton
              label="Mark as Refused"
              icon={AlertTriangle}
              variant="warning"
              onClick={() => updateStatus("refused")}
              disabled={updating}
            />
          )}
          {(notice.deliveryStatus === "sent" || notice.deliveryStatus === "queued") && (
            <ActionButton
              label="Mark as Bounced"
              icon={X}
              variant="danger"
              onClick={() => updateStatus("bounced")}
              disabled={updating}
            />
          )}
          <ActionButton
            label={expanded ? "Hide details" : "Add tracking/notes"}
            onClick={() => setExpanded(!expanded)}
            variant="ghost"
            disabled={updating}
          />
        </div>
      )}

      {isTerminal && (
        <div
          style={{
            marginTop: 12,
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 12,
            color: TOKENS.INK_60,
          }}
        >
          {notice.acknowledgmentReceivedAt && (
            <span>
              Acknowledged{" "}
              {new Date(notice.acknowledgmentReceivedAt).toLocaleDateString()}
            </span>
          )}
          {notice.refusedAt && (
            <span>Refused {new Date(notice.refusedAt).toLocaleDateString()}</span>
          )}
          {notice.bouncedAt && (
            <span>Bounced {new Date(notice.bouncedAt).toLocaleDateString()}</span>
          )}
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            style={{
              background: "transparent",
              border: "none",
              color: TOKENS.INK_60,
              fontSize: 12,
              cursor: "pointer",
              textDecoration: "underline",
              padding: 0,
            }}
          >
            {expanded ? "Hide details" : "Show details"}
          </button>
        </div>
      )}

      {/* Expanded notes/tracking */}
      {expanded && (
        <div
          style={{
            marginTop: 12,
            paddingTop: 12,
            borderTop: `1px solid ${TOKENS.LINE}`,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <FieldRow
            label="Tracking number (USPS / FedEx / certified mail)"
            value={trackingDraft}
            onChange={setTrackingDraft}
            placeholder="e.g., 9214 8901 0661 ..."
          />
          <FieldRow
            label="Notes (acknowledgment evidence, refusal reason, etc.)"
            value={notesDraft}
            onChange={setNotesDraft}
            placeholder="Optional"
            multiline
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={saveNotes}
              disabled={updating}
              style={{
                padding: "7px 12px",
                background: TOKENS.INK,
                color: TOKENS.PAPER,
                border: "none",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                cursor: updating ? "not-allowed" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {updating ? <Loader2 size={11} className="animate-spin" /> : null}
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ActionButton({
  label,
  icon: Icon,
  onClick,
  disabled,
  variant = "default",
}) {
  const styles = {
    default: { bg: TOKENS.PAPER, color: TOKENS.INK, border: TOKENS.LINE },
    success: { bg: "#D1FAE5", color: "#065F46", border: "#A7F3D0" },
    warning: { bg: "#FEF3C7", color: "#92400E", border: "#FDE68A" },
    danger: { bg: "#FEE2E2", color: "#991B1B", border: "#FECACA" },
    ghost: { bg: "transparent", color: TOKENS.INK_60, border: "transparent" },
  }[variant];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "6px 10px",
        background: styles.bg,
        color: styles.color,
        border: `1px solid ${styles.border}`,
        borderRadius: 6,
        fontSize: 11.5,
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {Icon && <Icon size={11} strokeWidth={2.2} />}
      {label}
    </button>
  );
}

function FieldRow({ label, value, onChange, placeholder, multiline }) {
  return (
    <div>
      <label
        style={{
          display: "block",
          fontSize: 11,
          fontFamily: FONTS.MONO,
          textTransform: "uppercase",
          letterSpacing: 0.6,
          color: TOKENS.INK_60,
          fontWeight: 600,
          marginBottom: 4,
        }}
      >
        {label}
      </label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          style={{
            width: "100%",
            padding: 8,
            background: TOKENS.PAPER,
            border: `1px solid ${TOKENS.LINE}`,
            borderRadius: 6,
            fontSize: 13,
            fontFamily: FONTS.SANS,
            color: TOKENS.INK,
            resize: "vertical",
            boxSizing: "border-box",
          }}
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            width: "100%",
            padding: "8px 10px",
            background: TOKENS.PAPER,
            border: `1px solid ${TOKENS.LINE}`,
            borderRadius: 6,
            fontSize: 13,
            fontFamily: FONTS.SANS,
            color: TOKENS.INK,
            boxSizing: "border-box",
          }}
        />
      )}
    </div>
  );
}
