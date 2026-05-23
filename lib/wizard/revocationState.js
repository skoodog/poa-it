/**
 * Revocation Wizard State
 *
 * Manages the state of the revocation wizard flow as the user walks through
 * the 6 steps. Pattern matches the POA wizard state (lib/wizard/state.js) but
 * scoped to revocations.
 *
 * Persistence model: the state object is autosaved to the `revocations` table
 * via PATCH /api/revocations/[id] after each meaningful change. The wizard
 * fetches initial state via GET on page load.
 *
 * Sprint 4c — Round 2.
 */

export const REVOCATION_WIZARD_STEPS = [
  { id: "step1_pick_original", number: 1, label: "Choose original POA" },
  { id: "step2_scope", number: 2, label: "Revocation scope" },
  { id: "step3_confirm", number: 3, label: "Confirm details" },
  { id: "step4_recipients", number: 4, label: "Notice recipients" },
  { id: "step5_real_property", number: 5, label: "Real property recording", conditional: true },
  { id: "step6_review", number: 6, label: "Review and execute" },
];

export function createInitialRevocationState({
  clientId,
  sessionId,
  preselectedOriginalPoaId = null,
} = {}) {
  return {
    // Identity
    sessionId,
    clientId,

    // Step 1 — Original POA selection
    originalPoaId: preselectedOriginalPoaId,
    originalPoaDateSnapshot: null,
    originalPoaDocumentIdSnapshot: null,
    principalNameSnapshot: "",
    originalPoaPowersGranted: [], // snapshot for downstream logic (real-property branch)

    // Step 2 — Scope
    scope: null, // "specific_poa" | "all_prior" | "agent_only"
    revokedAgentName: "", // populated when scope === "agent_only"

    // Step 3 — Confirm + execution
    executionMethod: "ron", // "ron" | "in_person"

    // Step 4 — Notice recipients
    // Array of recipient objects:
    //   { id, recipientType, recipientName, recipientEmail, recipientPhone,
    //     recipientInstitutionName, recipientAddress, recipientCity,
    //     recipientState, recipientZip, deliveryMethod, notes }
    recipients: [],

    // Step 5 — Real property recording (conditional)
    realPropertyRecordings: [], // array of { id, countyName, state, notes }

    // Lifecycle
    currentStep: "step1_pick_original",
    completedSteps: [],
    status: "draft", // matches the DB status enum: draft|executed|notice_in_progress|complete
    createdAt: null,
    updatedAt: null,
  };
}

export function updateRevocationState(state, patch) {
  return {
    ...state,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
}

export function markRevocationStepComplete(state, stepId, nextStepId) {
  const completed = new Set(state.completedSteps || []);
  completed.add(stepId);
  return {
    ...state,
    completedSteps: Array.from(completed),
    currentStep: nextStepId || state.currentStep,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Determine the next step given current step + state.
 * Step 5 (real property) is conditional — only shown if the original POA
 * granted real-property authority.
 */
export function getNextRevocationStep(state) {
  const current = state.currentStep;
  if (current === "step1_pick_original") return "step2_scope";
  if (current === "step2_scope") return "step3_confirm";
  if (current === "step3_confirm") return "step4_recipients";
  if (current === "step4_recipients") {
    return wasRealPropertyGranted(state) ? "step5_real_property" : "step6_review";
  }
  if (current === "step5_real_property") return "step6_review";
  return "step6_review";
}

export function getPreviousRevocationStep(state) {
  const current = state.currentStep;
  if (current === "step6_review") {
    return wasRealPropertyGranted(state) ? "step5_real_property" : "step4_recipients";
  }
  if (current === "step5_real_property") return "step4_recipients";
  if (current === "step4_recipients") return "step3_confirm";
  if (current === "step3_confirm") return "step2_scope";
  if (current === "step2_scope") return "step1_pick_original";
  return "step1_pick_original";
}

/**
 * Determine if the original POA granted real-property authority. Drives
 * conditional rendering of Step 5.
 */
export function wasRealPropertyGranted(state) {
  const granted = state.originalPoaPowersGranted || [];
  return granted.includes("all_powers") || granted.includes("real_property");
}

/**
 * Build the visible list of steps for progress indicators, respecting
 * conditional steps.
 */
export function getVisibleSteps(state) {
  return REVOCATION_WIZARD_STEPS.filter((step) => {
    if (step.id === "step5_real_property") {
      return wasRealPropertyGranted(state);
    }
    return true;
  });
}

/**
 * Step-by-step validation. Returns null if valid, or a string explaining
 * why the step can't be advanced.
 */
export function validateStep(state, stepId) {
  switch (stepId) {
    case "step1_pick_original":
      if (!state.originalPoaId) return "Please pick an original POA to revoke.";
      if (!state.principalNameSnapshot) return "Principal name could not be determined from the selected POA.";
      return null;

    case "step2_scope":
      if (!state.scope) return "Please choose a revocation scope.";
      if (state.scope === "agent_only" && !state.revokedAgentName) {
        return "Please name the agent whose authority you want to revoke.";
      }
      return null;

    case "step3_confirm":
      if (!state.executionMethod) return "Please choose an execution method.";
      return null;

    case "step4_recipients":
      if (!state.recipients || state.recipients.length === 0) {
        return "Add at least one notice recipient (typically the agent).";
      }
      // Require name + at least one contact method per recipient
      for (const r of state.recipients) {
        if (!r.recipientName?.trim()) {
          return "Each recipient must have a name.";
        }
        const hasContactMethod =
          r.recipientEmail || r.recipientAddress || r.recipientPhone;
        if (!hasContactMethod) {
          return `Recipient "${r.recipientName}" needs at least one contact method (email, mailing address, or phone).`;
        }
        if (!r.deliveryMethod) {
          return `Recipient "${r.recipientName}" needs a delivery method.`;
        }
      }
      return null;

    case "step5_real_property":
      // Recording is optional — user can confirm they'll do nothing.
      // Validate that any entries are well-formed.
      if (state.realPropertyRecordings) {
        for (const rec of state.realPropertyRecordings) {
          if (!rec.countyName?.trim()) {
            return "Each recording entry must have a county name.";
          }
        }
      }
      return null;

    case "step6_review":
      return null;

    default:
      return null;
  }
}
