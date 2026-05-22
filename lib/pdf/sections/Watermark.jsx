/**
 * Watermark
 *
 * Renders the "DRAFT — NOT EXECUTABLE" overlay on preview PDFs. Two parts:
 *
 *   1. Large diagonal text behind content (gray, ~18% opacity)
 *   2. Footer text at bottom of every page
 *
 * Visible enough that no one can mistake a preview for a final document.
 * Used as a fixed-position element inside the page so it persists across
 * pages.
 *
 * Important: in @react-pdf/renderer, "fixed" elements repeat on every page
 * when placed inside the <Page> component. The watermark is therefore
 * placed once and rendered per-page automatically.
 */

import { View, Text } from "@react-pdf/renderer";
import { styles } from "../styles";

export function Watermark() {
  return (
    <>
      <View style={styles.watermarkContainer} fixed>
        <Text style={styles.watermarkText}>DRAFT — NOT EXECUTABLE</Text>
      </View>
      <Text style={styles.watermarkFooter} fixed>
        Preview only · This document has no legal effect until purchased and notarized
      </Text>
    </>
  );
}
