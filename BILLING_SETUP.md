# Stripe Billing Setup

The single source of truth for wiring Stripe into POA-IT. Walks through the
env-var configuration, Stripe Dashboard setup, and local-vs-production
webhook flow. Read this whenever you set up a new environment or onboard a
collaborator.

Sprint 6 introduced this. R1 is the foundation (client + webhook signature
verification + idempotency ledger); R2 adds consumer one-time Checkout; R3
adds B2B subscription Checkout and the Customer Portal.

## Environment variables

All Stripe configuration is read from environment variables — no Price IDs
or secrets are ever committed. Each variable must exist in **two places**:

- `.env.local` — for local `npm run dev` and `npm run build`
- **Vercel → Settings → Environment Variables** — for the deployed app

⚠️ Per OPERATIONAL_LEARNINGS L006, `vercel env pull .env.local` overwrites
the file. After Stripe vars are added to Vercel and you've pulled at least
once, that file stays in sync with what's in Vercel.

### Required everywhere

| Variable | What it is | Where to find it |
| --- | --- | --- |
| `STRIPE_SECRET_KEY` | The server-side API key | Stripe Dashboard → Developers → API keys → "Secret key" |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | The client-side key | Same screen — "Publishable key" |
| `STRIPE_WEBHOOK_SECRET` | Verifies webhook payload authenticity | Different value for local vs production (see Webhooks section) |

Use **test-mode** keys (`sk_test_…`, `pk_test_…`) throughout development. The
toggle is top-right in the Stripe Dashboard.

### Required when each round ships

These are Price IDs (e.g. `price_1Q…`) from Products you create in the
Stripe Dashboard. Each accessor in `lib/server/pricing.js` reads one of
these and throws a clear error if missing.

| Variable | For | Sprint | Optional |
| --- | --- | --- | --- |
| `STRIPE_PRICE_CONSUMER_POA` | Consumer one-time POA purchase | R2 | No |
| `STRIPE_PRICE_TIER_SOLO` | Solo tier — monthly recurring | R3 | No |
| `STRIPE_PRICE_TIER_SOLO_ANNUAL` | Solo tier — annual recurring | R3 | Yes |
| `STRIPE_PRICE_TIER_FAMILY_OFFICE` | Family Office tier — monthly | R3 | No |
| `STRIPE_PRICE_TIER_FAMILY_OFFICE_ANNUAL` | Family Office tier — annual | R3 | Yes |

The **Firm** tier is intentionally absent. It's sales-led: prospects fill
out the leads form, the team contacts them, and conversion is handled
out-of-band. No Price ID exists for it.

## Stripe Dashboard — one-time setup

1. **API keys** (Dashboard → Developers → API keys, test-mode toggle on)
   Copy the publishable key (`pk_test_…`) and secret key (`sk_test_…`). Put
   them in both `.env.local` and Vercel.

2. **Create Products and Prices** (Dashboard → Product catalog → Add product)
   You'll create one Product per offering, and each Product can have one or
   more Prices attached. After saving, each Price has an ID (`price_…`) you
   put in the matching env var above.

   When each round ships, you'll be asked for the actual numbers. R1 needs
   no Products yet — the foundation runs without any prices configured.

3. **Webhook endpoint** (Dashboard → Developers → Webhooks → Add endpoint)
   Production URL: `https://poa-it.com/api/stripe/webhook`
   Subscribe to (at minimum): `checkout.session.completed`,
   `customer.subscription.created`, `customer.subscription.updated`,
   `customer.subscription.deleted`, `invoice.payment_failed`.
   After saving, copy the **Signing secret** (`whsec_…`) — that's your
   *production* `STRIPE_WEBHOOK_SECRET`. Put it in Vercel.

## Local development with webhooks

Stripe can't reach `localhost` directly, so the Stripe CLI forwards events:

```
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

When you run that, the CLI prints a different `whsec_…` value — that's the
**local** webhook secret. Put **that one** in `.env.local` (not the prod
one). Leave the `stripe listen` process running while developing.

To trigger a test event without doing real Checkouts:

```
stripe trigger checkout.session.completed
```

You should see the event hit your local dev server and a row appear in
`stripe_webhook_events`.

## Production deployment checklist

- [ ] `STRIPE_SECRET_KEY` (production: `sk_live_…`) set in Vercel
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (production: `pk_live_…`) set
- [ ] `STRIPE_WEBHOOK_SECRET` set to the **dashboard webhook's** signing secret (not the CLI's)
- [ ] All Price IDs for the rounds you've shipped are set
- [ ] Webhook endpoint added in Dashboard for `https://poa-it.com/api/stripe/webhook`
- [ ] Subscribed to the event types listed above
- [ ] `npm run db:push` has applied the Sprint 6 schema (documents columns + stripe_webhook_events)

## Verification

After R1 deploys, the foundation is verifiable without any Products
existing:

```
# In the Stripe Dashboard, click your webhook endpoint → "Send test webhook"
# Choose any event type (e.g. checkout.session.completed)
# It should arrive at /api/stripe/webhook, signature-verify successfully,
# and create a row in stripe_webhook_events with processedAt set.
```

If the test webhook fails with "signature verification failed", the
`STRIPE_WEBHOOK_SECRET` in your env doesn't match the signing secret of
that specific webhook endpoint. Re-copy it from the Dashboard.

## Security notes

- The webhook endpoint is the **only** trusted source for granting paid
  access. The post-Checkout browser redirect tells the user "thanks," but
  never grants access — that's the webhook's job. This is non-negotiable.
- Signature verification uses the **raw** request body, not parsed JSON.
  See the comment block at the top of `app/api/stripe/webhook/route.js`.
- Webhook delivery is at-least-once. The `stripe_webhook_events` table
  serves as the idempotency ledger by Stripe event ID.
