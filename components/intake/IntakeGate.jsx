"use client";

import { useEffect } from "react";
import { CheckCircle2, Clock, AlertTriangle, FileText } from "lucide-react";
import { TOKENS, FONTS } from "../wizard/shared/tokens";

/**
 * IntakeGate — client-facing states for a send-link intake.
 *
 * For a valid token, redirects into the wizard in intake mode
 * (/wizard?intake=<token>). The wizard runs entirely off the token; the
 * session id is never exposed. For non-valid states, renders a friendly
 * explanation — no wizard, no workspace chrome (the client isn't a user).
 *
 * Sprint 5 Round 3.
 */
export function IntakeGate({ token, status, firmName }) {
  useEffect(() => {
    if (status === "valid" && typeof window !== "undefined") {
      window.location.replace(`/wizard?intake=${encodeURIComponent(token)}`);
    }
  }, [status, token]);

  if (status === "valid") {
    return <Centered>Loading your form…</Centered>;
  }

  const who = firmName ? `${firmName}` : "the requesting firm";

  if (status === "consumed") {
    return (
      <GateCard
        icon={CheckCircle2}
        iconColor="#065F46"
        iconBg="#D1FAE5"
        title="This Power of Attorney has been submitted"
        body={`Thank you — your responses were sent to ${who}. There's nothing more to do here. If you need to make a change, contact ${who} directly.`}
      />
    );
  }

  if (status === "expired") {
    return (
      <GateCard
        icon={Clock}
        iconColor="#92400E"
        iconBg="#FEF3C7"
        title="This link has expired"
        body={`For security, intake links are only valid for a limited time. Please contact ${who} to request a new link.`}
      />
    );
  }

  // invalid
  return (
    <GateCard
      icon={AlertTriangle}
      iconColor="#991B1B"
      iconBg="#FEE2E2"
      title="This link isn't valid"
      body={`We couldn't find an intake form for this link. Double-check the link you were sent, or contact ${who} for a new one.`}
    />
  );
}

function GateCard({ icon: Icon, iconColor, iconBg, title, body }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: TOKENS.PAPER,
        fontFamily: FONTS.SANS,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div style={{ maxWidth: 460, textAlign: "center" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 28,
            fontSize: 17,
            fontWeight: 600,
            color: TOKENS.INK,
            letterSpacing: "-0.02em",
          }}
        >
          <FileText size={18} strokeWidth={2} /> poa-it
        </div>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            background: iconBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 18px",
          }}
        >
          <Icon size={26} strokeWidth={2} color={iconColor} />
        </div>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 600,
            color: TOKENS.INK,
            letterSpacing: "-0.015em",
            margin: "0 0 10px",
          }}
        >
          {title}
        </h1>
        <p style={{ fontSize: 14.5, color: TOKENS.INK_60, lineHeight: 1.55, margin: 0 }}>
          {body}
        </p>
      </div>
    </div>
  );
}

function Centered({ children }) {
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
      {children}
    </div>
  );
}
