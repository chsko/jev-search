"use client";

import { useSyncExternalStore, ViewTransition } from "react";
import Link from "next/link";
import { ClerkLoading, Show, SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { CreditCardIcon, HistoryIcon, SparklesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { SubscriptionMetadata } from "@/lib/billing";
import { cn } from "@/lib/utils";

/**
 * Sign-in, or the account menu with history, plus a link to Quairy Pro.
 * Render one per page: it morphs between pages like the logo (name `account`).
 */
export function Account({ className }: { className?: string }) {
  return (
    <ViewTransition name="account" share="morph" default="none">
      <div className={cn("flex items-center gap-1", className)}>
        <Button asChild variant="ghost" size="sm">
          <Link href="/pro">
            <SparklesIcon data-icon="inline-start" />
            Pro
          </Link>
        </Button>
        <ClerkLoading>
          <AccountSkeleton />
        </ClerkLoading>
        <Show when="signed-out">
          <SignInButton mode="modal">
            <Button variant="outline" size="sm" className="rounded-full">
              Sign in
            </Button>
          </SignInButton>
        </Show>
        <Show when="signed-in">
          <Button asChild variant="ghost" size="sm">
            <Link href="/history">
              <HistoryIcon data-icon="inline-start" />
              History
            </Link>
          </Button>
          <AccountMenu />
        </Show>
      </div>
    </ViewTransition>
  );
}

function AccountMenu() {
  const { user } = useUser();
  const subscribed = !!(user?.publicMetadata as Partial<SubscriptionMetadata> | undefined)
    ?.subscription;
  return (
    // The button's own code and the avatar image load after Clerk does; the
    // placeholder underneath holds the spot until the avatar covers it.
    <div className="relative grid size-7 place-items-center">
      <Skeleton className="absolute inset-0 rounded-full" />
      {/* "Manage account" opens Quairy's settings dashboard, not Clerk's modal. */}
      <UserButton userProfileMode="navigation" userProfileUrl="/settings">
        {subscribed && (
          <UserButton.MenuItems>
            <UserButton.Link
              label="Manage subscription"
              labelIcon={<CreditCardIcon className="size-4" />}
              href="/settings/subscription"
            />
          </UserButton.MenuItems>
        )}
      </UserButton>
    </div>
  );
}

// Clerk's `__client_uat` cookie is non-zero while signed in. It's readable
// before Clerk loads, so the placeholder can take the shape of what's coming.
const subscribeNever = () => () => {};
const readSignedIn = () => /(?:^|;\s*)__client_uat=[1-9]/.test(document.cookie);
const unknownOnServer = () => null;

/** Holds the place of the sign-in button or the history link and avatar while Clerk loads. */
function AccountSkeleton() {
  const signedIn = useSyncExternalStore(subscribeNever, readSignedIn, unknownOnServer);
  return (
    <div role="status" aria-label="Loading your account…" className="flex items-center gap-1">
      {signedIn ? (
        <>
          <Skeleton className="mx-2 h-4 w-16" />
          <Skeleton className="size-7 rounded-full" />
        </>
      ) : (
        <Skeleton className="h-8 w-[4.5rem] rounded-full" />
      )}
    </div>
  );
}
