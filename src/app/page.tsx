import { ExampleQuestions } from "@/components/ExampleQuestions";
import { Logo } from "@/components/Logo";
import { SearchBox } from "@/components/SearchBox";
import { EXAMPLES } from "@/lib/examples";

export default function Home() {
  return (
    <main id="main" className="flex flex-1 flex-col items-center px-4 pt-[16vh] pb-16">
      <h1 className="sr-only">Jev Search</h1>
      <Logo className="h-24 sm:h-32" />
      <p className="mt-5 max-w-md text-center text-balance text-muted-foreground">
        Ask a question and see Jev’s answer, with how sure it is.
      </p>
      <div className="mt-8 w-full max-w-xl">
        <SearchBox />
      </div>
      <section aria-label="Example questions" className="mt-12 grid w-full max-w-3xl gap-8 sm:grid-cols-3">
        {Object.entries(EXAMPLES).map(([kind, { label, description, questions }]) => (
          <div key={kind} className="flex flex-col gap-3">
            <div>
              <h2 className="font-display text-lg font-semibold">{label}</h2>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            <ExampleQuestions questions={questions} />
          </div>
        ))}
      </section>
    </main>
  );
}
