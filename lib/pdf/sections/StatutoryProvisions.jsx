/**
 * Statutory Provisions section — third-party reliance, termination,
 * indemnity, Texas-law governing clause.
 *
 * Sprint 4b.1 Round 2:
 *   - Removed the successor-agent statutory paragraph (now rendered as a
 *     clean Name / Address / Phone / Email block in Designation.jsx).
 *   - Retains the verbatim third-party reliance / termination /
 *     indemnity / Texas-law block from § 752.051.
 *
 * STATUTORY SOURCE
 *   Tex. Est. Code § 752.051 — "I agree that any third party..." paragraph.
 */

import { View, Text } from "@react-pdf/renderer";
import { styles } from "../styles";

export function StatutoryProvisions() {
  return (
    <View>
      <Text style={styles.body}>
        I agree that any third party who receives a copy of this document may
        act under it. Termination of this durable power of attorney is not
        effective as to a third party until the third party has actual
        knowledge of the termination. I agree to indemnify the third party for
        any claims that arise against the third party because of reliance on
        this power of attorney. The meaning and effect of this durable power
        of attorney is determined by Texas law.
      </Text>
    </View>
  );
}
