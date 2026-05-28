/**
 * Document Version Manifest Constants
 *
 * Single source for the template + render-engine version strings captured
 * into a document's version manifest. The taxonomy version lives in the
 * taxonomy module (TAXONOMY_VERSION) and is imported where needed.
 *
 * Why this exists: the lawyer's evidentiary requirement is that a frozen
 * (locked/executed) document records exactly which template/taxonomy/engine
 * produced it. Rather than hardcode these strings in multiple files (the
 * exact duplication problem Sprint 4d.5 eliminated for power labels), we
 * centralize them here.
 *
 * Bump TEMPLATE_VERSION whenever the POA template's legal text, section
 * order, or layout changes. Bump RENDER_ENGINE_VERSION to match the
 * installed @react-pdf/renderer version when it's upgraded.
 *
 * Sprint 5 Round 1.
 */

// The Texas Statutory Durable POA template version. Matches the value
// rendered on the Document Generation Certificate.
export const TEMPLATE_VERSION = "Texas SDPOA v2026.05.22";

// The PDF render engine version. Mirrors package.json @react-pdf/renderer.
export const RENDER_ENGINE_VERSION = "@react-pdf/renderer@4.1.5";
