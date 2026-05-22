/**
 * Important Information for Agent — verbatim § 752.051 statutory section.
 *
 * Sprint 4b.1 Round 2 — full restoration. Per attorney guidance across
 * two review rounds:
 *
 *   Round 1: "Texas statutory form includes a much longer 'Important
 *   Information for Agent' section. This is not just educational. It is
 *   product risk mitigation. Agents often misuse POAs because they do
 *   not understand that 'I can sign for Mom' does not mean 'I can move
 *   Mom's assets however I want.'"
 *
 *   Round 2: "Add the full agent-information section, or generate it as
 *   a mandatory attached 'Agent Duties and Acceptance' addendum."
 *
 * For this round, we append the full statutory text as the final section
 * before the Powered-By footer. A future enhancement (Sprint 4c) may move
 * this to a separate "Agent Duties and Acceptance" addendum page with an
 * optional agent-signature block.
 *
 * STATUTORY SOURCE
 *   Tex. Est. Code § 752.051 — "Agent's Duties" + "Termination of Agent's
 *   Authority" + "Liability of Agent" + closing fiduciary notice.
 *   Verified May 26, 2025 via texas.public.law.
 */

import { View, Text } from "@react-pdf/renderer";
import { styles, SIZES, COLORS } from "../styles";

const FIDUCIARY_INTRO =
  "When you accept the authority granted under this power of attorney, you " +
  "establish a \u201cfiduciary\u201d relationship with the principal. This is a " +
  "special legal relationship that imposes on you legal duties that continue " +
  "until you resign or the power of attorney is terminated, suspended, or " +
  "revoked by the principal or by operation of law. A fiduciary duty " +
  "generally includes the duty to:";

const FIDUCIARY_DUTIES = [
  "act in good faith;",
  "do nothing beyond the authority granted in this power of attorney;",
  "act loyally for the principal's benefit;",
  "avoid conflicts that would impair your ability to act in the principal's best interest; and",
  "disclose your identity as an agent when you act for the principal by writing or printing the name of the principal and signing your own name as \u201cagent\u201d in the following manner:",
];

const SIGNING_CONVENTION = "(Principal's Name) by (Your Signature) as Agent";

const ADDITIONAL_DUTIES_INTRO =
  "In addition, the Durable Power of Attorney Act (Subtitle P, Title 2, " +
  "Estates Code) requires you to:";

const ADDITIONAL_DUTIES = [
  "maintain records of each action taken or decision made on behalf of the principal;",
  "maintain all records until delivered to the principal, released by the principal, or discharged by a court; and",
  "if requested by the principal, provide an accounting to the principal that, unless otherwise directed by the principal or otherwise provided in the Special Instructions, must include:",
];

const ACCOUNTING_REQUIREMENTS = [
  "the property belonging to the principal that has come to your knowledge or into your possession;",
  "each action taken or decision made by you as agent;",
  "a complete account of receipts, disbursements, and other actions of you as agent that includes the source and nature of each receipt, disbursement, or action, with receipts of principal and income shown separately;",
  "a listing of all property over which you have exercised control that includes an adequate description of each asset and the asset's current value, if known to you;",
  "the cash balance on hand and the name and location of the depository at which the cash balance is kept;",
  "each known liability;",
  "any other information and facts known to you as necessary for a full and definite understanding of the exact condition of the property belonging to the principal; and",
  "all documentation regarding the principal's property.",
];

const TERMINATION_INTRO =
  "You must stop acting on behalf of the principal if you learn of any " +
  "event that terminates or suspends this power of attorney or your " +
  "authority under this power of attorney. An event that terminates this " +
  "power of attorney or your authority to act under this power of " +
  "attorney includes:";

const TERMINATION_EVENTS = [
  "the principal's death;",
  "the principal's revocation of this power of attorney or your authority;",
  "the occurrence of a termination event stated in this power of attorney;",
  "if you are married to the principal, the dissolution of your marriage by a court decree of divorce or annulment or declaration that your marriage is void, unless otherwise provided in this power of attorney;",
  "the appointment and qualification of a permanent guardian of the principal's estate unless a court order provides otherwise; or",
  "if ordered by a court, your removal as agent (attorney in fact) under this power of attorney.",
];

const TEMPORARY_GUARDIAN_NOTE =
  "An event that suspends this power of attorney or your authority to act " +
  "under this power of attorney is the appointment and qualification of a " +
  "temporary guardian unless a court order provides otherwise.";

