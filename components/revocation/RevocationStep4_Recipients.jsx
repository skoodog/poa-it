"use client";

import { useEffect } from "react";
import { Plus, Trash2, Mail, MapPin, Phone } from "lucide-react";
import { TOKENS, FONTS } from "../wizard/shared/tokens";
import { RevocationWizardShell } from "./RevocationWizardShell";
import { FormField, SelectField } from "../wizard/shared/FormFields";
import { WarningBanner } from "../wizard/shared/WarningBanner";
import { updateRevocationState } from "../../lib/wizard/revocationState";

const RECIPIENT_TYPE_OPTIONS = [
  { value: "agent", label: "Original Agent (required)" },
  { value: "successor_agent", label: "Successor Agent" },
  { value: "institution", label: "Bank / Brokerage / Institution" },
  { value: "family_contact", label: "Family Member" },
  { value: "law_firm", label: "Law Firm / Attorney" },
  { value: "other", label: "Other" },
];

const DELIVERY_METHOD_OPTIONS = [
  { value: "email", label: "Email" },
  { value: "certified_mail", label: "Certified Mail (recommended)" },
  { value: "regular_mail", label: "Regular Mail" },
  { value: "in_person", label: "In Person" },
  { value: "fax", label: "Fax" },
  { value: "other", label: "Other" },
];

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
 * Step 4 — Add notice recipients.
 *
 * Pre-fills agent and (if present) successor agent from the original POA's
 * wizard answers. User adds institutions / family / other contacts manually.
 *
 * Sprint 4c — Round 2.
 */
