# Sprint 1 Setup Guide

This sprint adds **database persistence** and **authentication** to POA-IT. Both require infrastructure provisioning that I can't do for you — you'll click through the dashboards and run a couple of CLI commands.

**Total time: 30-45 minutes the first time.**

Read all the way through before starting. Then work through the steps in order. Stop and tell me if anything is unclear or fails.

---

## What you're setting up

| Service | What it does | Cost |
|---|---|---|
| Vercel Postgres | The database | Free up to 256MB / Pro plan you have already |
| Clerk | Authentication | Free up to 10,000 monthly active users |

Total marginal cost: $0 to start. Both services scale with usage.

---

## Step 1 — Provision Vercel Postgres (5 minutes)

You upgraded to Vercel Pro already, so Postgres is available.

1. Go to **vercel.com/dashboard**
2. Click your **poa-it** project
3. Click the **Storage** tab in the top nav
4. Click **Create Database** → select **Postgres**
5. Region: pick **Washington, D.C. (iad1)** (closest to most US users; you can change later)
6. Name: leave as `poa-it-db` or change if you want
7. Click **Create**

Vercel will provision the database (takes about 30 seconds). When done, you'll see a "Connect Project" prompt.

8. Click **Connect Project** → select your `poa-it` project → click **Connect**
9. Choose to connect to **all environments** (Development, Preview, Production)

That's it. Vercel automatically injects the connection environment variables (`POSTGRES_URL`, `POSTGRES_PRISMA_URL`, etc.) into your project. You don't have to copy them anywhere.

---

## Step 2 — Pull environment variables to your local machine (2 minutes)

For local development, you need the Postgres credentials on your laptop too. Vercel's CLI handles this.

```bash
cd ~/poa-it
npx vercel link
```

The CLI will ask:
- "Set up and link?" → **Y**
- "Which scope?" → pick your account
- "Link to existing project?" → **Y**
- "What's the name of your existing project?" → `poa-it`

After linking, pull the env vars:

```bash
npx vercel env pull .env.local
```

This downloads all production env vars (including the new Postgres ones) into a local `.env.local` file. This file is already in `.gitignore` — it never gets committed.

Verify it worked:

```bash
cat .env.local | grep POSTGRES_URL
```

You should see a line starting with `POSTGRES_URL="postgres://..."`. If you see that, Postgres is set up locally.

---

## Step 3 — Set up Clerk (8 minutes)

1. Go to **clerk.com** and sign up (or sign in if you have an account)
2. Click **+ Create Application**
3. Application name: **POA-IT** (or whatever you like)
4. Choose sign-in methods. Recommended for launch: **Email + Google + Apple**. You can add more later.
5. Click **Create Application**

Clerk will give you two keys:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

Copy both. Now add them to Vercel:

6. Back in vercel.com/dashboard → poa-it project → **Settings → Environment Variables**
7. Click **Add New**
8. Variable name: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
9. Value: paste your publishable key (the `pk_test_...` one)
10. Environments: check **all three** (Production, Preview, Development)
11. Click **Save**
12. Repeat for `CLERK_SECRET_KEY` (the `sk_test_...` one)

Also add these Clerk URL config variables (paste each one separately):

```
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/post-auth-redirect
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding
```

Now pull these env vars to your local machine too:

```bash
npx vercel env pull .env.local
```

This overwrites `.env.local` with the latest (now including Clerk). Verify:

```bash
cat .env.local | grep CLERK
```

You should see all the Clerk variables.

---

## Step 4 — Install dependencies (2 minutes)

```bash
cd ~/poa-it
npm install
```

This installs the new dependencies: `@clerk/nextjs`, `@vercel/postgres`, `drizzle-orm`, `drizzle-kit`.

Takes about 30 seconds. If there are warnings about peer dependencies, ignore them.

---

## Step 5 — Push the database schema (3 minutes)

The schema lives in `lib/db/schema.js`. Drizzle Kit reads it and provisions the tables in Postgres.

```bash
npm run db:push
```

You'll see output like:
```
[✓] Pulling schema from database...
[✓] Changes applied
```

