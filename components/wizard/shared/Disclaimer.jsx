"use client";

import { ShieldAlert } from "lucide-react";
import { TOKENS, FONTS } from "./tokens";

/**
 * Disclaimer
 *
 * Variant-based component for the "POA-IT is not a law firm" disclaimer.
 * The exact text varies by placement (Phase 1 § 1.1 specifies seven variants).
 * Centralized here so every disclaimer in the product uses the canonical text,
 * not a near-paraphrase.
 *
 * Variants:
 *   master         — full long-form disclaimer
 *   account        — for account creation flow
 *   pre_purchase   — shown at Step 8 Review
 *   document_header — appears in generated documents
 *   email          — for transactional emails
 *   support_auto   — auto-attached to support emails
 *   inline         — compact inline disclaimer, for screen-bottom placement
 *
 * Props:
 *   variant — required, one of the keys above
 */

const VARIANTS = {
  master: {
    title: "Important Notice",
    body: (
      <>
        <p style={{ margin: "0 0 12px" }}>
          POA-IT is not a law firm and is not a substitute for the advice of an
          attorney. POA-IT provides self-service software that helps you create
          your own legal documents based on the choices you make.
        </p>
        <p style={{ margin: "0 0 12px" }}>
          The information provided through the Service is general legal information,
          not legal advice. We do not recommend specific choices for your situation.
          If you need advice about which choices are right for you, we can connect
          you with a licensed Texas attorney through our Marketplace.
        </p>
        <p style={{ margin: 0 }}>
          Communications with POA-IT are not protected by attorney-client privilege.
          Use of the Service does not create an attorney-client relationship.
        </p>
      </>
    ),
  },
  inline: {
    body: (
      <p style={{ margin: 0 }}>
        POA-IT is not a law firm. The forms and information on this site are not a
        substitute for the advice of an attorney. Tex. Gov't Code § 81.101(c).
      </p>
    ),
  },
  step1: {
    body: (
      <p style={{ margin: 0 }}>
        POA-IT is not a law firm. We provide self-service software that generates
        documents based on the choices you make. We don't recommend specific choices
        for your situation. If you need advice about which choices are right for you,
        you can speak with a Texas attorney through our Marketplace at any time.
      </p>
    ),
  },
  pre_purchase: {
    body: (
      <>
        <p style={{ margin: "0 0 8px" }}>
          By proceeding, you confirm that you understand:
        </p>
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          <li>POA-IT is not a law firm and has not given you legal advice about your specific situation</li>
          <li>This document does NOT cover medical decisions, taxes (beyond representation authority), or federal benefits requiring their own forms</li>
          <li>Your purchase is governed by POA-IT's Terms of Service and Privacy Policy</li>
        </ul>
      </>
    ),
  },
};

export function Disclaimer({ variant = "inline" }) {
  const config = VARIANTS[variant] || VARIANTS.inline;

  if (variant === "inline") {
    return (
      <div
        style={{
          fontSize: 11,
          color: TOKENS.INK_40,
          lineHeight: 1.5,
          padding: "12px 0",
          fontFamily: FONTS.SANS,
        }}
      >
        {config.body}
      </div>
    );
  }

  if (variant === "master") {
    return (
      <div
        style={{
          background: TOKENS.PAPER_2,
          border: `1px solid ${TOKENS.LINE}`,
          borderLeft: `3px solid ${TOKENS.ACCENT}`,
          borderRadius: 8,
          padding: "20px 22px",
          margin: "16px 0",
          fontFamily: FONTS.SANS,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 12,
          }}
        >
          <ShieldAlert size={18} strokeWidth={2} color={TOKENS.INK} />
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: TOKENS.INK,
              letterSpacing: "-0.01em",
            }}
          >
            {config.title}
          </div>
        </div>
        <div style={{ fontSize: 13, lineHeight: 1.6, color: TOKENS.INK_60 }}>
          {config.body}
        </div>
      </div>
    );
  }

  // Default: contextual box-style disclaimer
  return (
    <div
      style={{
        background: TOKENS.PAPER_2,
        border: `1px solid ${TOKENS.LINE}`,
        borderRadius: 8,
        padding: "14px 16px",
        margin: "16px 0",
        fontSize: 13,
        lineHeight: 1.55,
        color: TOKENS.INK_60,
        fontFamily: FONTS.SANS,
      }}
    >
      {config.title && (
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: TOKENS.INK,
            marginBottom: 6,
            letterSpacing: "-0.005em",
          }}
        >
          {config.title}
        </div>
      )}
      {config.body}
    </div>
  );
}
