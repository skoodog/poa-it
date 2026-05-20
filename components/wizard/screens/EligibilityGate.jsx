"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, AlertCircle, ArrowRight, Mail } from "lucide-react";
import { TOKENS, FONTS } from "../shared/tokens";
import { StatutoryTooltip } from "../shared/StatutoryTooltip";
import { WarningBanner } from "../shared/WarningBanner";
import { Disclaimer } from "../shared/Disclaimer";
import { validateWizardState, hasBlockers } from "../../../lib/wizard/validator";
import { updateState, markStepComplete } from "../../../lib/wizard/state";
import { audit } from "../../../lib/audit/logger";

/**
 * Step 0 — Eligibility Gate
 * Phase 3 § 3.1
 *
 * Four yes/no questions that gate access to the wizard. Designed to prevent
 * users who can't be served (non-Texas residents, minors, those creating for
 * someone else, those under guardianship) from getting deep into a flow that
 * won't help them.
 *
 * This screen is also the tracer bullet for Phase 1 — it exercises every
 * piece of the substrate (state, validator, audit logger, shared components,
 * statutory tooltips) end-to-end.
 */
export function EligibilityGate({ state, setState, onContinue }) {
  // Log step entry once on mount
  useEffect(() => {
    audit.stepEntered(state.sessionId, "eligibility_gate");
  }, [state.sessionId]);

  const validation = validateWizardState(state, "eligibility_gate");
  const allAnswered =
    state.isTexasResident !== null &&
    state.isAdult !== null &&
    state.forSelf !== null &&
    state.underGuardianship !== null;

  const blocked = hasBlockers(validation);
  const canContinue = allAnswered && !blocked;

  // The "not sure" answer for guardianship needs special handling
  const guardianshipNotSure = state.underGuardianship === "not_sure";

  function handleAnswer(field, value) {
    const updated = updateState(state, { [field]: value });
    setState(updated);
    audit.fieldChanged(state.sessionId, field, true);
  }

  function handleContinue() {
    if (!canContinue) return;
    audit.stepCompleted(state.sessionId, "eligibility_gate", {
      isTexasResident: state.isTexasResident,
      isAdult: state.isAdult,
      forSelf: state.forSelf,
      underGuardianship: state.underGuardianship,
    });
    const next = markStepComplete(state, "eligibility_gate", "step1_document_type");
    setState(next);
    if (onContinue) onContinue();
  }

  // Show blocker messaging for any failed answer
  const failedQuestions = [];
  if (state.isTexasResident === false) {
    failedQuestions.push({
      reason: "Not a Texas resident",
      message:
        "POA-IT currently serves Texas residents only. We're expanding to other states.",
      cta: "Join the waitlist for your state",
      icon: Mail,
    });
  }
  if (state.isAdult === false) {
    failedQuestions.push({
      reason: "Under 18",
      message:
        "Texas law generally requires you to be 18 to create a power of attorney. If you're an emancipated minor, please contact support.",
      cta: "Contact support",
    });
  }
  if (state.forSelf === false) {
    failedQuestions.push({
      reason: "Not creating for yourself",
      message:
        "Powers of attorney must be created by the person granting authority. If you're helping a family member, we'd love for them to create their own account.",
      cta: "Learn how to help a family member",
    });
  }
  if (state.underGuardianship === true) {
    failedQuestions.push({
      reason: "Under court-ordered guardianship",
      message:
        "Texas law may limit your ability to grant a power of attorney while under guardianship of the estate. This requires individualized legal advice.",
      cta: "Find a Texas attorney through our Marketplace",
    });
  }

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "48px 32px", fontFamily: FONTS.SANS }}>
      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <div
          className="mono"
          style={{
            fontSize: 11,
            fontFamily: FONTS.MONO,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: TOKENS.INK_40,
            fontWeight: 600,
            marginBottom: 12,
          }}
        >
          Step 1 of 9 · Eligibility
        </div>
        <h1
          style={{
            fontSize: 32,
            fontWeight: 600,
            letterSpacing: "-0.025em",
            lineHeight: 1.15,
            margin: "0 0 12px",
            color: TOKENS.INK,
          }}
        >
          Let's confirm POA-IT is right for you.
        </h1>
        <p
          style={{
            fontSize: 15,
            color: TOKENS.INK_60,
            lineHeight: 1.55,
            margin: 0,
          }}
        >
          A few yes/no questions to make sure our software can serve your needs.
          This takes about 30 seconds.
        </p>
      </div>

      {/* Questions */}
      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        <YesNoQuestion
          number="1"
          question={
            <>
              Are you a Texas resident?
              <StatutoryTooltip
                plainEnglish="Powers of attorney are governed by the state where the principal lives. POA-IT currently serves Texas residents only; other states are coming soon."
                citation="Tex. Est. Code § 751.001 et seq."
                onOpen={() => audit.tooltipOpened(state.sessionId, "tx_resident")}
              />
            </>
          }
          value={state.isTexasResident}
          onChange={(v) => handleAnswer("isTexasResident", v)}
        />

        <YesNoQuestion
          number="2"
          question={
            <>
              Are you at least 18 years old?
              <StatutoryTooltip
                plainEnglish="Texas law generally requires 18 to create a binding power of attorney. Limited exceptions exist for emancipated minors."
                citation="Tex. Fam. Code § 31.001 (emancipation)"
                onOpen={() => audit.tooltipOpened(state.sessionId, "age_18")}
              />
            </>
          }
          value={state.isAdult}
          onChange={(v) => handleAnswer("isAdult", v)}
        />

        <YesNoQuestion
          number="3"
          question={
            <>
              Are you creating this for yourself, not for another person?
              <StatutoryTooltip
                plainEnglish="A power of attorney can only be created by the person granting the authority — that's called the 'principal.' You cannot create one on someone else's behalf, even if you're helping a family member."
                onOpen={() => audit.tooltipOpened(state.sessionId, "for_self")}
              />
            </>
          }
          value={state.forSelf}
          onChange={(v) => handleAnswer("forSelf", v)}
          customAnswers={[
            { label: "Yes — this is for me", value: true },
            { label: "No — for another person", value: false },
          ]}
        />

        <div>
          <QuestionHeader
            number="4"
            question={
              <>
                Are you currently subject to a court-ordered guardianship of your estate?
                <StatutoryTooltip
                  plainEnglish="A 'guardianship of the estate' is a court order that appoints someone else to manage your finances. If you've never been to a court hearing about your finances and no court has ever appointed someone to manage them, you almost certainly don't have one."
                  citation="Tex. Est. Code § 1101 et seq."
                  onOpen={() => audit.tooltipOpened(state.sessionId, "guardianship")}
                />
              </>
            }
          />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
            <AnswerButton
              label="No"
              selected={state.underGuardianship === false}
              onClick={() => handleAnswer("underGuardianship", false)}
            />
            <AnswerButton
              label="Yes"
              selected={state.underGuardianship === true}
              onClick={() => handleAnswer("underGuardianship", true)}
              variant="caution"
            />
            <AnswerButton
              label="Not sure"
              selected={state.underGuardianship === "not_sure"}
              onClick={() => handleAnswer("underGuardianship", "not_sure")}
              variant="neutral"
            />
          </div>
          {guardianshipNotSure && (
            <div
              style={{
                marginTop: 12,
                padding: "12px 14px",
                background: TOKENS.PAPER_2,
                border: `1px solid ${TOKENS.LINE}`,
                borderRadius: 8,
                fontSize: 13,
                color: TOKENS.INK_60,
                lineHeight: 1.55,
              }}
            >
              If you've never been to a court hearing about your finances and no
              court has ever appointed someone to manage them for you, you almost
              certainly don't have one.{" "}
              <button
                onClick={() => handleAnswer("underGuardianship", false)}
                style={{
                  color: TOKENS.INK,
                  fontWeight: 600,
                  textDecoration: "underline",
                  cursor: "pointer",
                  background: "none",
                  border: "none",
                  padding: 0,
                  fontSize: 13,
                }}
              >
                I'm confident I don't have one
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Validation feedback */}
      {failedQuestions.length > 0 && (
        <div style={{ marginTop: 28 }}>
          {failedQuestions.map((fq, i) => (
            <WarningBanner
              key={i}
              severity={fq.reason.includes("Texas") ? "info" : "warning"}
              title={fq.reason}
            >
              {fq.message}
            </WarningBanner>
          ))}
        </div>
      )}

      {/* Continue button + disclaimer */}
      <div style={{ marginTop: 36 }}>
        <button
          onClick={handleContinue}
          disabled={!canContinue}
          style={{
            width: "100%",
            padding: "16px 22px",
            fontSize: 15,
            fontWeight: 600,
            background: canContinue ? TOKENS.INK : TOKENS.INK_20,
            color: TOKENS.PAPER,
            border: "none",
            borderRadius: 8,
            cursor: canContinue ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            transition: "all 0.15s",
            fontFamily: FONTS.SANS,
          }}
        >
          {blocked
            ? "We can't serve you through self-service software"
            : !allAnswered
            ? "Answer all four questions to continue"
            : "Continue to step 2"}
          {canContinue && <ArrowRight size={14} strokeWidth={2.2} />}
        </button>

        <div style={{ marginTop: 20 }}>
          <Disclaimer variant="inline" />
        </div>
      </div>
    </div>
  );
}

