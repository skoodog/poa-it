/**
 * Design Tokens
 *
 * Mirrors the palette in components/PoaItSite.jsx. Shared here so wizard
 * components can import without redefining. If the master palette changes
 * in PoaItSite.jsx, update here too.
 *
 * One source of truth lives in PoaItSite.jsx (because it's the largest
 * consumer); this is a deliberate mirror, not the canonical source.
 */

export const TOKENS = {
  // Backgrounds
  PAPER: "#FFFFFF",
  PAPER_2: "#FAFAFA",

  // Ink (text + dark UI)
  INK: "#0A0A0A",
  INK_80: "#27272A",
  INK_60: "#52525B",
  INK_40: "#71717A",
  INK_20: "#A1A1AA",

  // Lines and dividers
  LINE: "#E4E4E7",
  LINE_2: "#D4D4D8",

  // Accents — used sparingly
  ACCENT: "#2563EB",
  LIVE_GREEN: "#10B981",

  // Warning / caution palette (Phase 3 additions)
  WARN_BG: "#FEF3C7",
  WARN_BORDER: "#FCD34D",
  WARN_INK: "#78350F",
  WARN_INK_STRONG: "#92400E",

  // Error / blocker palette
  ERR_BG: "#FEE2E2",
  ERR_BORDER: "#FCA5A5",
  ERR_INK: "#991B1B",

  // Referral / attorney-prompt palette (calm blue, not alarming)
  REF_BG: "#EFF6FF",
  REF_BORDER: "#BFDBFE",
  REF_INK: "#1E3A8A",
};

export const FONTS = {
  SANS: `'Geist', 'Inter', -apple-system, system-ui, sans-serif`,
  MONO: `'Geist Mono', 'JetBrains Mono', ui-monospace, monospace`,
};
