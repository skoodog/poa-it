"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { EligibilityGate } from "../../components/wizard/screens/EligibilityGate";
import { Step1_DocumentType } from "../../components/wizard/screens/Step1_DocumentType";
import { Step2_Principal } from "../../components/wizard/screens/Step2_Principal";
import { Step3_Agent } from "../../components/wizard/screens/Step3_Agent";
import { Step4_Powers } from "../../components/wizard/screens/Step4_Powers";
import { Step4a_Homestead } from "../../components/wizard/screens/Step4a_Homestead";
import { Step5_HotPowers } from "../../components/wizard/screens/Step5_HotPowers";
import { Step6_EffectiveDate } from "../../components/wizard/screens/Step6_EffectiveDate";
import { Step7_ExecutionMethod } from "../../components/wizard/screens/Step7_ExecutionMethod";
import { Step8_Review } from "../../components/wizard/screens/Step8_Review";
import { Step9_Waitlist } from "../../components/wizard/screens/Step9_Waitlist";
import { ProgressIndicator } from "../../components/wizard/WizardShell";
import { TOKENS, FONTS } from "../../components/wizard/shared/tokens";
import {
  createInitialState,
  loadState,
  clearState,
  updateState,
  WIZARD_STEPS,
  getPreviousStep,
} from "../../lib/wizard/state";
import { getAuditLog, clearAuditLog } from "../../lib/audit/logger";

/**
 * /wizard
 *
 * Phase 1 deliverable: the wizard substrate is in place. The Eligibility Gate
 * is built as the tracer bullet — completing it exercises the state engine,
 * the validator, the audit logger, and every shared component.
 *
 * Subsequent phases (2-4) will add the remaining screens. Phase 5 cuts over
 * the homepage modal to route here.
 *
 * This page also includes a small "Phase 1 status" panel at the bottom that
 * lets you inspect the substrate during development. It'll be removed by Phase 5.
 */
