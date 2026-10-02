import "server-only";
import Stripe from "stripe";
import { type BillingInterval, PRO_MONTHLY_EUR, PRO_YEARLY_EUR } from "./pricing";
import { getRedis } from "./redis";
import { trackEvent } from "./stats";

// Quairy Pro is a Stripe subscription. Redis keeps the mapping between Clerk
// users and Stripe customers, and a copy of each user's subscription, which
// `syncSubscription` refreshes from Stripe (from webhooks and after checkout)
// so checking someone's plan never waits on Stripe.

let stripe: Stripe | undefined;

export function getStripe(): Stripe {
  stripe ??= new Stripe(process.env.STRIPE_SECRET_KEY!);
  return stripe;
}

const PRICES: Record<BillingInterval, { lookupKey: string; eur: number }> = {
  month: { lookupKey: "quairy_pro_monthly_eur", eur: PRO_MONTHLY_EUR },
  year: { lookupKey: "quairy_pro_yearly_eur", eur: PRO_YEARLY_EUR },
};

const customerKey = (userId: string) => `stripe:customer:${userId}`;
const userKey = (customerId: string) => `stripe:user:${customerId}`;
const subscriptionKey = (userId: string) => `subscription:${userId}`;

export type Subscription = {
  status: Stripe.Subscription.Status;
  /** Seconds since the epoch. */
  currentPeriodEnd: number | null;
  /** Set to end rather than renew, however Stripe recorded it. */
  cancelAtPeriodEnd: boolean;
  /** When a cancelled subscription ends, in seconds since the epoch. */
  cancelAt?: number | null;
  /** Billed monthly or yearly; missing on subscriptions synced before yearly plans. */
  interval?: BillingInterval;
};

/** Statuses that keep Pro on. `past_due` gives a grace period while Stripe retries the card. */
const ACTIVE: Stripe.Subscription.Status[] = ["active", "trialing", "past_due"];

export async function getSubscription(userId: string): Promise<Subscription | null> {
  return getRedis().get<Subscription>(subscriptionKey(userId));
}

export function isPro(subscription: Subscription | null) {
  return !!subscription && ACTIVE.includes(subscription.status);
}

/**
 * The Pro price for a billing interval, created in Stripe the first time it's
 * needed. Both prices belong to one "Quairy Pro" product.
 */
async function getProPrice(interval: BillingInterval): Promise<string> {
  const stripe = getStripe();
  const lookupKeys = Object.values(PRICES).map((p) => p.lookupKey);
  const { data } = await stripe.prices.list({ lookup_keys: lookupKeys, active: true });
  const existing = data.find((p) => p.lookup_key === PRICES[interval].lookupKey);
  if (existing) return existing.id;
  const sibling = data[0];
  const price = await stripe.prices.create({
    currency: "eur",
    unit_amount: PRICES[interval].eur * 100,
    recurring: { interval },
    lookup_key: PRICES[interval].lookupKey,
    ...(sibling
      ? { product: typeof sibling.product === "string" ? sibling.product : sibling.product.id }
      : { product_data: { name: "Quairy Pro" } }),
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
  interval,
}: {
  userId: string;
  email?: string;
  origin: string;
  interval: BillingInterval;
}) {
  const [customer, price] = await Promise.all([
    getOrCreateCustomer(userId, email),
    getProPrice(interval),
  ]);
  const params: Stripe.Checkout.SessionCreateParams = {
    mode: "subscription",
    customer,
    client_reference_id: userId,
    line_items: [{ price, quantity: 1 }],
    subscription_data: { metadata: { userId } },
    allow_promotion_codes: true,
    success_url: `${origin}/pro/welcome?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/pro`,
    // Consumers have 14 days to withdraw; asking for Pro to start now means a
    // withdrawal refunds only the unused days.
    custom_text: {
      submit: {
        message: `Pro starts right away and renews every ${interval} until you cancel. If you withdraw within 14 days, you're refunded for the days you didn't use.`,
      },
    },
  };
  const stripe = getStripe();
  try {
    const session = await stripe.checkout.sessions.create({
      ...params,
      consent_collection: { terms_of_service: "required" },
      custom_text: {
        ...params.custom_text,
        terms_of_service_acceptance: {
          message: `I agree to the [Terms of service](${origin}/terms) and have read the [Privacy policy](${origin}/privacy).`,
        },
      },
    });
    return session.url!;
  } catch (error) {
    // Stripe only collects consent once a terms URL is saved in the Dashboard
    // (Settings › Public details). Until then, check out without the checkbox.
    if (!(error instanceof Stripe.errors.StripeInvalidRequestError) || !/terms of service/i.test(error.message)) {
      throw error;
    }
    console.warn("Stripe has no terms of service URL; checking out without the consent checkbox");
    const session = await stripe.checkout.sessions.create(params);
    return session.url!;
  }
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
        // The customer portal records a cancellation as `cancel_at` (a date)
        // rather than `cancel_at_period_end`, so check both.
        cancelAtPeriodEnd: latest.cancel_at_period_end || latest.cancel_at !== null,
        cancelAt:
          latest.cancel_at ??
          (latest.cancel_at_period_end ? (latest.items.data[0]?.current_period_end ?? null) : null),
        interval: latest.items.data[0]?.price.recurring?.interval === "year" ? "year" : "month",
      }
    : null;
  const previous = await getSubscription(userId);
  if (subscription) await getRedis().set(subscriptionKey(userId), subscription);
  else await getRedis().del(subscriptionKey(userId));
  await trackChange(previous, subscription);
  return { userId, subscription };
}

/**
 * Sends Subscribe, Cancel, Resume and Ended events to Web Analytics when a
 * sync changes what matters. Syncs repeat (webhooks retry, the welcome page
 * syncs too), so events come from the change, not from the sync.
 */
