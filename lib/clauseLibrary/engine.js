/**
 * Clause Library Engine
 *
 * Evaluates trigger expressions from clauses.json and wizardRules.json
 * against the current wizard state. The trigger language is intentionally
 * a small, inspectable DSL:
 *
 *   "always"                                 → true
 *   "user_initialed('key')"                  → state.powers_granted includes 'key'
 *   "user_granted('hot_power_key')"          → state.hot_powers_granted includes 'hot_power_key'
 *   "user_chose('value')"                    → state.effective_date_choice === 'value'
 *   "user_named('successor_agent')"          → state.successor_agent_full_legal_name is truthy
 *   "field == 'value'"                       → equality check
 *   "field == true"                          → boolean check
 *   Composable with " AND " and " OR " (no nesting in MVP)
 *
 * The DSL is deliberately tiny because every trigger must be auditable
 * by an attorney reviewing the wizard logic. Larger grammars are harder
 * to verify.
 */

import clausesData from "./clauses.json";
import wizardRulesData from "./wizardRules.json";

export const clauseLibrary = clausesData;
export const wizardRules = wizardRulesData;

/**
 * Evaluates a trigger expression against wizard state.
 * Returns true if the trigger fires, false otherwise.
 * Unknown trigger forms fail closed (return false) and emit a console warning.
 */
export function evaluateTrigger(trigger, state) {
  if (!trigger || typeof trigger !== "string") return false;
  if (trigger === "always") return true;

  // Compound triggers (AND/OR). We handle OR first because AND binds tighter
  // in our grammar (no parens supported). If both appear in one trigger,
  // we treat OR as the outer operator.
  if (trigger.includes(" OR ")) {
    return trigger.split(" OR ").some(part => evaluateTrigger(part.trim(), state));
  }
  if (trigger.includes(" AND ")) {
    return trigger.split(" AND ").every(part => evaluateTrigger(part.trim(), state));
  }

  // user_initialed('key') — checks state.powersGranted array
  const initialedMatch = trigger.match(/^user_initialed\('(.+?)'\)$/);
  if (initialedMatch) {
    const key = initialedMatch[1];
    return Array.isArray(state.powersGranted) && state.powersGranted.includes(key);
  }

  // user_granted('hot_power_key') — checks state.hotPowersGranted array
  const grantedMatch = trigger.match(/^user_granted\('(.+?)'\)$/);
  if (grantedMatch) {
    const key = grantedMatch[1];
    return Array.isArray(state.hotPowersGranted) && state.hotPowersGranted.includes(key);
  }

  // user_chose('value') — checks state.effectiveDateChoice or similar
  const choseMatch = trigger.match(/^user_chose\('(.+?)'\)$/);
  if (choseMatch) {
    const value = choseMatch[1];
    if (value === "effective_immediate" || value === "effective_springing") {
      return state.effectiveDateChoice === value.replace("effective_", "");
    }
    // Generic: check if any state field equals the value
    return Object.values(state).includes(value);
  }

  // user_named('successor_agent') — checks if the relevant field is populated
  const namedMatch = trigger.match(/^user_named\('(.+?)'\)$/);
  if (namedMatch) {
    const fieldMap = {
      successor_agent: "successorAgentFullLegalName",
      second_successor_agent: "secondSuccessorAgentFullLegalName",
    };
    const field = fieldMap[namedMatch[1]];
    return field && !!state[field];
  }

  // String equality: field == 'value'
  const strEqMatch = trigger.match(/^(\w+) == '(.+?)'$/);
  if (strEqMatch) {
    return state[strEqMatch[1]] === strEqMatch[2];
  }

  // Boolean equality: field == true / field == false
  const boolEqMatch = trigger.match(/^(\w+) == (true|false)$/);
  if (boolEqMatch) {
    return state[boolEqMatch[1]] === (boolEqMatch[2] === "true");
  }

  // Numeric equality: field == 42
  const numEqMatch = trigger.match(/^(\w+) == (\d+)$/);
  if (numEqMatch) {
    return state[numEqMatch[1]] === Number(numEqMatch[2]);
  }

  // Unknown — fail closed and log so we catch it in dev
  if (typeof console !== "undefined" && console.warn) {
    console.warn(`[clauseLibrary] Unknown trigger expression: "${trigger}"`);
  }
  return false;
}

/**
 * Resolves all clauses that apply to a document type, given current state.
 * Returns clauses in their original library order (which mirrors the
 * Texas statutory form order for tx_durable_financial_poa).
 */
export function resolveClausesForDocument(state, documentType) {
  const docMeta = clauseLibrary.documents[documentType];
  if (!docMeta) {
    throw new Error(`Unknown document type: ${documentType}`);
  }

  const applicable = clauseLibrary.clauses
    .filter(c => Array.isArray(c.applies_to) && c.applies_to.includes(documentType))
    .filter(c => evaluateTrigger(c.trigger, state));

  return {
    documentMeta: docMeta,
    clauses: applicable,
    orderedSections: groupAndOrder(applicable),
  };
}

/**
 * Returns all general-powers clauses (categories A-N + "all") for use
 * in the wizard's Step 4 powers screen. Doesn't filter by trigger —
 * we want to show every option for the user to pick from.
 */
export function getAllGeneralPowers() {
  return clauseLibrary.clauses.filter(
    c => c.category === "general_powers" && c.applies_to.includes("tx_durable_financial_poa")
  );
}

/**
 * Returns all hot-powers clauses (the 5 § 751.031(b) powers).
 */
export function getAllHotPowers() {
  return clauseLibrary.clauses.filter(
    c => c.category === "hot_powers" &&
         c.applies_to.includes("tx_durable_financial_poa") &&
         c.clause_id !== "hot_power_gifts_default_limited"
  );
}

/**
 * Returns the gift-power clause specifically (it has a different UX than
 * the other hot powers — it's the statutory default rather than an opt-in).
 */
export function getGiftPowerClause() {
  return clauseLibrary.clauses.find(c => c.clause_id === "hot_power_gifts_default_limited");
}

/**
 * Returns metadata from the clause library (annual exclusion amount, etc.)
 */
export function getMetadata() {
  return clauseLibrary.metadata;
}

/**
 * Groups clauses by category and orders them per the document's section flow.
 * Used by future PDF generator; included here for completeness.
 */
function groupAndOrder(clauses) {
  const sectionOrder = [
    "header",
    "agent_designation",
    "general_powers",
    "hot_powers",
    "effective_date",
    "third_party_provisions",
    "agent_duties",
    "execution",
    "witness_block",
    "post_execution",
  ];

  const grouped = {};
  for (const c of clauses) {
    if (!grouped[c.category]) grouped[c.category] = [];
    grouped[c.category].push(c);
  }

  return sectionOrder
    .filter(s => grouped[s])
    .map(s => ({ section: s, clauses: grouped[s] }));
}
