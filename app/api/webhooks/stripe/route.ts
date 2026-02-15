import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import type Stripe from "stripe";

export const dynamic = "force-dynamic";

function getPeriodEnd(subscription: Stripe.Subscription): Date {
  // In Stripe v20+, period info is on subscription items
  const firstItem = subscription.items.data[0];
  return new Date(firstItem.current_period_end * 1000);
}

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string | null;

        if (!customerId) break;

        if (subscriptionId) {
          // Subscription plan (quarterly/yearly)
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const periodEnd = getPeriodEnd(subscription);

          await db
            .update(users)
            .set({
              stripeSubscriptionId: subscriptionId,
              subscriptionStatus: "active",
              subscriptionPeriodEnd: periodEnd,
              updatedAt: new Date(),
            })
            .where(eq(users.stripeCustomerId, customerId));
        } else {
          // One-time payment (lifetime) — no subscription, no period end
          await db
            .update(users)
            .set({
              subscriptionStatus: "active",
              subscriptionPeriodEnd: null,
              updatedAt: new Date(),
            })
            .where(eq(users.stripeCustomerId, customerId));
        }

        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const subscriptionId = subscription.id;

        // Map Stripe status to our status
        const statusMap: Record<string, string> = {
          active: "active",
          trialing: "trialing",
          past_due: "past_due",
          canceled: "canceled",
          unpaid: "past_due",
          incomplete: "past_due",
          incomplete_expired: "expired",
        };

        const ourStatus = statusMap[subscription.status] || "expired";
        const periodEnd = getPeriodEnd(subscription);

        await db
          .update(users)
          .set({
            subscriptionStatus: ourStatus,
            subscriptionPeriodEnd: periodEnd,
            updatedAt: new Date(),
          })
          .where(eq(users.stripeSubscriptionId, subscriptionId));

        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const subscriptionId = subscription.id;

        await db
          .update(users)
          .set({
            subscriptionStatus: "expired",
            stripeSubscriptionId: null,
            updatedAt: new Date(),
          })
          .where(eq(users.stripeSubscriptionId, subscriptionId));

        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        if (customerId) {
          await db
            .update(users)
            .set({
              subscriptionStatus: "past_due",
              updatedAt: new Date(),
            })
            .where(eq(users.stripeCustomerId, customerId));
        }

        break;
      }
    }
  } catch (err) {
    console.error("Error processing webhook event:", err);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
