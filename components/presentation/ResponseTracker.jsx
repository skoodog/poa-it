"use client";

import { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  FileQuestion,
  Clock,
  Plus,
  Loader2,
  Pencil,
  X,
} from "lucide-react";
import { TOKENS, FONTS } from "../wizard/shared/tokens";
import {
  PRESENTATION_RESPONSE_TYPES,
  getPresentationResponseTypeDisplay,
} from "../../lib/taxonomy/poaTaxonomy";

/**
 * ResponseTracker
 *
 * Records institution responses to a presentation packet. Analog of the
 * revocation NoticeTracker. Each response is captured manually (Sprint 4d
 * is asynchronous; email orchestration is Sprint 7).
 *
 * Sprint 4d Round 3.
 */

const TONE_STYLES = {
  success: { bg: "#D1FAE5", color: "#065F46", border: "#A7F3D0", icon: CheckCircle2 },
  danger: { bg: "#FEE2E2", color: "#991B1B", border: "#FCA5A5", icon: XCircle },
  warning: { bg: "#FEF3C7", color: "#92400E", border: "#FDE68A", icon: FileQuestion },
  info: { bg: "#DBEAFE", color: "#1E40AF", border: "#BFDBFE", icon: Clock },
  neutral: { bg: "#E5E7EB", color: "#374151", border: "#D1D5DB", icon: Clock },
};

// Response types that need a refusal reason / requested items field
const NEEDS_REASON = new Set(["rejected"]);
const NEEDS_REQUESTED_ITEMS = new Set([
  "requested_certification",
  "requested_opinion",
  "requested_translation",
]);

export function ResponseTracker({ presentationId, responses, presentationStatus, onResponseRecorded }) {
  const [showForm, setShowForm] = useState(false);

  const canRecord = presentationStatus !== "draft";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, fontFamily: FONTS.SANS }}>
      {responses && responses.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {responses.map((response) => (
            <ResponseRow
              key={response.id}
              presentationId={presentationId}
              response={response}
              onUpdated={onResponseRecorded}
            />
          ))}
        </div>
      ) : (
        <div
          style={{
            padding: 20,
            background: TOKENS.PAPER_2,
            border: `1px dashed ${TOKENS.LINE}`,
            borderRadius: 10,
            textAlign: "center",
            fontSize: 13,
            color: TOKENS.INK_60,
            lineHeight: 1.55,
          }}
        >
          No responses recorded yet. When the institution responds to the
          packet, record their answer here to track the lifecycle.
        </div>
      )}

      {showForm ? (
        <RecordResponseForm
          presentationId={presentationId}
          onCancel={() => setShowForm(false)}
          onRecorded={(data) => {
            setShowForm(false);
            onResponseRecorded?.(data);
          }}
        />
      ) : (
        canRecord && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "10px 16px",
              background: TOKENS.INK,
              color: TOKENS.PAPER,
              border: "none",
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              alignSelf: "flex-start",
            }}
          >
            <Plus size={14} strokeWidth={2.5} /> Record institution response
          </button>
        )
      )}

      {!canRecord && (
        <div style={{ fontSize: 12.5, color: TOKENS.INK_60, fontStyle: "italic" }}>
          Generate the packet before recording institution responses.
        </div>
      )}
    </div>
  );
}

