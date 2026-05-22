/**
 * Effective Date section: when the POA becomes effective and how long it
 * remains in effect.
 *
 * Statutory framing from § 752.051. Two paths:
 *
 *   1. Immediate effectiveness with durability (most common). The agent can
 *      act starting today, and the POA remains valid through any future
 *      incapacity of the principal.
 *
 *   2. Springing — the POA becomes effective ONLY upon a future event
 *      (typically a physician's determination of incapacity). § 751.0021
 *      allows this but it adds friction at execution time because
 *      counterparties demand evidence the trigger occurred.
 *
 * Verbatim text comes from the clause library Phase 1 captured.
 */

import { View, Text } from "@react-pdf/renderer";
import { styles, SIZES } from "../styles";

const IMMEDIATE_DURABILITY_TEXT =
  "This power of attorney is effective immediately upon execution and " +
  "will continue until it is revoked. This power of attorney is NOT affected " +
  "by my subsequent disability or incapacity.";

const SPRINGING_TEXT =
  "This power of attorney becomes effective upon my disability or incapacity " +
  "as determined in writing by a licensed physician. Until such determination, " +
  "this power of attorney shall have no force or effect.";

export function EffectiveDate({ wizardState }) {
  const isSpringing = wizardState.effectivenessType === "springing";

  return (
    <View>
      <Text style={styles.sectionHeading}>Effective Date and Durability</Text>

      <Text style={styles.body}>
        UNLESS YOU DIRECT OTHERWISE IN THE SPACE BELOW, THIS POWER OF ATTORNEY
        IS EFFECTIVE IMMEDIATELY AND WILL CONTINUE UNTIL IT IS REVOKED. CHOOSE
        ONE OF THE FOLLOWING ALTERNATIVES BY CROSSING OUT THE ALTERNATIVE NOT
        CHOSEN:
      </Text>

      <View style={{ marginLeft: 18, marginBottom: SIZES.PARA_SPACING }}>
        <Text
          style={[
            styles.bodyTight,
            isSpringing ? { textDecoration: "line-through", opacity: 0.4 } : { fontFamily: "Times-Bold" },
          ]}
        >
          (1) This power of attorney is not affected by my subsequent disability or incapacity.
        </Text>

        <Text style={[styles.bodyTight, { marginTop: 4 }]}>OR</Text>

        <Text
          style={[
            styles.bodyTight,
            !isSpringing ? { textDecoration: "line-through", opacity: 0.4 } : { fontFamily: "Times-Bold" },
            { marginTop: 4 },
          ]}
        >
          (2) This power of attorney becomes effective upon my disability or
          incapacity as determined in writing by a licensed physician.
        </Text>
      </View>

      <Text style={[styles.body, styles.italic]}>
        {isSpringing ? SPRINGING_TEXT : IMMEDIATE_DURABILITY_TEXT}
      </Text>

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
            springing POA. This may slow time-sensitive transactions.
          </Text>
        </View>
      )}
    </View>
  );
}
