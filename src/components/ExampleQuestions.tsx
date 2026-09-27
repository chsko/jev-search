import Link from "next/link";
import { Button } from "@/components/ui/button";

/** Example questions as links that run the search. */
export function ExampleQuestions({ questions }: { questions: readonly string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {questions.map((q) => (
        <Button key={q} asChild variant="outline" size="sm" className="h-auto min-h-8 max-w-full shrink rounded-full py-1.5 text-left whitespace-normal">
          <Link href={{ pathname: "/search", query: { q } }}>{q}</Link>
        </Button>
      ))}
    </div>
  );
}
