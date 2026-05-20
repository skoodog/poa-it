"use client";

import Link from "next/link";

const PAPER = "#FFFFFF";
const PAPER_2 = "#FAFAFA";
const INK = "#0A0A0A";
const INK_60 = "#52525B";
const INK_40 = "#71717A";
const LINE = "#E4E4E7";
const ACCENT = "#2563EB";

const SANS = `'Geist', 'Inter', -apple-system, system-ui, sans-serif`;
const MONO = `'Geist Mono', 'JetBrains Mono', ui-monospace, monospace`;

export function LegalLayout({ title, lastUpdated, effectiveDate, children }) {
  return (
    <div style={{
      background: PAPER, minHeight: "100vh", fontFamily: SANS, color: INK,
      WebkitFontSmoothing: "antialiased",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; background: ${PAPER}; }
        a { color: ${INK}; text-decoration: underline; text-decoration-color: ${LINE}; text-underline-offset: 2px; }
        a:hover { text-decoration-color: ${INK}; }
      `}</style>

      {/* Top nav minimal */}
      <header style={{
        borderBottom: `1px solid ${LINE}`, background: PAPER,
        padding: "16px 32px",
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <div style={{ maxWidth: 880, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-0.02em", textDecoration: "none", color: INK }}>
            poa-it
          </Link>
          <nav style={{ display: "flex", gap: 24, fontSize: 13 }}>
            <Link href="/legal/terms" style={{ color: INK_60, textDecoration: "none" }}>Terms</Link>
            <Link href="/legal/privacy" style={{ color: INK_60, textDecoration: "none" }}>Privacy</Link>
            <Link href="/legal/refunds" style={{ color: INK_60, textDecoration: "none" }}>Refunds</Link>
            <Link href="/legal/complaints" style={{ color: INK_60, textDecoration: "none" }}>Complaints</Link>
          </nav>
        </div>
      </header>

      {/* Pre-launch banner */}
      <div style={{
        background: "#FEF3C7",
        borderBottom: `1px solid #FCD34D`,
        padding: "14px 32px",
      }}>
        <div style={{ maxWidth: 880, margin: "0 auto", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{
            display: "inline-flex", alignItems: "center",
            background: "#92400E", color: PAPER, padding: "3px 8px",
            borderRadius: 4, fontSize: 10, fontWeight: 700, letterSpacing: "0.05em",
            textTransform: "uppercase", flexShrink: 0,
          }}>Pre-launch</span>
          <div style={{ fontSize: 13, color: "#78350F", lineHeight: 1.5 }}>
            POA-IT is in pre-launch. These terms are <strong>in development</strong> and under
            review by Texas counsel. They will be finalized before we begin accepting customers.
            Until launch, they reflect our intent and are subject to change.
          </div>
        </div>
      </div>

      {/* Title */}
      <div style={{ borderBottom: `1px solid ${LINE}`, background: PAPER_2 }}>
        <div style={{ maxWidth: 880, margin: "0 auto", padding: "48px 32px 40px" }}>
          <h1 style={{
            fontSize: 40, fontWeight: 600, letterSpacing: "-0.03em",
            margin: "0 0 14px", lineHeight: 1.1,
          }}>
            {title}
          </h1>
          <div style={{ display: "flex", gap: 24, fontSize: 12, color: INK_40, fontFamily: MONO }}>
            {effectiveDate && <span>Effective: {effectiveDate}</span>}
            {lastUpdated && <span>Last updated: {lastUpdated}</span>}
          </div>
        </div>
      </div>

      {/* Body */}
      <main style={{ maxWidth: 720, margin: "0 auto", padding: "56px 32px 120px" }}>
        <div className="legal-prose">{children}</div>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${LINE}`, background: PAPER_2, padding: "32px 32px 48px" }}>
        <div style={{ maxWidth: 880, margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontSize: 11, color: INK_40, lineHeight: 1.6, maxWidth: 600, margin: "0 auto" }}>
            POA-IT is not a law firm and does not provide legal advice. The forms and information on this site are not a substitute for the advice of an attorney licensed in Texas. Tex. Gov't Code § 81.101(c).
          </div>
          <div style={{ marginTop: 16, fontSize: 11, color: INK_40 }}>
            © 2026 POA-IT Inc. · <Link href="/" style={{ color: INK_60 }}>Return to homepage</Link>
          </div>
        </div>
      </footer>

      <style>{`
        .legal-prose h2 {
          font-size: 22px; font-weight: 600; letter-spacing: -0.02em;
          margin: 56px 0 16px; padding-top: 24px;
          border-top: 1px solid ${LINE};
        }
        .legal-prose h2:first-child { border-top: none; padding-top: 0; margin-top: 0; }
        .legal-prose h3 {
          font-size: 16px; font-weight: 600; letter-spacing: -0.01em;
          margin: 32px 0 12px;
        }
        .legal-prose p {
          font-size: 15px; line-height: 1.65; color: ${INK_60};
          margin: 0 0 16px;
        }
        .legal-prose ul, .legal-prose ol {
          font-size: 15px; line-height: 1.65; color: ${INK_60};
          margin: 0 0 16px; padding-left: 24px;
        }
        .legal-prose li { margin-bottom: 8px; }
        .legal-prose strong { color: ${INK}; font-weight: 600; }
        .legal-prose .callout {
          background: ${PAPER_2}; border-left: 3px solid ${ACCENT};
          padding: 16px 20px; margin: 24px 0; font-size: 14px;
          color: ${INK}; line-height: 1.55;
        }
        .legal-prose .citation {
          font-family: ${MONO}; font-size: 13px; color: ${INK_40};
        }
      `}</style>
    </div>
  );
}
