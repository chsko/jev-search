import { Suspense } from "react";
import { Logo } from "@/components/Logo";
import { SearchBox } from "@/components/SearchBox";
import { QueryBox } from "./QueryBox";

export default function SearchLayout({ children }: LayoutProps<"/search">) {
  return (
    <>
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-3xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:gap-6">
          <Logo size="small" />
          <div className="flex-1">
            <Suspense fallback={<SearchBox />}>
              <QueryBox />
            </Suspense>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">{children}</main>
    </>
  );
}
