import { SiteHeader } from "@/components/SiteHeader";

export default function HistoryLayout({ children }: LayoutProps<"/history">) {
  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        {children}
      </main>
    </>
  );
}
