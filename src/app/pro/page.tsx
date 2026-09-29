import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { CheckIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSubscription, isPro, type Subscription } from "@/lib/billing";
import { FREE_DAILY_SEARCHES, PRO_MONTHLY_EUR } from "@/lib/pricing";
import { manageSubscription, subscribe } from "./actions";

export const metadata: Metadata = { title: "Quairy Pro" };

const date = new Intl.DateTimeFormat("en", { dateStyle: "long" });

function Perks({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-2 text-sm">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <CheckIcon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          {item}
        </li>
      ))}
    </ul>
  );
}

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
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-3xl font-bold tracking-tight">Quairy Pro</h1>
        <p className="text-muted-foreground">
          Ask as much as you like, and pick up where you left off.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-lg">Free</CardTitle>
            <CardDescription>
              <span className="font-display text-3xl font-bold text-foreground">€0</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Perks
              items={[
                `${FREE_DAILY_SEARCHES} searches a day`,
                "Ask about a text you paste",
                "Compare on what matters to you",
                "No account needed",
              ]}
            />
          </CardContent>
        </Card>

        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading text-lg">
              Pro {pro && <Badge>Your plan</Badge>}
            </CardTitle>
            <CardDescription>
              <span className="font-display text-3xl font-bold text-foreground">
                €{PRO_MONTHLY_EUR}
              </span>{" "}
              a month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Perks
              items={[
                "Unlimited searches",
                "Search history",
                "Everything in Free",
                "Cancel any time",
              ]}
            />
          </CardContent>
          <CardFooter className="flex-col items-stretch gap-2">
            {pro ? (
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
                <p className="text-center text-xs text-muted-foreground">
                  Paid securely with Stripe.
                </p>
              </>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
