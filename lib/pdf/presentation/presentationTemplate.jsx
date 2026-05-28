/**
 * Institution Presentation Packet — Combined PDF Template
 *
 * Generates the full 6-section packet per attorney's Sprint 4d MVP spec:
 *   1. Cover sheet — principal, agent, selected powers, effective date,
 *      revocation status, POA-IT verification contact
 *   2. Executed POA — placeholder for Sprint 4d R1 (will reference the
 *      original POA's stored PDF in R2)
 *   3. Agent certification — Tex. Est. Code § 751.203 statutory form
 *   4. Authority extract — institution-specific subset of granted powers
 *   5. Audit packet — execution timestamp, document ID, hash, status
 *   6. Response tracker — presented date, response deadline, accepted/rejected
 *
 * Sprint 4d Round 1.
 *
 * Note: this is the PACKET template. Each section can also be requested
 * individually via generatePresentationPdf({ section: "cover_sheet" }).
 */

import { Document, Page, Text, View, Image } from "@react-pdf/renderer";
import { styles, FONTS, SIZES, COLORS } from "../styles";
import { Watermark } from "../sections/Watermark";
import {
  getPowerByKey,
  getPowerDisplayName,
} from "../../taxonomy/poaTaxonomy";

// Sprint 4d.5: power formatting now sources from the canonical taxonomy.
// Returns the formatted "(LETTER) DisplayName" label, key as fallback.
function packetPowerLabel(key) {
  const p = getPowerByKey(key);
  if (!p) return key;
  return `(${p.letter}) ${p.displayName}`;
}

// Returns the consumer-friendly description for expanded power rows.
// Falls back to null if not in taxonomy (no description rendered).
function packetPowerDescription(key) {
  const p = getPowerByKey(key);
  return p?.plainEnglishExamples || null;
}

