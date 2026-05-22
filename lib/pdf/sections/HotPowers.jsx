/**
 * Grant of Specific Authority — verbatim Tex. Est. Code § 752.052 module.
 *
 * Sprint 4b.1 Round 2 — full restoration per attorney guidance:
 *   "Include the full § 752.052 optional module exactly or substantially
 *    exactly; or omit the 'Grant of Specific Authority' section entirely
 *    unless your product is intentionally offering one or more of those
 *    powers. Do not show a partial 'Grant of Specific Authority' section
 *    without the statutory caution language."
 *
 * This section renders the full statutory module: all five specific
 * authorities in the statutory order, the statutory CAUTION language, and
 * visible initials beside selected powers (matching the visible-initials
 * pattern from Round 1).
 *
 * STATUTORY SOURCE
 *   Tex. Est. Code § 752.052 (verified May 26, 2025 via texas.public.law)
 *
 * STATUTORY ORDER (do not reorder without attorney sign-off):
 *   1. Create, amend, revoke, or terminate an inter vivos trust
 *   2. Make a gift (per § 751.032 limitations + special instructions)
 *   3. Create or change rights of survivorship
 *   4. Create or change a beneficiary designation
 *   5. Authorize another person to exercise authority granted
 */

import { View, Text } from "@react-pdf/renderer";
import { styles, SIZES, COLORS } from "../styles";

// Sprint 4b.2 fix: keys now match the wizard's keys exactly. Prior version
// used long-form keys (e.g., hot_power_create_amend_trust) that the wizard
// never set, so granted hot powers never appeared initialed in the rendered
// PDF. Wizard keys are: hot_power_trust, hot_power_gifts, hot_power_survivorship,
// hot_power_beneficiary, hot_power_delegate.
const SPECIFIC_AUTHORITIES = [
  {
    key: "hot_power_trust",
    text: "Create, amend, revoke, or terminate an inter vivos trust.",
  },
  {
    key: "hot_power_gifts",
    text:
      "Make a gift, subject to the limitations of Section 751.032 of the " +
      "Durable Power of Attorney Act (Section 751.032, Estates Code) and any " +
      "special instructions in this power of attorney.",
  },
  {
    key: "hot_power_survivorship",
    text: "Create or change rights of survivorship.",
  },
  {
    key: "hot_power_beneficiary",
    text: "Create or change a beneficiary designation.",
  },
  {
    key: "hot_power_delegate",
    text: "Authorize another person to exercise the authority granted under this power of attorney.",
  },
];

const STATUTORY_CAUTION =
  "(CAUTION: Granting any of the following will give your agent the " +
  "authority to take actions that could significantly reduce your property " +
  "or change how your property is distributed at your death. INITIAL ONLY " +
  "the specific authority you WANT to give your agent. If you DO NOT want " +
  "to grant your agent one or more of the following powers, you may also " +
  "CROSS OUT a power you DO NOT want to grant.)";

export function HotPowers({ wizardState, watermarked = true }) {
  const granted = new Set(wizardState.hotPowersGranted || []);
  const initials = getInitials(wizardState.principalFullLegalName);
  const anyGranted = SPECIFIC_AUTHORITIES.some((p) => granted.has(p.key));

  return (
    <View>
      <Text style={styles.sectionHeading}>
        Grant of Specific Authority (Optional)
      </Text>

      <Text style={[styles.body, { fontFamily: "Times-Bold" }]}>
        My agent MAY NOT do any of the following specific acts for me UNLESS I
        have INITIALED the specific authority listed below:
      </Text>

      {/* Statutory CAUTION block — verbatim from § 752.052. Set apart visually
          to match its emphatic role in the form. */}
      <View
        style={{
          padding: 10,
          borderWidth: 0.75,
          borderColor: COLORS.INK,
          marginBottom: SIZES.PARA_SPACING,
        }}
      >
        <Text style={[styles.bodyTight, { fontFamily: "Times-Bold", fontSize: 10.5 }]}>
          {STATUTORY_CAUTION}
        </Text>
      </View>

      {/* The five specific authorities — always shown, regardless of whether
          any were granted. Visible initials beside any granted. */}
      <View style={{ marginBottom: SIZES.PARA_SPACING }}>
        {SPECIFIC_AUTHORITIES.map((authority) => (
          <View key={authority.key} style={styles.powerRow} wrap={false}>
            <InitialMark
              hasSelection={granted.has(authority.key)}
              initials={initials}
              watermarked={watermarked}
            />
            <Text style={styles.powerText}>{authority.text}</Text>
          </View>
        ))}
      </View>

      {/* If no specific authorities granted, render an unambiguous statement
          so a counterparty doesn't wonder whether something was withheld
          by accident. */}
      {!anyGranted && (
        <View
          style={{
            padding: 10,
            borderLeftWidth: 2,
            borderLeftColor: "#666666",
            marginBottom: SIZES.PARA_SPACING,
          }}
        >
          <Text style={[styles.bodyTight, styles.italic, { fontSize: 10.5 }]}>
            No specific authority under this section has been granted. The
            agent does not have authority to create, amend, revoke, or
            terminate an inter vivos trust; make a gift; create or change
            rights of survivorship; create or change a beneficiary designation;
            or authorize another person to exercise authority under this power
            of attorney.
          </Text>
        </View>
      )}
    </View>
  );
}

function InitialMark({ hasSelection, initials, watermarked }) {
  if (!hasSelection) {
    return <View style={styles.initialBox} />;
  }

  // Sprint 4b.2: actual initials render in both states. Draft preview
  // uses dimmed gray so unsigned state remains unmistakable while still
  // showing precisely which authorities were selected.
  const initialsColor = watermarked ? "#888888" : COLORS.INK;

  return (
    <View style={[styles.initialBox, { alignItems: "center", justifyContent: "center" }]}>
      <Text
        style={{
          fontFamily: "Times-Italic",
          fontSize: 10.5,
          color: initialsColor,
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
