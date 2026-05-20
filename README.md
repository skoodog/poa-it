# POA-IT

Texas-first power-of-attorney service. Marketing site, pre-launch wizard, and audit infrastructure built on Next.js 14.

## Status (May 2026)

Pre-launch. The marketing site is live at https://poa-it.com. The wizard at `/wizard` produces a complete evidentiary record and ends at a waitlist signup — no payments are processed and no documents are generated yet. Production stack (Stripe, RON provider, PDF generator, database) is mapped in Phase 6 of the build plan but not yet implemented.

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Tech stack

- Next.js 14 (App Router)
- React 18
- lucide-react (icons)
- All styling is inline — no Tailwind or external CSS framework
- LocalStorage for wizard state and audit log (server-side persistence in Phase 6)

## Project structure

```
poa-it/
├── app/
│   ├── layout.jsx              # Root HTML layout
│   ├── page.jsx                # Marketing homepage
│   ├── legal/                  # Pre-launch legal pages
│   │   ├── terms/page.jsx
│   │   ├── privacy/page.jsx
│   │   ├── refunds/page.jsx
│   │   └── complaints/page.jsx
│   └── wizard/
│       ├── page.jsx            # The wizard (9 steps + eligibility gate)
│       └── audit/page.jsx      # Counsel-reviewable audit log viewer
├── components/
│   ├── PoaItSite.jsx           # Marketing homepage
│   ├── LegalLayout.jsx         # Shared layout for legal pages
│   └── wizard/
│       ├── WizardShell.jsx     # Progress indicator + shell chrome
│       ├── shared/             # Reusable wizard primitives
│       │   ├── tokens.js
│       │   ├── FormFields.jsx
│       │   ├── StatutoryTooltip.jsx
│       │   ├── WarningBanner.jsx
│       │   ├── Disclaimer.jsx
│       │   ├── AcknowledgmentCheckbox.jsx
│       │   └── AttorneyReferralPrompt.jsx
│       └── screens/            # The wizard's 10 screens
│           ├── EligibilityGate.jsx
│           ├── Step1_DocumentType.jsx
│           ├── Step2_Principal.jsx
│           ├── Step3_Agent.jsx
│           ├── Step4_Powers.jsx
│           ├── Step4a_Homestead.jsx    (conditional)
│           ├── Step5_HotPowers.jsx
│           ├── Step6_EffectiveDate.jsx
│           ├── Step7_ExecutionMethod.jsx
│           ├── Step8_Review.jsx
│           └── Step9_Waitlist.jsx
└── lib/
    ├── clauseLibrary/
    │   ├── clauses.json        # 29 clauses, 6 document types, statutory citations
    │   ├── wizardRules.json    # 12 Phase 3 validation rules
    │   └── engine.js           # Trigger DSL evaluator + clause resolver
    ├── wizard/
    │   ├── state.js            # Initial state, reducer, localStorage persistence
    │   └── validator.js        # Runs rules against state, categorizes results
    ├── audit/
    │   └── logger.js           # Append-only event log
    └── data/
        └── txCounties.js       # All 254 Texas counties + ZIP validation
```

## Architecture notes

**Clause library as single source of truth.** Every clause that goes into a generated document lives in `lib/clauseLibrary/clauses.json` with its statutory citation. The wizard and (future) PDF generator both read from this. Texas counsel reviews and approves the JSON; code doesn't need re-review for content changes.

**Validation rules in JSON.** `lib/clauseLibrary/wizardRules.json` encodes the Phase 3 § 3.16 decision rules. The validator (`lib/wizard/validator.js`) runs them against current state and returns blockers, warnings, referrals, and acknowledgments. Updating a rule means editing JSON, not React.

**Append-only audit log.** Every meaningful wizard action (step transitions, acknowledgments, warnings shown, tooltips opened) generates an audit event with timestamp, session ID, and event data. PII is scrubbed at write time. Visit `/wizard/audit` to see the log for the current session.

**Texas-first.** The codebase hardcodes `TX` throughout the wizard rather than abstracting state-by-state. This is the right call for an MVP shipping only Texas; state-abstraction comes when state #2 (likely Florida or NC) has a launch date.

## Build phases completed

- **Phase 1:** Substrate — clause library JSON, engine, validator, audit logger, shared UI components, eligibility gate as tracer bullet
- **Phase 2:** Linear screens — Document Type, Principal, Agent, Powers
- **Phase 3:** Conditional screens — Homestead, Hot Powers, Effective Date, Execution Method
- **Phase 4:** Terminal screens — Review, Waitlist, Audit Log Viewer
- **Phase 5:** Cutover — homepage modal retired, Florida references removed, state coverage map reflects Texas-only

## What's next (Phase 6 — not yet built)

Server-side persistence, Stripe payment, Stripe Identity verification, RON provider integration (Proof/Notarize), Resend transactional email, PDF generation, Clerk authentication, database schema. See conversation history for the detailed Phase 6 implementation plan.

## Known pre-launch behaviors

- Wizard state and audit log persist to browser localStorage (cleared when user clicks "Start over" or clears browser data). Production version uses server-side persistence.
- Wizard terminates at waitlist signup; no Stripe, no PDF, no notary integration.
- Legal pages (`/legal/*`) are drafts pending Texas counsel review. Each page carries a pre-launch banner.
- Attorney Marketplace prompts route to a placeholder alert; the actual marketplace is Phase 6 work.
