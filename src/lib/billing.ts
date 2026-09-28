import "server-only";
import Stripe from "stripe";
import { PRO_MONTHLY_EUR } from "./pricing";
import { getRedis } from "./redis";

// Quairy Pro is a Stripe subscription. Redis keeps the mapping between Clerk
// users and Stripe customers, and a copy of each user's subscription, which
// `syncSubscription` refreshes from Stripe (from webhooks and after checkout)
// so checking someone's plan never waits on Stripe.

let stripe: Stripe | undefined;

export function getStripe(): Stripe {
  stripe ??= new Stripe(process.env.STRIPE_SECRET_KEY!);
  return stripe;
}

const PRICE_LOOKUP_KEY = "quairy_pro_monthly_eur";

const customerKey = (userId: string) => `stripe:customer:${userId}`;
const userKey = (customerId: string) => `stripe:user:${customerId}`;
const subscriptionKey = (userId: string) => `subscription:${userId}`;

export type Subscription = {
  status: Stripe.Subscription.Status;
  /** Seconds since the epoch. */
  currentPeriodEnd: number | null;
  cancelAtPeriodEnd: boolean;
};

/** Statuses that keep Pro on. `past_due` gives a grace period while Stripe retries the card. */
const ACTIVE: Stripe.Subscription.Status[] = ["active", "trialing", "past_due"];

export async function getSubscription(userId: string): Promise<Subscription | null> {
  return getRedis().get<Subscription>(subscriptionKey(userId));
}

export function isPro(subscription: Subscription | null) {
  return !!subscription && ACTIVE.includes(subscription.status);
}

/** The monthly Pro price, created in Stripe the first time it's needed. */
async function getProPrice(): Promise<string> {
  const stripe = getStripe();
  const { data } = await stripe.prices.list({ lookup_keys: [PRICE_LOOKUP_KEY], active: true });
  if (data[0]) return data[0].id;
  const price = await stripe.prices.create({
    currency: "eur",
    unit_amount: PRO_MONTHLY_EUR * 100,
    recurring: { interval: "month" },
    lookup_key: PRICE_LOOKUP_KEY,
    product_data: { name: "Quairy Pro" },
  });
  return price.id;
}

export async function getCustomerId(userId: string) {
  return getRedis().get<string>(customerKey(userId));
}

async function getOrCreateCustomer(userId: string, email?: string) {
  const existing = await getCustomerId(userId);
  if (existing) return existing;
  const customer = await getStripe().customers.create(
    { email, metadata: { userId } },
    // Two quick clicks must not create two customers.
    { idempotencyKey: `customer-${userId}` },
  );
  const redis = getRedis();
  await Promise.all([
    redis.set(customerKey(userId), customer.id),
    redis.set(userKey(customer.id), userId),
  ]);
  return customer.id;
}

/** A Stripe Checkout page for Quairy Pro. */
export async function createCheckout({
  userId,
  email,
  origin,
}: {
  userId: string;
  email?: string;
  origin: string;
}) {
  const [customer, price] = await Promise.all([getOrCreateCustomer(userId, email), getProPrice()]);
  const session = await getStripe().checkout.sessions.create({
    mode: "subscription",
    customer,
    client_reference_id: userId,
    line_items: [{ price, quantity: 1 }],
    subscription_data: { metadata: { userId } },
    allow_promotion_codes: true,
    success_url: `${origin}/pro/welcome?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/pro`,
  });
  return session.url!;
}

/** Stripe's customer portal, where subscribers change their card or cancel. */
export async function createPortal({ userId, origin }: { userId: string; origin: string }) {
  const customer = await getCustomerId(userId);
  if (!customer) return null;
  const session = await getStripe().billingPortal.sessions.create({
    customer,
    return_url: `${origin}/pro`,
  });
  return session.url;
}

/**
 * Copies a customer's current subscription from Stripe into Redis. Safe to
 * call any number of times, from any event: it always reads the latest state.
 */
export async function syncSubscription(customerId: string) {
  const userId = await getRedis().get<string>(userKey(customerId));
  if (!userId) {
    console.warn("Stripe customer without a Quairy user", customerId);
    return null;
  }
  const { data } = await getStripe().subscriptions.list({
    customer: customerId,
    status: "all",
    limit: 1,
  });
  const latest = data[0];
  const subscription: Subscription | null = latest
    ? {
        status: latest.status,
        currentPeriodEnd: latest.items.data[0]?.current_period_end ?? null,
        cancelAtPeriodEnd: latest.cancel_at_period_end,
      }
    : null;
  if (subscription) await getRedis().set(subscriptionKey(userId), subscription);
  else await getRedis().del(subscriptionKey(userId));
  return { userId, subscription };
}
