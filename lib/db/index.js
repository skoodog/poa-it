/**
 * Database Client
 *
 * Singleton Drizzle ORM client connecting to Vercel Postgres. Imported by
 * server actions, API routes, and any server-side code that needs to query
 * the database.
 *
 * Usage:
 *   import { db } from "@/lib/db";
 *   import { users } from "@/lib/db/schema";
 *
 *   const allUsers = await db.select().from(users);
 *
 * The Vercel Postgres SDK auto-discovers connection details from environment
 * variables (POSTGRES_URL etc.) which Vercel injects automatically when you
 * provision a Postgres database in the dashboard.
 *
 * For local development, copy these env vars into .env.local — see SETUP.md.
 */

import { drizzle } from "drizzle-orm/vercel-postgres";
import { sql } from "@vercel/postgres";
import * as schema from "./schema";

export const db = drizzle(sql, { schema });

// Re-export schema for convenient access
export * as schema from "./schema";
