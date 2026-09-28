import { ViewTransition } from "react";

/**
 * Transition types for navigations between the home page and results.
 * Browser back/forward carries no type, so only the untyped morphs of the
 * logo and search box play there.
 */
export const NAV_FORWARD = "nav-forward";
export const NAV_BACK = "nav-back";

/**
 * Wraps a page's content so it rises in and sinks out on typed navigations,
 * following the search box as it moves between the centre and the header.
 * Place it at the top of each page component (not a layout), before any DOM.
 */
export function PageTransition({
  children,
  exitOnReveal,
}: {
  children: React.ReactNode;
  /** Exit class for a loading fallback when its content resolves (an untyped transition). */
  exitOnReveal?: string;
}) {
  return (
    <ViewTransition
      enter={{ [NAV_FORWARD]: "page-in", [NAV_BACK]: "page-in", default: "none" }}
      exit={{
        [NAV_FORWARD]: "page-out",
        [NAV_BACK]: "page-out",
        default: exitOnReveal ?? "none",
      }}
      default="none"
    >
      {children}
    </ViewTransition>
  );
}
