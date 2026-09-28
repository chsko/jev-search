import Link from "next/link";
import { Button } from "@/components/ui/button";

/** Example questions as links that run the search. */
export function ExampleQuestions({
  questions,
  transitionType,
}: {
  questions: readonly string[];
  /** Tags the navigation so the pages animate; omit for lateral searches. */
  transitionType?: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {questions.map((q) => (
        <Button key={q} asChild variant="outline" size="sm" className="h-auto min-h-8 max-w-full shrink rounded-full py-1.5 text-left whitespace-normal">
          <Link
            href={{ pathname: "/search", query: { q } }}
            transitionTypes={transitionType ? [transitionType] : undefined}
          >
            {q}
          </Link>
        </Button>
      ))}
    </div>
  );
}
