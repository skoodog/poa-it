"use client";

import { usePathname } from "next/navigation";
import { Users, FileText, Shield, Settings, CreditCard, LayoutDashboard } from "lucide-react";
import { TOKENS, FONTS } from "../wizard/shared/tokens";

/**
 * Workspace Sidebar
 *
 * Left-rail navigation for /app/*. Highlights the active section based on
 * the current pathname. Renders client-side because it needs route awareness.
 *
 * Section icons chosen for clarity:
 *   LayoutDashboard → Overview (home)
 *   Users           → Clients
 *   FileText        → Documents
 *   Shield          → Audit
 *   Settings        → Settings
 *   CreditCard      → Billing
 */

const NAV_ITEMS = [
  { href: "/app", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/app/clients", label: "Clients", icon: Users },
  { href: "/app/documents", label: "Documents", icon: FileText },
  { href: "/app/audit", label: "Audit", icon: Shield },
  { href: "/app/settings", label: "Settings", icon: Settings },
  { href: "/app/billing", label: "Billing", icon: CreditCard },
];

export function Sidebar({ firmName }) {
  const pathname = usePathname();

  return (
    <aside
      style={{
        width: 240,
        background: TOKENS.PAPER_2,
        borderRight: `1px solid ${TOKENS.LINE}`,
        padding: "20px 0",
        display: "flex",
        flexDirection: "column",
        gap: 4,
        fontFamily: FONTS.SANS,
        flexShrink: 0,
      }}
    >
      {/* Firm label */}
      <div
        style={{
          padding: "0 20px 16px",
          marginBottom: 4,
          borderBottom: `1px solid ${TOKENS.LINE}`,
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontFamily: FONTS.MONO,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: TOKENS.INK_40,
            fontWeight: 600,
            marginBottom: 4,
          }}
        >
          Workspace
        </div>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: TOKENS.INK,
            letterSpacing: "-0.01em",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={firmName}
        >
          {firmName || "Workspace"}
        </div>
      </div>

      {/* Nav items */}
      <nav style={{ padding: "0 12px", display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV_ITEMS.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <a
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 12px",
                fontSize: 13.5,
                fontWeight: isActive ? 600 : 500,
                color: isActive ? TOKENS.INK : TOKENS.INK_60,
                background: isActive ? TOKENS.PAPER : "transparent",
                border: isActive ? `1px solid ${TOKENS.LINE}` : "1px solid transparent",
                borderRadius: 6,
                textDecoration: "none",
                transition: "all 0.12s",
              }}
            >
              <item.icon
                size={15}
                strokeWidth={isActive ? 2.2 : 1.8}
                color={isActive ? TOKENS.INK : TOKENS.INK_60}
              />
              {item.label}
            </a>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ flex: 1 }} />
      <div
        style={{
          padding: "16px 20px",
          borderTop: `1px solid ${TOKENS.LINE}`,
          fontSize: 11,
          color: TOKENS.INK_40,
          lineHeight: 1.5,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 4,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              background: TOKENS.LIVE_GREEN,
              borderRadius: "50%",
            }}
          />
          <span
            style={{
              fontFamily: FONTS.MONO,
              fontSize: 10,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              fontWeight: 600,
              color: TOKENS.INK_60,
            }}
          >
            Pre-launch
          </span>
        </div>
        <div>Texas only · Soft launch coming</div>
      </div>
    </aside>
  );
}
