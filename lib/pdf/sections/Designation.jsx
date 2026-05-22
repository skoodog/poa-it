/**
 * Designation section: principal + agent + successor agent identification.
 *
 * Sprint 4b.1 Round 2 changes:
 *   - Successor agent now rendered as a clean field block matching the
 *     primary agent layout (Name / Address / Phone / Email) per attorney
 *     guidance: "use the same clean field structure as the primary agent."
 *   - The statutory paragraph form of the successor designation is
 *     preserved per § 752.051 wording, but appears as preamble TEXT above
 *     the field block (not embedded in dense paragraph).
 *
 * Per § 752.051 the principal-and-agent designation paragraph is:
 *   "I, [name + address], appoint [name + address] as my agent..."
 */

import { View, Text } from "@react-pdf/renderer";
import { styles, SIZES, COLORS } from "../styles";

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
  const agentEmail = wizardState.agentEmail || "";

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
  const successorEmail = wizardState.successorAgentEmail || "";

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

      <AgentFieldBlock
        name={agentName}
        address={agentAddress}
        phone={agentPhone}
        email={agentEmail}
        labelPrefix="Agent's"
      />

      {/* Successor Agent block — clean field structure per attorney guidance */}
      <Text style={[styles.sectionHeading, { marginTop: SIZES.SECTION_SPACING }]}>
        Designation of Successor Agent (Optional)
      </Text>

      <Text style={styles.body}>
        If any agent named by me dies, becomes incapacitated, resigns, refuses
        to act, or is removed by court order, or if my marriage to an agent
        named by me is dissolved by a court decree of divorce or annulment or
        is declared void by a court (unless I provided in this document that
        the dissolution or declaration does not terminate the agent's
        authority to act under this power of attorney), I name the following
        as successor agent to that agent:
      </Text>

      {hasSuccessor ? (
        <AgentFieldBlock
          name={successorName}
          address={successorAddress}
          phone={successorPhone}
          email={successorEmail}
          labelPrefix="Successor Agent's"
        />
      ) : (
        <View
          style={{
            padding: 10,
            borderLeftWidth: 2,
            borderLeftColor: "#999999",
            marginBottom: SIZES.PARA_SPACING,
          }}
        >
          <Text style={[styles.bodyTight, styles.italic, { fontSize: 10.5 }]}>
            No successor agent is named.
          </Text>
        </View>
      )}
    </View>
  );
}

/**
 * Render an agent's field block. Used for both primary agent and successor.
 *
 * Layout:
 *   Name of Agent: [name]
 *   Address: [address]
 *   Telephone Number: [phone]
 *   Email (optional): [email]  ← only shown when provided
 */
function AgentFieldBlock({ name, address, phone, email, labelPrefix }) {
  return (
    <View style={{ marginLeft: 24, marginBottom: SIZES.PARA_SPACING }}>
      <Text style={styles.bodyTight}>
        <Text style={styles.bold}>Name of {labelPrefix === "Agent's" ? "Agent" : "Successor Agent"}: </Text>
        <Text style={styles.fieldValue}>{name}</Text>
      </Text>
      <Text style={styles.bodyTight}>
        <Text style={styles.bold}>{labelPrefix} Address: </Text>
        <Text style={styles.fieldValue}>{address}</Text>
      </Text>
      <Text style={styles.bodyTight}>
        <Text style={styles.bold}>{labelPrefix} Telephone Number: </Text>
        <Text style={styles.fieldValue}>{phone}</Text>
      </Text>
      {email ? (
        <Text style={styles.bodyTight}>
          <Text style={styles.bold}>{labelPrefix} Email (optional): </Text>
          <Text style={styles.fieldValue}>{email}</Text>
        </Text>
      ) : null}
    </View>
  );
}

/**
 * Format an address from component fields. Hardened against state-duplication.
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
