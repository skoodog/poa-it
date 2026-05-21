"use client";

import { TOKENS, FONTS } from "../wizard/shared/tokens";

/**
 * ClientStatusBadge
 *
 * Color-coded pill rendering one of the client status enum values. Used in
 * the client list, profile pages, and (Sprint 3b) the activity timeline.
 *
 * Color semantics:
 *   intake             — neutral gray (just created, nothing happened yet)
 *   in_progress        — blue (work happening)
 *   ready_for_review   — amber (waiting on professional action)
 *   signed             — green-tinted (success milestone)
 *   notarized          — green (terminal success)
 *   revoked            — red-tinted (terminal failure / explicit revocation)
 *   archived           — gray with dashed border (soft-deleted)
 */

const STATUS_CONFIG = {
  intake: {
    label: "Intake",
    bg: "#F4F4F5",
    text: "#52525B",
    border: "#E4E4E7",
  },
  in_progress: {
    label: "In progress",
    bg: "#DBEAFE",
    text: "#1E40AF",
    border: "#93C5FD",
  },
  ready_for_review: {
    label: "Ready for review",
    bg: "#FEF3C7",
    text: "#92400E",
    border: "#FCD34D",
  },
  signed: {
    label: "Signed",
    bg: "#D1FAE5",
    text: "#065F46",
    border: "#6EE7B7",
  },
  notarized: {
    label: "Notarized",
    bg: "#10B981",
    text: "#FFFFFF",
    border: "#10B981",
  },
  revoked: {
    label: "Revoked",
    bg: "#FEE2E2",
    text: "#991B1B",
    border: "#FCA5A5",
  },
  archived: {
    label: "Archived",
    bg: "transparent",
    text: "#71717A",
    border: "#D4D4D8",
    dashed: true,
  },
};

export function ClientStatusBadge({ status, size = "md" }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.intake;
  const sizeStyles =
    size === "sm"
      ? { fontSize: 10, padding: "2px 7px", height: 18 }
      : { fontSize: 11, padding: "3px 9px", height: 22 };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        background: config.bg,
        color: config.text,
        border: `1px ${config.dashed ? "dashed" : "solid"} ${config.border}`,
        borderRadius: 100,
        fontFamily: FONTS.MONO,
        fontWeight: 600,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        lineHeight: 1,
        whiteSpace: "nowrap",
        ...sizeStyles,
      }}
    >
      {config.label}
    </span>
  );
}
