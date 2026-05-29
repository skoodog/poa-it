/**
 * POST /api/stripe/webhook
 *
 * Stripe's webhook endpoint. Fulfillment of any payment-related state change
 * (payment succeeded, subscription updated, etc.) MUST happen here — never
 * on the post-checkout browser redirect, which can be lost or spoofed.
 *
 * Round 1 scope: verify the signature, record the event for idempotency,
 * return 200. Round 2 adds the consumer-POA fulfillment handler
 * (checkout.session.completed → mark document purchased). Round 3 adds the
 * subscription handlers (customer.subscription.* → update firm).
 *
 * Two non-negotiables baked in here:
 *
 * 1. SIGNATURE VERIFICATION uses the RAW request body. In Next.js App Router,
 *    that means reading request.text() BEFORE any JSON parsing happens. If
 *    we ever switched to request.json() first, every webhook would 400.
 *    This is the single most common Stripe webhook bug, so it's stated
 *    explicitly here.
 *
 * 2. IDEMPOTENCY by Stripe event id. Stripe will redeliver the same event
 *    after timeouts, retries, or a manual "Resend" in the dashboard. We
 *    insert into stripeWebhookEvents with the event's `id` as PK; a duplicate
 *    insert is caught and treated as "already handled" — return 200 without
 *    re-running any handler.
 *
 * Sprint 6 Round 1.
 */

import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "../../../../lib/db";
import { stripeWebhookEvents } from "../../../../lib/db/schema";
import { verifyWebhookSignature } from "../../../../lib/server/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  // 1) RAW body for signature verification — must come BEFORE any parsing.
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { error: "missing_signature" },
      { status: 400 }
    );
  }

  // 2) Verify the signature. If this throws, the request didn't actually
  // come from Stripe (or the secret is wrong) — reject with 400 so Stripe
  // marks it as a failure in their dashboard.
  let event;
  try {
    event = verifyWebhookSignature(rawBody, signature);
  } catch (err) {
    console.error("[stripe/webhook] signature verification failed:", err?.message);
    return NextResponse.json(
      { error: "invalid_signature", message: err?.message },
      { status: 400 }
    );
  }

  // 3) Idempotency check + record. We try to insert; if the event id already
  // exists, the unique-PK violation tells us we've already handled it.
  try {
    const [existing] = await db
      .select({ id: stripeWebhookEvents.id, processedAt: stripeWebhookEvents.processedAt })
      .from(stripeWebhookEvents)
      .where(eq(stripeWebhookEvents.id, event.id))
      .limit(1);

    if (existing) {
      // Already received. If processed, ack; if not, fall through and try
      // again (R2/R3 handlers should also be idempotent themselves).
      if (existing.processedAt) {
        return NextResponse.json({ received: true, duplicate: true });
      }
    } else {
      await db.insert(stripeWebhookEvents).values({
        id: event.id,
        type: event.type,
        livemode: event.livemode,
        apiVersion: event.api_version || null,
        payload: event,
      });
    }
  } catch (err) {
    console.error("[stripe/webhook] failed to record event:", err);
    // If we can't even record the event, return 500 so Stripe retries.
    return NextResponse.json(
      { error: "record_failed", message: err?.message },
      { status: 500 }
    );
  }

  // 4) Handler dispatch — Round 1 has no real handlers yet. We log the type
  // (so we can see in Vercel runtime logs what's arriving in test mode) and
  // mark the event processed. Rounds 2 and 3 plug their handlers in here.
  console.log(`[stripe/webhook] received: ${event.type} (${event.id})`);

  try {
    // switch (event.type) {
    //   case "checkout.session.completed": ... (R2)
    //   case "customer.subscription.created":
    //   case "customer.subscription.updated":
    //   case "customer.subscription.deleted": ... (R3)
    //   case "invoice.payment_failed":         ... (R3)
    //   default: // unhandled types are fine — Stripe sends many we ignore
    // }

    await db
      .update(stripeWebhookEvents)
      .set({ processedAt: new Date() })
      .where(eq(stripeWebhookEvents.id, event.id));

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error(`[stripe/webhook] handler error for ${event.type}:`, err);
    await db
      .update(stripeWebhookEvents)
      .set({ processingError: String(err?.message || err) })
      .where(eq(stripeWebhookEvents.id, event.id))
      .catch(() => {});
    // Return 500 so Stripe retries (their default schedule is exponential
    // backoff up to 3 days).
    return NextResponse.json(
      { error: "handler_failed", message: err?.message },
      { status: 500 }
    );
  }
}
