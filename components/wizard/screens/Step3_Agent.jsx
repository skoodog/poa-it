"use client";

import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { TOKENS, FONTS } from "../shared/tokens";
import { WizardShell } from "../WizardShell";
import { FormField, SelectField } from "../shared/FormFields";
import { WarningBanner } from "../shared/WarningBanner";
import { updateState, markStepComplete } from "../../../lib/wizard/state";
import { audit } from "../../../lib/audit/logger";

/**
 * Step 3 — Your Agent
 * Phase 3 § 3.4
 *
 * Collects information about the agent (attorney-in-fact). The relationship
 * dropdown drives the self-dealing flag: if the agent is not the principal's
 * spouse, parent, or descendant, Step 5 will surface a § 751.031(c) reminder
 * when any hot power is granted.
 *
 * Optional successor agent — strongly recommended but not required.
 * If the user skips, we record `alternateAgentSkipped = true` so the validator
 * can surface the warning per `rule_alternate_agent_skip_warning`.
 */

const CLOSE_FAMILY_RELATIONSHIPS = ["spouse", "parent", "adult_child", "grandparent", "grandchild"];

const RELATIONSHIP_OPTIONS = [
  { value: "spouse", label: "Spouse" },
  { value: "parent", label: "Parent" },
  { value: "adult_child", label: "Adult child" },
  { value: "grandparent", label: "Grandparent" },
  { value: "grandchild", label: "Grandchild" },
  { value: "sibling", label: "Sibling" },
  { value: "aunt_uncle", label: "Aunt or uncle" },
  { value: "niece_nephew", label: "Niece or nephew" },
  { value: "other_relative", label: "Other relative" },
  { value: "friend", label: "Friend" },
  { value: "professional_fiduciary", label: "Professional fiduciary" },
  { value: "attorney", label: "Attorney" },
  { value: "other", label: "Other (please specify)" },
];

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FL", "GA", "HI",
  "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN",
  "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH",
  "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA",
  "WV", "WI", "WY",
];

