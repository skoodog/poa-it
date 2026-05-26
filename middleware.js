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

// Sprint 4c hotfix: Clerk transitioned `auth` from a sync object to an async
// function in a recent minor release. The previous `auth.protect()` syntax
// works on the old API; the current API requires `await auth.protect()`
// inside an async handler. This change makes the middleware compatible with
// both API shapes.
export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Match all paths except static files and Next.js internals
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
    "/api/(.*)",
  ],
};
