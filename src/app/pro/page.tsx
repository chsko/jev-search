import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { RefreshUser } from "@/components/RefreshUser";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getSubscription, isPro, type Subscription } from "@/lib/billing";
import { subscribe } from "./actions";
import { Plans, SUBSCRIBE_FORM } from "./Plans";

export const metadata: Metadata = { title: "Quairy Pro" };

const date = new Intl.DateTimeFormat("en", { dateStyle: "long" });

function Renewal({ subscription }: { subscription: Subscription }) {
  if (subscription.status === "past_due") {
    return <>Your last payment didn’t go through. Update your card to keep Pro.</>;
  }
  const at = subscription.cancelAtPeriodEnd
    ? (subscription.cancelAt ?? subscription.currentPeriodEnd)
    : subscription.currentPeriodEnd;
  if (!at) return null;
  const when = date.format(new Date(at * 1000));
  return subscription.cancelAtPeriodEnd ? <>Pro ends on {when}.</> : <>Renews on {when}.</>;
}

export default async function ProPage() {
  const { userId } = await auth();
  const subscription = userId ? await getSubscription(userId) : null;
  const pro = isPro(subscription);

  return (
    <Plans
      badge={pro && <Badge>Your plan</Badge>}
      period={pro ? (subscription!.interval ?? "month") : undefined}
      footer={
        pro ? (
          <>
            {/* Picks up a subscription status just copied to Clerk, for the account menu. */}
            <RefreshUser />
            <Button asChild variant="outline" className="w-full rounded-full">
              <Link href="/settings/subscription">Manage subscription</Link>
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              <Renewal subscription={subscription!} />
            </p>
          </>
        ) : (
          <>
            {userId ? (
              <form id={SUBSCRIBE_FORM} action={subscribe}>
                <Button type="submit" className="w-full rounded-full">
                  Subscribe
                </Button>
              </form>
            ) : (
              // A plain link, so the (prefetched) sign-up page opens at once; it
              // returns here afterwards to subscribe.
              <Button asChild className="w-full rounded-full">
                <Link href={`/sign-up?${new URLSearchParams({ redirect_url: "/pro" })}`}>
                  Sign up to subscribe
                </Link>
              </Button>
            )}
            <p className="text-center text-xs text-muted-foreground">Paid securely with Stripe.</p>
          </>
        )
      }
    />
  );
}
