"use client";

import { FileText } from "lucide-react";
import { TOKENS, FONTS } from "../wizard/shared/tokens";
import { getDocumentStatusDisplay } from "../../lib/taxonomy/poaTaxonomy";

/**
 * DocumentsPageView — firm-wide document list. Sprint 5 R1.
 *
 * Each row links to the owning client's profile (the document lifecycle
 * surfaces live there). A dedicated per-document detail page can come later.
 */

const STATUS_TONE = {
  neutral: { bg: "#E5E7EB", color: "#374151" },
  info: { bg: "#DBEAFE", color: "#1E40AF" },
  success: { bg: "#D1FAE5", color: "#065F46" },
  warning: { bg: "#FEF3C7", color: "#92400E" },
  danger: { bg: "#FEE2E2", color: "#991B1B" },
};

const DOC_TYPE_LABELS = {
  tx_durable_financial_poa: "Texas Durable Financial POA",
};

export function DocumentsPageView({ documents }) {
  return (
    <div style={{ padding: "28px 32px", fontFamily: FONTS.SANS }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 880 }}>
        {documents.map((doc) => {
          const statusDisplay = getDocumentStatusDisplay(doc.status);
          const tone = STATUS_TONE[statusDisplay.tone] || STATUS_TONE.neutral;
          const typeLabel = DOC_TYPE_LABELS[doc.documentType] || doc.documentType;
          return (
            <a
              key={doc.id}
              href={doc.clientId ? `/app/clients/${doc.clientId}` : "#"}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "14px 16px",
                background: TOKENS.PAPER,
                border: `1px solid ${TOKENS.LINE}`,
                borderRadius: 8,
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  background: TOKENS.PAPER_2,
                  border: `1px solid ${TOKENS.LINE}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: TOKENS.INK_60,
                  flexShrink: 0,
                }}
              >
                <FileText size={15} strokeWidth={1.8} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 500, color: TOKENS.INK, marginBottom: 2 }}>
                  {doc.clientName || "Unassigned client"}
                </div>
                <div style={{ fontSize: 11.5, color: TOKENS.INK_60, fontFamily: FONTS.MONO }}>
                  {typeLabel} · created {new Date(doc.createdAt).toLocaleDateString()}
                </div>
              </div>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "3px 10px",
                  background: tone.bg,
                  color: tone.color,
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                {statusDisplay.displayName}
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