Drizzle may show you a summary of the tables it's creating (`users`, `firms`, `clients`, `wizard_sessions`, `documents`, `audit_events`, `leads`) and ask **"Do you want to push these changes? [Y/n]"** — type **Y**.

Verify the tables were created. You can do this two ways:

**Option A: Drizzle Studio (visual)**
```bash
npm run db:studio
```
Opens a browser tab where you can browse the tables. Should see all 7 tables, all empty. Press Ctrl+C in your terminal to stop the studio when done.

**Option B: Vercel dashboard**
Go to your Postgres database in vercel.com → click the **Data** tab → see the list of tables.

---

## Step 6 — Test locally (5 minutes)

```bash
npm run dev
```

Open http://localhost:3000 in your browser. The marketing site should load as before.

Now test the auth flow:

1. Click any "Sign in" link (or go to `/sign-in` directly) — you should see Clerk's sign-in widget
2. Click "Sign up" → create a test account with your email
3. Verify your email (Clerk sends a code)
4. After verification, you'll land on `/onboarding`
5. Click **"For myself"** — you're redirected to the homepage. Database now has your user record.
6. Sign out (via the UserButton in the corner)
7. Sign up with a different email
8. This time click **"For my clients"**
9. Fill in firm name (e.g., "Test Firm") and pick "Solo practitioner"
10. Submit → you land on `/app` with the placeholder workspace

If all that works, Sprint 1 is functioning end-to-end locally.

---

## Step 7 — Deploy to production (5 minutes)

```bash
cd ~/poa-it
git add .
git commit -m "Sprint 1: Database + auth (Vercel Postgres + Drizzle + Clerk)"
git push
```

Vercel will rebuild. Watch the deployment in the dashboard — first build with the new dependencies takes 2-3 minutes (vs. 60s for code-only changes).

When the build completes:

1. Visit `https://poa-it.com/sign-up`
2. Create a test account
3. Walk through onboarding
4. Confirm everything works the same as local

**Heads up:** Because the Clerk keys are currently `pk_test_...` and `sk_test_...` (test mode), users won't see any "test mode" banner but **emails won't actually send** in test mode beyond Clerk's verification emails. We'll upgrade to live Clerk keys before real customers — for now, test mode is fine.

---

## Troubleshooting

### `npm run db:push` fails with "no environment variable POSTGRES_URL"

Means `.env.local` doesn't have the variable. Re-run `npx vercel env pull .env.local` and confirm the file contains the `POSTGRES_URL` line.

### Clerk sign-in page shows a blank screen

Check browser console. Most likely missing publishable key — verify `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is in your `.env.local` and in Vercel env vars.

### Onboarding form submits but nothing happens

Likely the `getCurrentUser()` server action is failing because the user wasn't synced. Check Vercel deployment logs. If you see "user not found" errors, sign out and back in to trigger a re-sync.

### Vercel deployment fails with "module not found"

Means a dependency didn't install. In Vercel dashboard → deployment logs → look for the npm install error. Usually a temporary issue; try redeploying.

### Database push hangs

The schema sync sometimes pauses asking for confirmation on destructive changes. Re-run with `--force` flag: `npx drizzle-kit push --force` (won't be needed for first push since DB is empty).

---

## What's running where after Sprint 1

| Where | What lives there |
|---|---|
| Browser localStorage | Wizard state (cached, fallback) + audit log (cached) |
| Vercel Postgres | Wizard state (authoritative) + audit log (authoritative) + users + firms + clients + documents + leads |
| Clerk | User identity (auth tokens, email verification, password recovery) |
| Vercel env vars | Service credentials (Postgres URL, Clerk keys) |

The wizard still works for anonymous users — localStorage carries them through. Sign-in is purely additive: it claims their existing session and ties it to their account.

---

## What's NOT in Sprint 1

Sprint 1 is foundation. These come in later sprints:
- Professional workspace UI (Sprint 2)
- Client management (Sprint 3)
- PDF generation (Sprint 4)
- Intake flows (Sprint 5)
- Stripe payments (Sprint 6)
- Proof notarization + Resend email (Sprint 7)

If you sign in as a professional today, you see a placeholder workspace. Real features arrive in Sprint 2.
