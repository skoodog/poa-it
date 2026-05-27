# Security & Dependency Audit Log

This file tracks known vulnerabilities surfaced by `npm audit` and the plan for each. Updated whenever a new CVE appears or an existing one is patched.

## Current status — post Sprint 4c hotfix consolidation

`npm audit` reports a handful of vulnerabilities; all are tracked below.

## Deferred — stayed on current versions

### ⏳ drizzle-orm SQL injection (HIGH — GHSA-gpj5-g38j-94v9)

- **Affected versions:** `< 0.45.2`
- **Currently on:** `0.36.0`
- **Real exposure to POA-IT:** None. The CVE affects code that uses user-controlled strings as SQL identifiers (column or table names). All our queries use parameterized values; schema names are static.
- **Attempted upgrade:** Yes, attempted during Sprint 4c consolidation. Upgrading to 0.45.2 caused Neon's SQL API to return 400 Bad Request on every query in our Vercel + neon-http production setup. Vercel community has reported similar issues with Drizzle 0.44+. Reverted to 0.36.0.
- **Plan:** Re-attempt upgrade when either:
  - Drizzle ships a patched 0.45.x that resolves the Vercel + neon-http compatibility, OR
  - We move to `@neondatabase/serverless` direct queries that bypass Drizzle's neon-http abstraction, OR
  - Sprint 8 (security audit) — where we do a controlled upgrade in a staging environment first.

### ⏳ esbuild dev-server file read (MODERATE — GHSA-67mh-4wv8-2f99)

- **Affected versions:** `<= 0.24.2`
- **Currently on:** Whatever ships with `drizzle-kit@^0.28.0`
- **Real exposure to POA-IT:** Local dev only. Cannot affect production deploys.
- **Plan:** Resolved automatically when we eventually upgrade drizzle-kit (tied to the drizzle-orm upgrade plan above).

### ⏳ Clerk authorization bypass (HIGH — GHSA-w24r-5266-9c3c)

- **Affected versions:** `@clerk/clerk-react` up to `5.61.5`
- **Currently on:** `@clerk/nextjs ^5.7.6` (which pulls a vulnerable clerk-react transitively)
- **Real exposure to POA-IT:** The bypass requires using organization permissions combined with billing or reverification checks. We don't use organizations, billing, or reverification — just basic sign-in / sign-out / `auth()`.
- **Fix requires:** Major version bump to `@clerk/nextjs ^7.x`. Clerk 6→7 has breaking changes around middleware patterns and the `auth()` helper. Needs dedicated effort to:
  1. Read the Clerk 6→7 migration guide
  2. Update `auth().protect()` → `await auth.protect()` (v6 syntax) across all middleware
  3. Update `auth()` calls in API routes for the new async pattern
  4. Test sign-in, sign-out, workspace access end-to-end
  5. Have a rollback plan
- **Plan:** Address in Sprint 8 alongside the broader security & UPL audit.

### ⏳ js-cookie attribute injection (HIGH — GHSA-qjx8-664m-686j)

- **Affected versions:** `<= 3.0.5`
- **Currently on:** Pulled transitively through `@clerk/shared`
- **Real exposure to POA-IT:** Limited to whatever Clerk does with the library. We don't use `js-cookie` directly.
- **Fix requires:** Updating Clerk (same upgrade as above resolves this too).
- **Plan:** Resolved as part of the Clerk upgrade in Sprint 8.

## Process going forward

When `npm audit` surfaces a new vulnerability:

1. **Assess exposure** — Does the vulnerable code path exist in our use of the library? If no, document and continue.
2. **Check fix complexity** — Patch-level update (low risk) vs major version bump (needs testing).
3. **Patch low-risk in-sprint** — Patch-level updates and security-only fixes that don't change APIs.
4. **Batch high-risk for security sprints** — Major version bumps with breaking changes wait for Sprint 8 (or future security-focused sprints) to ensure end-to-end testing in a staging environment.
5. **Never run `npm audit fix --force`** — applies all patches indiscriminately, including breaking changes.

## When to revisit each item

| CVE | Trigger condition |
|---|---|
| drizzle-orm | When Drizzle 0.45.x stabilizes for Vercel + Neon, OR Sprint 8 |
| esbuild | Resolved automatically with drizzle-kit upgrade |
| Clerk | Sprint 8, OR if we add features using Clerk organizations/billing/reverification (which would require upgrade first) |
| js-cookie | Resolved automatically with Clerk upgrade |