export function Step3_Agent({ state, setState, onBack, onContinue }) {
  useEffect(() => {
    audit.stepEntered(state.sessionId, "step3_agent");
  }, [state.sessionId]);

  const [touched, setTouched] = useState({});
  const [showSuccessor, setShowSuccessor] = useState(
    !!state.successorAgentFullLegalName
  );

  function updateField(field, value) {
    setState(updateState(state, { [field]: value }));
  }

  function handleBlur(field) {
    setTouched((prev) => ({ ...prev, [field]: true }));
    audit.fieldChanged(state.sessionId, field, !!state[field]);
  }

  function toggleSuccessor() {
    if (showSuccessor) {
      // User collapsing — clear successor fields and mark as intentionally skipped
      setState(
        updateState(state, {
          successorAgentFullLegalName: "",
          successorAgentAddress: "",
          successorAgentPhone: "",
          successorAgentEmail: "",
          alternateAgentSkipped: true,
        })
      );
      setShowSuccessor(false);
      audit.fieldChanged(state.sessionId, "alternateAgentSkipped", true);
    } else {
      setShowSuccessor(true);
      setState(updateState(state, { alternateAgentSkipped: false }));
    }
  }

  // Self-dealing prediction — if agent isn't close family, set the flag so
  // Step 5 surfaces the § 751.031(c) reminder if hot powers get granted.
  const agentIsCloseFamily = CLOSE_FAMILY_RELATIONSHIPS.includes(state.agentRelationship);
  const showSelfDealingInfo = state.agentRelationship && !agentIsCloseFamily;

  // Validation
  const errors = computeErrors(state, showSuccessor);
  const allRequired =
    state.agentFullLegalName &&
    state.agentRelationship &&
    (state.agentRelationship !== "other" || state.agentRelationshipOther) &&
    state.agentAddress &&
    state.agentCity &&
    state.agentState &&
    state.agentZip &&
    state.agentPhone &&
    state.agentEmail;

  const successorRequired = showSuccessor
    ? state.successorAgentFullLegalName &&
      state.successorAgentAddress &&
      state.successorAgentPhone &&
      state.successorAgentEmail
    : true;

  const allValid = Object.values(errors).every((e) => !e);
  const canContinue = allRequired && successorRequired && allValid;

  function handleContinue() {
    if (!canContinue) return;
    audit.stepCompleted(state.sessionId, "step3_agent", {
      agentRelationship: state.agentRelationship,
      agentIsCloseFamily,
      successorAgentNamed: !!state.successorAgentFullLegalName,
      alternateAgentSkipped: !showSuccessor,
    });
    const next = markStepComplete(state, "step3_agent", "step4_powers");
    setState(next);
    onContinue();
  }

  return (
    <WizardShell
      stepId="step3_agent"
      stepNumber="Step 4 of 9 · Your Agent"
      title="Who will act on your behalf?"
      subtitle="Your 'agent' is the person you trust to make financial decisions for you. Most people choose a spouse, an adult child, or a close friend."
      onBack={onBack}
      onContinue={handleContinue}
      canContinue={canContinue}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 18, fontFamily: FONTS.SANS }}>
        {/* Primary agent section */}
        <SectionHeader title="Your primary agent" />

        <FormField
          label="Full legal name"
          value={state.agentFullLegalName}
          onChange={(v) => updateField("agentFullLegalName", v)}
          placeholder="John A. Smith"
          required
          tooltip="The exact name as it appears on your agent's driver's license or passport. Banks will verify this."
          autoComplete="name"
          error={touched.agentFullLegalName ? errors.agentFullLegalName : null}
        />

        <SelectField
          label="Relationship to you"
          value={state.agentRelationship}
          onChange={(v) => updateField("agentRelationship", v)}
          options={RELATIONSHIP_OPTIONS}
          placeholder="Select relationship…"
          required
          tooltip="Texas law treats some relationships specially. Spouses, parents, and descendants can be granted broader authority; agents who aren't close family have automatic statutory protections against self-dealing."
          citation="Tex. Est. Code § 751.031(c)"
          error={touched.agentRelationship ? errors.agentRelationship : null}
          onTooltipOpen={() => audit.tooltipOpened(state.sessionId, "agent_relationship")}
        />

        {state.agentRelationship === "other" && (
          <FormField
            label="Please specify"
            value={state.agentRelationshipOther}
            onChange={(v) => updateField("agentRelationshipOther", v)}
            placeholder="How is this person related to you?"
            required
          />
        )}

        {showSelfDealingInfo && (
          <WarningBanner
            severity="info"
            title="Texas protects you automatically"
            citation="Tex. Est. Code § 751.031(c)"
          >
            Because your agent isn't your spouse, parent, or descendant, Texas
            law automatically prevents them from using these powers to benefit
            themselves — even if you grant general gift-giving authority later.
            This is built-in protection. You don't need to do anything.
          </WarningBanner>
        )}

        <FormField
          label="Street address"
          value={state.agentAddress}
          onChange={(v) => updateField("agentAddress", v)}
          placeholder="456 Oak Ave"
          required
          autoComplete="street-address"
          error={touched.agentAddress ? errors.agentAddress : null}
        />

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 12 }}>
          <FormField
            label="City"
            value={state.agentCity}
            onChange={(v) => updateField("agentCity", v)}
            placeholder="Houston"
            required
            error={touched.agentCity ? errors.agentCity : null}
          />
          <SelectField
            label="State"
            value={state.agentState}
            onChange={(v) => updateField("agentState", v)}
            options={US_STATES}
            placeholder="State"
            required
          />
          <FormField
            label="ZIP"
            value={state.agentZip}
            onChange={(v) => updateField("agentZip", v.replace(/\D/g, "").slice(0, 5))}
            placeholder="77001"
            required
            maxLength={5}
            autoComplete="postal-code"
            error={touched.agentZip ? errors.agentZip : null}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <FormField
            label="Phone"
            value={state.agentPhone}
            onChange={(v) => updateField("agentPhone", v)}
            placeholder="(713) 555-0142"
            required
            type="tel"
            autoComplete="tel"
            error={touched.agentPhone ? errors.agentPhone : null}
          />
          <FormField
            label="Email"
            value={state.agentEmail}
            onChange={(v) => updateField("agentEmail", v)}
            placeholder="agent@example.com"
            required
            type="email"
            autoComplete="email"
            tooltip="We'll email your agent a copy of the document and simple instructions for how to use it. They don't need a POA-IT account."
            error={touched.agentEmail ? errors.agentEmail : null}
          />
        </div>

        {/* Successor agent section */}
        <div style={{ marginTop: 12 }}>
          {!showSuccessor ? (
            <div
              style={{
                background: TOKENS.PAPER_2,
                border: `1px dashed ${TOKENS.LINE_2}`,
                borderRadius: 10,
                padding: "18px 20px",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: TOKENS.INK, marginBottom: 4 }}>
                    Add a backup agent (strongly recommended)
                  </div>
                  <div style={{ fontSize: 13, color: TOKENS.INK_60, lineHeight: 1.5 }}>
                    If your primary agent isn't available when needed — illness,
                    travel, has passed away — your alternate steps in. Without one,
                    your family may need to go through guardianship court.
                  </div>
                </div>
                <button
                  onClick={toggleSuccessor}
                  style={{
                    padding: "10px 16px",
                    fontSize: 13,
                    fontWeight: 600,
                    background: TOKENS.INK,
                    color: TOKENS.PAPER,
                    border: "none",
                    borderRadius: 7,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    flexShrink: 0,
                  }}
                >
                  <Plus size={13} strokeWidth={2.4} /> Add backup
                </button>
              </div>
            </div>
          ) : (
            <div
              style={{
                background: TOKENS.PAPER_2,
                border: `1px solid ${TOKENS.LINE}`,
                borderRadius: 10,
                padding: "20px 22px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <SectionHeader title="Your backup agent" inline />
                <button
                  onClick={toggleSuccessor}
                  style={{
                    fontSize: 12,
                    color: TOKENS.INK_60,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <X size={12} strokeWidth={2} /> Remove
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <FormField
                  label="Full legal name"
                  value={state.successorAgentFullLegalName}
                  onChange={(v) => updateField("successorAgentFullLegalName", v)}
                  placeholder="Backup agent's full legal name"
                  required
                  error={touched.successorAgentFullLegalName ? errors.successorAgentFullLegalName : null}
                />
                <FormField
                  label="Street address (city, state, ZIP)"
                  value={state.successorAgentAddress}
                  onChange={(v) => updateField("successorAgentAddress", v)}
                  placeholder="789 Pine St, Dallas, TX 75201"
                  required
                  error={touched.successorAgentAddress ? errors.successorAgentAddress : null}
                />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <FormField
                    label="Phone"
                    value={state.successorAgentPhone}
                    onChange={(v) => updateField("successorAgentPhone", v)}
                    placeholder="(214) 555-0142"
                    required
                    type="tel"
                    error={touched.successorAgentPhone ? errors.successorAgentPhone : null}
                  />
                  <FormField
                    label="Email"
                    value={state.successorAgentEmail}
                    onChange={(v) => updateField("successorAgentEmail", v)}
                    placeholder="backup@example.com"
                    required
                    type="email"
                    error={touched.successorAgentEmail ? errors.successorAgentEmail : null}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </WizardShell>
  );
}

function SectionHeader({ title, inline = false }) {
  return (
    <div
      style={{
        fontSize: 12,
        fontFamily: FONTS.MONO,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: TOKENS.INK_40,
        fontWeight: 600,
        marginBottom: inline ? 0 : 4,
        marginTop: inline ? 0 : 8,
      }}
    >
      {title}
    </div>
  );
}

function computeErrors(state, showSuccessor) {
  const errors = {};

  // Primary agent name
  if (state.agentFullLegalName) {
    const words = state.agentFullLegalName.trim().split(/\s+/);
    if (words.length < 2) {
      errors.agentFullLegalName = "Please enter the agent's full legal name.";
    }
  }

  // Agent cannot equal principal
  if (
    state.agentFullLegalName &&
    state.principalFullLegalName &&
    state.agentFullLegalName.trim().toLowerCase() === state.principalFullLegalName.trim().toLowerCase()
  ) {
    errors.agentFullLegalName =
      "Your agent cannot be yourself — the whole point is to let someone else act for you.";
  }

  // Address
  if (state.agentAddress && state.agentAddress.trim().length < 5) {
    errors.agentAddress = "Please enter a full street address.";
  }

  // City
  if (state.agentCity && state.agentCity.trim().length < 2) {
    errors.agentCity = "Please enter a valid city.";
  }

  // ZIP — 5 digits, any state
  if (state.agentZip && !/^\d{5}$/.test(state.agentZip)) {
    errors.agentZip = "5-digit ZIP required.";
  }

  // Phone
  if (state.agentPhone) {
    const digits = state.agentPhone.replace(/\D/g, "");
    if (digits.length !== 10) errors.agentPhone = "10-digit US phone required.";
  }

  // Email
  if (state.agentEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.agentEmail)) {
    errors.agentEmail = "That doesn't look like a valid email address.";
  }

  // Successor agent (if shown)
  if (showSuccessor) {
    if (state.successorAgentFullLegalName) {
      const words = state.successorAgentFullLegalName.trim().split(/\s+/);
      if (words.length < 2) {
        errors.successorAgentFullLegalName = "Please enter the backup agent's full legal name.";
      }
      // Cannot equal primary agent
      if (
        state.agentFullLegalName &&
        state.successorAgentFullLegalName.trim().toLowerCase() ===
          state.agentFullLegalName.trim().toLowerCase()
      ) {
        errors.successorAgentFullLegalName =
          "Your backup agent must be a different person than your primary agent.";
      }
    }
    if (state.successorAgentPhone) {
      const digits = state.successorAgentPhone.replace(/\D/g, "");
      if (digits.length !== 10) errors.successorAgentPhone = "10-digit US phone required.";
    }
    if (
      state.successorAgentEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.successorAgentEmail)
    ) {
      errors.successorAgentEmail = "That doesn't look like a valid email address.";
    }
  }

  return errors;
}
