"use client";

import { useEffect, useState } from "react";
import { Check, Scale, AlertTriangle } from "lucide-react";
import { TOKENS, FONTS } from "../shared/tokens";
import { WizardShell } from "../WizardShell";
import { StatutoryTooltip } from "../shared/StatutoryTooltip";
import { WarningBanner } from "../shared/WarningBanner";
import { AttorneyReferralPrompt } from "../shared/AttorneyReferralPrompt";
import { getAllHotPowers, getGiftPowerClause, getMetadata } from "../../../lib/clauseLibrary/engine";
import { updateState, markStepComplete } from "../../../lib/wizard/state";
import { audit } from "../../../lib/audit/logger";

/**
 * Step 5 — Hot Powers (Sensitive Authorities)
 * Phase 3 § 3.7
 *
 * The five § 751.031(b) powers that don't transfer with "Grant ALL" — each
 * must be specifically granted. The gift power is presented first because
 * it's the most common; the other four are presented with stronger warnings
 * and attorney-referral prompts.
 *
 * Self-dealing reminder (Step 3 set the flag): if agent is not close family
 * AND any hot power is granted, surface the § 751.031(c) reminder.
 */

const CLOSE_FAMILY = ["spouse", "parent", "adult_child", "grandparent", "grandchild"];

export function Step5_HotPowers({ state, setState, onBack, onContinue }) {
  useEffect(() => {
    audit.stepEntered(state.sessionId, "step5_hot_powers");
  }, [state.sessionId]);

  const hotPowers = getAllHotPowers(); // 4 opt-in powers (trust, survivorship, beneficiary, delegate)
  const giftClause = getGiftPowerClause();
  const meta = getMetadata();
  const annualExclusion = meta.annual_gift_tax_exclusion_2025_per_donee_usd;

  // The current set of granted hot powers
  const grantedSet = new Set(state.hotPowersGranted || []);
  const giftGranted = grantedSet.has("hot_power_gifts");
  const anyHotPowerGranted = grantedSet.size > 0;

  // Self-dealing reminder check
  const agentIsCloseFamily = CLOSE_FAMILY.includes(state.agentRelationship);
  const showSelfDealingReminder = anyHotPowerGranted && !agentIsCloseFamily;

  // Attorney referral check — any of trust / survivorship / beneficiary
  const showAttorneyReferral =
    grantedSet.has("hot_power_trust") ||
    grantedSet.has("hot_power_survivorship") ||
    grantedSet.has("hot_power_beneficiary");

  function toggleHotPower(powerId) {
    const newSet = new Set(state.hotPowersGranted || []);
    if (newSet.has(powerId)) {
      newSet.delete(powerId);
    } else {
      newSet.add(powerId);
      audit.warningShown(state.sessionId, powerId, `User granted hot power: ${powerId}`);
    }
    setState(updateState(state, { hotPowersGranted: Array.from(newSet) }));
  }

  function setGiftLimitChoice(choice) {
    setState(updateState(state, { giftLimitChoice: choice }));
    audit.fieldChanged(state.sessionId, "giftLimitChoice", true);
  }

  // Validation
  // - Granted gifts requires a giftLimitChoice
  // - Above-exclusion choice requires acknowledgment
  const aboveExclusionAck = state.acknowledgmentsConfirmed?.includes(
    "gift_above_exclusion_attorney_acknowledged"
  );
  const aboveExclusionChosen = state.giftLimitChoice === "above_annual_exclusion";
  const giftValid = !giftGranted || !!state.giftLimitChoice;
  const giftAckValid = !aboveExclusionChosen || aboveExclusionAck;
  const canContinue = giftValid && giftAckValid;

  function handleContinue() {
    if (!canContinue) return;
    audit.stepCompleted(state.sessionId, "step5_hot_powers", {
      hotPowersGranted: Array.from(grantedSet),
      giftLimitChoice: state.giftLimitChoice,
      anyHotPowerGranted,
      selfDealingReminderShown: showSelfDealingReminder,
      attorneyReferralShown: showAttorneyReferral,
    });
    const next = markStepComplete(state, "step5_hot_powers", "step6_effective_date");
    setState(next);
    onContinue();
  }

  function handleAboveExclusionAck(checked) {
    const set = new Set(state.acknowledgmentsConfirmed || []);
    if (checked) {
      set.add("gift_above_exclusion_attorney_acknowledged");
      audit.acknowledgmentRecorded(
        state.sessionId,
        "gift_above_exclusion_attorney_acknowledged",
        "I understand attorney consultation is strongly recommended for gift authority above the annual exclusion."
      );
    } else {
      set.delete("gift_above_exclusion_attorney_acknowledged");
    }
    setState(updateState(state, { acknowledgmentsConfirmed: Array.from(set) }));
  }

  return (
    <WizardShell
      stepId="step5_hot_powers"
      stepNumber="Step 6 of 9 · Sensitive Powers"
      title="A few sensitive powers Texas treats differently."
      subtitle="Texas law (§ 751.031(b)) lists five specific powers that don't transfer with 'Grant ALL.' You must specifically grant each one if you want your agent to have it. These are sensitive — most people don't grant them through self-service software."
      onBack={onBack}
      onContinue={handleContinue}
      canContinue={canContinue}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 18, fontFamily: FONTS.SANS }}>
        {/* Banner — set expectations */}
        <WarningBanner severity="referral">
          We're not a law firm and can't advise on whether you should grant these
          powers. If you're unsure, talk to a Texas attorney through our
          Marketplace before deciding — there's no charge from us for the referral.
        </WarningBanner>

        {/* Gift power — first, special UX because it's the most common */}
        <HotPowerCard
          number="1"
          title="Authority to make gifts"
          examples="Give money to grandchildren, make charitable donations, transfer property to family members."
          citation={giftClause.statutory_source}
          granted={giftGranted}
          onToggle={() => toggleHotPower("hot_power_gifts")}
          sessionId={state.sessionId}
        >
          {giftGranted && (
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${TOKENS.LINE}` }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: TOKENS.INK,
                  marginBottom: 10,
                }}
              >
                What's the gift limit?
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <GiftLimitOption
                  value="default"
                  selected={state.giftLimitChoice === "default"}
                  onSelect={() => setGiftLimitChoice("default")}
                  title={`Use the Texas default — $${annualExclusion.toLocaleString()} per person per year`}
                  description="The federal annual gift-tax exclusion. Updated each year by the IRS."
                  badge="Recommended"
                />
                <GiftLimitOption
                  value="above_annual_exclusion"
                  selected={state.giftLimitChoice === "above_annual_exclusion"}
                  onSelect={() => setGiftLimitChoice("above_annual_exclusion")}
                  title="Allow gifts above the annual exclusion"
                  description="Has significant estate-planning and tax consequences. Texas attorney consultation strongly recommended."
                  badge="Advanced"
                  badgeColor={TOKENS.WARN_INK_STRONG}
                />
              </div>

              {aboveExclusionChosen && (
                <div style={{ marginTop: 14 }}>
                  <WarningBanner
                    severity="warning"
                    title="Attorney consultation strongly recommended"
                    citation="IRC § 2503(b); Tex. Est. Code § 751.031(b)(2); Rev. Proc. 2024-40"
                    onAcknowledge={handleAboveExclusionAck}
                    acknowledged={aboveExclusionAck}
                    acknowledgmentLabel="I understand and want to proceed."
                  >
                    Gifts above the annual exclusion involve significant tax and
                    estate-planning consequences (gift-tax returns, lifetime
                    exclusion impact, possible Medicaid eligibility issues). We
                    strongly recommend consulting a Texas attorney before granting
                    this authority.
                  </WarningBanner>
                </div>
              )}

              {state.giftLimitChoice && state.agentRelationship && !agentIsCloseFamily && (
                <WarningBanner
                  severity="info"
                  title="Reminder: § 751.031(c) protection applies"
                  citation="Tex. Est. Code § 751.031(c)"
                >
                  Because your agent isn't your spouse, parent, or descendant, they
                  CANNOT use this gift authority to make gifts to themselves — even
                  if the limit you set would allow it. Texas law overrides that
                  automatically.
                </WarningBanner>
              )}
            </div>
          )}
        </HotPowerCard>

        {/* The four opt-in hot powers */}
        {hotPowers.map((hp, i) => (
          <HotPowerCard
            key={hp.clause_id}
            number={String(i + 2)}
            title={hp.plain_english_name}
            examples={hp.plain_english_examples}
            citation={hp.statutory_source}
            granted={grantedSet.has(hp.clause_id)}
            onToggle={() => toggleHotPower(hp.clause_id)}
            sessionId={state.sessionId}
            strong={hp.wizard_attorney_referral_recommended}
          >
            {grantedSet.has(hp.clause_id) && hp.wizard_attorney_referral_recommended && (
              <div style={{ marginTop: 14 }}>
                <WarningBanner
                  severity="warning"
                  title="This is a high-risk power"
                  citation={hp.statutory_source}
                >
                  This power can fundamentally alter your estate plan. POA-IT
                  generates the correct Texas statutory language, but the
                  consequences are significant and often irreversible. We strongly
                  recommend Texas attorney consultation before signing.
                </WarningBanner>
              </div>
            )}
          </HotPowerCard>
        ))}

        {/* Self-dealing reminder (if non-family agent + any hot power) */}
        {showSelfDealingReminder && (
          <WarningBanner
            severity="info"
            title="Texas's automatic anti-self-dealing protection"
            citation="Tex. Est. Code § 751.031(c)"
          >
            Your agent ({state.agentFullLegalName || "your agent"}, your{" "}
            {formatRelationship(state.agentRelationship)}) is not your spouse,
            parent, or descendant. Under § 751.031(c), they CANNOT use the granted
            hot powers to benefit themselves, regardless of what your document says.
            This is built-in statutory protection — you don't need to add anything.
          </WarningBanner>
        )}

        {/* Persistent attorney referral if user granted any of trust/survivorship/beneficiary */}
        {showAttorneyReferral && (
          <AttorneyReferralPrompt
            ruleId="rule_hot_powers_attorney_referral"
            context="hot_powers_granted"
            sessionId={state.sessionId}
            onConsulted={() => {
              audit.acknowledgmentRecorded(
                state.sessionId,
                "hot_powers_consulted_own_attorney",
                "User indicated they consulted their own attorney before granting hot powers."
              );
            }}
            onProceed={() => {
              audit.acknowledgmentRecorded(
                state.sessionId,
                "hot_powers_proceeding_without_consultation",
                "User declined attorney consultation for granted hot powers."
              );
            }}
          />
        )}

        {/* All-clear when nothing granted */}
        {!anyHotPowerGranted && (
          <WarningBanner severity="info">
            <strong>You haven't granted any sensitive powers.</strong> This is the
            safest choice for most situations. You can always create a new POA
            later if circumstances change.
          </WarningBanner>
        )}
      </div>
    </WizardShell>
  );
}

function HotPowerCard({ number, title, examples, citation, granted, onToggle, sessionId, strong, children }) {
  return (
    <div
      style={{
        background: granted ? TOKENS.PAPER_2 : TOKENS.PAPER,
        border: `1px solid ${granted ? TOKENS.INK : TOKENS.LINE}`,
        borderRadius: 10,
        padding: "18px 20px",
        transition: "all 0.15s",
        fontFamily: FONTS.SANS,
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "flex-start",
          gap: 12,
          background: "transparent",
          border: "none",
          padding: 0,
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <div
          style={{
            width: 20,
            height: 20,
            borderRadius: 5,
            border: `1.5px solid ${granted ? TOKENS.INK : TOKENS.INK_40}`,
            background: granted ? TOKENS.INK : TOKENS.PAPER,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            marginTop: 2,
          }}
        >
          {granted && <Check size={14} strokeWidth={3} color={TOKENS.PAPER} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
            <div
              style={{
                fontSize: 11,
                fontFamily: FONTS.MONO,
                color: TOKENS.INK_40,
                fontWeight: 600,
                letterSpacing: "0.04em",
              }}
            >
              #{number}
            </div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: TOKENS.INK,
                letterSpacing: "-0.005em",
              }}
            >
              {title}
            </div>
            {strong && (
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: TOKENS.WARN_INK_STRONG,
                  background: TOKENS.WARN_BG,
                  padding: "2px 6px",
                  borderRadius: 3,
                  marginLeft: 4,
                }}
              >
                High Risk
              </div>
            )}
            <StatutoryTooltip
              plainEnglish={examples}
              citation={citation}
              onOpen={() => audit.tooltipOpened(sessionId, `hot_power_${number}`)}
            />
          </div>
          <div style={{ fontSize: 13, color: TOKENS.INK_60, lineHeight: 1.5 }}>
            {examples}
          </div>
        </div>
      </button>
      {children}
    </div>
  );
}

function GiftLimitOption({ selected, onSelect, title, description, badge, badgeColor }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        padding: "12px 14px",
        background: selected ? TOKENS.PAPER : TOKENS.PAPER_2,
        border: `1px solid ${selected ? TOKENS.INK : TOKENS.LINE}`,
        borderRadius: 7,
        cursor: "pointer",
        transition: "all 0.15s",
        textAlign: "left",
        fontFamily: FONTS.SANS,
        width: "100%",
      }}
    >
      <div
        style={{
          width: 16,
          height: 16,
          borderRadius: "50%",
          border: `1.5px solid ${selected ? TOKENS.INK : TOKENS.INK_40}`,
          background: TOKENS.PAPER,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          marginTop: 2,
        }}
      >
        {selected && (
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: TOKENS.INK }} />
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: TOKENS.INK }}>{title}</div>
          {badge && (
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: badgeColor || TOKENS.LIVE_GREEN,
                background: TOKENS.PAPER_2,
                border: `1px solid ${TOKENS.LINE}`,
                padding: "2px 6px",
                borderRadius: 3,
              }}
            >
              {badge}
            </span>
          )}
        </div>
        <div style={{ fontSize: 12.5, color: TOKENS.INK_60, lineHeight: 1.45 }}>{description}</div>
      </div>
    </button>
  );
}

function formatRelationship(rel) {
  if (!rel) return "agent";
  const labels = {
    spouse: "spouse",
    parent: "parent",
    adult_child: "adult child",
    grandparent: "grandparent",
    grandchild: "grandchild",
    sibling: "sibling",
    aunt_uncle: "aunt or uncle",
    niece_nephew: "niece or nephew",
    other_relative: "relative",
    friend: "friend",
    professional_fiduciary: "professional fiduciary",
    attorney: "attorney",
    other: "agent",
  };
  return labels[rel] || "agent";
}
