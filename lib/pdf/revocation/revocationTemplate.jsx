/**
 * Texas Power of Attorney Revocation Instrument
 *
 * Sprint 4c — generates the legal instrument that revokes one or more
 * prior durable powers of attorney.
 *
 * STATUTORY FRAMEWORK
 *   Texas does not mandate a specific form for revocation. The relevant
 *   provisions are:
 *
 *   - Tex. Est. Code § 751.0021: durable POA must be a writing
 *   - Tex. Est. Code § 751.054: knowledge of termination of power
 *   - Tex. Est. Code § 751.058: revocation not effective as to third
 *       party until actual notice received
 *   - Tex. Est. Code § 751.134: revocation must be in writing and
 *       delivered to the agent and relevant third parties
 *
 *   The instrument needs: clear identification of the principal, clear
 *   identification of what is being revoked, unambiguous revocation
 *   language, signature, and acknowledgment (notarization strongly
 *   recommended for institutional acceptance even though not statutorily
 *   required for the revocation itself).
 *
 * STRUCTURE
 *   1. Title + jurisdiction badge
 *   2. Identification of principal
 *   3. Identification of the revoked instrument(s)
 *   4. Operative revocation language (scope-dependent)
 *   5. Effective-date statement + third-party notice paragraph
 *   6. Signature + notary acknowledgment
 *   7. Document Generation Certificate appendix
 */

import { Document, Page, Text, View, Image } from "@react-pdf/renderer";
import { styles, FONTS, SIZES, COLORS } from "../styles";
import { Watermark } from "../sections/Watermark";

