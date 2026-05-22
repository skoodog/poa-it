"use client";

import { useEffect, useState } from "react";
import { Check, Sparkles, ListChecks, Settings2 } from "lucide-react";
import { TOKENS, FONTS } from "../shared/tokens";
import { WizardShell } from "../WizardShell";
import { StatutoryTooltip } from "../shared/StatutoryTooltip";
import { WarningBanner } from "../shared/WarningBanner";
import { getAllGeneralPowers } from "../../../lib/clauseLibrary/engine";
import { updateState, markStepComplete, getNextStep } from "../../../lib/wizard/state";
import { audit } from "../../../lib/audit/logger";

/**
 * Step 4 - General Powers
 *
 * Sprint 4b.1 Round 3 - restructured per attorney guidance:
 *   Three-choice scope selector (Broad / Limited / Custom)
 *   - Broad: line (O) auto-selected, A-N hidden
 *   - Limited: A-N selectable
 *   - Custom: A-N selectable + special instructions emphasized
 *
 * Auto-promote: if user picks all 14 individual powers in Limited mode,
 * prompt to switch to Broad (line O).
 *
 * Validation: must pick a scope AND have at least one power granted.
 */
export function Step4_Powers({ state, setState, onBack, onContinue }) {
  useEffect(() => {
    audit.stepEntered(state.sessionId, "step4_powers");
  }, [state.sessionId]);

  const allPowers = getAllGeneralPowers();
  const individualPowers = allPowers.filter((p) => p.letter !== "O");

  const grantedSet = new Set(state.powersGranted || []);
  const allPowersChecked = grantedSet.has("all_powers");

  // Infer scope from existing state for users returning to this step
  const inferredScope =
    state.powersScope ||
    (allPowersChecked
      ? "broad"
      : (state.specialInstructions || "").trim()
      ? "custom"
      : grantedSet.size > 0
      ? "limited"
      : null);

  const [scope, setScope] = useState(inferredScope);
  const [showAutoPromote, setShowAutoPromote] = useState(false);

  function selectScope(newScope) {
    setScope(newScope);
    audit.fieldChanged(state.sessionId, "powers_scope", newScope);

    if (newScope === "broad") {
      // Broad: clear specific picks, set all_powers
      setState(updateState(state, {
        powersGranted: ["all_powers"],
        powersScope: "broad",
      }));
    } else {
      // Limited/Custom: clear all_powers if previously set
      const cleared = Array.from(grantedSet).filter((p) => p !== "all_powers");
      setState(updateState(state, {
        powersGranted: cleared,
        powersScope: newScope,
      }));
    }
    setShowAutoPromote(false);
  }

  function togglePower(powerKey) {
    const newSet = new Set(state.powersGranted || []);
    if (newSet.has(powerKey)) {
      newSet.delete(powerKey);
    } else {
      newSet.add(powerKey);
    }
    const newArray = Array.from(newSet);
    setState(updateState(state, { powersGranted: newArray }));
    audit.fieldChanged(state.sessionId, `power_${powerKey}`, newSet.has(powerKey));

    // Auto-promote check: in Limited/Custom mode, if user picked all 14
    if (scope === "limited" || scope === "custom") {
      const specificPicks = newArray.filter((p) => p !== "all_powers");
      setShowAutoPromote(specificPicks.length === 14);
    }
  }

  function acceptAutoPromote() {
    selectScope("broad");
    audit.fieldChanged(state.sessionId, "powers_auto_promote_accepted", true);
  }

  function declineAutoPromote() {
    setShowAutoPromote(false);
    audit.fieldChanged(state.sessionId, "powers_auto_promote_declined", true);
  }

  function powerKey(clauseId) {
    return clauseId.replace(/^power_/, "");
  }

  function isPowerActive(power) {
    if (allPowersChecked) return true;
    return grantedSet.has(powerKey(power.clause_id));
  }

  const grantedCount = allPowersChecked ? 14 : individualPowers.filter(isPowerActive).length;
  const canContinue = scope !== null && grantedCount > 0;

  function handleContinue() {
    if (!canContinue) return;
    audit.stepCompleted(state.sessionId, "step4_powers", {
      scope,
      allPowersGranted: allPowersChecked,
      individualPowersGranted: allPowersChecked
        ? "all_via_line_O"
        : Array.from(grantedSet).filter((p) => p !== "all_powers"),
      grantedCount,
    });
    const next = markStepComplete(state, "step4_powers", getNextStep({ ...state, currentStep: "step4_powers" }));
    setState(next);
    onContinue();
  }

  return (
    <WizardShell
      stepId="step4_powers"
      stepNumber="Step 5 of 9 - Powers"
      title="What can your agent do for you?"
      subtitle="Start by choosing the overall scope of authority. You can refine specific powers below."
      onBack={onBack}
      onContinue={handleContinue}
      canContinue={canContinue}
    >
      {/* SCOPE SELECTOR - three big choice cards */}
      <div style={{ marginBottom: 24, fontFamily: FONTS.SANS }}>
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
          Choose the scope of authority
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <ScopeCard
            icon={Sparkles}
            label="Broad authority"
            description="Grant all 14 standard Texas financial powers at once. The most common choice. Maps to Texas statutory line (O)."
            selected={scope === "broad"}
            onClick={() => selectScope("broad")}
          />
          <ScopeCard
            icon={ListChecks}
            label="Limited authority"
            description="Choose specific powers from the 14 categories below. Best when you want to restrict your agent to particular financial decisions."
            selected={scope === "limited"}
            onClick={() => selectScope("limited")}
          />
          <ScopeCard
            icon={Settings2}
            label="Custom / attorney-reviewed"
            description="Pick specific powers AND add written special instructions limiting or extending the powers granted. Use this for nuanced needs."
            selected={scope === "custom"}
            onClick={() => selectScope("custom")}
          />
        </div>
      </div>

      {/* BROAD CONFIRMATION */}
      {scope === "broad" && (
        <div
          style={{
            padding: "16px 18px",
            background: TOKENS.PAPER_2,
            border: `1.5px solid ${TOKENS.INK}`,
            borderRadius: 10,
            display: "flex",
            gap: 12,
            alignItems: "flex-start",
            fontFamily: FONTS.SANS,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: 5,
              background: TOKENS.INK,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              marginTop: 1,
            }}
          >
            <Check size={14} strokeWidth={3} color={TOKENS.PAPER} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
              All 14 standard powers granted
            </div>
            <div style={{ fontSize: 13, color: TOKENS.INK_60, lineHeight: 1.5 }}>
              Your final document will initial line (O) to grant the full statutory
              authority. Specific A-N lines remain blank by statutory convention.
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
            § 752.051(O)
          </div>
        </div>
      )}

      {/* INDIVIDUAL POWER CARDS - shown for Limited/Custom */}
      {(scope === "limited" || scope === "custom") && (
        <>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              margin: "16px 0 12px",
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
              Pick specific powers
            </div>
            <div style={{ flex: 1, height: 1, background: TOKENS.LINE }} />
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
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
                  disabled={false}
                />
              );
            })}
          </div>

          {/* AUTO-PROMOTE PROMPT - when user picks all 14 */}
          {showAutoPromote && (
            <div
              style={{
                marginTop: 16,
                padding: "16px 18px",
                background: "#FEF3C7",
                border: `1.5px solid #F59E0B`,
                borderRadius: 10,
                fontFamily: FONTS.SANS,
              }}
            >
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#78350F",
                  marginBottom: 6,
                }}
              >
                You selected every standard power.
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "#78350F",
                  lineHeight: 1.5,
                  marginBottom: 12,
                }}
              >
                The Texas statutory form has a shortcut for this: line (O) grants
                all 14 powers with a single initial. We recommend switching to
                Broad authority for a cleaner, more recognizable document. Want
                to switch?
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={acceptAutoPromote}
                  style={{
                    padding: "8px 14px",
                    background: TOKENS.INK,
                    color: TOKENS.PAPER,
                    border: "none",
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: FONTS.SANS,
                  }}
                >
                  Yes, switch to Broad
                </button>
                <button
                  type="button"
                  onClick={declineAutoPromote}
                  style={{
                    padding: "8px 14px",
                    background: TOKENS.PAPER,
                    color: TOKENS.INK,
                    border: `1.5px solid ${TOKENS.LINE}`,
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: FONTS.SANS,
                  }}
                >
                  Keep as-is
                </button>
              </div>
            </div>
          )}

          {/* CUSTOM mode - special instructions promotion */}
          {scope === "custom" && (
            <div
              style={{
                marginTop: 24,
                padding: "16px 18px",
                background: TOKENS.PAPER_2,
                border: `1px solid ${TOKENS.LINE}`,
                borderRadius: 10,
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
                  marginBottom: 8,
                }}
              >
                Special Instructions
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: TOKENS.INK_60,
                  marginBottom: 10,
                  lineHeight: 1.5,
                }}
              >
                Add written instructions limiting or extending the powers above.
                Examples: restrict agent to specific accounts, exclude business
                operations, require notification before large transactions.
              </div>
              <textarea
                value={state.specialInstructions || ""}
                onChange={(e) =>
                  setState(updateState(state, { specialInstructions: e.target.value }))
                }
                placeholder="Enter any special instructions, restrictions, or extensions..."
                rows={5}
                style={{
                  width: "100%",
                  padding: 12,
                  fontSize: 14,
                  fontFamily: FONTS.SANS,
                  border: `1px solid ${TOKENS.LINE}`,
                  borderRadius: 8,
                  resize: "vertical",
                  outline: "none",
                  background: TOKENS.PAPER,
                  color: TOKENS.INK,
                  lineHeight: 1.5,
                  boxSizing: "border-box",
                }}
              />
            </div>
          )}
        </>
      )}

      {/* SCOPE NOT YET PICKED */}
      {scope === null && (
        <WarningBanner severity="info" title="Pick a scope to begin">
          Choose Broad, Limited, or Custom above to continue.
        </WarningBanner>
      )}

      {/* INSUFFICIENT POWERS WARNING */}
      {scope !== null && scope !== "broad" && !canContinue && (
        <WarningBanner severity="info" title="Pick at least one power">
          You must grant at least one power. Pick categories above, or switch to
          Broad authority for the statutory shortcut. Tex. Est. Code § 752.051
          requires at least one selection.
        </WarningBanner>
      )}

      {/* REAL-PROPERTY RECORDING WARNING */}
      {canContinue && (allPowersChecked || grantedSet.has("real_property")) && (
        <div style={{ marginTop: 20 }}>
          <WarningBanner
            severity="info"
            title="Real-property recording requirement"
            citation="Tex. Est. Code § 751.151"
          >
            Because you're granting authority over real property, this power of
            attorney may need to be recorded in the county clerk's office where
            the property is located if used for a recorded real-estate
            transaction (such as a deed, deed of trust, release, or other
            recordable instrument). The recording must occur within{" "}
            <strong>30 days</strong> of the instrument it relates to. We'll
            include this in your post-signing checklist.
          </WarningBanner>
        </div>
      )}

      {/* COMPENSATION EXPLICIT CHOICE - per attorney guidance: "make the
          user answer; do not let the default happen silently" */}
      {canContinue && (
        <div
          style={{
            marginTop: 20,
            padding: "16px 18px",
            background: TOKENS.PAPER,
            border: `1px solid ${TOKENS.LINE}`,
            borderRadius: 10,
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
              marginBottom: 8,
            }}
          >
            Agent compensation
          </div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: TOKENS.INK,
              marginBottom: 6,
            }}
          >
            Should your agent be compensated for serving?
          </div>
          <div style={{ fontSize: 13, color: TOKENS.INK_60, marginBottom: 12, lineHeight: 1.5 }}>
            Many people name a spouse, child, or close friend who will serve
            without compensation. Some name a professional fiduciary or
            attorney who expects to be paid. Pick what fits your situation.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <CompensationOption
              label="Reimbursement of expenses only"
              description="My agent is entitled to reimbursement of reasonable expenses but no compensation for serving."
              selected={state.agentCompensation === "no_compensation"}
              onClick={() => {
                setState(updateState(state, { agentCompensation: "no_compensation" }));
                audit.fieldChanged(state.sessionId, "agent_compensation", "no_compensation");
              }}
            />
            <CompensationOption
              label="Reasonable compensation plus expenses"
              description="My agent is entitled to reimbursement of expenses AND reasonable compensation for serving."
              selected={state.agentCompensation === "reasonable"}
              onClick={() => {
                setState(updateState(state, { agentCompensation: "reasonable" }));
                audit.fieldChanged(state.sessionId, "agent_compensation", "reasonable");
              }}
            />
          </div>
        </div>
      )}

      {/* SUCCESS FOOTER */}
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
          You're granting <strong style={{ color: TOKENS.INK }}>
            {allPowersChecked ? "all 14 categories" : `${grantedCount} of 14 categories`}
          </strong>. The next screen covers a few sensitive powers (gifts, trust
          changes, beneficiary designations) that Texas treats separately under
          § 751.031(b).
        </div>
      )}
    </WizardShell>
  );
}

