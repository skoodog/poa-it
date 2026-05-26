/**
 * Clerk Authentication Middleware
 *
 * Runs on every request before the page renders. Decides whether the user
 * needs to be authenticated for the route they're visiting.
 *
 * Route protection:
 *   /wizard         → public (anyone can walk the wizard, even logged out)
 *   /wizard/audit   → public (for now; ties to anonymous session)
 *   /legal/*        → public
 *   /sign-in        → public (Clerk's sign-in page)
 *   /sign-up        → public (Clerk's sign-up page)
 *   /api/wizard/*   → public-ish (accepts anonymous sessions; auth optional)
 *   /api/leads      → public (the Reserve Your Spot endpoint)
 *   /app/*          → PROTECTED (professional workspace; requires auth + professional user type)
 *   /api/protected/* → PROTECTED (anything firm-internal)
 *   /              → public (marketing homepage)
 *
 * After auth succeeds, the destination is determined by the user's userType:
 *   consumer       → /
 *   professional   → /app
 */

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  "/app(.*)",
  "/api/protected(.*)",
]);

// Clerk 5.x syntax: `auth` is a function that returns the auth context
// when called. To enforce route protection, call `auth()` first, then
// `.protect()` on the result. In Clerk 6.x this changes to `auth.protect()`
// (no call), but we're on 5.7.6 and use the 5.x pattern.
//
// Reference: https://clerk.com/docs/reference/nextjs/clerk-middleware (v5)
export default clerkMiddleware((auth, req) => {
  if (isProtectedRoute(req)) {
    auth().protect();
  }
});

export const config = {
  matcher: [
    // Match all paths except static files and Next.js internals
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
    "/api/(.*)",
  ],
};
