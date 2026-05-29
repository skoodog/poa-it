"use client";

import { useState } from "react";
import { StatutoryTooltip } from "./StatutoryTooltip";
import { TOKENS, FONTS } from "./tokens";
import { useSmartFormat } from "../../../lib/formatting/smartFormat";
import { useBlockingHighlight } from "./BlockingHighlight";

/**
 * Shared form components for the wizard.
 *
 * FormField — text input with label, optional tooltip, optional error,
 *   optional smart formatting (phone, zip, date, ein, ssn), and automatic
 *   blocking highlight via BlockingHighlight context.
 * SelectField — dropdown with the same shape + blocking highlight.
 * RadioGroup — vertical list of mutually-exclusive options.
 *
 * Smart formatting: pass `format="phone"` (or zip/date/ein/ssn) to make the
 * field accept any input and progressively format the display. The user
 * never sees a format mismatch; they type, the field formats. See
 * lib/formatting/smartFormat.js for details and cursor behavior.
 *
 * Blocking highlight: when a parent BlockingHighlightProvider has been
 * triggered (because the user tried to advance past invalid input), any
 * field that is (required && empty) OR (has an error) renders with a
 * saturated amber border + tinted background so the user can see exactly
 * what's holding them up. No caller wiring required — just `required`.
 */

// Strong amber highlight tokens — used when a field is blocking advance.
const BLOCK_BG = "rgba(254, 243, 199, 0.5)";   // amber-100 @ 50%
const BLOCK_BORDER = "#F59E0B";                // amber-500
const BLOCK_SHADOW = "0 0 0 3px rgba(245, 158, 11, 0.18)";

