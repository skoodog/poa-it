"use client";

import { Video, MapPin, Check } from "lucide-react";
import { TOKENS, FONTS } from "../wizard/shared/tokens";
import { RevocationWizardShell } from "./RevocationWizardShell";
import { FormField } from "../wizard/shared/FormFields";
import { WarningBanner } from "../wizard/shared/WarningBanner";
import { updateRevocationState } from "../../lib/wizard/revocationState";

/**
 * Step 3 — Confirm principal name (snapshot) and pick execution method.
 *
 * Principal name was snapshotted at create time. User can override it here
 * if the snapshot is wrong, but normally they just confirm it.
 *
 * Sprint 4c — Round 2.
 */
export function RevocationStep3_Confirm({ state, setState, onBack, onContinue }) {
  function setPrincipalName(name) {
    setState(updateRevocationState(state, { principalNameSnapshot: name }));
  }

  function setExecutionMethod(method) {
    setState(updateRevocationState(state, { executionMethod: method }));
  }

  const canContinue =
    !!state.principalNameSnapshot &&
    !!state.executionMethod;

  return (
    <RevocationWizardShell
      state={state}
      stepId="step3_confirm"
      title="Confirm execution details"
      subtitle="Review the principal name and choose how this revocation will be notarized."
      onBack={onBack}
      onContinue={onContinue}
      canContinue={canContinue}
    >
      <div style={{ marginBottom: 24 }}>
        <FormField
          label="Principal (the person revoking the POA)"
          value={state.principalNameSnapshot || ""}
          onChange={setPrincipalName}
          placeholder="Full legal name"
          required
          helpText="Pre-filled from the original POA. Edit only if the snapshot is wrong."
        />
      </div>

      <div
        style={{
          fontSize: 11,
          fontFamily: FONTS.MONO,
          color: TOKENS.INK_40,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          fontWeight: 600,
          marginBottom: 10,
        }}
      >
        How will this revocation be notarized?
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
        <ExecutionCard
          icon={Video}
          label="Texas online notarization (RON)"
          description="Notarize remotely via video call. Fastest path. Cannot be used to authorize home-equity loan closings."
          selected={state.executionMethod === "ron"}
          onClick={() => setExecutionMethod("ron")}
        />
        <ExecutionCard
          icon={MapPin}
          label="Texas in-person notarization"
          description="Print, sign in front of a notary, and scan back. Required for home-equity loan transactions."
          selected={state.executionMethod === "in_person"}
          onClick={() => setExecutionMethod("in_person")}
        />
      </div>

      <WarningBanner severity="info" title="What happens next">
        After you complete this wizard, you'll get a preview PDF of the
        revocation. You'll need to sign and notarize it through your chosen
        method. Once you confirm execution, the original POA's status will
        flip to "Revoked" in your records.
      </WarningBanner>
    </RevocationWizardShell>
  );
}

function ExecutionCard({ icon: Icon, label, description, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "flex-start",
        gap: 14,
        padding: "14px 16px",
        background: selected ? TOKENS.PAPER_2 : TOKENS.PAPER,
        border: `1.5px solid ${selected ? TOKENS.INK : TOKENS.LINE}`,
        borderRadius: 10,
        cursor: "pointer",
        textAlign: "left",
        fontFamily: FONTS.SANS,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          background: selected ? TOKENS.INK : TOKENS.PAPER_2,
          border: selected ? "none" : `1px solid ${TOKENS.LINE}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: selected ? TOKENS.PAPER : TOKENS.INK,
          flexShrink: 0,
        }}
      >
        <Icon size={16} strokeWidth={1.8} />
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
          {label}
        </div>
        <div style={{ fontSize: 12.5, color: TOKENS.INK_60, lineHeight: 1.5 }}>
          {description}
        </div>
      </div>
      <div
        style={{
          width: 18,
          height: 18,
          borderRadius: 9,
          border: `2px solid ${selected ? TOKENS.INK : TOKENS.INK_40}`,
          background: selected ? TOKENS.INK : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          marginTop: 4,
        }}
      >
        {selected && (
          <div style={{ width: 7, height: 7, borderRadius: 4, background: TOKENS.PAPER }} />
        )}
      </div>
    </button>
  );
}
