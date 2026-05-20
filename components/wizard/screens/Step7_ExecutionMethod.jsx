"use client";

import { useEffect } from "react";
import { Video, MapPin, Lock, Check } from "lucide-react";
import { TOKENS, FONTS } from "../shared/tokens";
import { WizardShell } from "../WizardShell";
import { StatutoryTooltip } from "../shared/StatutoryTooltip";
import { WarningBanner } from "../shared/WarningBanner";
import { updateState, markStepComplete } from "../../../lib/wizard/state";
import { audit } from "../../../lib/audit/logger";

/**
 * Step 7 — Execution Method
 * Phase 3 § 3.9
 *
 * Choose RON (Remote Online Notarization) or in-person notary.
 *
 * If state.executionMethodLocked === true (set by Step 4a when homestead +
 * home-equity authority both granted), the RON option is disabled with an
 * explanation citing Tex. Const. art. XVI § 50(a)(6)(N).
 */
export function Step7_ExecutionMethod({ state, setState, onBack, onContinue }) {
  useEffect(() => {
    audit.stepEntered(state.sessionId, "step7_execution_method");
  }, [state.sessionId]);

  const locked = state.executionMethodLocked === true;
  const ron = state.executionMethod === "ron";
  const inPerson = state.executionMethod === "in_person";

  function selectMethod(method) {
    if (locked && method === "ron") return; // can't pick RON when locked
    setState(updateState(state, { executionMethod: method }));
    audit.fieldChanged(state.sessionId, "executionMethod", true);
  }

  const canContinue = !!state.executionMethod;

  function handleContinue() {
    if (!canContinue) return;
    audit.stepCompleted(state.sessionId, "step7_execution_method", {
      executionMethod: state.executionMethod,
      ronWasAvailable: !locked,
      homesteadLockApplied: locked,
    });
    const next = markStepComplete(state, "step7_execution_method", "step8_review");
    setState(next);
    onContinue();
  }

  return (
    <WizardShell
      stepId="step7_execution_method"
      stepNumber="Step 8 of 9 · Signing Method"
      title="How will you sign this?"
      subtitle="Texas requires powers of attorney to be notarized. You have two options — and depending on what you've granted, one may be required."
      onBack={onBack}
      onContinue={handleContinue}
      canContinue={canContinue}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16, fontFamily: FONTS.SANS }}>
        {/* Lock notice if applicable */}
        {locked && (
          <WarningBanner
            severity="warning"
            title="In-person signing required for your situation"
            citation="Tex. Const. art. XVI § 50(a)(6)(N); Tex. Est. Code § 752.051"
          >
            Because you've granted home-equity authority on your Texas homestead,
            the Texas Constitution requires you to sign in person at one of three
            locations. Remote online notarization is not available for this
            combination. You can change this by removing home-equity authority on
            the homestead screen.
          </WarningBanner>
        )}

        {/* RON option — disabled if locked */}
        <MethodCard
          icon={Video}
          selected={ron}
          disabled={locked}
          onClick={() => selectMethod("ron")}
          badge={!locked ? "Recommended" : null}
          badgeColor={TOKENS.LIVE_GREEN}
          title="Remote Online Notarization (RON)"
          subtitle="Sign from anywhere with a webcam. A Texas-licensed online notary witnesses your signature via video conference."
          citation="Tex. Gov't Code Ch. 406, Subch. C"
          tooltipKey="ron"
          sessionId={state.sessionId}
          features={[
            "10-15 minutes start to finish",
            "Government-issued ID required (we verify)",
            "Texas-licensed online notary",
            "Cost included in your POA-IT purchase",
            "Available 24/7 in most cases",
          ]}
          lockedReason="Not available for homestead + home-equity combinations"
        />

        {/* In-person option */}
        <MethodCard
          icon={MapPin}
          selected={inPerson}
          onClick={() => selectMethod("in_person")}
          title="In-Person Notary"
          subtitle="Print the document, take it to a Texas notary in person. Common locations: banks, UPS Stores, AAA offices, many libraries."
          citation="Tex. Gov't Code § 406.024"
          tooltipKey="in_person"
          sessionId={state.sessionId}
          features={[
            "You print and bring the document",
            "Most counties have notaries widely available",
            "Standard notary fee: ~$10 per signature (TX statute)",
            "You schedule the appointment",
            ...(locked
              ? ["Required for homestead + home-equity authority"]
              : []),
          ]}
        />

        {/* Selected confirmation */}
        {ron && !locked && (
          <WarningBanner severity="info" title="Great choice — RON is the smoother path">
            After payment (in the production version of POA-IT), you'll be routed
            to our notary partner. They'll verify your ID, ask a few
            knowledge-based questions, and witness your signature on a video call.
            Texas has authorized this since 2018.
          </WarningBanner>
        )}

        {inPerson && (
          <WarningBanner severity="info" title="What happens next with in-person notarization">
            After payment (in production), you'll receive an email with the document
            ready to print and instructions for finding a Texas notary nearby. The
            notary will verify your ID and witness your signature. Once notarized,
            scan or photograph the document and we'll add it to your vault.
            {locked && (
              <div style={{ marginTop: 10 }}>
                <strong>Reminder:</strong> For your homestead + home-equity
                situation, you must sign at the office of your lender, a Texas
                attorney's office, or a title company. Standard notaries
                (banks, UPS, etc.) are not sufficient for this combination.
              </div>
            )}
          </WarningBanner>
        )}
      </div>
    </WizardShell>
  );
}

