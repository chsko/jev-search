import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { TimeZonePicker } from "@/components/TimeZone";
import { Skeleton } from "@/components/ui/skeleton";
import { getBillingDetails } from "@/lib/billing";
import { getTimeZone } from "@/lib/quota";
import { Profile } from "../Profile";
import { SettingsSkeleton } from "../SettingsSkeleton";
import { SubscriptionSettings } from "../Subscription";

export const metadata: Metadata = { title: "Settings – Quairy" };

/** A heading like the ones on Clerk's own pages. */
function PageTitle({ children }: { children: React.ReactNode }) {
  return <h1 className="mb-6 border-b pb-4 text-base font-semibold">{children}</h1>;
}

async function SubscriptionTab({ userId, timeZone }: { userId: string; timeZone: string }) {
  const billing = await getBillingDetails(userId);
  const format = new Intl.DateTimeFormat("en", { dateStyle: "long", timeZone });
  return <SubscriptionSettings billing={billing} date={(seconds) => format.format(seconds * 1000)} />;
}

function SubscriptionSkeleton() {
  return (
    <div role="status" aria-label="Loading your subscription…" className="flex flex-col gap-3">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-4 w-64" />
      <Skeleton className="mt-2 h-8 w-56 rounded-full" />
    </div>
  );
}

/**
 * One dashboard for the account (Clerk's profile and security pages), the
 * subscription and preferences, at /settings and its subpages.
 */
export default async function SettingsPage() {
  const { userId } = await auth();
  if (!userId) redirect(`/sign-in?${new URLSearchParams({ redirect_url: "/settings" })}`);
  const timeZone = await getTimeZone(userId);

  return (
    <div className="auth-slot grid w-full">
      <SettingsSkeleton className="auth-skeleton col-start-1 row-start-1" />
      <div className="col-start-1 row-start-1 min-w-0">
        <Profile
          subscription={
            <>
              <PageTitle>Subscription</PageTitle>
              <Suspense fallback={<SubscriptionSkeleton />}>
                <SubscriptionTab userId={userId} timeZone={timeZone ?? "UTC"} />
              </Suspense>
            </>
          }
          preferences={
            <>
              <PageTitle>Preferences</PageTitle>
              <TimeZonePicker saved={timeZone} />
            </>
          }
        />
      </div>
    </div>
  );
}
