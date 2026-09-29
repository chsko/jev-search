"use client";

import { ViewTransition } from "react";
import Link from "next/link";
import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import { HistoryIcon, SparklesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    </ViewTransition>
  );
}
