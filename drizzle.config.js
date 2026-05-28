/**
 * Drizzle Kit Configuration
 *
 * Used by drizzle-kit CLI for generating migrations and pushing schema
 * changes. The schema source of truth is lib/db/schema.js; this config
 * tells drizzle-kit where to find it and how to connect.
 *
 * Driver note: we explicitly use `pg` (node-postgres) here instead of
 * letting drizzle-kit auto-select. Auto-selection was picking the
 * `@vercel/postgres` driver based on URL pattern matching, which is
 * websocket-only and produced a warning on every push. The `pg` driver
 * speaks plain Postgres protocol and is the simplest, most reliable
 * option for DDL operations like CREATE TABLE. Runtime queries (from
 * lib/db/index.js) still use the Neon HTTP driver directly — this
 * config only affects the drizzle-kit CLI.
 *
 * Commands:
 *   npm run db:push      → Push schema directly to DB (dev convenience)
 *   npm run db:generate  → Generate SQL migration files (production-grade)
 *   npm run db:studio    → Open Drizzle Studio (visual table browser)
 */

import { defineConfig } from "drizzle-kit";

/**
 * SSL connection string suffix for Neon. We append `?sslmode=require` to the
 * connection URL (if not already present) and set `uselibpqcompat=true` so
 * the pg driver uses standard libpq SSL semantics. This eliminates the
 * pg-connection-string warning about future SSL mode behavior changes and
 * is forward-compatible with pg v9.
 */
function neonConnectionUrl(rawUrl) {
  if (!rawUrl) return undefined;
  const url = new URL(rawUrl);
  // Set the SSL params explicitly. If they're already set in the URL, this
  // overwrites — that's the goal (we want explicit, predictable values).
  url.searchParams.set("sslmode", "require");
  url.searchParams.set("uselibpqcompat", "true");
  return url.toString();
}

export default defineConfig({
  schema: "./lib/db/schema.js",
  out: "./lib/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    // For DDL (push/generate), prefer the DIRECT/unpooled connection —
    // pgbouncer (pooled) can interfere with multi-statement schema changes.
    // Tolerate the several names Neon/Vercel integrations use, so an env
    // pull that renames things can't silently break migrations again.
    url: neonConnectionUrl(
      process.env.POSTGRES_URL_NON_POOLING ||
        process.env.POSTGRES_DATABASE_URL_UNPOOLED ||
        process.env.POSTGRES_URL ||
        process.env.DATABASE_URL
    ),
  },
  verbose: true,
  strict: true,
});
