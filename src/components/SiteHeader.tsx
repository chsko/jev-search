import { Account } from "@/components/Account";
import { Logo } from "@/components/Logo";
import { Separator } from "@/components/ui/separator";

/** The header on pages without a search box. */
export function SiteHeader() {
  return (
    // Pinned during transitions, so only the content below it moves.
    <header className="flex flex-col" style={{ viewTransitionName: "site-header" }}>
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 py-4">
        <Logo className="h-7" />
        <Account />
      </div>
      <Separator />
    </header>
  );
}
