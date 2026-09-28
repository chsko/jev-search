import { Logo } from "@/components/Logo";
import { Separator } from "@/components/ui/separator";

export default function TextLayout({ children }: LayoutProps<"/text">) {
  return (
    <>
      {/* Pinned during transitions, so only the content below it moves. */}
      <header className="flex flex-col" style={{ viewTransitionName: "site-header" }}>
        <div className="mx-auto flex w-full max-w-3xl items-center px-4 py-4">
          <Logo className="h-7" />
        </div>
        <Separator />
      </header>
      <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        {children}
      </main>
    </>
  );
}
