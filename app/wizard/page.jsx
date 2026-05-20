"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Code2, Database, FileText, ShieldCheck } from "lucide-react";
import { EligibilityGate } from "../../components/wizard/screens/EligibilityGate";
import { TOKENS, FONTS } from "../../components/wizard/shared/tokens";
import {
  createInitialState,
  loadState,
  clearState,
  WIZARD_STEPS,
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

  function handleContinue() {
    // For Phase 1, just scroll back to top so user sees the "next phase" placeholder
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
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

  // After eligibility gate is completed, show Phase 1 "you've completed the
  // tracer bullet" placeholder. Phase 2 will replace this with Step 1.
  const eligibilityComplete = state.completedSteps.includes("eligibility_gate");

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
      <style>{`
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

      {/* Progress indicator (placeholder for now — full version in Phase 2) */}
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
            gap: 8,
            fontSize: 11,
            color: TOKENS.INK_40,
            fontFamily: FONTS.MONO,
            letterSpacing: "0.04em",
          }}
        >
          {WIZARD_STEPS.filter((s) => !s.conditional).map((s, i, arr) => {
            const isComplete = state.completedSteps.includes(s.id);
            const isCurrent = state.currentStep === s.id;
            return (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
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
                  }}
                >
                  {isComplete ? "✓" : i + 1}
                </span>
                <span
                  style={{
                    color: isCurrent ? TOKENS.INK : isComplete ? TOKENS.INK_60 : TOKENS.INK_40,
                    fontWeight: isCurrent ? 600 : 500,
                    textTransform: "uppercase",
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
                      marginLeft: 4,
                      marginRight: 4,
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main content area */}
      <main>
        {!eligibilityComplete ? (
          <EligibilityGate state={state} setState={setState} onContinue={handleContinue} />
        ) : (
          <Phase1Complete state={state} onStartOver={handleStartOver} />
        )}
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
 * Phase 1 completion placeholder.
 * Shown after eligibility gate is completed. Replaced by Step 1 in Phase 2.
 */
function Phase1Complete({ state, onStartOver }) {
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
          Eligibility passed
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
          You're eligible. Steps 2-9 are coming.
        </h2>

        <p style={{ fontSize: 15, color: TOKENS.INK_60, lineHeight: 1.55, margin: "0 0 24px" }}>
          Phase 1 of our wizard rebuild is complete. The substrate is in place — clause
          library, state engine, audit logger, validator, shared components, and the
          eligibility gate you just walked through. The remaining 8 wizard screens
          (your information, your agent, powers, sensitive powers, effective date,
          signing, review, waitlist) are being built in subsequent phases.
        </p>

        <div
          style={{
            background: TOKENS.PAPER,
            border: `1px solid ${TOKENS.LINE}`,
            borderRadius: 10,
            padding: "20px 22px",
            marginBottom: 24,
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
              marginBottom: 14,
            }}
          >
            Phase 1 build — what's in place
          </div>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 12 }}>
            <SubstrateRow
              icon={Database}
              title="Clause library"
              detail="All 14 Texas statutory powers, 5 hot powers, conditional clauses, statutory citations"
              path="/lib/clauseLibrary/clauses.json"
            />
            <SubstrateRow
              icon={Code2}
              title="Engine + validator"
              detail="Trigger DSL evaluator, scoped wizard rules, derived-state flag computation"
              path="/lib/clauseLibrary/engine.js · /lib/wizard/validator.js"
            />
            <SubstrateRow
              icon={FileText}
              title="State + audit logger"
              detail="LocalStorage persistence, append-only event log, PII scrubbing at write time"
              path="/lib/wizard/state.js · /lib/audit/logger.js"
            />
            <SubstrateRow
              icon={ShieldCheck}
              title="Shared UI components"
              detail="StatutoryTooltip, WarningBanner, Disclaimer, AcknowledgmentCheckbox, AttorneyReferralPrompt"
              path="/components/wizard/shared/*"
            />
          </ul>
        </div>

        <div
          style={{
            fontSize: 13,
            color: TOKENS.INK_60,
            padding: "14px 16px",
            background: TOKENS.REF_BG,
            border: `1px solid ${TOKENS.REF_BORDER}`,
            borderRadius: 8,
            lineHeight: 1.55,
            marginBottom: 24,
          }}
        >
          <strong style={{ color: TOKENS.REF_INK }}>For Rob:</strong> Open the
          browser console to see the audit log entries from your eligibility-gate
          walk-through. Each tooltip open, each answer change, each step completion
          is recorded with timestamp and session ID. That's the evidentiary record
          architecture — same shape as the production version will use, just
          persisting to localStorage instead of a database.
        </div>

        <button
          onClick={onStartOver}
          style={{
            padding: "10px 20px",
            fontSize: 13,
            fontWeight: 500,
            background: TOKENS.PAPER,
            color: TOKENS.INK,
            border: `1px solid ${TOKENS.LINE}`,
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          Start the wizard over
        </button>
      </div>
    </div>
  );
}

function SubstrateRow({ icon: Icon, title, detail, path }) {
  return (
    <li style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
      <Icon size={16} strokeWidth={1.8} color={TOKENS.INK} style={{ flexShrink: 0, marginTop: 2 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: TOKENS.INK, marginBottom: 2 }}>
          {title}
        </div>
        <div style={{ fontSize: 12.5, color: TOKENS.INK_60, lineHeight: 1.5, marginBottom: 4 }}>
          {detail}
        </div>
        <div
          className="mono"
          style={{
            fontSize: 10.5,
            fontFamily: FONTS.MONO,
            color: TOKENS.INK_40,
            letterSpacing: "0.01em",
          }}
        >
          {path}
        </div>
      </div>
    </li>
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
