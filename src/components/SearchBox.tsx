import Form from "next/form";
import { MAX_QUERY_LENGTH } from "@/lib/jev";

export function SearchBox({
  defaultValue,
  autoFocus,
}: {
  defaultValue?: string;
  autoFocus?: boolean;
}) {
  return (
    <Form action="/search" className="w-full">
      <label className="group flex h-12 w-full items-center gap-3 rounded-full border border-line bg-surface px-5 shadow-sm transition hover:shadow-md focus-within:shadow-md">
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="h-5 w-5 shrink-0 fill-none stroke-muted stroke-2"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" strokeLinecap="round" />
        </svg>
        <span className="sr-only">Ask Jev a question</span>
        <input
          name="q"
          type="search"
          required
          maxLength={MAX_QUERY_LENGTH}
          defaultValue={defaultValue}
          autoFocus={autoFocus}
          autoComplete="off"
          placeholder="Ask a yes/no, pick-one or rating question"
          className="h-full min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted"
        />
      </label>
    </Form>
  );
}
