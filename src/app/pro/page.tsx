import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getSubscription, isPro, type Subscription } from "@/lib/billing";
import { manageSubscription, subscribe } from "./actions";
import { Plans } from "./Plans";

export const metadata: Metadata = { title: "Quairy Pro" };

const date = new Intl.DateTimeFormat("en", { dateStyle: "long" });

function Renewal({ subscription }: { subscription: Subscription }) {
  const end = subscription.currentPeriodEnd
    ? date.format(new Date(subscription.currentPeriodEnd * 1000))
    : null;
  if (subscription.status === "past_due") {
    return <>Your last payment didn’t go through. Update your card to keep Pro.</>;
  }
  if (!end) return null;
  return subscription.cancelAtPeriodEnd ? <>Pro ends on {end}.</> : <>Renews on {end}.</>;
}

export default async function ProPage() {
  const { userId } = await auth();
  const subscription = userId ? await getSubscription(userId) : null;
  const pro = isPro(subscription);

  return (
    <Plans
      badge={pro && <Badge>Your plan</Badge>}
      footer={
        pro ? (
          <>
            <form action={manageSubscription}>
              <Button type="submit" variant="outline" className="w-full rounded-full">
                Manage subscription
              </Button>
            </form>
            <p className="text-center text-xs text-muted-foreground">
              <Renewal subscription={subscription!} />
            </p>
          </>
        ) : (
          <>
            <form action={subscribe}>
              <Button type="submit" className="w-full rounded-full">
                {userId ? "Subscribe" : "Sign up to subscribe"}
              </Button>
            </form>
            <p className="text-center text-xs text-muted-foreground">Paid securely with Stripe.</p>
          </>
        )
      }
    />
  );
}
