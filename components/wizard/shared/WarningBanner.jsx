"use client";

import { AlertTriangle, X } from "lucide-react";
import { TOKENS, FONTS } from "./tokens";

/**
 * WarningBanner
 *
 * Used for soft warnings that don't block progress but require user attention.
 * Examples: self-dealing warning when agent is not close family, springing-POA
 * acceptance warning, alternate-agent skip warning.
 *
 * Three severities:
 *   warning   — amber, attention-grabbing but not alarming
 *   info      — neutral, for context-setting
 *   referral  — blue, for attorney-marketplace prompts
 *
 * Two action modes:
 *   dismissable — user can close with X
 *   acknowledgment — user must check a box before continuing
 *
 * Props:
 *   title             — short headline (optional)
 *   children          — body content
 *   citation          — optional statutory reference, rendered in monospace
 *   severity          — 'warning' | 'info' | 'referral' (default 'warning')
 *   onDismiss         — if provided, shows X close button
 *   onAcknowledge     — if provided, shows acknowledgment checkbox
 *   acknowledgmentLabel — text next to the checkbox
 *   acknowledged      — current acknowledgment state (controlled by parent)
 */
export function WarningBanner({
  title,
  children,
  citation,
  severity = "warning",
  onDismiss,
  onAcknowledge,
  acknowledgmentLabel = "I understand.",
  acknowledged = false,
}) {
  const palette = {
    warning: {
      bg: TOKENS.WARN_BG,
      border: TOKENS.WARN_BORDER,
      ink: TOKENS.WARN_INK,
      inkStrong: TOKENS.WARN_INK_STRONG,
    },
    info: {
      bg: TOKENS.PAPER_2,
      border: TOKENS.LINE,
      ink: TOKENS.INK_60,
      inkStrong: TOKENS.INK,
    },
    referral: {
      bg: TOKENS.REF_BG,
      border: TOKENS.REF_BORDER,
      ink: TOKENS.REF_INK,
      inkStrong: TOKENS.REF_INK,
    },
    error: {
      bg: TOKENS.ERR_BG,
      border: TOKENS.ERR_BORDER,
      ink: TOKENS.ERR_INK,
      inkStrong: TOKENS.ERR_INK,
    },
  }[severity] || palette?.warning;

  return (
    <div
      style={{
        background: palette.bg,
        border: `1px solid ${palette.border}`,
        borderRadius: 10,
        padding: "16px 18px",
        margin: "16px 0",
        position: "relative",
        fontFamily: FONTS.SANS,
      }}
      role={severity === "error" ? "alert" : "region"}
    >
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flexShrink: 0, marginTop: 2 }}>
          <AlertTriangle size={16} strokeWidth={2} color={palette.inkStrong} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {title && (
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: palette.inkStrong,
                marginBottom: 6,
                letterSpacing: "-0.005em",
              }}
            >
              {title}
            </div>
          )}
          <div style={{ fontSize: 13, lineHeight: 1.55, color: palette.ink }}>
            {children}
          </div>
          {citation && (
            <div
              style={{
                marginTop: 10,
                fontFamily: FONTS.MONO,
                fontSize: 11,
                color: palette.ink,
                opacity: 0.75,
                letterSpacing: "0.01em",
              }}
            >
              {citation}
            </div>
          )}

          {onAcknowledge && (
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginTop: 14,
                fontSize: 13,
                color: palette.inkStrong,
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => onAcknowledge(e.target.checked)}
                style={{
                  accentColor: palette.inkStrong,
                  width: 16,
                  height: 16,
                  cursor: "pointer",
                }}
              />
              <span>{acknowledgmentLabel}</span>
            </label>
          )}
        </div>

        {onDismiss && (
          <button
            onClick={onDismiss}
            style={{
              background: "none",
              border: "none",
              color: palette.ink,
              cursor: "pointer",
              padding: 2,
              flexShrink: 0,
            }}
            aria-label="Dismiss"
          >
            <X size={16} strokeWidth={2} />
          </button>
        )}
      </div>
    </div>
  );
}
