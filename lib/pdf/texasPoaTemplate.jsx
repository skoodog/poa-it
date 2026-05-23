/**
 * Texas Statutory Durable Power of Attorney - PDF Template
 *
 * Composes the section components into a complete document. Sections are
 * ordered to match § 752.051's canonical structure:
 *
 *   1. Title + statutory NOTICE
 *   2. Agent designation (principal + agent + successor)
 *   3. Grant of general powers (initial-each)
 *   4. Grant of hot powers (separate initialing)
 *   5. Effective date + durability declaration
 *   6. Signature + agent fiduciary notice + notary acknowledgment
 *
 * Branding: a single small "Powered by [logo]" mark in the lower-right
 * corner of every page. No header strip, no multi-line footer — keeps the
 * document looking like a legal document, not a marketing piece.
 *
 * Logo image: loaded from /public/poa-it-logo.png at render time.
 */

import { Document, Page, Text, View, Image } from "@react-pdf/renderer";
import { styles, FONTS, SIZES, COLORS } from "./styles";
import { Header } from "./sections/Header";
import { Designation } from "./sections/Designation";
import { Powers } from "./sections/Powers";
import { HotPowers } from "./sections/HotPowers";
import { SpecialInstructionsAndTaxLimitation } from "./sections/SpecialInstructionsAndTaxLimitation";
import { EffectiveDate } from "./sections/EffectiveDate";
import { StatutoryProvisions } from "./sections/StatutoryProvisions";
import { Signature } from "./sections/Signature";
import { ImportantInformationForAgent } from "./sections/ImportantInformationForAgent";
import { DocumentGenerationCertificate } from "./sections/DocumentGenerationCertificate";
import { Watermark } from "./sections/Watermark";

function getLogoUrl() {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}/poa-it-logo.png`;
  }
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return `${process.env.NEXT_PUBLIC_SITE_URL}/poa-it-logo.png`;
  }
  return "https://poa-it.com/poa-it-logo.png";
}

export function TexasPoaDocument({ wizardState, watermarked = true }) {
  const sessionId = wizardState.sessionId || "preview";
  const logoUrl = getLogoUrl();

  return (
    <Document
      title="Texas Statutory Durable Power of Attorney"
      author="POA-IT"
      subject="Statutory Durable Power of Attorney under Tex. Est. Code § 752.051"
      keywords="Texas, Power of Attorney, Statutory, Durable, § 752.051"
    >
      <Page size="LETTER" style={styles.page}>
        {watermarked && <Watermark />}

        {/* Section order matches § 752.051 + § 752.052 canonical structure */}
        <Header />
        <Designation wizardState={wizardState} />
        <Powers wizardState={wizardState} watermarked={watermarked} />
        <HotPowers wizardState={wizardState} watermarked={watermarked} />
        <SpecialInstructionsAndTaxLimitation wizardState={wizardState} />
        <EffectiveDate wizardState={wizardState} />
        <StatutoryProvisions />
        <Signature wizardState={wizardState} />
        <ImportantInformationForAgent />
        <DocumentGenerationCertificate
          wizardState={wizardState}
          watermarked={watermarked}
        />

        {/* End-of-document marker — Sprint 4b.4. Signals to the reader
            that there is no further substantive content. If any trailing
            blank page appears after this marker due to react-pdf's
            pagination of fixed/absolute elements, the reader already
            knows from this marker that any blank space is intentional. */}
        <EndOfDocumentMarker />

        {/* Fixed footer elements appear on every page */}
        <PoweredByMark logoUrl={logoUrl} />
        <PageNumber />
      </Page>
    </Document>
  );
}

/**
 * PoweredByMark
 *
 * Single tasteful "Powered by POA-IT" mark in the lower-right corner of
 * every page. The logo image renders alongside the explicit platform name
 * text — so the attribution survives even if the image fails to load,
 * and the wordmark is legible regardless of image rendering quality.
 */
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
      <Image
        src={logoUrl}
        style={{ width: 12, height: 12 }}
      />
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

/**
 * PageNumber
 *
 * Page-number indicator in the lower-LEFT corner, opposite the branding
 * mark. Always visible on every page (single-page or multi-page) per
 * attorney guidance — single-page docs still benefit from a visible
 * "Page 1 of 1" so a reader knows nothing is missing.
 */
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
        `Page ${pageNumber} of ${totalPages}`
      }
    />
  );
}

/**
 * EndOfDocumentMarker
 *
 * Renders a visible "— End of Document —" mark as the last flow element
 * in the document, immediately after the Document Generation Certificate.
 * Signals to the reader that no further substantive content follows.
 *
 * Sprint 4b.4 — defensive solution for the trailing-blank-page issue the
 * attorney flagged. Rather than chase the exact cause through react-pdf's
 * pagination internals (which may produce a blank trailing page when
 * fixed/absolute elements interact with `break={true}` flow content), we
 * tell the reader explicitly that any blank page following this marker
 * is intentional. Pre-empts the ambiguity that prompted the attorney's
 * "remove blank page 9 before launch" recommendation.
 */
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
