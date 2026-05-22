/**
 * Powers section — Tex. Est. Code § 752.051 statutory authority grant.
 *
 * Sprint 4b.1 Round 1 — visible initials per attorney guidance:
 *   "Render the principal's actual initials next to selected powers in
 *    the final PDF (not blank lines). Require a final execution
 *    acknowledgment that says the principal reviewed and approved all
 *    selected grants of authority and associated initials."
 *
 * Architecture:
 *   1. Plain-English "Authority Summary" block (modern product clarity)
 *   2. Formal statutory A–O grant table (institutional recognition)
 *   3. Visible initials beside selected powers (legal operativity)
 *   4. Execution acknowledgment text (affirmative-adoption requirement)
 *
 * Line (O) handling per statutory convention:
 *   - If user granted all-powers: ONLY (O) is initialed. A–N stay blank.
 *     This matches "If you initial line (O), you do not have to initial
 *     the line in front of any other power."
 *   - If user granted specific A–N powers: those lines initialed, (O) blank.
 *
 * Draft preview behavior:
 *   - Where actual initials would appear in execution-ready PDF, draft shows
 *     "[SELECTED]" placeholder text so reviewers understand the blanks are
 *     a draft artifact, not a grant failure.
 */

import { View, Text } from "@react-pdf/renderer";
import { styles, SIZES, COLORS } from "../styles";

const ALL_POWERS = [
  { letter: "A", key: "real_property", text: "Real property transactions;", summary: "Real property transactions" },
  { letter: "B", key: "tangible_personal_property", text: "Tangible personal property transactions;", summary: "Tangible personal property transactions" },
  { letter: "C", key: "stocks_and_bonds", text: "Stock and bond transactions;", summary: "Stock and bond transactions" },
  { letter: "D", key: "commodity_and_option", text: "Commodity and option transactions;", summary: "Commodity and option transactions" },
  { letter: "E", key: "banking_and_financial", text: "Banking and other financial institution transactions;", summary: "Banking and other financial institution transactions" },
  { letter: "F", key: "business_operating", text: "Business operating transactions;", summary: "Business operating transactions" },
  { letter: "G", key: "insurance_and_annuity", text: "Insurance and annuity transactions;", summary: "Insurance and annuity transactions" },
  { letter: "H", key: "estate_trust_beneficiary", text: "Estate, trust, and other beneficiary transactions;", summary: "Estate, trust, and other beneficiary transactions" },
  { letter: "I", key: "claims_and_litigation", text: "Claims and litigation;", summary: "Claims and litigation" },
  { letter: "J", key: "personal_and_family_maintenance", text: "Personal and family maintenance;", summary: "Personal and family maintenance" },
  { letter: "K", key: "government_benefits", text: "Benefits from social security, Medicare, Medicaid, or other governmental programs or civil or military service;", summary: "Benefits from social security, Medicare, Medicaid, or other governmental programs" },
  { letter: "L", key: "retirement_plan", text: "Retirement plan transactions;", summary: "Retirement plan transactions" },
  { letter: "M", key: "tax_matters", text: "Tax matters;", summary: "Tax matters" },
  { letter: "N", key: "digital_assets", text: "Digital assets and the content of an electronic communication;", summary: "Digital assets and the content of an electronic communication" },
  { letter: "O", key: "all_powers", text: "ALL OF THE POWERS LISTED IN (A) THROUGH (N). YOU DO NOT HAVE TO INITIAL THE LINE IN FRONT OF ANY OTHER POWER IF YOU INITIAL LINE (O).", summary: "All standard Texas financial powers" },
];

const A_THROUGH_N = ALL_POWERS.filter((p) => p.letter !== "O");

