/**
 * Signature + Notary Acknowledgment section.
 *
 * Sprint 4b.1 Round 2 changes:
 *   - Added printed-name line + explicit date line per attorney guidance:
 *     "include: Signature of Principal / Printed Name of Principal / Date"
 *   - Notary acknowledgment variants more clearly labeled (Texas in-person
 *     vs Texas online notarization)
 *   - For RON variant, "State of Texas" is pre-populated as venue since
 *     the Texas online notary must be physically located in Texas at the
 *     time of notarization
 *   - The notary's county remains blank (filled by notary at execution time)
 *
 * The Agent Fiduciary Notice and Liability Notice have been moved to the
 * full ImportantInformationForAgent section (per attorney "add full agent-
 * information section" requirement). This signature section is now focused
 * solely on execution mechanics.
 */

import { View, Text } from "@react-pdf/renderer";
import { styles, COLORS, SIZES } from "../styles";

export function Signature({ wizardState }) {
  const principalName = wizardState.principalFullLegalName || "____________";

  return (
    <View>
      <View wrap={false} style={{ marginTop: SIZES.SECTION_SPACING }}>
        <Text style={styles.body}>
          Signed this _____ day of _________________, ________.
        </Text>

        {/* Signature line */}
        <View style={{ marginTop: 18 }}>
          <View style={styles.sigLine} />
          <Text style={styles.sigLineLabel}>
            Signature of Principal
          </Text>
        </View>

        {/* Printed name line — required by attorney */}
        <View>
          <View style={styles.sigLine} />
          <Text style={styles.sigLineLabel}>
            Printed Name of Principal — {principalName}
          </Text>
        </View>

        {/* Sprint 4b.2 — removed redundant separate Date line. The
            "Signed this _____ day of _____________, ________." phrase
            above already captures execution date. Having both created
            ambiguity per attorney's third-round review. */}
      </View>

      <NotaryBlock wizardState={wizardState} />
    </View>
  );
}

function NotaryBlock({ wizardState }) {
  const principalName = wizardState.principalFullLegalName || "____________";
  const executionMethod = wizardState.executionMethod || "ron";
  const isRON = executionMethod === "ron";

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
      {/* Variant label so the reader immediately knows which packet
          this acknowledgment block belongs to */}
      <Text
        style={{
          fontFamily: "Helvetica-Bold",
          fontSize: 9,
          letterSpacing: 0.6,
          textTransform: "uppercase",
          color: COLORS.GRAY,
          marginBottom: 6,
        }}
      >
        {isRON
          ? "Texas Online Notarization — Acknowledgment"
          : "Texas In-Person Notarization — Acknowledgment"}
      </Text>

      <Text style={styles.sectionHeading}>Acknowledgment</Text>

      {/* Venue — for RON, default to Texas (statutory requirement that online
          notary be physically located in Texas). For in-person, leave blank
          so the notary's actual location can be entered. */}
      {isRON ? (
        <Text style={styles.bodyTight}>
          <Text style={styles.bold}>State of Texas</Text>
        </Text>
      ) : (
        <Text style={styles.bodyTight}>State of __________________________</Text>
      )}

      <Text style={[styles.bodyTight, { marginBottom: SIZES.PARA_SPACING }]}>
        County of _________________________
      </Text>

      {isRON ? (
        <Text style={styles.body}>
          This notarial act was an online notarization. This document was
          acknowledged before me by means of an interactive two-way audio and
          video communication that meets the online notarization requirements
          under Subchapter C, Chapter 406, Texas Government Code, and rules
          adopted under that subchapter, on ________________ (date) by{" "}
          <Text style={styles.fieldValue}>{principalName}</Text>.
        </Text>
      ) : (
        <Text style={styles.body}>
          This instrument was acknowledged before me on ________________ (date)
          by <Text style={styles.fieldValue}>{principalName}</Text>.
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

      {!isRON && (
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

      {isRON && (
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
            The electronic signature and seal of the online notary public are
            attached to and incorporated into this document by the online
            notarization platform pursuant to Tex. Gov't Code § 406.108 and
            § 406.109, together with any electronic journal, audit record,
            audio-video recording, identity-verification record, or platform
            certificate maintained or generated as required or permitted by
            applicable Texas law and platform procedures.
          </Text>
        </View>
      )}
    </View>
  );
}
