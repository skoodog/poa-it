/**
 * Designation section: principal + agent identification.
 *
 * Sprint 4b changes:
 *   - Successor agent moved to StatutoryProvisions component
 *     (rendered later in the document with statutory wording from § 752.051).
 *   - formatAddress hardened against state-duplication bug (item 4b-10).
 *
 * Per § 752.051 the principal-and-agent designation appears as a single
 * paragraph: "I, [name + address], appoint [name + address] as my agent
 * to act for me in any lawful way with respect to all of the following
 * powers that I have initialed below."
 *
 * We expand this slightly to display the agent's contact info (phone)
 * because real-world institutional acceptance typically wants the
 * agent's phone for verification.
 */

import { View, Text } from "@react-pdf/renderer";
import { styles, SIZES } from "../styles";

export function Designation({ wizardState }) {
  const principalName = wizardState.principalFullLegalName || "____________";
  const principalAddress = formatAddress({
    addr: wizardState.principalAddress,
    city: wizardState.principalCity,
    state: "Texas",
    zip: wizardState.principalZip,
  });

  const agentName = wizardState.agentFullLegalName || "____________";
  const agentAddress = formatAddress({
    addr: wizardState.agentAddress,
    city: wizardState.agentCity,
    state: wizardState.agentState || "Texas",
    zip: wizardState.agentZip,
  });
  const agentPhone = wizardState.agentPhone || "____________";

  return (
    <View>
      <Text style={styles.sectionHeading}>Designation of Agent</Text>

      <Text style={styles.body}>
        I,{" "}
        <Text style={styles.fieldValue}>{principalName}</Text>
        , residing at{" "}
        <Text style={styles.fieldValue}>{principalAddress}</Text>
        , appoint the following person as my agent to act for me in any lawful
        way with respect to all of the powers that I have initialed below.
      </Text>

      <View style={{ marginLeft: 24, marginBottom: SIZES.PARA_SPACING }}>
        <Text style={styles.bodyTight}>
          <Text style={styles.bold}>Name of Agent: </Text>
          <Text style={styles.fieldValue}>{agentName}</Text>
        </Text>
        <Text style={styles.bodyTight}>
          <Text style={styles.bold}>Agent's Address: </Text>
          <Text style={styles.fieldValue}>{agentAddress}</Text>
        </Text>
        <Text style={styles.bodyTight}>
          <Text style={styles.bold}>Agent's Telephone Number: </Text>
          <Text style={styles.fieldValue}>{agentPhone}</Text>
        </Text>
      </View>
    </View>
  );
}

/**
 * Format an address from component fields into a single display string.
 *
 * Sprint 4b — item 4b-10: hardened against state-duplication bug.
 * If a user accidentally typed the state into the city field
 * ("Houston, TX") or address field, our explicit `state: "Texas"`
 * append would double the state. Now we detect and skip duplicates.
 */
function formatAddress({ addr, city, state, zip }) {
  const parts = [];
  if (addr) parts.push(addr);

  if (city || state || zip) {
    const stateInCity = city && state
      ? new RegExp(`\\b(${escapeForRegex(state)}|TX|Tex\\.?)\\b`, "i").test(city)
      : false;
    const effectiveState = stateInCity ? "" : state;

    const cityState = [city, effectiveState].filter(Boolean).join(", ");
    const cityStateZip = [cityState, zip].filter(Boolean).join(" ");
    if (cityStateZip) parts.push(cityStateZip);
  }

  return parts.join(", ") || "____________";
}

function escapeForRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
