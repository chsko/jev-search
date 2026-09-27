import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * The Jev wordmark: Bricolage Grotesque ExtraBold outlines, with the dot of
 * the "j" replaced by a gauge whose needle reads off a judgment.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" aria-label="Jev home" className={cn("inline-flex", className)}>
      <svg viewBox="-20 -790 1466 1010" aria-hidden className="h-full w-auto">
        <path className="fill-foreground" d="M21 208L6 208L-7 71Q32 66 48 51Q64 36 64-3L64-528L226-528L226 6Q226 60 212.5 98.5Q199 137 173 161Q147 185 108.5 196.5Q70 208 21 208M595 14Q529 14 477 -3.5Q425 -21 388.5 -55Q352 -89 333 -139Q314 -189 314 -254Q314 -317 332.5 -370Q351 -423 385.5 -461.5Q420 -500 470.5 -521Q521 -542 584 -542Q648 -542 696.5 -521.5Q745 -501 776.5 -461Q808 -421 823 -363.5Q838 -306 833 -232L469 -229Q474 -168 504 -138Q539 -101 594 -101Q621 -101 639 -108.5Q657 -116 668.5 -127.5Q680 -139 686.5 -153Q693 -167 697 -180L837 -150Q829 -113 811.5 -83Q794 -53 764.5 -31Q735 -9 693.5 2.5Q652 14 595 14M473 -313L686 -315Q686 -340 678 -359Q665 -390 640 -404.5Q615 -419 586 -419Q551 -419 524.5 -400Q498 -381 483 -345Q477 -331 473 -313M1254 0L1032 0L859 -527L1038 -527L1138 -126L1155 -126L1257 -527L1428 -527" />
        <g className="fill-primary stroke-primary">
          <path d="M33 -640A112 112 0 0 1 257 -640" fill="none" strokeWidth="40" strokeLinecap="round" opacity=".4" /><path d="M145 -640L202.9 -714.1" strokeWidth="48" strokeLinecap="round" /><circle cx="145" cy="-640" r="42" stroke="none" />
        </g>
      </svg>
    </Link>
  );
}
