/**
 * Designation section: identifies the principal (the person granting power),
 * the agent (the person receiving power), and any successor agents.
 *
 * Statutory structure from § 752.051 — the form opens with:
 *   "I, ____ (insert your name and address), appoint ____ (insert the name
 *    and address of the person appointed) as my agent to act for me..."
 *
 * Followed by optional successor agent section. We always include successor
 * agent block — if the wizard didn't capture one, we leave the lines blank
 * so the principal can hand-fill if they want to add one before signing.
 */

import { View, Text } from "@react-pdf/renderer";
import { styles, COLORS, SIZES } from "../styles";

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

  const hasSuccessor = !!wizardState.successorAgentFullLegalName;
  const successorName = wizardState.successorAgentFullLegalName || "";
  const successorAddress = hasSuccessor
    ? formatAddress({
        addr: wizardState.successorAgentAddress,
        city: wizardState.successorAgentCity,
        state: wizardState.successorAgentState || "Texas",
        zip: wizardState.successorAgentZip,
      })
    : "";
  const successorPhone = wizardState.successorAgentPhone || "";

  return (
    <View>
      <Text style={styles.sectionHeading}>Designation of Agent</Text>

      <Text style={styles.body}>
        I,{" "}
        <Text style={styles.fieldValue}>{principalName}</Text>
        {", residing at "}
        <Text style={styles.fieldValue}>{principalAddress}</Text>
        {", appoint the following person as my agent to act for me in any "}
        lawful way with respect to all of the following powers that I have
        initialed below.
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

      <Text style={styles.sectionHeading}>
        Designation of Successor Agent (Optional)
      </Text>

      <Text style={styles.body}>
        If my agent is unable or unwilling to act for me, I name the following
        person as my successor agent:
      </Text>

      <View style={{ marginLeft: 24, marginBottom: SIZES.PARA_SPACING }}>
        <Text style={styles.bodyTight}>
          <Text style={styles.bold}>Name of Successor Agent: </Text>
          {hasSuccessor ? (
            <Text style={styles.fieldValue}>{successorName}</Text>
          ) : (
            <Text style={styles.blankField}>____________</Text>
          )}
        </Text>
        <Text style={styles.bodyTight}>
          <Text style={styles.bold}>Successor Agent's Address: </Text>
          {hasSuccessor ? (
            <Text style={styles.fieldValue}>{successorAddress}</Text>
          ) : (
            <Text style={styles.blankField}>____________</Text>
          )}
        </Text>
        <Text style={styles.bodyTight}>
          <Text style={styles.bold}>Successor Agent's Telephone Number: </Text>
          {hasSuccessor ? (
            <Text style={styles.fieldValue}>{successorPhone}</Text>
          ) : (
            <Text style={styles.blankField}>____________</Text>
          )}
        </Text>
      </View>
    </View>
  );
}

function formatAddress({ addr, city, state, zip }) {
  const parts = [];
  if (addr) parts.push(addr);
  if (city || state || zip) {
    const cityState = [city, state].filter(Boolean).join(", ");
    const cityStateZip = [cityState, zip].filter(Boolean).join(" ");
    if (cityStateZip) parts.push(cityStateZip);
  }
  return parts.join(", ") || "____________";
}
