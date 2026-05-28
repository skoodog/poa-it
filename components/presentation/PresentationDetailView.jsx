"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Send,
  ArrowLeft,
  Building2,
  User,
  Calendar,
  FileText,
  Eye,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { TOKENS, FONTS } from "../wizard/shared/tokens";
import { ResponseTracker } from "./ResponseTracker";
import {
  getPresentationStatusDisplay,
  getPowerByKey,
} from "../../lib/taxonomy/poaTaxonomy";

/**
 * PresentationDetailView
 *
 * Post-generation workspace surface for a single institution presentation.
 * Shows summary metadata + response tracker. Users land here after
 * generating a packet, and return as the institution responds.
 *
 * Sprint 4d Round 3.
 */

const STATUS_TONE = {
  neutral: { bg: "#E5E7EB", color: "#374151" },
  info: { bg: "#DBEAFE", color: "#1E40AF" },
  success: { bg: "#D1FAE5", color: "#065F46" },
  warning: { bg: "#FEF3C7", color: "#92400E" },
  danger: { bg: "#FEE2E2", color: "#991B1B" },
};

export function PresentationDetailView({ presentation, client }) {
  const router = useRouter();
  const [responses, setResponses] = useState(presentation.responses || []);
  const [previewing, setPreviewing] = useState(false);
  const [previewError, setPreviewError] = useState(null);

  const statusDisplay = getPresentationStatusDisplay(presentation.status);
  const statusTone = STATUS_TONE[statusDisplay.tone] || STATUS_TONE.neutral;

  const isRevoked = presentation.originalPoaStatus === "revoked";
  const isSuperseded = presentation.originalPoaStatus === "superseded";

  function onResponseRecorded() {
    // Reload to pick up the recomputed presentation status + new response
    router.refresh();
  }

  async function handlePreview() {
    setPreviewing(true);
    setPreviewError(null);
    try {
      const res = await fetch("/api/presentations/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ presentationId: presentation.id }),
      });
      if (!res.ok) throw new Error(`Preview failed (${res.status})`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch (err) {
      setPreviewError(err.message);
    } finally {
      setPreviewing(false);
    }
  }

  const selectedPowers = Array.isArray(presentation.selectedPowers)
    ? presentation.selectedPowers
    : [];

  return (
    <div
      style={{
        maxWidth: 820,
        margin: "0 auto",
        padding: "28px 32px 80px",
        fontFamily: FONTS.SANS,
      }}
    >
      {/* Back link */}
      <a
        href={`/app/clients/${presentation.clientId}`}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: 13,
          color: TOKENS.INK_60,
          textDecoration: "none",
          marginBottom: 20,
        }}
      >
        <ArrowLeft size={14} strokeWidth={2} />
        Back to {client?.fullName || "client"}
      </a>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 8 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            background: "#EFF6FF",
            border: "1px solid #BFDBFE",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#1E40AF",
            flexShrink: 0,
          }}
        >
          <Send size={20} strokeWidth={1.8} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 600,
              color: TOKENS.INK,
              letterSpacing: "-0.015em",
              margin: 0,
              marginBottom: 4,
            }}
          >
            {presentation.institutionName}
          </h1>
          <div style={{ fontSize: 13, color: TOKENS.INK_60 }}>
            Institution Presentation Packet
          </div>
        </div>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "5px 12px",
            background: statusTone.bg,
            color: statusTone.color,
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 600,
            whiteSpace: "nowrap",
          }}
        >
          {statusDisplay.displayName}
        </span>
      </div>

      {/* Revoked/superseded warning */}
      {(isRevoked || isSuperseded) && (
        <div
          style={{
            marginTop: 16,
            padding: 14,
            background: "#FEE2E2",
            border: "1px solid #FCA5A5",
            borderRadius: 8,
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
          }}
        >
          <AlertCircle size={18} color="#991B1B" style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 13, color: "#7F1D1D", lineHeight: 1.5 }}>
            The underlying POA is{" "}
            <strong>{isRevoked ? "revoked" : "superseded"}</strong>. This packet's
            cover sheet warns the institution accordingly. It should not be
            presented as active authority.
          </div>
        </div>
      )}

      {/* Summary card */}
      <div
        style={{
          marginTop: 24,
          padding: 20,
          background: TOKENS.PAPER_2,
          border: `1px solid ${TOKENS.LINE}`,
          borderRadius: 12,
        }}
      >
        <MetaRow icon={Building2} label="Institution">
          <div style={{ fontSize: 14, color: TOKENS.INK, fontWeight: 500 }}>
            {presentation.institutionName}
          </div>
          {(presentation.institutionAddress ||
            presentation.institutionCity) && (
            <div style={{ fontSize: 12.5, color: TOKENS.INK_60, marginTop: 2 }}>
              {[
                presentation.institutionAddress,
                presentation.institutionCity,
                presentation.institutionState,
                presentation.institutionZip,
              ]
                .filter(Boolean)
                .join(", ")}
            </div>
          )}
          {presentation.institutionContactName && (
            <div style={{ fontSize: 12.5, color: TOKENS.INK_60, marginTop: 2 }}>
              Attn: {presentation.institutionContactName}
              {presentation.institutionContactEmail
                ? ` · ${presentation.institutionContactEmail}`
                : ""}
            </div>
          )}
        </MetaRow>

        <Divider />

        <MetaRow icon={User} label="Principal & Agent">
          <div style={{ fontSize: 13.5, color: TOKENS.INK }}>
            {presentation.principalNameSnapshot || "—"}
            <span style={{ color: TOKENS.INK_60 }}> (principal)</span>
          </div>
          <div style={{ fontSize: 13.5, color: TOKENS.INK, marginTop: 2 }}>
            {presentation.agentNameSnapshot || "—"}
            <span style={{ color: TOKENS.INK_60 }}> (agent)</span>
          </div>
        </MetaRow>

        <Divider />

        <MetaRow icon={FileText} label={`Authority highlighted (${selectedPowers.length})`}>
          {selectedPowers.length === 0 ? (
            <div style={{ fontSize: 13, color: TOKENS.INK_60, fontStyle: "italic" }}>
              No specific powers highlighted — packet relies on the executed POA.
            </div>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {selectedPowers.map((key) => {
                const p = getPowerByKey(key);
                return (
                  <span
                    key={key}
                    style={{
                      fontSize: 12,
                      padding: "3px 9px",
                      background: TOKENS.PAPER,
                      border: `1px solid ${TOKENS.LINE}`,
                      borderRadius: 20,
                      color: TOKENS.INK,
                    }}
                  >
                    {p ? `(${p.letter}) ${p.displayName}` : key}
                  </span>
                );
              })}
            </div>
          )}
        </MetaRow>

        <Divider />

        <MetaRow icon={Calendar} label="Timeline">
          <div style={{ fontSize: 12.5, color: TOKENS.INK_60, fontFamily: FONTS.MONO }}>
            Created {new Date(presentation.createdAt).toLocaleDateString()}
            {presentation.responseReceivedAt && (
              <>
                {" · "}Response{" "}
                {new Date(presentation.responseReceivedAt).toLocaleDateString()}
              </>
            )}
          </div>
        </MetaRow>

        <div style={{ marginTop: 16 }}>
          <button
            type="button"
            onClick={handlePreview}
            disabled={previewing}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "9px 14px",
              background: TOKENS.PAPER,
              color: TOKENS.INK,
              border: `1.5px solid ${TOKENS.LINE}`,
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              cursor: previewing ? "wait" : "pointer",
            }}
          >
            {previewing ? (
              <Loader2 size={14} strokeWidth={2.2} className="spin" />
            ) : (
              <Eye size={14} strokeWidth={2.2} />
            )}
            {previewing ? "Generating…" : "View packet PDF"}
          </button>
          {previewError && (
            <span style={{ marginLeft: 10, fontSize: 12.5, color: "#991B1B" }}>
              {previewError}
            </span>
          )}
        </div>
      </div>

      {/* Response tracker */}
      <div style={{ marginTop: 32 }}>
        <h2
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: TOKENS.INK,
            margin: 0,
            marginBottom: 6,
          }}
        >
          Institution responses
        </h2>
        <div style={{ fontSize: 13, color: TOKENS.INK_60, marginBottom: 16, lineHeight: 1.5 }}>
          Record how the institution responds to the packet. Texas law sets
          response deadlines (10 business days for certification/opinion
          requests, 5 for translation, 7 to accept after a request is satisfied).
        </div>
        <ResponseTracker
          presentationId={presentation.id}
          responses={responses}
          presentationStatus={presentation.status}
          onResponseRecorded={onResponseRecorded}
        />
      </div>

      <style jsx>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

function MetaRow({ icon: Icon, label, children }) {
  return (
    <div style={{ display: "flex", gap: 12 }}>
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 7,
          background: TOKENS.PAPER,
          border: `1px solid ${TOKENS.LINE}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: TOKENS.INK_60,
          flexShrink: 0,
        }}
      >
        <Icon size={14} strokeWidth={1.8} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 10.5,
            fontFamily: FONTS.MONO,
            color: TOKENS.INK_60,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            fontWeight: 600,
            marginBottom: 5,
          }}
        >
          {label}
        </div>
        {children}
      </div>
    </div>
  );
}

function Divider() {
  return (
    <div
      style={{
        borderTop: `1px solid ${TOKENS.LINE}`,
        margin: "16px 0",
      }}
    />
  );
}
