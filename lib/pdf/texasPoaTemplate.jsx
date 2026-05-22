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
 * Receives the full wizard state and an optional `watermarked` flag. When
 * watermarked is true, the DRAFT overlay renders on every page.
 *
 * Every generated document carries POA-IT branding in the footer. This is
 * non-negotiable at the consumer + professional tiers — the only tier that
 * can suppress this branding is Enterprise, which is gated separately at
 * the API layer (not here in the template).
 */

import { Document, Page, Text, View } from "@react-pdf/renderer";
import { styles, FONTS, SIZES, COLORS } from "./styles";
import { Header } from "./sections/Header";
import { Designation } from "./sections/Designation";
import { Powers } from "./sections/Powers";
import { HotPowers } from "./sections/HotPowers";
import { EffectiveDate } from "./sections/EffectiveDate";
import { Signature } from "./sections/Signature";
import { Watermark } from "./sections/Watermark";

export function TexasPoaDocument({ wizardState, watermarked = true }) {
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const sessionId = wizardState.sessionId || "preview";

  return (
    <Document
      title="Texas Statutory Durable Power of Attorney"
      author="POA-IT"
      subject="Statutory Durable Power of Attorney under Tex. Est. Code § 752.051"
      keywords="Texas, Power of Attorney, Statutory, Durable, § 752.051"
    >
      <Page size="LETTER" style={styles.page}>
        {watermarked && <Watermark />}

        <Header />
        <Designation wizardState={wizardState} />
        <Powers wizardState={wizardState} />
        <HotPowers wizardState={wizardState} />
        <EffectiveDate wizardState={wizardState} />
        <Signature wizardState={wizardState} />

        <BrandingFooter dateStr={dateStr} sessionId={sessionId} />
      </Page>
    </Document>
  );
}

/**
 * BrandingFooter
 *
 * Two stacked rows at the bottom of every page:
 *   Row 1: page number (left) + document type + date (right)
 *   Row 2: POA-IT logo mark + "Powered by POA-IT - poa-it.com" + document ID
 *
 * Total footer height ~28pt. Sits within the page-margin reserved space.
 */
function BrandingFooter({ dateStr, sessionId }) {
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
      {/* Top divider line */}
      <View
        style={{
          borderTopWidth: 0.5,
          borderTopColor: "#D4D4D8",
          marginBottom: 5,
        }}
      />

      {/* Row 1: meta info */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 3,
        }}
      >
        <Text style={{ fontSize: SIZES.CAPTION, color: COLORS.GRAY }}>
          Texas Statutory Durable POA · {dateStr}
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
          <LogoBadge />
          <Text
            style={{
              fontSize: 7.5,
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

/**
 * LogoBadge
 *
 * A small typographic logo mark: a filled square with white "P" inside.
 * Sized to sit alongside 7.5pt text in the footer (~10pt box).
 *
 * Built from PDF primitives so we don't need to load an external image
 * during render. If we ever want a real raster/vector logo, we'd swap
 * this for an <Image src=... /> with the asset packaged into the bundle.
 */
function LogoBadge() {
  return (
    <View
      style={{
        width: 10,
        height: 10,
        backgroundColor: "#0A0A0A",
        borderRadius: 2,
        marginRight: 5,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          fontSize: 7,
          fontFamily: FONTS.SANS_BOLD,
          color: "#FFFFFF",
          lineHeight: 1,
          marginTop: 1,
        }}
      >
        P
      </Text>
    </View>
  );
}