export function Powers({ wizardState, watermarked = true }) {
  const granted = new Set(wizardState.powersGranted || []);
  const initials = getInitials(wizardState.principalFullLegalName);
  const grantedAll = granted.has("all_powers");

  // Statutory convention: line (O) is a control state, not just another power.
  // If granted, ONLY (O) initials are rendered. A–N stay blank to match the
  // statutory instruction "you do not need to initial any other line."
  const renderInitialsFor = (powerKey) => {
    if (grantedAll) {
      return powerKey === "all_powers";
    }
    return granted.has(powerKey);
  };

  // Build the Authority Summary text — plain English of what was granted
  const summaryText = buildAuthoritySummary(granted, grantedAll);

  return (
    <View>
      {/* Co-agent disclosure removed in Sprint 4b.1 Round 3.
          Per attorney guidance: rendering "(YOU MAY APPOINT CO-AGENTS...)"
          is misleading when the product doesn't actually support multi-agent
          designation in the wizard. When co-agent support is added in a
          future sprint, the parenthetical will be restored along with
          actual co-agent input fields. */}

      {/* AUTHORITY SUMMARY — plain-English block before the statutory table.
          Per attorney guidance: "This is not a replacement for the statutory
          section. It is a reader aid." */}
      <View
        style={{
          padding: 12,
          backgroundColor: "#F7F7F7",
          borderLeftWidth: 2.5,
          borderLeftColor: COLORS.INK,
          marginTop: SIZES.PARA_SPACING,
          marginBottom: SIZES.SECTION_SPACING,
        }}
      >
        <Text
          style={{
            fontFamily: "Times-Bold",
            fontSize: 10,
            letterSpacing: 0.5,
            textTransform: "uppercase",
            color: COLORS.GRAY,
            marginBottom: 4,
          }}
        >
          Summary of Authority Granted
        </Text>
        <Text style={[styles.bodyTight, { fontSize: 10.5, marginBottom: 4 }]}>
          {summaryText}
        </Text>
      </View>

      <Text style={styles.sectionHeading}>Grant of Authority</Text>

      {/* Statutory grant instructions — verbatim § 752.051 */}
      <Text style={[styles.body, { fontFamily: "Times-Bold" }]}>
        TO GRANT ALL OF THE FOLLOWING POWERS, INITIAL THE LINE IN FRONT OF (O) AND IGNORE THE LINES IN FRONT OF THE OTHER POWERS LISTED IN (A) THROUGH (N).
      </Text>

      <Text style={[styles.body, { fontFamily: "Times-Bold" }]}>
        TO GRANT A POWER, YOU MUST INITIAL THE LINE IN FRONT OF THE POWER YOU ARE GRANTING.
      </Text>

      <Text style={[styles.body, { fontFamily: "Times-Bold" }]}>
        TO WITHHOLD A POWER, DO NOT INITIAL THE LINE IN FRONT OF THE POWER. YOU MAY, BUT DO NOT NEED TO, CROSS OUT EACH POWER WITHHELD.
      </Text>

      {/* The A-O grant table */}
      <View style={{ marginBottom: SIZES.PARA_SPACING, marginTop: 4 }}>
        {ALL_POWERS.map((power) => (
          <View key={power.key} style={styles.powerRow} wrap={false}>
            <InitialMark
              hasSelection={renderInitialsFor(power.key)}
              initials={initials}
              watermarked={watermarked}
            />
            <Text style={styles.letterLabel}>({power.letter})</Text>
            <Text style={styles.powerText}>{power.text}</Text>
          </View>
        ))}
      </View>

      {/* Execution acknowledgment — attorney-required affirmative adoption
          language per: "Require a final execution acknowledgment that says
          the principal reviewed and approved all selected grants of
          authority and associated initials." */}
      <View
        style={{
          padding: 10,
          borderLeftWidth: 2,
          borderLeftColor: "#999999",
          marginTop: SIZES.PARA_SPACING,
          marginBottom: SIZES.PARA_SPACING,
        }}
      >
        <Text style={[styles.bodyTight, styles.italic, { fontSize: 10.5 }]}>
          By signing this power of attorney, I, the Principal, confirm that I
          have reviewed each power initialed above and that the initials
          appearing beside each granted power were applied with my authorization
          and represent my affirmative selection. I adopt these initials as my
          own for purposes of this instrument.
        </Text>
      </View>

      {/* Special instructions free-text block — renders only if user provided */}
      <SpecialInstructionsSection wizardState={wizardState} />

      {/* Agent compensation — Sprint 4b.1 Round 3 restored. The wizard now
          captures this as an explicit choice (no silent default), so the
          PDF renders the user's selection with visible initials. */}
      <CompensationSection
        wizardState={wizardState}
        initials={getInitials(wizardState.principalFullLegalName)}
        watermarked={watermarked}
      />
    </View>
  );
}

/**
 * Agent compensation section — statutory § 752.051 block.
 * Now driven by wizardState.agentCompensation which the wizard captures
 * as an explicit user choice in Step 4.
 */
function CompensationSection({ wizardState, initials, watermarked }) {
  const compChoice = wizardState.agentCompensation || "";

  return (
    <View style={{ marginTop: SIZES.PARA_SPACING }} wrap={false}>
      <Text style={[styles.body, styles.italic, { fontSize: 10.5 }]}>
        Special instructions applicable to agent compensation (initial in front
        of one of the following sentences to have it apply; if no selection is
        made, each agent will be entitled to compensation that is reasonable
        under the circumstances):
      </Text>

      <View style={styles.powerRow} wrap={false}>
        <InitialMark
          hasSelection={compChoice === "reasonable"}
          initials={initials}
          watermarked={watermarked}
        />
        <Text style={styles.powerText}>
          My agent is entitled to reimbursement of reasonable expenses incurred
          on my behalf and to compensation that is reasonable under the circumstances.
        </Text>
      </View>

      <View style={styles.powerRow} wrap={false}>
        <InitialMark
          hasSelection={compChoice === "no_compensation"}
          initials={initials}
          watermarked={watermarked}
        />
        <Text style={styles.powerText}>
          My agent is entitled to reimbursement of reasonable expenses incurred
          on my behalf but shall receive no compensation for serving as my agent.
        </Text>
      </View>
    </View>
  );
}

