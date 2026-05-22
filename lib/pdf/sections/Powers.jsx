/**
 * Powers section: the initial-each list of general powers under
 * Tex. Est. Code § 752.051.
 *
 * Sprint 4b changes (attorney review):
 *   - Replaced authority-selection instructions with statutory language
 *     ("To grant a power, you must initial the line in front of the power
 *     you are granting" — per current statutory form).
 *   - Updated (N) digital assets line to verbatim statutory wording.
 *   - Added co-agent disclosure language.
 *   - Added agent-compensation special instructions block.
 *   - Added co-agent coordination special instructions block.
 *   - Added gifts special-instructions block (statutory gift authority,
 *     separately initialed per § 751.031(b)(3)).
 *   - Special-instructions free-text block now shows clean numbered lines
 *     only when user provided content; otherwise just statutory framing.
 *
 * STATUTORY SOURCE
 *   Tex. Est. Code § 752.051 (current as of 2024 revision).
 *   Verified against: https://statutes.capitol.texas.gov/Docs/ES/htm/ES.752.htm
 */

import { View, Text } from "@react-pdf/renderer";
import { styles, SIZES } from "../styles";

const ALL_POWERS = [
  { letter: "A", key: "real_property", text: "Real property transactions;" },
  { letter: "B", key: "tangible_personal_property", text: "Tangible personal property transactions;" },
  { letter: "C", key: "stocks_and_bonds", text: "Stock and bond transactions;" },
  { letter: "D", key: "commodity_and_option", text: "Commodity and option transactions;" },
  { letter: "E", key: "banking_and_financial", text: "Banking and other financial institution transactions;" },
  { letter: "F", key: "business_operating", text: "Business operating transactions;" },
  { letter: "G", key: "insurance_and_annuity", text: "Insurance and annuity transactions;" },
  { letter: "H", key: "estate_trust_beneficiary", text: "Estate, trust, and other beneficiary transactions;" },
  { letter: "I", key: "claims_and_litigation", text: "Claims and litigation;" },
  { letter: "J", key: "personal_and_family_maintenance", text: "Personal and family maintenance;" },
  { letter: "K", key: "government_benefits", text: "Benefits from social security, Medicare, Medicaid, or other governmental programs or civil or military service;" },
  { letter: "L", key: "retirement_plan", text: "Retirement plan transactions;" },
  { letter: "M", key: "tax_matters", text: "Tax matters;" },
  // (N) is the line your attorney specifically flagged — verbatim statutory text now
  { letter: "N", key: "digital_assets", text: "Digital assets and the content of an electronic communication;" },
  { letter: "O", key: "all_powers", text: "ALL OF THE POWERS LISTED IN (A) THROUGH (N). YOU DO NOT HAVE TO INITIAL THE LINE IN FRONT OF ANY OTHER POWER IF YOU INITIAL LINE (O)." },
];

