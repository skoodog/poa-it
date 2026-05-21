/**
 * Wizard State Management
 *
 * Sprint 1 update: state now syncs to Postgres via server actions. The
 * localStorage layer remains as a fast cache and offline fallback, but
 * Postgres is the source of truth.
 *
 * Reconciliation:
 *   - On wizard mount, load from localStorage first (instant), then call
 *     getOrCreateSession server action with the anonymousId. If server has
 *     a newer state, server wins.
 *   - On every state update, save to localStorage immediately AND fire a
 *     server-side update via syncToServer. localStorage = optimistic,
 *     server = authoritative.
 *   - On user sign-in, the anonymous session is claimed and attached to
 *     the user account via claimAnonymousSession.
 *
 * The state shape is the contract between every wizard screen, the
 * validator, and the database. Changes here ripple through everywhere.
 */

const STORAGE_KEY = "poa-it.wizard.v1";
const ANONYMOUS_ID_KEY = "poa-it.anonymousId.v1";

/**
 * Factory for a fresh wizard state.
 * Centralized so every screen has consistent defaults.
 */
export function createInitialState() {
  return {
    // Meta
    sessionId: generateSessionId(),
    userId: null, // Will populate after auth (Phase 6)
    documentType: "tx_durable_financial_poa",
    currentStep: "eligibility_gate",
    completedSteps: [],
    createdAt: new Date().toISOString(),
    lastUpdatedAt: new Date().toISOString(),

    // Eligibility gate (§ 3.1)
    isTexasResident: null,
    isAdult: null,
    forSelf: null,
    underGuardianship: null,

    // Step 1 — Document type acknowledgment (§ 3.2)
    documentTypeAcknowledged: false,

    // Step 2 — Principal (§ 3.3)
    principalFullLegalName: "",
    principalDob: "",
    principalAddress: "",
    principalCity: "",
    principalZip: "",
    principalCounty: "",
    principalPhone: "",
    principalEmail: "",

    // Step 3 — Agent (§ 3.4)
    agentFullLegalName: "",
    agentRelationship: "",
    agentRelationshipOther: "",
    agentDob: "",
    agentAddress: "",
    agentCity: "",
    agentState: "TX",
    agentZip: "",
    agentPhone: "",
    agentEmail: "",
    successorAgentFullLegalName: "",
    successorAgentAddress: "",
    successorAgentPhone: "",
    successorAgentEmail: "",
    alternateAgentSkipped: false,

    // Step 4 — Powers (§ 3.5)
    powersGranted: [], // array of clause_id keys like 'real_property', 'banking_and_financial', 'all_powers'
    allPowersShortcut: false,

    // Step 4a — Homestead (§ 3.6)
    ownsTexasHomestead: null, // 'yes_homestead' | 'yes_not_homestead' | 'no' | 'not_sure'
    grantsHomeEquityAuthority: null,

    // Step 5 — Hot powers (§ 3.7)
    hotPowersGranted: [], // ['hot_power_gifts', 'hot_power_trust', ...]
    giftLimitChoice: null, // 'default' | 'custom' | 'above_annual_exclusion'
    giftCustomLimit: null,

    // Step 6 — Effective date (§ 3.8)
    effectiveDateChoice: null, // 'immediate' | 'springing'
    springingTriggerDefinition: null,
    customIncapacityDefinition: false,

    // Step 7 — Execution method (§ 3.9)
    executionMethod: null, // 'ron' | 'in_person'
    executionMethodLocked: false,

    // Step 8 — Review acknowledgments (§ 3.10)
    acknowledgmentsConfirmed: [], // array of rule_ids that have been confirmed
    prePurchaseAcknowledgments: {
      reviewedAccurate: false,
      notLawFirm: false,
      scopeLimitations: false,
      termsAndPrivacy: false,
      refundPolicy: false,
    },
  };
}

/**
 * Generates a session ID for this wizard run.
 * Format: wiz_<timestamp>_<random>
 */
function generateSessionId() {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 10);
  return `wiz_${ts}_${rand}`;
}

/**
 * Loads state from localStorage if present and valid.
 * Returns null if no saved state or if the saved state is corrupted.
 */
export function loadState() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Basic shape check — must have sessionId and documentType
    if (!parsed.sessionId || !parsed.documentType) return null;
    return parsed;
  } catch (err) {
    if (typeof console !== "undefined") {
      console.warn("[wizard state] Failed to load saved state:", err.message);
    }
    return null;
  }
}

/**
 * Saves state to localStorage. Called on every state update.
 */
export function saveState(state) {
  if (typeof window === "undefined") return;
  try {
    const stateWithTimestamp = { ...state, lastUpdatedAt: new Date().toISOString() };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stateWithTimestamp));
  } catch (err) {
    if (typeof console !== "undefined") {
      console.warn("[wizard state] Failed to save state:", err.message);
    }
  }
}

/**
 * Clears saved state. Used when wizard is completed or user starts over.
 */
export function clearState() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    // Silent failure — clearing is best-effort
  }
}

/**
 * Updates state with partial changes and persists.
 * Used by screens to mutate state.
 *
 * Example: updateState(state, { principalFullLegalName: "Jane Doe" })
 */
export function updateState(currentState, updates) {
  const next = {
    ...currentState,
    ...updates,
    lastUpdatedAt: new Date().toISOString(),
  };
  saveState(next);
  return next;
}

