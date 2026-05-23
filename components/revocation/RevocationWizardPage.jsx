"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { TOKENS, FONTS } from "../wizard/shared/tokens";
import { RevocationStep1_PickOriginal } from "./RevocationStep1_PickOriginal";
import { RevocationStep2_Scope } from "./RevocationStep2_Scope";
import { RevocationStep3_Confirm } from "./RevocationStep3_Confirm";
import { RevocationStep4_Recipients } from "./RevocationStep4_Recipients";
import { RevocationStep5_RealProperty } from "./RevocationStep5_RealProperty";
import { RevocationStep6_Review } from "./RevocationStep6_Review";
import {
  createInitialRevocationState,
  getNextRevocationStep,
  getPreviousRevocationStep,
  updateRevocationState,
  markRevocationStepComplete,
  wasRealPropertyGranted,
} from "../../lib/wizard/revocationState";

/**
 * RevocationWizardPage
 *
 * Client-side orchestrator for the 6-step revocation wizard. Receives a
 * pre-created draft revocation from the server (created on first page
 * load), then runs the user through the steps with autosave on each
 * meaningful change.
 *
 * Sprint 4c — Round 2.
 */
export function RevocationWizardPage({
  client,
  initialRevocation,
  activeDocuments,
  originalPoaAnswers,
}) {
  const router = useRouter();

  // Hydrate wizard state from the persisted revocation record. The DB record
  // has wizardState as a JSON blob (initially { originalPoaPowersGranted }),
  // plus top-level fields like scope, executionMethod, etc.
  const [state, setStateInternal] = useState(() => {
    const wizState = initialRevocation.wizardState || {};
    return {
      ...createInitialRevocationState({
        clientId: client.id,
        sessionId: initialRevocation.id,
        preselectedOriginalPoaId: initialRevocation.originalPoaId,
      }),
      ...wizState, // overlay anything saved in wizardState
      // overlay top-level columns over wizardState (DB columns win)
      originalPoaId: initialRevocation.originalPoaId,
      principalNameSnapshot: initialRevocation.principalNameSnapshot || "",
      originalPoaDateSnapshot: initialRevocation.originalPoaDateSnapshot,
      originalPoaDocumentIdSnapshot: initialRevocation.originalPoaDocumentIdSnapshot,
      scope: initialRevocation.scope === "specific_poa" ? wizState.scope || null : initialRevocation.scope,
      // (default scope is "specific_poa" at create time; treat that as "not picked yet"
      //  unless the user explicitly set scope in wizardState)
      revokedAgentName: initialRevocation.revokedAgentName || "",
      executionMethod: initialRevocation.executionMethod || "ron",
      status: initialRevocation.status,
    };
  });

  const [postExecuted, setPostExecuted] = useState(false);

  // Autosave debouncer — pushes wizard state to the server after a short
  // pause in user activity.
  const saveTimer = useRef(null);
  const pendingState = useRef(state);

  const persist = useCallback(async (s) => {
    try {
      await fetch(`/api/revocations/${s.sessionId}/update`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope: s.scope || "specific_poa",
          revokedAgentName: s.revokedAgentName || null,
          executionMethod: s.executionMethod || "ron",
          principalNameSnapshot: s.principalNameSnapshot || "",
          wizardState: {
            recipients: s.recipients || [],
            realPropertyRecordings: s.realPropertyRecordings || [],
            originalPoaPowersGranted: s.originalPoaPowersGranted || [],
            completedSteps: s.completedSteps || [],
            currentStep: s.currentStep,
          },
        }),
      });
    } catch (err) {
      console.error("Revocation autosave failed:", err);
    }
  }, []);

  const setState = useCallback(
    (next) => {
      setStateInternal(next);
      pendingState.current = next;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        persist(pendingState.current);
      }, 800);
    },
    [persist]
  );

  function goNext() {
    const nextStepId = getNextRevocationStep(state);
    const updated = markRevocationStepComplete(state, state.currentStep, nextStepId);
    setState(updated);
    // Force-flush save on step boundary so the next page load is consistent
    persist(updated);
  }

  function goBack() {
    const prevStepId = getPreviousRevocationStep(state);
    const updated = updateRevocationState(state, { currentStep: prevStepId });
    setState(updated);
  }

  function exitWizard() {
    router.push(`/app/clients/${client.id}`);
  }

  function onExecuted() {
    setPostExecuted(true);
  }

  // Post-execution confirmation screen
  if (postExecuted) {
    return (
      <PostExecutionConfirmation
        client={client}
        principalName={state.principalNameSnapshot}
        onExit={exitWizard}
      />
    );
  }

  // Already executed when the page was loaded — show summary, not wizard
  if (state.status !== "draft") {
    return (
      <PostExecutionConfirmation
        client={client}
        principalName={state.principalNameSnapshot}
        onExit={exitWizard}
        message="This revocation has already been executed."
      />
    );
  }

  // Route to the correct step component
  const stepProps = {
    state,
    setState,
    onBack: goBack,
    onContinue: goNext,
  };

  const showStep1Back = false; // Step 1 is entry — no back button

  switch (state.currentStep) {
    case "step1_pick_original":
      return (
        <RevocationStep1_PickOriginal
          {...stepProps}
          activeDocuments={activeDocuments}
          onBack={showStep1Back ? exitWizard : undefined}
        />
      );
    case "step2_scope":
      return <RevocationStep2_Scope {...stepProps} />;
    case "step3_confirm":
      return <RevocationStep3_Confirm {...stepProps} />;
    case "step4_recipients":
      return (
        <RevocationStep4_Recipients
          {...stepProps}
          originalPoaAnswers={originalPoaAnswers}
        />
      );
    case "step5_real_property":
      return <RevocationStep5_RealProperty {...stepProps} />;
    case "step6_review":
      return (
        <RevocationStep6_Review
          {...stepProps}
          client={client}
          onExecuted={onExecuted}
        />
      );
    default:
      return (
        <div style={{ padding: 40, textAlign: "center", fontFamily: FONTS.SANS }}>
          Unknown step: {state.currentStep}
        </div>
      );
  }
}

function PostExecutionConfirmation({ client, principalName, onExit, message }) {
  return (
    <div
      style={{
        maxWidth: 600,
        margin: "0 auto",
        padding: "60px 32px",
        textAlign: "center",
        fontFamily: FONTS.SANS,
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          background: "#D1FAE5",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 20px",
        }}
      >
        <CheckCircle2 size={36} strokeWidth={2} color="#065F46" />
      </div>
      <h1
        style={{
          fontSize: 24,
          fontWeight: 600,
          color: TOKENS.INK,
          letterSpacing: "-0.01em",
          margin: 0,
          marginBottom: 8,
        }}
      >
        {message || "Revocation executed"}
      </h1>
      <div style={{ fontSize: 15, color: TOKENS.INK_60, lineHeight: 1.55, marginBottom: 30 }}>
        {message
          ? "You can view the full revocation status from this client's profile."
          : `The Power of Attorney for ${principalName} has been marked as Revoked. Your next steps appear in the notice tracker on this client's profile.`}
      </div>
      <button
        type="button"
        onClick={onExit}
        style={{
          padding: "12px 20px",
          background: TOKENS.INK,
          color: TOKENS.PAPER,
          border: "none",
          borderRadius: 8,
          fontSize: 14,
          fontFamily: FONTS.SANS,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Return to {client.fullLegalName || "client"}'s profile
      </button>
    </div>
  );
}
