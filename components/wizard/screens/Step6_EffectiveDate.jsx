"use client";

import { useEffect } from "react";
import { Zap, Clock, Check } from "lucide-react";
import { TOKENS, FONTS } from "../shared/tokens";
import { WizardShell } from "../WizardShell";
import { StatutoryTooltip } from "../shared/StatutoryTooltip";
import { WarningBanner } from "../shared/WarningBanner";
import { AttorneyReferralPrompt } from "../shared/AttorneyReferralPrompt";
import { updateState, markStepComplete } from "../../../lib/wizard/state";
import { audit } from "../../../lib/audit/logger";

/**
 * Step 6 — Effective Date
 * Phase 3 § 3.8
 *
 * Choose Immediate vs. Springing per Tex. Est. Code § 752.051 Alt A/B.
 *
 * Immediate is the recommended default — banks and title companies accept
 * it readily, and the agent's fiduciary duties (§ 751.101-.106) legally
 * prevent misuse while the principal is still capable.
 *
 * Springing triggers a warning per `rule_springing_warning` and offers an
 * acknowledgment + optional path to a custom incapacity definition (which
 * itself triggers an attorney consultation prompt).
 */
export function Step6_EffectiveDate({ state, setState, onBack, onContinue }) {
  useEffect(() => {
    audit.stepEntered(state.sessionId, "step6_effective_date");
  }, [state.sessionId]);

  function selectChoice(choice) {
    setState(updateState(state, { effectiveDateChoice: choice }));
    if (choice === "springing") {
      audit.warningShown(
        state.sessionId,
        "rule_springing_warning",
        "User selected springing POA; bank-acceptance warning surfaced."
      );
    }
    audit.fieldChanged(state.sessionId, "effectiveDateChoice", true);
  }

  function setCustomIncapacity(checked) {
    setState(updateState(state, { customIncapacityDefinition: checked }));
    if (checked) {
      audit.warningShown(
        state.sessionId,
        "custom_incapacity_definition",
        "User selected custom incapacity definition; attorney consultation prompt surfaced."
      );
    }
  }

  // Acknowledgments
  const springingAck = state.acknowledgmentsConfirmed?.includes("springing_warning_acknowledged");
  const customIncapacityAck = state.acknowledgmentsConfirmed?.includes(
    "custom_incapacity_attorney_acknowledged"
  );

  function handleSpringingAck(checked) {
    const set = new Set(state.acknowledgmentsConfirmed || []);
    if (checked) {
      set.add("springing_warning_acknowledged");
      audit.acknowledgmentRecorded(
        state.sessionId,
        "springing_warning_acknowledged",
        "I understand springing POAs may be harder to use and want to proceed anyway."
      );
    } else {
      set.delete("springing_warning_acknowledged");
    }
    setState(updateState(state, { acknowledgmentsConfirmed: Array.from(set) }));
  }

  function handleCustomIncapacityAck(checked) {
    const set = new Set(state.acknowledgmentsConfirmed || []);
    if (checked) {
      set.add("custom_incapacity_attorney_acknowledged");
      audit.acknowledgmentRecorded(
        state.sessionId,
        "custom_incapacity_attorney_acknowledged",
        "I understand a custom incapacity definition requires Texas attorney review and want to proceed."
      );
    } else {
      set.delete("custom_incapacity_attorney_acknowledged");
    }
    setState(updateState(state, { acknowledgmentsConfirmed: Array.from(set) }));
  }

  // Validation
  const immediate = state.effectiveDateChoice === "immediate";
  const springing = state.effectiveDateChoice === "springing";
  const customIncapacity = state.customIncapacityDefinition === true;

  const canContinue =
    (immediate) ||
    (springing && springingAck && (!customIncapacity || customIncapacityAck));

  function handleContinue() {
    if (!canContinue) return;
    audit.stepCompleted(state.sessionId, "step6_effective_date", {
      effectiveDateChoice: state.effectiveDateChoice,
      customIncapacityDefinition: state.customIncapacityDefinition,
      springingWarningShown: springing,
      springingWarningAcknowledged: springingAck,
    });
    const next = markStepComplete(state, "step6_effective_date", "step7_execution_method");
    setState(next);
    onContinue();
  }

  return (
    <WizardShell
      stepId="step6_effective_date"
      stepNumber="Step 7 of 9 · Effective Date"
      title="When should this take effect?"
      subtitle="Texas gives you two options. The first (immediate) is what most people choose; the second (springing) gives you more control but is harder to use in practice."
      onBack={onBack}
      onContinue={handleContinue}
      canContinue={canContinue}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16, fontFamily: FONTS.SANS }}>
        {/* Immediate option */}
        <ChoiceCard
          icon={Zap}
          selected={immediate}
          onClick={() => selectChoice("immediate")}
          badge="Recommended"
          badgeColor={TOKENS.LIVE_GREEN}
          title="Immediate"
          subtitle="Effective the moment it's notarized, and stays effective if you later become incapacitated."
          citation="Tex. Est. Code § 752.051 (Alt A)"
          comparisonRows={[
            { label: "When effective", value: "Right away" },
            { label: "Agent can act", value: "Immediately, while you're capable too" },
            { label: "Bank acceptance", value: "Easy — banks know this form well" },
            { label: "Used by", value: "Most people" },
          ]}
          tooltipKey="effective_immediate"
          sessionId={state.sessionId}
        />

        {/* Springing option */}
        <ChoiceCard
          icon={Clock}
          selected={springing}
          onClick={() => selectChoice("springing")}
          title="Springing"
          subtitle="Only becomes effective if and when you become incapacitated and a physician certifies it in writing."
          citation="Tex. Est. Code § 752.051 (Alt B); § 751.00201"
          comparisonRows={[
            { label: "When effective", value: "Only after physician certifies incapacity" },
            { label: "Agent can act", value: "Only after that certification" },
            { label: "Bank acceptance", value: "Harder — often requires extra paperwork" },
            { label: "Used by", value: "Those wanting maximum control" },
          ]}
          tooltipKey="effective_springing"
          sessionId={state.sessionId}
        />

        {/* Springing — warning + acknowledgment */}
        {springing && (
          <>
            <WarningBanner
              severity="warning"
              title="Heads-up about springing powers of attorney"
              citation="Tex. Est. Code § 751.00201; § 751.101–.106"
              onAcknowledge={handleSpringingAck}
              acknowledged={springingAck}
              acknowledgmentLabel="I understand and want to proceed with a springing POA."
            >
              Springing powers of attorney can be harder to use. Banks and title
              companies often require:
              <ul style={{ margin: "8px 0 0", paddingLeft: 20 }}>
                <li>A specific physician's certification letter</li>
                <li>Sometimes letters from two doctors</li>
                <li>Detailed documentation of the incapacity</li>
                <li>In rare cases, a court order</li>
              </ul>
              <div style={{ marginTop: 12 }}>
                Many Texas attorneys recommend immediate-effective POAs because they're
                easier to use AND your agent has fiduciary duties (§ 751.101–.106) that
                legally prevent misuse while you're still capable. The choice is yours
                — we just want to make sure you understand the tradeoff.
              </div>
            </WarningBanner>

            {/* Custom incapacity definition (advanced path) */}
            <div
              style={{
                background: TOKENS.PAPER_2,
                border: `1px solid ${TOKENS.LINE}`,
                borderRadius: 10,
                padding: "16px 18px",
              }}
            >
              <button
                type="button"
                onClick={() => setCustomIncapacity(!customIncapacity)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  background: "transparent",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 4,
                    border: `1.5px solid ${customIncapacity ? TOKENS.INK : TOKENS.INK_40}`,
                    background: customIncapacity ? TOKENS.INK : TOKENS.PAPER,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                >
                  {customIncapacity && <Check size={12} strokeWidth={3} color={TOKENS.PAPER} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 14,
                      fontWeight: 600,
                      color: TOKENS.INK,
                      marginBottom: 4,
                    }}
                  >
                    Customize the incapacity definition (advanced)
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: TOKENS.WARN_INK_STRONG,
                        background: TOKENS.WARN_BG,
                        padding: "2px 6px",
                        borderRadius: 3,
                      }}
                    >
                      Attorney recommended
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: TOKENS.INK_60, lineHeight: 1.5 }}>
                    Texas's default definition is "a physician licensed to practice
                    medicine in the United States certifies in writing that I am
                    mentally incapable of managing my financial affairs." Custom
                    definitions (requiring a specific physician, two physicians, or
                    different criteria) require attorney review.
                  </div>
                </div>
              </button>
            </div>

            {customIncapacity && (
              <>
                <AttorneyReferralPrompt
                  ruleId="custom_incapacity_definition"
                  context="custom_incapacity"
                  sessionId={state.sessionId}
                />
                <WarningBanner
                  severity="warning"
                  title="Attorney consultation required for custom definitions"
                  onAcknowledge={handleCustomIncapacityAck}
                  acknowledged={customIncapacityAck}
                  acknowledgmentLabel="I understand custom incapacity definitions need attorney drafting and will engage one."
                >
                  POA-IT's wizard only supports the Texas default incapacity
                  definition. A Texas attorney can draft a custom definition that
                  fits your specific situation (e.g., "two physicians, one
                  geriatrician" or "physician plus written notice from my adult
                  children"). We'll save your progress while you connect with one.
                </WarningBanner>
              </>
            )}
          </>
        )}

        {/* Immediate — short confirming message */}
        {immediate && (
          <WarningBanner severity="info" title="Great choice for most situations">
            With an immediate POA, your agent can help with things like signing
            for you while you're traveling, paying bills while you're recovering
            from surgery, or handling matters during ordinary life events — not
            just incapacity. Texas law requires your agent to act in your best
            interest (Tex. Est. Code § 751.101–.106) at all times.
          </WarningBanner>
        )}
      </div>
    </WizardShell>
  );
}