export function Powers({ wizardState }) {
  const granted = new Set(wizardState.powersGranted || []);
  const initials = getInitials(wizardState.principalFullLegalName);

  // Which powers get pre-filled initials in the PDF?
  // - If (O) is granted: all of A-N AND (O) itself are marked
  // - Otherwise: only the specifically granted powers are marked
  const isGranted = (powerKey) => {
    if (granted.has("all_powers")) return true;
    return granted.has(powerKey);
  };

  return (
    <View>
      {/* Co-agent disclosure — statutory parenthetical from § 752.051.
          Appears immediately after the designation paragraph (which lives
          in the Designation section) to match the canonical form layout. */}
      <Text style={[styles.body, { fontFamily: "Times-Bold" }]}>
        (YOU MAY APPOINT CO-AGENTS. UNLESS YOU PROVIDE OTHERWISE, CO-AGENTS MAY ACT INDEPENDENTLY.)
      </Text>

      <Text style={styles.sectionHeading}>Grant of Authority</Text>

      {/* Statutory grant instructions — replaces the prior incorrect "cross out
          to withhold" instruction. This is the critical 4b-1 fix. */}
      <Text style={[styles.body, { fontFamily: "Times-Bold" }]}>
        TO GRANT ALL OF THE FOLLOWING POWERS, INITIAL THE LINE IN FRONT OF (O) AND IGNORE THE LINES IN FRONT OF THE OTHER POWERS LISTED IN (A) THROUGH (N).
      </Text>

      <Text style={[styles.body, { fontFamily: "Times-Bold" }]}>
        TO GRANT A POWER, YOU MUST INITIAL THE LINE IN FRONT OF THE POWER YOU ARE GRANTING.
      </Text>

      <Text style={[styles.body, { fontFamily: "Times-Bold" }]}>
        TO WITHHOLD A POWER, DO NOT INITIAL THE LINE IN FRONT OF THE POWER. YOU MAY, BUT DO NOT NEED TO, CROSS OUT EACH POWER WITHHELD.
      </Text>

      {/* The list of powers A-O with initialing boxes */}
      <View style={{ marginBottom: SIZES.PARA_SPACING, marginTop: 4 }}>
        {ALL_POWERS.map((power) => (
          <View key={power.key} style={styles.powerRow} wrap={false}>
            <View style={styles.initialBox}>
              {isGranted(power.key) && (
                <Text style={{ fontSize: 9, textAlign: "center" }}>{initials}</Text>
              )}
            </View>
            <Text style={styles.letterLabel}>({power.letter})</Text>
            <Text style={styles.powerText}>{power.text}</Text>
          </View>
        ))}
      </View>

      {/* Agent compensation section — statutory addition (4b-4) */}
      <CompensationSection wizardState={wizardState} initials={initials} />

      {/* Co-agent coordination section — statutory addition (4b-4) */}
      <CoAgentSection wizardState={wizardState} initials={initials} />

      {/* Gifts section — separate from hot-power initialing per statute */}
      <GiftsSection wizardState={wizardState} initials={initials} />

      {/* Special instructions free-text block */}
      <SpecialInstructionsSection wizardState={wizardState} />
    </View>
  );
}

/**
 * Agent compensation — statutory § 752.051 section.
 * If the user didn't make a selection in the wizard, the form's default
 * applies ("each agent will be entitled to compensation that is reasonable
 * under the circumstances"). We still render the section so banks and
 * counterparties see the full statutory form.
 */
function CompensationSection({ wizardState, initials }) {
  const compChoice = wizardState.agentCompensation || ""; // "reasonable" | "no_compensation" | ""

  return (
    <View style={{ marginTop: SIZES.PARA_SPACING }} wrap={false}>
      <Text style={[styles.body, styles.italic, { fontSize: 10.5 }]}>
        Special instructions applicable to agent compensation (initial in front
        of one of the following sentences to have it apply; if no selection is
        made, each agent will be entitled to compensation that is reasonable
        under the circumstances):
      </Text>

      <View style={styles.powerRow} wrap={false}>
        <View style={styles.initialBox}>
          {compChoice === "reasonable" && (
            <Text style={{ fontSize: 9, textAlign: "center" }}>{initials}</Text>
          )}
        </View>
        <Text style={styles.powerText}>
          My agent is entitled to reimbursement of reasonable expenses incurred
          on my behalf and to compensation that is reasonable under the circumstances.
        </Text>
      </View>

      <View style={styles.powerRow} wrap={false}>
        <View style={styles.initialBox}>
          {compChoice === "no_compensation" && (
            <Text style={{ fontSize: 9, textAlign: "center" }}>{initials}</Text>
          )}
        </View>
        <Text style={styles.powerText}>
          My agent is entitled to reimbursement of reasonable expenses incurred
          on my behalf but shall receive no compensation for serving as my agent.
        </Text>
      </View>
    </View>
  );
}

/**
 * Co-agent coordination — statutory § 752.051 section.
 * Even when the user has only one agent (the typical case for our wizard),
 * this section is rendered so the document matches the statutory form
 * exactly. Default applies ("each agent will be entitled to act independently").
 */
