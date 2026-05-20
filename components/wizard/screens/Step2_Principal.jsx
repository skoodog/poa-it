"use client";

import { useEffect, useState } from "react";
import { TOKENS, FONTS } from "../shared/tokens";
import { WizardShell } from "../WizardShell";
import { FormField, SelectField } from "../shared/FormFields";
import { WarningBanner } from "../shared/WarningBanner";
import { TX_COUNTIES, isTexasZip } from "../../../lib/data/txCounties";
import { updateState, markStepComplete } from "../../../lib/wizard/state";
import { audit } from "../../../lib/audit/logger";

/**
 * Step 2 — Principal (You)
 * Phase 3 § 3.3
 *
 * Collects the principal's information for identity verification at
 * notarization and for use in document merge fields.
 *
 * Validations:
 *   - Full legal name: minimum 2 words
 *   - DOB: must compute to ≥18 (already gated at eligibility but enforce again)
 *   - ZIP: must be a Texas ZIP prefix
 *   - County: required (auto-suggested from ZIP if possible)
 *   - Phone: 10-digit US format
 *   - Email: valid email format
 */
export function Step2_Principal({ state, setState, onBack, onContinue }) {
  useEffect(() => {
    audit.stepEntered(state.sessionId, "step2_principal");
  }, [state.sessionId]);

  const [touched, setTouched] = useState({});

  function updateField(field, value) {
    setState(updateState(state, { [field]: value }));
  }

  function handleBlur(field) {
    setTouched((prev) => ({ ...prev, [field]: true }));
    audit.fieldChanged(state.sessionId, field, !!state[field]);
  }

  // Validation
  const errors = computeErrors(state);
  const hasZipError = touched.principalZip && errors.principalZip;
  const allValid = Object.values(errors).every((e) => !e);
  const requiredFilled =
    state.principalFullLegalName &&
    state.principalDob &&
    state.principalAddress &&
    state.principalCity &&
    state.principalZip &&
    state.principalCounty &&
    state.principalPhone &&
    state.principalEmail;
  const canContinue = requiredFilled && allValid;

  function handleContinue() {
    if (!canContinue) return;
    audit.stepCompleted(state.sessionId, "step2_principal", {
      principalCounty: state.principalCounty,
      principalZipPrefix: state.principalZip?.slice(0, 3),
    });
    const next = markStepComplete(state, "step2_principal", "step3_agent");
    setState(next);
    onContinue();
  }

  return (
    <WizardShell
      stepId="step2_principal"
      stepNumber="Step 3 of 9 · Your Information"
      title="Tell us about you."
      subtitle="You're the 'principal' — the person granting authority. We use this information to populate your document and verify your identity at notarization."
      onBack={onBack}
      onContinue={handleContinue}
      canContinue={canContinue}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 18, fontFamily: FONTS.SANS }}>
        <FormField
          label="Full legal name"
          value={state.principalFullLegalName}
          onChange={(v) => updateField("principalFullLegalName", v)}
          placeholder="Jane M. Doe"
          required
          tooltip="The exact name as it appears on your driver's license or passport. Including your middle name or initial matters — banks check for this."
          autoComplete="name"
          error={touched.principalFullLegalName ? errors.principalFullLegalName : null}
          onTooltipOpen={() => audit.tooltipOpened(state.sessionId, "principal_legal_name")}
        />

        <FormField
          label="Date of birth"
          value={state.principalDob}
          onChange={(v) => updateField("principalDob", v)}
          placeholder="MM/DD/YYYY"
          required
          type="text"
          tooltip="Texas requires your date of birth on the document so banks and hospitals can confirm they're dealing with the right person."
          autoComplete="bday"
          error={touched.principalDob ? errors.principalDob : null}
          onTooltipOpen={() => audit.tooltipOpened(state.sessionId, "principal_dob")}
        />

        <FormField
          label="Street address"
          value={state.principalAddress}
          onChange={(v) => updateField("principalAddress", v)}
          placeholder="123 Main St, Apt 4"
          required
          tooltip="Your home address. Used to confirm Texas residency and to establish the county for notary matching."
          autoComplete="street-address"
          error={touched.principalAddress ? errors.principalAddress : null}
        />

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 12 }}>
          <FormField
            label="City"
            value={state.principalCity}
            onChange={(v) => updateField("principalCity", v)}
            placeholder="Austin"
            required
            autoComplete="address-level2"
            error={touched.principalCity ? errors.principalCity : null}
          />
          <div>
            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 500,
                color: TOKENS.INK_60,
                marginBottom: 6,
              }}
            >
              State
            </label>
            <div
              style={{
                width: "100%",
                padding: "11px 14px",
                fontSize: 14,
                color: TOKENS.INK,
                background: TOKENS.PAPER_2,
                border: `1px solid ${TOKENS.LINE}`,
                borderRadius: 7,
                fontFamily: FONTS.SANS,
              }}
            >
              Texas
            </div>
          </div>
          <FormField
            label="ZIP"
            value={state.principalZip}
            onChange={(v) => updateField("principalZip", v.replace(/\D/g, "").slice(0, 5))}
            placeholder="78704"
            required
            maxLength={5}
            autoComplete="postal-code"
            error={touched.principalZip ? errors.principalZip : null}
          />
        </div>

        {hasZipError && state.principalZip?.length === 5 && (
          <WarningBanner severity="warning" title="Hmm — that doesn't look like a Texas ZIP code">
            POA-IT currently serves Texas residents only. If you've recently moved to Texas, double-check your ZIP — Texas ZIPs start with 7 (most) or 88 (a few western counties).
          </WarningBanner>
        )}

        <SelectField
          label="County"
          value={state.principalCounty}
          onChange={(v) => updateField("principalCounty", v)}
          options={TX_COUNTIES}
          placeholder="Select your Texas county…"
          required
          tooltip="The Texas county where you live. We use this to match you with a notary in your area, and if you grant real-estate authority over Texas property, to identify the county clerk's office for recording."
          citation="Tex. Est. Code § 751.151"
          error={touched.principalCounty ? errors.principalCounty : null}
          onTooltipOpen={() => audit.tooltipOpened(state.sessionId, "principal_county")}
        />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <FormField
            label="Phone"
            value={state.principalPhone}
            onChange={(v) => updateField("principalPhone", v)}
            placeholder="(512) 555-0142"
            required
            type="tel"
            autoComplete="tel"
            error={touched.principalPhone ? errors.principalPhone : null}
          />
          <FormField
            label="Email"
            value={state.principalEmail}
            onChange={(v) => updateField("principalEmail", v)}
            placeholder="you@example.com"
            required
            type="email"
            autoComplete="email"
            error={touched.principalEmail ? errors.principalEmail : null}
          />
        </div>

        {/* Force blur logging on submit attempt */}
        {!canContinue && (
          <div
            style={{
              fontSize: 12,
              color: TOKENS.INK_40,
              lineHeight: 1.5,
              padding: "12px 14px",
              background: TOKENS.PAPER_2,
              borderRadius: 7,
              border: `1px solid ${TOKENS.LINE}`,
            }}
          >
            Fill all required fields to continue. Hover the <strong style={{ color: TOKENS.INK }}>?</strong> icon next to any label to see what we use that information for.
          </div>
        )}
      </div>
    </WizardShell>
  );
}

