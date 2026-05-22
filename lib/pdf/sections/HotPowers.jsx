/**
 * Hot Powers section — separate authorities requiring express grant under
 * Tex. Est. Code § 751.031(b).
 *
 * Sprint 4b.1 Round 1 — applies the visible-initials + draft state language
 * pattern to hot powers (matches Powers section behavior).
 *
 * Note: this is the LIGHTWEIGHT Round 1 version. Round 2 will rebuild this
 * as a full § 752.052 module rendering all five specific authorities with
 * the statutory caution language. For Round 1, we apply the visible-initials
 * pattern to whatever subset the wizard captured.
 *
 * Hot powers list per § 751.031(b):
 *   1. Make a gift (per § 751.032 limitations)
 *   2. Create, amend, revoke, or terminate an inter vivos trust
 *   3. Create or change rights of survivorship
 *   4. Create or change a beneficiary designation
 *   5. Authorize another person to exercise authority under this POA
 */

import { View, Text } from "@react-pdf/renderer";
import { styles, SIZES, COLORS } from "../styles";

const HOT_POWERS = [
  {
    key: "hot_power_gifts_default_limited",
    text: "Make a gift, subject to the limitations of Section 751.032 of the Durable Power of Attorney Act, unless I direct otherwise in a special instruction.",
  },
  {
    key: "hot_power_create_amend_trust",
    text: "Create, amend, revoke, or terminate an inter vivos trust.",
  },
  {
    key: "hot_power_rights_of_survivorship",
    text: "Create or change rights of survivorship.",
  },
  {
    key: "hot_power_beneficiary_designations",
    text: "Create or change a beneficiary designation.",
  },
  {
    key: "hot_power_delegate_authority",
    text: "Authorize another person to exercise the authority granted under this power of attorney.",
  },
];

export function HotPowers({ wizardState, watermarked = true }) {
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
        // Render only the granted hot powers, with visible initials
        <View style={{ marginBottom: SIZES.PARA_SPACING }}>
          {grantedPowers.map((power, idx) => (
            <View key={power.key} style={styles.powerRow} wrap={false}>
              <InitialMark hasSelection={true} initials={initials} watermarked={watermarked} />
              <Text style={styles.letterLabel}>({idx + 1})</Text>
              <Text style={styles.powerText}>{power.text}</Text>
            </View>
          ))}
        </View>
      ) : (
        // No hot powers granted — clean definitive statement
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

/**
 * Same InitialMark pattern as Powers.jsx — selected + watermarked shows
 * [SELECTED] placeholder; selected + final shows visible initials in
 * stylized italic; unselected shows blank box.
 */
function InitialMark({ hasSelection, initials, watermarked }) {
  if (!hasSelection) {
    return <View style={styles.initialBox} />;
  }

  if (watermarked) {
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

function getInitials(name) {
  if (!name) return "";
  const cleaned = name.replace(/\./g, "").trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  if (parts.length === 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  if (parts.length === 3) return (parts[0][0] + parts[1][0] + parts[2][0]).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
