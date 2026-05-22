/**
 * Statutory Provisions section — the block of statutory text that follows
 * the effective-date block in the canonical § 752.051 form.
 *
 * Sprint 4b — this is item 4b-4's primary deliverable. Per attorney
 * review, the prior draft omitted these statutory sections:
 *   - Third-party reliance language
 *   - Termination / actual-knowledge language
 *   - Indemnity for third parties
 *   - Texas law governing clause
 *   - Statutory successor-agent appointment language
 *
 * Each of these is restored here verbatim from Tex. Est. Code § 752.051.
 *
 * STATUTORY SOURCE
 *   Tex. Est. Code § 752.051 (current as of 2024 revision).
 *   "I agree that any third party who receives a copy of this document may
 *   act under it..." block.
 */

import { View, Text } from "@react-pdf/renderer";
import { styles, SIZES } from "../styles";

export function StatutoryProvisions({ wizardState }) {
  const hasSuccessor = !!wizardState.successorAgentFullLegalName;
  const successorName = wizardState.successorAgentFullLegalName || "";
  const successorAddress = formatSuccessorAddress(wizardState);

  return (
    <View>
      {/* Third-party reliance + termination + indemnity + Texas-law block.
          This is a single verbatim paragraph from § 752.051. */}
      <Text style={styles.body}>
        I agree that any third party who receives a copy of this document may
        act under it. Termination of this durable power of attorney is not
        effective as to a third party until the third party has actual
        knowledge of the termination. I agree to indemnify the third party for
        any claims that arise against the third party because of reliance on
        this power of attorney. The meaning and effect of this durable power
        of attorney is determined by Texas law.
      </Text>

      {/* Statutory successor-agent appointment language. The verbatim
          statutory wording covers death, incapacity, resignation, refusal,
          removal, and divorce-from-spouse-agent. */}
      <Text style={styles.body}>
        If any agent named by me dies, becomes incapacitated, resigns, refuses
        to act, or is removed by court order, or if my marriage to an agent
        named by me is dissolved by a court decree of divorce or annulment or
        is declared void by a court (unless I provided in this document that
        the dissolution or declaration does not terminate the agent's
        authority to act under this power of attorney), I name the following
        (each to act alone and successively, in the order named) as
        successor(s) to that agent:{" "}
        {hasSuccessor ? (
          <Text style={styles.fieldValue}>
            {successorName}
            {successorAddress ? `, residing at ${successorAddress}` : ""}.
          </Text>
        ) : (
          <Text style={styles.italic}>
            No successor agent designated.
          </Text>
        )}
      </Text>
    </View>
  );
}

/**
 * Format successor agent's address as a single string, fixing the
 * state-duplication bug your attorney flagged (item 4b-10).
 *
 * The prior helper formatted addresses by reading fields independently,
 * which caused the state to appear twice when state was both in
 * `successorAgentState` AND embedded in city-state-zip formatting.
 *
 * Fix: deduplicate state references — if successorAgentState appears in
 * the input but ALSO in the city/zip composite, only include it once.
 */
function formatSuccessorAddress(wizardState) {
  const addr = wizardState.successorAgentAddress;
  const city = wizardState.successorAgentCity;
  const state = wizardState.successorAgentState || "Texas";
  const zip = wizardState.successorAgentZip;

  if (!addr && !city && !zip) return "";

  const parts = [];
  if (addr) parts.push(addr);

  // Build city-state-zip composite WITHOUT duplicating state
  const cityState = city ? [city, state].filter(Boolean).join(", ") : state;
  const cityStateZip = [cityState, zip].filter(Boolean).join(" ");
  if (cityStateZip) parts.push(cityStateZip);

  return parts.join(", ");
}
