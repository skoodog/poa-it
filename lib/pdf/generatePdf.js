/**
 * PDF Generator
 *
 * The pure entry point: given wizard state, return a PDF buffer.
 *
 * This module is the boundary between business data (wizard state) and
 * presentation (PDF bytes). It's intentionally pure — no auth checks, no
 * database writes, no audit events. Callers (API routes, future server
 * actions) handle those concerns.
 *
 * Two flags control behavior:
 *   - watermarked (default true): apply the DRAFT overlay
 *   - executionPath: overrides wizardState.executionMethod for the notary
 *     block. Useful when the same state needs to be rendered as if for
 *     each path (RON, IPEN, in-person).
 *
 * Returns a Node.js Buffer suitable for streaming via Response.
 */

import { renderToBuffer, Font } from "@react-pdf/renderer";
import { TexasPoaDocument } from "./texasPoaTemplate";

// Sprint 4b.3: disable react-pdf's default hyphenation algorithm.
// The default inserts soft hyphens (U+00AD) into long words during line
// wrapping, which produced text-layer artifacts like "transac\u00ADtions"
// and "EXTEND\u00ADING" that the attorney flagged in multiple rounds.
// Registering a callback that returns the word as a single chunk tells
// react-pdf "never hyphenate this word." Result: clean text layer in
// the output PDF, better OCR / search / institutional upload behavior.
Font.registerHyphenationCallback((word) => [word]);

/**
 * Generates a Texas Statutory Durable POA from wizard state.
 *
 * @param {Object} wizardState - The full wizard state object
 * @param {Object} [options]
 * @param {boolean} [options.watermarked=true] - apply DRAFT overlay
 * @param {string} [options.executionPath] - override execution path
 * @returns {Promise<Buffer>} the rendered PDF bytes
 */
export async function generateTexasPoaPdf(wizardState, options = {}) {
  const { watermarked = true, executionPath } = options;

  // If executionPath is overridden, merge it into wizardState for rendering
  const renderState = executionPath
    ? { ...wizardState, executionMethod: executionPath }
    : wizardState;

  const buffer = await renderToBuffer(
    <TexasPoaDocument wizardState={renderState} watermarked={watermarked} />
  );

  return buffer;
}

/**
 * Generates a filename for the PDF based on principal name + timestamp.
 * Used by API routes when setting Content-Disposition.
 *
 * Example: "Texas-POA-Jane-Smith-2026-05-21.pdf"
 */
export function pdfFilename(wizardState, { suffix = "" } = {}) {
  const name = (wizardState.principalFullLegalName || "Principal")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9-]/g, "");

  const date = new Date().toISOString().slice(0, 10);
  const parts = ["Texas-POA", name, date];
  if (suffix) parts.push(suffix);
  return parts.join("-") + ".pdf";
}