/**
 * Computes validation errors for each field.
 * Returns an object keyed by field name; non-error means the field is valid.
 */
function computeErrors(state) {
  const errors = {};

  // Full legal name: at least 2 words
  if (state.principalFullLegalName) {
    const words = state.principalFullLegalName.trim().split(/\s+/);
    if (words.length < 2) {
      errors.principalFullLegalName = "Please enter your full legal name (first and last at minimum).";
    } else if (!/^[A-Za-z\s\-'.]+$/.test(state.principalFullLegalName)) {
      errors.principalFullLegalName = "Use only letters, spaces, hyphens, apostrophes, and periods.";
    }
  }

  // DOB: MM/DD/YYYY, must compute to >=18
  if (state.principalDob) {
    const match = state.principalDob.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) {
      errors.principalDob = "Format: MM/DD/YYYY (e.g., 03/15/1965).";
    } else {
      const [, mm, dd, yyyy] = match;
      const dob = new Date(`${yyyy}-${mm}-${dd}`);
      if (isNaN(dob.getTime())) {
        errors.principalDob = "That date doesn't look valid.";
      } else {
        const age = computeAge(dob);
        if (age < 18) {
          errors.principalDob = "You must be at least 18 to create a power of attorney.";
        } else if (age > 120) {
          errors.principalDob = "Please double-check the year.";
        }
      }
    }
  }

  // Address: minimum format check
  if (state.principalAddress && state.principalAddress.trim().length < 5) {
    errors.principalAddress = "Please enter a full street address.";
  }

  // City: required, just non-empty
  if (state.principalCity && state.principalCity.trim().length < 2) {
    errors.principalCity = "Please enter a valid city.";
  }

  // ZIP: must be Texas
  if (state.principalZip) {
    if (!/^\d{5}$/.test(state.principalZip)) {
      errors.principalZip = "5-digit ZIP required.";
    } else if (!isTexasZip(state.principalZip)) {
      errors.principalZip = "This doesn't look like a Texas ZIP code.";
    }
  }

  // Phone: US 10-digit (allow common formats)
  if (state.principalPhone) {
    const digits = state.principalPhone.replace(/\D/g, "");
    if (digits.length !== 10) {
      errors.principalPhone = "Please enter a 10-digit US phone number.";
    }
  }

  // Email: simple regex check
  if (state.principalEmail) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.principalEmail)) {
      errors.principalEmail = "That doesn't look like a valid email address.";
    }
  }

  return errors;
}

function computeAge(dob) {
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}
