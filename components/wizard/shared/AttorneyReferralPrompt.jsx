"use client";

import { Scale, ArrowRight } from "lucide-react";
import { TOKENS, FONTS } from "./tokens";
import { audit } from "../../../lib/audit/logger";

/**
 * AttorneyReferralPrompt
 *
 * The escape valve. Surfaces whenever the wizard detects the user is making
 * a decision that genuinely warrants legal counsel — granting hot powers,
 * customizing the springing trigger, gifts above the annual exclusion,
 * homestead/home-equity combinations.
 *
 * The prompt is informational, not blocking. The user can proceed without
 * consultation, but the offer was made and logged.
 *
 * This is also the UPL safe-harbor in action: when the wizard hits the
 * boundary of "things software can handle," it redirects to a human attorney
 * rather than pretending to advise.
 *
 * Props:
 *   ruleId     — for audit logging
 *   context    — what prompted the referral (e.g., "hot_power_trust_granted")
 *   sessionId  — wizard session ID
 *   onConsulted — optional callback for "I consulted my own attorney"
 *   onProceed   — optional callback for "I'm proceeding without consultation"
 *   compact    — render as a smaller inline prompt (default false = full banner)
 */
export function AttorneyReferralPrompt({
  ruleId,
  context,
  sessionId,
  onConsulted,
  onProceed,
  compact = false,
}) {
  function handleMarketplaceClick() {
    if (sessionId) {
      audit.attorneyReferralClicked(sessionId, ruleId);
    }
    // In Phase 6 this routes to /marketplace with context. For now, log only.
    if (typeof window !== "undefined") {
      // Placeholder: the marketplace doesn't exist yet
      window.alert(
        "The POA-IT Attorney Marketplace will open here. (Coming soon.) Your wizard progress is saved."
      );
    }
  }

  function handleConsulted() {
    if (sessionId) {
      audit.acknowledgmentRecorded(
        sessionId,
        `${ruleId}_consulted_own_attorney`,
        "I have consulted my own attorney about this decision."
      );
    }
    if (onConsulted) onConsulted();
  }

  function handleProceed() {
    if (sessionId) {
      audit.acknowledgmentRecorded(
        sessionId,
        `${ruleId}_proceeding_without_consultation`,
        "I understand the recommendation and am proceeding without attorney consultation."
      );
    }
    if (onProceed) onProceed();
  }

  if (compact) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 14px",
          background: TOKENS.REF_BG,
          border: `1px solid ${TOKENS.REF_BORDER}`,
          borderRadius: 8,
          fontSize: 13,
          color: TOKENS.REF_INK,
          fontFamily: FONTS.SANS,
        }}
      >
        <Scale size={15} strokeWidth={2} color={TOKENS.REF_INK} style={{ flexShrink: 0 }} />
        <span style={{ flex: 1 }}>
          Consider speaking with a Texas attorney about this.
        </span>
        <button
          onClick={handleMarketplaceClick}
          style={{
            background: TOKENS.REF_INK,
            color: TOKENS.PAPER,
            padding: "6px 12px",
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            border: "none",
          }}
        >
          Find an attorney <ArrowRight size={12} strokeWidth={2.4} />
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        background: TOKENS.REF_BG,
        border: `1px solid ${TOKENS.REF_BORDER}`,
        borderRadius: 10,
        padding: "20px 22px",
        margin: "16px 0",
        fontFamily: FONTS.SANS,
      }}
    >
      <div style={{ display: "flex", gap: 14 }}>
        <div style={{ flexShrink: 0, marginTop: 2 }}>
          <Scale size={20} strokeWidth={2} color={TOKENS.REF_INK} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: TOKENS.REF_INK,
              marginBottom: 6,
              letterSpacing: "-0.005em",
            }}
          >
            We strongly recommend Texas attorney consultation
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.55, color: TOKENS.REF_INK }}>
            You're making a decision that can fundamentally affect your estate plan.
            POA-IT generates the correct Texas statutory language, but whether this
            decision is right for <em>your</em> situation is a legal question we
            can't answer. We can connect you with a licensed Texas attorney at no
            charge from us — your wizard progress will be saved.
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16 }}>
            <button
              onClick={handleMarketplaceClick}
              style={{
                background: TOKENS.REF_INK,
                color: TOKENS.PAPER,
                padding: "10px 18px",
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                border: "none",
              }}
            >
              Find a Texas attorney <ArrowRight size={13} strokeWidth={2.4} />
            </button>
            {onConsulted && (
              <button
                onClick={handleConsulted}
                style={{
                  background: TOKENS.PAPER,
                  color: TOKENS.REF_INK,
                  padding: "10px 18px",
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                  border: `1px solid ${TOKENS.REF_BORDER}`,
                }}
              >
                I've consulted my own attorney
              </button>
            )}
            {onProceed && (
              <button
                onClick={handleProceed}
                style={{
                  background: "transparent",
                  color: TOKENS.REF_INK,
                  padding: "10px 14px",
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                  textDecoration: "underline",
                  border: "none",
                }}
              >
                Proceed without consultation
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
