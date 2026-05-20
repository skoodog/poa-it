"use client";

import { useEffect } from "react";
import { Check } from "lucide-react";
import { TOKENS, FONTS } from "../shared/tokens";
import { WizardShell } from "../WizardShell";
import { StatutoryTooltip } from "../shared/StatutoryTooltip";
import { WarningBanner } from "../shared/WarningBanner";
import { getAllGeneralPowers } from "../../../lib/clauseLibrary/engine";
import { updateState, markStepComplete } from "../../../lib/wizard/state";
import { audit } from "../../../lib/audit/logger";

/**
 * Step 4 — General Powers
 * Phase 3 § 3.5
 *
 * Lets the user select from the 14 Texas statutory power categories (§ 752.051),
 * plus the line-O "Grant ALL" shortcut.
 *
 * Smart linking: if the user grants real-estate power, flag for the homestead
 * screen (Step 4a) to surface. If they grant insurance, retirement, or estate
 * powers, flag for hot-powers smart prediction in Step 5.
 *
 * Validation: at least one power must be granted (line-O counts).
 */
export function Step4_Powers({ state, setState, onBack, onContinue }) {
  useEffect(() => {
    audit.stepEntered(state.sessionId, "step4_powers");
  }, [state.sessionId]);

  const allPowers = getAllGeneralPowers();
  // Separate the line-O "Grant All" shortcut from the 14 individual categories
  const allPowersClause = allPowers.find((p) => p.letter === "O");
  const individualPowers = allPowers.filter((p) => p.letter !== "O");

  const grantedSet = new Set(state.powersGranted || []);
  const allPowersChecked = grantedSet.has("all_powers");

  function togglePower(powerKey) {
    const newSet = new Set(state.powersGranted || []);
    if (newSet.has(powerKey)) {
      newSet.delete(powerKey);
    } else {
      newSet.add(powerKey);
    }
    setState(updateState(state, { powersGranted: Array.from(newSet) }));
    audit.fieldChanged(state.sessionId, `power_${powerKey}`, !newSet.has(powerKey) === false);
  }

  function toggleAllPowers() {
    const newSet = new Set(state.powersGranted || []);
    if (newSet.has("all_powers")) {
      // Unchecking all_powers — just remove it
      newSet.delete("all_powers");
      setState(updateState(state, { powersGranted: Array.from(newSet) }));
    } else {
      // Checking all_powers — clear individual selections and just have "all_powers"
      setState(updateState(state, { powersGranted: ["all_powers"] }));
    }
    audit.fieldChanged(state.sessionId, "power_all_powers", !allPowersChecked);
  }

  // Power keys are derived from clause IDs by stripping the "power_" prefix
  function powerKey(clauseId) {
    return clauseId.replace(/^power_/, "");
  }

  // What does "applies" mean for the UI?
  // - If "all_powers" is checked, every individual category visually shows as included
  // - Otherwise, only categories explicitly in powersGranted show as checked
  function isPowerActive(power) {
    if (allPowersChecked) return true;
    return grantedSet.has(powerKey(power.clause_id));
  }

  const grantedCount = allPowersChecked ? 14 : individualPowers.filter(isPowerActive).length;
  const canContinue = grantedCount > 0;

  function handleContinue() {
    if (!canContinue) return;
    audit.stepCompleted(state.sessionId, "step4_powers", {
      allPowersGranted: allPowersChecked,
      individualPowersGranted: allPowersChecked
        ? "all_via_line_O"
        : Array.from(grantedSet).filter((p) => p !== "all_powers"),
      grantedCount,
    });
    const next = markStepComplete(state, "step4_powers", "step4a_homestead");
    setState(next);
    onContinue();
  }

  return (
    <WizardShell
      stepId="step4_powers"
      stepNumber="Step 5 of 9 · Powers"
      title="What can your agent do for you?"
      subtitle="Texas law lists 14 categories of standard financial powers. Grant all of them, just some, or mix and match — your choice."
      onBack={onBack}
      onContinue={handleContinue}
      canContinue={canContinue}
    >
      {/* Grant All shortcut */}
      <div style={{ marginBottom: 24, fontFamily: FONTS.SANS }}>
        <button
          type="button"
          onClick={toggleAllPowers}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "flex-start",
            gap: 14,
            padding: "18px 20px",
            background: allPowersChecked ? TOKENS.INK : TOKENS.PAPER_2,
            border: `1.5px solid ${allPowersChecked ? TOKENS.INK : TOKENS.LINE_2}`,
            borderRadius: 10,
            cursor: "pointer",
            transition: "all 0.15s",
            textAlign: "left",
          }}
        >
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: 5,
              border: `2px solid ${allPowersChecked ? TOKENS.PAPER : TOKENS.INK_40}`,
              background: allPowersChecked ? TOKENS.PAPER : "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              marginTop: 1,
            }}
          >
            {allPowersChecked && <Check size={14} strokeWidth={3} color={TOKENS.INK} />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: allPowersChecked ? TOKENS.PAPER : TOKENS.INK,
                marginBottom: 4,
                letterSpacing: "-0.005em",
              }}
            >
              Grant ALL powers (line O)
            </div>
            <div
              style={{
                fontSize: 13,
                color: allPowersChecked ? "rgba(255,255,255,0.75)" : TOKENS.INK_60,
                lineHeight: 1.5,
              }}
            >
              The most common choice — grants every power below at once. You should
              still review the categories so you know what you're granting.
            </div>
          </div>
          <div
            style={{
              fontSize: 10,
              fontFamily: FONTS.MONO,
              color: allPowersChecked ? "rgba(255,255,255,0.5)" : TOKENS.INK_40,
              flexShrink: 0,
              marginTop: 4,
              letterSpacing: "0.05em",
            }}
          >
            § 752.051(O)
          </div>
        </button>
      </div>

      {/* Or pick individually */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          margin: "8px 0 16px",
          fontFamily: FONTS.SANS,
        }}
      >
        <div style={{ flex: 1, height: 1, background: TOKENS.LINE }} />
        <div
          style={{
            fontSize: 11,
            color: TOKENS.INK_40,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            fontWeight: 600,
            fontFamily: FONTS.MONO,
          }}
        >
          Or pick individually
        </div>
        <div style={{ flex: 1, height: 1, background: TOKENS.LINE }} />
      </div>

      {/* The 14 statutory categories */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          opacity: allPowersChecked ? 0.5 : 1,
          pointerEvents: allPowersChecked ? "none" : "auto",
          transition: "opacity 0.15s",
          fontFamily: FONTS.SANS,
        }}
      >
        {individualPowers.map((power) => {
          const key = powerKey(power.clause_id);
          const checked = isPowerActive(power);
          return (
            <PowerRow
              key={power.clause_id}
              power={power}
              checked={checked}
              onToggle={() => togglePower(key)}
              sessionId={state.sessionId}
              disabled={allPowersChecked}
            />
          );
        })}
      </div>

      {/* Footer info */}
      {!canContinue && (
        <WarningBanner severity="info" title="Pick at least one">
          You must grant at least one power. Use "Grant ALL" above for full
          authority, or pick specific categories. Tex. Est. Code § 752.051
          requires at least one selection.
        </WarningBanner>
      )}

      {canContinue && (
        <div
          style={{
            marginTop: 24,
            padding: "14px 16px",
            background: TOKENS.PAPER_2,
            border: `1px solid ${TOKENS.LINE}`,
            borderRadius: 8,
            fontSize: 13,
            color: TOKENS.INK_60,
            lineHeight: 1.5,
            fontFamily: FONTS.SANS,
          }}
        >
          You're granting <strong style={{ color: TOKENS.INK }}>{allPowersChecked ? "all 14 categories" : `${grantedCount} of 14 categories`}</strong>. The next screen covers a few sensitive powers (gifts, trust changes, beneficiary designations) that Texas treats separately under § 751.031(b).
        </div>
      )}
    </WizardShell>
  );
}

