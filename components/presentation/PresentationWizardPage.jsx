"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { CheckCircle2, ArrowLeft, ExternalLink } from "lucide-react";
import { TOKENS, FONTS } from "../wizard/shared/tokens";
import { PresentationStep1_Profile } from "./PresentationStep1_Profile";
import { PresentationStep2_Institution } from "./PresentationStep2_Institution";
import { PresentationStep3_Authority } from "./PresentationStep3_Authority";
import { PresentationStep4_Review } from "./PresentationStep4_Review";
import {
  createInitialPresentationState,
  getNextPresentationStep,
  getPreviousPresentationStep,
  markPresentationStepComplete,
  validatePresentationStep,
} from "../../lib/wizard/presentationState";

/**
 * Top-level orchestrator for the presentation wizard. Owns:
 *   - the wizard state object
 *   - step routing
 *   - debounced autosave to /api/presentations/[id]/update
 *   - post-finalize confirmation screen
 *
 * Sprint 4d Round 2.
 */
export function PresentationWizardPage({
  initialPresentation,
  profiles,
  clientId,
  poaSnapshot,
}) {
  const [state, setState] = useState(() => {
    const base = createInitialPresentationState({ clientId });
    return {
      ...base,
      ...poaSnapshot,
      ...(initialPresentation?.wizardState || {}),
      institutionProfileId: initialPresentation?.institutionProfileId || null,
      institutionName:
        initialPresentation?.institutionName?.startsWith("Draft Presentation")
          ? ""
          : initialPresentation?.institutionName || "",
      institutionAddress: initialPresentation?.institutionAddress || "",
      institutionCity: initialPresentation?.institutionCity || "",
      institutionState: initialPresentation?.institutionState || "TX",
      institutionZip: initialPresentation?.institutionZip || "",
      institutionContactName: initialPresentation?.institutionContactName || "",
      institutionContactEmail: initialPresentation?.institutionContactEmail || "",
      institutionContactPhone: initialPresentation?.institutionContactPhone || "",
      selectedPowers: initialPresentation?.selectedPowers || [],
      customNotes: initialPresentation?.customNotes || [],
      currentStep: initialPresentation?.wizardState?.currentStep || "step1_profile",
      completedSteps: initialPresentation?.wizardState?.completedSteps || [],
    };
  });

  const [generated, setGenerated] = useState(null);
  const presentationId = initialPresentation?.id;

  // Debounced autosave
  const saveTimerRef = useRef(null);
  const lastSavedRef = useRef(state);

  const flushSave = useCallback(async () => {
    if (!presentationId) return;
    const snapshot = state;
    if (snapshot === lastSavedRef.current) return;
    try {
      await fetch(`/api/presentations/${presentationId}/update`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          institutionProfileId: snapshot.institutionProfileId,
          institutionName:
            snapshot.institutionName ||
            "Draft Presentation (institution TBD)",
          institutionAddress: snapshot.institutionAddress || null,
          institutionCity: snapshot.institutionCity || null,
          institutionState: snapshot.institutionState || null,
          institutionZip: snapshot.institutionZip || null,
          institutionContactName: snapshot.institutionContactName || null,
          institutionContactEmail: snapshot.institutionContactEmail || null,
          institutionContactPhone: snapshot.institutionContactPhone || null,
          selectedPowers: snapshot.selectedPowers || [],
          customNotes: snapshot.customNotes || [],
          wizardState: {
            currentStep: snapshot.currentStep,
            completedSteps: snapshot.completedSteps,
            // Persist snapshot fields too so a refreshed wizard rehydrates fully
            originalPoaPowersGranted: snapshot.originalPoaPowersGranted,
            originalPoaExecutionMethod: snapshot.originalPoaExecutionMethod,
            originalPoaStatus: snapshot.originalPoaStatus,
            originalPoaDateSnapshot: snapshot.originalPoaDateSnapshot,
            originalPoaDocumentIdSnapshot: snapshot.originalPoaDocumentIdSnapshot,
            principalNameSnapshot: snapshot.principalNameSnapshot,
            agentNameSnapshot: snapshot.agentNameSnapshot,
            successorAgentNameSnapshot: snapshot.successorAgentNameSnapshot,
            poaIsSpringingType: snapshot.poaIsSpringingType,
          },
        }),
      });
      lastSavedRef.current = snapshot;
    } catch (err) {
      console.error("Autosave failed:", err);
    }
  }, [state, presentationId]);

  useEffect(() => {
    if (!presentationId) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      flushSave();
    }, 800);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [state, flushSave, presentationId]);

  // Flush on unmount
  useEffect(() => {
    return () => {
      flushSave();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleContinue() {
    const validationError = validatePresentationStep(state, state.currentStep);
    if (validationError) {
      // Soft fail — buttons should already be disabled when invalid
      return;
    }
    const next = getNextPresentationStep(state);
    setState((s) => markPresentationStepComplete(s, s.currentStep, next));
  }

  function handleBack() {
    const prev = getPreviousPresentationStep(state);
    setState((s) => ({ ...s, currentStep: prev }));
  }

  function handleGenerated(finalizedPresentation) {
    setGenerated(finalizedPresentation);
  }

  if (generated) {
    return (
      <PostFinalizeConfirmation
        presentation={generated}
        clientId={clientId}
      />
    );
  }

  switch (state.currentStep) {
    case "step1_profile":
      return (
        <PresentationStep1_Profile
          state={state}
          setState={setState}
          profiles={profiles}
          onBack={null}
          onContinue={handleContinue}
        />
      );
    case "step2_institution":
      return (
        <PresentationStep2_Institution
          state={state}
          setState={setState}
          onBack={handleBack}
          onContinue={handleContinue}
        />
      );
    case "step3_authority":
      return (
        <PresentationStep3_Authority
          state={state}
          setState={setState}
          onBack={handleBack}
          onContinue={handleContinue}
        />
      );
    case "step4_review":
      return (
        <PresentationStep4_Review
          state={state}
          presentation={{ id: presentationId }}
          onBack={handleBack}
          onGenerated={handleGenerated}
        />
      );
    default:
      return null;
  }
}

function PostFinalizeConfirmation({ presentation, clientId }) {
  return (
    <div
      style={{
        maxWidth: 600,
        margin: "60px auto",
        padding: "40px 32px",
        textAlign: "center",
        fontFamily: FONTS.SANS,
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          background: "#D1FAE5",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 18px",
        }}
      >
        <CheckCircle2 size={28} strokeWidth={2} color="#065F46" />
      </div>
      <h1
        style={{
          fontSize: 24,
          fontWeight: 600,
          color: TOKENS.INK,
          letterSpacing: "-0.015em",
          margin: 0,
          marginBottom: 8,
        }}
      >
        Packet generated
      </h1>
      <div
        style={{
          fontSize: 14,
          color: TOKENS.INK_60,
          lineHeight: 1.55,
          maxWidth: 440,
          margin: "0 auto 28px",
        }}
      >
        Your institution presentation packet for{" "}
        <strong style={{ color: TOKENS.INK }}>{presentation.institutionName}</strong>{" "}
        is ready. You can download the PDF or return to the client profile to track
        the response.
      </div>

      <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
        <a
          href={`/api/presentations/preview`}
          onClick={async (e) => {
            e.preventDefault();
            const res = await fetch("/api/presentations/preview", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ presentationId: presentation.id }),
            });
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            window.open(url, "_blank");
          }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "10px 16px",
            background: TOKENS.PAPER,
            color: TOKENS.INK,
            border: `1.5px solid ${TOKENS.LINE}`,
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 600,
            textDecoration: "none",
            cursor: "pointer",
          }}
        >
          <ExternalLink size={14} strokeWidth={2.2} /> Open PDF
        </a>
        <a
          href={`/app/clients/${clientId}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "10px 16px",
            background: TOKENS.INK,
            color: TOKENS.PAPER,
            border: "none",
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          <ArrowLeft size={14} strokeWidth={2.2} /> Back to client profile
        </a>
      </div>
    </div>
  );
}
