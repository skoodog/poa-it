/**
 * Watermark
 *
 * Large diagonal "DRAFT" tiles flanked by POA-IT logo marks, repeated
 * in a clean pattern across each preview page.
 *
 * Visual specs:
 *   - 2 columns x 4 rows = 8 tiles per page
 *   - Each tile is ~28pt text reading "[logo] DRAFT [logo]"
 *   - Rotated -30 degrees for the classic watermark angle
 *   - 16% opacity gray (visible but doesn't fight content)
 *   - Rows staggered horizontally for the security-paper interlaced look
 *
 * The logo flanking each DRAFT is rendered as a small filled-square mark
 * (built from PDF primitives) for portability — no image asset to load
 * at render time, no network calls, no missing-image fallback risk.
 */

import { View, Text } from "@react-pdf/renderer";
import { COLORS } from "../styles";

const COLS = 2;
const ROWS = 4;
const COL_WIDTH = 280;
const ROW_HEIGHT = 200;
const ROW_OFFSET = 130;
const TILE_FONT_SIZE = 28;
const LOGO_SIZE = 22;
// Sprint 4b.3: reduced from 0.16 to 0.10 so watermark identifies the
// draft state without visually competing with content (initials boxes,
// fine-print statutory text). DRAFT identity remains unmistakable;
// content beneath stays legible.
const OPACITY = 0.10;

export function Watermark() {
  const tiles = [];
  for (let r = 0; r < ROWS; r++) {
    const yOffset = r * ROW_HEIGHT + 30;
    const xStagger = r % 2 === 0 ? 0 : ROW_OFFSET;
    for (let c = 0; c < COLS; c++) {
      tiles.push({
        x: c * COL_WIDTH + xStagger - 30,
        y: yOffset,
        key: `${r}-${c}`,
      });
    }
  }

  return (
    <>
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: -1,
        }}
        fixed
      >
        {tiles.map((t) => (
          <View
            key={t.key}
            style={{
              position: "absolute",
              top: t.y,
              left: t.x,
              flexDirection: "row",
              alignItems: "center",
              opacity: OPACITY,
              transform: "rotate(-30deg)",
              transformOrigin: "left top",
              width: 280,
            }}
          >
            <WatermarkLogo />
            <Text
              style={{
                fontFamily: "Helvetica-Bold",
                fontSize: TILE_FONT_SIZE,
                color: COLORS.WATERMARK,
                letterSpacing: 4,
                marginLeft: 14,
                marginRight: 14,
              }}
            >
              DRAFT
            </Text>
            <WatermarkLogo />
          </View>
        ))}
      </View>

      <Text
        fixed
        style={{
          position: "absolute",
          bottom: 6,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: "Helvetica-Bold",
          fontSize: 8,
          color: COLORS.WATERMARK,
          letterSpacing: 1.5,
          textTransform: "uppercase",
        }}
      >
        Preview copy only — unsigned / not notarized — not for use
      </Text>
    </>
  );
}

/**
 * WatermarkLogo
 *
 * A small POA-IT logo mark sized to match the watermark text. Built from
 * PDF primitives: black rounded square with a small white notch in the
 * upper-right that evokes the asymmetric "P" mark of the actual logo.
 *
 * Why not embed the real logo image? Watermarks tile multiple times per page,
 * and image rendering at low opacity inside a rotated transform has rendering
 * quirks in @react-pdf/renderer. Using primitives gives clean predictable
 * output. The "real" logo appears in the document header/footer where it
 * renders once per page at full opacity.
 */
function WatermarkLogo() {
  return (
    <View
      style={{
        width: LOGO_SIZE,
        height: LOGO_SIZE,
        backgroundColor: COLORS.WATERMARK,
        borderRadius: 4,
        position: "relative",
      }}
    >
      {/* The notch — small white square in upper right */}
      <View
        style={{
          position: "absolute",
          top: 4,
          right: 4,
          width: 5,
          height: 5,
          backgroundColor: "#FFFFFF",
          borderRadius: 1,
        }}
      />
    </View>
  );
}
