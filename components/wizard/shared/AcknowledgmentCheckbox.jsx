"use client";

import { Check } from "lucide-react";
import { TOKENS, FONTS } from "./tokens";
import { audit } from "../../../lib/audit/logger";

/**
 * AcknowledgmentCheckbox
 *
 * A checkbox that, when checked, logs the exact acknowledgment text to audit.
 * Used wherever Phase 3 requires a required acknowledgment (e.g., Step 8's
 * five pre-purchase acknowledgments, the springing-POA warning).
 *
 * The audit log captures:
 *   - The exact text of what was acknowledged (not paraphrased)
 *   - The rule ID or acknowledgment key
 *   - The timestamp
 *   - The session ID
 *
 * This becomes the evidentiary record. If a customer ever claims they didn't
 * understand what they were agreeing to, the audit log shows exactly what
 * they saw and when they checked it.
 *
 * Props:
 *   ruleId     — identifies the acknowledgment (e.g., "step1_ministerial_acknowledgment")
 *   text       — the exact text shown next to the checkbox (logged verbatim)
 *   checked    — current checked state (controlled by parent)
 *   onChange   — callback (newCheckedValue) → void; audit logging happens automatically
 *   sessionId  — wizard session ID for audit logging
 *   required   — visually mark as required (red asterisk)
 */
export function AcknowledgmentCheckbox({
  ruleId,
  text,
  checked,
  onChange,
  sessionId,
  required = true,
}) {
  function handleChange(e) {
    const isChecked = e.target.checked;
    if (isChecked && sessionId) {
      audit.acknowledgmentRecorded(sessionId, ruleId, text);
    }
    onChange(isChecked);
  }

  return (
    <label
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        padding: "12px 14px",
        border: `1px solid ${checked ? TOKENS.INK : TOKENS.LINE}`,
        background: checked ? TOKENS.PAPER_2 : TOKENS.PAPER,
        borderRadius: 8,
        cursor: "pointer",
        transition: "all 0.15s",
        fontFamily: FONTS.SANS,
      }}
    >
      <div
        style={{
          width: 18,
          height: 18,
          borderRadius: 4,
          border: `1.5px solid ${checked ? TOKENS.INK : TOKENS.INK_40}`,
          background: checked ? TOKENS.INK : TOKENS.PAPER,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          marginTop: 1,
          transition: "all 0.15s",
        }}
      >
        {checked && <Check size={12} strokeWidth={3} color={TOKENS.PAPER} />}
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={handleChange}
        style={{
          position: "absolute",
          opacity: 0,
          width: 0,
          height: 0,
          pointerEvents: "none",
        }}
      />
      <div style={{ fontSize: 13.5, lineHeight: 1.55, color: TOKENS.INK }}>
        {text}
        {required && (
          <span
            style={{
              color: TOKENS.ERR_INK,
              marginLeft: 4,
              fontSize: 12,
            }}
            aria-label="required"
          >
            *
          </span>
        )}
      </div>
    </label>
  );
}
