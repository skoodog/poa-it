/**
 * Hot Powers section: powers that require SEPARATE initialing because they
 * carry heightened risk to the principal's estate. Under § 751.031(b), these
 * powers are NOT included in a general grant — they must be specifically
 * granted with separate, conscious affirmation.
 *
 * The five hot powers:
 *   1. Make gifts (subject to per-donee annual exclusion unless expanded)
 *   2. Create, amend, revoke, or terminate an inter vivos trust
 *   3. Create or change rights of survivorship
 *   4. Create or change a beneficiary designation
 *   5. Delegate authority granted under the power of attorney
 *
 * Each hot power has its own initialing line. If the principal didn't grant
 * a particular hot power, the line is left blank.
 */

import { View, Text } from "@react-pdf/renderer";
import { styles, SIZES } from "../styles";

const HOT_POWERS = [
  {
    key: "hot_power_gifts_default_limited",
    label: "Make a gift",
    text: "Make a gift, subject to the limitations of Section 751.032 of the Durable Power of Attorney Act, unless I direct otherwise in a special instruction.",
  },
  {
    key: "hot_power_create_amend_trust",
    label: "Create, amend, revoke, or terminate an inter vivos trust",
    text: "Create, amend, revoke, or terminate an inter vivos trust.",
  },
  {
    key: "hot_power_rights_of_survivorship",
    label: "Create or change rights of survivorship",
    text: "Create or change rights of survivorship.",
  },
  {
    key: "hot_power_beneficiary_designations",
    label: "Create or change a beneficiary designation",
    text: "Create or change a beneficiary designation.",
  },
  {
    key: "hot_power_delegate_authority",
    label: "Authorize another person to exercise the authority granted under this power of attorney",
    text: "Authorize another person to exercise the authority granted under this power of attorney.",
  },
];

export function HotPowers({ wizardState }) {
  const granted = new Set(wizardState.hotPowersGranted || []);
  const initials = getInitials(wizardState.principalFullLegalName);
  const anyGranted = HOT_POWERS.some((p) => granted.has(p.key));

  return (
    <View>
      <Text style={styles.sectionHeading}>Grant of Specific Authority (Optional)</Text>

      <Text style={styles.body}>
        My agent MAY NOT do any of the following acts for me UNLESS I have
        INITIALED the specific authority listed below:
      </Text>

      <View style={{ marginBottom: SIZES.PARA_SPACING }}>
        {HOT_POWERS.map((power, idx) => (
          <View key={power.key} style={styles.powerRow} wrap={false}>
            <View style={styles.initialBox}>
              {granted.has(power.key) && (
                <Text style={{ fontSize: 9, textAlign: "center" }}>{initials}</Text>
              )}
            </View>
            <Text style={styles.letterLabel}>({idx + 1})</Text>
            <Text style={styles.powerText}>{power.text}</Text>
          </View>
        ))}
      </View>

      {!anyGranted && (
        <Text style={[styles.body, styles.italic, { fontSize: 10 }]}>
          (None of the above hot powers were initialed during preparation. The
          agent will not have authority for any of these acts unless the
          principal initials one or more above prior to signing.)
        </Text>
      )}

      <Text style={styles.body}>
        FAILURE TO INITIAL ANY LINE ABOVE MEANS YOUR AGENT WILL NOT HAVE THE
        AUTHORITY DESCRIBED IN THAT LINE.
      </Text>
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
