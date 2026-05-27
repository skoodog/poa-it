/**
 * Institution Presentation Packet PDF Generator
 *
 * Mirrors the architecture of lib/pdf/generatePdf.js for the POA itself.
 * Given a presentation record (with snapshot data), produces a PDF buffer.
 *
 * Sprint 4d Round 1.
 */

import { renderToBuffer, Font } from "@react-pdf/renderer";
import { PresentationPacketDocument } from "./presentationTemplate";

// Disable react-pdf's default hyphenation (same fix as POA + revocation generators)
Font.registerHyphenationCallback((word) => [word]);

/**
 * Generates an Institution Presentation Packet PDF from a presentation record.
 *
 * @param {Object} presentation - the presentation row + snapshot data
 *   Required fields:
 *     - institutionName
 *     - principalNameSnapshot
 *     - agentNameSnapshot
 *     - selectedPowers (array)
 *     - originalPoaDocumentIdSnapshot
 *     - originalPoaDateSnapshot
 *     - originalPoaStatus (for the cover sheet status badge)
 *
 * @param {Object} [options]
 * @param {boolean} [options.watermarked=true] - apply DRAFT overlay
 * @returns {Promise<Buffer>} the rendered PDF bytes
 */
export async function generatePresentationPdf(presentation, options = {}) {
  const { watermarked = true } = options;

  const buffer = await renderToBuffer(
    <PresentationPacketDocument
      presentation={presentation}
      watermarked={watermarked}
    />
  );

  return buffer;
}

/**
 * Generates a filename for the presentation packet PDF.
 * Example: "POA-Packet-Bank-of-America-2026-05-23.pdf"
 */
export function presentationPdfFilename(presentation, { suffix = "" } = {}) {
  const institutionSlug = (presentation.institutionName || "Institution")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9-]/g, "");

  const date = new Date().toISOString().slice(0, 10);
  const parts = ["POA-Packet", institutionSlug, date];
  if (suffix) parts.push(suffix);
  return parts.join("-") + ".pdf";
}
