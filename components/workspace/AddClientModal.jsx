"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { X, Loader2, AlertTriangle } from "lucide-react";
import { TOKENS, FONTS } from "../wizard/shared/tokens";
import { useSmartFormat } from "../../lib/formatting/smartFormat";

/**
 * AddClientModal
 *
 * Modal form for creating a new client. Required: name. Optional: email,
 * phone, relationship, notes.
 *
 * On submit, POSTs to /api/workspace/clients/create. On success, the parent
 * page refreshes via router.refresh() so the new client appears in the list.
 *
 * Includes a debounced check for duplicate email — if another active client
 * in the firm has the same email, shows a soft warning but allows submit.
 *
 * Closing: click backdrop, click X, press Escape, or successful submit.
 */

export function AddClientModal({ open, onClose }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [relationship, setRelationship] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [duplicateCount, setDuplicateCount] = useState(0);

  // Smart phone formatter — user types digits in any pattern, we display
  // "(xxx) xxx-xxxx" with cursor preserved.
  const phoneInput = useSmartFormat(phone, setPhone, "phone");
  const firstInputRef = useRef(null);

  // Reset on open
  useEffect(() => {
    if (open) {
      setName("");
      setEmail("");
      setPhone("");
      setRelationship("");
      setNotes("");
      setSubmitting(false);
      setError(null);
      setDuplicateCount(0);
      setTimeout(() => firstInputRef.current?.focus(), 50);
    }
  }, [open]);

  // Escape to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, submitting, onClose]);

  // Debounced duplicate-email check
  useEffect(() => {
    if (!email || !email.includes("@")) {
      setDuplicateCount(0);
      return;
    }
    const handle = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/workspace/clients/check-duplicate-email?email=${encodeURIComponent(email)}`
        );
        if (res.ok) {
          const json = await res.json();
          setDuplicateCount(json.count || 0);
        }
      } catch {
        // Non-fatal — duplicate check is a UX nicety
      }
    }, 400);
    return () => clearTimeout(handle);
  }, [email]);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter a name.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/workspace/clients/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim() || null,
          phone: phone.trim() || null,
          relationship: relationship.trim() || null,
          notes: notes.trim() || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (err.error === "validation: name_too_long") {
          setError("Name is too long (max 200 characters).");
        } else if (err.error === "validation: name_required") {
          setError("Please enter a name.");
        } else if (err.error === "unauthenticated") {
          setError("Your session has expired. Please refresh and sign in.");
        } else {
          setError("Something went wrong creating this client. Please try again.");
        }
        setSubmitting(false);
        return;
      }

      // Success — refresh the parent and close
      router.refresh();
      onClose();
    } catch (err) {
      setError("Network error. Please check your connection and try again.");
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={submitting ? undefined : onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(10,10,10,0.4)",
          backdropFilter: "blur(2px)",
          zIndex: 100,
        }}
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-client-title"
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "calc(100% - 32px)",
          maxWidth: 520,
          maxHeight: "calc(100vh - 64px)",
          overflowY: "auto",
          background: TOKENS.PAPER,
          border: `1px solid ${TOKENS.LINE}`,
          borderRadius: 12,
          boxShadow: "0 20px 50px -10px rgba(10,10,10,0.25)",
          fontFamily: FONTS.SANS,
          zIndex: 101,
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: `1px solid ${TOKENS.LINE}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <div>
            <h2
              id="add-client-title"
              style={{
                fontSize: 18,
                fontWeight: 600,
                letterSpacing: "-0.015em",
                margin: 0,
                color: TOKENS.INK,
              }}
            >
              Add a client
            </h2>
            <p style={{ fontSize: 13, color: TOKENS.INK_60, margin: "4px 0 0", lineHeight: 1.4 }}>
              Start with just a name. You can add more details later.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close"
            style={{
              width: 28,
              height: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "transparent",
              border: "none",
              cursor: submitting ? "not-allowed" : "pointer",
              color: TOKENS.INK_60,
              borderRadius: 6,
              flexShrink: 0,
            }}
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div
            style={{
              padding: "20px 24px",
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            <Field
              label="Name"
              required
              input={
                <input
                  ref={firstInputRef}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Smith"
                  maxLength={200}
                  style={fieldInputStyle}
                  disabled={submitting}
                />
              }
            />

            <Field
              label="Email"
              optional
              input={
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@example.com"
                  style={fieldInputStyle}
                  disabled={submitting}
                />
              }
              helpText={
                duplicateCount > 0 ? (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      color: "#92400E",
                    }}
                  >
                    <AlertTriangle size={12} strokeWidth={2} />
                    Another active client uses this email. Is this the same person?
                  </span>
                ) : null
              }
            />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Field
                label="Phone"
                optional
                input={
                  <input
                    ref={phoneInput.ref}
                    type="tel"
                    inputMode="numeric"
                    value={phone}
                    onChange={phoneInput.onChange}
                    placeholder="(512) 555-0123"
                    style={fieldInputStyle}
                    disabled={submitting}
                  />
                }
              />
              <Field
                label="Relationship"
                optional
                input={
                  <input
                    type="text"
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value)}
                    placeholder="e.g. spouse, child"
                    style={fieldInputStyle}
                    disabled={submitting}
                  />
                }
              />
            </div>

            <Field
              label="Notes"
              optional
              input={
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Anything worth remembering about this client..."
                  rows={3}
                  style={{ ...fieldInputStyle, resize: "vertical", fontFamily: "inherit" }}
                  disabled={submitting}
                />
              }
            />

            {error && (
              <div
                style={{
                  padding: "10px 12px",
                  background: "#FEF2F2",
                  border: "1px solid #FCA5A5",
                  borderRadius: 7,
                  fontSize: 13,
                  color: "#991B1B",
                  lineHeight: 1.45,
                }}
              >
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              padding: "16px 24px",
              borderTop: `1px solid ${TOKENS.LINE}`,
              display: "flex",
              justifyContent: "flex-end",
              gap: 10,
              background: TOKENS.PAPER_2,
              borderRadius: "0 0 12px 12px",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              style={{
                padding: "9px 16px",
                fontSize: 13,
                fontWeight: 500,
                background: TOKENS.PAPER,
                color: TOKENS.INK_60,
                border: `1px solid ${TOKENS.LINE}`,
                borderRadius: 7,
                cursor: submitting ? "not-allowed" : "pointer",
                fontFamily: "inherit",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !name.trim()}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "9px 18px",
                fontSize: 13,
                fontWeight: 600,
                background: !name.trim() || submitting ? TOKENS.INK_20 : TOKENS.INK,
                color: TOKENS.PAPER,
                border: "none",
                borderRadius: 7,
                cursor: submitting || !name.trim() ? "not-allowed" : "pointer",
                fontFamily: "inherit",
              }}
            >
              {submitting && <Loader2 size={13} strokeWidth={2} className="spin-anim" />}
              {submitting ? "Creating..." : "Create client"}
            </button>
          </div>
        </form>

        <style suppressHydrationWarning>{`
          .spin-anim { animation: spin 0.8s linear infinite; }
          @keyframes spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }
        `}</style>
      </div>
    </>
  );
}

const fieldInputStyle = {
  width: "100%",
  padding: "9px 11px",
  fontSize: 13.5,
  color: TOKENS.INK,
  background: TOKENS.PAPER,
  border: `1px solid ${TOKENS.LINE}`,
  borderRadius: 6,
  outline: "none",
  fontFamily: "inherit",
};

function Field({ label, required, optional, input, helpText }) {
  return (
    <div>
      <label
        style={{
          display: "block",
          fontSize: 12,
          fontWeight: 500,
          color: TOKENS.INK,
          marginBottom: 5,
        }}
      >
        {label}
        {optional && (
          <span style={{ color: TOKENS.INK_40, fontWeight: 400, marginLeft: 6, fontSize: 11 }}>
            optional
          </span>
        )}
      </label>
      {input}
      {helpText && (
        <div style={{ marginTop: 6, fontSize: 12, color: TOKENS.INK_60, lineHeight: 1.45 }}>
          {helpText}
        </div>
      )}
    </div>
  );
}
