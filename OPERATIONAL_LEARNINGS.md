# Operational Learnings

A running log of lessons learned the hard way, so we don't repeat them. Every entry should be specific enough to change future behavior, not just feel good.

---

## L001 — Verify library versions before writing code against an API

**Lesson learned in:** Sprint 4c R3 hotfix saga (2026-05-23)

**What happened:**
- The sign-out patch indirectly caused a 500 error across `/app/*`
- The error was `e.protect is not a function` in middleware
- Hours were spent chasing theories: env vars, Drizzle upgrades, Vercel caching
- The actual cause: our middleware used the wrong Clerk API syntax for our installed version
- Fix took 5 minutes once we checked the installed Clerk version (`5.7.6`) and matched the syntax to that version's docs

**Why it happened:**
- The middleware was originally written using Clerk v5 syntax (`auth.protect()`) — but with a latent bug
- Real Clerk v5 API is `auth().protect()` (call the function, then protect)
- An older patch version of Clerk had a compatibility shim that silently accepted the wrong syntax
- A routine `npm install` (for `pg` and `dotenv-cli`) updated transitive Clerk packages and removed the shim
- The latent bug surfaced suddenly, looking like a fresh regression

**Rules for going forward:**

1. **Before writing code that calls a library API, verify the installed version.**
   - Run `cat node_modules/<package>/package.json | grep version`
   - Match documentation to that exact version, not "latest docs"
   - When docs show a new pattern, check whether your version supports both old and new

2. **Any `npm install` — even for unrelated packages — can change auth/DB behavior via transitive deps.**
   - After any `npm install`, run a quick smoke test on auth-protected routes
   - This goes in the deploy checklist (see DEPLOY_CHECKLIST below)

3. **Latent bugs that "work" via compatibility shims are real and will eventually surface.**
   - Don't trust "it's been working for weeks" as evidence the code is correct
   - When something starts breaking unexpectedly, suspect latent bugs in core paths

---

## L002 — When something breaks, get the actual error before proposing fixes

**Lesson learned in:** Same saga as L001

**What happened:**
- The first error symptom was a generic `MIDDLEWARE_INVOCATION_FAILED` 500 page
- Without seeing the underlying error, multiple theories were proposed (env vars, Drizzle compatibility, build caching)
- Each theory led to a patch that didn't work
- Once the actual stack trace was retrieved from Vercel Runtime Logs, the fix was immediate

**Rules for going forward:**

1. **First diagnostic step for any 500: get the runtime log with stack trace.**
   - Path: Vercel → Project → Logs tab (project-level, not deployment-level)
   - Trigger the error in a separate tab
   - Expand the red 500 entry to see the actual error message

2. **Never propose fixes without seeing the actual error text.**
   - Theories based on "what changed recently" can be wildly wrong
   - The 60 seconds to retrieve the log saves hours of bad-fix iteration

3. **A 500 error code is a category, not a diagnosis.**
   - `MIDDLEWARE_INVOCATION_FAILED` could be auth, DB, env, code, runtime — any of those
   - Only the expanded log entry tells you which

---

## L003 — Roll back broken deploys via Vercel's "Promote" button

**Lesson learned in:** Same saga

**What happened:**
- During investigation, the site needed to be brought back online before diagnosis was complete
- Vercel's "Promote to Production" feature was used to revert to the previous working deployment in ~5 seconds
- This bought time to investigate without an outage

**Rules for going forward:**

1. **For any production breakage where the cause isn't obvious in 5 minutes: promote the previous good deployment immediately.**
   - Path: Vercel → Project → Deployments → click previous deployment → `...` menu → Promote to Production
   - Site comes back in seconds
   - Investigation continues in parallel without outage pressure

2. **Code rollback ≠ data rollback.**
   - Promoting a previous deployment restores code
   - Database state (Neon) is unchanged
   - Any DB migrations that ran will still be in place — this is usually fine, but worth noting

3. **The git log and Vercel deployment history are separate. Don't confuse them.**
   - Promoting an old deployment doesn't revert your local git
   - Local fixes still need to be committed and re-deployed once the bug is fixed

---

## DEPLOY_CHECKLIST

For any deploy that touches:
- Authentication code (middleware.js, Clerk components, `auth()` calls)
- Database code (schema.js, server/*.js)
- Dependencies (`npm install` of anything)

Before pushing:

- [ ] `npm run build` completes locally with no errors
- [ ] If auth code changed: walk through sign-in → workspace → sign-out manually
- [ ] If DB code changed: open a client profile and verify it loads
- [ ] If dependencies changed: smoke test BOTH auth and DB paths

After pushing:

- [ ] Wait for Vercel deploy to show "Ready" status
- [ ] Visit `/` (homepage) — should load
- [ ] If signed-out behavior changed: incognito test
- [ ] Visit `/app` (protected route) — should require auth and then load
- [ ] If anything looks off: pull Vercel Runtime Logs for the failed request before changing more code

---

## DEPENDENCY_UPGRADE_PROTOCOL

For any dependency version bump beyond patch-level:

1. **Don't combine with feature work.** Upgrades go in their own commit/deploy.
2. **Read the package's CHANGELOG between current and target version.**
3. **Check the migration guide if it exists.** Especially for auth and ORM libraries.
4. **Deploy to a preview environment first** when one exists (we don't have one yet — Sprint 5/6 prep should add this).
5. **Manually exercise auth flow + DB queries** after the upgrade lands locally, before pushing.
6. **If anything is unexpected, abort and downgrade.** Don't try to "fix forward" mid-upgrade.

---

This document evolves. Add new lessons as they emerge.
