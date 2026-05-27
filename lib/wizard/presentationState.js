/**
 * Presentation Wizard State
 *
 * Manages the state of the 4-step institution presentation wizard.
 * Pattern matches lib/wizard/revocationState.js — autosaved to the
 * institution_presentations table via PATCH after each meaningful change.
 *
 * Sprint 4d — Round 2.
 */

export const PRESENTATION_WIZARD_STEPS = [
  { id: "step1_profile", number: 1, label: "Institution type" },
  { id: "step2_institution", number: 2, label: "Institution details" },
  { id: "step3_authority", number: 3, label: "Authority subset" },
  { id: "step4_review", number: 4, label: "Review & generate" },
];

export function createInitialPresentationState({
  clientId,
  sessionId,
  preselectedOriginalPoaId = null,
} = {}) {
  return {
    // Identity
    sessionId,
    clientId,

    // Step 1 — Profile selection
    institutionProfileId: null,
    institutionProfileSlug: null, // human-readable identifier for UX

    // Snapshotted from the original POA + linked client
    originalPoaId: preselectedOriginalPoaId,
    originalPoaDateSnapshot: null,
    originalPoaDocumentIdSnapshot: null,
    originalPoaStatus: null,
    originalPoaExecutionMethod: null,
    originalPoaPowersGranted: [],
    principalNameSnapshot: "",
    agentNameSnapshot: "",
    successorAgentNameSnapshot: "",
    poaIsSpringingType: false,

    // Step 2 — Institution details
    institutionName: "",
    institutionAddress: "",
    institutionCity: "",
    institutionState: "TX",
    institutionZip: "",
    institutionContactName: "",
    institutionContactEmail: "",
    institutionContactPhone: "",

    // Step 3 — Authority subset (starts from profile defaults, user can override)
    selectedPowers: [],
    customNotes: [],

    // Lifecycle
    currentStep: "step1_profile",
    completedSteps: [],
    status: "draft",
    createdAt: null,
    updatedAt: null,
  };
}

export function updatePresentationState(state, patch) {
  return {
    ...state,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
}

export function markPresentationStepComplete(state, stepId, nextStepId) {
  const completed = new Set(state.completedSteps || []);
  completed.add(stepId);
  return {
    ...state,
    completedSteps: Array.from(completed),
    currentStep: nextStepId || state.currentStep,
    updatedAt: new Date().toISOString(),
  };
}

export function getNextPresentationStep(state) {
  const current = state.currentStep;
  if (current === "step1_profile") return "step2_institution";
  if (current === "step2_institution") return "step3_authority";
  if (current === "step3_authority") return "step4_review";
  return "step4_review";
}

export function getPreviousPresentationStep(state) {
  const current = state.currentStep;
  if (current === "step4_review") return "step3_authority";
  if (current === "step3_authority") return "step2_institution";
  if (current === "step2_institution") return "step1_profile";
  return "step1_profile";
}

/**
 * Step-by-step validation. Returns null if valid, or a string explaining
 * why the step can't be advanced.
 */
export function validatePresentationStep(state, stepId) {
  switch (stepId) {
    case "step1_profile":
      // Profile is optional — "Generic / Custom" or no profile is valid
      // (user can configure powers manually in Step 3). But we DO require
      // them to have made a choice (either a profile or explicitly "custom").
      if (!state.institutionProfileId && !state.institutionProfileSlug) {
        return "Please pick an institution type, or choose Generic / Custom.";
      }
      return null;

    case "step2_institution":
      if (!state.institutionName?.trim()) return "Please enter the institution name.";
      return null;

    case "step3_authority":
      // Allow zero powers — the underlying POA grants the authority,
      // this packet is just a focused extract. But warn if zero.
      // (Validation only blocks step advancement; a soft note about
      //  no powers is shown in the review screen.)
      return null;

    case "step4_review":
      return null;

    default:
      return null;
  }
}

/**
 * Resolves which powers to recommend based on the chosen profile, intersected
 * with the powers actually granted by the underlying POA. Returns powers that
 * are BOTH in the profile's recommended list AND in the principal's grant.
 *
 * If the principal granted "all_powers" (line O), all profile-recommended
 * powers are valid.
 */
export function resolveRecommendedPowers(profileRecommended, originalPoaGranted) {
  const profile = Array.isArray(profileRecommended) ? profileRecommended : [];
  const granted = Array.isArray(originalPoaGranted) ? originalPoaGranted : [];

  // If the POA granted blanket authority, the profile's recommendations all apply
  if (granted.includes("all_powers")) {
    return [...profile];
  }

  // Otherwise, intersect: only recommend what's actually granted
  const grantedSet = new Set(granted);
  return profile.filter((p) => grantedSet.has(p));
}