/**
 * ScopeCard - one of three big choice cards (Broad / Limited / Custom).
 */
function ScopeCard({ icon: Icon, label, description, selected, onClick }) {
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
        transition: "all 0.15s",
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
          <div
            style={{
              width: 7,
              height: 7,
              borderRadius: 4,
              background: TOKENS.PAPER,
            }}
          />
        )}
      </div>
    </button>
  );
}

/**
 * CompensationOption - small radio-like card for compensation choice
 */
function CompensationOption({ label, description, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        padding: "12px 14px",
        background: selected ? TOKENS.PAPER_2 : TOKENS.PAPER,
        border: `1.5px solid ${selected ? TOKENS.INK : TOKENS.LINE}`,
        borderRadius: 8,
        cursor: "pointer",
        transition: "all 0.15s",
        textAlign: "left",
        fontFamily: FONTS.SANS,
      }}
    >
      <div
        style={{
          width: 16,
          height: 16,
          borderRadius: 8,
          border: `1.5px solid ${selected ? TOKENS.INK : TOKENS.INK_40}`,
          background: selected ? TOKENS.INK : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          marginTop: 2,
        }}
      >
        {selected && (
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              background: TOKENS.PAPER,
            }}
          />
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
          {label}
        </div>
        <div style={{ fontSize: 12, color: TOKENS.INK_60, lineHeight: 1.45 }}>
          {description}
        </div>
      </div>
    </button>
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
