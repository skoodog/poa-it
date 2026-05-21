import { redirect } from "next/navigation";
import { User, Briefcase } from "lucide-react";
import { ensureUserSynced, getCurrentUser } from "../../lib/server/auth";

export default async function OnboardingPage() {
  // Sync the Clerk user into our DB if needed
  await ensureUserSynced();
  const user = await getCurrentUser();

  if (!user) redirect("/sign-in");

  // If user already onboarded, send them to their proper home
  if (user.onboardedAt) {
    if (user.userType === "professional") redirect("/app");
    redirect("/");
  }

  const TOKENS = {
    PAPER: "#FFFFFF",
    PAPER_2: "#FAFAFA",
    INK: "#0A0A0A",
    INK_60: "#52525B",
    INK_40: "#71717A",
    LINE: "#E4E4E7",
    ACCENT: "#2563EB",
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
      <div style={{ width: "100%", maxWidth: 640 }}>
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
              fontSize: 28,
              fontWeight: 600,
              letterSpacing: "-0.025em",
              margin: "0 0 10px",
              color: TOKENS.INK,
              lineHeight: 1.15,
            }}
          >
            Welcome, {user.firstName || "friend"}.
          </h1>
          <p
            style={{
              fontSize: 15,
              color: TOKENS.INK_60,
              margin: "0 0 28px",
              lineHeight: 1.55,
            }}
          >
            Quick question — are you here to create a power of attorney for
            yourself, or to manage POAs for clients?
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <form action="/api/onboarding/select-consumer" method="POST">
              <button
                type="submit"
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 14,
                  padding: "20px 22px",
                  background: TOKENS.PAPER,
                  border: `1.5px solid ${TOKENS.LINE}`,
                  borderRadius: 10,
                  cursor: "pointer",
                  textAlign: "left",
                  fontFamily: "inherit",
                  transition: "all 0.15s",
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: TOKENS.PAPER_2,
                    color: TOKENS.INK_60,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <User size={20} strokeWidth={1.8} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 600,
                      color: TOKENS.INK,
                      marginBottom: 4,
                      letterSpacing: "-0.005em",
                    }}
                  >
                    For myself
                  </div>
                  <div style={{ fontSize: 13.5, color: TOKENS.INK_60, lineHeight: 1.5 }}>
                    I want to create a Texas power of attorney for myself, or
                    update one I've already started.
                  </div>
                </div>
              </button>
            </form>

            <form action="/api/onboarding/select-professional" method="POST">
              <button
                type="submit"
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 14,
                  padding: "20px 22px",
                  background: TOKENS.PAPER,
                  border: `1.5px solid ${TOKENS.LINE}`,
                  borderRadius: 10,
                  cursor: "pointer",
                  textAlign: "left",
                  fontFamily: "inherit",
                  transition: "all 0.15s",
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: TOKENS.PAPER_2,
                    color: TOKENS.INK_60,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Briefcase size={20} strokeWidth={1.8} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 600,
                      color: TOKENS.INK,
                      marginBottom: 4,
                      letterSpacing: "-0.005em",
                    }}
                  >
                    For my clients
                  </div>
                  <div style={{ fontSize: 13.5, color: TOKENS.INK_60, lineHeight: 1.5 }}>
                    I'm a solo practitioner, family office, or law firm
                    creating POAs for clients I represent.
                  </div>
                </div>
              </button>
            </form>
          </div>

          <div
            style={{
              marginTop: 24,
              fontSize: 12,
              color: TOKENS.INK_40,
              lineHeight: 1.5,
              textAlign: "center",
            }}
          >
            You can change this later in your account settings.
          </div>
        </div>
      </div>
    </div>
  );
}