export default function WizardPage() {
  const [state, setState] = useState(null);
  const [showDebug, setShowDebug] = useState(false);

  // Load state from localStorage on mount, or create fresh
  useEffect(() => {
    const existing = loadState();
    if (existing) {
      setState(existing);
    } else {
      setState(createInitialState());
    }

    // Check ?debug=true in URL for the debug panel
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("debug") === "true") setShowDebug(true);
    }
  }, []);

  function handleStartOver() {
    if (typeof window !== "undefined") {
      if (!window.confirm("Reset wizard and clear all progress? This cannot be undone.")) {
        return;
      }
    }
    clearState();
    clearAuditLog();
    setState(createInitialState());
  }

  if (!state) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: FONTS.SANS,
          color: TOKENS.INK_40,
          fontSize: 14,
        }}
      >
        Loading wizard…
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: TOKENS.PAPER,
        fontFamily: FONTS.SANS,
        color: TOKENS.INK,
        WebkitFontSmoothing: "antialiased",
      }}
    >
      <style suppressHydrationWarning>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; background: ${TOKENS.PAPER}; }
        button { font-family: inherit; }
      `}</style>

      {/* Top nav */}
      <header
        style={{
          borderBottom: `1px solid ${TOKENS.LINE}`,
          background: TOKENS.PAPER,
          padding: "16px 32px",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div
          style={{
            maxWidth: 880,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <a
            href="/"
            style={{
              fontSize: 17,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              textDecoration: "none",
              color: TOKENS.INK,
            }}
          >
            poa-it
          </a>
          <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 12 }}>
            <span
              className="mono"
              style={{
                fontFamily: FONTS.MONO,
                color: TOKENS.INK_40,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                fontWeight: 600,
              }}
            >
              Wizard · beta · Texas
            </span>
            <button
              onClick={handleStartOver}
              style={{
                fontSize: 12,
                color: TOKENS.INK_60,
                background: "none",
                border: "none",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Start over
            </button>
          </div>
        </div>
      </header>

      {/* Progress indicator */}
      <ProgressIndicator
        currentStep={state.currentStep}
        completedSteps={state.completedSteps}
      />

      {/* Main content area */}
      <main>
        <StepRouter state={state} setState={setState} />
      </main>

      {/* Debug panel — only shown with ?debug=true */}
      {showDebug && <DebugPanel state={state} />}

      {/* Footer */}
      <footer
        style={{
          borderTop: `1px solid ${TOKENS.LINE}`,
          background: TOKENS.PAPER_2,
          padding: "32px 32px",
          marginTop: 80,
        }}
      >
        <div style={{ maxWidth: 880, margin: "0 auto", textAlign: "center" }}>
          <div
            style={{
              fontSize: 11,
              color: TOKENS.INK_40,
              lineHeight: 1.6,
              maxWidth: 600,
              margin: "0 auto",
            }}
          >
            POA-IT is not a law firm and does not provide legal advice. The forms and
            information on this site are not a substitute for the advice of an attorney
            licensed in Texas. Tex. Gov't Code § 81.101(c).
          </div>
          <div style={{ marginTop: 12, fontSize: 11, color: TOKENS.INK_40 }}>
            © 2026 POA-IT Inc. ·{" "}
            <a href="/legal/terms" style={{ color: TOKENS.INK_60 }}>
              Terms
            </a>
            {" · "}
            <a href="/legal/privacy" style={{ color: TOKENS.INK_60 }}>
              Privacy
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

/**
 * StepRouter — renders the current step's screen component.
 *
 * Each screen gets state + setState plus onBack/onContinue handlers that
 * mutate state.currentStep. The router itself doesn't know about step
 * ordering — it just renders whichever screen currentStep points to.
 *
 * If currentStep is past the last screen built in this phase, we render
 * the "next phase coming" placeholder so the user sees a useful message
 * instead of nothing.
 */
function StepRouter({ state, setState }) {
  function handleBack() {
    const prevStep = getPreviousStep(state);
    if (!prevStep) return;
    setState(updateState(state, { currentStep: prevStep }));
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleContinue() {
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  switch (state.currentStep) {
    case "eligibility_gate":
      return <EligibilityGate state={state} setState={setState} onContinue={handleContinue} />;
    case "step1_document_type":
      return (
        <Step1_DocumentType
          state={state}
          setState={setState}
          onBack={handleBack}
          onContinue={handleContinue}
        />
      );
    case "step2_principal":
      return (
        <Step2_Principal
          state={state}
          setState={setState}
          onBack={handleBack}
          onContinue={handleContinue}
        />
      );
    case "step3_agent":
      return (
        <Step3_Agent
          state={state}
          setState={setState}
          onBack={handleBack}
          onContinue={handleContinue}
        />
      );
    case "step4_powers":
      return (
        <Step4_Powers
          state={state}
          setState={setState}
          onBack={handleBack}
          onContinue={handleContinue}
        />
      );
    case "step4a_homestead":
      return (
        <Step4a_Homestead
          state={state}
          setState={setState}
          onBack={handleBack}
          onContinue={handleContinue}
        />
      );
    case "step5_hot_powers":
      return (
        <Step5_HotPowers
          state={state}
          setState={setState}
          onBack={handleBack}
          onContinue={handleContinue}
        />
      );
    case "step6_effective_date":
      return (
        <Step6_EffectiveDate
          state={state}
          setState={setState}
          onBack={handleBack}
          onContinue={handleContinue}
        />
      );
    case "step7_execution_method":
      return (
        <Step7_ExecutionMethod
          state={state}
          setState={setState}
          onBack={handleBack}
          onContinue={handleContinue}
        />
      );
    case "step8_review":
      return (
        <Step8_Review
          state={state}
          setState={setState}
          onBack={handleBack}
          onContinue={handleContinue}
        />
      );
    case "step9_waitlist":
      return (
        <Step9_Waitlist
          state={state}
          setState={setState}
          onBack={handleBack}
          onContinue={handleContinue}
        />
      );
    default:
      // Any step ID past what's built in this phase falls through here.
      return <PhaseInProgressPlaceholder state={state} setState={setState} />;
  }
}

/**
 * Fallback shown if state.currentStep is corrupted or points to an unknown
 * step. In normal flow this never renders — Step 9 (Waitlist) is the terminal
 * step and handles its own success state inline.
 */
function PhaseInProgressPlaceholder({ state, setState }) {
  function handleStartOver() {
    if (typeof window !== "undefined") {
      if (!window.confirm("Reset wizard and clear all progress?")) return;
    }
    clearState();
    clearAuditLog();
    setState(createInitialState());
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 32px" }}>
      <div
        style={{
          background: TOKENS.PAPER_2,
          border: `1px solid ${TOKENS.LINE}`,
          borderRadius: 12,
          padding: "32px 36px",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: TOKENS.LIVE_GREEN,
            color: TOKENS.PAPER,
            padding: "4px 10px",
            borderRadius: 100,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            marginBottom: 16,
          }}
        >
          <CheckCircle2 size={12} strokeWidth={2.4} />
          {state.completedSteps.length} steps complete
        </div>

        <h2
          style={{
            fontSize: 26,
            fontWeight: 600,
            letterSpacing: "-0.025em",
            lineHeight: 1.2,
            margin: "0 0 12px",
          }}
        >
          You've reached the edge of what's built so far.
        </h2>

        <p style={{ fontSize: 15, color: TOKENS.INK_60, lineHeight: 1.55, margin: "0 0 24px" }}>
          The next screens — your agent, the powers you're granting, sensitive
          powers, effective date, signing method, review, and waitlist signup —
          are being built in the next deploy. Your wizard answers are saved
          locally and will pick up exactly where you left off when those screens
          ship.
        </p>

        <div
          style={{
            background: TOKENS.PAPER,
            border: `1px solid ${TOKENS.LINE}`,
            borderRadius: 10,
            padding: "20px 22px",
            marginBottom: 20,
          }}
        >
          <div
            className="mono"
            style={{
              fontSize: 11,
              fontFamily: FONTS.MONO,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: TOKENS.INK_40,
              fontWeight: 600,
              marginBottom: 12,
            }}
          >
            What you completed
          </div>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
            {state.completedSteps.map((stepId) => {
              const step = WIZARD_STEPS.find((s) => s.id === stepId);
              if (!step) return null;
              return (
                <li key={stepId} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: TOKENS.INK_60 }}>
                  <CheckCircle2 size={14} strokeWidth={2} color={TOKENS.LIVE_GREEN} />
                  <span>{step.label}</span>
                </li>
              );
            })}
          </ul>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <a
            href="/wizard?debug=true"
            style={{
              padding: "10px 18px",
              fontSize: 13,
              fontWeight: 500,
              background: TOKENS.PAPER,
              color: TOKENS.INK,
              border: `1px solid ${TOKENS.LINE}`,
              borderRadius: 6,
              cursor: "pointer",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            View debug panel <ArrowRight size={12} strokeWidth={2.4} />
          </a>
          <button
            onClick={handleStartOver}
            style={{
              padding: "10px 18px",
              fontSize: 13,
              fontWeight: 500,
              background: "transparent",
              color: TOKENS.INK_60,
              border: "none",
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            Start over
          </button>
        </div>
      </div>
    </div>
  );
}

function DebugPanel({ state }) {
  const log = getAuditLog();
  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        right: 0,
        width: 480,
        maxHeight: "60vh",
        background: TOKENS.INK,
        color: TOKENS.PAPER,
        padding: "16px 20px",
        fontFamily: FONTS.MONO,
        fontSize: 11,
        overflow: "auto",
        borderTopLeftRadius: 10,
        boxShadow: "0 -10px 30px -10px rgba(0,0,0,0.3)",
        zIndex: 9998,
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 8, letterSpacing: "0.05em" }}>
        DEBUG — STATE + AUDIT LOG
      </div>
      <details>
        <summary style={{ cursor: "pointer", marginBottom: 4 }}>
          State (session {state.sessionId.slice(-8)})
        </summary>
        <pre style={{ margin: 0, fontSize: 10, lineHeight: 1.4 }}>
          {JSON.stringify(state, null, 2)}
        </pre>
      </details>
      <details style={{ marginTop: 8 }}>
        <summary style={{ cursor: "pointer", marginBottom: 4 }}>
          Audit log ({log.length} events)
        </summary>
        <pre style={{ margin: 0, fontSize: 10, lineHeight: 1.4 }}>
          {JSON.stringify(log, null, 2)}
        </pre>
      </details>
    </div>
  );
}
