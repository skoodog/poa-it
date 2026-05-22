/**
 * Special Instructions + Tax-Protective Limitation section.
 *
 * Sprint 4b.1 Round 2 — restores two statutory sections that were missing:
 *
 *   1. General Special Instructions section (per § 752.051):
 *      "On the following lines you may give special instructions limiting
 *       or extending the powers granted to your agent."
 *      Per attorney guidance: "even if the consumer enters nothing, the
 *      output should show either blank lines or a generated sentence such
 *      as: 'No additional special instructions.'"
 *
 *   2. Tax-protective limitation clause (per the Texas sample statutory form):
 *      Protective estate/tax language that limits authority so the POA does
 *      not cause the agent to be taxed on the principal's income or cause
 *      the principal's assets to be subject to a general power of
 *      appointment by the agent. Per attorney: "This is not just a
 *      stylistic omission. It is a protective estate/tax concept embedded
 *      in the statutory form."
 *
 * Placement: between hot powers and effective date, matching the statutory
 * form's section ordering.
 */

import { View, Text } from "@react-pdf/renderer";
import { styles, SIZES } from "../styles";

// Tax-protective limitation language, drawn from the Texas Bar / commonly
// used Texas statutory form. This protects the principal's estate-tax
// position from agent-side actions that might trigger inclusion.
const TAX_PROTECTIVE_LIMITATION =
  "Notwithstanding any other provision of this power of attorney, my agent " +
  "shall not have any authority that would cause income earned by me to be " +
  "taxable to my agent, that would cause my assets to be subject to a general " +
  "power of appointment by my agent, or that would cause my agent's powers " +
  "to be considered a general power of appointment under federal tax law. " +
  "This limitation applies regardless of whether such authority would " +
  "otherwise be granted by the powers listed above or by any special " +
  "instructions in this power of attorney.";

export function SpecialInstructionsAndTaxLimitation({ wizardState }) {
  const specialInstructions = (wizardState.specialInstructions || "").trim();

  return (
    <View>
      {/* GENERAL SPECIAL INSTRUCTIONS */}
      <Text style={styles.sectionHeading}>Special Instructions</Text>

      <Text style={[styles.body, { fontFamily: "Times-Bold" }]}>
        ON THE FOLLOWING LINES YOU MAY GIVE SPECIAL INSTRUCTIONS LIMITING OR
        EXTENDING THE POWERS GRANTED TO YOUR AGENT.
      </Text>

      {specialInstructions ? (
        <View
          style={{
            padding: 12,
            borderWidth: 0.5,
            borderColor: "#666666",
            marginBottom: SIZES.PARA_SPACING,
          }}
        >
          <Text style={styles.bodyTight}>{specialInstructions}</Text>
        </View>
      ) : (
        <View
          style={{
            padding: 12,
            borderLeftWidth: 2,
            borderLeftColor: "#999999",
            marginBottom: SIZES.PARA_SPACING,
          }}
        >
          <Text style={[styles.bodyTight, styles.italic, { fontSize: 10.5 }]}>
            No additional special instructions.
          </Text>
        </View>
      )}

      {/* TAX-PROTECTIVE LIMITATION */}
      <Text style={[styles.body, { fontFamily: "Times-Bold", marginTop: SIZES.PARA_SPACING }]}>
        LIMITATION ON AGENT'S AUTHORITY
      </Text>
      <Text style={styles.body}>{TAX_PROTECTIVE_LIMITATION}</Text>
    </View>
  );
}
