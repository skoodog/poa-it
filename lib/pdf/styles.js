/**
 * PDF Style Tokens
 *
 * Legal documents have specific typographic conventions that differ from
 * web/screen UI. These tokens encode the conventions for the Texas
 * Statutory Durable POA:
 *
 *   - Times-style serif for body text (court convention)
 *   - 12pt body, 10pt small print
 *   - 1-inch margins
 *   - Section headings centered, bold, all-caps
 *   - Notice blocks all-caps
 *   - Signature lines underscore with labels below
 *
 * The PDF lib uses pt as its default unit, not px.
 */

import { StyleSheet, Font } from "@react-pdf/renderer";

// We rely on built-in PDF fonts (Times-Roman, Times-Bold, Times-Italic,
// Helvetica) rather than registering custom fonts. This keeps the bundle
// small and avoids font-licensing concerns for the legal document itself.
// React-PDF ships these as "Times-Roman", "Times-Bold", "Helvetica", etc.

export const COLORS = {
  INK: "#0A0A0A",
  GRAY: "#6B6B6B",
  WATERMARK: "#9C9C9C",
  BORDER: "#1A1A1A",
  RULE: "#000000",
};

export const SIZES = {
  // Base sizes (in pt)
  BODY: 11,
  BODY_SMALL: 10,
  CAPTION: 9,
  NOTICE: 10.5,
  HEADING: 14,
  TITLE: 18,
  SECTION: 12,

  // Layout
  PAGE_MARGIN: 54, // 0.75 inch — slightly tighter than 1in but readable
  PAGE_MARGIN_TOP: 54, // standard top margin (no header strip)
  PAGE_MARGIN_BOTTOM: 64, // a bit extra for lower-right branding mark
  PARA_SPACING: 6,
  SECTION_SPACING: 14,
  LINE_HEIGHT: 1.45,
  LINE_HEIGHT_TIGHT: 1.3,

  // Signature lines
  SIG_LINE_WIDTH: 280,
  SIG_LINE_LABEL_GAP: 2,
};

export const FONTS = {
  SERIF: "Times-Roman",
  SERIF_BOLD: "Times-Bold",
  SERIF_ITALIC: "Times-Italic",
  SANS: "Helvetica",
  SANS_BOLD: "Helvetica-Bold",
};

export const styles = StyleSheet.create({
  page: {
    paddingTop: SIZES.PAGE_MARGIN_TOP,
    paddingBottom: SIZES.PAGE_MARGIN_BOTTOM,
    paddingLeft: SIZES.PAGE_MARGIN,
    paddingRight: SIZES.PAGE_MARGIN,
    fontFamily: FONTS.SERIF,
    fontSize: SIZES.BODY,
    color: COLORS.INK,
    lineHeight: SIZES.LINE_HEIGHT,
  },

  title: {
    fontFamily: FONTS.SERIF_BOLD,
    fontSize: SIZES.TITLE,
    textAlign: "center",
    marginBottom: SIZES.SECTION_SPACING,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  sectionHeading: {
    fontFamily: FONTS.SERIF_BOLD,
    fontSize: SIZES.SECTION,
    textAlign: "center",
    marginTop: SIZES.SECTION_SPACING,
    marginBottom: SIZES.PARA_SPACING,
    textTransform: "uppercase",
  },

  notice: {
    fontFamily: FONTS.SERIF_BOLD,
    fontSize: SIZES.NOTICE,
    textTransform: "uppercase",
    textAlign: "justify",
    marginBottom: SIZES.PARA_SPACING,
    lineHeight: SIZES.LINE_HEIGHT,
    letterSpacing: 0.2,
  },

  body: {
    marginBottom: SIZES.PARA_SPACING,
    textAlign: "justify",
  },

  bodyTight: {
    marginBottom: 3,
    lineHeight: SIZES.LINE_HEIGHT_TIGHT,
  },

  italic: {
    fontFamily: FONTS.SERIF_ITALIC,
  },

  bold: {
    fontFamily: FONTS.SERIF_BOLD,
  },

  // Signature line — drawn as a bottom border on a fixed-width box
  sigLine: {
    width: SIZES.SIG_LINE_WIDTH,
    borderBottomWidth: 0.75,
    borderBottomColor: COLORS.RULE,
    minHeight: 18,
    marginBottom: SIZES.SIG_LINE_LABEL_GAP,
  },

  sigLineLabel: {
    fontSize: SIZES.CAPTION,
    color: COLORS.GRAY,
    marginBottom: SIZES.PARA_SPACING * 2,
  },

  // Initial line — short underscore for "_______ (initial)"
  initialLine: {
    display: "flex",
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 4,
  },

  initialBox: {
    width: 36,
    borderBottomWidth: 0.75,
    borderBottomColor: COLORS.RULE,
    height: 14,
    marginRight: 8,
  },

  powerRow: {
    display: "flex",
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 4,
  },

  letterLabel: {
    width: 22,
    fontFamily: FONTS.SERIF_BOLD,
    flexShrink: 0,
  },

  powerText: {
    flex: 1,
  },

  // Watermark — diagonal repeated text behind content
  watermarkContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: -1,
  },

  watermarkText: {
    fontFamily: FONTS.SANS_BOLD,
    fontSize: 70,
    color: COLORS.WATERMARK,
    opacity: 0.18,
    textAlign: "center",
    transform: "rotate(-40deg)",
    letterSpacing: 4,
  },

  watermarkFooter: {
    position: "absolute",
    bottom: 24,
    left: 0,
    right: 0,
    textAlign: "center",
    fontFamily: FONTS.SANS_BOLD,
    fontSize: 8,
    color: COLORS.WATERMARK,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },

  footer: {
    position: "absolute",
    bottom: 24,
    left: SIZES.PAGE_MARGIN,
    right: SIZES.PAGE_MARGIN,
    fontSize: SIZES.CAPTION,
    color: COLORS.GRAY,
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
  },

  pageNumber: {
    fontSize: SIZES.CAPTION,
    color: COLORS.GRAY,
  },

  fieldValue: {
    fontFamily: FONTS.SERIF_BOLD,
  },

  blankField: {
    fontFamily: FONTS.SERIF_ITALIC,
    color: COLORS.GRAY,
  },
});
