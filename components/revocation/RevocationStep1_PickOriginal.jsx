"use client";

import { useEffect } from "react";
import { FileText, Check } from "lucide-react";
import { TOKENS, FONTS } from "../wizard/shared/tokens";
import { RevocationWizardShell } from "./RevocationWizardShell";
import { DocumentStatusBadge } from "../workspace/DocumentStatusBadge";
import { updateRevocationState } from "../../lib/wizard/revocationState";

/**
 * Step 1 — Pick the original POA to revoke.
 *
 * If the wizard was launched from a specific document (via a "Revoke" button
 * on a document row), that POA is preselected and the user just confirms.
 * Otherwise, they pick from the list of active POAs for this client.
 *
 * Sprint 4c — Round 2.
 */
export function RevocationStep1_PickOriginal({
  state,
  setState,
  activeDocuments,
  onBack,
  onContinue,
}) {
  const selectedDocId = state.originalPoaId;

  // Auto-select if exactly one active document exists and nothing is yet picked
  useEffect(() => {
    if (!selectedDocId && activeDocuments.length === 1) {
      const doc = activeDocuments[0];
      setState(
        updateRevocationState(state, {
          originalPoaId: doc.id,
          originalPoaDateSnapshot: doc.createdAt,
          originalPoaDocumentIdSnapshot: doc.id,
        })
      );
    }
  }, [activeDocuments, selectedDocId]);

  function pickDocument(doc) {
    setState(
      updateRevocationState(state, {
        originalPoaId: doc.id,
        originalPoaDateSnapshot: doc.createdAt,
        originalPoaDocumentIdSnapshot: doc.id,
      })
    );
  }

  const canContinue = !!selectedDocId;

  return (
    <RevocationWizardShell
      state={state}
      stepId="step1_pick_original"
      title="Which Power of Attorney do you want to revoke?"
      subtitle="Pick the document this revocation will supersede. Only active POAs are shown."
      onBack={onBack}
      onContinue={onContinue}
      canContinue={canContinue}
    >
      {activeDocuments.length === 0 ? (
        <div
          style={{
            padding: 24,
            background: TOKENS.PAPER_2,
            border: `1px dashed ${TOKENS.LINE}`,
            borderRadius: 10,
            textAlign: "center",
          }}
        >
          <FileText
            size={20}
            strokeWidth={1.6}
            color={TOKENS.INK_40}
            style={{ marginBottom: 8 }}
          />
          <div style={{ fontSize: 13, color: TOKENS.INK_60, lineHeight: 1.5 }}>
            This client has no active Powers of Attorney to revoke. Revocation
            requires at least one POA in an active state (generated, signed,
            notarized, or delivered).
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {activeDocuments.map((doc) => (
            <DocumentChoiceCard
              key={doc.id}
              doc={doc}
              selected={doc.id === selectedDocId}
              onClick={() => pickDocument(doc)}
            />
          ))}
        </div>
      )}
    </RevocationWizardShell>
  );
}

function DocumentChoiceCard({ doc, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "14px 16px",
        background: selected ? TOKENS.PAPER_2 : TOKENS.PAPER,
        border: `1.5px solid ${selected ? TOKENS.INK : TOKENS.LINE}`,
        borderRadius: 10,
        cursor: "pointer",
        textAlign: "left",
        fontFamily: FONTS.SANS,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          background: selected ? TOKENS.INK : TOKENS.PAPER_2,
          border: selected ? "none" : `1px solid ${TOKENS.LINE}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: selected ? TOKENS.PAPER : TOKENS.INK,
          flexShrink: 0,
        }}
      >
        <FileText size={16} strokeWidth={1.8} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: TOKENS.INK,
            marginBottom: 4,
          }}
        >
          {doc.documentType?.replace(/_/g, " ") || "Power of Attorney"}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ fontSize: 11.5, color: TOKENS.INK_60, fontFamily: FONTS.MONO }}>
            Created {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : "—"}
          </div>
          <DocumentStatusBadge status={doc.status} size="small" />
        </div>
      </div>
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: 10,
          border: `2px solid ${selected ? TOKENS.INK : TOKENS.INK_40}`,
          background: selected ? TOKENS.INK : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {selected && <Check size={11} strokeWidth={3} color={TOKENS.PAPER} />}
      </div>
    </button>
  );
}
