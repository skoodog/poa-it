import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local" });
config({ path: ".env" });

const connectionUrl =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL;

if (!connectionUrl) {
  throw new Error(
    "[drizzle.config.js] No connection string found. " +
    "Expected DATABASE_URL or POSTGRES_URL in .env.local. " +
    "Run `npx vercel env pull .env.local` to populate."
  );
}

export default defineConfig({
  schema: "./lib/db/schema.js",
  out: "./lib/db/migrations",
  dialect: "postgresql",
  dbCredentials: { url: connectionUrl },
  verbose: true,
  strict: true,
});
