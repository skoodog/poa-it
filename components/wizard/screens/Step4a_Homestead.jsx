"use client";

import { useEffect } from "react";
import { Home, AlertTriangle } from "lucide-react";
import { TOKENS, FONTS } from "../shared/tokens";
import { WizardShell } from "../WizardShell";
import { StatutoryTooltip } from "../shared/StatutoryTooltip";
import { WarningBanner } from "../shared/WarningBanner";
import { AcknowledgmentCheckbox } from "../shared/AcknowledgmentCheckbox";
import { updateState, markStepComplete } from "../../../lib/wizard/state";
import { audit } from "../../../lib/audit/logger";

/**
 * Step 4a — Homestead (Conditional)
 * Phase 3 § 3.6
 *
 * Only shown when real-property power has been granted in Step 4. The
 * StepRouter handles the conditional rendering via getNextStep() in state.js.
 *
 * If the user owns a Texas homestead AND wants to grant home-equity authority,
 * Tex. Const. art. XVI § 50(a)(6)(N) requires in-person execution at one of
 * three specific locations. We set executionMethodLocked = true and
 * executionMethod = 'in_person' to constrain Step 7's options.
 */
export function Step4a_Homestead({ state, setState, onBack, onContinue }) {
  useEffect(() => {
    audit.stepEntered(state.sessionId, "step4a_homestead");
  }, [state.sessionId]);

  function updateField(field, value) {
    setState(updateState(state, { [field]: value }));
    audit.fieldChanged(state.sessionId, field, value !== null && value !== "");
  }

  function handleContinue() {
    if (!canContinue) return;

    // If homestead + home equity, lock execution method to in-person
    const locksExecutionMethod =
      state.ownsTexasHomestead === "yes_homestead" && state.grantsHomeEquityAuthority === true;

    const finalState = locksExecutionMethod
      ? {
          executionMethod: "in_person",
          executionMethodLocked: true,
        }
      : { executionMethodLocked: false };

    audit.stepCompleted(state.sessionId, "step4a_homestead", {
      ownsTexasHomestead: state.ownsTexasHomestead,
      grantsHomeEquityAuthority: state.grantsHomeEquityAuthority,
      executionMethodLocked: locksExecutionMethod,
    });

    if (locksExecutionMethod) {
      audit.warningShown(
        state.sessionId,
        "rule_homestead_execution_location",
        "Homestead + home-equity authority forces in-person execution per Tex. Const. art. XVI § 50(a)(6)(N)"
      );
    }

    const updated = updateState(state, finalState);
    const next = markStepComplete(updated, "step4a_homestead", "step5_hot_powers");
    setState(next);
    onContinue();
  }

  // Determine continue eligibility
  const needsHomeEquityAnswer = state.ownsTexasHomestead === "yes_homestead";
  const homeEquityAnswered = state.grantsHomeEquityAuthority !== null;
  const homesteadLockTriggered =
    state.ownsTexasHomestead === "yes_homestead" && state.grantsHomeEquityAuthority === true;
  const requiresAcknowledgment = homesteadLockTriggered;
  const acknowledged = state.acknowledgmentsConfirmed?.includes("homestead_execution_acknowledged");

  const canContinue =
    state.ownsTexasHomestead !== null &&
    (!needsHomeEquityAnswer || homeEquityAnswered) &&
    (!requiresAcknowledgment || acknowledged);

  function handleHomesteadAcknowledge(checked) {
    const set = new Set(state.acknowledgmentsConfirmed || []);
    if (checked) set.add("homestead_execution_acknowledged");
    else set.delete("homestead_execution_acknowledged");
    setState(updateState(state, { acknowledgmentsConfirmed: Array.from(set) }));
  }

  return (
    <WizardShell
      stepId="step4a_homestead"
      stepNumber="Step 5 of 9 · Homestead Check"
      title="One quick question about your home."
      subtitle="You've granted real-estate authority to your agent. Texas has a specific rule about powers of attorney and homestead property — let's make sure we get this right."
      onBack={onBack}
      onContinue={handleContinue}
      canContinue={canContinue}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 22, fontFamily: FONTS.SANS }}>
        {/* Homestead question */}
        <Question
          number="1"
          title={
            <>
              Do you own a home in Texas that you live in?
              <StatutoryTooltip
                plainEnglish="Your Texas homestead is the home you live in as your primary residence. Texas gives homesteads special protections — including from certain creditors — and special rules apply when you grant someone authority over it."
                citation="Tex. Const. art. XVI § 50"
                onOpen={() => audit.tooltipOpened(state.sessionId, "homestead_definition")}
              />
            </>
          }
        >
          <RadioOptions
            value={state.ownsTexasHomestead}
            onChange={(v) => updateField("ownsTexasHomestead", v)}
            options={[
              { value: "yes_homestead", label: "Yes — it's my homestead (where I live)" },
              { value: "yes_not_homestead", label: "Yes — but it's not where I live (rental, vacation home, etc.)" },
              { value: "no", label: "No — I rent or don't currently own" },
              { value: "not_sure", label: "Not sure" },
            ]}
          />
        </Question>

        {/* Home equity follow-up — only if homestead */}
        {needsHomeEquityAnswer && (
          <Question
            number="2"
            title={
              <>
                Do you want your agent to be able to sign home equity loan documents?
                <StatutoryTooltip
                  plainEnglish="A home equity loan or HELOC is when you borrow against the equity in your home. Texas has unique rules protecting homesteads: any power of attorney authorizing them must be signed at the lender's office, an attorney's office, or a title company — not at home, and not by remote online notarization."
                  citation="Tex. Const. art. XVI § 50(a)(6)(N)"
                  onOpen={() => audit.tooltipOpened(state.sessionId, "home_equity_definition")}
                />
              </>
            }
            description="This includes home equity loans, HELOCs, and cash-out refinances on your homestead."
          >
            <RadioOptions
              value={
                state.grantsHomeEquityAuthority === true
                  ? "yes"
                  : state.grantsHomeEquityAuthority === false
                  ? "no"
                  : null
              }
              onChange={(v) => updateField("grantsHomeEquityAuthority", v === "yes")}
              options={[
                { value: "yes", label: "Yes — they should be able to sign home equity documents" },
                { value: "no", label: "No — exclude home equity authority" },
              ]}
            />
          </Question>
        )}

        {/* Lock warning — if both yes */}
        {homesteadLockTriggered && (
          <WarningBanner
            severity="warning"
            title="In-person signing required"
            citation="Tex. Const. art. XVI § 50(a)(6)(N); Tex. Est. Code § 752.051"
            onAcknowledge={handleHomesteadAcknowledge}
            acknowledged={acknowledged}
            acknowledgmentLabel="I understand I'll need to sign in person at one of these locations."
          >
            Because you're granting authority over your Texas homestead AND
            home-equity authority, the Texas Constitution requires you to sign
            this document <strong>in person</strong> at one of three locations:
            <ul style={{ margin: "10px 0 0", paddingLeft: 20 }}>
              <li>The office of your lender</li>
              <li>A Texas attorney's office</li>
              <li>A title company office</li>
            </ul>
            <div style={{ marginTop: 10 }}>
              Remote online notarization (RON) is <strong>not permitted</strong> for this combination.
              We'll skip the RON option in your signing-method step.
            </div>
          </WarningBanner>
        )}

        {/* Friendly all-clear if not homestead or no home equity */}
        {state.ownsTexasHomestead && state.ownsTexasHomestead !== "yes_homestead" && (
          <WarningBanner severity="info">
            <strong>You're all set for this step.</strong> Texas's homestead-specific
            home-equity rule doesn't apply to your situation. You'll be able to
            choose any signing method (including remote online notarization) when
            we get to that step.
          </WarningBanner>
        )}

        {state.ownsTexasHomestead === "yes_homestead" && state.grantsHomeEquityAuthority === false && (
          <WarningBanner severity="info">
            <strong>You're all set for this step.</strong> Since you're not granting
            home-equity authority, the special homestead rule doesn't apply. You'll
            be able to choose any signing method in the next step.
          </WarningBanner>
        )}

        {state.ownsTexasHomestead === "not_sure" && (
          <WarningBanner severity="info" title="Quick reference">
            Generally, your "homestead" is the home you actually live in as your
            primary residence — not a rental property, second home, or vacation
            house. If you live there most of the year, it's almost certainly your
            homestead. If you're still unsure, you can speak with a Texas attorney
            through our Marketplace at any time.
          </WarningBanner>
        )}
      </div>
    </WizardShell>
  );
}

