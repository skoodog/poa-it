"use client";

import { useState } from "react";
import { Loader2, FileText, CheckCircle2, AlertTriangle } from "lucide-react";
import { TOKENS, FONTS } from "../wizard/shared/tokens";
import { RevocationWizardShell } from "./RevocationWizardShell";
import { WarningBanner } from "../wizard/shared/WarningBanner";

/**
 * Step 6 — Review revocation details and execute.
 *
 * User sees a preview link (opens PDF in new tab) and a summary of their
 * selections. When ready, they click "Mark as Executed" to finalize.
 *
 * "Execute" means: the user has actually signed and notarized the document
 * outside the system. The button transitions the revocation status from
 * draft → executed and the original POA from active → revoked. Sprint 7
 * will wire actual notarization (Proof RON) and email delivery to replace
 * this manual confirmation step.
 *
 * Sprint 4c — Round 2.
 */
export function RevocationStep6_Review({
  state,
  setState,
  client,
  onBack,
  onExecuted,
}) {
  const [executing, setExecuting] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [error, setError] = useState(null);

  async function generatePreview() {
    setPreviewing(true);
    setError(null);
    try {
      const res = await fetch("/api/revocations/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revocationId: state.sessionId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Preview failed");
      }
      // Stream returned as PDF blob — open in new tab
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      // Keep object URL alive long enough for the browser to load it
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      setError(err.message);
    } finally {
      setPreviewing(false);
    }
  }

  async function executeRevocation() {
    setExecuting(true);
    setError(null);
    try {
      const res = await fetch(`/api/revocations/${state.sessionId}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Execute failed");
      }
      const data = await res.json();
      onExecuted(data.revocation);
    } catch (err) {
      setError(err.message);
    } finally {
      setExecuting(false);
    }
  }

  const recipientCount = (state.recipients || []).length;
  const recordingCount = (state.realPropertyRecordings || []).length;
  const scopeLabel = formatScope(state);

  return (
    <RevocationWizardShell
      state={state}
      stepId="step6_review"
      title="Review and execute"
      subtitle="Open the preview to read the full revocation instrument. When you've signed and notarized it, mark this revocation as executed to transition the original POA to revoked status."
      onBack={onBack}
      hideNavigation
    >
      {/* Summary card */}
      <div
        style={{
          padding: 18,
          background: TOKENS.PAPER_2,
          border: `1px solid ${TOKENS.LINE}`,
          borderRadius: 10,
          marginBottom: 20,
          fontFamily: FONTS.SANS,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontFamily: FONTS.MONO,
            color: TOKENS.INK_40,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            fontWeight: 600,
            marginBottom: 12,
          }}
        >
          Summary
        </div>
        <SummaryRow label="Principal" value={state.principalNameSnapshot || "—"} />
        <SummaryRow label="Client" value={client?.fullLegalName || "—"} />
        <SummaryRow label="Scope" value={scopeLabel} />
        {state.scope === "agent_only" && state.revokedAgentName && (
          <SummaryRow label="Agent being revoked" value={state.revokedAgentName} />
        )}
        <SummaryRow
          label="Execution method"
          value={
            state.executionMethod === "ron"
              ? "Texas online notarization (RON)"
              : "Texas in-person notarization"
          }
        />
        <SummaryRow label="Notice recipients" value={`${recipientCount} recipient(s)`} />
        {recordingCount > 0 && (
          <SummaryRow label="Counties to record in" value={`${recordingCount} county(ies)`} />
        )}
      </div>

      {/* Preview button */}
      <div style={{ marginBottom: 24 }}>
        <button
          type="button"
          onClick={generatePreview}
          disabled={previewing}
          style={{
            width: "100%",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "12px 16px",
            background: TOKENS.PAPER,
            color: TOKENS.INK,
            border: `1.5px solid ${TOKENS.INK}`,
            borderRadius: 8,
            fontSize: 14,
            fontFamily: FONTS.SANS,
            fontWeight: 600,
            cursor: previewing ? "not-allowed" : "pointer",
          }}
        >
          {previewing ? (
            <>
              <Loader2 size={14} strokeWidth={2.2} className="animate-spin" /> Generating
              preview…
            </>
          ) : (
            <>
              <FileText size={14} strokeWidth={2.2} /> Preview revocation PDF
            </>
          )}
        </button>
      </div>

      {/* Warning + execute */}
      <WarningBanner severity="warning" title="Mark as executed only after signing">
        Click "Mark as Executed" ONLY after you have signed the revocation
        instrument and had it notarized. Executing here transitions the
        original POA to <strong>Revoked</strong> status in your records. This
        action cannot be undone from the workspace UI.
      </WarningBanner>

      <div style={{ marginTop: 20 }}>
        <button
          type="button"
          onClick={executeRevocation}
          disabled={executing}
          style={{
            width: "100%",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "14px 18px",
            background: "#991B1B",
            color: TOKENS.PAPER,
            border: "none",
            borderRadius: 8,
            fontSize: 14,
            fontFamily: FONTS.SANS,
            fontWeight: 600,
            cursor: executing ? "not-allowed" : "pointer",
            letterSpacing: 0.3,
          }}
        >
          {executing ? (
            <>
              <Loader2 size={14} strokeWidth={2.2} className="animate-spin" /> Executing…
            </>
          ) : (
            <>
              <CheckCircle2 size={14} strokeWidth={2.2} /> Mark as Executed
            </>
          )}
        </button>
      </div>

      {error && (
        <div
          style={{
            marginTop: 16,
            padding: 12,
            background: "#FEF2F2",
            border: "1px solid #FECACA",
            borderRadius: 8,
            color: "#991B1B",
            fontSize: 13,
            fontFamily: FONTS.SANS,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <AlertTriangle size={14} strokeWidth={2} />
          {error}
        </div>
      )}

      <div style={{ marginTop: 12, textAlign: "center" }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            background: "transparent",
            border: "none",
            color: TOKENS.INK_60,
            fontSize: 13,
            fontFamily: FONTS.SANS,
            cursor: "pointer",
            padding: 8,
          }}
        >
          Go back to make changes
        </button>
      </div>
    </RevocationWizardShell>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        padding: "8px 0",
        borderBottom: `1px solid ${TOKENS.LINE}`,
        fontSize: 13,
      }}
    >
      <div style={{ minWidth: 160, color: TOKENS.INK_60, fontWeight: 500 }}>{label}</div>
      <div style={{ flex: 1, color: TOKENS.INK }}>{value}</div>
    </div>
  );
}

function formatScope(state) {
  if (state.scope === "specific_poa") return "Revoke this specific POA only";
  if (state.scope === "all_prior")
    return "Revoke this POA plus all other prior financial durable POAs";
  if (state.scope === "agent_only")
    return `Revoke only the agent's authority (${state.revokedAgentName || "—"})`;
  return "—";
}
