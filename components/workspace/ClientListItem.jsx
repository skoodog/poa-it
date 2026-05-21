"use client";

import { ChevronRight } from "lucide-react";
import { TOKENS, FONTS } from "../wizard/shared/tokens";
import { ClientStatusBadge } from "./ClientStatusBadge";

/**
 * ClientListItem
 *
 * One row in the client list. Shows:
 *   - Initials avatar (cheap visual anchor)
 *   - Client name and email
 *   - Status badge
 *   - Last updated timestamp (relative)
 *   - Chevron indicating clickable to profile
 *
 * Links to /app/clients/[id] (the profile page, built in Sprint 3b).
 */

export function ClientListItem({ client }) {
  const initials = getInitials(client.name);
  const lastUpdated = client.updatedAt ? formatRelativeDate(client.updatedAt) : "—";

  return (
    <a
      href={`/app/clients/${client.id}`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "14px 18px",
        background: TOKENS.PAPER,
        border: `1px solid ${TOKENS.LINE}`,
        borderRadius: 8,
        textDecoration: "none",
        color: "inherit",
        transition: "all 0.12s",
        fontFamily: FONTS.SANS,
      }}
      className="hov-row-card"
    >
      {/* Initials avatar */}
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          background: TOKENS.PAPER_2,
          border: `1px solid ${TOKENS.LINE}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          fontWeight: 600,
          color: TOKENS.INK_60,
          letterSpacing: "0.02em",
          flexShrink: 0,
          fontFamily: FONTS.MONO,
        }}
      >
        {initials}
      </div>

      {/* Name + email */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14.5,
            fontWeight: 600,
            color: TOKENS.INK,
            letterSpacing: "-0.005em",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            marginBottom: 2,
          }}
        >
          {client.name}
        </div>
        <div
          style={{
            fontSize: 12.5,
            color: TOKENS.INK_60,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {client.email || (
            <span style={{ color: TOKENS.INK_40, fontStyle: "italic" }}>
              No email
            </span>
          )}
          {client.relationship && (
            <span style={{ color: TOKENS.INK_40 }}>
              {" · "}
              {client.relationship}
            </span>
          )}
        </div>
      </div>

      {/* Status badge */}
      <div style={{ flexShrink: 0 }}>
        <ClientStatusBadge status={client.status} size="sm" />
      </div>

      {/* Last updated */}
      <div
        style={{
          fontSize: 11,
          color: TOKENS.INK_40,
          minWidth: 80,
          textAlign: "right",
          flexShrink: 0,
          fontFamily: FONTS.MONO,
        }}
      >
        {lastUpdated}
      </div>

      {/* Chevron */}
      <ChevronRight
        size={15}
        strokeWidth={1.8}
        color={TOKENS.INK_40}
        style={{ flexShrink: 0 }}
      />
    </a>
  );
}

/**
 * "Jane Smith" -> "JS"
 * "John" -> "J"
 * "Mary Jane Smith" -> "MS" (first + last)
 */
function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Returns a human-friendly relative date string.
 * "just now", "5m ago", "3h ago", "yesterday", "Mar 12", "Mar 12, 2024"
 */
function formatRelativeDate(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay === 1) return "yesterday";
  if (diffDay < 7) return `${diffDay}d ago`;

  const sameYear = date.getFullYear() === now.getFullYear();
  const month = date.toLocaleString("en-US", { month: "short" });
  const day = date.getDate();
  if (sameYear) return `${month} ${day}`;
  return `${month} ${day}, ${date.getFullYear()}`;
}