function ChoiceCard({
  icon: Icon,
  selected,
  onClick,
  badge,
  badgeColor,
  title,
  subtitle,
  citation,
  comparisonRows,
  tooltipKey,
  sessionId,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: "100%",
        background: selected ? TOKENS.PAPER_2 : TOKENS.PAPER,
        border: `1.5px solid ${selected ? TOKENS.INK : TOKENS.LINE}`,
        borderRadius: 12,
        padding: "20px 22px",
        cursor: "pointer",
        transition: "all 0.15s",
        textAlign: "left",
        fontFamily: FONTS.SANS,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 9,
            background: selected ? TOKENS.INK : TOKENS.PAPER_2,
            color: selected ? TOKENS.PAPER : TOKENS.INK_60,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon size={18} strokeWidth={2} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
              marginBottom: 4,
            }}
          >
            <div
              style={{
                fontSize: 17,
                fontWeight: 600,
                color: TOKENS.INK,
                letterSpacing: "-0.01em",
              }}
            >
              {title}
            </div>
            {badge && (
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: TOKENS.PAPER,
                  background: badgeColor || TOKENS.LIVE_GREEN,
                  padding: "2px 7px",
                  borderRadius: 3,
                }}
              >
                {badge}
              </span>
            )}
            <StatutoryTooltip
              plainEnglish={subtitle}
              citation={citation}
              onOpen={() => audit.tooltipOpened(sessionId, tooltipKey)}
            />
          </div>
          <div style={{ fontSize: 14, color: TOKENS.INK_60, lineHeight: 1.5, marginBottom: 14 }}>
            {subtitle}
          </div>

          <div
            style={{
              background: selected ? TOKENS.PAPER : TOKENS.PAPER_2,
              border: `1px solid ${TOKENS.LINE}`,
              borderRadius: 8,
              padding: "12px 14px",
            }}
          >
            {comparisonRows.map((row, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 16,
                  padding: i > 0 ? "8px 0 0" : "0",
                  borderTop: i > 0 ? `1px solid ${TOKENS.LINE}` : "none",
                  marginTop: i > 0 ? 8 : 0,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    color: TOKENS.INK_40,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    flexShrink: 0,
                  }}
                >
                  {row.label}
                </div>
                <div
                  style={{
                    fontSize: 12.5,
                    color: TOKENS.INK,
                    fontWeight: 500,
                    textAlign: "right",
                  }}
                >
                  {row.value}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div
          style={{
            width: 18,
            height: 18,
            borderRadius: "50%",
            border: `2px solid ${selected ? TOKENS.INK : TOKENS.INK_40}`,
            background: TOKENS.PAPER,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            marginTop: 4,
          }}
        >
          {selected && (
            <div style={{ width: 9, height: 9, borderRadius: "50%", background: TOKENS.INK }} />
          )}
        </div>
      </div>
    </button>
  );
}
