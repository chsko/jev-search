import Link from "next/link";
import { HourglassIcon, SparklesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { PRO_PRICE_LABEL } from "@/lib/pricing";

function UpgradeButton() {
  return (
    <Button asChild className="rounded-full">
      <Link href="/pro">
        <SparklesIcon data-icon="inline-start" />
        Get unlimited searches for {PRO_PRICE_LABEL}
      </Link>
    </Button>
  );
}

/** Shown instead of an answer once a free visitor has used today's searches. */
export function SearchLimit({ limit }: { limit: number }) {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <HourglassIcon />
        </EmptyMedia>
        <EmptyTitle>You’ve used today’s {limit} free searches</EmptyTitle>
        <EmptyDescription>
          New free searches arrive at midnight UTC. Questions you already asked today still work.
          Quairy Pro has no daily limit and keeps your search history.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <UpgradeButton />
      </EmptyContent>
    </Empty>
  );
}

/** Shown when one address sends too many requests in a short time. */
export function SlowDown() {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <HourglassIcon />
        </EmptyMedia>
        <EmptyTitle>That’s a lot of questions at once</EmptyTitle>
        <EmptyDescription>Wait a minute, then try again.</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

/** A quiet note under an answer when a free visitor is running low. */
export function FreeSearchesLeft({ remaining }: { remaining: number }) {
  return (
    <p className="mt-4 text-center text-sm text-muted-foreground">
      {remaining === 0
        ? "That was your last free search today."
        : `${remaining} free ${remaining === 1 ? "search" : "searches"} left today.`}{" "}
      <Link href="/pro" className="font-medium text-foreground underline-offset-4 hover:underline">
        Go unlimited with Pro
      </Link>
    </p>
  );
}
