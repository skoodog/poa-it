/**
 * Wizard Validator
 *
 * Takes wizard state and a current step, returns:
 *   {
 *     blockers:        [{rule_id, message, statutory_source}]   // hard stops
 *     warnings:        [{rule_id, message, statutory_source}]   // soft, dismissible
 *     referrals:       [{rule_id, message, statutory_source}]   // attorney marketplace prompts
 *     acknowledgments: [{rule_id, message, statutory_source}]   // required confirmations
 *     executionRestriction: 'in_person_required' | null         // forced execution method
 *   }
 *
 * Rules are scoped to specific steps (see wizardRules.json), so we only
 * evaluate rules relevant to the current step plus any cross-cutting
 * rules (e.g., homestead which affects step7 even if set in step4a).
 */

import { evaluateTrigger, wizardRules } from "../clauseLibrary/engine.js";

/**
 * Derived predicates — turn raw state into the boolean flags that rules check.
 * Keeping this separate from the rules themselves means rules stay declarative.
 */
function deriveStateFlags(state) {
  const closeFamilyRelationships = ["spouse", "parent", "adult_child", "grandparent", "grandchild"];

  const anyHotPowerGranted =
    Array.isArray(state.hotPowersGranted) && state.hotPowersGranted.length > 0;

  const hotPowerTrust = state.hotPowersGranted?.includes("hot_power_trust") || false;
  const hotPowerSurvivorship = state.hotPowersGranted?.includes("hot_power_survivorship") || false;
  const hotPowerBeneficiary = state.hotPowersGranted?.includes("hot_power_beneficiary") || false;

  const agentRelationshipNotCloseFamily =
    state.agentRelationship &&
    !closeFamilyRelationships.includes(state.agentRelationship);

  const noGeneralPowersInitialed =
    !Array.isArray(state.powersGranted) || state.powersGranted.length === 0;

  const noAllPowersInitialed = !state.powersGranted?.includes("all_powers");

  return {
    ...state,
    any_hot_power_granted: anyHotPowerGranted,
    agent_relationship_not_close_family: agentRelationshipNotCloseFamily,
    no_general_powers_initialed: noGeneralPowersInitialed,
    no_all_powers_initialed: noAllPowersInitialed,
    hot_power_trust: hotPowerTrust,
    hot_power_survivorship: hotPowerSurvivorship,
    hot_power_beneficiary: hotPowerBeneficiary,
    // Map camelCase state to snake_case for rule readability
    is_texas_resident: state.isTexasResident,
    is_adult: state.isAdult,
    for_self: state.forSelf,
    under_guardianship: state.underGuardianship === true,
    owns_texas_homestead: state.ownsTexasHomestead,
    grants_home_equity_authority: state.grantsHomeEquityAuthority === true,
    effective_date_choice: state.effectiveDateChoice,
    document_type: state.documentType,
    execution_method: state.executionMethod,
    gift_limit_choice: state.giftLimitChoice,
    successor_agent_named: !!state.successorAgentFullLegalName,
    user_clicked_skip: state.alternateAgentSkipped === true,
  };
}

/**
 * Validates wizard state against the rules for a given step.
 * @param {Object} state - the full wizard state
 * @param {string} currentStep - e.g., "eligibility_gate", "step5_hot_powers"
 * @returns {Object} categorized validation results
 */
export function validateWizardState(state, currentStep) {
  const derived = deriveStateFlags(state);
  const result = {
    blockers: [],
    warnings: [],
    referrals: [],
    acknowledgments: [],
    executionRestriction: null,
  };

  for (const rule of wizardRules.wizard_decision_rules) {
    // Scope check: only evaluate rules for this step (or unscoped global rules)
    if (rule.scope && !rule.scope.includes(currentStep)) continue;

    // Trigger check: does the rule fire?
    if (!evaluateTrigger(rule.trigger, derived)) continue;

    const entry = {
      ruleId: rule.rule_id,
      message: rule.wizard_message,
      statutorySource: rule.statutory_source || null,
      severity: rule.severity,
    };

    switch (rule.action) {
      case "block_completion_with_message":
        result.blockers.push(entry);
        break;
      case "show_warning_and_require_acknowledgment":
        result.acknowledgments.push(entry);
        break;
      case "show_attorney_referral_offer":
      case "require_attorney_consultation_acknowledgment":
        result.referrals.push(entry);
        break;
      case "force_in_person_execution":
        result.executionRestriction = "in_person_required";
        break;
      case "qualify_witness_via_screening_questions":
        // Handled by the medical witness flow; surface as a notice here
        result.acknowledgments.push(entry);
        break;
      default:
        // Unknown action — log and surface as warning
        if (typeof console !== "undefined" && console.warn) {
          console.warn(`[validator] Unknown action: ${rule.action}`);
        }
        result.warnings.push(entry);
    }
  }

  return result;
}

/**
 * Quick helper: does the current step have any blockers?
 * Used to disable the "Continue" button.
 */
export function hasBlockers(validationResult) {
  return validationResult.blockers.length > 0;
}

/**
 * Quick helper: count of required acknowledgments that haven't been satisfied.
 * Compares against state.acknowledgmentsConfirmed (list of acknowledged rule_ids).
 */
export function unsatisfiedAcknowledgments(validationResult, state) {
  const confirmed = new Set(state.acknowledgmentsConfirmed || []);
  return validationResult.acknowledgments.filter(a => !confirmed.has(a.ruleId));
}
