import Link from "next/link";
import { Logo } from "@/components/Logo";
import { SearchBox } from "@/components/SearchBox";
import { EXAMPLES } from "@/lib/examples";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center px-4 pt-[18vh] pb-16">
      <Logo size="large" />
      <p className="mt-3 text-sm text-muted">
        Search that answers, powered by Jev
      </p>
      <div className="mt-8 w-full max-w-xl">
        <SearchBox autoFocus />
      </div>
      <section className="mt-10 grid w-full max-w-3xl gap-4 sm:grid-cols-3">
        {Object.entries(EXAMPLES).map(([kind, { label, questions }]) => (
          <div key={kind}>
            <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
              {label}
            </h2>
            <ul className="space-y-1.5">
              {questions.map((q) => (
                <li key={q}>
                  <Link
                    href={{ pathname: "/search", query: { q } }}
                    className="text-sm text-link hover:underline"
                  >
                    {q}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </main>
  );
}
