"use client";

/**
 * Smart Input Formatting
 *
 * The user types whatever's natural; the display formats itself. The format
 * never matters to the user — they can type "5125551212", paste
 * "(512) 555-1212", or paste "512.555.1212" and the field reads
 * "(512) 555-1212" either way.
 *
 * Each formatter is "progressive": it formats whatever's been typed so far,
 * so partial input still looks sensible. The formatters operate on the
 * digits only — all non-digit characters in the raw input are stripped and
 * the formatter re-applies separators based on digit count.
 *
 * Cursor positioning is preserved by counting digits before the cursor,
 * applying the format, and finding the position in the formatted string
 * that contains the same digit count. This means the user can edit
 * anywhere in the field — middle, end, after a paste — and the cursor
 * lands where they expect.
 *
 * Sprint 6 (UX polish round).
 */

import { useRef } from "react";

/**
 * Phone — US 10 digits → "(xxx) xxx-xxxx".
 * Progressive: 1-3 digits show as raw; 4-6 wraps area code; 7-10 adds dash.
 */
export function formatPhone(raw) {
  const digits = digitsOnly(raw).slice(0, 10);
  if (digits.length === 0) return "";
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

/**
 * ZIP — 5 digits, or 9 digits as "xxxxx-xxxx".
 */
export function formatZip(raw) {
  const digits = digitsOnly(raw).slice(0, 9);
  if (digits.length === 0) return "";
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

/**
 * Date — "MM/DD/YYYY". Auto-inserts slashes after month and day.
 */
export function formatDate(raw) {
  const digits = digitsOnly(raw).slice(0, 8);
  if (digits.length === 0) return "";
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

/**
 * EIN — Employer Identification Number, "xx-xxxxxxx".
 */
export function formatEin(raw) {
  const digits = digitsOnly(raw).slice(0, 9);
  if (digits.length === 0) return "";
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}-${digits.slice(2)}`;
}

/**
 * SSN — "xxx-xx-xxxx". Provided for completeness; we do NOT currently
 * collect SSNs in any wizard step.
 */
export function formatSsn(raw) {
  const digits = digitsOnly(raw).slice(0, 9);
  if (digits.length === 0) return "";
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}

/** Strip everything but digits. Useful at API/DB boundaries if needed. */
export function digitsOnly(value) {
  return (value || "").replace(/\D/g, "");
}

/** Count digit characters in `value` that appear before position `pos`. */
export function countDigitsBefore(value, pos) {
  let count = 0;
  const limit = Math.min(pos, (value || "").length);
  for (let i = 0; i < limit; i++) {
    if (/\d/.test(value[i])) count++;
  }
  return count;
}

/**
 * Find the position in `value` immediately AFTER the nth digit (1-indexed).
 * If n is 0, returns 0. If n exceeds the digit count, returns value.length.
 * Used to restore the cursor after re-formatting.
 */
export function positionAfterNthDigit(value, n) {
  if (n <= 0) return 0;
  let count = 0;
  for (let i = 0; i < value.length; i++) {
    if (/\d/.test(value[i])) {
      count++;
      if (count === n) return i + 1;
    }
  }
  return value.length;
}

export const FORMATTERS = Object.freeze({
  phone: formatPhone,
  zip: formatZip,
  date: formatDate,
  ein: formatEin,
  ssn: formatSsn,
});

/**
 * useSmartFormat — React hook that wraps an input's onChange to apply
 * progressive formatting and preserve cursor position.
 *
 * Returns { ref, onChange } that you spread onto an <input>:
 *
 *   const { ref, onChange } = useSmartFormat(phone, setPhone, "phone");
 *   <input ref={ref} value={phone} onChange={onChange} />
 *
 * If `formatType` is null/undefined, returns a passthrough — backward
 * compatible with any caller that doesn't want formatting.
 *
 * Cursor preservation strategy:
 *   1. Count digit characters in the raw input that sit BEFORE the cursor.
 *   2. Apply the format.
 *   3. Pass the formatted value to the caller's onChange.
 *   4. On the next animation frame (after React has re-rendered), set the
 *      cursor in the formatted string to just after the same digit count.
 *
 * That means the user's cursor stays "anchored" to the same content,
 * regardless of how many formatting characters get inserted around it.
 *
 * @param {string} value - the current displayed value (already formatted)
 * @param {(v: string) => void} onValueChange - parent setter
 * @param {string|null} formatType - one of FORMATTERS keys, or null/undefined
 */
export function useSmartFormat(value, onValueChange, formatType) {
  const ref = useRef(null);

  function handleChange(e) {
    if (!formatType || !FORMATTERS[formatType]) {
      onValueChange(e.target.value);
      return;
    }
    const newRaw = e.target.value;
    const cursorBefore = e.target.selectionStart ?? newRaw.length;
    const digitsBeforeCursor = countDigitsBefore(newRaw, cursorBefore);
    const formatted = FORMATTERS[formatType](newRaw);
    onValueChange(formatted);
    // Restore cursor after React paints the new value
    requestAnimationFrame(() => {
      if (!ref.current) return;
      const pos = positionAfterNthDigit(formatted, digitsBeforeCursor);
      try {
        ref.current.setSelectionRange(pos, pos);
      } catch {
        // Some input types (e.g. email) don't support setSelectionRange;
        // safe to ignore — formatting still works, cursor goes to end.
      }
    });
  }

  return { ref, onChange: handleChange };
}
