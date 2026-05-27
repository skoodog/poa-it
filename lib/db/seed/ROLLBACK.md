# Seed Rollback Procedures

If the seed script inserts something wrong, or you need to remove all system
profiles for any reason, here are the SQL commands. Run these directly in the
Neon SQL console (or `npm run db:studio` for a UI).

## Rollback all system-default profiles

This removes every profile inserted by the seed script. It does NOT touch
firm-custom profiles (those have `is_system_default = false`).

```sql
-- Step 1: orphan any presentations that reference these profiles
-- (foreign key is ON DELETE SET NULL, so this happens automatically)

-- Step 2: delete the system profiles
DELETE FROM institution_profiles
WHERE is_system_default = true;
```

## Rollback specific profiles by slug

```sql
DELETE FROM institution_profiles
WHERE slug IN ('banking', 'brokerage');  -- example
```

## Verify rollback

```sql
-- Should return 0 (or your remaining firm-custom count)
SELECT COUNT(*) FROM institution_profiles WHERE is_system_default = true;

-- Should still show any presentations, with NULL institution_profile_id
SELECT COUNT(*) FROM institution_presentations WHERE institution_profile_id IS NULL;
```

## Restoring after rollback

To put the system profiles back after a rollback:

```
cd ~/poa-it
npm run db:seed
```

The seed is idempotent and will insert everything that's missing.

## What if a deploy ran a bad seed in production?

This is the worst case. The recovery steps:

1. Roll back the bad deploy in Vercel (Promote previous deployment)
2. Connect to the production Neon DB via SQL console
3. Run the rollback SQL above
4. Fix the seed file locally
5. Re-run `npm run db:seed` locally (which now hits production)
6. Re-deploy

Note: per our Sprint 4d planning, the seed does NOT run automatically on
deploy — it's manual via `npm run db:seed`. So a bad seed can only be
introduced by you running the command, not by a deploy.
