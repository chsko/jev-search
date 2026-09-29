import { Account } from "@/components/Account";
import { Logo } from "@/components/Logo";

/**
 * The header on pages without a search box. No divider, like the home page;
 * only the search results header has one, to set answers apart from the box.
 */
export function SiteHeader() {
  return (
    // Pinned during transitions, so only the content below it moves.
    <header style={{ viewTransitionName: "site-header" }}>
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 py-4">
        <Logo className="h-7" />
        <Account />
      </div>
    </header>
  );
}
