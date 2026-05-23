/**
 * Revocation PDF Generator
 *
 * Mirrors the architecture of lib/pdf/generatePdf.js for the POA itself.
 * Given a revocation record (with snapshot data), produces a PDF buffer.
 *
 * Sprint 4c — Round 1 deliverable.
 */

import { renderToBuffer, Font } from "@react-pdf/renderer";
import { RevocationDocument } from "./revocationTemplate";

// Disable react-pdf's default hyphenation (same fix as the POA generator)
Font.registerHyphenationCallback((word) => [word]);

/**
 * Generates a Revocation of POA PDF from a revocation record.
 *
 * @param {Object} revocation - the revocation row + any joined data
 *   Required fields:
 *     - principalNameSnapshot
 *     - scope ("specific_poa" | "all_prior" | "agent_only")
 *   Optional but recommended:
 *     - originalPoaDateSnapshot
 *     - originalPoaDocumentIdSnapshot
 *     - revokedAgentName (when scope = "agent_only")
 *     - executionMethod ("ron" | "in_person")
 *     - id (for the certificate)
 *
 * @param {Object} [options]
 * @param {boolean} [options.watermarked=true] - apply DRAFT overlay
 * @returns {Promise<Buffer>} the rendered PDF bytes
 */
export async function generateRevocationPdf(revocation, options = {}) {
  const { watermarked = true } = options;

  const buffer = await renderToBuffer(
    <RevocationDocument revocation={revocation} watermarked={watermarked} />
  );

  return buffer;
}

/**
 * Generates a filename for the revocation PDF.
 * Example: "POA-Revocation-Jane-Smith-2026-05-22.pdf"
 */
export function revocationPdfFilename(revocation, { suffix = "" } = {}) {
  const name = (revocation.principalNameSnapshot || "Principal")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9-]/g, "");

  const date = new Date().toISOString().slice(0, 10);
  const parts = ["POA-Revocation", name, date];
  if (suffix) parts.push(suffix);
  return parts.join("-") + ".pdf";
}