export function FormField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  tooltip,
  citation,
  error,
  required = false,
  maxLength,
  onTooltipOpen,
  autoComplete,
  disabled = false,
  format = null, // "phone" | "zip" | "date" | "ein" | "ssn" | null
}) {
  const [focused, setFocused] = useState(false);
  const showBlocking = useBlockingHighlight();
  const { ref, onChange: smartChange } = useSmartFormat(value, onChange, format);

  // A field is "blocking" if it has a validation error OR it's required and
  // empty. The highlight only renders when the user has tried to advance
  // (showBlocking is true), so we don't shout at the user before they've
  // had a chance to fill anything in.
  const isBlocking = !disabled && (error || (required && !value));
  const showBlockHighlight = showBlocking && isBlocking;

  // Borders and backgrounds prioritize: blocking-highlight > error > focus > default.
  const borderColor = showBlockHighlight
    ? BLOCK_BORDER
    : error
    ? TOKENS.ERR_BORDER
    : focused
    ? TOKENS.INK
    : TOKENS.LINE;
  const background = disabled
    ? TOKENS.PAPER_2
    : showBlockHighlight
    ? BLOCK_BG
    : TOKENS.PAPER;
  const boxShadow = showBlockHighlight
    ? BLOCK_SHADOW
    : focused
    ? `0 0 0 3px rgba(10,10,10,0.05)`
    : "none";

  return (
    <div data-blocking-target={showBlockHighlight ? "true" : undefined}>
      <label
        style={{
          display: "flex",
          alignItems: "center",
          fontSize: 13,
          fontWeight: 500,
          color: TOKENS.INK_60,
          marginBottom: 6,
        }}
      >
        <span>
          {label}
          {required && (
            <span style={{ color: TOKENS.ERR_INK, marginLeft: 4 }} aria-label="required">
              *
            </span>
          )}
        </span>
        {tooltip && (
          <StatutoryTooltip plainEnglish={tooltip} citation={citation} onOpen={onTooltipOpen} />
        )}
      </label>
      <input
        ref={ref}
        type={type}
        value={value || ""}
        onChange={(e) => {
          // If a format is set, useSmartFormat handles the change (it
          // formats, then forwards the formatted value to onChange).
          if (format) {
            smartChange(e);
            return;
          }
          let v = e.target.value;
          if (maxLength) v = v.slice(0, maxLength);
          onChange(v);
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        disabled={disabled}
        // For formatted fields, give the keyboard a hint on mobile.
        inputMode={
          format === "phone" || format === "zip" || format === "date" ||
          format === "ein" || format === "ssn"
            ? "numeric"
            : undefined
        }
        style={{
          width: "100%",
          padding: "11px 14px",
          fontSize: 14,
          fontFamily: FONTS.SANS,
          color: TOKENS.INK,
          background,
          border: `${showBlockHighlight ? "2px" : "1px"} solid ${borderColor}`,
          borderRadius: 7,
          outline: "none",
          transition: "border-color 0.15s, background-color 0.15s",
          boxShadow,
        }}
      />
      {error && (
        <div
          style={{
            marginTop: 6,
            fontSize: 12,
            color: TOKENS.ERR_INK,
            lineHeight: 1.4,
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder = "Select…",
  tooltip,
  citation,
  error,
  required = false,
  onTooltipOpen,
  disabled = false,
}) {
  const [focused, setFocused] = useState(false);
  const showBlocking = useBlockingHighlight();

  const isBlocking = !disabled && (error || (required && !value));
  const showBlockHighlight = showBlocking && isBlocking;

  const borderColor = showBlockHighlight
    ? BLOCK_BORDER
    : error
    ? TOKENS.ERR_BORDER
    : focused
    ? TOKENS.INK
    : TOKENS.LINE;
  const background = disabled
    ? TOKENS.PAPER_2
    : showBlockHighlight
    ? BLOCK_BG
    : TOKENS.PAPER;
  const boxShadow = showBlockHighlight
    ? BLOCK_SHADOW
    : focused
    ? `0 0 0 3px rgba(10,10,10,0.05)`
    : "none";

  return (
    <div data-blocking-target={showBlockHighlight ? "true" : undefined}>
      <label
        style={{
          display: "flex",
          alignItems: "center",
          fontSize: 13,
          fontWeight: 500,
          color: TOKENS.INK_60,
          marginBottom: 6,
        }}
      >
        <span>
          {label}
          {required && (
            <span style={{ color: TOKENS.ERR_INK, marginLeft: 4 }} aria-label="required">
              *
            </span>
          )}
        </span>
        {tooltip && (
          <StatutoryTooltip plainEnglish={tooltip} citation={citation} onOpen={onTooltipOpen} />
        )}
      </label>
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        disabled={disabled}
        style={{
          width: "100%",
          padding: "11px 14px",
          fontSize: 14,
          fontFamily: FONTS.SANS,
          color: value ? TOKENS.INK : TOKENS.INK_40,
          background,
          border: `${showBlockHighlight ? "2px" : "1px"} solid ${borderColor}`,
          borderRadius: 7,
          outline: "none",
          transition: "border-color 0.15s, background-color 0.15s",
          cursor: disabled ? "not-allowed" : "pointer",
          boxShadow,
          appearance: "none",
          backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2371717A' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 12px center",
          paddingRight: 36,
        }}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => {
          // Support both string options and {value, label} objects
          if (typeof opt === "string") {
            return (
              <option key={opt} value={opt}>
                {opt}
              </option>
            );
          }
          return (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          );
        })}
      </select>
      {error && (
        <div
          style={{
            marginTop: 6,
            fontSize: 12,
            color: TOKENS.ERR_INK,
            lineHeight: 1.4,
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}

/**
 * Vertical list of mutually-exclusive options as cards.
 * Bigger touch target than radio buttons; better for mobile and for
 * options where the label needs a description.
 */
export function RadioCardGroup({ label, value, onChange, options, tooltip, citation, required = false, onTooltipOpen }) {
  return (
    <div>
      {label && (
        <label
          style={{
            display: "flex",
            alignItems: "center",
            fontSize: 13,
            fontWeight: 500,
            color: TOKENS.INK_60,
            marginBottom: 10,
          }}
        >
          <span>
            {label}
            {required && (
              <span style={{ color: TOKENS.ERR_INK, marginLeft: 4 }} aria-label="required">
                *
              </span>
            )}
          </span>
          {tooltip && (
            <StatutoryTooltip plainEnglish={tooltip} citation={citation} onOpen={onTooltipOpen} />
          )}
        </label>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {options.map((opt) => {
          const selected = value === opt.value;
          return (
            <label
              key={opt.value}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                padding: "12px 14px",
                background: selected ? TOKENS.PAPER_2 : TOKENS.PAPER,
                border: `1px solid ${selected ? TOKENS.INK : TOKENS.LINE}`,
                borderRadius: 8,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  border: `1.5px solid ${selected ? TOKENS.INK : TOKENS.INK_40}`,
                  background: TOKENS.PAPER,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  marginTop: 2,
                  transition: "all 0.15s",
                }}
              >
                {selected && (
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: TOKENS.INK,
                    }}
                  />
                )}
              </div>
              <input
                type="radio"
                checked={selected}
                onChange={() => onChange(opt.value)}
                style={{
                  position: "absolute",
                  opacity: 0,
                  width: 0,
                  height: 0,
                  pointerEvents: "none",
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: TOKENS.INK, marginBottom: opt.description ? 2 : 0 }}>
                  {opt.label}
                </div>
                {opt.description && (
                  <div style={{ fontSize: 12.5, color: TOKENS.INK_60, lineHeight: 1.5 }}>
                    {opt.description}
                  </div>
                )}
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