const LIABILITY_NOTICE =
  "The authority granted to you under this power of attorney is specified " +
  "in the Durable Power of Attorney Act (Subtitle P, Title 2, Estates " +
  "Code). If you violate the Durable Power of Attorney Act or act beyond " +
  "the authority granted, you may be liable for any damages caused by the " +
  "violation or subject to prosecution for misapplication of property by a " +
  "fiduciary under Chapter 32 of the Texas Penal Code.";

const CLOSING_NOTICE =
  "THE AGENT, BY ACCEPTING OR ACTING UNDER THE APPOINTMENT, ASSUMES THE " +
  "FIDUCIARY AND OTHER LEGAL RESPONSIBILITIES OF AN AGENT.";

export function ImportantInformationForAgent() {
  return (
    <View break>
      <Text style={[styles.title, { fontSize: 14, marginBottom: 10 }]}>
        Important Information for Agent
      </Text>

      {/* Agent's Duties block */}
      <Text style={[styles.sectionHeading, { fontSize: 12, marginTop: 4 }]}>
        Agent's Duties
      </Text>

      <Text style={styles.body}>{FIDUCIARY_INTRO}</Text>

      <NumberedList items={FIDUCIARY_DUTIES} startAt={1} />

      <View
        style={{
          marginLeft: 36,
          marginBottom: SIZES.PARA_SPACING,
          padding: 6,
          borderLeftWidth: 1.5,
          borderLeftColor: "#999999",
        }}
      >
        <Text style={[styles.bodyTight, { fontFamily: "Times-Italic" }]}>
          {SIGNING_CONVENTION}
        </Text>
      </View>

      <Text style={styles.body}>{ADDITIONAL_DUTIES_INTRO}</Text>

      <NumberedList items={ADDITIONAL_DUTIES} startAt={1} />

      <View style={{ marginLeft: 18 }}>
        <LetteredList items={ACCOUNTING_REQUIREMENTS} startAt={"A"} />
      </View>

      {/* Termination of Agent's Authority */}
      <Text style={[styles.sectionHeading, { fontSize: 12 }]}>
        Termination of Agent's Authority
      </Text>

      <Text style={styles.body}>{TERMINATION_INTRO}</Text>

      <NumberedList items={TERMINATION_EVENTS} startAt={1} />

      <Text style={styles.body}>{TEMPORARY_GUARDIAN_NOTE}</Text>

      {/* Liability of Agent */}
      <Text style={[styles.sectionHeading, { fontSize: 12 }]}>
        Liability of Agent
      </Text>

      <Text style={styles.body}>{LIABILITY_NOTICE}</Text>

      <Text style={[styles.notice, { fontFamily: "Times-Bold", marginTop: SIZES.PARA_SPACING }]}>
        {CLOSING_NOTICE}
      </Text>
    </View>
  );
}

/**
 * Renders an inline numbered list (1) ... (2) ... etc with hanging-indent
 * style. Used for the agent duties, additional duties, and termination
 * events lists.
 */
function NumberedList({ items, startAt = 1 }) {
  return (
    <View style={{ marginLeft: 18, marginBottom: SIZES.PARA_SPACING }}>
      {items.map((item, idx) => (
        <View
          key={idx}
          style={{ flexDirection: "row", marginBottom: 3 }}
          wrap={false}
        >
          <Text style={{ width: 28, fontSize: SIZES.BODY }}>
            ({startAt + idx})
          </Text>
          <Text style={[styles.bodyTight, { flex: 1, marginBottom: 0 }]}>
            {item}
          </Text>
        </View>
      ))}
    </View>
  );
}

/**
 * Renders an inline lettered list (A) ... (B) ... etc with hanging-indent
 * style. Used for the accounting requirements sub-list.
 */
function LetteredList({ items, startAt = "A" }) {
  const startCharCode = startAt.charCodeAt(0);
  return (
    <View style={{ marginLeft: 18, marginBottom: SIZES.PARA_SPACING }}>
      {items.map((item, idx) => (
        <View
          key={idx}
          style={{ flexDirection: "row", marginBottom: 3 }}
          wrap={false}
        >
          <Text style={{ width: 28, fontSize: SIZES.BODY }}>
            ({String.fromCharCode(startCharCode + idx)})
          </Text>
          <Text style={[styles.bodyTight, { flex: 1, marginBottom: 0 }]}>
            {item}
          </Text>
        </View>
      ))}
    </View>
  );
}