function getLogoUrl() {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}/poa-it-logo.png`;
  }
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return `${process.env.NEXT_PUBLIC_SITE_URL}/poa-it-logo.png`;
  }
  return "https://poa-it.com/poa-it-logo.png";
}

export function RevocationDocument({ revocation, watermarked = true }) {
  const logoUrl = getLogoUrl();

  return (
    <Document
      title="Revocation of Texas Statutory Durable Power of Attorney"
      author="POA-IT"
      subject="Revocation of Power of Attorney under Tex. Est. Code §§ 751.058, 751.134"
      keywords="Texas, Power of Attorney, Revocation, Statutory, Durable"
    >
      <Page size="LETTER" style={styles.page}>
        {watermarked && <Watermark />}

        <Title />
        <PrincipalIdentification revocation={revocation} />
        <RevokedInstrumentIdentification revocation={revocation} />
        <OperativeRevocationLanguage revocation={revocation} />
        <EffectiveDateAndThirdPartyNotice revocation={revocation} />
        <Signature revocation={revocation} />
        <NotaryAcknowledgment revocation={revocation} />
        <RevocationGenerationCertificate
          revocation={revocation}
          watermarked={watermarked}
        />

        {/* End-of-document marker — same defensive pattern as the POA */}
        <EndOfDocumentMarker />

        <PoweredByMark logoUrl={logoUrl} />
        <PageNumber />
      </Page>
    </Document>
  );
}

// ===========================================================================
// SECTIONS
// ===========================================================================

function Title() {
  return (
    <View>
      <Text style={styles.title}>Revocation of Durable Power of Attorney</Text>
      <Text style={[styles.bodyTight, styles.italic, { textAlign: "center", marginBottom: SIZES.PARA_SPACING }]}>
        Executed under Tex. Est. Code §§ 751.058 and 751.134
      </Text>
    </View>
  );
}

function PrincipalIdentification({ revocation }) {
  const principalName = revocation.principalNameSnapshot || "____________";

  return (
    <View>
      <Text style={styles.sectionHeading}>Identification of Principal</Text>
      <Text style={styles.body}>
        I,{" "}
        <Text style={styles.fieldValue}>{principalName}</Text>
        , the Principal, being of sound mind and acting voluntarily, execute this
        instrument for the purpose of revoking, in whole or in part as described
        below, one or more durable powers of attorney previously executed by me.
      </Text>
    </View>
  );
}

function RevokedInstrumentIdentification({ revocation }) {
  const dateOfOriginal = revocation.originalPoaDateSnapshot
    ? formatDate(revocation.originalPoaDateSnapshot)
    : "____________";
  const documentId = revocation.originalPoaDocumentIdSnapshot || "____________";

  return (
    <View>
      <Text style={styles.sectionHeading}>Identification of Revoked Instrument</Text>
      <Text style={styles.body}>
        The durable power of attorney being revoked is identified as follows:
      </Text>
      <View style={{ marginLeft: 24, marginBottom: SIZES.PARA_SPACING }}>
        <Text style={styles.bodyTight}>
          <Text style={styles.bold}>Type: </Text>
          <Text style={styles.fieldValue}>Texas Statutory Durable Power of Attorney</Text>
        </Text>
        <Text style={styles.bodyTight}>
          <Text style={styles.bold}>Date of Execution: </Text>
          <Text style={styles.fieldValue}>{dateOfOriginal}</Text>
        </Text>
        <Text style={styles.bodyTight}>
          <Text style={styles.bold}>Document Identifier: </Text>
          <Text style={styles.fieldValue}>{documentId}</Text>
        </Text>
      </View>
    </View>
  );
}

function OperativeRevocationLanguage({ revocation }) {
  const scope = revocation.scope || "specific_poa";
  const revokedAgentName = revocation.revokedAgentName || "____________";

  return (
    <View>
      <Text style={styles.sectionHeading}>Operative Revocation</Text>

      {scope === "specific_poa" && (
        <Text style={styles.body}>
          I hereby <Text style={styles.bold}>REVOKE</Text> in its entirety the
          above-identified Texas Statutory Durable Power of Attorney. The agent
          and any successor agent named in that instrument no longer have any
          authority to act for me under it. All powers granted by the
          above-identified instrument are terminated effective as of the
          execution of this revocation, subject to the third-party notice
          provisions of Tex. Est. Code § 751.058.
        </Text>
      )}

      {scope === "all_prior" && (
        <Text style={styles.body}>
          I hereby <Text style={styles.bold}>REVOKE</Text> in its entirety the
          above-identified Texas Statutory Durable Power of Attorney, AND I
          further <Text style={styles.bold}>REVOKE</Text> any and all other
          durable powers of attorney for financial matters executed by me prior
          to the date of this instrument, whether or not specifically identified
          herein. No agent or successor agent named in any such prior instrument
          has any authority to act for me. All powers granted by all such
          instruments are terminated effective as of the execution of this
          revocation, subject to the third-party notice provisions of Tex. Est.
          Code § 751.058.
        </Text>
      )}

      {scope === "agent_only" && (
        <Text style={styles.body}>
          I hereby <Text style={styles.bold}>REVOKE</Text> the authority of{" "}
          <Text style={styles.fieldValue}>{revokedAgentName}</Text> to act as
          my agent under the above-identified Texas Statutory Durable Power of
          Attorney. The above-identified Power of Attorney otherwise remains
          in full force and effect, and any other named agent or successor
          agent retains the authority granted to them by the original
          instrument. The named individual's authority is terminated effective
          as of the execution of this revocation, subject to the third-party
          notice provisions of Tex. Est. Code § 751.058.
        </Text>
      )}
    </View>
  );
}

function EffectiveDateAndThirdPartyNotice({ revocation }) {
  return (
    <View>
      <Text style={styles.sectionHeading}>Effective Date and Third-Party Notice</Text>
      <Text style={styles.body}>
        This revocation is effective immediately upon my execution of this
        instrument. Pursuant to Tex. Est. Code § 751.058, however, this
        revocation is not effective as to any third party relying on the
        revoked instrument until that third party receives actual notice of
        this revocation.
      </Text>
      <Text style={styles.body}>
        I (or my representative) will deliver written notice of this
        revocation to the agent, any successor agent, and to such financial
        institutions, custodians, and other third parties as I deem necessary
        to give actual notice of this revocation. A record of notices given
        is maintained separately and forms part of the audit record of this
        revocation.
      </Text>
    </View>
  );
}

function Signature({ revocation }) {
  const principalName = revocation.principalNameSnapshot || "____________";

  return (
    <View wrap={false} style={{ marginTop: SIZES.SECTION_SPACING }}>
      <Text style={styles.body}>
        Signed this _____ day of _________________, ________.
      </Text>

      <View style={{ marginTop: 18 }}>
        <View style={styles.sigLine} />
        <Text style={styles.sigLineLabel}>Signature of Principal</Text>
      </View>

      <View>
        <View style={styles.sigLine} />
        <Text style={styles.sigLineLabel}>
          Printed Name of Principal — {principalName}
        </Text>
      </View>
    </View>
  );
}

function NotaryAcknowledgment({ revocation }) {
  const principalName = revocation.principalNameSnapshot || "____________";
  const executionMethod = revocation.executionMethod || "ron";
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
    </View>
  );
}

function RevocationGenerationCertificate({ revocation, watermarked }) {
  const principalName = revocation.principalNameSnapshot || "—";
  const dateOfOriginal = revocation.originalPoaDateSnapshot
    ? formatDate(revocation.originalPoaDateSnapshot)
    : "—";
  const originalId = revocation.originalPoaDocumentIdSnapshot || "—";
  const scope = formatScope(revocation);
  const documentStatus = watermarked ? "Draft Preview" : "Signing-Ready Copy";
  const generatedAt = new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC";
  const revocationId = String(revocation.id || "preview").slice(0, 16);
  const executionMethod =
    revocation.executionMethod === "ron"
      ? "Texas online notarization (RON)"
      : revocation.executionMethod === "in_person"
      ? "Texas in-person notarization"
      : "Not yet selected";

  return (
    <View break>
      <Text style={[styles.title, { fontSize: 14, marginBottom: 4 }]}>
        Revocation Generation Certificate
      </Text>
      <Text
        style={{
          fontFamily: FONTS.SANS,
          fontSize: 9,
          color: COLORS.GRAY,
          textAlign: "center",
          letterSpacing: 0.3,
          marginBottom: SIZES.SECTION_SPACING,
        }}
      >
        This certificate is generated by POA-IT to document the wizard
        selections embedded in this Revocation of Power of Attorney. It is
        metadata, not legal authority — the operative revocation appears
        earlier in this document.
      </Text>

      <CertField label="Document Status" value={documentStatus} highlight />
      <CertField label="Document Type" value="Revocation of Texas Statutory Durable Power of Attorney" />
      <CertField label="Jurisdiction" value="Texas" />
      <CertField label="Template Version" value="Texas POA Revocation v2026.05.22" />
      <CertSeparator />

      <CertField label="Principal" value={principalName} />
      <CertField label="Original POA Date" value={dateOfOriginal} />
      <CertField label="Original POA Identifier" value={originalId} mono />
      <CertSeparator />

      <CertField label="Revocation Scope" value={scope} multiline />
      {revocation.scope === "agent_only" && revocation.revokedAgentName && (
        <CertField label="Agent Whose Authority Is Revoked" value={revocation.revokedAgentName} />
      )}
      <CertSeparator />

      <CertField label="Execution Method" value={executionMethod} />
      <CertField label="Revocation ID" value={revocationId} mono />
      <CertField label="Generated At" value={generatedAt} mono />
      <CertField
        label="Document Hash (SHA-256)"
        value={watermarked ? "— (not computed for draft preview)" : "{{DOC_HASH_PLACEHOLDER}}"}
        mono
      />

      <View
        style={{
          marginTop: SIZES.SECTION_SPACING,
          padding: 10,
          backgroundColor: "#F7F7F7",
          borderLeftWidth: 2,
          borderLeftColor: "#999999",
        }}
      >
        <Text style={[styles.bodyTight, styles.italic, { fontSize: 9.5 }]}>
          Document integrity verification is handled by POA-IT. The final
          executed document will include or be associated with a SHA-256 hash
          generated after execution. For questions about verification, contact{" "}
          <Text style={{ fontFamily: FONTS.SANS_BOLD }}>support@poa-it.com</Text>.
        </Text>
      </View>
    </View>
  );
}

// ===========================================================================
// SHARED FOOTER COMPONENTS (replicated from main template — could be
// extracted to a shared module in a future refactor)
// ===========================================================================

function EndOfDocumentMarker() {
  return (
    <View
      style={{
        marginTop: SIZES.SECTION_SPACING * 1.5,
        paddingTop: 12,
        borderTopWidth: 0.5,
        borderTopColor: "#D4D4D8",
        alignItems: "center",
      }}
      wrap={false}
    >
      <Text
        style={{
          fontFamily: FONTS.SANS,
          fontSize: 9,
          color: COLORS.GRAY,
          letterSpacing: 1.5,
          textTransform: "uppercase",
        }}
      >
        — End of Document —
      </Text>
      <Text
        style={{
          fontFamily: FONTS.SANS,
          fontSize: 8,
          color: COLORS.GRAY,
          marginTop: 4,
          fontStyle: "italic",
        }}
      >
        Any blank page appearing after this marker is intentionally left blank.
      </Text>
    </View>
  );
}

function PoweredByMark({ logoUrl }) {
  return (
    <View
      fixed
      style={{
        position: "absolute",
        bottom: 22,
        right: SIZES.PAGE_MARGIN,
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
      }}
    >
      <Text
        style={{
          fontFamily: FONTS.SANS,
          fontSize: 7.5,
          color: COLORS.GRAY,
          letterSpacing: 0.3,
        }}
      >
        Powered by
      </Text>
      <Image src={logoUrl} style={{ width: 12, height: 12 }} />
      <Text
        style={{
          fontFamily: FONTS.SANS_BOLD,
          fontSize: 8.5,
          color: "#0A0A0A",
          letterSpacing: 0.3,
        }}
      >
        POA-IT
      </Text>
    </View>
  );
}

function PageNumber() {
  return (
    <Text
      fixed
      style={{
        position: "absolute",
        bottom: 22,
        left: SIZES.PAGE_MARGIN,
        fontFamily: FONTS.SANS,
        fontSize: 7.5,
        color: COLORS.GRAY,
        letterSpacing: 0.3,
      }}
      render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
    />
  );
}

// ===========================================================================
// HELPERS
// ===========================================================================

function CertField({ label, value, highlight, multiline, mono }) {
  const valueFontFamily = highlight
    ? "Times-Bold"
    : mono
    ? "Courier"
    : FONTS.SERIF;

  return (
    <View
      style={{
        flexDirection: multiline ? "column" : "row",
        marginBottom: 6,
        alignItems: multiline ? "flex-start" : "baseline",
      }}
      wrap={false}
    >
      <Text
        style={{
          fontFamily: FONTS.SANS_BOLD,
          fontSize: 9,
          color: COLORS.GRAY,
          letterSpacing: 0.5,
          textTransform: "uppercase",
          width: multiline ? "100%" : 180,
          marginBottom: multiline ? 3 : 0,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontFamily: valueFontFamily,
          fontSize: highlight ? 11 : 10,
          color: COLORS.INK,
          flex: multiline ? undefined : 1,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

function CertSeparator() {
  return (
    <View
      style={{
        borderBottomWidth: 0.5,
        borderBottomColor: "#D4D4D8",
        marginVertical: 8,
      }}
    />
  );
}

function formatDate(d) {
  if (!d) return "—";
  const date = new Date(d);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatScope(revocation) {
  const scope = revocation.scope;
  if (scope === "specific_poa") {
    return "Revokes the specific power of attorney identified above";
  }
  if (scope === "all_prior") {
    return "Revokes the identified power of attorney AND all other prior financial durable powers of attorney";
  }
  if (scope === "agent_only") {
    return `Revokes only the authority of the named agent (${revocation.revokedAgentName || "—"}); the original power of attorney otherwise remains in effect`;
  }
  return "—";
}
