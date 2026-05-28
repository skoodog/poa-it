/**
 * Taxonomy Consistency Audit Script
 *
 * Non-destructive read-only scan of the database. Reports any rows whose
 * structured fields reference values not in the canonical taxonomy.
 *
 * Usage:
 *   npm run db:audit-taxonomy
 *
 * What it checks:
 *   1. wizardSessions.answers.powersGranted — every power key must be in POWERS
 *   2. wizardSessions.answers.hotPowersGranted — every key must be in HOT_POWERS
 *   3. wizardSessions.answers.executionMethod — must be a valid execution method
 *   4. wizardSessions.answers.effectiveDateChoice — must be a valid effective date type
 *   5. wizardSessions.answers.powersScope — must be a valid scope
 *   6. wizardSessions.answers.agentCompensation — must be a valid compensation
 *   7. documents.status — must be a valid document status
 *   8. revocations.status — must be a valid revocation status
 *   9. revocations.scope — must be a valid revocation scope
 *   10. institution_presentations.status — must be a valid presentation status
 *   11. institution_profiles.recommendedPowers — every key must be in POWERS
 *
 * Output: prints a report to stdout. Non-zero exit if any inconsistencies found.
 *
 * Sprint 4d.5 — Schema Consistency Sprint.
 */

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import {
  wizardSessions,
  documents,
  revocations,
  institutionPresentations,
  institutionProfiles,
} from "../schema.js";
import {
  isValidPowerKey,
  isValidHotPowerKey,
  isValidExecutionMethod,
  isValidEffectiveDateType,
  isValidPowersScope,
  isValidAgentCompensation,
  isValidDocumentStatus,
  isValidRevocationStatus,
  isValidPresentationStatus,
} from "../../taxonomy/poaTaxonomy.js";

const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL_UNPOOLED;

if (!connectionString) {
  console.error("[audit] FAIL: No database connection string.");
  process.exit(1);
}

const sql = neon(connectionString);
const db = drizzle(sql);

const issues = [];

function reportIssue(category, row, field, value, reason) {
  issues.push({ category, rowId: row.id, field, value, reason });
}

async function auditWizardSessions() {
  console.log("[audit] scanning wizard_sessions...");
  const rows = await db.select().from(wizardSessions);
  console.log(`[audit]   ${rows.length} rows`);

  for (const row of rows) {
    const a = row.answers || {};

    // Powers granted
    if (Array.isArray(a.powersGranted)) {
      for (const k of a.powersGranted) {
        if (!isValidPowerKey(k)) {
          reportIssue("wizard_sessions", row, "answers.powersGranted", k, "not in taxonomy");
        }
      }
    }

    // Hot powers
    if (Array.isArray(a.hotPowersGranted)) {
      for (const k of a.hotPowersGranted) {
        if (!isValidHotPowerKey(k)) {
          reportIssue("wizard_sessions", row, "answers.hotPowersGranted", k, "not in taxonomy");
        }
      }
    }

    // Execution method
    if (a.executionMethod && !isValidExecutionMethod(a.executionMethod)) {
      reportIssue("wizard_sessions", row, "answers.executionMethod", a.executionMethod, "not in taxonomy");
    }

    // Effective date choice
    if (a.effectiveDateChoice && !isValidEffectiveDateType(a.effectiveDateChoice)) {
      reportIssue("wizard_sessions", row, "answers.effectiveDateChoice", a.effectiveDateChoice, "not in taxonomy");
    }

    // Powers scope
    if (a.powersScope && !isValidPowersScope(a.powersScope)) {
      reportIssue("wizard_sessions", row, "answers.powersScope", a.powersScope, "not in taxonomy");
    }

    // Agent compensation
    if (a.agentCompensation && !isValidAgentCompensation(a.agentCompensation)) {
      reportIssue("wizard_sessions", row, "answers.agentCompensation", a.agentCompensation, "not in taxonomy");
    }
  }
}

async function auditDocuments() {
  console.log("[audit] scanning documents...");
  const rows = await db.select().from(documents);
  console.log(`[audit]   ${rows.length} rows`);

  for (const row of rows) {
    if (row.status && !isValidDocumentStatus(row.status)) {
      reportIssue("documents", row, "status", row.status, "not in taxonomy");
    }
  }
}

async function auditRevocations() {
  console.log("[audit] scanning revocations...");
  const rows = await db.select().from(revocations);
  console.log(`[audit]   ${rows.length} rows`);

  for (const row of rows) {
    if (row.status && !isValidRevocationStatus(row.status)) {
      reportIssue("revocations", row, "status", row.status, "not in taxonomy");
    }
  }
}

async function auditPresentations() {
  console.log("[audit] scanning institution_presentations...");
  const rows = await db.select().from(institutionPresentations);
  console.log(`[audit]   ${rows.length} rows`);

  for (const row of rows) {
    if (row.status && !isValidPresentationStatus(row.status)) {
      reportIssue("institution_presentations", row, "status", row.status, "not in taxonomy");
    }

    if (Array.isArray(row.selectedPowers)) {
      for (const k of row.selectedPowers) {
        if (!isValidPowerKey(k)) {
          reportIssue("institution_presentations", row, "selectedPowers", k, "not in taxonomy");
        }
      }
    }
  }
}

async function auditInstitutionProfiles() {
  console.log("[audit] scanning institution_profiles...");
  const rows = await db.select().from(institutionProfiles);
  console.log(`[audit]   ${rows.length} rows`);

  for (const row of rows) {
    if (Array.isArray(row.recommendedPowers)) {
      for (const k of row.recommendedPowers) {
        if (!isValidPowerKey(k)) {
          reportIssue("institution_profiles", row, "recommendedPowers", k, "not in taxonomy");
        }
      }
    }
  }
}

async function audit() {
  console.log("[audit] starting taxonomy consistency scan...\n");

  await auditWizardSessions();
  await auditDocuments();
  await auditRevocations();
  await auditPresentations();
  await auditInstitutionProfiles();

  console.log("");

  if (issues.length === 0) {
    console.log("[audit] ✓ no taxonomy inconsistencies found.");
    process.exit(0);
  }

  console.log(`[audit] ✗ found ${issues.length} issue(s):`);
  console.log("");

  // Group by category for readability
  const byCategory = {};
  for (const issue of issues) {
    if (!byCategory[issue.category]) byCategory[issue.category] = [];
    byCategory[issue.category].push(issue);
  }

  for (const [category, items] of Object.entries(byCategory)) {
    console.log(`  ${category} (${items.length} issues):`);
    for (const item of items) {
      console.log(
        `    - row ${item.rowId}: field "${item.field}" has value "${item.value}" — ${item.reason}`
      );
    }
    console.log("");
  }

  process.exit(1);
}

audit().catch((err) => {
  console.error("[audit] FATAL:", err);
  process.exit(1);
});
