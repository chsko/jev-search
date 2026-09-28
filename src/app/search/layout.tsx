import { Suspense } from "react";
import { Logo } from "@/components/Logo";
import { SearchBox } from "@/components/SearchBox";
import { Separator } from "@/components/ui/separator";
import { QueryBox } from "./QueryBox";

export default function SearchLayout({ children }: LayoutProps<"/search">) {
  return (
    <>
      {/* Pinned during transitions, so only the content below it moves. */}
      <header className="flex flex-col" style={{ viewTransitionName: "site-header" }}>
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:gap-6">
          <Logo className="h-7" />
          <div className="flex-1">
            <Suspense fallback={<SearchBox />}>
              <QueryBox />
            </Suspense>
          </div>
        </div>
        <Separator />
      </header>
      <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">{children}</main>
    </>
  );
}
