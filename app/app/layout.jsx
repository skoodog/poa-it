import { redirect } from "next/navigation";
import { Sidebar } from "../../components/workspace/Sidebar";
import { TOKENS, FONTS } from "../../components/wizard/shared/tokens";
import { getCurrentUser } from "../../lib/server/auth";

/**
 * /app Layout
 *
 * Wraps every /app/* page with the workspace shell:
 *   - Sidebar with section nav
 *   - Main content area where the page renders
 *
 * Auth gate: any unauthenticated user hitting /app/* gets bounced to sign-in.
 * Any consumer-type user gets bounced to the marketing site. Only authenticated
 * professionals see the workspace.
 *
 * The page itself supplies the TopBar (because title/subtitle/actions vary
 * by page).
 */

export default async function AppLayout({ children }) {
  const user = await getCurrentUser();

  if (!user) redirect("/sign-in");
  if (user.userType !== "professional") redirect("/");
  if (!user.onboardedAt) redirect("/onboarding/professional");

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: TOKENS.PAPER,
        fontFamily: FONTS.SANS,
        color: TOKENS.INK,
        WebkitFontSmoothing: "antialiased",
      }}
    >
      <Sidebar firmName={user.firm?.name} />
      <main style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        {children}
      </main>
    </div>
  );
}
