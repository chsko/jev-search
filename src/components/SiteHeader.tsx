import { Account } from "@/components/Account";
import { Logo } from "@/components/Logo";

/**
 * The header on pages without a search box. No divider, like the home page;
 * only the search results header has one, to set answers apart from the box.
 * From sm up the row is as tall as the search header's (80px, the search box
 * plus padding), so the logo and account buttons sit at the same height.
 */
export function SiteHeader() {
  return (
    // Pinned during transitions, so only the content below it moves.
    <header style={{ viewTransitionName: "site-header" }}>
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 py-4 sm:min-h-20">
        <Logo className="h-7" />
        <Account />
      </div>
    </header>
  );
}
