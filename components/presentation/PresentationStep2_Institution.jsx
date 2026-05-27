"use client";

import { TOKENS, FONTS } from "../wizard/shared/tokens";
import { PresentationWizardShell } from "./PresentationWizardShell";
import { FormField, SelectField } from "../wizard/shared/FormFields";
import { WarningBanner } from "../wizard/shared/WarningBanner";
import { updatePresentationState } from "../../lib/wizard/presentationState";

const US_STATES = [
  { value: "AL", label: "AL" }, { value: "AK", label: "AK" }, { value: "AZ", label: "AZ" },
  { value: "AR", label: "AR" }, { value: "CA", label: "CA" }, { value: "CO", label: "CO" },
  { value: "CT", label: "CT" }, { value: "DE", label: "DE" }, { value: "FL", label: "FL" },
  { value: "GA", label: "GA" }, { value: "HI", label: "HI" }, { value: "ID", label: "ID" },
  { value: "IL", label: "IL" }, { value: "IN", label: "IN" }, { value: "IA", label: "IA" },
  { value: "KS", label: "KS" }, { value: "KY", label: "KY" }, { value: "LA", label: "LA" },
  { value: "ME", label: "ME" }, { value: "MD", label: "MD" }, { value: "MA", label: "MA" },
  { value: "MI", label: "MI" }, { value: "MN", label: "MN" }, { value: "MS", label: "MS" },
  { value: "MO", label: "MO" }, { value: "MT", label: "MT" }, { value: "NE", label: "NE" },
  { value: "NV", label: "NV" }, { value: "NH", label: "NH" }, { value: "NJ", label: "NJ" },
  { value: "NM", label: "NM" }, { value: "NY", label: "NY" }, { value: "NC", label: "NC" },
  { value: "ND", label: "ND" }, { value: "OH", label: "OH" }, { value: "OK", label: "OK" },
  { value: "OR", label: "OR" }, { value: "PA", label: "PA" }, { value: "RI", label: "RI" },
  { value: "SC", label: "SC" }, { value: "SD", label: "SD" }, { value: "TN", label: "TN" },
  { value: "TX", label: "TX" }, { value: "UT", label: "UT" }, { value: "VT", label: "VT" },
  { value: "VA", label: "VA" }, { value: "WA", label: "WA" }, { value: "WV", label: "WV" },
  { value: "WI", label: "WI" }, { value: "WY", label: "WY" },
];

/**
 * Step 2 — Configure institution details (name, address, contact).
 *
 * Sprint 4d — Round 2.
 */
export function PresentationStep2_Institution({ state, setState, onBack, onContinue }) {
  function update(field) {
    return (value) => setState(updatePresentationState(state, { [field]: value }));
  }

  // Clear the placeholder name on first edit
  function handleNameChange(value) {
    setState(updatePresentationState(state, { institutionName: value }));
  }

  const cleanInstitutionName =
    state.institutionName === "Draft Presentation (institution TBD)"
      ? ""
      : state.institutionName;

  const canContinue = !!cleanInstitutionName?.trim();

  return (
    <PresentationWizardShell
      state={state}
      stepId="step2_institution"
      title="Who is this packet for?"
      subtitle="The institution name appears on the cover sheet. Address and contact info are optional but recommended for institutions you'll send physical mail to."
      onBack={onBack}
      onContinue={onContinue}
      canContinue={canContinue}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <FormField
          label="Institution name"
          value={cleanInstitutionName}
          onChange={handleNameChange}
          placeholder="e.g., Bank of America, Charles Schwab, Heritage Title Company"
          required
          autoComplete="organization"
        />

        <SectionLabel>Institution address (optional)</SectionLabel>

        <FormField
          label="Street address"
          value={state.institutionAddress || ""}
          onChange={update("institutionAddress")}
          placeholder="100 Main Street"
          autoComplete="street-address"
        />

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 12 }}>
          <FormField
            label="City"
            value={state.institutionCity || ""}
            onChange={update("institutionCity")}
            placeholder="Austin"
          />
          <SelectField
            label="State"
            value={state.institutionState || "TX"}
            onChange={update("institutionState")}
            options={US_STATES}
          />
          <FormField
            label="ZIP"
            value={state.institutionZip || ""}
            onChange={(v) => update("institutionZip")(v.replace(/\D/g, "").slice(0, 5))}
            placeholder="78701"
            maxLength={5}
            autoComplete="postal-code"
          />
        </div>

        <SectionLabel>Institution contact (optional)</SectionLabel>

        <FormField
          label="Contact name"
          value={state.institutionContactName || ""}
          onChange={update("institutionContactName")}
          placeholder="e.g., Jane Smith, Branch Manager"
        />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <FormField
            label="Contact email"
            value={state.institutionContactEmail || ""}
            onChange={update("institutionContactEmail")}
            placeholder="contact@institution.com"
            type="email"
          />
          <FormField
            label="Contact phone"
            value={state.institutionContactPhone || ""}
            onChange={update("institutionContactPhone")}
            placeholder="(555) 555-0100"
            type="tel"
          />
        </div>
      </div>
    </PresentationWizardShell>
  );
}

function SectionLabel({ children }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontFamily: FONTS.MONO,
        color: TOKENS.INK_60,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        fontWeight: 600,
        marginTop: 8,
      }}
    >
      {children}
    </div>
  );
}
