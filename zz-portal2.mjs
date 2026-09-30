import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
if (process.argv[2]) {
  const s = await stripe.subscriptions.retrieve(process.argv[2]);
  console.log("Stripe now says: status", s.status, "| cancels at period end:", s.cancel_at_period_end, "| access until", new Date(s.items.data[0].current_period_end * 1000).toISOString().slice(0, 10));
} else {
  const { data } = await stripe.subscriptions.list({ status: "active", limit: 1 });
  const s = await stripe.billingPortal.sessions.create({ customer: data[0].customer, return_url: "http://localhost:3000/pro" });
  process.stdout.write(JSON.stringify({ url: s.url, sub: data[0].id }));
}
