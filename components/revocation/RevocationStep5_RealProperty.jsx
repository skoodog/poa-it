"use client";

import { Plus, Trash2, MapPin } from "lucide-react";
import { TOKENS, FONTS } from "../wizard/shared/tokens";
import { RevocationWizardShell } from "./RevocationWizardShell";
import { FormField } from "../wizard/shared/FormFields";
import { WarningBanner } from "../wizard/shared/WarningBanner";
import { updateRevocationState } from "../../lib/wizard/revocationState";

/**
 * Step 5 — Real property recording (conditional).
 *
 * Only shown when the original POA granted real-property authority. Captures
 * the counties where the user intends to record the revocation, so the
 * post-execution checklist surfaces them. Sprint 4c only TRACKS the intent;
 * Sprint 7.6 will integrate proactive prompts based on the original POA's
 * actual recording history.
 *
 * Sprint 4c — Round 2.
 */
export function RevocationStep5_RealProperty({ state, setState, onBack, onContinue }) {
  const recordings = state.realPropertyRecordings || [];

  function addRecording() {
    const next = [
      ...recordings,
      {
        id: `new-${Date.now()}`,
        countyName: "",
        state: "Texas",
        notes: "",
      },
    ];
    setState(updateRevocationState(state, { realPropertyRecordings: next }));
  }

  function updateRecording(idx, patch) {
    const next = recordings.map((r, i) => (i === idx ? { ...r, ...patch } : r));
    setState(updateRevocationState(state, { realPropertyRecordings: next }));
  }

  function removeRecording(idx) {
    const next = recordings.filter((_, i) => i !== idx);
    setState(updateRevocationState(state, { realPropertyRecordings: next }));
  }

  const allValid = recordings.every((r) => r.countyName?.trim().length > 0);
  // Recording is OPTIONAL — user can skip it. The validator just requires
  // any entries to be well-formed.
  const canContinue = allValid;

  return (
    <RevocationWizardShell
      state={state}
      stepId="step5_real_property"
      title="Real property recording (optional)"
      subtitle="If the original POA was recorded with a county clerk for a real-property transaction, Texas law requires the revocation to be recorded in the same county. You can skip this step if no recording is needed."
      onBack={onBack}
      onContinue={onContinue}
      canContinue={canContinue}
    >
      <WarningBanner
        severity="info"
        title="When recording matters"
        citation="Tex. Est. Code § 751.151"
      >
        If the original POA was used to sign a deed, deed of trust, release,
        lien, or other recordable real-property instrument, the original POA
        was likely recorded in the county where the property is located. The
        revocation should be recorded in the same county or counties.
        Recording must occur within <strong>30 days</strong> of the
        instrument being recorded. If no recording was made (e.g., the POA
        was only used at a bank), you can skip this step.
      </WarningBanner>

      <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 12 }}>
        {recordings.map((recording, idx) => (
          <RecordingCard
            key={recording.id}
            recording={recording}
            onChange={(patch) => updateRecording(idx, patch)}
            onRemove={() => removeRecording(idx)}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={addRecording}
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
        <Plus size={14} strokeWidth={2.2} /> Add county to record in
      </button>

      {recordings.length === 0 && (
        <div
          style={{
            marginTop: 20,
            padding: 14,
            background: TOKENS.PAPER_2,
            borderLeft: `3px solid ${TOKENS.INK_40}`,
            borderRadius: 6,
            fontSize: 13,
            color: TOKENS.INK_60,
            lineHeight: 1.55,
            fontFamily: FONTS.SANS,
          }}
        >
          You haven't added any counties. If the original POA was never used
          for a recorded real-property transaction, that's the correct
          choice — continue without adding any.
        </div>
      )}
    </RevocationWizardShell>
  );
}

function RecordingCard({ recording, onChange, onRemove }) {
  return (
    <div
      style={{
        padding: 14,
        background: TOKENS.PAPER_2,
        border: `1px solid ${TOKENS.LINE}`,
        borderRadius: 10,
        fontFamily: FONTS.SANS,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <MapPin size={14} strokeWidth={1.8} color={TOKENS.INK_60} />
        <div
          style={{
            fontSize: 12,
            fontFamily: FONTS.MONO,
            color: TOKENS.INK_40,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            fontWeight: 600,
          }}
        >
          County recording
        </div>
        <div style={{ flex: 1 }} />
        <button
          type="button"
          onClick={onRemove}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "6px 10px",
            background: "transparent",
            color: TOKENS.INK_60,
            border: `1px solid ${TOKENS.LINE}`,
            borderRadius: 6,
            fontSize: 11.5,
            fontFamily: FONTS.SANS,
            cursor: "pointer",
          }}
        >
          <Trash2 size={11} strokeWidth={2} /> Remove
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
          <FormField
            label="County name"
            value={recording.countyName}
            onChange={(v) => onChange({ countyName: v })}
            placeholder="e.g., Harris"
            required
          />
          <FormField
            label="State"
            value={recording.state || "Texas"}
            onChange={(v) => onChange({ state: v })}
            placeholder="Texas"
          />
        </div>
        <FormField
          label="Notes (optional)"
          value={recording.notes || ""}
          onChange={(v) => onChange({ notes: v })}
          placeholder="Property address, original recording date, anything that helps you find it later"
        />
      </div>
    </div>
  );
}
