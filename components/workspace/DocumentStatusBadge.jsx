"use client";

/**
 * DocumentStatusBadge — visual badge for a document's lifecycle status.
 *
 * Sprint 4c — adds revoked / superseded as visible states.
 *
 * Visual conventions:
 *   - Active states (draft, generated, signed, notarized, delivered): green/neutral
 *   - Caution states (awaiting_signature, awaiting_notarization): amber
 *   - Terminal states (revoked, superseded): muted red/gray
 */

import { TOKENS, FONTS } from "../wizard/shared/tokens";

const STATUS_CONFIG = {
  draft: { label: "Draft", bg: "#E5E7EB", color: "#374151" },
  generated: { label: "Generated", bg: "#DBEAFE", color: "#1E40AF" },
  preview_shown: { label: "Preview Shown", bg: "#DBEAFE", color: "#1E40AF" },
  purchased: { label: "Purchased", bg: "#D1FAE5", color: "#065F46" },
  awaiting_signature: { label: "Awaiting Signature", bg: "#FEF3C7", color: "#92400E" },
  signed: { label: "Signed", bg: "#D1FAE5", color: "#065F46" },
  awaiting_notarization: { label: "Awaiting Notarization", bg: "#FEF3C7", color: "#92400E" },
  notarized: { label: "Notarized", bg: "#D1FAE5", color: "#065F46" },
  delivered: { label: "Delivered", bg: "#D1FAE5", color: "#065F46" },
  revoked: { label: "Revoked", bg: "#FEE2E2", color: "#991B1B" },
  superseded: { label: "Superseded", bg: "#E5E7EB", color: "#6B7280" },
};

export function DocumentStatusBadge({ status, size = "default" }) {
  const config = STATUS_CONFIG[status] || {
    label: status?.replace(/_/g, " ") || "Unknown",
    bg: "#E5E7EB",
    color: "#374151",
  };

  const fontSize = size === "small" ? 10 : 11;
  const padding = size === "small" ? "2px 6px" : "3px 8px";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding,
        background: config.bg,
        color: config.color,
        borderRadius: 999,
        fontFamily: FONTS.SANS,
        fontSize,
        fontWeight: 600,
        letterSpacing: 0.2,
        whiteSpace: "nowrap",
      }}
    >
      {config.label}
    </span>
  );
}