function PowerRow({ power, checked, onToggle, sessionId, disabled }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        padding: "12px 14px",
        background: checked ? TOKENS.PAPER_2 : TOKENS.PAPER,
        border: `1px solid ${checked ? TOKENS.INK : TOKENS.LINE}`,
        borderRadius: 8,
        cursor: disabled ? "default" : "pointer",
        transition: "all 0.15s",
        textAlign: "left",
        fontFamily: FONTS.SANS,
      }}
    >
      <div
        style={{
          width: 18,
          height: 18,
          borderRadius: 4,
          border: `1.5px solid ${checked ? TOKENS.INK : TOKENS.INK_40}`,
          background: checked ? TOKENS.INK : TOKENS.PAPER,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          marginTop: 2,
        }}
      >
        {checked && <Check size={12} strokeWidth={3} color={TOKENS.PAPER} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 8,
            marginBottom: 4,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontFamily: FONTS.MONO,
              color: TOKENS.INK_40,
              fontWeight: 600,
              letterSpacing: "0.04em",
            }}
          >
            ({power.letter})
          </div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: TOKENS.INK,
              letterSpacing: "-0.005em",
            }}
          >
            {power.plain_english_name}
          </div>
          <StatutoryTooltip
            plainEnglish={power.plain_english_examples}
            citation={power.statutory_source}
            onOpen={() => audit.tooltipOpened(sessionId, `power_${power.clause_id}`)}
          />
        </div>
        <div style={{ fontSize: 12.5, color: TOKENS.INK_60, lineHeight: 1.5 }}>
          {power.plain_english_examples}
        </div>
      </div>
    </button>
  );
}
