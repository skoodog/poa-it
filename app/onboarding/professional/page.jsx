import { redirect } from "next/navigation";
import { ensureUserSynced, getCurrentUser } from "../../../lib/server/auth";

export default async function ProfessionalOnboardingPage() {
  await ensureUserSynced();
  const user = await getCurrentUser();

  if (!user) redirect("/sign-in");
  if (user.userType === "professional" && user.onboardedAt) redirect("/app");

  const TOKENS = {
    PAPER: "#FFFFFF",
    PAPER_2: "#FAFAFA",
    INK: "#0A0A0A",
    INK_60: "#52525B",
    INK_40: "#71717A",
    LINE: "#E4E4E7",
    LIVE_GREEN: "#10B981",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: TOKENS.PAPER_2,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        fontFamily: "'Geist', 'Inter', -apple-system, system-ui, sans-serif",
      }}
    >
      <div style={{ width: "100%", maxWidth: 540 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <a
            href="/"
            style={{
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              color: TOKENS.INK,
              textDecoration: "none",
            }}
          >
            poa-it
          </a>
        </div>

        <div
          style={{
            background: TOKENS.PAPER,
            border: `1px solid ${TOKENS.LINE}`,
            borderRadius: 12,
            padding: "36px 36px",
          }}
        >
          <h1
            style={{
              fontSize: 26,
              fontWeight: 600,
              letterSpacing: "-0.025em",
              margin: "0 0 8px",
              color: TOKENS.INK,
              lineHeight: 1.15,
            }}
          >
            Tell us about your practice.
          </h1>
          <p style={{ fontSize: 14.5, color: TOKENS.INK_60, margin: "0 0 28px", lineHeight: 1.55 }}>
            We use this to brand the client-facing experience when you send
            wizards to your clients.
          </p>

          <form action="/api/onboarding/complete-professional" method="POST">
            <div style={{ marginBottom: 20 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 500,
                  color: TOKENS.INK_60,
                  marginBottom: 8,
                }}
              >
                Firm or practice name *
              </label>
              <input
                type="text"
                name="firmName"
                required
                placeholder="e.g. Campbell Law PLLC"
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  fontSize: 15,
                  fontFamily: "inherit",
                  color: TOKENS.INK,
                  background: TOKENS.PAPER_2,
                  border: `1px solid ${TOKENS.LINE}`,
                  borderRadius: 8,
                  outline: "none",
                }}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 500,
                  color: TOKENS.INK_60,
                  marginBottom: 8,
                }}
              >
                What best describes you? *
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <RadioOption value="solo" label="Solo practitioner" description="Just me, working with individual clients." defaultChecked />
                <RadioOption value="family_office" label="Family office" description="Managing estate planning for one or more families." />
                <RadioOption value="firm" label="Law firm or larger practice" description="Multiple attorneys, paralegals, or staff." />
              </div>
            </div>

            <button
              type="submit"
              style={{
                width: "100%",
                padding: "14px 22px",
                fontSize: 15,
                fontWeight: 600,
                background: TOKENS.INK,
                color: TOKENS.PAPER,
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Continue to workspace
            </button>
          </form>

          <div
            style={{
              marginTop: 20,
              padding: "12px 14px",
              background: TOKENS.PAPER_2,
              borderRadius: 7,
              fontSize: 12,
              color: TOKENS.INK_40,
              lineHeight: 1.5,
            }}
          >
            You won't be charged yet. Billing setup happens after you've
            had a chance to look around.
          </div>
        </div>
      </div>
    </div>
  );
}

function RadioOption({ value, label, description, defaultChecked }) {
  const TOKENS = {
    PAPER: "#FFFFFF",
    PAPER_2: "#FAFAFA",
    INK: "#0A0A0A",
    INK_60: "#52525B",
    INK_40: "#71717A",
    LINE: "#E4E4E7",
  };

  return (
    <label
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        padding: "12px 14px",
        background: TOKENS.PAPER,
        border: `1px solid ${TOKENS.LINE}`,
        borderRadius: 8,
        cursor: "pointer",
      }}
    >
      <input
        type="radio"
        name="firmTier"
        value={value}
        defaultChecked={defaultChecked}
        style={{
          marginTop: 2,
          width: 16,
          height: 16,
          accentColor: TOKENS.INK,
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: TOKENS.INK, marginBottom: 2 }}>
          {label}
        </div>
        <div style={{ fontSize: 12.5, color: TOKENS.INK_60, lineHeight: 1.45 }}>
          {description}
        </div>
      </div>
    </label>
  );
}
