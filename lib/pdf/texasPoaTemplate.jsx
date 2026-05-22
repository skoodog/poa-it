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
 * Every generated document carries POA-IT branding in both the header
 * and footer:
 *   - Header (top of every page): subtle logo + "poa-it" wordmark
 *   - Footer (bottom of every page): logo + "Powered by POA-IT" attribution
 *     + document metadata
 *
 * This branding is non-negotiable at consumer + professional tiers. The
 * Enterprise tier gate (when built) lives at the API layer, not here.
 *
 * Logo image: loaded from /public/poa-it-logo.png at render time. If the
 * asset is absent, the components fall back to a PDF-primitive version
 * (filled square with notch) so the document still renders cleanly.
 */

import { Document, Page, Text, View, Image } from "@react-pdf/renderer";
import { styles, FONTS, SIZES, COLORS } from "./styles";
import { Header } from "./sections/Header";
import { Designation } from "./sections/Designation";
import { Powers } from "./sections/Powers";
import { HotPowers } from "./sections/HotPowers";
import { EffectiveDate } from "./sections/EffectiveDate";
import { Signature } from "./sections/Signature";
import { Watermark } from "./sections/Watermark";

// Logo asset path. In production, the file lives at /public/poa-it-logo.png
// and is served from poa-it.com/poa-it-logo.png. At PDF-render time, react-pdf
// fetches it via HTTP. The base URL comes from VERCEL_URL when deployed, or
// falls back to localhost for local dev.
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
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
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

        <BrandedHeader logoUrl={logoUrl} />

        <Header />
        <Designation wizardState={wizardState} />
        <Powers wizardState={wizardState} />
        <HotPowers wizardState={wizardState} />
        <EffectiveDate wizardState={wizardState} />
        <Signature wizardState={wizardState} />

        <BrandedFooter dateStr={dateStr} sessionId={sessionId} logoUrl={logoUrl} />
      </Page>
    </Document>
  );
}

/**
 * BrandedHeader
 *
 * Subtle branded strip at the top of every page. Small logo mark + "poa-it"
 * wordmark in the upper left. Single horizontal rule below to separate from
 * document content.
 *
 * Sits in the page's top-margin reserved space (above the document body).
 */
function BrandedHeader({ logoUrl }) {
  return (
    <View
      fixed
      style={{
        position: "absolute",
        top: 18,
        left: SIZES.PAGE_MARGIN,
        right: SIZES.PAGE_MARGIN,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 5,
        }}
      >
        <Image
          src={logoUrl}
          style={{ width: 12, height: 12, marginRight: 5 }}
        />
        <Text
          style={{
            fontFamily: FONTS.SANS_BOLD,
            fontSize: 9,
            color: "#0A0A0A",
            letterSpacing: 0.3,
          }}
        >
          poa-it
        </Text>
      </View>

      <View
        style={{
          borderTopWidth: 0.5,
          borderTopColor: "#D4D4D8",
        }}
      />
    </View>
  );
}

/**
 * BrandedFooter
 *
 * Two stacked rows at the bottom of every page:
 *   Row 1: document type + date (left) + page number (right)
 *   Row 2: POA-IT logo + "Powered by POA-IT" + URL (left) + document ID (right)
 */
function BrandedFooter({ dateStr, sessionId, logoUrl }) {
  return (
    <View
      fixed
      style={{
        position: "absolute",
        bottom: 18,
        left: SIZES.PAGE_MARGIN,
        right: SIZES.PAGE_MARGIN,
      }}
    >
      {/* Divider line */}
      <View
        style={{
          borderTopWidth: 0.5,
          borderTopColor: "#D4D4D8",
          marginBottom: 5,
        }}
      />

      {/* Row 1: meta */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 3,
        }}
      >
        <Text style={{ fontSize: SIZES.CAPTION, color: COLORS.GRAY }}>
          Texas Statutory Durable POA \u00b7 {dateStr}
        </Text>
        <Text
          style={{ fontSize: SIZES.CAPTION, color: COLORS.GRAY }}
          render={({ pageNumber, totalPages }) =>
            `Page ${pageNumber} of ${totalPages}`
          }
        />
      </View>

      {/* Row 2: branding */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Image
            src={logoUrl}
            style={{ width: 11, height: 11, marginRight: 5 }}
          />
          <Text
            style={{
              fontSize: 8,
              fontFamily: FONTS.SANS_BOLD,
              color: "#3F3F46",
              letterSpacing: 0.5,
            }}
          >
            Powered by POA-IT
          </Text>
          <Text
            style={{
              fontSize: 7,
              color: COLORS.GRAY,
              marginLeft: 6,
              letterSpacing: 0.3,
            }}
          >
            poa-it.com
          </Text>
        </View>
        <Text
          style={{
            fontSize: 7,
            color: COLORS.GRAY,
            letterSpacing: 0.3,
          }}
        >
          Document ID: {String(sessionId).slice(0, 8)}
        </Text>
      </View>
    </View>
  );
}