function MethodCard({
  icon: Icon,
  selected,
  disabled,
  onClick,
  badge,
  badgeColor,
  title,
  subtitle,
  citation,
  features,
  tooltipKey,
  sessionId,
  lockedReason,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        background: disabled
          ? TOKENS.PAPER_2
          : selected
          ? TOKENS.PAPER_2
          : TOKENS.PAPER,
        border: `1.5px solid ${
          disabled ? TOKENS.LINE : selected ? TOKENS.INK : TOKENS.LINE
        }`,
        borderRadius: 12,
        padding: "20px 22px",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "all 0.15s",
        textAlign: "left",
        fontFamily: FONTS.SANS,
        opacity: disabled ? 0.5 : 1,
        position: "relative",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 9,
            background: selected && !disabled ? TOKENS.INK : TOKENS.PAPER_2,
            color: selected && !disabled ? TOKENS.PAPER : TOKENS.INK_60,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {disabled ? <Lock size={16} strokeWidth={2} /> : <Icon size={18} strokeWidth={2} />}
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
            {badge && !disabled && (
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
            {disabled && (
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: TOKENS.WARN_INK_STRONG,
                  background: TOKENS.WARN_BG,
                  padding: "2px 7px",
                  borderRadius: 3,
                }}
              >
                Not Available
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

          <ul
            style={{
              margin: 0,
              padding: 0,
              listStyle: "none",
              display: "flex",
              flexDirection: "column",
              gap: 7,
            }}
          >
            {features.map((feat, i) => (
              <li
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                  fontSize: 13,
                  color: TOKENS.INK_60,
                  lineHeight: 1.5,
                }}
              >
                <Check
                  size={12}
                  strokeWidth={2.4}
                  color={disabled ? TOKENS.INK_40 : TOKENS.LIVE_GREEN}
                  style={{ marginTop: 4, flexShrink: 0 }}
                />
                <span>{feat}</span>
              </li>
            ))}
          </ul>

          {disabled && lockedReason && (
            <div
              style={{
                marginTop: 12,
                fontSize: 12,
                color: TOKENS.WARN_INK_STRONG,
                fontWeight: 500,
                padding: "8px 10px",
                background: TOKENS.WARN_BG,
                border: `1px solid ${TOKENS.WARN_BORDER}`,
                borderRadius: 6,
              }}
            >
              {lockedReason}
            </div>
          )}
        </div>
        {!disabled && (
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
        )}
      </div>
    </button>
  );
}
