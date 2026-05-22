/**
 * Effective Date + Durability section.
 *
 * Sprint 4b.1 Round 2 — fixes the internal-consistency bug:
 *
 *   The prior draft said "Unless you direct otherwise below, this power of
 *   attorney is effective immediately..." but there was no actual "below"
 *   to direct otherwise. Per attorney: "If your product only supports
 *   immediate durable POAs, that is fine. But then the form should not
 *   suggest there is a choice below."
 *
 *   Our product DOES support both immediate and springing. The fix is to
 *   present the user's chosen alternative directly, without language
 *   pointing to alternatives that aren't actually there.
 *
 * Logic:
 *   - Immediate (default): Renders alternative (A) with the durability
 *     declaration.
 *   - Springing: Renders alternative (B) + the statutory physician-
 *     certification paragraph.
 *
 * In both cases, the visible text matches what was selected — no ambiguity
 * about which alternative is operative.
 */

import { View, Text } from "@react-pdf/renderer";
import { styles, SIZES } from "../styles";

export function EffectiveDate({ wizardState }) {
  const isSpringing = wizardState.effectivenessType === "springing";

  return (
    <View>
      <Text style={styles.sectionHeading}>Effective Date and Durability</Text>

      {!isSpringing ? (
        <>
          <Text style={styles.body}>
            This power of attorney is effective immediately upon execution and
            will continue until it terminates.
          </Text>

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
        </>
      ) : (
        <>
          <Text style={styles.body}>
            This power of attorney becomes effective only upon my disability or
            incapacity, as determined under the procedure described below.
          </Text>

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

          {/* Statutory physician-certification language — required by
              § 752.051 when alternative (B) is selected */}
          <Text style={[styles.body, styles.italic, { fontSize: 10.5 }]}>
            If a definition of my disability or incapacity is not contained in
            this power of attorney, I shall be considered disabled or
            incapacitated for purposes of this power of attorney if a physician
            certifies in writing at a date later than the date this power of
            attorney is executed that, based on the physician's medical
            examination of me, I am mentally incapable of managing my financial
            affairs. I authorize the physician who examines me for this purpose
            to disclose my physical or mental condition to another person for
            purposes of this power of attorney. A third party who accepts this
            power of attorney is fully protected from any action taken under
            this power of attorney that is based on the determination made by a
            physician of my disability or incapacity.
          </Text>

          {/* UX caveat preserved — useful consumer-protection note */}
          <View
            style={{
              padding: 8,
              borderLeftWidth: 2,
              borderLeftColor: "#999999",
              marginTop: SIZES.PARA_SPACING,
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
        </>
      )}
    </View>
  );
}
