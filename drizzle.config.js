/**
 * Drizzle Kit Configuration
 *
 * Used by drizzle-kit CLI for generating migrations and pushing schema
 * changes. The schema source of truth is lib/db/schema.js; this config
 * tells drizzle-kit where to find it and how to connect.
 *
 * Commands:
 *   npm run db:push      → Push schema directly to DB (dev convenience)
 *   npm run db:generate  → Generate SQL migration files (production-grade)
 *   npm run db:studio    → Open Drizzle Studio (visual table browser)
 */

import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./lib/db/schema.js",
  out: "./lib/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.POSTGRES_URL,
  },
  verbose: true,
  strict: true,
});
