/**
 * Powers section: the initial-each list of general powers under § 752.051.
 *
 * Per the statute, the principal initials EACH power they wish to grant
 * (or initials (O) to grant all). On a printed form, each line has a blank
 * for the principal's initials.
 *
 * In the generated PDF, we render:
 *   - The principal's initials box (pre-filled with their wizard answer
 *     for selected powers, blank for unselected)
 *   - The letter label (A through N for the 14 individual powers, plus O
 *     for "all of the above")
 *   - The statutory power name (verbatim from § 752.051)
 *
 * Powers list per § 752.051:
 *   (A) Real property transactions
 *   (B) Tangible personal property transactions
 *   (C) Stock and bond transactions
 *   (D) Commodity and option transactions
 *   (E) Banking and other financial institution transactions
 *   (F) Business operating transactions
 *   (G) Insurance and annuity transactions
 *   (H) Estate, trust, and other beneficiary transactions
 *   (I) Claims and litigation
 *   (J) Personal and family maintenance
 *   (K) Benefits from social security, medicare, medicaid, or other
 *       governmental programs or civil or military service
 *   (L) Retirement plan transactions
 *   (M) Tax matters
 *   (N) Digital asset transactions
 *   (O) All of the above
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
  { letter: "K", key: "government_benefits", text: "Benefits from social security, medicare, medicaid, or other governmental programs or civil or military service;" },
  { letter: "L", key: "retirement_plan", text: "Retirement plan transactions;" },
  { letter: "M", key: "tax_matters", text: "Tax matters;" },
  { letter: "N", key: "digital_assets", text: "Digital asset transactions;" },
  { letter: "O", key: "all_powers", text: "ALL OF THE POWERS LISTED ABOVE." },
];

export function Powers({ wizardState }) {
  const granted = new Set(wizardState.powersGranted || []);
  // If the principal selected "all_powers", that single initialing covers
  // all of A–N. We still pre-fill the (O) line in that case.

  // Pre-fill is just the principal's first/last initials when known.
  // The form is signed in person/RON, so the initials are actually
  // hand-applied — our pre-fill is a typographic helper, not a substitute.
  const initials = getInitials(wizardState.principalFullLegalName);

  return (
    <View>
      <Text style={styles.sectionHeading}>Grant of Authority</Text>

      <Text style={styles.body}>
        TO WITHHOLD A POWER, YOU MUST CROSS OUT EACH POWER WITHHELD.
      </Text>

      <Text style={styles.body}>
        I grant my agent (also known as my attorney in fact) authority to act
        for me in any lawful way with respect to the following initialed
        subjects:
      </Text>

      <View style={{ marginBottom: SIZES.PARA_SPACING }}>
        {ALL_POWERS.map((power) => (
          <View key={power.key} style={styles.powerRow} wrap={false}>
            <View style={styles.initialBox}>
              {(granted.has(power.key) || (granted.has("all_powers") && power.key !== "all_powers")) && (
                <Text style={{ fontSize: 9, textAlign: "center" }}>{initials}</Text>
              )}
            </View>
            <Text style={styles.letterLabel}>({power.letter})</Text>
            <Text style={styles.powerText}>{power.text}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.body}>
        SPECIAL INSTRUCTIONS APPLICABLE TO AGENT (OPTIONAL): You may give
        special instructions on the following lines limiting or extending the
        powers granted to your agent.
      </Text>

      <SpecialInstructionsLines wizardState={wizardState} />
    </View>
  );
}

function SpecialInstructionsLines({ wizardState }) {
  // If the user provided special instructions in the wizard, render them.
  // Otherwise, render three blank lines for hand-writing.
  const specialInstructions = wizardState.specialInstructions || "";

  if (specialInstructions.trim()) {
    return (
      <View
        style={{
          padding: 8,
          borderWidth: 0.5,
          borderColor: "#999999",
          marginBottom: SIZES.PARA_SPACING,
        }}
      >
        <Text style={styles.bodyTight}>{specialInstructions}</Text>
      </View>
    );
  }

  return (
    <View style={{ marginBottom: SIZES.PARA_SPACING }}>
      <View style={{ borderBottomWidth: 0.5, borderBottomColor: "#000", height: 18, marginBottom: 6 }} />
      <View style={{ borderBottomWidth: 0.5, borderBottomColor: "#000", height: 18, marginBottom: 6 }} />
      <View style={{ borderBottomWidth: 0.5, borderBottomColor: "#000", height: 18, marginBottom: 6 }} />
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