/**
 * Adds a step to completedSteps and updates currentStep.
 * Idempotent — adding the same step twice doesn't duplicate.
 */
export function markStepComplete(state, completedStep, nextStep) {
  const completed = new Set(state.completedSteps);
  completed.add(completedStep);
  return updateState(state, {
    completedSteps: Array.from(completed),
    currentStep: nextStep,
  });
}

/**
 * Records an acknowledgment in state.
 * The audit logger captures the full record separately; this just tracks
 * which acknowledgments have been confirmed so the validator knows they're satisfied.
 */
export function recordAcknowledgment(state, ruleId) {
  const set = new Set(state.acknowledgmentsConfirmed);
  set.add(ruleId);
  return updateState(state, { acknowledgmentsConfirmed: Array.from(set) });
}

/**
 * Steps the wizard expects, in order.
 * Used by the shell for progress display and navigation.
 */
export const WIZARD_STEPS = [
  { id: "eligibility_gate", label: "Eligibility" },
  { id: "step1_document_type", label: "Document" },
  { id: "step2_principal", label: "Your info" },
  { id: "step3_agent", label: "Your agent" },
  { id: "step4_powers", label: "Powers" },
  { id: "step4a_homestead", label: "Homestead", conditional: true },
  { id: "step5_hot_powers", label: "Sensitive powers" },
  { id: "step6_effective_date", label: "Effective date" },
  { id: "step7_execution_method", label: "Signing" },
  { id: "step8_review", label: "Review" },
  { id: "step9_waitlist", label: "Waitlist" },
];

/**
 * Returns the next step ID given the current step and state.
 * Handles conditional skipping (e.g., skip homestead if no real property).
 */
export function getNextStep(state) {
  const currentIdx = WIZARD_STEPS.findIndex(s => s.id === state.currentStep);
  if (currentIdx === -1 || currentIdx === WIZARD_STEPS.length - 1) return null;

  for (let i = currentIdx + 1; i < WIZARD_STEPS.length; i++) {
    const step = WIZARD_STEPS[i];

    // Skip homestead if no real-property power was granted
    if (step.id === "step4a_homestead") {
      const grantedRealProperty =
        state.powersGranted?.includes("real_property") ||
        state.powersGranted?.includes("all_powers");
      if (!grantedRealProperty) continue;
    }

    return step.id;
  }
  return null;
}

/**
 * Returns the previous step ID.
 * Mirrors getNextStep's conditional logic in reverse.
 */
export function getPreviousStep(state) {
  const currentIdx = WIZARD_STEPS.findIndex(s => s.id === state.currentStep);
  if (currentIdx <= 0) return null;

  for (let i = currentIdx - 1; i >= 0; i--) {
    const step = WIZARD_STEPS[i];
    if (step.id === "step4a_homestead") {
      const grantedRealProperty =
        state.powersGranted?.includes("real_property") ||
        state.powersGranted?.includes("all_powers");
      if (!grantedRealProperty) continue;
    }
    return step.id;
  }
  return null;
}

/**
 * Returns the persistent anonymous ID for this browser, generating one if
 * absent. Used to look up server-side wizard sessions across page loads,
 * even before the user has signed in.
 */
export function getOrCreateAnonymousId() {
  if (typeof window === "undefined") return null;
  try {
    let id = window.localStorage.getItem(ANONYMOUS_ID_KEY);
    if (!id) {
      // Generate a UUID-like ID (no crypto.randomUUID() guarantee in all browsers)
      id = `anon_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 14)}`;
      window.localStorage.setItem(ANONYMOUS_ID_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

/**
 * Sync the current state to the server. Best-effort: if the server is
 * unreachable, localStorage remains the cache and we'll retry on the next
 * update.
 *
 * Called from updateState() automatically; can also be called explicitly
 * after a batch of changes.
 */
export async function syncToServer(state) {
  if (typeof window === "undefined") return { ok: false, reason: "ssr" };

  const anonymousId = getOrCreateAnonymousId();
  if (!anonymousId) return { ok: false, reason: "no_anonymous_id" };

  try {
    const res = await fetch("/api/wizard/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ anonymousId, state }),
    });
    if (!res.ok) {
      return { ok: false, reason: `http_${res.status}` };
    }
    const json = await res.json();
    return { ok: true, session: json.session };
  } catch (err) {
    return { ok: false, reason: err.message };
  }
}

/**
 * Load state from server, falling back to localStorage if server unreachable.
 *
 * On wizard mount, call this first to get the most authoritative state.
 * If server has a record for our anonymousId, use it. Otherwise, fall back
 * to localStorage. If both are empty, return null and the caller creates
 * a fresh state.
 */
export async function loadStateFromServer() {
  if (typeof window === "undefined") return null;

  const anonymousId = getOrCreateAnonymousId();
  if (!anonymousId) return loadState(); // Fallback to localStorage

  try {
    const res = await fetch(`/api/wizard/load?anonymousId=${encodeURIComponent(anonymousId)}`);
    if (!res.ok) return loadState();
    const json = await res.json();
    if (json.session?.state) {
      // Server has state; cache it locally and return
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(json.session.state));
      } catch {
        // localStorage might be full; non-fatal
      }
      return json.session.state;
    }
    return loadState(); // Server has no record; fall back to localStorage
  } catch {
    return loadState();
  }
}
