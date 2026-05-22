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

        <PoweredByMark logoUrl={logoUrl} />
        <PageNumber />
      </Page>
    </Document>
  );
}

/**
 * PoweredByMark
 *
 * Single tasteful "Powered by [logo]" mark in the lower-right corner of
 * every page. The logo sits to the right of the text. Small but legible.
 *
 * If the logo image fails to load (asset not yet deployed, network blip),
 * the Image element will render empty space — the text "Powered by" still
 * displays so the attribution survives.
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
        gap: 6,
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
        style={{ width: 36, height: 12 }}
      />
    </View>
  );
}

/**
 * PageNumber
 *
 * Tiny page-number indicator in the lower-LEFT corner, opposite the
 * branding mark. Provides context for multi-page documents without
 * cluttering the layout.
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
        totalPages > 1 ? `Page ${pageNumber} of ${totalPages}` : ""
      }
    />
  );
}
