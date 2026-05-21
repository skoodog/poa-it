"use client";

import { Search, X } from "lucide-react";
import { TOKENS, FONTS } from "../wizard/shared/tokens";

/**
 * SearchInput
 *
 * Reusable controlled search input with magnifying-glass icon and a clear-X
 * button that appears when there's text. Designed to feel native, not like
 * a search engine search box.
 *
 * Props:
 *   value         — current search text
 *   onChange(v)   — called with new value
 *   placeholder   — placeholder text
 *   autoFocus     — focus on mount
 */

export function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  autoFocus = false,
}) {
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        width: "100%",
        maxWidth: 360,
      }}
    >
      <Search
        size={14}
        strokeWidth={1.8}
        color={TOKENS.INK_40}
        style={{
          position: "absolute",
          left: 12,
          pointerEvents: "none",
        }}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        style={{
          width: "100%",
          padding: "8px 32px 8px 34px",
          fontSize: 13.5,
          fontFamily: FONTS.SANS,
          color: TOKENS.INK,
          background: TOKENS.PAPER,
          border: `1px solid ${TOKENS.LINE}`,
          borderRadius: 7,
          outline: "none",
        }}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          style={{
            position: "absolute",
            right: 8,
            width: 22,
            height: 22,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: TOKENS.INK_40,
            borderRadius: 4,
          }}
        >
          <X size={13} strokeWidth={2} />
        </button>
      )}
    </div>
  );
}