function Question({ number, title, description, children }) {
  return (
    <div>
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 12 }}>
        <div
          style={{
            fontFamily: FONTS.MONO,
            fontSize: 13,
            color: TOKENS.INK_40,
            fontWeight: 600,
            flexShrink: 0,
            marginTop: 3,
            letterSpacing: "0.02em",
          }}
        >
          Q{number}.
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 16,
              fontWeight: 500,
              color: TOKENS.INK,
              lineHeight: 1.45,
              letterSpacing: "-0.005em",
            }}
          >
            {title}
          </div>
          {description && (
            <div style={{ fontSize: 13, color: TOKENS.INK_60, lineHeight: 1.5, marginTop: 4 }}>
              {description}
            </div>
          )}
        </div>
      </div>
      <div style={{ paddingLeft: 32 }}>{children}</div>
    </div>
  );
}

function RadioOptions({ value, onChange, options }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => onChange(opt.value)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 16px",
              background: selected ? TOKENS.PAPER_2 : TOKENS.PAPER,
              border: `1px solid ${selected ? TOKENS.INK : TOKENS.LINE}`,
              borderRadius: 8,
              cursor: "pointer",
              transition: "all 0.15s",
              textAlign: "left",
              fontFamily: FONTS.SANS,
              fontSize: 14,
              color: TOKENS.INK,
              width: "100%",
            }}
          >
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: "50%",
                border: `1.5px solid ${selected ? TOKENS.INK : TOKENS.INK_40}`,
                background: TOKENS.PAPER,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {selected && (
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: TOKENS.INK,
                  }}
                />
              )}
            </div>
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
