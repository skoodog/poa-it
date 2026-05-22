/**
 * Signature + Notary section.
 *
 * Three components:
 *
 *   1. Principal signature line + date
 *   2. Agent fiduciary acceptance notice (statutory text)
 *   3. Notary acknowledgment block (full notarial certificate)
 *
 * The notary block follows the standard Texas form for acknowledgments
 * by an individual (Tex. Gov't Code § 121.007). When RON is used, the
 * notary's seal and identifying info are applied digitally by the RON
 * provider (Proof in Sprint 7) — this template just renders the standard
 * acknowledgment template ready to receive that mark.
 */

import { View, Text } from "@react-pdf/renderer";
import { styles, COLORS, SIZES } from "../styles";

const AGENT_FIDUCIARY_NOTICE =
  "THE AGENT, BY ACCEPTING OR ACTING UNDER THE APPOINTMENT, ASSUMES THE " +
  "FIDUCIARY AND OTHER LEGAL RESPONSIBILITIES OF AN AGENT.";

const DURABLE_POA_NOTICE =
  "The authority granted to you under this power of attorney is specified in " +
  "the Durable Power of Attorney Act (Subtitle P, Title 2, Estates Code). If " +
  "you violate the Durable Power of Attorney Act or act beyond the authority " +
  "granted, you may be liable for any damages caused by the violation or subject " +
  "to prosecution for misapplication of property by a fiduciary under Chapter 32 " +
  "of the Texas Penal Code.";

export function Signature({ wizardState }) {
  const principalName = wizardState.principalFullLegalName || "____________";

  return (
    <View>
      <Text style={styles.notice}>{AGENT_FIDUCIARY_NOTICE}</Text>
      <Text style={styles.body}>{DURABLE_POA_NOTICE}</Text>

      <View wrap={false} style={{ marginTop: SIZES.SECTION_SPACING }}>
        <Text style={styles.body}>
          Signed this _____ day of _________________, ________.
        </Text>

        <View style={{ marginTop: 18 }}>
          <View style={styles.sigLine} />
          <Text style={styles.sigLineLabel}>
            Signature of Principal ({principalName})
          </Text>
        </View>

        <View>
          <View style={styles.sigLine} />
          <Text style={styles.sigLineLabel}>Printed Name of Principal</Text>
        </View>
      </View>

      <NotaryBlock wizardState={wizardState} />
    </View>
  );
}

function NotaryBlock({ wizardState }) {
  const principalName = wizardState.principalFullLegalName || "____________";
  const executionMethod = wizardState.executionMethod || "ron";

  // Format county for display: wizard captures it as "TRAVIS" (uppercase) or
  // "Travis" — normalize to Title Case + " COUNTY" suffix per Texas convention
  const rawCounty = wizardState.principalCounty || "";
  const formattedCounty = rawCounty
    ? rawCounty.charAt(0).toUpperCase() + rawCounty.slice(1).toLowerCase()
    : "";

  return (
    <View
      wrap={false}
      style={{
        marginTop: SIZES.SECTION_SPACING,
        paddingTop: 12,
        borderTopWidth: 0.5,
        borderTopColor: COLORS.RULE,
      }}
    >
      <Text style={styles.sectionHeading}>Acknowledgment</Text>

      <Text style={styles.bodyTight}>STATE OF TEXAS</Text>
      <Text style={[styles.bodyTight, { marginBottom: SIZES.PARA_SPACING }]}>
        COUNTY OF{" "}
        {formattedCounty ? (
          <Text style={styles.fieldValue}>{formattedCounty.toUpperCase()}</Text>
        ) : (
          <Text>___________________</Text>
        )}
      </Text>

      {executionMethod === "ron" ? (
        <Text style={styles.body}>
          This document was acknowledged before me by means of an interactive
          two-way audio and video communication that meets the online
          notarization requirements under Subchapter C, Chapter 406, Texas
          Government Code, and rules adopted under that subchapter, on
          ________________ (date) by{" "}
          <Text style={styles.fieldValue}>{principalName}</Text>.
        </Text>
      ) : (
        <Text style={styles.body}>
          This instrument was acknowledged before me on ________________ (date) by{" "}
          <Text style={styles.fieldValue}>{principalName}</Text>.
        </Text>
      )}

      <View style={{ marginTop: 24 }}>
        <View style={styles.sigLine} />
        <Text style={styles.sigLineLabel}>Notary Public, State of Texas</Text>
      </View>

      <View>
        <View style={[styles.sigLine, { width: 180 }]} />
        <Text style={styles.sigLineLabel}>My commission expires</Text>
      </View>

      {executionMethod === "ron" && (
        <View
          style={{
            marginTop: 12,
            padding: 8,
            borderWidth: 0.5,
            borderColor: "#999999",
            backgroundColor: "#F7F7F7",
          }}
        >
          <Text style={[styles.bodyTight, styles.italic, { fontSize: 9 }]}>
            Electronic Notary Seal and Signature: Applied by the remote online
            notarization platform pursuant to Tex. Gov't Code § 406.103. The
            notary's electronic seal, signature, and certificate of completion
            are attached to and incorporated into this document.
          </Text>
        </View>
      )}
    </View>
  );
}