function CoAgentSection({ wizardState, initials }) {
  const coAgentChoice = wizardState.coAgentCoordination || ""; // "independent" | "jointly" | "majority" | ""

  return (
    <View style={{ marginTop: SIZES.PARA_SPACING }} wrap={false}>
      <Text style={[styles.body, styles.italic, { fontSize: 10.5 }]}>
        Special instructions applicable to co-agents (if you have appointed
        co-agents to act, initial in front of one of the following sentences
        to have it apply; if no selection is made, each agent will be entitled
        to act independently):
      </Text>

      <View style={styles.powerRow} wrap={false}>
        <View style={styles.initialBox}>
          {coAgentChoice === "independent" && (
            <Text style={{ fontSize: 9, textAlign: "center" }}>{initials}</Text>
          )}
        </View>
        <Text style={styles.powerText}>
          Each of my co-agents may act independently for me.
        </Text>
      </View>

      <View style={styles.powerRow} wrap={false}>
        <View style={styles.initialBox}>
          {coAgentChoice === "jointly" && (
            <Text style={{ fontSize: 9, textAlign: "center" }}>{initials}</Text>
          )}
        </View>
        <Text style={styles.powerText}>
          My co-agents may act for me only if the co-agents act jointly.
        </Text>
      </View>

      <View style={styles.powerRow} wrap={false}>
        <View style={styles.initialBox}>
          {coAgentChoice === "majority" && (
            <Text style={{ fontSize: 9, textAlign: "center" }}>{initials}</Text>
          )}
        </View>
        <Text style={styles.powerText}>
          My co-agents may act for me only if a majority of the co-agents act jointly.
        </Text>
      </View>
    </View>
  );
}

/**
 * Gifts section — statutory § 752.051. This is the SEPARATE gift-power
 * initialing (different from the hot-powers gift authority in § 751.031).
 * The statutory framing places it within the general powers grant.
 *
 * The wizard captures this preference at wizardState.giftAuthorityGranted
 * (true if user wants to enable annual-exclusion gifts; false otherwise).
 */
function GiftsSection({ wizardState, initials }) {
  const giftsGranted = !!wizardState.giftAuthorityGranted;

  return (
    <View style={{ marginTop: SIZES.PARA_SPACING }} wrap={false}>
      <Text style={[styles.body, styles.italic, { fontSize: 10.5 }]}>
        Special instructions applicable to gifts (initial in front of the
        following sentence to have it apply):
      </Text>

      <View style={styles.powerRow} wrap={false}>
        <View style={styles.initialBox}>
          {giftsGranted && (
            <Text style={{ fontSize: 9, textAlign: "center" }}>{initials}</Text>
          )}
        </View>
        <Text style={styles.powerText}>
          I grant my agent the power to apply my property to make gifts outright
          to or for the benefit of a person, including by the exercise of a
          presently exercisable general power of appointment held by me, except
          that the amount of a gift to an individual may not exceed the amount
          of annual exclusions allowed from the federal gift tax for the
          calendar year of the gift.
        </Text>
      </View>
    </View>
  );
}

/**
 * Special instructions free-text block. Renders only if the user provided
 * specific written instructions in the wizard. The statutory form provides
 * lines for hand-writing additional limits/extensions; in the digital path,
 * we render the typed content if any, or omit the section if none.
 */
function SpecialInstructionsSection({ wizardState }) {
  const specialInstructions = (wizardState.specialInstructions || "").trim();
  if (!specialInstructions) return null;

  return (
    <View style={{ marginTop: SIZES.PARA_SPACING }} wrap={false}>
      <Text style={[styles.body, { fontFamily: "Times-Bold", fontSize: 10.5 }]}>
        ON THE FOLLOWING LINES YOU MAY GIVE SPECIAL INSTRUCTIONS LIMITING OR
        EXTENDING THE POWERS GRANTED TO YOUR AGENT.
      </Text>
      <View
        style={{
          padding: 10,
          borderWidth: 0.5,
          borderColor: "#666666",
          marginBottom: SIZES.PARA_SPACING,
        }}
      >
        <Text style={styles.bodyTight}>{specialInstructions}</Text>
      </View>
    </View>
  );
}

function getInitials(name) {
  if (!name) return "";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
