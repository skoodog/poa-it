"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { TOKENS, FONTS } from "./shared/tokens";
import { WIZARD_STEPS } from "../../lib/wizard/state";

/**
 * WizardShell
 *
 * Wraps every wizard screen with consistent chrome:
 *   - Progress indicator across the 9 main steps (conditional steps hidden)
 *   - Back / Continue navigation
 *   - Optional "Continue" button override for screens with custom CTAs
 *
 * Screens own their content area and pass header copy + actions to the shell.
 *
 * Props:
 *   children          — the screen body
 *   stepId            — current step ID, e.g. "step2_principal"
 *   stepNumber        — display number for the header, e.g. "Step 3 of 9"
 *   title             — H1 text
 *   subtitle          — optional subtitle paragraph
 *   onBack            — called when back button clicked (omit to hide button)
 *   onContinue        — called when continue button clicked
 *   canContinue       — boolean; disables continue button when false
 *   continueLabel     — defaults to "Continue"
 *   hideNavigation    — for screens with custom CTAs
 */
export function WizardShell({
  children,
  stepId,
  stepNumber,
  title,
  subtitle,
  onBack,
  onContinue,
  canContinue = true,
  continueLabel = "Continue",
  hideNavigation = false,
}) {
  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 32px 80px", fontFamily: FONTS.SANS }}>
      {/* Step header */}
      <div style={{ marginBottom: 32 }}>
        {stepNumber && (
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
            {stepNumber}
          </div>
        )}
        {title && (
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
            {title}
          </h1>
        )}
        {subtitle && (
          <p
            style={{
              fontSize: 15,
              color: TOKENS.INK_60,
              lineHeight: 1.55,
              margin: 0,
            }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {/* Screen content */}
      <div>{children}</div>

      {/* Navigation */}
      {!hideNavigation && (
        <div
          style={{
            marginTop: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          {onBack ? (
            <button
              onClick={onBack}
              style={{
                padding: "11px 18px",
                fontSize: 14,
                fontWeight: 500,
                background: TOKENS.PAPER,
                color: TOKENS.INK_60,
                border: `1px solid ${TOKENS.LINE}`,
                borderRadius: 7,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontFamily: FONTS.SANS,
              }}
            >
              <ArrowLeft size={14} strokeWidth={2} /> Back
            </button>
          ) : (
            <div />
          )}
          <button
            onClick={onContinue}
            disabled={!canContinue}
            style={{
              padding: "12px 22px",
              fontSize: 14,
              fontWeight: 600,
              background: canContinue ? TOKENS.INK : TOKENS.INK_20,
              color: TOKENS.PAPER,
              border: "none",
              borderRadius: 7,
              cursor: canContinue ? "pointer" : "not-allowed",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              transition: "all 0.15s",
              fontFamily: FONTS.SANS,
            }}
          >
            {continueLabel}
            {canContinue && <ArrowRight size={14} strokeWidth={2.2} />}
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Standalone progress indicator (rendered above the shell in the wizard page).
 * Highlights the current step and shows completed steps with checkmarks.
 * Conditional steps (homestead) are hidden unless reached.
 */
export function ProgressIndicator({ currentStep, completedSteps }) {
  const visible = WIZARD_STEPS.filter((s) => !s.conditional);

  return (
    <div
      style={{
        background: TOKENS.PAPER_2,
        borderBottom: `1px solid ${TOKENS.LINE}`,
        padding: "12px 32px",
      }}
    >
      <div
        style={{
          maxWidth: 880,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 11,
          color: TOKENS.INK_40,
          fontFamily: FONTS.MONO,
          letterSpacing: "0.04em",
          overflowX: "auto",
          paddingBottom: 2,
        }}
      >
        {visible.map((s, i, arr) => {
          const isComplete = completedSteps.includes(s.id);
          const isCurrent = currentStep === s.id;
          return (
            <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
              <span
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  background: isComplete
                    ? TOKENS.LIVE_GREEN
                    : isCurrent
                    ? TOKENS.INK
                    : TOKENS.LINE,
                  color: isComplete || isCurrent ? TOKENS.PAPER : TOKENS.INK_40,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {isComplete ? "✓" : i + 1}
              </span>
              <span
                style={{
                  color: isCurrent ? TOKENS.INK : isComplete ? TOKENS.INK_60 : TOKENS.INK_40,
                  fontWeight: isCurrent ? 600 : 500,
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                }}
              >
                {s.label}
              </span>
              {i < arr.length - 1 && (
                <span
                  style={{
                    width: 16,
                    height: 1,
                    background: TOKENS.LINE,
                    marginLeft: 2,
                    marginRight: 2,
                    flexShrink: 0,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
