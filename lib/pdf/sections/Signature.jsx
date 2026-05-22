/**
 * Signature + Notary Acknowledgment section.
 *
 * Sprint 4b changes:
 *   - Two clearly-separate notary certificate variants: RON and in-person.
 *   - County of acknowledgment is BLANK in both cases (per attorney —
 *     this is the notary's venue, not the principal's residence county,
 *     and is properly filled by the notary at execution time).
 *   - RON variant uses statutory online-notarization language per
 *     Tex. Gov't Code Ch. 406 Subch. C.
 *   - In-person variant uses standard Texas acknowledgment per
 *     Tex. Gov't Code § 121.007.
 *   - Removed the principal-county auto-fill we did in the recent
 *     PDF cleanup patch — that was wrong (principal address county !=
 *     notary acknowledgment venue).
 *
 * Re: § 406.103 citation that your attorney flagged — Tex. Gov't Code
 * § 406.103 covers signing requirements for traditional notarial certificates.
 * The RON-specific statutory framework lives in § 406.101 (definitions),
 * § 406.103 (online notary commission), § 406.108 (online notarization
 * authority and process), and § 406.109 (electronic seal/signature
 * requirements). The cleanest correct citation here is § 406.108, which
 * defines the online notarization act itself.
 */

import { View, Text } from "@react-pdf/renderer";
import { styles, COLORS, SIZES } from "../styles";

const AGENT_FIDUCIARY_NOTICE =
  "THE AGENT, BY ACCEPTING OR ACTING UNDER THE APPOINTMENT, ASSUMES THE " +
  "FIDUCIARY AND OTHER LEGAL RESPONSIBILITIES OF AN AGENT.";

const DURABLE_POA_LIABILITY_NOTICE =
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
      <Text style={styles.body}>{DURABLE_POA_LIABILITY_NOTICE}</Text>
      <Text style={[styles.notice, { fontFamily: "Times-Bold" }]}>
        {AGENT_FIDUCIARY_NOTICE}
      </Text>

      <View wrap={false} style={{ marginTop: SIZES.SECTION_SPACING }}>
        <Text style={styles.body}>
          Signed this _____ day of _________________, ________.
        </Text>

        <View style={{ marginTop: 18 }}>
          <View style={styles.sigLine} />
          <Text style={styles.sigLineLabel}>
            Signature of Principal — {principalName}
          </Text>
        </View>
      </View>

      <NotaryBlock wizardState={wizardState} />
    </View>
  );
}

function NotaryBlock({ wizardState }) {
  const principalName = wizardState.principalFullLegalName || "____________";
  const executionMethod = wizardState.executionMethod || "ron";

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

      {/* State and county are BLANK — the notary fills these at execution
          time. The notary's county may not match the principal's county. */}
      <Text style={styles.bodyTight}>State of __________________________</Text>
      <Text style={[styles.bodyTight, { marginBottom: SIZES.PARA_SPACING }]}>
        County of _________________________
      </Text>

      {executionMethod === "ron" ? (
        // RON variant — exact online-notarization statutory framing
        <Text style={styles.body}>
          This document was acknowledged before me by means of an interactive
          two-way audio and video communication that meets the online
          notarization requirements under Subchapter C, Chapter 406, Texas
          Government Code, and rules adopted under that subchapter, on
          ________________ (date) by{" "}
          <Text style={styles.fieldValue}>{principalName}</Text>.
        </Text>
      ) : (
        // In-person variant — standard Texas acknowledgment language
        <Text style={styles.body}>
          This instrument was acknowledged before me on ________________ (date) by{" "}
          <Text style={styles.fieldValue}>{principalName}</Text>.
        </Text>
      )}

      <View style={{ marginTop: 24 }}>
        <View style={styles.sigLine} />
        <Text style={styles.sigLineLabel}>Signature of Notarial Officer</Text>
      </View>

      <View>
        <View style={styles.sigLine} />
        <Text style={styles.sigLineLabel}>Printed Name of Notary</Text>
      </View>

      <View>
        <View style={[styles.sigLine, { width: 220 }]} />
        <Text style={styles.sigLineLabel}>My Commission Expires</Text>
      </View>

      {executionMethod !== "ron" && (
        <View
          style={{
            marginTop: 8,
            width: 110,
            height: 110,
            borderWidth: 0.5,
            borderColor: "#999999",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 8.5, color: COLORS.GRAY, textAlign: "center" }}>
            (Seal of Notary, if any)
          </Text>
        </View>
      )}

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
          <Text style={[styles.bodyTight, styles.italic, { fontSize: 9.5 }]}>
            This notarial act was an online notarization. The electronic
            signature and seal of the online notary public are attached to and
            incorporated into this document by the online notarization platform
            pursuant to Tex. Gov't Code § 406.108 and § 406.109, together with
            the certificate of completion required under applicable Texas
            Secretary of State rules.
          </Text>
        </View>
      )}
    </View>
  );
}
