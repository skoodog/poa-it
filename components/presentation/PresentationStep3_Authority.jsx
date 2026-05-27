"use client";

import { useState } from "react";
import { Check, Plus, X } from "lucide-react";
import { TOKENS, FONTS } from "../wizard/shared/tokens";
import { PresentationWizardShell } from "./PresentationWizardShell";
import { updatePresentationState } from "../../lib/wizard/presentationState";

const POWER_LABELS = {
  real_property: "Real property transactions",
  tangible_personal_property: "Tangible personal property transactions",
  stocks_and_bonds: "Stock and bond transactions",
  commodity_and_option: "Commodity and option transactions",
  banking_and_financial: "Banking and financial institution transactions",
  business_operating: "Business operating transactions",
  insurance_and_annuity: "Insurance and annuity transactions",
  estate_trust_beneficiary: "Estate, trust, and other beneficiary transactions",
  claims_and_litigation: "Claims and litigation",
  personal_family_maintenance: "Personal and family maintenance",
  government_benefits: "Government benefits (Social Security, Medicare, Medicaid, etc.)",
  retirement_plan: "Retirement plan transactions",
  tax_matters: "Tax matters",
  digital_assets: "Digital assets and electronic communications",
};

const POWER_LETTERS = {
  real_property: "A",
  tangible_personal_property: "B",
  stocks_and_bonds: "C",
  commodity_and_option: "D",
  banking_and_financial: "E",
  business_operating: "F",
  insurance_and_annuity: "G",
  estate_trust_beneficiary: "H",
  claims_and_litigation: "I",
  personal_family_maintenance: "J",
  government_benefits: "K",
  retirement_plan: "L",
  tax_matters: "M",
  digital_assets: "N",
};

/**
 * Step 3 — Confirm or adjust the authority subset surfaced in the packet.
 *
 * Pre-populated from the chosen profile's recommendations (intersected with
 * the principal's actual grant). User can add or remove powers, or skip them
 * entirely if the packet should rely on the executed POA itself.
 *
 * Sprint 4d — Round 2.
 */
export function PresentationStep3_Authority({ state, setState, onBack, onContinue }) {
  const selected = new Set(state.selectedPowers || []);

  // Available powers = whatever the original POA granted (and not "all_powers"
  // as a literal — we expand it to the full list)
  const grantedRaw = state.originalPoaPowersGranted || [];
  const granted = grantedRaw.includes("all_powers")
    ? Object.keys(POWER_LABELS)
    : grantedRaw.filter((p) => p !== "all_powers");

  function togglePower(powerKey) {
    const next = new Set(selected);
    if (next.has(powerKey)) {
      next.delete(powerKey);
    } else {
      next.add(powerKey);
    }
    setState(
      updatePresentationState(state, {
        selectedPowers: Array.from(next),
      })
    );
  }

  const subtitleText =
    granted.length === 0
      ? "The underlying Power of Attorney didn't grant any specific powers. The packet will reference the executed POA itself."
      : `Pick the powers that are relevant to this institution. Pre-selected based on your profile choice. The packet will highlight these specifically.`;

  return (
    <PresentationWizardShell
      state={state}
      stepId="step3_authority"
      title="Which authority should the packet highlight?"
      subtitle={subtitleText}
      onBack={onBack}
      onContinue={onContinue}
      canContinue={true}
    >
      {granted.length === 0 ? (
        <EmptyState />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {granted.map((powerKey) => (
            <PowerToggle
              key={powerKey}
              powerKey={powerKey}
              checked={selected.has(powerKey)}
              onToggle={() => togglePower(powerKey)}
            />
          ))}
        </div>
      )}

      <CustomNotesSection state={state} setState={setState} />
    </PresentationWizardShell>
  );
}

