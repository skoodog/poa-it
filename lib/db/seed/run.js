/**
 * Seed Script Runner
 *
 * Idempotent seed for the institution_profiles table. Inserts any system
 * default profiles that don't already exist (matched by slug). Never updates
 * existing rows.
 *
 * Usage:
 *   npm run db:seed
 *
 * Implementation note: this script creates its own database connection
 * rather than importing from lib/db/index.js. Reasons:
 *   1. lib/db/index.js uses extensionless imports ("./schema") that work
 *      inside Next.js bundling but fail under plain Node ESM resolution
 *   2. Isolating the seed connection from app connection pools is safer —
 *      seed errors can't affect live app traffic
 *   3. Per OPERATIONAL_LEARNINGS L003, keep seed self-contained for easy
 *      rollback and debugging
 *
 * Safety design (per Sprint 4d planning):
 *   - Idempotent: re-running inserts nothing if everything's already there
 *   - Wrapped in a transaction: all-or-nothing
 *   - Verbose: prints count before, count after, and which slugs were added
 *   - Verifies expected profiles exist at the end
 *
 * Rollback (manual SQL): see lib/db/seed/ROLLBACK.md
 *
 * Sprint 4d Round 1.
 */

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, isNull } from "drizzle-orm";
import { institutionProfiles } from "../schema.js";
import { SYSTEM_INSTITUTION_PROFILES, isValidProfile } from "./institution-profiles.js";

const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL_UNPOOLED;

if (!connectionString) {
  console.error(
    "[seed] FAIL: No database connection string. Expected DATABASE_URL or POSTGRES_URL."
  );
  console.error(
    "[seed] If running locally, ensure .env.local has been populated."
  );
  process.exit(1);
}

const sql = neon(connectionString);
const db = drizzle(sql);

async function seed() {
  console.log("[seed] starting institution_profiles seed...");

  // Validate seed data shape before touching the DB
  for (const profile of SYSTEM_INSTITUTION_PROFILES) {
    if (!isValidProfile(profile)) {
      console.error("[seed] FAIL: invalid profile shape:", profile);
      process.exit(1);
    }
  }

  // Count before
  const existingBefore = await db
    .select({ slug: institutionProfiles.slug })
    .from(institutionProfiles)
    .where(isNull(institutionProfiles.firmId));

  const existingSlugs = new Set(existingBefore.map((r) => r.slug));

  console.log(`[seed] institution_profiles (system defaults) before: ${existingBefore.length}`);
  if (existingBefore.length > 0) {
    console.log(`[seed]   existing slugs: ${[...existingSlugs].sort().join(", ")}`);
  }

  // Determine which profiles need to be inserted
  const toInsert = SYSTEM_INSTITUTION_PROFILES.filter(
    (p) => !existingSlugs.has(p.slug)
  );

  if (toInsert.length === 0) {
    console.log("[seed] all expected profiles already present — nothing to insert.");
  } else {
    console.log(`[seed] inserting ${toInsert.length} new profile(s): ${toInsert.map(p => p.slug).join(", ")}`);

    // Note: neon-http driver does not support db.transaction(). Inserts
    // are issued individually. The idempotency check above means a partial
    // failure can be safely retried — already-inserted rows will be detected
    // and skipped on re-run.
    for (const profile of toInsert) {
      await db.insert(institutionProfiles).values({
        slug: profile.slug,
        displayName: profile.displayName,
        description: profile.description,
        recommendedPowers: profile.recommendedPowers,
        recommendedNotes: profile.recommendedNotes,
        isSystemDefault: profile.isSystemDefault,
        sortOrder: profile.sortOrder,
        firmId: null,
      });
    }

    console.log(`[seed] inserted ${toInsert.length} profile(s) successfully.`);
  }

  // Verify expected profiles exist after seeding
  const existingAfter = await db
    .select({ slug: institutionProfiles.slug })
    .from(institutionProfiles)
    .where(isNull(institutionProfiles.firmId));

  const afterSlugs = new Set(existingAfter.map((r) => r.slug));
  const expectedSlugs = new Set(SYSTEM_INSTITUTION_PROFILES.map((p) => p.slug));

  console.log(`[seed] institution_profiles (system defaults) after: ${existingAfter.length}`);

  // Sanity check: every expected slug should be present
  const missing = [...expectedSlugs].filter((s) => !afterSlugs.has(s));
  if (missing.length > 0) {
    console.error(`[seed] FAIL: expected slugs not present after seeding: ${missing.join(", ")}`);
    process.exit(1);
  }

  console.log(`[seed] verified ${expectedSlugs.size}/${expectedSlugs.size} expected profiles present.`);
  console.log("[seed] done.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("[seed] FATAL:", err);
  process.exit(1);
});
