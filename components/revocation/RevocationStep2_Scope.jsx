"use client";

import { ShieldOff, Layers, UserMinus } from "lucide-react";
import { TOKENS, FONTS } from "../wizard/shared/tokens";
import { RevocationWizardShell } from "./RevocationWizardShell";
import { FormField } from "../wizard/shared/FormFields";
import { WarningBanner } from "../wizard/shared/WarningBanner";
import { updateRevocationState } from "../../lib/wizard/revocationState";

/**
 * Step 2 — Choose the scope of the revocation.
 *
 * Three options:
 *   - specific_poa: revoke just the named POA
 *   - all_prior: revoke the named POA + any prior financial POAs
 *   - agent_only: revoke a named agent while leaving the POA active
 *
 * Sprint 4c — Round 2.
 */
export function RevocationStep2_Scope({ state, setState, onBack, onContinue }) {
  function pickScope(scope) {
    setState(updateRevocationState(state, { scope }));
  }

  function updateAgentName(name) {
    setState(updateRevocationState(state, { revokedAgentName: name }));
  }

  const canContinue =
    state.scope &&
    (state.scope !== "agent_only" || (state.revokedAgentName || "").trim().length > 0);

  return (
    <RevocationWizardShell
      state={state}
      stepId="step2_scope"
      title="What does this revocation cover?"
      subtitle="Pick the scope that matches your intent. Each option produces different operative language in the final revocation document."
      onBack={onBack}
      onContinue={onContinue}
      canContinue={canContinue}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <ScopeCard
          icon={ShieldOff}
          label="Revoke this specific POA"
          description="Revokes only the Power of Attorney you selected. Other POAs (if any) remain in effect."
          citation="§ 751.058"
          selected={state.scope === "specific_poa"}
          onClick={() => pickScope("specific_poa")}
        />
        <ScopeCard
          icon={Layers}
          label="Revoke this POA plus all prior financial POAs"
          description="Revokes the selected POA AND every other prior financial durable POA you have executed, whether listed here or not. Best when starting fresh with a new POA."
          citation="§ 751.058"
          selected={state.scope === "all_prior"}
          onClick={() => pickScope("all_prior")}
        />
        <ScopeCard
          icon={UserMinus}
          label="Revoke only a specific agent's authority"
          description="The POA stays in effect, but the named agent loses authority. Useful when removing one named agent (or successor) without replacing the entire document."
          citation="§ 751.058"
          selected={state.scope === "agent_only"}
          onClick={() => pickScope("agent_only")}
        />
      </div>

      {state.scope === "agent_only" && (
        <div style={{ marginTop: 20 }}>
          <FormField
            label="Name of agent whose authority you are revoking"
            value={state.revokedAgentName || ""}
            onChange={updateAgentName}
            placeholder="Full legal name of the agent"
            required
          />
          <div
            style={{
              marginTop: 10,
              fontSize: 12.5,
              color: TOKENS.INK_60,
              lineHeight: 1.5,
            }}
          >
            This name should match how the agent is identified in the original POA.
            If you have both a primary agent and a successor, name only the one you
            are removing.
          </div>
        </div>
      )}

      {state.scope === "all_prior" && (
        <div style={{ marginTop: 20 }}>
          <WarningBanner severity="info" title="Heads up — broader effect">
            This option revokes any other active POAs for this client in our
            system as well. Each one will be marked as revoked when you execute
            this instrument. If you only want to revoke the selected POA, go
            back and pick "Revoke this specific POA" instead.
          </WarningBanner>
        </div>
      )}
    </RevocationWizardShell>
  );
}

function ScopeCard({ icon: Icon, label, description, citation, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "flex-start",
        gap: 14,
        padding: "16px 18px",
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
          width: 38,
          height: 38,
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
        <Icon size={18} strokeWidth={1.8} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: TOKENS.INK,
            marginBottom: 4,
            letterSpacing: "-0.005em",
          }}
        >
          {label}
        </div>
        <div style={{ fontSize: 13, color: TOKENS.INK_60, lineHeight: 1.5 }}>
          {description}
        </div>
      </div>
      <div
        style={{
          fontSize: 10,
          fontFamily: FONTS.MONO,
          color: TOKENS.INK_40,
          flexShrink: 0,
          marginTop: 4,
          letterSpacing: "0.05em",
        }}
      >
        {citation}
      </div>
    </button>
  );
}
