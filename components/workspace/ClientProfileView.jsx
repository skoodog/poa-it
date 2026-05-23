"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Archive,
  RotateCcw,
  Shield,
  FileText,
  Sparkles,
  Save,
  Loader2,
  Check,
} from "lucide-react";
import { TopBar } from "./TopBar";
import { ClientStatusBadge } from "./ClientStatusBadge";
import { DocumentStatusBadge } from "./DocumentStatusBadge";
import { ActivityTimeline } from "./ActivityTimeline";
import { ConfirmDialog } from "./ConfirmDialog";
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

export function ClientProfileView({ client, auditEvents, documents, wizardSessions }) {
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

        {/* Documents stub */}
        <SectionCard
          label="Documents"
          rightBadge="Sprint 4"
          description="POAs and supporting documents for this client appear here once PDF generation ships."
        >
          {documents && documents.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {documents.map((doc) => (
                <DocumentRow key={doc.id} doc={doc} />
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
                No documents yet. Sprint 4 ships PDF generation; Sprint 5 wires the
                intake flows that produce documents tied to this client.
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

function DocumentRow({ doc }) {
  const isTerminalState = doc.status === "revoked" || doc.status === "superseded";

  return (
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
      }}
    >
      <FileText size={14} strokeWidth={1.8} color={TOKENS.INK_60} />
      <div style={{ flex: 1, minWidth: 0 }}>
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
        </div>
      </div>
      <DocumentStatusBadge status={doc.status} />
    </div>
  );
}