async function trackChange(before: Subscription | null, after: Subscription | null) {
  const was = isPro(before);
  const is = isPro(after);
  const interval = after?.interval ?? before?.interval ?? "month";
  if (!was && is) await trackEvent("Subscribe", { interval });
  else if (was && !is) await trackEvent("Subscription ended", { interval });
  else if (was && is && !before!.cancelAtPeriodEnd && after!.cancelAtPeriodEnd) {
    await trackEvent("Cancel", { interval });
  } else if (was && is && before!.cancelAtPeriodEnd && !after!.cancelAtPeriodEnd) {
    await trackEvent("Resume", { interval });
  }
}

export type BillingDetails = {
  subscriptionId: string;
  subscription: Subscription;
  /** What each renewal costs, in cents. */
  amount: number;
  currency: string;
  card: { brand: string; last4: string; expMonth: number; expYear: number } | null;
  invoices: {
    id: string;
    number: string | null;
    created: number;
    amount: number;
    currency: string;
    status: Stripe.Invoice.Status | null;
    url: string | null;
  }[];
};

/**
 * Everything the subscription settings show, read live from Stripe: the
 * latest subscription, the card it charges and recent invoices.
 */
export async function getBillingDetails(userId: string): Promise<BillingDetails | null> {
  const customerId = await getCustomerId(userId);
  if (!customerId) return null;
  const stripe = getStripe();
  const [subscriptions, invoices, customer] = await Promise.all([
    stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 1,
      expand: ["data.default_payment_method"],
    }),
    stripe.invoices.list({ customer: customerId, limit: 12 }),
    stripe.customers.retrieve(customerId, { expand: ["invoice_settings.default_payment_method"] }),
  ]);
  const latest = subscriptions.data[0];
  const subscription = await getSubscription(userId);
  if (!latest || !subscription) return null;

  const fallback = customer.deleted ? null : customer.invoice_settings.default_payment_method;
  const method = [latest.default_payment_method, fallback].find(
    (m): m is Stripe.PaymentMethod => typeof m === "object" && m !== null && !!m.card,
  );
  const item = latest.items.data[0];
  return {
    subscriptionId: latest.id,
    subscription,
    amount: (item?.price.unit_amount ?? 0) * (item?.quantity ?? 1),
    currency: item?.price.currency ?? "eur",
    card: method?.card
      ? {
          brand: method.card.brand,
          last4: method.card.last4,
          expMonth: method.card.exp_month,
          expYear: method.card.exp_year,
        }
      : null,
    invoices: invoices.data
      .filter((invoice) => invoice.status !== "draft")
      .map((invoice) => ({
        id: invoice.id ?? "",
        number: invoice.number,
        created: invoice.created,
        amount: invoice.total,
        currency: invoice.currency,
        status: invoice.status,
        url: invoice.hosted_invoice_url ?? null,
      })),
  };
}

/** The user's latest subscription in Stripe, or null. Changes go through this. */
async function getStripeSubscription(userId: string) {
  const customerId = await getCustomerId(userId);
  if (!customerId) return null;
  const { data } = await getStripe().subscriptions.list({ customer: customerId, limit: 1 });
  return data[0] ? { customerId, subscription: data[0] } : null;
}

/**
 * Moves a subscription to monthly or yearly billing. The change is invoiced
 * at once, prorated: what's left of the current period is credited.
 */
export async function changeInterval(userId: string, interval: BillingInterval) {
  const found = await getStripeSubscription(userId);
  const item = found?.subscription.items.data[0];
  if (!found || !item) return;
  const price = await getProPrice(interval);
  if (item.price.id !== price) {
    await getStripe().subscriptions.update(found.subscription.id, {
      items: [{ id: item.id, price }],
      proration_behavior: "always_invoice",
    });
  }
  await syncSubscription(found.customerId);
}

/** Cancels at the end of the paid period, or (with `false`) takes that back. */
export async function setCancelAtPeriodEnd(userId: string, cancel: boolean) {
  const found = await getStripeSubscription(userId);
  if (!found) return;
  const { id, cancel_at_period_end: atPeriodEnd } = found.subscription;
  await getStripe().subscriptions.update(
    id,
    cancel
      ? { cancel_at_period_end: true }
      : // Stripe takes one or the other; the customer portal cancelled with `cancel_at`.
        atPeriodEnd
        ? { cancel_at_period_end: false }
        : { cancel_at: "" },
  );
  await syncSubscription(found.customerId);
}

/** Stripe's page for entering a new card, which returns to `returnUrl`. */
export async function createCardUpdate({ userId, returnUrl }: { userId: string; returnUrl: string }) {
  const found = await getStripeSubscription(userId);
  if (!found) return null;
  const session = await getStripe().billingPortal.sessions.create({
    customer: found.customerId,
    return_url: returnUrl,
    flow_data: {
      type: "payment_method_update",
      after_completion: { type: "redirect", redirect: { return_url: returnUrl } },
    },
  });
  return session.url;
}

/**
 * For a deleted account: stops any subscription from renewing and forgets
 * which Stripe customer the user was. Stripe keeps its own records, which
 * accounting law requires.
 */
export async function forgetCustomer(userId: string) {
  const found = await getStripeSubscription(userId);
  if (found && ["active", "trialing", "past_due"].includes(found.subscription.status)) {
    await getStripe().subscriptions.update(found.subscription.id, { cancel_at_period_end: true });
  }
  const customerId = found?.customerId ?? (await getCustomerId(userId));
  const redis = getRedis();
  await redis.del(customerKey(userId), subscriptionKey(userId), ...(customerId ? [userKey(customerId)] : []));
}
