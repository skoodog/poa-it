import { redirect } from "next/navigation";
import { ensureUserSynced, getCurrentUser } from "../../lib/server/auth";

export default async function PostAuthRedirectPage() {
  await ensureUserSynced();
  const user = await getCurrentUser();

  if (!user) redirect("/sign-in");
  if (!user.onboardedAt) redirect("/onboarding");
  if (user.userType === "professional") redirect("/app");
  redirect("/");
}