/**
 * InitialMark — renders the initials box for one power line.
 *
 * Three states:
 *   1. Selected + execution-ready (not watermarked): stylized italic initials
 *      e.g., "JMD" in Times-Italic
 *   2. Selected + draft preview (watermarked): "[SELECTED]" placeholder
 *      so reviewers know it's not a grant failure
 *   3. Not selected: blank box (matches statutory layout)
 */
function InitialMark({ hasSelection, initials, watermarked }) {
  if (!hasSelection) {
    // Empty box — matches the statutory form layout where unselected powers
    // have a blank initial line
    return <View style={styles.initialBox} />;
  }

  if (watermarked) {
    // Draft preview — explicit placeholder so reviewers know blanks are
    // a draft artifact, not a defect. Per attorney: "[SELECTED] — initials
    // pending execution."
    return (
      <View
        style={[
          styles.initialBox,
          {
            backgroundColor: "#E8E8E8",
            alignItems: "center",
            justifyContent: "center",
          },
        ]}
      >
        <Text
          style={{
            fontSize: 6.5,
            fontFamily: "Helvetica-Bold",
            color: "#555555",
            letterSpacing: 0.3,
          }}
        >
          SELECTED
        </Text>
      </View>
    );
  }

  // Execution-ready PDF — render the actual initials
  return (
    <View
      style={[
        styles.initialBox,
        {
          alignItems: "center",
          justifyContent: "center",
        },
      ]}
    >
      <Text
        style={{
          fontFamily: "Times-Italic",
          fontSize: 10.5,
          color: COLORS.INK,
          letterSpacing: 0.5,
        }}
      >
        {initials || "—"}
      </Text>
    </View>
  );
}

/**
 * Special instructions free-text block. Renders only if the user provided
 * specific written instructions. The general "Special Instructions" section
 * required by the statute is handled elsewhere — this is for user-supplied
 * additional content.
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

/**
 * Build the plain-English authority summary text.
 *
 * Three cases:
 *   - All powers granted via (O): single sentence saying "all standard powers"
 *   - Specific powers granted: list them with "Principal does not grant
 *     authority over the unselected statutory subject matters" caveat
 *   - No powers granted: warning text (this should not be reachable in
 *     practice since the wizard blocks finalization, but defensive)
 */
function buildAuthoritySummary(granted, grantedAll) {
  if (grantedAll) {
    return (
      "The Principal grants the Agent broad authority over ALL standard " +
      "Texas statutory subject matters listed in (A) through (N) below. " +
      "This includes real property, personal property, banking, business, " +
      "insurance, estate matters, claims, family maintenance, government " +
      "benefits, retirement plans, taxes, and digital assets."
    );
  }

  const grantedPowers = A_THROUGH_N.filter((p) => granted.has(p.key));

  if (grantedPowers.length === 0) {
    return (
      "No standard powers have been selected. The Agent will not have " +
      "authority over any of the Texas statutory subject matters below. " +
      "(This document will not be signing-ready until at least one power " +
      "is granted.)"
    );
  }

  const list = grantedPowers.map((p) => p.summary.toLowerCase());
  let listText;
  if (list.length === 1) {
    listText = list[0];
  } else if (list.length === 2) {
    listText = `${list[0]} and ${list[1]}`;
  } else {
    listText = list.slice(0, -1).join("; ") + "; and " + list[list.length - 1];
  }

  return (
    `The Principal grants the Agent authority over the following Texas ` +
    `statutory subject matters: ${listText}. The Principal does not grant ` +
    `authority over the unselected statutory subject matters except as ` +
    `otherwise provided in this document.`
  );
}

/**
 * Generate principal's initials from full legal name.
 * - "Jane Doe" → "JD"
 * - "Jane M. Doe" → "JMD" (period stripped)
 * - "Jane Marie Doe" → "JMD"
 * - "Jane" → "J"
 * - "" → ""
 *
 * For names with 4+ words, takes first + last only ("Mary Anne Smith Jones"
 * → "MJ") to avoid initial strings longer than 3 letters.
 */
function getInitials(name) {
  if (!name) return "";
  // Strip periods and split on whitespace
  const cleaned = name.replace(/\./g, "").trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  if (parts.length === 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  if (parts.length === 3) {
    return (parts[0][0] + parts[1][0] + parts[2][0]).toUpperCase();
  }
  // 4+ words: first + last only
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