export function RevocationStep4_Recipients({
  state,
  setState,
  originalPoaAnswers,
  onBack,
  onContinue,
}) {
  const recipients = state.recipients || [];

  // Pre-fill agent + successor from original POA if recipients is empty
  useEffect(() => {
    if (recipients.length === 0 && originalPoaAnswers) {
      const prefilled = [];

      if (originalPoaAnswers.agentFullLegalName) {
        prefilled.push({
          id: `prefill-agent-${Date.now()}`,
          recipientType: "agent",
          recipientName: originalPoaAnswers.agentFullLegalName,
          recipientEmail: originalPoaAnswers.agentEmail || "",
          recipientPhone: originalPoaAnswers.agentPhone || "",
          recipientAddress: originalPoaAnswers.agentAddress || "",
          recipientCity: originalPoaAnswers.agentCity || "",
          recipientState: originalPoaAnswers.agentState || "TX",
          recipientZip: originalPoaAnswers.agentZip || "",
          recipientInstitutionName: "",
          deliveryMethod: "certified_mail",
          notes: "",
        });
      }

      if (originalPoaAnswers.successorAgentFullLegalName) {
        prefilled.push({
          id: `prefill-successor-${Date.now() + 1}`,
          recipientType: "successor_agent",
          recipientName: originalPoaAnswers.successorAgentFullLegalName,
          recipientEmail: originalPoaAnswers.successorAgentEmail || "",
          recipientPhone: originalPoaAnswers.successorAgentPhone || "",
          recipientAddress: originalPoaAnswers.successorAgentAddress || "",
          recipientCity: originalPoaAnswers.successorAgentCity || "",
          recipientState: originalPoaAnswers.successorAgentState || "TX",
          recipientZip: originalPoaAnswers.successorAgentZip || "",
          recipientInstitutionName: "",
          deliveryMethod: "certified_mail",
          notes: "",
        });
      }

      if (prefilled.length > 0) {
        setState(updateRevocationState(state, { recipients: prefilled }));
      }
    }
  }, [originalPoaAnswers, recipients.length]);

  function addRecipient() {
    const next = [
      ...recipients,
      {
        id: `new-${Date.now()}`,
        recipientType: "institution",
        recipientName: "",
        recipientEmail: "",
        recipientPhone: "",
        recipientInstitutionName: "",
        recipientAddress: "",
        recipientCity: "",
        recipientState: "TX",
        recipientZip: "",
        deliveryMethod: "certified_mail",
        notes: "",
      },
    ];
    setState(updateRevocationState(state, { recipients: next }));
  }

  function updateRecipient(idx, patch) {
    const next = recipients.map((r, i) => (i === idx ? { ...r, ...patch } : r));
    setState(updateRevocationState(state, { recipients: next }));
  }

  function removeRecipient(idx) {
    const next = recipients.filter((_, i) => i !== idx);
    setState(updateRevocationState(state, { recipients: next }));
  }

  const allValid = recipients.every((r) => {
    if (!r.recipientName?.trim()) return false;
    if (!r.deliveryMethod) return false;
    const hasContactMethod = r.recipientEmail || r.recipientAddress || r.recipientPhone;
    if (!hasContactMethod) return false;
    return true;
  });
  const canContinue = recipients.length > 0 && allValid;

  return (
    <RevocationWizardShell
      state={state}
      stepId="step4_recipients"
      title="Who needs to know about this revocation?"
      subtitle="Texas law requires third parties to have actual notice for revocation to be effective against them (§ 751.058). Add the agent (required), any successor agent, and any institutions or other parties relying on the original POA."
      onBack={onBack}
      onContinue={onContinue}
      canContinue={canContinue}
    >
      <WarningBanner severity="info" title="Notice tracking — what we do, what you do">
        We capture the recipient list now. After you execute the revocation,
        you'll see a notice tracker where you can mark each recipient as
        notified, acknowledged, or refused. <strong>For Sprint 4c, you send
        the notices yourself</strong> — we don't yet automate email
        delivery (that's coming in Sprint 7).
      </WarningBanner>

      <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 14 }}>
        {recipients.map((recipient, idx) => (
          <RecipientCard
            key={recipient.id}
            recipient={recipient}
            onChange={(patch) => updateRecipient(idx, patch)}
            onRemove={() => removeRecipient(idx)}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={addRecipient}
        style={{
          marginTop: 16,
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "10px 14px",
          background: TOKENS.PAPER,
          color: TOKENS.INK,
          border: `1.5px dashed ${TOKENS.LINE}`,
          borderRadius: 8,
          fontSize: 13,
          fontFamily: FONTS.SANS,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        <Plus size={14} strokeWidth={2.2} /> Add recipient
      </button>
    </RevocationWizardShell>
  );
}

function RecipientCard({ recipient, onChange, onRemove }) {
  const isAgentType =
    recipient.recipientType === "agent" || recipient.recipientType === "successor_agent";
  const isInstitution = recipient.recipientType === "institution";

  return (
    <div
      style={{
        padding: 16,
        background: TOKENS.PAPER_2,
        border: `1px solid ${TOKENS.LINE}`,
        borderRadius: 10,
        fontFamily: FONTS.SANS,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <SelectField
          label="Recipient type"
          value={recipient.recipientType}
          onChange={(v) => onChange({ recipientType: v })}
          options={RECIPIENT_TYPE_OPTIONS}
        />
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove recipient"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "8px 10px",
            background: "transparent",
            color: TOKENS.INK_60,
            border: `1px solid ${TOKENS.LINE}`,
            borderRadius: 6,
            fontSize: 12,
            fontFamily: FONTS.SANS,
            cursor: "pointer",
            alignSelf: "flex-end",
            marginBottom: 0,
          }}
        >
          <Trash2 size={12} strokeWidth={2} /> Remove
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <FormField
          label={isAgentType ? "Full legal name" : "Contact name"}
          value={recipient.recipientName}
          onChange={(v) => onChange({ recipientName: v })}
          placeholder={isAgentType ? "Full legal name" : "Recipient's name"}
          required
        />

        {isInstitution && (
          <FormField
            label="Institution name"
            value={recipient.recipientInstitutionName}
            onChange={(v) => onChange({ recipientInstitutionName: v })}
            placeholder="e.g., Bank of America"
          />
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <FormField
            label="Email"
            value={recipient.recipientEmail}
            onChange={(v) => onChange({ recipientEmail: v })}
            placeholder="recipient@example.com"
            type="email"
          />
          <FormField
            label="Phone"
            value={recipient.recipientPhone}
            onChange={(v) => onChange({ recipientPhone: v })}
            placeholder="(555) 555-0142"
            type="tel"
          />
        </div>

        <FormField
          label="Street address"
          value={recipient.recipientAddress}
          onChange={(v) => onChange({ recipientAddress: v })}
          placeholder="Mailing address (recommended for certified mail)"
        />

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 12 }}>
          <FormField
            label="City"
            value={recipient.recipientCity}
            onChange={(v) => onChange({ recipientCity: v })}
            placeholder="Houston"
          />
          <SelectField
            label="State"
            value={recipient.recipientState || "TX"}
            onChange={(v) => onChange({ recipientState: v })}
            options={US_STATES}
          />
          <FormField
            label="ZIP"
            value={recipient.recipientZip}
            onChange={(v) => onChange({ recipientZip: v.replace(/\D/g, "").slice(0, 5) })}
            placeholder="77001"
            maxLength={5}
          />
        </div>

        <SelectField
          label="Delivery method"
          value={recipient.deliveryMethod}
          onChange={(v) => onChange({ deliveryMethod: v })}
          options={DELIVERY_METHOD_OPTIONS}
          required
        />
      </div>
    </div>
  );
}