function ResponseRow({ presentationId, response, onUpdated }) {
  const [editing, setEditing] = useState(false);
  const display = getPresentationResponseTypeDisplay(response.responseType);
  const tone = TONE_STYLES[display.tone] || TONE_STYLES.neutral;
  const ToneIcon = tone.icon;

  if (editing) {
    return (
      <RecordResponseForm
        presentationId={presentationId}
        existing={response}
        onCancel={() => setEditing(false)}
        onRecorded={(data) => {
          setEditing(false);
          onUpdated?.(data);
        }}
      />
    );
  }

  return (
    <div
      style={{
        padding: "14px 16px",
        background: TOKENS.PAPER,
        border: `1px solid ${TOKENS.LINE}`,
        borderRadius: 8,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: tone.bg,
            border: `1px solid ${tone.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: tone.color,
            flexShrink: 0,
          }}
        >
          <ToneIcon size={15} strokeWidth={2} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: TOKENS.INK }}>
            {display.displayName}
          </div>
          <div style={{ fontSize: 11.5, color: TOKENS.INK_60, fontFamily: FONTS.MONO }}>
            {new Date(response.respondedAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setEditing(true)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "5px 9px",
            background: "transparent",
            color: TOKENS.INK_60,
            border: `1px solid ${TOKENS.LINE}`,
            borderRadius: 6,
            fontSize: 11.5,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          <Pencil size={11} strokeWidth={2} /> Edit
        </button>
      </div>

      {response.refusalReason && (
        <div style={{ marginTop: 10, paddingLeft: 40 }}>
          <DetailLabel>Refusal reason</DetailLabel>
          <div style={{ fontSize: 13, color: TOKENS.INK, lineHeight: 1.5 }}>
            {response.refusalReason}
          </div>
        </div>
      )}

      {Array.isArray(response.requestedItems) && response.requestedItems.length > 0 && (
        <div style={{ marginTop: 10, paddingLeft: 40 }}>
          <DetailLabel>Requested items</DetailLabel>
          <ul style={{ margin: 0, paddingLeft: 16 }}>
            {response.requestedItems.map((item, i) => (
              <li key={i} style={{ fontSize: 13, color: TOKENS.INK, marginBottom: 2 }}>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {response.notes && (
        <div style={{ marginTop: 10, paddingLeft: 40 }}>
          <DetailLabel>Notes</DetailLabel>
          <div style={{ fontSize: 13, color: TOKENS.INK_60, lineHeight: 1.5 }}>
            {response.notes}
          </div>
        </div>
      )}
    </div>
  );
}

function RecordResponseForm({ presentationId, existing, onCancel, onRecorded }) {
  const [responseType, setResponseType] = useState(existing?.responseType || "");
  const [refusalReason, setRefusalReason] = useState(existing?.refusalReason || "");
  const [requestedItemsText, setRequestedItemsText] = useState(
    Array.isArray(existing?.requestedItems) ? existing.requestedItems.join("\n") : ""
  );
  const [notes, setNotes] = useState(existing?.notes || "");
  const [respondedAt, setRespondedAt] = useState(
    existing?.respondedAt
      ? new Date(existing.respondedAt).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10)
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const needsReason = NEEDS_REASON.has(responseType);
  const needsItems = NEEDS_REQUESTED_ITEMS.has(responseType);
  const isValid =
    responseType && (!needsReason || refusalReason.trim().length > 0);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const requestedItems = requestedItemsText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        responseType,
        refusalReason: needsReason ? refusalReason : null,
        requestedItems: needsItems ? requestedItems : [],
        notes,
        respondedAt,
      };

      const url = existing
        ? `/api/presentations/${presentationId}/responses/${existing.id}`
        : `/api/presentations/${presentationId}/respond`;
      const method = existing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || `Failed (${res.status})`);
      }
      const data = await res.json();
      onRecorded?.(data);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        padding: 18,
        background: TOKENS.PAPER_2,
        border: `1px solid ${TOKENS.LINE}`,
        borderRadius: 10,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 14,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 600, color: TOKENS.INK }}>
          {existing ? "Edit response" : "Record institution response"}
        </div>
        <button
          type="button"
          onClick={onCancel}
          style={{
            background: "transparent",
            border: "none",
            color: TOKENS.INK_60,
            cursor: "pointer",
            padding: 2,
          }}
          aria-label="Cancel"
        >
          <X size={16} strokeWidth={2} />
        </button>
      </div>

      <FieldLabel>Response type</FieldLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
        {PRESENTATION_RESPONSE_TYPES.map((rt) => (
          <button
            key={rt.key}
            type="button"
            onClick={() => setResponseType(rt.key)}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              padding: "10px 12px",
              background: responseType === rt.key ? TOKENS.PAPER : "transparent",
              border: `1.5px solid ${responseType === rt.key ? TOKENS.INK : TOKENS.LINE}`,
              borderRadius: 7,
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: 8,
                border: `2px solid ${responseType === rt.key ? TOKENS.INK : TOKENS.INK_60}`,
                background: responseType === rt.key ? TOKENS.INK : "transparent",
                flexShrink: 0,
                marginTop: 1,
              }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: TOKENS.INK }}>
                {rt.displayName}
              </div>
              <div style={{ fontSize: 12, color: TOKENS.INK_60, lineHeight: 1.45, marginTop: 1 }}>
                {rt.summary}
              </div>
            </div>
          </button>
        ))}
      </div>

      <FieldLabel>Date of response</FieldLabel>
      <input
        type="date"
        value={respondedAt}
        onChange={(e) => setRespondedAt(e.target.value)}
        style={{
          width: "100%",
          padding: "9px 12px",
          fontSize: 13,
          fontFamily: FONTS.SANS,
          border: `1px solid ${TOKENS.LINE}`,
          borderRadius: 6,
          marginBottom: 14,
          color: TOKENS.INK,
          background: TOKENS.PAPER,
          outline: "none",
        }}
      />

      {needsReason && (
        <>
          <FieldLabel>Refusal reason (required)</FieldLabel>
          <textarea
            value={refusalReason}
            onChange={(e) => setRefusalReason(e.target.value)}
            rows={2}
            placeholder="Why did the institution refuse to accept the POA?"
            style={textareaStyle}
          />
        </>
      )}

      {needsItems && (
        <>
          <FieldLabel>Requested items (one per line)</FieldLabel>
          <textarea
            value={requestedItemsText}
            onChange={(e) => setRequestedItemsText(e.target.value)}
            rows={3}
            placeholder={"e.g.\nAgent certification per § 751.203\nOpinion of counsel"}
            style={textareaStyle}
          />
        </>
      )}

      <FieldLabel>Notes (optional)</FieldLabel>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
        placeholder="Any additional context about this response."
        style={textareaStyle}
      />

      {error && (
        <div
          style={{
            padding: 8,
            background: "#FEE2E2",
            border: "1px solid #FCA5A5",
            borderRadius: 6,
            color: "#991B1B",
            fontSize: 12.5,
            marginBottom: 12,
          }}
        >
          {error}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: "9px 14px",
            background: "transparent",
            color: TOKENS.INK_60,
            border: "none",
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!isValid || saving}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "9px 16px",
            background: isValid ? TOKENS.INK : TOKENS.LINE,
            color: TOKENS.PAPER,
            border: "none",
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 600,
            cursor: isValid && !saving ? "pointer" : "not-allowed",
          }}
        >
          {saving && <Loader2 size={13} strokeWidth={2.2} className="spin" />}
          {saving ? "Saving…" : existing ? "Save changes" : "Record response"}
        </button>
      </div>

      <style jsx>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

const textareaStyle = {
  width: "100%",
  padding: "9px 12px",
  fontSize: 13,
  fontFamily: "inherit",
  border: "1px solid #E4E4E7",
  borderRadius: 6,
  marginBottom: 14,
  resize: "vertical",
  color: "#0A0A0A",
  background: "#FFFFFF",
  outline: "none",
};

function FieldLabel({ children }) {
  return (
    <div
      style={{
        fontSize: 10.5,
        fontFamily: FONTS.MONO,
        color: TOKENS.INK_60,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        fontWeight: 600,
        marginBottom: 6,
      }}
    >
      {children}
    </div>
  );
}

function DetailLabel({ children }) {
  return (
    <div
      style={{
        fontSize: 10,
        fontFamily: FONTS.MONO,
        color: TOKENS.INK_60,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        fontWeight: 600,
        marginBottom: 3,
      }}
    >
      {children}
    </div>
  );
}
