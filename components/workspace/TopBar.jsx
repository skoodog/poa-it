"use client";

import { UserButton } from "@clerk/nextjs";
import { TOKENS, FONTS } from "../wizard/shared/tokens";

/**
 * Workspace TopBar
 *
 * Header strip across the top of every /app/* page. Shows the current
 * section title (passed by the page component) and Clerk's UserButton
 * for account management. Designed to feel like a tool dashboard, not
 * a marketing site.
 *
 * Props:
 *   title    — main page title (e.g., "Clients", "Settings")
 *   subtitle — optional supporting text
 *   actions  — optional right-side action (button, etc.)
 */
export function TopBar({ title, subtitle, actions }) {
  return (
    <header
      style={{
        borderBottom: `1px solid ${TOKENS.LINE}`,
        background: TOKENS.PAPER,
        padding: "20px 32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        fontFamily: FONTS.SANS,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        {title && (
          <h1
            style={{
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
              margin: 0,
              color: TOKENS.INK,
            }}
          >
            {title}
          </h1>
        )}
        {subtitle && (
          <p
            style={{
              fontSize: 13.5,
              color: TOKENS.INK_60,
              margin: "4px 0 0",
              lineHeight: 1.4,
            }}
          >
            {subtitle}
          </p>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {actions}
        <UserButton
          afterSignOutUrl="/"
          appearance={{
            elements: {
              avatarBox: { width: 32, height: 32 },
            },
          }}
        />
      </div>
    </header>
  );
}
