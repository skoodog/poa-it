"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Archive,
  RotateCcw,
  Shield,
  ShieldOff,
  FileText,
  Sparkles,
  Save,
  Loader2,
  Check,
  Send,
  AlertTriangle,
} from "lucide-react";
import { TopBar } from "./TopBar";
import { ClientStatusBadge } from "./ClientStatusBadge";
import { DocumentStatusBadge } from "./DocumentStatusBadge";
import { ActivityTimeline } from "./ActivityTimeline";
import { ConfirmDialog } from "./ConfirmDialog";
import { getPresentationStatusDisplay } from "../../lib/taxonomy/poaTaxonomy";
import { TOKENS, FONTS } from "../wizard/shared/tokens";

/**
 * ClientProfileView
 *
 * Editable profile page for a single client. Receives the full client record
 * plus its audit events, documents, and wizard sessions as initial props.
 *
 * Form state lives client-side so the user can edit multiple fields before
 * submitting. Dirty-tracking lets us show a "Save changes" button only when
 * something has been edited.
 *
 * Archive flow uses ConfirmDialog to prevent accidents.
 */

export function ClientProfileView({ client, auditEvents, documents, wizardSessions, revocations, presentations, pendingIntakes }) {
  const router = useRouter();
  const isArchived = client.status === "archived";

  // Form state — initialized from the server-fetched client record
  const [name, setName] = useState(client.name || "");
  const [email, setEmail] = useState(client.email || "");
  const [phone, setPhone] = useState(client.phone || "");
  const [relationship, setRelationship] = useState(client.relationship || "");
  const [notes, setNotes] = useState(client.notes || "");
  const [status, setStatus] = useState(client.status || "intake");

  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [error, setError] = useState(null);

  const [archiveOpen, setArchiveOpen] = useState(false);
  const [archiving, setArchiving] = useState(false);

  // Dirty tracking — only the diff
  const isDirty =
    name !== (client.name || "") ||
    email !== (client.email || "") ||
    phone !== (client.phone || "") ||
    relationship !== (client.relationship || "") ||
    notes !== (client.notes || "") ||
    status !== (client.status || "intake");

  async function handleSave() {
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/workspace/clients/${client.id}/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim() || null,
          phone: phone.trim() || null,
          relationship: relationship.trim() || null,
          notes: notes.trim() || null,
          status,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (err.error === "validation: name_required") {
          setError("Name is required.");
        } else if (err.error === "validation: name_too_long") {
          setError("Name is too long (max 200 characters).");
        } else {
          setError("Something went wrong. Please try again.");
        }
        setSaving(false);
        return;
      }
      setSaving(false);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2400);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setSaving(false);
    }
  }

  async function handleArchive() {
    setArchiving(true);
    try {
      const endpoint = isArchived
        ? `/api/workspace/clients/${client.id}/restore`
        : `/api/workspace/clients/${client.id}/archive`;
      const res = await fetch(endpoint, { method: "POST" });
      if (!res.ok) {
        setArchiving(false);
        setArchiveOpen(false);
        return;
      }
      setArchiving(false);
      setArchiveOpen(false);
      if (isArchived) {
        router.refresh();
      } else {
        router.push("/app/clients");
      }
    } catch {
      setArchiving(false);
    }
  }

  return (
    <>
      <TopBar
        title={
          <span style={{ display: "inline-flex", alignItems: "center", gap: 12 }}>
            <span>{client.name}</span>
            <ClientStatusBadge status={client.status} />
          </span>
        }
        subtitle={
          <a
            href="/app/clients"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 12.5,
              color: TOKENS.INK_60,
              textDecoration: "none",
            }}
          >
            <ArrowLeft size={12} strokeWidth={2} />
            Back to all clients
          </a>
        }
        actions={
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {justSaved && (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: 12,
                  color: "#065F46",
                  background: "#ECFDF5",
                  border: "1px solid #A7F3D0",
                  padding: "5px 10px",
                  borderRadius: 6,
                  fontFamily: FONTS.SANS,
                }}
              >
                <Check size={12} strokeWidth={2.4} />
                Saved
              </div>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={!isDirty || saving}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                fontSize: 13,
                fontWeight: 600,
                background: !isDirty || saving ? TOKENS.INK_20 : TOKENS.INK,
                color: TOKENS.PAPER,
                border: "none",
                borderRadius: 6,
                cursor: !isDirty || saving ? "not-allowed" : "pointer",
                fontFamily: FONTS.SANS,
              }}
            >
              {saving ? (
                <Loader2 size={13} strokeWidth={2} className="spin-anim" />
              ) : (
                <Save size={13} strokeWidth={2.2} />
              )}
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        }
      />

      <div
        style={{
          padding: "24px 32px 60px",
          maxWidth: 920,
          fontFamily: FONTS.SANS,
        }}
      >
        {/* Archived banner */}
        {isArchived && (
          <div
            style={{
              padding: "12px 16px",
              background: "#FAFAFA",
              border: `1px dashed ${TOKENS.LINE}`,
              borderRadius: 8,
              marginBottom: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
            }}
          >
            <div style={{ fontSize: 13, color: TOKENS.INK_60 }}>
              This client is archived. Their data is preserved but they don't appear in default views.
            </div>
            <button
              type="button"
              onClick={() => setArchiveOpen(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "6px 12px",
                fontSize: 12,
                fontWeight: 600,
                background: TOKENS.PAPER,
                color: TOKENS.INK,
                border: `1px solid ${TOKENS.LINE}`,
                borderRadius: 6,
                cursor: "pointer",
                fontFamily: "inherit",
                flexShrink: 0,
              }}
            >
              <RotateCcw size={12} strokeWidth={2} />
              Restore
            </button>
          </div>
        )}

        {/* Client details card */}
        <SectionCard label="Client details">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field
              label="Name"
              required
              input={
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={200}
                  disabled={saving}
                  style={fieldStyle}
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
                  disabled={saving}
                  style={fieldStyle}
                />
              }
            />
            <Field
              label="Phone"
              optional
              input={
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={saving}
                  style={fieldStyle}
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
                  placeholder="e.g. spouse, child, trustee"
                  disabled={saving}
                  style={fieldStyle}
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
                rows={3}
                disabled={saving}
                style={{
                  ...fieldStyle,
                  resize: "vertical",
                  fontFamily: "inherit",
                }}
              />
            }
          />

          <Field
            label="Status"
            input={
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                disabled={saving}
                style={{ ...fieldStyle, cursor: "pointer" }}
              >
                <option value="intake">Intake</option>
                <option value="in_progress">In progress</option>
                <option value="ready_for_review">Ready for review</option>
                <option value="signed">Signed</option>
                <option value="notarized">Notarized</option>
                <option value="revoked">Revoked</option>
              </select>
            }
            helpText="Status updates flow into the firm-wide overview and trigger downstream actions in later sprints (e.g. notarization, delivery)."
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
              }}
            >
              {error}
            </div>
          )}
        </SectionCard>

        {/* Revocations — Sprint 4c R3. Only shown when revocations exist
            for this client. Empty state is hidden (don't clutter the page
            with a "no revocations yet" block when most clients won't have any). */}
        {revocations && revocations.length > 0 && (
          <SectionCard
            label="Revocations"
            description={`${revocations.length} revocation${revocations.length === 1 ? "" : "s"} on file for this client.`}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {revocations.map((rev) => (
                <RevocationRow key={rev.id} revocation={rev} clientId={client.id} />
              ))}
            </div>
          </SectionCard>
        )}

        {/* Presentations — Sprint 4d R3. Only shown when presentations exist.
            Sits alongside Revocations as a parallel lifecycle surface. */}
        {presentations && presentations.length > 0 && (
          <SectionCard
            label="Institution Presentations"
            description={`${presentations.length} packet${presentations.length === 1 ? "" : "s"} generated for this client.`}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {presentations.map((p) => (
                <PresentationRow key={p.id} presentation={p} clientId={client.id} />
              ))}
            </div>
          </SectionCard>
        )}

        {/* Documents */}
        <SectionCard
          label="Documents"
          description="Powers of Attorney and supporting documents for this client."
          rightAction={<DocumentActions clientId={client.id} />}
        >
          {pendingIntakes && pendingIntakes.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              {pendingIntakes.map((intake) => (
                <PendingIntakeRow key={intake.id} intake={intake} />
              ))}
            </div>
          )}
          {documents && documents.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {documents.map((doc) => (
                <DocumentRow key={doc.id} doc={doc} clientId={client.id} />
              ))}
            </div>
          ) : (
            <div
              style={{
                padding: "24px",
                textAlign: "center",
                background: TOKENS.PAPER_2,
                border: `1px dashed ${TOKENS.LINE}`,
                borderRadius: 8,
              }}
            >
              <FileText
                size={20}
                strokeWidth={1.6}
                color={TOKENS.INK_40}
                style={{ marginBottom: 8 }}
              />
              <div style={{ fontSize: 13, color: TOKENS.INK_60, lineHeight: 1.5 }}>
                No documents yet. Use “Create POA” to fill one out yourself, or
                “Send intake link” to have the client complete it.
              </div>
            </div>
          )}
        </SectionCard>

        {/* Activity timeline */}
        <SectionCard
          label="Activity"
          description={
            auditEvents && auditEvents.length > 0
              ? `${auditEvents.length} event${auditEvents.length === 1 ? "" : "s"} on this client.`
              : null
          }
          rightAction={
            wizardSessions && wizardSessions.length > 0 ? (
              <a
                href={`/wizard/audit?clientId=${client.id}`}
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: TOKENS.INK_60,
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Shield size={12} strokeWidth={2} />
                Full audit log
              </a>
            ) : null
          }
        >
          <ActivityTimeline events={auditEvents} />
        </SectionCard>

        {/* Danger zone — archive */}
        {!isArchived && (
          <SectionCard label="Danger zone">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
                padding: "8px 0",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13.5,
                    fontWeight: 600,
                    color: TOKENS.INK,
                    marginBottom: 2,
                  }}
                >
                  Archive this client
                </div>
                <div style={{ fontSize: 12.5, color: TOKENS.INK_60, lineHeight: 1.45 }}>
                  Hides them from default views. Documents and audit log are preserved.
                  Can be restored at any time.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setArchiveOpen(true)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "8px 14px",
                  fontSize: 13,
                  fontWeight: 500,
                  background: TOKENS.PAPER,
                  color: "#991B1B",
                  border: "1px solid #FCA5A5",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  flexShrink: 0,
                }}
              >
                <Archive size={13} strokeWidth={2} />
                Archive
              </button>
            </div>
          </SectionCard>
        )}
      </div>

      <ConfirmDialog
        open={archiveOpen}
        onCancel={() => setArchiveOpen(false)}
        onConfirm={handleArchive}
        title={isArchived ? "Restore this client?" : "Archive this client?"}
        message={
          isArchived
            ? `${client.name} will return to active status. Their data is unchanged.`
            : `${client.name} will be hidden from default views. Their documents and audit log are preserved and they can be restored at any time.`
        }
        confirmLabel={isArchived ? "Restore" : "Archive"}
        confirmTone={isArchived ? "neutral" : "destructive"}
        loading={archiving}
      />

      <style suppressHydrationWarning>{`
        .spin-anim { animation: spin 0.8s linear infinite; }
        @keyframes spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}

const fieldStyle = {
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

function SectionCard({ label, description, rightBadge, rightAction, children }) {
  return (
    <div
      style={{
        background: TOKENS.PAPER,
        border: `1px solid ${TOKENS.LINE}`,
        borderRadius: 10,
        padding: "22px 24px",
        marginBottom: 14,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: description ? 4 : 14,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <h2
            style={{
              fontSize: 14.5,
              fontWeight: 600,
              letterSpacing: "-0.01em",
              margin: 0,
              color: TOKENS.INK,
            }}
          >
            {label}
          </h2>
          {rightBadge && (
            <span
              style={{
                fontSize: 10,
                fontFamily: FONTS.MONO,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                fontWeight: 600,
                color: TOKENS.INK_60,
                background: TOKENS.PAPER_2,
                border: `1px solid ${TOKENS.LINE}`,
                padding: "2px 7px",
                borderRadius: 4,
              }}
            >
              {rightBadge}
            </span>
          )}
        </div>
        {rightAction}
      </div>
      {description && (
        <p
          style={{
            fontSize: 12.5,
            color: TOKENS.INK_60,
            margin: "0 0 14px",
            lineHeight: 1.5,
          }}
        >
          {description}
        </p>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>{children}</div>
    </div>
  );
}

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
          <span
            style={{
              color: TOKENS.INK_40,
              fontWeight: 400,
              marginLeft: 6,
              fontSize: 11,
            }}
          >
            optional
          </span>
        )}
      </label>
      {input}
      {helpText && (
        <div
          style={{
            marginTop: 6,
            fontSize: 12,
            color: TOKENS.INK_40,
            lineHeight: 1.45,
          }}
        >
          {helpText}
        </div>
      )}
    </div>
  );
}

function DocumentRow({ doc, clientId }) {
  const isTerminalState = doc.status === "revoked" || doc.status === "superseded";
  const isDraft = doc.status === "draft";
  // Sprint 6 (post-attorney-review correction): documents flagged for
  // attorney attention block locking and surface a banner with the dismiss
  // action. Two known reasons:
  //   - client_submitted_intake — attorney must confirm before locking
  //   - newer_poa_exists — older POA flagged when a newer one was created
  const needsAttention = doc.attentionRequired;
  // Sprint 5: presentation/revocation operate on a document that's at least
  // locked for signing (a real, frozen artifact) or executed. The legacy
  // statuses (generated/signed/notarized/delivered) are kept working too for
  // any pre-existing rows, but new documents flow draft → locked → executed.
  // potential_replacement_review_required is intentionally excluded — the
  // document is in legal limbo until the attorney dismisses the flag.
  const isPresentable =
    doc.status === "locked_for_signing" ||
    doc.status === "executed" ||
    doc.status === "generated" ||
    doc.status === "signed" ||
    doc.status === "notarized" ||
    doc.status === "delivered";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {needsAttention && (
        <AttentionBanner
          documentId={doc.id}
          reason={doc.attentionReason}
          status={doc.status}
        />
      )}
    <div
      style={{
        padding: "12px 14px",
        background: isTerminalState ? "#FAFAFA" : TOKENS.PAPER_2,
        border: `1px solid ${TOKENS.LINE}`,
        borderRadius: 7,
        display: "flex",
        alignItems: "center",
        gap: 12,
        opacity: isTerminalState ? 0.78 : 1,
        flexWrap: "wrap",
      }}
    >
      <FileText size={14} strokeWidth={1.8} color={TOKENS.INK_60} />
      <div style={{ flex: 1, minWidth: 120 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: TOKENS.INK,
            textDecoration: isTerminalState ? "line-through" : "none",
          }}
        >
          {doc.documentType?.replace(/_/g, " ") || "Document"}
        </div>
        <div style={{ fontSize: 11, color: TOKENS.INK_60, fontFamily: FONTS.MONO, marginTop: 2 }}>
          {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : ""}
          {doc.lockedAt && (
            <> · locked {new Date(doc.lockedAt).toLocaleDateString()}</>
          )}
        </div>
      </div>
      <DocumentStatusBadge status={doc.status} />

      {/* View PDF — draft serves a watermarked regeneration; locked/executed
          serve the frozen binary. Either way, same endpoint. */}
      <a
        href={`/api/documents/${doc.id}/pdf`}
        target="_blank"
        rel="noopener noreferrer"
        style={pdfLinkStyle}
      >
        {isDraft ? "View draft" : "View PDF"}
      </a>

      {/* Lock for signing — only on drafts without attention required. The
          endpoint also enforces this; this just keeps the UI consistent. */}
      {isDraft && !needsAttention && <LockForSigningButton documentId={doc.id} />}

      {isPresentable && clientId && (
        <a href={`/app/clients/${clientId}/present?documentId=${doc.id}`} style={presentLinkStyle}>
          Generate packet
        </a>
      )}
      {isPresentable && clientId && (
        <a href={`/app/clients/${clientId}/revoke?documentId=${doc.id}`} style={revokeLinkStyle}>
          Revoke
        </a>
      )}
    </div>
    </div>
  );
}

const pdfLinkStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  padding: "6px 10px",
  background: TOKENS.PAPER,
  color: TOKENS.INK,
  border: `1px solid ${TOKENS.LINE}`,
  borderRadius: 6,
  fontSize: 11.5,
  fontWeight: 600,
  textDecoration: "none",
  whiteSpace: "nowrap",
};

const presentLinkStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  padding: "6px 10px",
  background: TOKENS.PAPER,
  color: "#1E40AF",
  border: "1px solid #BFDBFE",
  borderRadius: 6,
  fontSize: 11.5,
  fontWeight: 600,
  textDecoration: "none",
  whiteSpace: "nowrap",
};

const revokeLinkStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  padding: "6px 10px",
  background: TOKENS.PAPER,
  color: "#991B1B",
  border: "1px solid #FECACA",
  borderRadius: 6,
  fontSize: 11.5,
  fontWeight: 600,
  textDecoration: "none",
  whiteSpace: "nowrap",
};

/**
 * LockForSigningButton — freezes a draft into an immutable signing copy.
 * Sprint 5 R2.
 */
function LockForSigningButton({ documentId }) {
  const [loading, setLoading] = useState(false);

  async function handleLock() {
    if (typeof window !== "undefined") {
      const ok = window.confirm(
        "Lock this POA for signing? This freezes the exact document and its " +
          "hash. After locking it can't be edited — any change would create a " +
          "new version."
      );
      if (!ok) return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/documents/${documentId}/lock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || `Lock failed (${res.status})`);
      }
      if (typeof window !== "undefined") window.location.reload();
    } catch (err) {
      setLoading(false);
      if (typeof window !== "undefined") {
        window.alert("Could not lock the document: " + err.message);
      }
    }
  }

  return (
    <button
      type="button"
      onClick={handleLock}
      disabled={loading}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "6px 10px",
        background: TOKENS.INK,
        color: TOKENS.PAPER,
        border: "none",
        borderRadius: 6,
        fontSize: 11.5,
        fontWeight: 600,
        cursor: loading ? "wait" : "pointer",
        whiteSpace: "nowrap",
      }}
    >
      {loading ? "Locking…" : "Lock for signing"}
    </button>
  );
}

/**
 * AttentionBanner — surfaces an attorney-review-required flag on a
 * document, with the dismiss action. Two reasons today:
 *
 *   client_submitted_intake — the draft came from the unauthenticated
 *     send-link intake. Attorney must confirm contents before the document
 *     can be locked. Dismissing the flag releases the draft for locking;
 *     status stays "draft".
 *
 *   newer_poa_exists — this is an older POA, and a newer one was created
 *     for the same client. Per Texas law, that does NOT by itself revoke
 *     this POA. The attorney's choices are:
 *       (a) execute a formal revocation instrument using the Revoke flow,
 *       (b) dismiss this flag with a reason if the newer POA does NOT
 *           replace this one.
 *
 * Sprint 6 (post-attorney-review correction).
 */
function AttentionBanner({ documentId, reason, status }) {
  const [dismissing, setDismissing] = useState(false);
  const [showDismiss, setShowDismiss] = useState(false);
  const [dismissalReason, setDismissalReason] = useState("");

  const copy = bannerCopyForReason(reason, status);

  async function handleDismiss() {
    setDismissing(true);
    try {
      const res = await fetch(`/api/documents/${documentId}/dismiss-attention`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dismissalReason }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || `Dismiss failed (${res.status})`);
      }
      if (typeof window !== "undefined") window.location.reload();
    } catch (err) {
      setDismissing(false);
      if (typeof window !== "undefined") {
        window.alert("Could not dismiss the flag: " + err.message);
      }
    }
  }

  return (
    <div
      style={{
        background: "#FEF3C7",
        border: "1px solid #FCD34D",
        borderBottom: "none",
        borderRadius: "7px 7px 0 0",
        padding: "10px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
        <AlertTriangle size={14} strokeWidth={2} color="#92400E" style={{ marginTop: 2, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: "#78350F", marginBottom: 2 }}>
            {copy.title}
          </div>
          <div style={{ fontSize: 12, color: "#78350F", lineHeight: 1.45 }}>{copy.body}</div>
        </div>
        {!showDismiss && (
          <button
            type="button"
            onClick={() => setShowDismiss(true)}
            style={{
              padding: "5px 10px",
              background: TOKENS.PAPER,
              color: "#78350F",
              border: "1px solid #FCD34D",
              borderRadius: 6,
              fontSize: 11.5,
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {copy.dismissLabel}
          </button>
        )}
      </div>
      {showDismiss && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingLeft: 22 }}>
          <textarea
            value={dismissalReason}
            onChange={(e) => setDismissalReason(e.target.value)}
            placeholder={copy.dismissPlaceholder}
            rows={2}
            style={{
              fontSize: 12,
              padding: "6px 8px",
              border: `1px solid ${TOKENS.LINE}`,
              borderRadius: 5,
              fontFamily: FONTS.SANS,
              resize: "vertical",
            }}
          />
          <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={() => {
                setShowDismiss(false);
                setDismissalReason("");
              }}
              style={{
                padding: "5px 10px",
                background: "transparent",
                color: "#78350F",
                border: "none",
                borderRadius: 5,
                fontSize: 11.5,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              disabled={dismissing || !dismissalReason.trim()}
              style={{
                padding: "5px 10px",
                background: TOKENS.INK,
                color: TOKENS.PAPER,
                border: "none",
                borderRadius: 5,
                fontSize: 11.5,
                fontWeight: 600,
                cursor: dismissing ? "wait" : "pointer",
                opacity: !dismissalReason.trim() ? 0.5 : 1,
              }}
            >
              {dismissing ? "Dismissing…" : "Confirm dismiss"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function bannerCopyForReason(reason, status) {
  if (reason === "newer_poa_exists") {
    return {
      title: "Attorney review required: a newer POA was created for this client",
      body:
        "Under Texas law, a later durable POA does not by itself revoke an earlier one " +
        "unless the new instrument expressly says so. To formally revoke this POA, use " +
        "the Revoke flow. If the newer POA does NOT replace this one, dismiss this flag " +
        "with a brief reason.",
      dismissLabel: "Dismiss flag",
      dismissPlaceholder: "Why doesn't the newer POA replace this one? (e.g., different scope)",
    };
  }
  if (reason === "client_submitted_intake") {
    return {
      title: "Attorney review required before locking",
      body:
        "This draft was completed by the client via an intake link. Review the contents, " +
        "then dismiss this flag to release the draft for locking.",
      dismissLabel: "Mark as reviewed",
      dismissPlaceholder: "Brief note about your review (optional but recommended).",
    };
  }
  return {
    title: "Attorney review required",
    body: "This document is flagged for review before any further action.",
    dismissLabel: "Dismiss",
    dismissPlaceholder: "Reason for dismissing this flag.",
  };
}

/**
 * RevocationRow — compact row used in the Revocations section of the
 * client profile. Shows scope, status, counts, links to the detail view.
 * Sprint 4c R3.
 */
function RevocationRow({ revocation, clientId }) {
  const status = REVOCATION_STATUS_VISUAL[revocation.status] || REVOCATION_STATUS_VISUAL.draft;
  const scopeLabel = REVOCATION_SCOPE_LABELS[revocation.scope] || revocation.scope;

  return (
    <a
      href={`/app/clients/${clientId}/revocations/${revocation.id}`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 14px",
        background: TOKENS.PAPER_2,
        border: `1px solid ${TOKENS.LINE}`,
        borderRadius: 7,
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: "#FEF2F2",
          border: "1px solid #FECACA",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          color: "#B91C1C",
        }}
      >
        <ShieldOff size={14} strokeWidth={1.8} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: TOKENS.INK, marginBottom: 2 }}>
          {scopeLabel}
        </div>
        <div style={{ fontSize: 11, color: TOKENS.INK_60, fontFamily: FONTS.MONO }}>
          {revocation.executedAt
            ? `Executed ${new Date(revocation.executedAt).toLocaleDateString()}`
            : `Draft created ${new Date(revocation.createdAt).toLocaleDateString()}`}
          {typeof revocation.noticesTotal === "number" && (
            <>
              {" · "}
              {revocation.noticesSent}/{revocation.noticesTotal} notices sent
            </>
          )}
        </div>
      </div>
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          padding: "3px 8px",
          background: status.bg,
          color: status.color,
          borderRadius: 999,
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: 0.2,
          whiteSpace: "nowrap",
        }}
      >
        {status.label}
      </span>
    </a>
  );
}

const REVOCATION_STATUS_VISUAL = {
  draft: { label: "Draft", bg: "#E5E7EB", color: "#374151" },
  executed: { label: "Executed", bg: "#FEF3C7", color: "#92400E" },
  notice_in_progress: { label: "Notice In Progress", bg: "#DBEAFE", color: "#1E40AF" },
  complete: { label: "Complete", bg: "#D1FAE5", color: "#065F46" },
};

const REVOCATION_SCOPE_LABELS = {
  specific_poa: "Revokes a specific Power of Attorney",
  all_prior: "Revokes this and all prior financial POAs",
  agent_only: "Revokes a specific agent's authority",
};

// Status tone → badge colors for presentation rows
const PRESENTATION_STATUS_VISUAL = {
  neutral: { bg: "#E5E7EB", color: "#374151" },
  info: { bg: "#DBEAFE", color: "#1E40AF" },
  success: { bg: "#D1FAE5", color: "#065F46" },
  warning: { bg: "#FEF3C7", color: "#92400E" },
  danger: { bg: "#FEE2E2", color: "#991B1B" },
};

/**
 * PresentationRow — compact row used in the Institution Presentations section
 * of the client profile. Shows institution name, status, response count, and
 * links to the presentation detail view. Sprint 4d R3.
 */
function PresentationRow({ presentation, clientId }) {
  const statusDisplay = getPresentationStatusDisplay(presentation.status);
  const visual = PRESENTATION_STATUS_VISUAL[statusDisplay.tone] || PRESENTATION_STATUS_VISUAL.neutral;
  const responsesTotal =
    typeof presentation.responsesTotal === "number" ? presentation.responsesTotal : 0;

  return (
    <a
      href={`/app/clients/${clientId}/presentations/${presentation.id}`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 14px",
        background: TOKENS.PAPER_2,
        border: `1px solid ${TOKENS.LINE}`,
        borderRadius: 7,
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: "#EFF6FF",
          border: "1px solid #BFDBFE",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          color: "#1E40AF",
        }}
      >
        <Send size={14} strokeWidth={1.8} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: TOKENS.INK, marginBottom: 2 }}>
          {presentation.institutionName}
        </div>
        <div style={{ fontSize: 11, color: TOKENS.INK_60, fontFamily: FONTS.MONO }}>
          Created {new Date(presentation.createdAt).toLocaleDateString()}
          {responsesTotal > 0 && (
            <>
              {" · "}
              {responsesTotal} response{responsesTotal === 1 ? "" : "s"}
            </>
          )}
        </div>
      </div>
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          padding: "3px 10px",
          background: visual.bg,
          color: visual.color,
          borderRadius: 999,
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: 0.2,
          whiteSpace: "nowrap",
        }}
      >
        {statusDisplay.displayName}
      </span>
    </a>
  );
}

/**
 * DocumentActions — the two intake entry points: fill-for-client ("Create
 * POA") and send-link ("Send intake link"). Sprint 5 R1 + R3.
 */
function DocumentActions({ clientId }) {
  const [creating, setCreating] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);

  async function handleCreate() {
    setCreating(true);
    try {
      const res = await fetch("/api/wizard/start-for-client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || `Could not start intake (${res.status})`);
      }
      const { sessionId } = await res.json();
      if (typeof window !== "undefined") {
        window.location.href = `/wizard?session=${encodeURIComponent(sessionId)}`;
      }
    } catch (err) {
      setCreating(false);
      if (typeof window !== "undefined") {
        window.alert("Could not start the POA intake: " + err.message);
      }
    }
  }

  return (
    <div style={{ display: "inline-flex", gap: 8 }}>
      <button
        type="button"
        onClick={() => setShowLinkModal(true)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "8px 14px",
          background: TOKENS.PAPER,
          color: TOKENS.INK,
          border: `1px solid ${TOKENS.LINE}`,
          borderRadius: 6,
          fontSize: 12.5,
          fontWeight: 600,
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        <Send size={13} strokeWidth={2.2} /> Send intake link
      </button>
      <button
        type="button"
        onClick={handleCreate}
        disabled={creating}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "8px 14px",
          background: TOKENS.INK,
          color: TOKENS.PAPER,
          border: "none",
          borderRadius: 6,
          fontSize: 12.5,
          fontWeight: 600,
          cursor: creating ? "wait" : "pointer",
          whiteSpace: "nowrap",
        }}
      >
        <FileText size={13} strokeWidth={2.2} />
        {creating ? "Starting…" : "Create POA"}
      </button>
      {showLinkModal && (
        <SendIntakeLinkModal clientId={clientId} onClose={() => setShowLinkModal(false)} />
      )}
    </div>
  );
}

const INTAKE_EXPIRY_CHOICES = [
  { days: 1, label: "1 day" },
  { days: 3, label: "3 days" },
  { days: 7, label: "7 days" },
  { days: 14, label: "14 days" },
];

/**
 * SendIntakeLinkModal — generates a secure intake link with a chosen expiry
 * and shows it once for the pro to copy. The raw link can't be re-displayed
 * later (we store only its hash), so copying it now matters. Sprint 5 R3.
 */
function SendIntakeLinkModal({ clientId, onClose }) {
  const [expiryDays, setExpiryDays] = useState(3);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/wizard/create-intake-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, expiryDays }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || `Failed (${res.status})`);
      }
      setResult(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  }

  async function handleCopy() {
    if (!result?.url) return;
    try {
      await navigator.clipboard.writeText(result.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard may be unavailable; the field is selectable as a fallback
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: TOKENS.PAPER,
          borderRadius: 12,
          padding: 24,
          maxWidth: 520,
          width: "100%",
          fontFamily: FONTS.SANS,
        }}
      >
        <h3 style={{ fontSize: 17, fontWeight: 600, color: TOKENS.INK, margin: "0 0 6px" }}>
          Send an intake link
        </h3>
        <p style={{ fontSize: 13, color: TOKENS.INK_60, lineHeight: 1.5, margin: "0 0 18px" }}>
          The client opens the link, fills out the Power of Attorney themselves,
          and the finished draft lands here on their profile. For security the
          link expires — choose how long it should stay valid.
        </p>

        {!result ? (
          <>
            <div
              style={{
                fontSize: 11,
                fontFamily: FONTS.MONO,
                color: TOKENS.INK_60,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                fontWeight: 600,
                marginBottom: 8,
              }}
            >
              Link expires after
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
              {INTAKE_EXPIRY_CHOICES.map((choice) => (
                <button
                  key={choice.days}
                  type="button"
                  onClick={() => setExpiryDays(choice.days)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 6,
                    border: `1.5px solid ${expiryDays === choice.days ? TOKENS.INK : TOKENS.LINE}`,
                    background: expiryDays === choice.days ? TOKENS.INK : TOKENS.PAPER,
                    color: expiryDays === choice.days ? TOKENS.PAPER : TOKENS.INK,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {choice.label}
                </button>
              ))}
            </div>
            {error && (
              <div style={{ fontSize: 12.5, color: "#991B1B", marginBottom: 12 }}>{error}</div>
            )}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button type="button" onClick={onClose} style={ghostBtnStyle}>
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={generating}
                style={primaryBtnStyle(generating)}
              >
                {generating ? "Generating…" : "Generate link"}
              </button>
            </div>
          </>
        ) : (
          <>
            <div
              style={{
                fontSize: 11,
                fontFamily: FONTS.MONO,
                color: TOKENS.INK_60,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                fontWeight: 600,
                marginBottom: 8,
              }}
            >
              Copy this link now — it won't be shown again
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <input
                readOnly
                value={result.url}
                onFocus={(e) => e.target.select()}
                style={{
                  flex: 1,
                  padding: "9px 12px",
                  fontSize: 12.5,
                  fontFamily: FONTS.MONO,
                  border: `1px solid ${TOKENS.LINE}`,
                  borderRadius: 6,
                  color: TOKENS.INK,
                  background: TOKENS.PAPER_2,
                  outline: "none",
                }}
              />
              <button type="button" onClick={handleCopy} style={primaryBtnStyle(false)}>
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <p style={{ fontSize: 12, color: TOKENS.INK_60, margin: "0 0 18px" }}>
              Expires {new Date(result.expiresAt).toLocaleString()}. You can extend
              it later from the pending list below.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (typeof window !== "undefined") window.location.reload();
                }}
                style={primaryBtnStyle(false)}
              >
                Done
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const ghostBtnStyle = {
  padding: "9px 14px",
  background: "transparent",
  color: TOKENS.INK_60,
  border: "none",
  borderRadius: 6,
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
};

function primaryBtnStyle(busy) {
  return {
    padding: "9px 16px",
    background: TOKENS.INK,
    color: TOKENS.PAPER,
    border: "none",
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 600,
    cursor: busy ? "wait" : "pointer",
  };
}

/**
 * PendingIntakeRow — an outstanding send-link intake, with its status and an
 * Extend action. The raw link isn't re-shown (only its hash is stored), but
 * extension keeps the link the pro already sent working longer. Sprint 5 R3.
 */
function PendingIntakeRow({ intake }) {
  const [extending, setExtending] = useState(false);
  const [expiresAt, setExpiresAt] = useState(intake.expiresAt);
  const [expired, setExpired] = useState(intake.expired);

  async function handleExtend() {
    setExtending(true);
    try {
      const res = await fetch("/api/wizard/extend-intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: intake.id, expiryDays: 7 }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || `Extend failed (${res.status})`);
      }
      const data = await res.json();
      setExpiresAt(data.expiresAt);
      setExpired(false);
    } catch (err) {
      if (typeof window !== "undefined") window.alert("Could not extend: " + err.message);
    } finally {
      setExtending(false);
    }
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 14px",
        background: "#EFF6FF",
        border: "1px solid #BFDBFE",
        borderRadius: 7,
        marginBottom: 8,
      }}
    >
      <Send size={14} strokeWidth={1.8} color="#1E40AF" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: "#1E3A8A" }}>
          {expired ? "Intake link expired" : "Intake link sent — awaiting client"}
        </div>
        <div style={{ fontSize: 11, color: "#1E3A8A", opacity: 0.8, fontFamily: FONTS.MONO }}>
          {expiresAt
            ? `${expired ? "Expired" : "Expires"} ${new Date(expiresAt).toLocaleDateString()}`
            : ""}
        </div>
      </div>
      <button
        type="button"
        onClick={handleExtend}
        disabled={extending}
        style={{
          padding: "5px 10px",
          background: TOKENS.PAPER,
          color: "#1E40AF",
          border: "1px solid #BFDBFE",
          borderRadius: 6,
          fontSize: 11.5,
          fontWeight: 600,
          cursor: extending ? "wait" : "pointer",
          whiteSpace: "nowrap",
        }}
      >
        {extending ? "Extending…" : "Extend 7 days"}
      </button>
    </div>
  );
}
