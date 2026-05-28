/**
 * Document Storage — Vercel Blob + integrity hashing
 *
 * The freeze mechanism behind lock-for-signing (and, later, executed copies).
 * When a document leaves draft, we render the PDF once, store that exact
 * binary in Vercel Blob, and record a SHA-256 of the bytes so the artifact
 * is tamper-evident and never regenerated. This is the lawyer's evidentiary
 * requirement made real.
 *
 * Access is 'private' — these are legal instruments, not public assets.
 * Reads go through a short-lived signed flow (see /api/documents/[id]/pdf).
 *
 * Sprint 5 Round 2.
 */

import { createHash } from "crypto";
import { put, get } from "@vercel/blob";

/**
 * Compute the SHA-256 hex digest of a buffer. This is the integrity hash
 * stored alongside the document; any byte change produces a different digest.
 */
export function sha256Hex(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

/**
 * Store a locked signing copy in Blob. Returns { blobKey, sha256, url }.
 *
 * @param {Buffer} pdfBuffer - the rendered (non-watermarked) PDF bytes
 * @param {string} documentId - the document's UUID, used in the blob path
 */
export async function storeLockedSigningCopy(pdfBuffer, documentId) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error(
      "BLOB_READ_WRITE_TOKEN is not set. Enable Vercel Blob on the project " +
        "and add the token to the environment."
    );
  }

  const sha256 = sha256Hex(pdfBuffer);

  // Deterministic, collision-resistant path. addRandomSuffix would also work,
  // but keying on the document id keeps the store browsable and predictable.
  const pathname = `documents/${documentId}/locked-signing-copy.pdf`;

  const blob = await put(pathname, pdfBuffer, {
    access: "private",
    contentType: "application/pdf",
    addRandomSuffix: false,
    // If a lock is somehow retried, allow overwrite of the SAME key — the
    // hash is recomputed and stored, so integrity is still verifiable. (In
    // normal flow a locked document is read-only and never re-locked.)
    allowOverwrite: true,
  });

  return {
    blobKey: blob.pathname,
    blobUrl: blob.url,
    sha256,
  };
}

/**
 * Store an executed copy (signed/notarized original). Stored under a separate
 * key so it never overwrites the locked signing copy — the lawyer's "keep
 * both" rule. Populated in Sprint 7 (RON); helper provided now for symmetry.
 *
 * @param {Buffer} pdfBuffer
 * @param {string} documentId
 */
export async function storeExecutedCopy(pdfBuffer, documentId) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN is not set.");
  }
  const sha256 = sha256Hex(pdfBuffer);
  const pathname = `documents/${documentId}/executed-copy.pdf`;
  const blob = await put(pathname, pdfBuffer, {
    access: "private",
    contentType: "application/pdf",
    addRandomSuffix: false,
    allowOverwrite: false, // executed copy must never be overwritten
  });
  return { blobKey: blob.pathname, blobUrl: blob.url, sha256 };
}

/**
 * Fetch a stored blob as a readable stream for serving to the browser.
 * Returns { stream, contentType } or null if not found.
 *
 * @param {string} blobKey - the stored pathname (document.lockedPdfBlobKey, etc.)
 */
export async function fetchBlobStream(blobKey) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN is not set.");
  }
  const result = await get(blobKey, { access: "private" });
  if (!result || result.statusCode !== 200) return null;
  return {
    stream: result.stream,
    contentType: result.blob?.contentType || "application/pdf",
  };
}