function PowerToggle({ powerKey, checked, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 14px",
        background: checked ? TOKENS.PAPER_2 : TOKENS.PAPER,
        border: `1.5px solid ${checked ? TOKENS.INK : TOKENS.LINE}`,
        borderRadius: 8,
        cursor: "pointer",
        textAlign: "left",
        fontFamily: FONTS.SANS,
      }}
    >
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: 4,
          border: `2px solid ${checked ? TOKENS.INK : TOKENS.INK_40}`,
          background: checked ? TOKENS.INK : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {checked && <Check size={13} strokeWidth={3} color={TOKENS.PAPER} />}
      </div>
      <div
        style={{
          fontSize: 11,
          fontFamily: FONTS.MONO,
          fontWeight: 700,
          color: TOKENS.INK_40,
          width: 18,
          letterSpacing: 0.5,
        }}
      >
        ({POWER_LETTERS[powerKey]})
      </div>
      <div style={{ flex: 1, fontSize: 14, color: TOKENS.INK }}>
        {POWER_LABELS[powerKey] || powerKey}
      </div>
    </button>
  );
}

function EmptyState() {
  return (
    <div
      style={{
        padding: 20,
        background: TOKENS.PAPER_2,
        border: `1px solid ${TOKENS.LINE}`,
        borderRadius: 8,
        fontSize: 13,
        color: TOKENS.INK_60,
        lineHeight: 1.55,
      }}
    >
      The packet will still include the cover sheet, agent certification, audit
      packet, and response tracker. The executed Power of Attorney remains the
      operative grant of authority.
    </div>
  );
}

function CustomNotesSection({ state, setState }) {
  const [draft, setDraft] = useState("");
  const notes = Array.isArray(state.customNotes) ? state.customNotes : [];

  function addNote() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    setState(
      updatePresentationState(state, {
        customNotes: [
          ...notes,
          { id: `custom-${Date.now()}`, text: trimmed, source: "user" },
        ],
      })
    );
    setDraft("");
  }

  function removeNote(id) {
    setState(
      updatePresentationState(state, {
        customNotes: notes.filter((n) => n.id !== id),
      })
    );
  }

  return (
    <div style={{ marginTop: 32 }}>
      <div
        style={{
          fontSize: 11,
          fontFamily: FONTS.MONO,
          color: TOKENS.INK_60,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          fontWeight: 600,
          marginBottom: 12,
        }}
      >
        Institution-specific notes (optional)
      </div>

      {notes.length > 0 && (
        <div
          style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}
        >
          {notes.map((note) => (
            <div
              key={note.id}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                padding: "10px 12px",
                background: TOKENS.PAPER_2,
                border: `1px solid ${TOKENS.LINE}`,
                borderRadius: 6,
              }}
            >
              <div style={{ flex: 1, fontSize: 13, color: TOKENS.INK, lineHeight: 1.5 }}>
                {note.text}
              </div>
              {note.source === "user" && (
                <button
                  type="button"
                  onClick={() => removeNote(note.id)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: TOKENS.INK_40,
                    cursor: "pointer",
                    padding: 2,
                  }}
                  aria-label="Remove note"
                >
                  <X size={14} strokeWidth={2.2} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="e.g., 'Account #XXXX-1234 — wife and I are joint owners'"
          rows={2}
          style={{
            flex: 1,
            fontFamily: FONTS.SANS,
            fontSize: 13,
            padding: "10px 12px",
            border: `1px solid ${TOKENS.LINE}`,
            borderRadius: 6,
            resize: "vertical",
            color: TOKENS.INK,
            background: TOKENS.PAPER,
            outline: "none",
          }}
        />
        <button
          type="button"
          onClick={addNote}
          disabled={!draft.trim()}
          style={{
            padding: "10px 14px",
            background: draft.trim() ? TOKENS.INK : TOKENS.INK_20,
            color: TOKENS.PAPER,
            border: "none",
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 600,
            cursor: draft.trim() ? "pointer" : "not-allowed",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            alignSelf: "flex-start",
          }}
        >
          <Plus size={14} strokeWidth={2.5} /> Add
        </button>
      </div>
    </div>
  );
}
