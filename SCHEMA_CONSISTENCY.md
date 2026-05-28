# Schema Consistency

## Background

Sprint 4d.5 was a deliberate pause to address architectural debt around
the codebase's vocabulary. Same logical concepts (power keys, execution
methods, status enums) were being hand-typed as strings in many places,
with no compile-time check that the spellings matched. The "Pro vs
Consumer" inconsistency Rob flagged was real, but the root cause was
not actually a data-model divergence — it was a code-organization issue.

## Findings from the audit

### What's actually consistent

- **Database schema is uniform.** Every `documents` row has a
  `wizardSessionId`, meaning every POA in the system was originated by
  walking the consumer wizard. The `wizardSessions.answers` JSON object
  has the same shape regardless of whether a consumer or a pro originally
  walked through.
- **Database enum values are well-defined.** `documentStatusEnum`,
  `revocationStatusEnum`, `presentationStatusEnum`, and others are all
  Postgres-enforced. Drizzle types match.

### What was inconsistent (the actual problem)

- **Six files redefined power display labels**: PDF templates, PDF
  sections, presentation step components. Each had its own hash mapping
  `real_property → "Real property transactions"`. Updating one wouldn't
  update the others.
- **Two id conventions coexisted**:
  - `wizardSessions.answers.powersGranted` stores the user-facing key
    (`real_property`)
  - `lib/clauseLibrary/clauses.json` stores the same logical power under
    `clause_id: power_real_property`
  - The mapping between them was an implicit `replace(/^power_/, "")`
    that only worked because of careful naming discipline — until line O,
    where `power_all_of_the_above` mapped to `all_of_the_above`, but the
    consumer wizard actually stored `all_powers`. So the mapping had an
    exception that was never documented.
- **Sprint 4d code introduced typos**: Sprint 4d Round 2's
  `PresentationStep3_Authority.jsx` and `PresentationStep4_Review.jsx`
  used `personal_family_maintenance` (no `_and_`) — but the canonical
  form in the clause library is `personal_and_family_maintenance`. The
  seed file referenced the wrong key in a comment. None of these would
  have failed loudly; they'd have silently produced wrong recommendations.
- **No central registry of valid values.** Wanting to know "what are
  all the document statuses?" required reading the schema.js enum
  definition. Wanting to know "what powers can be granted?" required
  reading the clauseLibrary JSON.

## The taxonomy module

**File:** `lib/taxonomy/poaTaxonomy.js`

Single source of truth for every enum-like value in the codebase. Exports:

- `POWERS` — 15 entries (A through O), each with `key`, `letter`,
  `displayName`, `statutoryCitation`, `plainEnglishExamples`, and
  `statutoryLanguage`. Frozen.
- `HOT_POWERS` — 5 entries per § 751.031(b).
- `EXECUTION_METHODS` — `ron` | `in_person`.
- `EFFECTIVE_DATE_TYPES` — `immediate` | `springing`.
- `POWERS_SCOPES` — `broad` | `limited` | `custom`.
- `AGENT_COMPENSATIONS` — `reasonable` | `no_compensation`.
- `DOCUMENT_STATUSES` — all 11 values from `documentStatusEnum` with
  display + tone.
- `REVOCATION_STATUSES`, `REVOCATION_SCOPES` — full lookups.
- `PRESENTATION_STATUSES` — all 6 values.
- `INSTITUTION_PROFILE_SLUGS` — the 8 system defaults.
- Validators for each: `isValidPowerKey`, `isValidExecutionMethod`, etc.
- Display helpers: `getPowerDisplayName`, `getPowerLetter`,
  `getDocumentStatusDisplay`, etc.

## Migration strategy

### Round 1 (THIS round)

- ✅ Build the taxonomy module
- ✅ Update the seed file to import from taxonomy + validate keys
- ✅ Build the audit script (`npm run db:audit-taxonomy`)
- ✅ Run the audit against production data to confirm no inconsistencies

### Round 2 (NEXT round, before Sprint 4d Round 3)

- Refactor Sprint 4d Round 2 code:
  - `lib/pdf/presentation/presentationTemplate.jsx` — replace POWER_LABELS
    hash with `getPowerDisplayName` from taxonomy
  - `components/presentation/PresentationStep3_Authority.jsx` — same
  - `components/presentation/PresentationStep4_Review.jsx` — same
  - Fix `personal_family_maintenance` → `personal_and_family_maintenance`
    typo in both step files
- Refactor PDF templates from earlier sprints:
  - `lib/pdf/sections/Powers.jsx`
  - `lib/pdf/sections/DocumentGenerationCertificate.jsx`

### Round 3 (eventually)

- Consider whether the consumer wizard should import from taxonomy
  instead of `lib/clauseLibrary/engine.js`. Current decision: NO. The
  clause library has its own internal logic (triggers, document type
  filtering) that taxonomy doesn't replicate. Bridging them is more
  work than it saves. The audit script enforces no drift between them.

### Pro Mode wizard (deferred to Sprint 5+)

- A wizard the pro walks on behalf of a client, producing structured
  `wizardSessions.answers` exactly like the consumer wizard does
- Send-link variant: pro generates a link, client walks the wizard
  themselves, work attaches to the pro's workspace
- This is its own sprint, scheduled per Rob's roadmap

## The non-negotiable rules going forward

1. **No new string literal for an enum-like value.** Import the
   constant from the taxonomy module. If the value isn't in the
   taxonomy, ADD IT to the taxonomy before using it.
2. **Validate at seed time.** Seed scripts that reference taxonomy
   values must call the appropriate validator. If a typo'd key gets
   past the validator, fix the validator.
3. **Audit before deploying schema changes.** Run
   `npm run db:audit-taxonomy` before any DB schema migration or seed
   update that touches structured values. Clean report = safe to
   proceed.
4. **The taxonomy module is the public API.** Other modules
   (`lib/clauseLibrary/engine.js`, the database enums, the PDF
   templates) are implementation details. New features import from
   `lib/taxonomy/poaTaxonomy.js`.
