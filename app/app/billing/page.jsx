import { CreditCard, Sparkles } from "lucide-react";
import { TopBar } from "../../../components/workspace/TopBar";
import { EmptyState } from "../../../components/workspace/EmptyState";
import { TOKENS, FONTS } from "../../../components/wizard/shared/tokens";
import { getCurrentUser } from "../../../lib/server/auth";

/**
 * /app/billing
 *
 * Sprint 2 ships the placeholder. Sprint 6 wires in real Stripe subscription
 * management (Customer Portal, plan changes, invoices).
 *
 * For now, shows the user's current tier (set during onboarding) and a
 * "not yet" message for actual billing actions.
 */

export default async function BillingPage() {
  const user = await getCurrentUser();
  const tier = user?.firm?.tier || "solo";

  const tierLabels = {
    solo: "Solo practitioner",
    family_office: "Family office",
    firm: "Law firm",
  };

  const tierDescriptions = {
    solo: "Designed for solo attorneys managing individual clients.",
    family_office:
      "Designed for advisors handling estate planning across multiple family members.",
    firm: "Designed for multi-attorney practices with paralegal-driven intake.",
  };

  return (
    <>
      <TopBar
        title="Billing"
        subtitle="Your subscription and payment details."
      />

      <div style={{ padding: "28px 32px 60px", maxWidth: 720, fontFamily: FONTS.SANS }}>
        {/* Current plan card */}
        <div
          style={{
            background: TOKENS.PAPER,
            border: `1px solid ${TOKENS.LINE}`,
            borderRadius: 10,
            padding: "24px 28px",
            marginBottom: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 14,
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: TOKENS.LIVE_GREEN,
                color: TOKENS.PAPER,
                padding: "3px 10px",
                borderRadius: 100,
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              <Sparkles size={11} strokeWidth={2.4} />
              Pre-launch
            </div>
          </div>

          <div
            style={{
              fontSize: 11,
              fontFamily: FONTS.MONO,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: TOKENS.INK_40,
              fontWeight: 600,
              marginBottom: 6,
            }}
          >
            Current plan
          </div>
          <h2
            style={{
              fontSize: 24,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              margin: "0 0 6px",
              color: TOKENS.INK,
            }}
          >
            {tierLabels[tier]}
          </h2>
          <p
            style={{
              fontSize: 14,
              color: TOKENS.INK_60,
              lineHeight: 1.55,
              margin: "0 0 18px",
            }}
          >
            {tierDescriptions[tier]}
          </p>

          <div
            style={{
              padding: "14px 16px",
              background: TOKENS.PAPER_2,
              borderRadius: 8,
              fontSize: 13,
              color: TOKENS.INK_60,
              lineHeight: 1.55,
            }}
          >
            <strong style={{ color: TOKENS.INK, fontWeight: 600 }}>
              You haven't been charged.
            </strong>{" "}
            Billing turns on when Sprint 6 ships Stripe Checkout and the consumer
            launch is ready. Until then, your workspace is fully reserved and
            your tier choice is saved.
          </div>
        </div>

        <EmptyState
          icon={CreditCard}
          title="Billing controls coming in Sprint 6"
          description="When Stripe is wired in, this page becomes a real subscription manager — change plans, view invoices, update payment method, cancel any time."
          roadmap={[
            { sprint: "Sprint 6", text: "Stripe Checkout for new subscriptions" },
            { sprint: "Sprint 6", text: "Stripe Customer Portal for self-service management" },
            { sprint: "Sprint 6", text: "Invoice history and downloadable receipts" },
            { sprint: "Sprint 6", text: "Per-client chargeback reports for family offices" },
          ]}
        />
      </div>
    </>
  );
}
