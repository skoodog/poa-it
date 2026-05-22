"use client";

import { useEffect, useState } from "react";
import { Edit3, CheckCircle2, Mail, FileText, Shield, AlertCircle, Download, Loader2 } from "lucide-react";
import { TOKENS, FONTS } from "../shared/tokens";
import { WizardShell } from "../WizardShell";
import { StatutoryTooltip } from "../shared/StatutoryTooltip";
import { Disclaimer } from "../shared/Disclaimer";
import { AcknowledgmentCheckbox } from "../shared/AcknowledgmentCheckbox";
import { getAllGeneralPowers, getAllHotPowers } from "../../../lib/clauseLibrary/engine";
import { updateState, markStepComplete, getOrCreateAnonymousId, syncToServer } from "../../../lib/wizard/state";
import { audit } from "../../../lib/audit/logger";

/**
 * Step 8 — Review
 * Phase 3 § 3.10
 *
 * Final summary before the user proceeds to the waitlist signup. Every
 * choice is summarized with an "Edit" link routing back to the relevant
 * step. Five required pre-purchase acknowledgments are the evidentiary
 * record that the user understood what they were doing.
 */
export function Step8_Review({ state, setState, onBack, onContinue }) {
  useEffect(() => {
    audit.stepEntered(state.sessionId, "step8_review");
  }, [state.sessionId]);

  const allPowers = getAllGeneralPowers();
  const hotPowers = getAllHotPowers();

  // Preview-PDF generation state
  const [generatingPreview, setGeneratingPreview] = useState(false);
  const [previewError, setPreviewError] = useState(null);

  // ===== TEMP: download-for-attorney-review feature =====
  // Sprint 4b note — REMOVE BEFORE PRODUCTION LAUNCH.
  // This separate download button exists so the founder can email the
  // generated PDF to counsel for legal review. The standard "Generate preview"
  // path opens in a new tab; some browsers (Safari + certain PDF viewers)
  // make download-from-viewer unreliable, which blocks the review workflow.
  // Remove this state + handler + button when attorney review is complete.
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  async function handleGeneratePreview() {
    if (generatingPreview) return;
    setGeneratingPreview(true);
    setPreviewError(null);
    try {
      // Force a sync to the server before generating the PDF — otherwise the
      // server might not have the latest wizard state yet (the periodic sync
      // is debounced 800ms after each state change).
      const syncResult = await syncToServer(state);
      if (!syncResult.ok) {
        setPreviewError("session_not_found");
        setGeneratingPreview(false);
        return;
      }

      const anonymousId = getOrCreateAnonymousId();
      const res = await fetch("/api/wizard/generate-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ anonymousId }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        setPreviewError(errJson.error || "preview_failed");
        setGeneratingPreview(false);
        return;
      }

      // Open the PDF in a new tab
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      if (typeof window !== "undefined") {
        window.open(url, "_blank", "noopener,noreferrer");
        // Release the blob URL after a delay (gives the new tab time to load)
        setTimeout(() => URL.revokeObjectURL(url), 60000);
      }

      audit.fieldChanged(state.sessionId, "preview_generated", true);
    } catch (err) {
      setPreviewError("network_error");
    } finally {
      setGeneratingPreview(false);
    }
  }

  // ===== TEMP: download-for-attorney-review handler =====
  // REMOVE BEFORE PRODUCTION LAUNCH (Sprint 4b cleanup).
  // Same fetch path as handleGeneratePreview, but instead of opening in a
  // new tab, programmatically triggers a download via an anchor tag click.
  // This is the most reliable cross-browser way to force a save-to-disk.
  async function handleDownloadPdf() {
    if (downloadingPdf) return;
    setDownloadingPdf(true);
    setPreviewError(null);
    try {
      const syncResult = await syncToServer(state);
      if (!syncResult.ok) {
        setPreviewError("session_not_found");
        setDownloadingPdf(false);
        return;
      }

      const anonymousId = getOrCreateAnonymousId();
      const res = await fetch("/api/wizard/generate-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ anonymousId }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        setPreviewError(errJson.error || "preview_failed");
        setDownloadingPdf(false);
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      // Build a meaningful filename from wizard state
      const principalName = (state.principalFullLegalName || "Principal")
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^a-zA-Z0-9-]/g, "");
      const dateStr = new Date().toISOString().slice(0, 10);
      const filename = `Texas-POA-${principalName}-${dateStr}-preview.pdf`;

      // Programmatic anchor-click download — works in every browser
      if (typeof window !== "undefined" && typeof document !== "undefined") {
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.style.display = "none";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        // Revoke the URL after the download starts (5 seconds is plenty)
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      }

      audit.fieldChanged(state.sessionId, "preview_downloaded", true);
    } catch (err) {
      setPreviewError("network_error");
    } finally {
      setDownloadingPdf(false);
    }
  }

  function jumpToStep(stepId) {
    setState(updateState(state, { currentStep: stepId }));
    audit.fieldChanged(state.sessionId, "review_edit_jump", true);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Pre-purchase acknowledgments
  const acks = state.prePurchaseAcknowledgments || {
    reviewedAccurate: false,
    notLawFirm: false,
    scopeLimitations: false,
    termsAndPrivacy: false,
    refundPolicy: false,
  };

  function updateAck(key, value) {
    const newAcks = { ...acks, [key]: value };
    setState(updateState(state, { prePurchaseAcknowledgments: newAcks }));
  }

  const allAcksConfirmed = Object.values(acks).every(Boolean);
  const canContinue = allAcksConfirmed;

  function handleContinue() {
    if (!canContinue) return;
    audit.stepCompleted(state.sessionId, "step8_review", {
      allAcknowledgmentsRecorded: true,
      finalWizardSummary: {
        documentType: state.documentType,
        agentRelationship: state.agentRelationship,
        powersGranted: state.powersGranted,
        hotPowersGranted: state.hotPowersGranted,
        effectiveDateChoice: state.effectiveDateChoice,
        executionMethod: state.executionMethod,
      },
    });
    const next = markStepComplete(state, "step8_review", "step9_waitlist");
    setState(next);
    onContinue();
  }

  // Build the powers summary
  const allPowersChecked = state.powersGranted?.includes("all_powers");
  const grantedPowerNames = allPowersChecked
    ? ["All 14 categories (line O)"]
    : (state.powersGranted || [])
        .filter((p) => p !== "all_powers")
        .map((key) => {
          const power = allPowers.find((p) => p.clause_id === `power_${key}`);
          return power ? `(${power.letter}) ${power.plain_english_name}` : key;
        });

  const grantedHotPowerNames = (state.hotPowersGranted || []).map((id) => {
    if (id === "hot_power_gifts") {
      const limitDesc =
        state.giftLimitChoice === "default"
          ? "default $19,000/donee limit"
          : state.giftLimitChoice === "above_annual_exclusion"
          ? "above annual exclusion"
          : "limit not specified";
      return `Authority to make gifts (${limitDesc})`;
    }
    // Step 5 may store either short keys (hot_power_trust) or full clause_ids
    // (hot_power_create_amend_trust) — handle both
    const hp = hotPowers.find((h) => h.clause_id === id);
    if (hp) return hp.plain_english_name;
    // Fallback for short keys
    const shortKeyMap = {
      hot_power_trust: "Authority to create, amend, revoke, or terminate a trust",
      hot_power_survivorship: "Authority to change rights of survivorship",
      hot_power_beneficiary: "Authority to change beneficiary designations",
      hot_power_delegate: "Authority to delegate",
    };
    return shortKeyMap[id] || id;
  });

  return (
    <WizardShell
      stepId="step8_review"
      stepNumber="Step 9 of 9 · Review"
      title="Review your Texas Power of Attorney."
      subtitle="Here's a summary of what you've created. Make sure everything looks right — you can edit any section before continuing."
      onBack={onBack}
      onContinue={handleContinue}
      canContinue={canContinue}
      continueLabel="Continue to waitlist"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16, fontFamily: FONTS.SANS }}>
        {/* PREVIEW PDF PANEL */}
        <div
          style={{
            padding: "16px 18px",
            background: TOKENS.PAPER_2,
            border: `1px solid ${TOKENS.LINE}`,
            borderRadius: 10,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: TOKENS.PAPER,
                border: `1px solid ${TOKENS.LINE}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: TOKENS.INK_60,
                flexShrink: 0,
              }}
            >
              <FileText size={17} strokeWidth={1.8} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: TOKENS.INK,
                  marginBottom: 4,
                  letterSpacing: "-0.005em",
                }}
              >
                See what your document will look like
              </div>
              <div style={{ fontSize: 13, color: TOKENS.INK_60, lineHeight: 1.5 }}>
                Generate a draft preview of your Texas Statutory Durable POA. The
                preview is watermarked and has no legal effect until purchased
                and notarized.
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={handleGeneratePreview}
              disabled={generatingPreview || downloadingPdf}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "9px 16px",
                fontSize: 13,
                fontWeight: 600,
                background: generatingPreview ? TOKENS.INK_20 : TOKENS.INK,
                color: TOKENS.PAPER,
                border: "none",
                borderRadius: 7,
                cursor: generatingPreview ? "wait" : "pointer",
                fontFamily: FONTS.SANS,
              }}
            >
              {generatingPreview ? (
                <>
                  <Loader2 size={13} strokeWidth={2.2} className="spin-anim" />
                  Generating...
                </>
              ) : (
                <>
                  <Download size={13} strokeWidth={2.2} />
                  Generate preview PDF
                </>
              )}
            </button>

            {/* ===== TEMP: download-for-attorney-review button =====
                REMOVE BEFORE PRODUCTION LAUNCH (Sprint 4b cleanup).
                Lets the founder force-download the generated PDF to email
                to counsel. Same generation path; different delivery. */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={generatingPreview || downloadingPdf}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "9px 16px",
                fontSize: 13,
                fontWeight: 600,
                background: TOKENS.PAPER,
                color: downloadingPdf ? TOKENS.INK_40 : TOKENS.INK,
                border: `1.5px solid ${TOKENS.LINE}`,
                borderRadius: 7,
                cursor: downloadingPdf ? "wait" : "pointer",
                fontFamily: FONTS.SANS,
              }}
              title="Temporary — for attorney review only"
            >
              {downloadingPdf ? (
                <>
                  <Loader2 size={13} strokeWidth={2.2} className="spin-anim" />
                  Preparing...
                </>
              ) : (
                <>
                  <Download size={13} strokeWidth={2.2} />
                  Download to disk
                </>
              )}
            </button>

            <span
              style={{
                fontSize: 11.5,
                color: TOKENS.INK_40,
                fontFamily: FONTS.MONO,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                fontWeight: 600,
              }}
            >
              Opens in new tab · Or download to share
            </span>
          </div>

          {previewError && (
            <div
              style={{
                padding: "10px 12px",
                background: "#FEF2F2",
                border: "1px solid #FCA5A5",
                borderRadius: 7,
                fontSize: 12.5,
                color: "#991B1B",
                lineHeight: 1.45,
              }}
            >
              {previewError === "session_not_found"
                ? "We couldn't find your wizard session on the server. Try refreshing this page and trying again."
                : previewError === "network_error"
                ? "Network error generating the preview. Check your connection and try again."
                : "Something went wrong generating the preview. Please try again, or contact support if the problem persists."}
            </div>
          )}

          <style suppressHydrationWarning>{`
            .spin-anim { animation: spin 0.8s linear infinite; }
            @keyframes spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }
          `}</style>
        </div>

        {/* PRINCIPAL */}
        <ReviewSection
          title="Principal (you)"
          editStep="step2_principal"
          onEdit={() => jumpToStep("step2_principal")}
        >
          <ReviewRow label="Name" value={state.principalFullLegalName} />
          <ReviewRow label="Date of birth" value={state.principalDob} />
          <ReviewRow
            label="Address"
            value={`${state.principalAddress}, ${state.principalCity}, TX ${state.principalZip}`}
          />
          <ReviewRow label="County" value={`${state.principalCounty} County, Texas`} />
          <ReviewRow label="Contact" value={`${state.principalEmail} · ${state.principalPhone}`} />
        </ReviewSection>

        {/* AGENT */}
        <ReviewSection
          title="Primary agent"
          editStep="step3_agent"
          onEdit={() => jumpToStep("step3_agent")}
        >
          <ReviewRow label="Name" value={state.agentFullLegalName} />
          <ReviewRow
            label="Relationship"
            value={formatRelationship(state.agentRelationship, state.agentRelationshipOther)}
          />
          <ReviewRow
            label="Address"
            value={`${state.agentAddress}, ${state.agentCity}, ${state.agentState} ${state.agentZip}`}
          />
          <ReviewRow label="Contact" value={`${state.agentEmail} · ${state.agentPhone}`} />
        </ReviewSection>

        {/* SUCCESSOR AGENT (if named) */}
        {state.successorAgentFullLegalName && (
          <ReviewSection
            title="Backup agent"
            editStep="step3_agent"
            onEdit={() => jumpToStep("step3_agent")}
          >
            <ReviewRow label="Name" value={state.successorAgentFullLegalName} />
            <ReviewRow label="Address" value={state.successorAgentAddress} />
            <ReviewRow
              label="Contact"
              value={`${state.successorAgentEmail} · ${state.successorAgentPhone}`}
            />
          </ReviewSection>
        )}

        {!state.successorAgentFullLegalName && (
          <div
            style={{
              padding: "12px 14px",
              background: TOKENS.WARN_BG,
              border: `1px solid ${TOKENS.WARN_BORDER}`,
              borderRadius: 8,
              fontSize: 13,
              color: TOKENS.WARN_INK,
              lineHeight: 1.5,
            }}
          >
            <strong style={{ color: TOKENS.WARN_INK_STRONG }}>No backup agent named.</strong> If
            your primary agent can't serve when needed, your family may need to go
            through guardianship court.{" "}
            <button
              onClick={() => jumpToStep("step3_agent")}
              style={{
                color: TOKENS.WARN_INK_STRONG,
                fontWeight: 600,
                textDecoration: "underline",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                fontSize: 13,
              }}
            >
              Add a backup agent →
            </button>
          </div>
        )}

        {/* POWERS GRANTED */}
        <ReviewSection
          title="Powers granted"
          editStep="step4_powers"
          onEdit={() => jumpToStep("step4_powers")}
        >
          {grantedPowerNames.length === 0 ? (
            <div style={{ color: TOKENS.ERR_INK, fontSize: 13 }}>
              No powers selected. This will need to be fixed before continuing.
            </div>
          ) : (
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
              {grantedPowerNames.map((name, i) => (
                <li
                  key={i}
                  style={{
                    fontSize: 13,
                    color: TOKENS.INK,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    lineHeight: 1.5,
                  }}
                >
                  <CheckCircle2 size={14} strokeWidth={2} color={TOKENS.LIVE_GREEN} />
                  {name}
                </li>
              ))}
            </ul>
          )}
        </ReviewSection>

        {/* HOMESTEAD (only if real-property granted) */}
        {(state.powersGranted?.includes("real_property") ||
          state.powersGranted?.includes("all_powers")) && (
          <ReviewSection
            title="Homestead"
            editStep="step4a_homestead"
            onEdit={() => jumpToStep("step4a_homestead")}
          >
            <ReviewRow
              label="Texas homestead"
              value={formatHomestead(state.ownsTexasHomestead)}
            />
            {state.ownsTexasHomestead === "yes_homestead" && (
              <ReviewRow
                label="Home equity authority"
                value={state.grantsHomeEquityAuthority ? "Granted" : "Not granted"}
              />
            )}
          </ReviewSection>
        )}

        {/* HOT POWERS (if any) */}
        {grantedHotPowerNames.length > 0 && (
          <ReviewSection
            title="Sensitive powers granted"
            editStep="step5_hot_powers"
            onEdit={() => jumpToStep("step5_hot_powers")}
          >
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
              {grantedHotPowerNames.map((name, i) => (
                <li
                  key={i}
                  style={{
                    fontSize: 13,
                    color: TOKENS.INK,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    lineHeight: 1.5,
                  }}
                >
                  <CheckCircle2 size={14} strokeWidth={2} color={TOKENS.LIVE_GREEN} />
                  {name}
                </li>
              ))}
            </ul>
          </ReviewSection>
        )}

        {/* EFFECTIVE DATE */}
        <ReviewSection
          title="Effective date"
          editStep="step6_effective_date"
          onEdit={() => jumpToStep("step6_effective_date")}
        >
          <ReviewRow
            label="Type"
            value={
              state.effectiveDateChoice === "immediate"
                ? "Immediate"
                : state.effectiveDateChoice === "springing"
                ? "Springing — effective only on physician-certified incapacity"
                : "Not selected"
            }
          />
        </ReviewSection>

        {/* EXECUTION METHOD */}
        <ReviewSection
          title="Signing method"
          editStep="step7_execution_method"
          onEdit={() => jumpToStep("step7_execution_method")}
        >
          <ReviewRow
            label="Method"
            value={
              state.executionMethod === "ron"
                ? "Remote Online Notarization (RON)"
                : state.executionMethod === "in_person"
                ? "In-person notary"
                : "Not selected"
            }
          />
          {state.executionMethodLocked && (
            <ReviewRow
              label="Why in-person"
              value="Required by Tex. Const. art. XVI § 50(a)(6)(N) for homestead + home-equity"
            />
          )}
        </ReviewSection>

        {/* DOCUMENTS YOU'LL RECEIVE */}
        <div
          style={{
            background: TOKENS.PAPER_2,
            border: `1px solid ${TOKENS.LINE}`,
            borderRadius: 10,
            padding: "18px 20px",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontFamily: FONTS.MONO,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: TOKENS.INK_40,
              fontWeight: 600,
              marginBottom: 12,
            }}
          >
            Documents you'll receive at launch
          </div>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
            <DocRow icon={FileText} title="Texas Statutory Durable Power of Attorney" />
            <DocRow icon={Shield} title="Acceptance of Appointment (for your agent to sign)" />
            <DocRow icon={Mail} title="Agent Instruction Document (plain-English guide for your agent)" />
            <DocRow icon={CheckCircle2} title="Audit log of your wizard choices (PDF)" />
          </ul>
          <div
            style={{
              marginTop: 12,
              paddingTop: 12,
              borderTop: `1px solid ${TOKENS.LINE}`,
              fontSize: 12,
              color: TOKENS.INK_60,
              lineHeight: 1.5,
            }}
          >
            If needed later, we'll also generate at no charge:
            <ul style={{ margin: "4px 0 0", paddingLeft: 18 }}>
              <li>Agent's Certification (§ 751.203) — if a bank refuses your POA</li>
              <li>Revocation form (§ 751.131) — if you ever need to revoke</li>
            </ul>
          </div>
        </div>

        {/* PRE-PURCHASE ACKNOWLEDGMENTS */}
        <div style={{ marginTop: 8 }}>
          <div
            style={{
              fontSize: 11,
              fontFamily: FONTS.MONO,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: TOKENS.INK_40,
              fontWeight: 600,
              marginBottom: 12,
            }}
          >
            Before you continue — required acknowledgments
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <AcknowledgmentCheckbox
              ruleId="prepurchase_reviewed_accurate"
              text="I've reviewed the choices above and they accurately reflect what I want."
              checked={acks.reviewedAccurate}
              onChange={(v) => updateAck("reviewedAccurate", v)}
              sessionId={state.sessionId}
            />
            <AcknowledgmentCheckbox
              ruleId="prepurchase_not_law_firm"
              text="I understand POA-IT is not a law firm and has not given me legal advice about my specific situation."
              checked={acks.notLawFirm}
              onChange={(v) => updateAck("notLawFirm", v)}
              sessionId={state.sessionId}
            />
            <AcknowledgmentCheckbox
              ruleId="prepurchase_scope_limitations"
              text="I understand this document does NOT cover medical decisions, taxes (beyond representation authority), or federal benefit programs that require their own forms."
              checked={acks.scopeLimitations}
              onChange={(v) => updateAck("scopeLimitations", v)}
              sessionId={state.sessionId}
            />
            <AcknowledgmentCheckbox
              ruleId="prepurchase_terms_privacy"
              text={
                <>
                  I understand my future purchase will be governed by POA-IT's{" "}
                  <a
                    href="/legal/terms"
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: TOKENS.INK, fontWeight: 600 }}
                  >
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a
                    href="/legal/privacy"
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: TOKENS.INK, fontWeight: 600 }}
                  >
                    Privacy Policy
                  </a>
                  .
                </>
              }
              checked={acks.termsAndPrivacy}
              onChange={(v) => updateAck("termsAndPrivacy", v)}
              sessionId={state.sessionId}
            />
            <AcknowledgmentCheckbox
              ruleId="prepurchase_refund_policy"
              text={
                <>
                  I acknowledge POA-IT's{" "}
                  <a
                    href="/legal/refunds"
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: TOKENS.INK, fontWeight: 600 }}
                  >
                    Refund Policy
                  </a>{" "}
                  (full refund before document generation; 50% after generation but before notarization; no refund after notarization except for defects).
                </>
              }
              checked={acks.refundPolicy}
              onChange={(v) => updateAck("refundPolicy", v)}
              sessionId={state.sessionId}
            />
          </div>
        </div>

        {/* Footer disclaimer */}
        <Disclaimer variant="inline" />
      </div>
    </WizardShell>
  );
}

function ReviewSection({ title, children, onEdit, editStep }) {
  return (
    <div
      style={{
        background: TOKENS.PAPER,
        border: `1px solid ${TOKENS.LINE}`,
        borderRadius: 10,
        padding: "18px 20px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
          paddingBottom: 12,
          borderBottom: `1px solid ${TOKENS.LINE}`,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontFamily: FONTS.MONO,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: TOKENS.INK_40,
            fontWeight: 600,
          }}
        >
          {title}
        </div>
        {onEdit && (
          <button
            onClick={onEdit}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 12,
              color: TOKENS.INK_60,
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              textDecoration: "underline",
              fontFamily: FONTS.SANS,
            }}
          >
            <Edit3 size={11} strokeWidth={2} /> Edit
          </button>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
}

function ReviewRow({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 16, padding: "6px 0", fontFamily: FONTS.SANS }}>
      <div style={{ fontSize: 12, color: TOKENS.INK_40, fontWeight: 500, flexShrink: 0, paddingTop: 1 }}>
        {label}
      </div>
      <div style={{ fontSize: 13, color: TOKENS.INK, textAlign: "right", fontWeight: 500 }}>
        {value || <span style={{ color: TOKENS.INK_40 }}>—</span>}
      </div>
    </div>
  );
}

function DocRow({ icon: Icon, title }) {
  return (
    <li style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: TOKENS.INK_60, lineHeight: 1.5 }}>
      <Icon size={13} strokeWidth={2} color={TOKENS.INK_60} />
      <span>{title}</span>
    </li>
  );
}

function formatRelationship(rel, other) {
  if (!rel) return "—";
  if (rel === "other") return other || "Other";
  const labels = {
    spouse: "Spouse",
    parent: "Parent",
    adult_child: "Adult child",
    grandparent: "Grandparent",
    grandchild: "Grandchild",
    sibling: "Sibling",
    aunt_uncle: "Aunt or uncle",
    niece_nephew: "Niece or nephew",
    other_relative: "Other relative",
    friend: "Friend",
    professional_fiduciary: "Professional fiduciary",
    attorney: "Attorney",
  };
  return labels[rel] || rel;
}

function formatHomestead(h) {
  const labels = {
    yes_homestead: "Yes — primary residence",
    yes_not_homestead: "Yes — but not primary residence",
    no: "No",
    not_sure: "Not sure",
  };
  return labels[h] || "—";
}
