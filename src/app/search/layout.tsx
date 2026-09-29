import { Suspense } from "react";
import { Account } from "@/components/Account";
import { Logo } from "@/components/Logo";
import { SearchBox } from "@/components/SearchBox";
import { Separator } from "@/components/ui/separator";
import { QueryBox } from "./QueryBox";

export default function SearchLayout({ children }: LayoutProps<"/search">) {
  return (
    <>
      {/* Pinned during transitions, so only the content below it moves. */}
      <header className="flex flex-col" style={{ viewTransitionName: "site-header" }}>
        {/* On phones the search box wraps below the logo and account; from sm up, one row. */}
        <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center gap-3 px-4 py-4 sm:flex-nowrap sm:gap-6">
          <Logo className="h-7" />
          <div className="order-last w-full sm:order-none sm:w-auto sm:flex-1">
            <Suspense fallback={<SearchBox />}>
              <QueryBox />
            </Suspense>
          </div>
          <Account className="ml-auto sm:ml-0" />
        </div>
        <Separator />
      </header>
      <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">{children}</main>
    </>
  );
}
