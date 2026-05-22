"use client";

import { useEffect } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { TOKENS, FONTS } from "../wizard/shared/tokens";

/**
 * ConfirmDialog
 *
 * Small, reusable modal for confirming destructive actions. Used by the
 * profile page for archive/restore. Will be used by other sprints for
 * delete confirmations, payment confirmations, etc.
 *
 * Props:
 *   open       — controls visibility
 *   onCancel   — called when user dismisses
 *   onConfirm  — called when user clicks the confirm button (async OK)
 *   title      — main heading
 *   message    — supporting copy
 *   confirmLabel — label for the destructive button
 *   confirmTone  — "destructive" (red) or "neutral" (dark)
 *   loading    — show spinner on confirm button
 */
export function ConfirmDialog({
  open,
  onCancel,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  confirmTone = "destructive",
  loading = false,
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape" && !loading) onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, loading, onCancel]);

  if (!open) return null;

  const confirmBg =
    confirmTone === "destructive" ? "#DC2626" : TOKENS.INK;

  return (
    <>
      <div
        onClick={loading ? undefined : onCancel}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(10,10,10,0.4)",
          backdropFilter: "blur(2px)",
          zIndex: 100,
        }}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "calc(100% - 32px)",
          maxWidth: 440,
          background: TOKENS.PAPER,
          border: `1px solid ${TOKENS.LINE}`,
          borderRadius: 12,
          boxShadow: "0 20px 50px -10px rgba(10,10,10,0.25)",
          fontFamily: FONTS.SANS,
          zIndex: 101,
        }}
      >
        <div style={{ padding: "20px 24px 8px", display: "flex", gap: 14, alignItems: "flex-start" }}>
          {confirmTone === "destructive" && (
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "#FEF2F2",
                border: "1px solid #FCA5A5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#DC2626",
                flexShrink: 0,
              }}
            >
              <AlertTriangle size={16} strokeWidth={2} />
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2
              style={{
                fontSize: 16,
                fontWeight: 600,
                letterSpacing: "-0.015em",
                margin: "0 0 6px",
                color: TOKENS.INK,
              }}
            >
              {title}
            </h2>
            <p style={{ fontSize: 13.5, color: TOKENS.INK_60, margin: 0, lineHeight: 1.5 }}>
              {message}
            </p>
          </div>
        </div>

        <div
          style={{
            padding: "16px 24px",
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            marginTop: 8,
          }}
        >
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            style={{
              padding: "8px 14px",
              fontSize: 13,
              fontWeight: 500,
              background: TOKENS.PAPER,
              color: TOKENS.INK_60,
              border: `1px solid ${TOKENS.LINE}`,
              borderRadius: 7,
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "inherit",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              fontSize: 13,
              fontWeight: 600,
              background: confirmBg,
              color: TOKENS.PAPER,
              border: "none",
              borderRadius: 7,
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading && <Loader2 size={13} strokeWidth={2} className="spin-anim" />}
            {confirmLabel}
          </button>
        </div>

        <style suppressHydrationWarning>{`
          .spin-anim { animation: spin 0.8s linear infinite; }
          @keyframes spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }
        `}</style>
      </div>
    </>
  );
}
