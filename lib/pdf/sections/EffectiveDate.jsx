/**
 * Effective Date + Durability section.
 *
 * Sprint 4b changes:
 *   - Render only the selected alternative (no more "crossed out" alternative).
 *   - Clean execution summary block ("Effective: ... / Durability: ...").
 *   - Springing variant includes the statutory physician-determination
 *     language (§ 752.051 alternative B paragraph).
 *
 * Statutory source: Tex. Est. Code § 752.051 alternatives (A) and (B).
 */

import { View, Text } from "@react-pdf/renderer";
import { styles, SIZES } from "../styles";

export function EffectiveDate({ wizardState }) {
  const isSpringing = wizardState.effectivenessType === "springing";

  return (
    <View>
      <Text style={styles.sectionHeading}>Effective Date and Durability</Text>

      <Text style={styles.body}>
        UNLESS YOU DIRECT OTHERWISE BELOW, THIS POWER OF ATTORNEY IS EFFECTIVE
        IMMEDIATELY AND WILL CONTINUE UNTIL IT TERMINATES.
      </Text>

      {/* Clean execution summary — replaces the prior "alternatives with
          strikethrough" pattern. Renders only the user's selection. */}
      {!isSpringing ? (
        <View
          style={{
            padding: 12,
            borderLeftWidth: 2,
            borderLeftColor: "#0A0A0A",
            marginBottom: SIZES.PARA_SPACING,
          }}
        >
          <Text style={[styles.bodyTight, { fontFamily: "Times-Bold" }]}>
            (A) This power of attorney is not affected by my subsequent
            disability or incapacity.
          </Text>
        </View>
      ) : (
        <View
          style={{
            padding: 12,
            borderLeftWidth: 2,
            borderLeftColor: "#0A0A0A",
            marginBottom: SIZES.PARA_SPACING,
          }}
        >
          <Text style={[styles.bodyTight, { fontFamily: "Times-Bold" }]}>
            (B) This power of attorney becomes effective upon my disability or
            incapacity.
          </Text>
        </View>
      )}

      {/* Statutory physician-determination language — only renders for
          springing alternative per § 752.051 */}
      {isSpringing && (
        <Text style={[styles.body, styles.italic, { fontSize: 10.5 }]}>
          If Alternative (B) is chosen and a definition of my disability or
          incapacity is not contained in this power of attorney, I shall be
          considered disabled or incapacitated for purposes of this power of
          attorney if a physician certifies in writing at a date later than
          the date this power of attorney is executed that, based on the
          physician's medical examination of me, I am mentally incapable of
          managing my financial affairs. I authorize the physician who examines
          me for this purpose to disclose my physical or mental condition to
          another person for purposes of this power of attorney. A third party
          who accepts this power of attorney is fully protected from any action
          taken under this power of attorney that is based on the determination
          made by a physician of my disability or incapacity.
        </Text>
      )}

      {/* Springing UX caveat (preserved from prior implementation) — useful
          consumer-protection note that doesn't conflict with statutory text */}
      {isSpringing && (
        <View
          style={{
            padding: 8,
            borderLeftWidth: 2,
            borderLeftColor: "#999999",
            marginBottom: SIZES.PARA_SPACING,
            backgroundColor: "#F7F7F7",
          }}
        >
          <Text style={[styles.bodyTight, styles.italic, { fontSize: 10 }]}>
            Note: Counterparties such as banks and title companies typically
            require a physician's written certification before honoring a
            springing power of attorney. This may slow time-sensitive
            transactions.
          </Text>
        </View>
      )}
    </View>
  );
}
