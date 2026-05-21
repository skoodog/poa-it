/**
 * Auth Helpers
 *
 * Server-side utilities for auth-aware code. Wraps Clerk's auth() helper
 * with database lookups so callers get the full user record (including
 * userType and firm relationship), not just the Clerk ID.
 *
 * Two main use cases:
 *   1. getCurrentUser() — read the current user in a server action / API route
 *   2. ensureUserSynced() — called after Clerk sign-up to mirror the user into our DB
 */

import "server-only";
import { auth, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { users, firms } from "../db/schema";

/**
 * Returns the current user with their firm (if professional) and full DB
 * record. Returns null if no user is signed in.
 *
 * Usage in server actions:
 *   const user = await getCurrentUser();
 *   if (!user) return { error: "unauthenticated" };
 *   if (user.userType !== "professional") return { error: "forbidden" };
 */
export async function getCurrentUser() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);

  if (!user) {
    // User exists in Clerk but not yet in our DB — sync them
    return await ensureUserSynced();
  }

  // Fetch the firm if user is professional and has one
  let firm = null;
  if (user.firmId) {
    [firm] = await db
      .select()
      .from(firms)
      .where(eq(firms.id, user.firmId))
      .limit(1);
  }

  return { ...user, firm };
}

/**
 * Ensures the current Clerk user has a matching row in our `users` table.
 * Called automatically by getCurrentUser() if the user isn't found, and
 * directly by the post-signup callback.
 *
 * Returns the synced user record.
 */
export async function ensureUserSynced() {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const email = clerkUser.emailAddresses[0]?.emailAddress || "";
  const firstName = clerkUser.firstName || "";
  const lastName = clerkUser.lastName || "";

  // Check if user exists
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkUser.id))
    .limit(1);

  if (existing) {
    // Update email/name if changed in Clerk
    if (
      existing.email !== email ||
      existing.firstName !== firstName ||
      existing.lastName !== lastName
    ) {
      await db
        .update(users)
        .set({ email, firstName, lastName, updatedAt: new Date() })
        .where(eq(users.id, existing.id));
    }
    return existing;
  }

  // Default userType is "consumer"; user selects professional during onboarding
  const [created] = await db
    .insert(users)
    .values({
      clerkId: clerkUser.id,
      email,
      firstName,
      lastName,
      userType: "consumer",
    })
    .returning();

  return created;
}

/**
 * Promotes a user to professional and creates their firm record.
 * Called from the professional onboarding flow.
 */
export async function promoteToProfessional({ firmName, firmTier = "solo" }) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");
  if (user.userType === "professional") return user;

  // Create the firm
  const [firm] = await db
    .insert(firms)
    .values({
      name: firmName,
      tier: firmTier,
      primaryContactEmail: user.email,
    })
    .returning();

  // Update user
  const [updated] = await db
    .update(users)
    .set({
      userType: "professional",
      firmId: firm.id,
      onboardedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id))
    .returning();

  return { ...updated, firm };
}

/**
 * Returns the auth status as a plain object suitable for client components
 * via prop drilling. Doesn't expose Clerk internals.
 */
export async function getAuthStatus() {
  const user = await getCurrentUser();
  if (!user) {
    return { authenticated: false, userType: null, firmId: null };
  }
  return {
    authenticated: true,
    userType: user.userType,
    firmId: user.firmId,
    firmName: user.firm?.name || null,
  };
}
