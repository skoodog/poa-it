import { redirect } from "next/navigation";
import { LogOut, ArrowRight } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { getCurrentUser } from "../../lib/server/auth";

export default async function AppHomePage() {
  const user = await getCurrentUser();

  if (!user) redirect("/sign-in");
  if (user.userType !== "professional") redirect("/");
  if (!user.onboardedAt) redirect("/onboarding/professional");

  const TOKENS = {
    PAPER: "#FFFFFF",
    PAPER_2: "#FAFAFA",
    INK: "#0A0A0A",
    INK_60: "#52525B",
    INK_40: "#71717A",
    INK_20: "#A1A1AA",
    LINE: "#E4E4E7",
    ACCENT: "#2563EB",
    LIVE_GREEN: "#10B981",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: TOKENS.PAPER,
        fontFamily: "'Geist', 'Inter', -apple-system, system-ui, sans-serif",
      }}
    >
      {/* Top bar */}
      <header
        style={{
          borderBottom: `1px solid ${TOKENS.LINE}`,
          padding: "14px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <a
            href="/"
            style={{
              fontSize: 18,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              color: TOKENS.INK,
              textDecoration: "none",
            }}
          >
            poa-it
          </a>
          <div
            style={{
              fontSize: 11,
              fontFamily: "'Geist Mono', ui-monospace, monospace",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: TOKENS.INK_60,
              fontWeight: 600,
              padding: "3px 8px",
              background: TOKENS.PAPER_2,
              borderRadius: 4,
            }}
          >
            {user.firm?.name || "Workspace"}
          </div>
        </div>
        <UserButton afterSignOutUrl="/" />
      </header>

      {/* Main content */}
      <main
        style={{
          maxWidth: 760,
          margin: "0 auto",
          padding: "60px 32px",
        }}
      >
        <div
          style={{
            background: TOKENS.PAPER_2,
            border: `1px solid ${TOKENS.LINE}`,
            borderRadius: 12,
            padding: "36px 36px",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: TOKENS.LIVE_GREEN,
              color: TOKENS.PAPER,
              padding: "3px 10px",
              borderRadius: 100,
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              marginBottom: 18,
            }}
          >
            Account ready
          </div>

          <h1
            style={{
              fontSize: 30,
              fontWeight: 600,
              letterSpacing: "-0.025em",
              margin: "0 0 12px",
              lineHeight: 1.15,
              color: TOKENS.INK,
            }}
          >
            Welcome to {user.firm?.name || "your workspace"},{" "}
            {user.firstName || "friend"}.
          </h1>
          <p style={{ fontSize: 15, color: TOKENS.INK_60, lineHeight: 1.55, margin: "0 0 24px" }}>
            Your professional account is set up. The workspace UI (client list,
            document tracking, billing) is building out over the next two
            sprints. In the meantime, your account is reserved and your data
            is being persisted.
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
              style={{
                fontSize: 11,
                fontFamily: "'Geist Mono', ui-monospace, monospace",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: TOKENS.INK_40,
                fontWeight: 600,
                marginBottom: 12,
              }}
            >
              Coming in upcoming sprints
            </div>
            <ul
              style={{
                margin: 0,
                padding: 0,
                listStyle: "none",
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <BuildItem label="Sprint 2" item="Professional workspace shell with client list, documents, audit, billing nav" />
              <BuildItem label="Sprint 3" item="Client management — create, search, profile pages, intake flows" />
              <BuildItem label="Sprint 4" item="PDF generation for the Texas POA" />
              <BuildItem label="Sprint 5" item="Two intake flows: fill-for-client, send-link-to-client" />
              <BuildItem label="Sprint 6" item="Stripe Checkout (consumer) + subscriptions (professional)" />
              <BuildItem label="Sprint 7" item="Proof RON integration + email orchestration" />
            </ul>
          </div>

          <a
            href="/wizard"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 20px",
              fontSize: 14,
              fontWeight: 600,
              background: TOKENS.INK,
              color: TOKENS.PAPER,
              borderRadius: 8,
              textDecoration: "none",
            }}
          >
            Walk the wizard <ArrowRight size={13} strokeWidth={2.4} />
          </a>
        </div>
      </main>
    </div>
  );
}

function BuildItem({ label, item }) {
  const TOKENS = {
    PAPER_2: "#FAFAFA",
    INK: "#0A0A0A",
    INK_60: "#52525B",
    INK_40: "#71717A",
    LINE: "#E4E4E7",
  };

  return (
    <li style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
      <div
        style={{
          fontSize: 10,
          fontFamily: "'Geist Mono', ui-monospace, monospace",
          color: TOKENS.INK_40,
          fontWeight: 600,
          letterSpacing: "0.05em",
          background: TOKENS.PAPER_2,
          padding: "3px 8px",
          borderRadius: 4,
          flexShrink: 0,
          marginTop: 1,
        }}
      >
        {label.toUpperCase()}
      </div>
      <div style={{ flex: 1, fontSize: 13, color: TOKENS.INK_60, lineHeight: 1.5 }}>
        {item}
      </div>
    </li>
  );
}
