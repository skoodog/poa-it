"use client";

import { useState } from "react";
import { StatutoryTooltip } from "./StatutoryTooltip";
import { TOKENS, FONTS } from "./tokens";

/**
 * Shared form components for the wizard.
 *
 * FormField — text input with label, optional tooltip, optional error
 * SelectField — dropdown with the same shape
 * RadioGroup — vertical list of mutually-exclusive options
 *
 * All three log field changes to audit via the onChange callback if a
 * sessionId is provided. Validation errors render inline below the field.
 */

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
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div>
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
        type={type}
        value={value || ""}
        onChange={(e) => {
          let v = e.target.value;
          if (maxLength) v = v.slice(0, maxLength);
          onChange(v);
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        disabled={disabled}
        style={{
          width: "100%",
          padding: "11px 14px",
          fontSize: 14,
          fontFamily: FONTS.SANS,
          color: TOKENS.INK,
          background: disabled ? TOKENS.PAPER_2 : TOKENS.PAPER,
          border: `1px solid ${error ? TOKENS.ERR_BORDER : focused ? TOKENS.INK : TOKENS.LINE}`,
          borderRadius: 7,
          outline: "none",
          transition: "border-color 0.15s",
          boxShadow: focused ? `0 0 0 3px rgba(10,10,10,0.05)` : "none",
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

  return (
    <div>
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
          background: disabled ? TOKENS.PAPER_2 : TOKENS.PAPER,
          border: `1px solid ${error ? TOKENS.ERR_BORDER : focused ? TOKENS.INK : TOKENS.LINE}`,
          borderRadius: 7,
          outline: "none",
          transition: "border-color 0.15s",
          cursor: disabled ? "not-allowed" : "pointer",
          boxShadow: focused ? `0 0 0 3px rgba(10,10,10,0.05)` : "none",
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
