"use client";

import { useState } from "react";
import { Eye, Send, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { TOKENS, FONTS } from "../wizard/shared/tokens";
import { PresentationWizardShell } from "./PresentationWizardShell";
import {
  getPowerByKey,
  getPowerLetter,
  getPowerDisplayName,
} from "../../lib/taxonomy/poaTaxonomy";

/**
 * Sprint 4d.5: power labels source from canonical taxonomy. Previously this
 * file had its own POWER_LABELS hash including the typo'd
 * "personal_family_maintenance" key. The shortened display format used here
 * (e.g. "(J) Personal and family maintenance") is now derived from
 * `(letter) displayName` from the taxonomy.
 *
 * Some labels in the old hash were aggressively shortened ("Estate, trust,
 * beneficiary" instead of "Estate, trust, and other beneficiary
 * transactions"). The taxonomy's longer form is now used everywhere for
 * consistency — review cards can wrap text, full labels are clearer.
 */
function reviewPowerLabel(key) {
  const p = getPowerByKey(key);
  if (!p) return key;
  return `(${p.letter}) ${p.displayName}`;
}

/**
 * Step 4 — Review the packet contents and generate.
 *
 * Sprint 4d — Round 2.
 */
export function PresentationStep4_Review({ state, presentation, onBack, onGenerated }) {
  const [previewing, setPreviewing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  async function handlePreview() {
    setPreviewing(true);
    setError(null);
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
      setError(err.message || "Preview failed");
    } finally {
      setPreviewing(false);
    }
  }

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/presentations/${presentation.id}/finalize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || `Generate failed (${res.status})`);
      }
      const data = await res.json();
      onGenerated(data.presentation);
    } catch (err) {
      setError(err.message || "Generate failed");
      setGenerating(false);
    }
  }

  const isRevoked = state.originalPoaStatus === "revoked";
  const isSuperseded = state.originalPoaStatus === "superseded";
  const hasIssue = isRevoked || isSuperseded;

  return (
    <PresentationWizardShell
      state={state}
      stepId="step4_review"
      title="Review your packet"
      subtitle="Confirm the details below, then generate the packet. You can also preview the PDF first."
      onBack={onBack}
      hideNavigation
    >
      {hasIssue && (
        <div
          style={{
            padding: 14,
            background: "#FEE2E2",
            border: "1px solid #FCA5A5",
            borderRadius: 8,
            marginBottom: 20,
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
          }}
        >
          <AlertCircle size={18} color="#991B1B" style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#991B1B", marginBottom: 4 }}>
              The underlying POA is {isRevoked ? "revoked" : "superseded"}
            </div>
            <div style={{ fontSize: 12.5, color: "#7F1D1D", lineHeight: 1.5 }}>
              The cover sheet will prominently warn the institution not to accept this
              Power of Attorney. You can still generate the packet (it serves as
              evidence of the status change), but the agent should not present it as
              authority.
            </div>
          </div>
        </div>
      )}

      <ReviewCard
        label="Institution"
        primary={state.institutionName}
        secondary={
          [
            state.institutionAddress,
            state.institutionCity,
            state.institutionState,
            state.institutionZip,
          ]
            .filter(Boolean)
            .join(", ") || null
        }
        tertiary={
          state.institutionContactName
            ? `Attn: ${state.institutionContactName}`
            : null
        }
      />

      <ReviewCard
        label="Principal"
        primary={state.principalNameSnapshot || "—"}
      />

      <ReviewCard
        label="Agent"
        primary={state.agentNameSnapshot || "—"}
        secondary={
          state.successorAgentNameSnapshot
            ? `Successor: ${state.successorAgentNameSnapshot}`
            : null
        }
      />

      <ReviewCard
        label={`Authority highlighted (${(state.selectedPowers || []).length})`}
        primary={null}
        custom={
          (state.selectedPowers || []).length === 0 ? (
            <div style={{ fontSize: 13, color: TOKENS.INK_60, fontStyle: "italic" }}>
              No specific powers highlighted. Packet relies on the executed POA itself.
            </div>
          ) : (
            <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
              {(state.selectedPowers || []).map((p) => (
                <li
                  key={p}
                  style={{ fontSize: 13, color: TOKENS.INK, marginBottom: 4 }}
                >
                  • {reviewPowerLabel(p)}
                </li>
              ))}
            </ul>
          )
        }
      />

      {(state.customNotes || []).length > 0 && (
        <ReviewCard
          label={`Notes (${state.customNotes.length})`}
          primary={null}
          custom={
            <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
              {state.customNotes.map((n) => (
                <li
                  key={n.id}
                  style={{ fontSize: 12.5, color: TOKENS.INK_60, marginBottom: 6, lineHeight: 1.5 }}
                >
                  • {n.text}
                </li>
              ))}
            </ul>
          }
        />
      )}

      {error && (
        <div
          style={{
            padding: 10,
            background: "#FEE2E2",
            border: "1px solid #FCA5A5",
            borderRadius: 6,
            color: "#991B1B",
            fontSize: 13,
            marginTop: 16,
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          marginTop: 28,
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          justifyContent: "space-between",
        }}
      >
        <button
          type="button"
          onClick={onBack}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "10px 14px",
            background: "transparent",
            color: TOKENS.INK_60,
            border: "none",
            borderRadius: 6,
            fontSize: 13,
            fontFamily: FONTS.SANS,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Back
        </button>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={handlePreview}
            disabled={previewing || generating}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "10px 14px",
              background: TOKENS.PAPER,
              color: TOKENS.INK,
              border: `1.5px solid ${TOKENS.LINE}`,
              borderRadius: 6,
              fontSize: 13,
              fontFamily: FONTS.SANS,
              fontWeight: 600,
              cursor: previewing || generating ? "wait" : "pointer",
            }}
          >
            {previewing ? (
              <Loader2 size={14} strokeWidth={2.2} className="spin" />
            ) : (
              <Eye size={14} strokeWidth={2.2} />
            )}
            {previewing ? "Generating preview…" : "Preview PDF"}
          </button>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating || previewing}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "10px 18px",
              background: "#1E40AF",
              color: TOKENS.PAPER,
              border: "none",
              borderRadius: 6,
              fontSize: 13,
              fontFamily: FONTS.SANS,
              fontWeight: 600,
              cursor: generating || previewing ? "wait" : "pointer",
              letterSpacing: 0.2,
            }}
          >
            {generating ? (
              <Loader2 size={14} strokeWidth={2.2} className="spin" />
            ) : (
              <Send size={14} strokeWidth={2.2} />
            )}
            {generating ? "Generating…" : "Generate packet"}
          </button>
        </div>
      </div>

      <style jsx>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </PresentationWizardShell>
  );
}

function ReviewCard({ label, primary, secondary, tertiary, custom }) {
  return (
    <div
      style={{
        padding: "14px 16px",
        background: TOKENS.PAPER_2,
        border: `1px solid ${TOKENS.LINE}`,
        borderRadius: 8,
        marginBottom: 10,
      }}
    >
      <div
        style={{
          fontSize: 10.5,
          fontFamily: FONTS.MONO,
          color: TOKENS.INK_60,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          fontWeight: 600,
          marginBottom: primary || custom ? 6 : 0,
        }}
      >
        {label}
      </div>
      {primary && (
        <div style={{ fontSize: 14, color: TOKENS.INK, fontWeight: 500, marginBottom: secondary || tertiary ? 4 : 0 }}>
          {primary}
        </div>
      )}
      {secondary && (
        <div style={{ fontSize: 12.5, color: TOKENS.INK_60, lineHeight: 1.5 }}>
          {secondary}
        </div>
      )}
      {tertiary && (
        <div style={{ fontSize: 12.5, color: TOKENS.INK_60, marginTop: 2 }}>
          {tertiary}
        </div>
      )}
      {custom}
    </div>
  );
}
