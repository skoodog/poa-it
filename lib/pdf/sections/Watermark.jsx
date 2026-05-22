/**
 * Watermark
 *
 * Renders the "DRAFT • POWERED BY POA-IT" overlay on preview PDFs as a
 * diagonal tiled pattern. Each tile is a small rotated text element
 * positioned absolutely. The grid is staggered (offset on alternating rows)
 * to create the classic security-paper interlaced look.
 *
 * The visual goal: visible enough that no one mistakes a preview for a
 * final document, but uniform enough to not look glitchy or broken.
 *
 * Tile geometry (US Letter at default margins):
 *   - Page is ~612pt wide, ~792pt tall
 *   - 4 columns x 9 rows of tiles
 *   - Rows offset by half-step on alternates
 *   - Each tile rotated -30 degrees
 *
 * Also renders the bottom-of-page preview footer (used in conjunction with
 * the on-purpose branding footer in the document template — that one
 * persists on the FINAL clean PDF too, this preview footer only on previews).
 */

import { View, Text } from "@react-pdf/renderer";
import { styles, COLORS } from "../styles";

const COLS = 4;
const ROWS = 9;
const COL_WIDTH = 165;
const ROW_HEIGHT = 95;
const ROW_OFFSET = 80;

const TILE_TEXT = "DRAFT  \u2022  POWERED BY POA-IT";

export function Watermark() {
  const tiles = [];
  for (let r = 0; r < ROWS; r++) {
    const yOffset = r * ROW_HEIGHT;
    const xStagger = r % 2 === 0 ? 0 : ROW_OFFSET;
    for (let c = 0; c < COLS; c++) {
      const x = c * COL_WIDTH + xStagger - 60;
      tiles.push({ x, y: yOffset, key: `${r}-${c}` });
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
          <Text
            key={t.key}
            style={{
              position: "absolute",
              top: t.y,
              left: t.x,
              fontFamily: "Helvetica-Bold",
              fontSize: 11,
              color: COLORS.WATERMARK,
              opacity: 0.18,
              letterSpacing: 2,
              transform: "rotate(-30deg)",
              transformOrigin: "left top",
              width: 220,
            }}
          >
            {TILE_TEXT}
          </Text>
        ))}
      </View>

      <Text style={styles.watermarkFooter} fixed>
        Preview only \u00b7 This document has no legal effect until purchased and notarized
      </Text>
    </>
  );
}
