import type Stripe from "stripe";
import { getStripe, syncSubscription } from "@/lib/billing";

// Stripe events that can change a subscription. Each one re-reads the
// customer's latest subscription, so order and retries don't matter.
const RELEVANT = new Set<Stripe.Event.Type>([
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "checkout.session.async_payment_failed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "customer.subscription.paused",
  "customer.subscription.resumed",
  "invoice.paid",
  "invoice.payment_failed",
  "invoice.payment_action_required",
]);

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !secret) return new Response("Missing signature", { status: 400 });

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(await request.text(), signature, secret);
  } catch (error) {
    console.error("Stripe webhook signature check failed", error);
    return new Response("Bad signature", { status: 400 });
  }

  if (RELEVANT.has(event.type)) {
    const { customer } = event.data.object as { customer?: string | { id: string } | null };
    const customerId = typeof customer === "string" ? customer : customer?.id;
    if (customerId) await syncSubscription(customerId);
  }
  return Response.json({ received: true });
}
