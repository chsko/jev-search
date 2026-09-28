"use client";

import Link from "next/link";
import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import { HistoryIcon, SparklesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Sign-in, or the account menu with history, plus a link to Quairy Pro. */
export function Account() {
  return (
    <div className="flex items-center gap-1">
      <Button asChild variant="ghost" size="sm">
        <Link href="/pro">
          <SparklesIcon data-icon="inline-start" />
          Pro
        </Link>
      </Button>
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
        <UserButton />
      </Show>
    </div>
  );
}
