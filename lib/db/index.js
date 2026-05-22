/**
 * Database Client — Neon Native SDK
 *
 * Uses @neondatabase/serverless directly (the original @vercel/postgres
 * wrapper was deprecated in late 2024). The connection auto-discovers the
 * DATABASE_URL or POSTGRES_URL env variable that Neon's Vercel integration
 * provides. We prefer DATABASE_URL (Neon's canonical name) but fall back
 * to POSTGRES_URL for compatibility.
 */

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schemaImport from "./schema";

const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL_UNPOOLED;

if (!connectionString) {
  throw new Error(
    "[lib/db] No database connection string found. " +
    "Expected DATABASE_URL or POSTGRES_URL in environment. " +
    "If running locally, ensure .env.local has been populated via `npx vercel env pull .env.local`."
  );
}

const sql = neon(connectionString);
export const db = drizzle(sql, { schema: schemaImport });

export * as schema from "./schema";
