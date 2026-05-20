"use client";

import { useEffect } from "react";
import { FileText, Heart, AlertCircle } from "lucide-react";
import { TOKENS, FONTS } from "../shared/tokens";
import { WizardShell } from "../WizardShell";
import { StatutoryTooltip } from "../shared/StatutoryTooltip";
import { AcknowledgmentCheckbox } from "../shared/AcknowledgmentCheckbox";
import { Disclaimer } from "../shared/Disclaimer";
import { updateState, markStepComplete } from "../../../lib/wizard/state";
import { audit } from "../../../lib/audit/logger";

/**
 * Step 1 — Document Type
 * Phase 3 § 3.2
 *
 * Confirms what the user is creating; pre-frames the ministerial-only nature
 * of POA-IT. The ministerial acknowledgment recorded here is the first of
 * several across the wizard that build the evidentiary defense file.
 */
export function Step1_DocumentType({ state, setState, onBack, onContinue }) {
  useEffect(() => {
    audit.stepEntered(state.sessionId, "step1_document_type");
  }, [state.sessionId]);

  const acknowledged = state.documentTypeAcknowledged;

  function handleAcknowledge(checked) {
    const updated = updateState(state, { documentTypeAcknowledged: checked });
    setState(updated);
  }

  function handleContinue() {
    if (!acknowledged) return;
    audit.stepCompleted(state.sessionId, "step1_document_type", {
      documentTypeAcknowledged: true,
    });
    const next = markStepComplete(state, "step1_document_type", "step2_principal");
    setState(next);
    onContinue();
  }

  return (
    <WizardShell
      stepId="step1_document_type"
      stepNumber="Step 2 of 9 · Document"
      title="Let's create your Texas Power of Attorney."
      subtitle="Take a quick moment to confirm what you're creating before we get into the details."
      onBack={onBack}
      onContinue={handleContinue}
      canContinue={acknowledged}
    >
      {/* Document card */}
      <div
        style={{
          background: TOKENS.PAPER_2,
          border: `1px solid ${TOKENS.LINE}`,
          borderRadius: 12,
          padding: "24px 26px",
          marginBottom: 28,
          fontFamily: FONTS.SANS,
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
          <div
            style={{
              flexShrink: 0,
              width: 40,
              height: 40,
              borderRadius: 10,
              background: TOKENS.INK,
              color: TOKENS.PAPER,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginTop: 2,
            }}
          >
            <FileText size={20} strokeWidth={1.8} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: TOKENS.INK_40, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>
              You're creating
            </div>
            <h2
              style={{
                fontSize: 22,
                fontWeight: 600,
                letterSpacing: "-0.015em",
                lineHeight: 1.25,
                margin: "0 0 10px",
                color: TOKENS.INK,
              }}
            >
              Texas Statutory Durable Financial Power of Attorney
              <StatutoryTooltip
                plainEnglish="The 'statutory form' is the exact format prescribed by Texas law. Using the statutory form gives your document automatic legal recognition by Texas banks, title companies, hospitals, and courts."
                citation="Tex. Est. Code § 752.051"
                onOpen={() => audit.tooltipOpened(state.sessionId, "statutory_form")}
              />
            </h2>
            <p style={{ fontSize: 14, color: TOKENS.INK_60, lineHeight: 1.55, margin: 0 }}>
              The legal document that lets a person you trust make financial decisions on your behalf — pay bills, manage accounts, sign on your behalf — if you can't be there yourself.
            </p>
          </div>
        </div>
      </div>

      {/* What it is / isn't / why durable */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 28 }}>
        <InfoCard
          icon={Heart}
          title="What this covers"
          body="Pay bills, manage bank accounts, file taxes, sign real-estate documents, deal with retirement accounts."
        />
        <InfoCard
          icon={AlertCircle}
          title="What it doesn't"
          body={
            <>
              Medical decisions. For that, you need a separate{" "}
              <span style={{ whiteSpace: "nowrap" }}>Medical Power of Attorney</span> — coming soon.
            </>
          }
        />
        <InfoCard
          icon={FileText}
          title='Why "durable"'
          body={
            <>
              Stays effective even if you later become unable to make decisions yourself.{" "}
              <StatutoryTooltip
                plainEnglish="A 'durable' power of attorney stays effective even if you become unable to make decisions for yourself later. A non-durable POA ends the moment you become incapacitated. Texas law lets you choose either; durable is what almost everyone wants."
                citation="Tex. Est. Code § 751.0021"
                onOpen={() => audit.tooltipOpened(state.sessionId, "durable_definition")}
              />
            </>
          }
        />
      </div>

      {/* Disclaimer */}
      <div style={{ marginBottom: 20 }}>
        <Disclaimer variant="step1" />
      </div>

      {/* Acknowledgment */}
      <AcknowledgmentCheckbox
        ruleId="step1_ministerial_acknowledgment"
        text="I understand. Let's continue."
        checked={acknowledged}
        onChange={handleAcknowledge}
        sessionId={state.sessionId}
      />
    </WizardShell>
  );
}

function InfoCard({ icon: Icon, title, body }) {
  return (
    <div
      style={{
        background: TOKENS.PAPER,
        border: `1px solid ${TOKENS.LINE}`,
        borderRadius: 10,
        padding: "16px 16px",
        fontFamily: FONTS.SANS,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <Icon size={14} strokeWidth={1.8} color={TOKENS.INK_60} />
        <div style={{ fontSize: 12, fontWeight: 600, color: TOKENS.INK, letterSpacing: "-0.005em" }}>
          {title}
        </div>
      </div>
      <div style={{ fontSize: 13, color: TOKENS.INK_60, lineHeight: 1.5 }}>{body}</div>
    </div>
  );
}
