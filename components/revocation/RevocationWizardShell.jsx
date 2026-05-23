"use client";

import { ArrowLeft, ArrowRight, ShieldOff } from "lucide-react";
import { TOKENS, FONTS } from "../wizard/shared/tokens";
import { getVisibleSteps } from "../../lib/wizard/revocationState";

/**
 * RevocationWizardShell
 *
 * Wraps each revocation wizard screen with consistent chrome. Mirrors the
 * POA wizard's WizardShell but with revocation-specific progress display
 * and an explicit "Revocation" header to make the user's context clear.
 *
 * Sprint 4c — Round 2.
 */
export function RevocationWizardShell({
  children,
  state,
  stepId,
  title,
  subtitle,
  onBack,
  onContinue,
  canContinue = true,
  continueLabel = "Continue",
  hideNavigation = false,
}) {
  const steps = getVisibleSteps(state);
  const currentIndex = steps.findIndex((s) => s.id === stepId);

  return (
    <div
      style={{
        maxWidth: 760,
        margin: "0 auto",
        padding: "32px 32px 80px",
        fontFamily: FONTS.SANS,
      }}
    >
      {/* Top branding: this is a revocation, not a regular POA wizard */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 14px",
          background: "#FEF2F2",
          border: `1px solid #FECACA`,
          borderRadius: 8,
          marginBottom: 24,
        }}
      >
        <ShieldOff size={16} strokeWidth={2} color="#B91C1C" />
        <div style={{ fontSize: 12.5, color: "#991B1B", fontWeight: 600, letterSpacing: 0.2 }}>
          Revocation of Power of Attorney
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 11, color: "#991B1B", opacity: 0.7 }}>
          Draft
        </div>
      </div>

      {/* Progress indicator */}
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            display: "flex",
            gap: 4,
            marginBottom: 10,
          }}
        >
          {steps.map((step, idx) => {
            const isComplete = idx < currentIndex;
            const isCurrent = idx === currentIndex;
            const isFuture = idx > currentIndex;
            return (
              <div
                key={step.id}
                style={{
                  flex: 1,
                  height: 3,
                  borderRadius: 2,
                  background: isComplete
                    ? TOKENS.INK
                    : isCurrent
                    ? TOKENS.INK
                    : TOKENS.LINE,
                  opacity: isFuture ? 0.4 : 1,
                  transition: "background 0.15s",
                }}
              />
            );
          })}
        </div>
        <div
          style={{
            fontSize: 11,
            fontFamily: FONTS.MONO,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: TOKENS.INK_40,
            fontWeight: 600,
          }}
        >
          {currentIndex >= 0
            ? `Step ${currentIndex + 1} of ${steps.length}`
            : "Revocation"}
        </div>
      </div>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontSize: 26,
            fontWeight: 600,
            color: TOKENS.INK,
            letterSpacing: "-0.015em",
            margin: 0,
            marginBottom: subtitle ? 6 : 0,
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <div style={{ fontSize: 14, color: TOKENS.INK_60, lineHeight: 1.55 }}>
            {subtitle}
          </div>
        )}
      </div>

      {/* Step content */}
      <div>{children}</div>

      {/* Footer navigation */}
      {!hideNavigation && (
        <div
          style={{
            marginTop: 36,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
          }}
        >
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "10px 14px",
                background: "transparent",
                color: TOKENS.INK_60,
                border: "none",
                borderRadius: 6,
                fontSize: 13,
                fontFamily: FONTS.SANS,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              <ArrowLeft size={14} strokeWidth={2.2} /> Back
            </button>
          ) : (
            <div />
          )}

          {onContinue && (
            <button
              type="button"
              onClick={onContinue}
              disabled={!canContinue}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "10px 18px",
                background: canContinue ? TOKENS.INK : TOKENS.INK_20,
                color: TOKENS.PAPER,
                border: "none",
                borderRadius: 6,
                fontSize: 13,
                fontFamily: FONTS.SANS,
                fontWeight: 600,
                cursor: canContinue ? "pointer" : "not-allowed",
                letterSpacing: 0.2,
              }}
            >
              {continueLabel}
              {canContinue && <ArrowRight size={14} strokeWidth={2.2} />}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
