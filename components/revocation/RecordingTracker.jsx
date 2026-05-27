"use client";

import { useState } from "react";
import { MapPin, Loader2, Check, FileText } from "lucide-react";
import { TOKENS, FONTS } from "../wizard/shared/tokens";

/**
 * RecordingTracker
 *
 * Lists every county recording for a revocation. For each, the user can
 * fill in recording details after they've actually filed at the county
 * clerk: recording date, document number, book/page reference, fees paid.
 *
 * Sprint 4c — Round 3. Recording itself is a real-world act the user
 * performs at the county clerk's office; this UI just captures the
 * resulting metadata so it's part of the audit record.
 */

export function RecordingTracker({ revocationId, recordings, onRecordingUpdated }) {
  if (!recordings || recordings.length === 0) {
    return (
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
          fontFamily: FONTS.SANS,
        }}
      >
        No county recordings were captured for this revocation. If the
        original POA was used for a real-property transaction and was
        recorded with a county clerk, that recording was likely missed —
        consider creating a follow-up record manually.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {recordings.map((rec) => (
        <RecordingRow
          key={rec.id}
          revocationId={revocationId}
          recording={rec}
          onUpdated={onRecordingUpdated}
        />
      ))}
    </div>
  );
}

function RecordingRow({ revocationId, recording, onUpdated }) {
  const [updating, setUpdating] = useState(false);
  const [expanded, setExpanded] = useState(!recording.recordedAt);

  const [docNum, setDocNum] = useState(recording.recordingDocumentNumber || "");
  const [bookPage, setBookPage] = useState(recording.recordingBookPage || "");
  const [fees, setFees] = useState(recording.recordingFeesPaid || "");
  const [notes, setNotes] = useState(recording.notes || "");
  const [recordedDate, setRecordedDate] = useState(
    recording.recordedAt
      ? new Date(recording.recordedAt).toISOString().slice(0, 10)
      : ""
  );

  const isRecorded = !!recording.recordedAt;

  async function save({ markRecorded = false } = {}) {
    setUpdating(true);
    try {
      const body = {
        recordingDocumentNumber: docNum,
        recordingBookPage: bookPage,
        recordingFeesPaid: fees,
        notes,
      };
      if (markRecorded || recordedDate) {
        body.recordedAt = recordedDate
          ? new Date(recordedDate).toISOString()
          : new Date().toISOString();
      }
      const res = await fetch(
        `/api/revocations/${revocationId}/recordings/${recording.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      if (!res.ok) throw new Error("Failed to save recording");
      const data = await res.json();
      onUpdated?.(data.recording);
      if (markRecorded) setExpanded(false);
    } catch (err) {
      console.error(err);
      alert("Could not save recording: " + err.message);
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div
      style={{
        padding: 14,
        background: isRecorded ? "#F0FDF4" : TOKENS.PAPER,
        border: `1px solid ${isRecorded ? "#BBF7D0" : TOKENS.LINE}`,
        borderRadius: 10,
        fontFamily: FONTS.SANS,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: isRecorded ? "#BBF7D0" : TOKENS.PAPER_2,
            border: isRecorded ? "1px solid #86EFAC" : `1px solid ${TOKENS.LINE}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            color: isRecorded ? "#065F46" : TOKENS.INK_60,
          }}
        >
          <MapPin size={14} strokeWidth={1.8} />
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
            {recording.countyName} County
            {recording.state && (
              <span
                style={{
                  marginLeft: 6,
                  fontSize: 12,
                  fontWeight: 500,
                  color: TOKENS.INK_60,
                }}
              >
                · {recording.state}
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
            {isRecorded ? (
              <>
                Recorded {new Date(recording.recordedAt).toLocaleDateString()}
                {recording.recordingDocumentNumber && (
                  <> · Doc #{recording.recordingDocumentNumber}</>
                )}
              </>
            ) : (
              "Not yet recorded"
            )}
          </div>
        </div>
        {isRecorded ? (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "4px 9px",
              background: "#D1FAE5",
              color: "#065F46",
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: 0.2,
            }}
          >
            <Check size={10} strokeWidth={2.5} />
            Recorded
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            style={{
              padding: "6px 10px",
              background: TOKENS.PAPER,
              color: TOKENS.INK,
              border: `1px solid ${TOKENS.LINE}`,
              borderRadius: 6,
              fontSize: 11.5,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {expanded ? "Hide" : "Add recording details"}
          </button>
        )}
      </div>

      {recording.notes && !expanded && (
        <div
          style={{
            marginTop: 8,
            fontSize: 12,
            color: TOKENS.INK_60,
            fontStyle: "italic",
            paddingTop: 8,
            borderTop: `1px dashed ${TOKENS.LINE}`,
          }}
        >
          {recording.notes}
        </div>
      )}

      {expanded && (
        <div
          style={{
            marginTop: 14,
            paddingTop: 12,
            borderTop: `1px solid ${TOKENS.LINE}`,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <FieldRow
              label="Recording date"
              type="date"
              value={recordedDate}
              onChange={setRecordedDate}
            />
            <FieldRow
              label="Document / instrument number"
              value={docNum}
              onChange={setDocNum}
              placeholder="e.g., 2026-001234"
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <FieldRow
              label="Book / page reference"
              value={bookPage}
              onChange={setBookPage}
              placeholder="e.g., Vol. 5421 Pg. 218"
            />
            <FieldRow
              label="Fees paid"
              value={fees}
              onChange={setFees}
              placeholder="e.g., $26.00"
            />
          </div>
          <FieldRow
            label="Notes"
            value={notes}
            onChange={setNotes}
            placeholder="Optional"
            multiline
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={() => save({ markRecorded: true })}
              disabled={updating}
              style={{
                padding: "8px 14px",
                background: TOKENS.INK,
                color: TOKENS.PAPER,
                border: "none",
                borderRadius: 6,
                fontSize: 12.5,
                fontWeight: 600,
                cursor: updating ? "not-allowed" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {updating ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} strokeWidth={2.4} />}
              {isRecorded ? "Save changes" : "Mark as Recorded"}
            </button>
            {!isRecorded && (
              <button
                type="button"
                onClick={() => save()}
                disabled={updating}
                style={{
                  padding: "8px 14px",
                  background: "transparent",
                  color: TOKENS.INK_60,
                  border: `1px solid ${TOKENS.LINE}`,
                  borderRadius: 6,
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: updating ? "not-allowed" : "pointer",
                }}
              >
                Save without marking recorded
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function FieldRow({ label, value, onChange, placeholder, multiline, type = "text" }) {
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
          rows={2}
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
          type={type}
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
