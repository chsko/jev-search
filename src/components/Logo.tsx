import { ViewTransition } from "react";
import Link from "next/link";
import { NAV_BACK } from "@/components/Transitions";
import { cn } from "@/lib/utils";
import { WORDMARK } from "@/lib/wordmark";

/**
 * The Quairy wordmark: Bricolage Grotesque ExtraBold outlines, with the "ai"
 * in the accent colour so the pun reads: a query, with AI inside, that hunts
 * its quarry.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="Quairy home"
      transitionTypes={[NAV_BACK]}
      className={cn("inline-flex", className)}
    >
      {/* Morphs between the large home logo and the small header logo. */}
      <ViewTransition name="logo" share="morph" default="none">
        <svg viewBox={WORDMARK.viewBox} aria-hidden className="h-full w-auto">
          <path className="fill-foreground" d={WORDMARK.text} />
          <path className="fill-primary" d={WORDMARK.ai} />
        </svg>
      </ViewTransition>
    </Link>
  );
}
