"use client";

import { useEffect } from "react";
import {
  Landmark, TrendingUp, Home, Shield, Wallet, Receipt, FileBadge, Sparkles, Check,
} from "lucide-react";
import { TOKENS, FONTS } from "../wizard/shared/tokens";
import { PresentationWizardShell } from "./PresentationWizardShell";
import {
  updatePresentationState,
  resolveRecommendedPowers,
} from "../../lib/wizard/presentationState";

/**
 * Step 1 — Pick the institution profile.
 *
 * Profiles come from the institution_profiles table (seeded via Sprint 4d R1).
 * Selecting a profile pre-populates the selectedPowers array for Step 3.
 *
 * Sprint 4d — Round 2.
 */

const PROFILE_ICONS = {
  banking: Landmark,
  brokerage: TrendingUp,
  real_estate_title: Home,
  insurance: Shield,
  retirement: Wallet,
  tax_authority: Receipt,
  government_benefits: FileBadge,
  generic: Sparkles,
};

export function PresentationStep1_Profile({
  state,
  setState,
  profiles,
  onBack,
  onContinue,
}) {
  function pickProfile(profile) {
    const recommended = resolveRecommendedPowers(
      profile.recommendedPowers || [],
      state.originalPoaPowersGranted || []
    );

    // Convert profile notes to the customNotes shape
    const profileNotes = (profile.recommendedNotes || [])
      .filter((note) => {
        // Filter out contextual notes that don't apply to this POA
        if (!note.contextual) return true;
        if (note.contextual === "ron_execution") {
          return state.originalPoaExecutionMethod === "ron";
        }
        return true;
      })
      .map((note) => ({
        id: note.id,
        text: note.text,
        source: "profile",
      }));

    setState(
      updatePresentationState(state, {
        institutionProfileId: profile.id,
        institutionProfileSlug: profile.slug,
        selectedPowers: recommended,
        customNotes: profileNotes,
      })
    );
  }

  const canContinue = !!state.institutionProfileId;

  return (
    <PresentationWizardShell
      state={state}
      stepId="step1_profile"
      title="What kind of institution is this packet for?"
      subtitle="The institution type determines which authority is highlighted in the packet. You can adjust the specific powers in a later step."
      onBack={onBack}
      onContinue={onContinue}
      canContinue={canContinue}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {profiles.map((profile) => (
          <ProfileCard
            key={profile.id}
            profile={profile}
            selected={profile.id === state.institutionProfileId}
            onClick={() => pickProfile(profile)}
          />
        ))}
      </div>
    </PresentationWizardShell>
  );
}

function ProfileCard({ profile, selected, onClick }) {
  const Icon = PROFILE_ICONS[profile.slug] || Sparkles;
  const recommendedCount = (profile.recommendedPowers || []).length;

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "flex-start",
        gap: 14,
        padding: "16px 18px",
        background: selected ? TOKENS.PAPER_2 : TOKENS.PAPER,
        border: `1.5px solid ${selected ? TOKENS.INK : TOKENS.LINE}`,
        borderRadius: 10,
        cursor: "pointer",
        textAlign: "left",
        fontFamily: FONTS.SANS,
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 8,
          background: selected ? TOKENS.INK : TOKENS.PAPER_2,
          border: selected ? "none" : `1px solid ${TOKENS.LINE}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: selected ? TOKENS.PAPER : TOKENS.INK,
          flexShrink: 0,
        }}
      >
        <Icon size={18} strokeWidth={1.8} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: TOKENS.INK,
            marginBottom: 4,
            letterSpacing: "-0.005em",
          }}
        >
          {profile.displayName}
        </div>
        <div style={{ fontSize: 13, color: TOKENS.INK_60, lineHeight: 1.5 }}>
          {profile.description}
        </div>
        {recommendedCount > 0 && (
          <div
            style={{
              marginTop: 8,
              fontSize: 11,
              fontFamily: FONTS.MONO,
              color: TOKENS.INK_40,
              letterSpacing: 0.3,
            }}
          >
            {recommendedCount} recommended power{recommendedCount === 1 ? "" : "s"}
          </div>
        )}
      </div>
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: 10,
          border: `2px solid ${selected ? TOKENS.INK : TOKENS.INK_40}`,
          background: selected ? TOKENS.INK : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          marginTop: 4,
        }}
      >
        {selected && <Check size={11} strokeWidth={3} color={TOKENS.PAPER} />}
      </div>
    </button>
  );
}
