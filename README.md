# POA-IT

The marketing site and product preview for POA-IT — state-specific power of attorney, notarized online.

This is a Next.js 14 (App Router) application. Monetization (Stripe Checkout) is intentionally not wired up yet — visitors can walk through the wizard as a product preview, but no real payments are processed.

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
- All styling is inline — no Tailwind or external CSS framework dependency

## Project structure

```
poa-it/
├── package.json
├── .gitignore
├── README.md
├── app/
│   ├── layout.jsx        # Root HTML layout
│   └── page.jsx          # Homepage — renders PoaItSite
└── components/
    └── PoaItSite.jsx     # The full marketing site + product wizard
```

## Important: known demo behaviors

The site is fully functional as a marketing/product preview, but a few elements are simulations:

- **Live activity counter** (hero) — Numbers are seeded and tick up at random intervals. Not real customer activity.
- **Wizard "Continue to payment"** — Triggers a mock payment screen since no Stripe backend is wired. Visitors can complete the mock flow but no charges occur, no documents are generated, no emails are sent.

If you publish this to a real domain, consider whether visitors should be able to walk through the mock payment flow, or whether the wizard's final step should be swapped for a "Notify me at launch" waitlist signup. The current behavior is appropriate for a pre-launch product preview; less so once you're serious about real customer acquisition.
