# Security & Dependency Audit Log

This file tracks known vulnerabilities surfaced by `npm audit` and the plan for each. Updated whenever a new CVE appears or an existing one is patched.

## Status as of Sprint 4c completion

`npm audit` reports 12 vulnerabilities across 4 distinct CVEs.

## Resolved in this patch

### ✅ drizzle-orm SQL injection (HIGH — GHSA-gpj5-g38j-94v9)

- **Affected versions:** `< 0.45.2`
- **Was on:** `0.36.0`
- **Now on:** `0.45.2`
- **Real exposure to POA-IT:** None. The CVE affects code that uses user-controlled strings as SQL identifiers (column or table names). All our queries use parameterized values; schema names are static.
- **Patched in:** Cleanup after Sprint 4c R3.

### ✅ esbuild dev-server file read (MODERATE — GHSA-67mh-4wv8-2f99)

- **Affected versions:** `<= 0.24.2` (transitive through `drizzle-kit` < 0.30)
- **Was on:** drizzle-kit `0.28.0` (esbuild `0.24.x`)
- **Now on:** drizzle-kit `0.31.10` (esbuild `0.25.x`)
- **Real exposure to POA-IT:** Local dev only. Couldn't affect production deploys. Closed for cleanliness.
- **Patched in:** Cleanup after Sprint 4c R3.

## Deferred to Sprint 8 (security audit)

### ⏳ Clerk authorization bypass (HIGH — GHSA-w24r-5266-9c3c)

- **Affected versions:** `@clerk/clerk-react` up to `5.61.5`
- **Currently on:** `@clerk/nextjs ^5.7.0` (which pulls a vulnerable clerk-react)
- **Real exposure to POA-IT:** The bypass requires using organization permissions combined with billing or reverification checks. We don't use organizations, billing, or reverification — just basic sign-in / sign-out / `auth()`.
- **Fix requires:** Major version bump to `@clerk/nextjs ^7.x`. Clerk 6→7 has breaking changes around middleware patterns and the `auth()` helper. Needs dedicated effort to:
  1. Read the Clerk 6→7 migration guide
  2. Update middleware patterns
  3. Test sign-in, sign-out, workspace access end-to-end
  4. Have a rollback plan
- **Plan:** Address in Sprint 8 alongside the broader security & UPL audit.

### ⏳ js-cookie attribute injection (HIGH — GHSA-qjx8-664m-686j)

- **Affected versions:** `<= 3.0.5`
- **Currently on:** Pulled transitively through `@clerk/shared` (a Clerk dep)
- **Real exposure to POA-IT:** Limited to whatever Clerk does with the library. We don't use `js-cookie` directly.
- **Fix requires:** Updating Clerk (same upgrade as above resolves this too).
- **Plan:** Resolved as part of the Clerk upgrade in Sprint 8.

## Process going forward

When `npm audit` surfaces a new vulnerability:

1. **Assess exposure** — Does the vulnerable code path exist in our use of the library? If no, document and continue.
2. **Check fix complexity** — Patch-level update (low risk) vs major version bump (needs testing).
3. **Patch low-risk in-sprint** — Patch-level updates and security-only fixes that don't change APIs.
4. **Batch high-risk for security sprints** — Major version bumps with breaking changes wait for Sprint 8 (or future security-focused sprints) to ensure end-to-end testing.

Avoid running `npm audit fix --force`. It applies all available patches indiscriminately, including breaking changes, which is incompatible with a careful release process.

## When to revisit Clerk and js-cookie

The Clerk upgrade is non-trivial. It happens when:

- We're entering Sprint 8 (security & UPL audit), OR
- A user-reachable attack against the vulnerable feature is reported, OR
- We add features that use Clerk organizations, billing, or reverification — at which point we MUST upgrade first.
