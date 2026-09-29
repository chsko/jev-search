import Link from "next/link";
import { FileTextIcon } from "lucide-react";
import { Account } from "@/components/Account";
import { ExampleQuestions } from "@/components/ExampleQuestions";
import { Logo } from "@/components/Logo";
import { SearchBox } from "@/components/SearchBox";
import { Button } from "@/components/ui/button";
import { NAV_FORWARD, PageTransition } from "@/components/Transitions";
import { EXAMPLES } from "@/lib/examples";

export default function Home() {
  return (
    <PageTransition>
      {/* Lined up with the header on other pages (same column, same row height from
          sm up), so the account buttons stay put. */}
      <div className="mx-auto flex w-full max-w-3xl items-center justify-end px-4 py-4 sm:min-h-20">
        <Account />
      </div>
      <main id="main" className="flex flex-1 flex-col items-center px-4 pt-[10vh] pb-16">
        <h1 className="sr-only">Quairy</h1>
        <Logo className="h-16 sm:h-24" />
        <p className="mt-5 max-w-md text-center text-balance text-muted-foreground">
          Ask a question. Quairy finds the answer and shows how sure it is.
        </p>
        <div className="mt-8 w-full max-w-xl">
          <SearchBox transitionType={NAV_FORWARD} />
        </div>
        <Button asChild variant="link" size="sm" className="mt-2 text-muted-foreground">
          <Link href="/text" transitionTypes={[NAV_FORWARD]}>
            <FileTextIcon data-icon="inline-start" />
            Ask about a text you paste
          </Link>
        </Button>
        <section aria-label="Example questions" className="mt-12 grid w-full max-w-3xl gap-8 sm:grid-cols-3">
          {Object.entries(EXAMPLES).map(([kind, { label, description, questions }]) => (
            <div key={kind} className="flex flex-col gap-3">
              <div>
                <h2 className="font-display text-lg font-semibold">{label}</h2>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
              <ExampleQuestions questions={questions} transitionType={NAV_FORWARD} />
            </div>
          ))}
        </section>
      </main>
    </PageTransition>
  );
}
