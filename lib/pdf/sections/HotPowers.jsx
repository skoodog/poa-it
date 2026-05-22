/**
 * Hot Powers section — separate authorities requiring conscious affirmation
 * under Tex. Est. Code § 751.031(b).
 *
 * Sprint 4b changes:
 *   - Dynamic rendering: if no hot powers granted, shows clean
 *     "No specific authority under this section is granted." statement.
 *     If some granted, shows only granted ones with pre-filled initials.
 *   - Removed the static "(None of the above hot powers were initialed
 *     during preparation)" note that became false after manual signing.
 *
 * The five hot powers per § 751.031(b):
 *   1. Make a gift (per § 751.032 limitations)
 *   2. Create, amend, revoke, or terminate an inter vivos trust
 *   3. Create or change rights of survivorship
 *   4. Create or change a beneficiary designation
 *   5. Delegate authority granted under the power of attorney
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
    label: "Delegate authority granted under this power of attorney",
    text: "Authorize another person to exercise the authority granted under this power of attorney.",
  },
];

export function HotPowers({ wizardState }) {
  const granted = new Set(wizardState.hotPowersGranted || []);
  const initials = getInitials(wizardState.principalFullLegalName);
  const grantedPowers = HOT_POWERS.filter((p) => granted.has(p.key));
  const anyGranted = grantedPowers.length > 0;

  return (
    <View>
      <Text style={styles.sectionHeading}>Grant of Specific Authority</Text>

      <Text style={[styles.body, { fontFamily: "Times-Bold" }]}>
        FAILURE TO INITIAL ANY LINE BELOW MEANS YOUR AGENT WILL NOT HAVE THE
        AUTHORITY DESCRIBED IN THAT LINE.
      </Text>

      <Text style={styles.body}>
        My agent MAY NOT do any of the following acts for me UNLESS I have
        INITIALED the specific authority listed below:
      </Text>

      {anyGranted ? (
        // Render only the granted hot powers
        <View style={{ marginBottom: SIZES.PARA_SPACING }}>
          {grantedPowers.map((power, idx) => (
            <View key={power.key} style={styles.powerRow} wrap={false}>
              <View style={styles.initialBox}>
                <Text style={{ fontSize: 9, textAlign: "center" }}>{initials}</Text>
              </View>
              <Text style={styles.letterLabel}>({idx + 1})</Text>
              <Text style={styles.powerText}>{power.text}</Text>
            </View>
          ))}
        </View>
      ) : (
        // No hot powers granted — clean definitive statement (4b-5)
        <View
          style={{
            padding: 12,
            borderLeftWidth: 2,
            borderLeftColor: "#666666",
            marginTop: 4,
            marginBottom: SIZES.PARA_SPACING,
          }}
        >
          <Text style={[styles.bodyTight, { fontFamily: "Times-Bold" }]}>
            No specific authority under this section is granted.
          </Text>
          <Text style={[styles.bodyTight, styles.italic, { fontSize: 10, marginTop: 4 }]}>
            The agent has not been granted authority to make gifts, create or
            amend trusts, change rights of survivorship, change beneficiary
            designations, or delegate authority granted under this power of
            attorney.
          </Text>
        </View>
      )}
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