function QuestionHeader({ number, question }) {
  return (
    <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
      <div
        className="mono"
        style={{
          fontFamily: FONTS.MONO,
          fontSize: 14,
          color: TOKENS.INK_40,
          fontWeight: 600,
          flexShrink: 0,
          marginTop: 2,
          letterSpacing: "0.02em",
        }}
      >
        Q{number}.
      </div>
      <div
        style={{
          fontSize: 16,
          fontWeight: 500,
          color: TOKENS.INK,
          lineHeight: 1.5,
          letterSpacing: "-0.005em",
        }}
      >
        {question}
      </div>
    </div>
  );
}

function YesNoQuestion({ number, question, value, onChange, customAnswers }) {
  const answers = customAnswers || [
    { label: "Yes", value: true },
    { label: "No", value: false },
  ];
  return (
    <div>
      <QuestionHeader number={number} question={question} />
      <div style={{ display: "flex", gap: 8, marginTop: 12, paddingLeft: 32 }}>
        {answers.map((a) => (
          <AnswerButton
            key={String(a.value)}
            label={a.label}
            selected={value === a.value}
            onClick={() => onChange(a.value)}
          />
        ))}
      </div>
    </div>
  );
}

function AnswerButton({ label, selected, onClick, variant = "default" }) {
  const styles = {
    default: {
      selectedBg: TOKENS.INK,
      selectedColor: TOKENS.PAPER,
      selectedBorder: TOKENS.INK,
    },
    caution: {
      selectedBg: TOKENS.WARN_INK_STRONG,
      selectedColor: TOKENS.PAPER,
      selectedBorder: TOKENS.WARN_INK_STRONG,
    },
    neutral: {
      selectedBg: TOKENS.INK_60,
      selectedColor: TOKENS.PAPER,
      selectedBorder: TOKENS.INK_60,
    },
  }[variant];

  return (
    <button
      onClick={onClick}
      style={{
        padding: "10px 18px",
        fontSize: 14,
        fontWeight: 500,
        background: selected ? styles.selectedBg : TOKENS.PAPER,
        color: selected ? styles.selectedColor : TOKENS.INK,
        border: `1px solid ${selected ? styles.selectedBorder : TOKENS.LINE}`,
        borderRadius: 6,
        cursor: "pointer",
        transition: "all 0.15s",
        minWidth: 80,
        fontFamily: FONTS.SANS,
      }}
    >
      {label}
    </button>
  );
}
