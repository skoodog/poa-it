"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Mail, ArrowRight, Lock, Sparkles } from "lucide-react";
import { TOKENS, FONTS } from "../shared/tokens";
import { WizardShell } from "../WizardShell";
import { FormField } from "../shared/FormFields";
import { Disclaimer } from "../shared/Disclaimer";
import { updateState, markStepComplete } from "../../../lib/wizard/state";
import { audit } from "../../../lib/audit/logger";

/**
 * Step 9 — Waitlist
 * Final step of the wizard. Captures email + waitlist preference; surfaces
 * a clean confirmation state. In Phase 6 / Sprint 3 this gets replaced by
 * Stripe Checkout.
 */
export function Step9_Waitlist({ state, setState, onBack, onContinue }) {
  useEffect(() => {
    audit.stepEntered(state.sessionId, "step9_waitlist");
  }, [state.sessionId]);

  const [email, setEmail] = useState(state.principalEmail || "");
  const [choice, setChoice] = useState("notify_at_launch");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  function handleSubmit() {
    if (!validEmail || submitting) return;
    setSubmitting(true);

    audit.wizardCompleted(state.sessionId, {
      waitlistEmail: "[REDACTED — see PII-scrub]",
      waitlistChoice: choice,
      documentType: state.documentType,
      completedAt: new Date().toISOString(),
    });

    // Simulate a network roundtrip — in Phase 6 this hits /api/waitlist
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      const next = markStepComplete(state, "step9_waitlist", "complete");
      setState(next);
    }, 900);
  }

  if (submitted) {
    return (
      <WizardShell
        stepId="step9_waitlist"
        stepNumber="You're done"
        title="You're on the list."
        subtitle="We'll email you the moment POA-IT opens to Texas customers."
        hideNavigation
      >
        <div
          style={{
            background: TOKENS.PAPER_2,
            border: `1px solid ${TOKENS.LIVE_GREEN}`,
            borderRadius: 12,
            padding: "28px 30px",
            textAlign: "center",
            fontFamily: FONTS.SANS,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: TOKENS.LIVE_GREEN,
              color: TOKENS.PAPER,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 18px",
            }}
          >
            <CheckCircle2 size={28} strokeWidth={2.2} />
          </div>
          <h3
            style={{
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              margin: "0 0 10px",
              color: TOKENS.INK,
            }}
          >
            Thanks, {state.principalFullLegalName?.split(" ")[0] || "friend"}!
          </h3>
          <p style={{ fontSize: 14, color: TOKENS.INK_60, lineHeight: 1.55, margin: "0 auto 20px", maxWidth: 460 }}>
            We've added <strong style={{ color: TOKENS.INK }}>{email}</strong> to
            the waitlist. We're in the final stretch of legal review and notary
            partner integration — expect news within weeks. Your wizard answers
            are saved locally; when we launch, you can resume right where you
            left off.
          </p>
          <div
            style={{
              padding: "14px 18px",
              background: TOKENS.PAPER,
              border: `1px solid ${TOKENS.LINE}`,
              borderRadius: 8,
              fontSize: 12,
              color: TOKENS.INK_60,
              lineHeight: 1.5,
              textAlign: "left",
              marginBottom: 20,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontFamily: FONTS.MONO,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: TOKENS.INK_40,
                fontWeight: 600,
                marginBottom: 6,
              }}
            >
              What we recorded
            </div>
            <div>
              {state.completedSteps?.length || 0} wizard steps completed · session{" "}
              <span style={{ fontFamily: FONTS.MONO, color: TOKENS.INK }}>
                {state.sessionId?.slice(-12)}
              </span>
            </div>
          </div>
          <a
            href="/wizard/audit"
            style={{
              fontSize: 13,
              color: TOKENS.INK_60,
              textDecoration: "underline",
              fontFamily: FONTS.SANS,
            }}
          >
            View the audit log of my session →
          </a>
        </div>
      </WizardShell>
    );
  }

  return (
    <WizardShell
      stepId="step9_waitlist"
      stepNumber="Final step · Waitlist"
      title="You're early — and we'd like to keep you that way."
      subtitle="POA-IT is launching to Texas residents in the coming weeks, pending final legal review and notary partner integration. Join the waitlist and we'll email you the moment it goes live."
      onBack={onBack}
      onContinue={handleSubmit}
      canContinue={validEmail}
      continueLabel={submitting ? "Adding you to the list…" : "Join the waitlist"}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 20, fontFamily: FONTS.SANS }}>
        {/* Order summary card */}
        <div
          style={{
            background: TOKENS.PAPER_2,
            border: `1px solid ${TOKENS.LINE}`,
            borderRadius: 10,
            padding: "18px 20px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 8,
            }}
          >
            <Sparkles size={13} strokeWidth={2} color={TOKENS.ACCENT} />
            <div
              style={{
                fontSize: 10,
                fontFamily: FONTS.MONO,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: TOKENS.ACCENT,
                fontWeight: 600,
              }}
            >
              Pre-launch · Texas
            </div>
          </div>
          <div
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: TOKENS.INK,
              marginBottom: 4,
              letterSpacing: "-0.005em",
            }}
          >
            Your Texas Statutory Durable Power of Attorney
          </div>
          <div style={{ fontSize: 13, color: TOKENS.INK_60, lineHeight: 1.5 }}>
            For {state.principalFullLegalName || "you"} · {state.agentFullLegalName || "your agent"}{" "}
            as attorney-in-fact · {state.principalCounty} County, Texas
          </div>

          <div
            style={{
              marginTop: 12,
              paddingTop: 12,
              borderTop: `1px solid ${TOKENS.LINE}`,
              fontSize: 12,
              color: TOKENS.INK_40,
              lineHeight: 1.5,
            }}
          >
            <Lock size={11} strokeWidth={2} style={{ display: "inline", marginRight: 4, verticalAlign: "middle" }} />
            Launch price will be locked in for waitlist members. No charge today.
          </div>
        </div>

        {/* Email input */}
        <FormField
          label="Email"
          value={email}
          onChange={setEmail}
          placeholder="you@example.com"
          type="email"
          required
          tooltip="We'll only use this to notify you about POA-IT launch and your account. Our Privacy Policy governs everything we do with your information."
          autoComplete="email"
        />

        {/* Radio choice */}
        <div>
          <label
            style={{
              display: "block",
              fontSize: 13,
              fontWeight: 500,
              color: TOKENS.INK_60,
              marginBottom: 10,
            }}
          >
            I'd like to:
          </label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { id: "notify_at_launch", label: "Notify me at launch", desc: "One email when we go live." },
              { id: "early_access", label: "Apply for early access (limited beta)", desc: "We'll reach out about the beta cohort." },
              { id: "both", label: "Both — and send me occasional Texas POA news", desc: "Quarterly updates on Texas estate-planning law." },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setChoice(opt.id)}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  padding: "12px 16px",
                  border: `1px solid ${choice === opt.id ? TOKENS.INK : TOKENS.LINE}`,
                  background: choice === opt.id ? TOKENS.PAPER_2 : TOKENS.PAPER,
                  borderRadius: 8,
                  cursor: "pointer",
                  textAlign: "left",
                  fontFamily: FONTS.SANS,
                  transition: "all 0.15s",
                  width: "100%",
                }}
              >
                <div
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    border: `1.5px solid ${choice === opt.id ? TOKENS.INK : TOKENS.INK_40}`,
                    background: TOKENS.PAPER,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                >
                  {choice === opt.id && (
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: TOKENS.INK }} />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: TOKENS.INK, marginBottom: 2 }}>
                    {opt.label}
                  </div>
                  <div style={{ fontSize: 12.5, color: TOKENS.INK_60, lineHeight: 1.5 }}>{opt.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <Disclaimer variant="inline" />
      </div>
    </WizardShell>
  );
}