function getLogoUrl() {
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}/poa-it-logo.png`;
  if (process.env.NEXT_PUBLIC_SITE_URL) return `${process.env.NEXT_PUBLIC_SITE_URL}/poa-it-logo.png`;
  return "https://poa-it.com/poa-it-logo.png";
}

// =============================================================================
// MAIN DOCUMENT — full 6-section packet
// =============================================================================

export function PresentationPacketDocument({ presentation, watermarked = true }) {
  const logoUrl = getLogoUrl();

  return (
    <Document
      title="Institution Presentation Packet — Power of Attorney"
      author="POA-IT"
      subject="Texas Statutory Durable Power of Attorney — Institutional Acceptance Packet"
      keywords="Texas, Power of Attorney, Institution, Acceptance, Agent Certification"
    >
      {/* Section 1: Cover Sheet */}
      <Page size="LETTER" style={styles.page}>
        {watermarked && <Watermark />}
        <CoverSheet presentation={presentation} />
        <PoweredByMark logoUrl={logoUrl} />
        <PageNumber />
      </Page>

      {/* Section 2: Executed POA reference (R1 placeholder) */}
      <Page size="LETTER" style={styles.page}>
        {watermarked && <Watermark />}
        <ExecutedPoaPlaceholder presentation={presentation} />
        <PoweredByMark logoUrl={logoUrl} />
        <PageNumber />
      </Page>

      {/* Section 3: Agent Certification */}
      <Page size="LETTER" style={styles.page}>
        {watermarked && <Watermark />}
        <AgentCertification presentation={presentation} />
        <PoweredByMark logoUrl={logoUrl} />
        <PageNumber />
      </Page>

      {/* Section 4: Authority Extract */}
      <Page size="LETTER" style={styles.page}>
        {watermarked && <Watermark />}
        <AuthorityExtract presentation={presentation} />
        <PoweredByMark logoUrl={logoUrl} />
        <PageNumber />
      </Page>

      {/* Section 5: Audit Packet */}
      <Page size="LETTER" style={styles.page}>
        {watermarked && <Watermark />}
        <AuditPacket presentation={presentation} watermarked={watermarked} />
        <PoweredByMark logoUrl={logoUrl} />
        <PageNumber />
      </Page>

      {/* Section 6: Response Tracker */}
      <Page size="LETTER" style={styles.page}>
        {watermarked && <Watermark />}
        <ResponseTracker presentation={presentation} />
        <PoweredByMark logoUrl={logoUrl} />
        <PageNumber />
      </Page>
    </Document>
  );
}

// =============================================================================
// SECTION 1 — COVER SHEET
// =============================================================================

function CoverSheet({ presentation }) {
  const isRevoked = presentation.originalPoaStatus === "revoked";
  const isSuperseded = presentation.originalPoaStatus === "superseded";
  const statusBadgeStyle = isRevoked
    ? { bg: "#FEE2E2", color: "#991B1B", label: "REVOKED — DO NOT ACCEPT" }
    : isSuperseded
    ? { bg: "#FEF3C7", color: "#92400E", label: "SUPERSEDED" }
    : { bg: "#D1FAE5", color: "#065F46", label: "ACTIVE" };

  return (
    <View>
      <View style={{ alignItems: "center", marginBottom: SIZES.SECTION_SPACING }}>
        <Text
          style={{
            fontFamily: FONTS.SANS_BOLD,
            fontSize: 10,
            letterSpacing: 2,
            color: COLORS.GRAY,
            textTransform: "uppercase",
            marginBottom: 8,
          }}
        >
          Institution Presentation Packet
        </Text>
        <Text style={[styles.title, { fontSize: 20, marginBottom: 6 }]}>
          Texas Statutory Durable Power of Attorney
        </Text>
        <Text style={[styles.bodyTight, styles.italic, { fontSize: 11, color: COLORS.GRAY }]}>
          Prepared for institutional acceptance per Tex. Est. Code §§ 751.201–751.213
        </Text>
      </View>

      <PresentationTargetCard presentation={presentation} />

      <SectionHeading text="Principal" />
      <Text style={styles.body}>
        <Text style={styles.fieldValue}>{presentation.principalNameSnapshot || "—"}</Text>
      </Text>

      <SectionHeading text="Agent" />
      <Text style={styles.body}>
        <Text style={styles.fieldValue}>{presentation.agentNameSnapshot || "—"}</Text>
      </Text>
      {presentation.successorAgentNameSnapshot && (
        <Text style={styles.bodyTight}>
          <Text style={styles.bold}>Successor agent: </Text>
          <Text style={styles.fieldValue}>{presentation.successorAgentNameSnapshot}</Text>
        </Text>
      )}

      <SectionHeading text="Authority Relevant to This Presentation" />
      <PowersList powers={presentation.selectedPowers} />

      <SectionHeading text="Original Power of Attorney" />
      <View style={{ marginLeft: 24, marginBottom: SIZES.PARA_SPACING }}>
        <Text style={styles.bodyTight}>
          <Text style={styles.bold}>Effective date: </Text>
          {formatDate(presentation.originalPoaDateSnapshot)}
        </Text>
        <Text style={styles.bodyTight}>
          <Text style={styles.bold}>Document identifier: </Text>
          {presentation.originalPoaDocumentIdSnapshot || "—"}
        </Text>
        <Text style={[styles.bodyTight, { marginTop: 6 }]}>
          <Text style={styles.bold}>Current status: </Text>
          <Text
            style={{
              backgroundColor: statusBadgeStyle.bg,
              color: statusBadgeStyle.color,
              fontFamily: FONTS.SANS_BOLD,
              fontSize: 10,
              padding: "3 8",
              borderRadius: 3,
            }}
          >
            {" "}{statusBadgeStyle.label}{" "}
          </Text>
        </Text>
      </View>

      {(isRevoked || isSuperseded) && (
        <View
          style={{
            marginTop: 8,
            padding: 12,
            backgroundColor: "#FEE2E2",
            borderLeftWidth: 3,
            borderLeftColor: "#991B1B",
            borderRadius: 4,
          }}
        >
          <Text style={[styles.body, { fontFamily: FONTS.SANS_BOLD, color: "#991B1B", marginBottom: 4 }]}>
            DO NOT ACCEPT THIS POWER OF ATTORNEY
          </Text>
          <Text style={[styles.bodyTight, { color: "#991B1B" }]}>
            This Power of Attorney has been{" "}
            {isRevoked ? "formally revoked" : "superseded by a later instrument"}{" "}
            and is no longer valid for institutional acceptance. Acceptance after
            actual notice of revocation may expose the institution to liability per
            Tex. Est. Code § 751.058. If presented for acceptance, decline and refer
            the agent back to the principal.
          </Text>
        </View>
      )}

      <View
        style={{
          marginTop: SIZES.SECTION_SPACING,
          padding: 12,
          backgroundColor: "#F7F7F7",
          borderRadius: 4,
        }}
      >
        <Text
          style={{
            fontFamily: FONTS.SANS_BOLD,
            fontSize: 10,
            letterSpacing: 0.6,
            color: COLORS.GRAY,
            textTransform: "uppercase",
            marginBottom: 6,
          }}
        >
          Verification
        </Text>
        <Text style={[styles.bodyTight, { fontSize: 10.5 }]}>
          Authenticity of this packet and the underlying Power of Attorney can be
          verified at <Text style={styles.bold}>support@poa-it.com</Text> or{" "}
          <Text style={styles.bold}>https://poa-it.com/verify</Text> using the
          presentation identifier on the audit packet (Section 5).
        </Text>
      </View>
    </View>
  );
}

function PresentationTargetCard({ presentation }) {
  return (
    <View
      style={{
        padding: 14,
        backgroundColor: "#FAFAFA",
        borderWidth: 0.75,
        borderColor: COLORS.RULE,
        borderRadius: 6,
        marginBottom: SIZES.SECTION_SPACING,
      }}
    >
      <Text
        style={{
          fontFamily: FONTS.SANS_BOLD,
          fontSize: 9.5,
          letterSpacing: 0.6,
          color: COLORS.GRAY,
          textTransform: "uppercase",
          marginBottom: 6,
        }}
      >
        Presented to
      </Text>
      <Text style={[styles.body, { fontFamily: "Times-Bold", fontSize: 13, marginBottom: 4 }]}>
        {presentation.institutionName || "—"}
      </Text>
      {presentation.institutionContactName && (
        <Text style={[styles.bodyTight, { fontSize: 11 }]}>
          Attention: {presentation.institutionContactName}
        </Text>
      )}
      {(presentation.institutionAddress || presentation.institutionCity) && (
        <Text style={[styles.bodyTight, { fontSize: 11 }]}>
          {[
            presentation.institutionAddress,
            presentation.institutionCity,
            presentation.institutionState,
            presentation.institutionZip,
          ]
            .filter(Boolean)
            .join(", ")}
        </Text>
      )}
    </View>
  );
}

// =============================================================================
// SECTION 2 — EXECUTED POA (placeholder for R1)
// =============================================================================

function ExecutedPoaPlaceholder({ presentation }) {
  return (
    <View>
      <SectionHeading text="Section 2 — Executed Power of Attorney" />
      <View
        style={{
          marginTop: SIZES.PARA_SPACING,
          padding: 16,
          backgroundColor: "#FAFAFA",
          borderWidth: 0.75,
          borderColor: COLORS.RULE,
          borderRadius: 4,
        }}
      >
        <Text style={[styles.body, { fontFamily: FONTS.SANS_BOLD, fontSize: 11, marginBottom: 8 }]}>
          [PLACEHOLDER — Sprint 4d Round 1]
        </Text>
        <Text style={styles.bodyTight}>
          The full executed Texas Statutory Durable Power of Attorney is attached
          separately. Document identifier:{" "}
          <Text style={styles.bold}>
            {presentation.originalPoaDocumentIdSnapshot || "—"}
          </Text>
          .
        </Text>
        <Text style={[styles.bodyTight, { marginTop: 8 }]}>
          Sprint 4d Round 2 will inline the executed POA PDF here automatically. For
          now, request the executed copy from the agent or contact{" "}
          <Text style={styles.bold}>support@poa-it.com</Text> for direct retrieval.
        </Text>
      </View>
    </View>
  );
}

// =============================================================================
// SECTION 3 — AGENT CERTIFICATION (Tex. Est. Code § 751.203)
// =============================================================================

function AgentCertification({ presentation }) {
  const agentName = presentation.agentNameSnapshot || "[Agent name]";
  const principalName = presentation.principalNameSnapshot || "[Principal name]";

  return (
    <View>
      <SectionHeading text="Section 3 — Agent's Certification" />
      <Text style={[styles.bodyTight, styles.italic, { fontSize: 10.5, marginBottom: 12 }]}>
        Statutory form per Tex. Est. Code § 751.203. A certification made in
        compliance with § 751.203 is conclusive proof of the factual matter that is
        the subject of the certification.
      </Text>

      <Text style={[styles.title, { fontSize: 14, marginBottom: 6, textAlign: "center" }]}>
        Certification of Durable Power of Attorney by Agent
      </Text>

      <Text style={[styles.body, { marginTop: 8 }]}>
        I, <Text style={styles.fieldValue}>{agentName}</Text>, certify under penalty
        of perjury that:
      </Text>

      <NumberedItem n={1}>
        <Text style={styles.fieldValue}>{principalName}</Text> (the "Principal") is
        the principal who executed the durable power of attorney that designates me
        as agent.
      </NumberedItem>

      <NumberedItem n={2}>
        To the best of my knowledge, the Principal is not deceased.
      </NumberedItem>

      <NumberedItem n={3}>
        To the best of my knowledge, after diligent search and inquiry, at the time
        I exercise authority under the durable power of attorney:
        {"\n"}
        {"  "}(A) the power of attorney has not been revoked, terminated, or
        suspended; and{"\n"}
        {"  "}(B) my authority under the power of attorney has not been revoked,
        terminated, or suspended.
      </NumberedItem>

      <NumberedItem n={4}>
        If the durable power of attorney was executed in a manner that under the
        applicable law at the time of execution constituted a valid execution, the
        power of attorney is valid.
      </NumberedItem>

      <NumberedItem n={5}>
        I am the named agent in the power of attorney, or any successor agent named
        in the power of attorney who, by the terms of the power of attorney, is
        currently authorized to act because each predecessor agent has resigned,
        died, become incapacitated, is no longer qualified to serve, or has declined
        to serve.
      </NumberedItem>

      <NumberedItem n={6}>
        I, as the agent, expressly agree to act in accordance with the Principal's
        reasonable expectations to the extent actually known by me and, otherwise,
        in the Principal's best interest, in good faith, and only within the scope
        of authority granted by the Principal in the power of attorney.
      </NumberedItem>

      <NumberedItem n={7}>
        The power of attorney does/does not (circle one) become effective on the
        disability or incapacity of the Principal{" "}
        {presentation.poaIsSpringingType ? "" : "[immediately effective]"}.
      </NumberedItem>

      <Text style={[styles.body, { marginTop: 14 }]}>
        Signed this _____ day of _________________, ________.
      </Text>

      <View style={{ marginTop: 18 }}>
        <View style={styles.sigLine} />
        <Text style={styles.sigLineLabel}>Signature of Agent</Text>
      </View>

      <View>
        <View style={styles.sigLine} />
        <Text style={styles.sigLineLabel}>Printed Name — {agentName}</Text>
      </View>

      <View
        style={{
          marginTop: 16,
          padding: 10,
          backgroundColor: "#F7F7F7",
          borderRadius: 4,
        }}
      >
        <Text style={[styles.bodyTight, styles.italic, { fontSize: 9.5 }]}>
          This certification may be relied upon by the institution per Tex. Est.
          Code § 751.203(c). The institution is required to accept the durable
          power of attorney within seven business days after receiving this
          certification unless grounds for refusal exist under Tex. Est. Code §
          751.206.
        </Text>
      </View>
    </View>
  );
}

function NumberedItem({ n, children }) {
  return (
    <View style={{ flexDirection: "row", marginBottom: 8, marginLeft: 12 }}>
      <Text style={[styles.body, { width: 18, fontFamily: "Times-Bold" }]}>
        {n}.
      </Text>
      <Text style={[styles.body, { flex: 1 }]}>{children}</Text>
    </View>
  );
}

// =============================================================================
// SECTION 4 — AUTHORITY EXTRACT
// =============================================================================

function AuthorityExtract({ presentation }) {
  return (
    <View>
      <SectionHeading text="Section 4 — Authority Extract" />
      <Text style={[styles.bodyTight, styles.italic, { fontSize: 10.5, marginBottom: 12 }]}>
        The authority listed in this extract is the subset of the principal's full
        durable power of attorney that is relevant to{" "}
        <Text style={styles.bold}>
          {presentation.institutionName || "this institution"}
        </Text>
        . The full grant of authority appears in the executed Power of Attorney
        (Section 2).
      </Text>

      <Text style={[styles.body, { marginTop: 6 }]}>
        The agent named in this packet, <Text style={styles.fieldValue}>
          {presentation.agentNameSnapshot || "—"}
        </Text>, has authority to act on behalf of the principal,{" "}
        <Text style={styles.fieldValue}>{presentation.principalNameSnapshot || "—"}</Text>,
        in the following matters:
      </Text>

      <View style={{ marginTop: SIZES.PARA_SPACING, marginLeft: 24 }}>
        <PowersList powers={presentation.selectedPowers} expanded />
      </View>

      {presentation.customNotes?.length > 0 && (
        <>
          <SectionHeading text="Institution-Specific Notes" small />
          <View style={{ marginLeft: 24 }}>
            {presentation.customNotes.map((note, idx) => (
              <View key={idx} style={{ marginBottom: 10 }}>
                <Text style={styles.bodyTight}>
                  <Text style={styles.bold}>• </Text>
                  {note.text || note}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}

      <View
        style={{
          marginTop: SIZES.SECTION_SPACING,
          padding: 12,
          backgroundColor: "#F7F7F7",
          borderRadius: 4,
        }}
      >
        <Text style={[styles.bodyTight, styles.italic, { fontSize: 9.5 }]}>
          This extract is a convenience summary. The legally operative grant of
          authority is in the executed Power of Attorney itself (Section 2). In
          case of any conflict between this extract and the executed instrument,
          the executed instrument controls.
        </Text>
      </View>
    </View>
  );
}

// =============================================================================
// SECTION 5 — AUDIT PACKET
// =============================================================================

function AuditPacket({ presentation, watermarked }) {
  const generatedAt =
    new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC";
  const presentationId = String(presentation.id || "preview").slice(0, 16);

  return (
    <View>
      <SectionHeading text="Section 5 — Audit Packet" />
      <Text style={[styles.bodyTight, styles.italic, { fontSize: 10.5, marginBottom: 12 }]}>
        Metadata documenting the provenance, integrity, and current status of the
        underlying Power of Attorney. This packet is generated by POA-IT; it is
        not legal authority — the operative grant is in the executed Power of
        Attorney itself.
      </Text>

      <AuditRow
        label="Document Type"
        value="Texas Statutory Durable Power of Attorney"
      />
      <AuditRow
        label="Original POA Identifier"
        value={presentation.originalPoaDocumentIdSnapshot || "—"}
        mono
      />
      <AuditRow
        label="Original POA Effective Date"
        value={formatDate(presentation.originalPoaDateSnapshot)}
      />
      <AuditRow
        label="Original POA Status"
        value={formatStatus(presentation.originalPoaStatus)}
      />
      <AuditRow
        label="Original POA Execution Method"
        value={
          presentation.originalPoaExecutionMethod === "ron"
            ? "Texas online notarization (RON) per Tex. Gov't Code Chapter 406"
            : presentation.originalPoaExecutionMethod === "in_person"
            ? "Texas in-person notarization"
            : "—"
        }
      />
      <AuditSeparator />

      <AuditRow
        label="Presentation Identifier"
        value={presentationId}
        mono
      />
      <AuditRow
        label="Packet Generated At"
        value={generatedAt}
        mono
      />
      <AuditRow
        label="Document Hash (SHA-256)"
        value={
          watermarked
            ? "— (not computed for draft preview)"
            : "{{PACKET_HASH_PLACEHOLDER}}"
        }
        mono
      />
      <AuditRow
        label="Hash Algorithm"
        value="SHA-256"
      />

      <View
        style={{
          marginTop: SIZES.SECTION_SPACING,
          padding: 12,
          backgroundColor: "#F7F7F7",
          borderRadius: 4,
        }}
      >
        <Text style={[styles.bodyTight, styles.italic, { fontSize: 9.5 }]}>
          Document integrity verification: the SHA-256 hash above can be computed
          on the executed POA PDF and compared to the value stored by POA-IT to
          confirm the document has not been altered. To request hash verification,
          contact <Text style={styles.bold}>support@poa-it.com</Text> with the
          presentation identifier.
        </Text>
      </View>

      {presentation.originalPoaExecutionMethod === "ron" && (
        <View
          style={{
            marginTop: 12,
            padding: 10,
            backgroundColor: "#F7F7F7",
            borderRadius: 4,
          }}
        >
          <Text
            style={{
              fontFamily: FONTS.SANS_BOLD,
              fontSize: 9.5,
              color: COLORS.GRAY,
              textTransform: "uppercase",
              letterSpacing: 0.5,
              marginBottom: 4,
            }}
          >
            RON Audit Availability
          </Text>
          <Text style={[styles.bodyTight, { fontSize: 9.5 }]}>
            The original POA was executed via remote online notarization. The full
            notarization audit record (including audio-video recording,
            identity-verification documentation, and the online notary's electronic
            journal entry) is maintained by the online notarization platform and is
            available upon request per Tex. Gov't Code §§ 406.108–406.110 and
            applicable platform procedures.
          </Text>
        </View>
      )}
    </View>
  );
}

function AuditRow({ label, value, mono }) {
  return (
    <View
      style={{
        flexDirection: "row",
        marginBottom: 6,
        alignItems: "baseline",
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
          width: 200,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontFamily: mono ? "Courier" : FONTS.SERIF,
          fontSize: 10,
          color: COLORS.INK,
          flex: 1,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

function AuditSeparator() {
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

// =============================================================================
// SECTION 6 — RESPONSE TRACKER
// =============================================================================

function ResponseTracker({ presentation }) {
  return (
    <View>
      <SectionHeading text="Section 6 — Institution Response Tracker" />
      <Text style={[styles.bodyTight, styles.italic, { fontSize: 10.5, marginBottom: 12 }]}>
        This page captures the institution's response to the packet. Texas law
        establishes specific timeframes for institutional response after a POA is
        presented.
      </Text>

      <Text style={[styles.body, { fontFamily: "Times-Bold", fontSize: 12, marginBottom: 8 }]}>
        Statutory Response Timeframes
      </Text>

      <View style={{ marginLeft: 12 }}>
        <Text style={styles.bodyTight}>
          <Text style={styles.bold}>10 business days</Text> — Deadline for the
          institution to request an agent's certification under § 751.203 or
          opinion of counsel under § 751.204. (Tex. Est. Code § 751.201(b))
        </Text>
        <Text style={[styles.bodyTight, { marginTop: 6 }]}>
          <Text style={styles.bold}>5 business days</Text> — Deadline for the
          institution to request an English translation under § 751.205. (Tex.
          Est. Code § 751.201(b))
        </Text>
        <Text style={[styles.bodyTight, { marginTop: 6 }]}>
          <Text style={styles.bold}>7 business days</Text> — After receiving the
          requested certification, opinion, or translation, the institution must
          accept the POA. (Tex. Est. Code § 751.201(d))
        </Text>
        <Text style={[styles.bodyTight, { marginTop: 6 }]}>
          <Text style={styles.bold}>Refusal in writing</Text> — Any refusal to
          accept must be in writing and state the grounds. (Tex. Est. Code §
          751.207)
        </Text>
      </View>

      <SectionHeading text="Response Capture" small />

      <ResponseField label="Date packet presented" />
      <ResponseField label="Date institution responded" />
      <ResponseField label="Response (accepted / rejected / requested certification / requested opinion / requested translation / pending)" />
      <ResponseField label="If rejected, reason" multiline />
      <ResponseField label="If additional items requested, what" multiline />
      <ResponseField label="Institution representative name" />
      <ResponseField label="Institution representative contact" />

      <View
        style={{
          marginTop: SIZES.SECTION_SPACING,
          padding: 12,
          backgroundColor: "#F7F7F7",
          borderRadius: 4,
        }}
      >
        <Text style={[styles.bodyTight, styles.italic, { fontSize: 9.5 }]}>
          The response captured on this page should also be entered in the POA-IT
          workspace under this presentation's tracker. If the institution refuses
          acceptance, retain the written refusal and consider whether grounds
          under Tex. Est. Code § 751.206 actually apply. Wrongful refusal may give
          rise to a cause of action under § 751.212.
        </Text>
      </View>
    </View>
  );
}

function ResponseField({ label, multiline }) {
  return (
    <View style={{ marginBottom: multiline ? 18 : 10 }}>
      <Text
        style={{
          fontFamily: FONTS.SANS_BOLD,
          fontSize: 9,
          color: COLORS.GRAY,
          letterSpacing: 0.5,
          textTransform: "uppercase",
          marginBottom: 3,
        }}
      >
        {label}
      </Text>
      {multiline ? (
        <View>
          <View
            style={{
              borderBottomWidth: 0.5,
              borderBottomColor: COLORS.RULE,
              marginBottom: 6,
              paddingBottom: 8,
            }}
          />
          <View
            style={{
              borderBottomWidth: 0.5,
              borderBottomColor: COLORS.RULE,
              paddingBottom: 8,
            }}
          />
        </View>
      ) : (
        <View
          style={{
            borderBottomWidth: 0.5,
            borderBottomColor: COLORS.RULE,
            paddingBottom: 8,
          }}
        />
      )}
    </View>
  );
}

// =============================================================================
// SHARED COMPONENTS
// =============================================================================

function SectionHeading({ text, small }) {
  return (
    <Text
      style={{
        fontFamily: FONTS.SERIF_BOLD,
        fontSize: small ? 12 : 14,
        color: COLORS.INK,
        marginTop: SIZES.SECTION_SPACING,
        marginBottom: SIZES.PARA_SPACING,
        letterSpacing: 0.2,
      }}
    >
      {text}
    </Text>
  );
}

function PowersList({ powers, expanded }) {
  const granted = Array.isArray(powers) ? powers : [];

  if (granted.length === 0) {
    return (
      <Text style={[styles.bodyTight, styles.italic, { color: COLORS.GRAY }]}>
        No specific powers were selected for this presentation. The full Power of
        Attorney (Section 2) governs the agent's authority.
      </Text>
    );
  }

  return (
    <View>
      {granted.map((powerKey) => (
        <View
          key={powerKey}
          style={{ flexDirection: "row", marginBottom: expanded ? 8 : 4 }}
        >
          <Text style={[styles.body, { width: 16 }]}>•</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.body, { fontFamily: "Times-Bold" }]}>
              {packetPowerLabel(powerKey)}
            </Text>
            {expanded && packetPowerDescription(powerKey) && (
              <Text style={[styles.bodyTight, { fontSize: 10.5, marginTop: 2 }]}>
                {packetPowerDescription(powerKey)}
              </Text>
            )}
          </View>
        </View>
      ))}
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
      render={({ pageNumber, totalPages }) =>
        `Section ${pageNumber} of ${totalPages}`
      }
    />
  );
}

// =============================================================================
// POWER LABEL REGISTRY
// =============================================================================
// Sprint 4d.5: power labels and descriptions source from the canonical
// taxonomy module. Previously this file had its own POWER_LABELS hash
// (with a typo'd "personal_family_maintenance" key) and a partial
// POWER_DESCRIPTIONS hash that diverged from the taxonomy.

// =============================================================================
// HELPERS
// =============================================================================

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatStatus(status) {
  if (!status) return "—";
  return {
    active: "Active",
    generated: "Active (Generated)",
    signed: "Active (Signed)",
    notarized: "Active (Notarized)",
    delivered: "Active (Delivered)",
    revoked: "REVOKED",
    superseded: "SUPERSEDED",
  }[status] || status;
}
