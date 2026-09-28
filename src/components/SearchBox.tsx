"use client";

import { useState, useSyncExternalStore, ViewTransition, type FormEvent } from "react";
import Form from "next/form";
import { useRouter } from "next/navigation";
import { SearchIcon } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { MAX_QUERY_LENGTH } from "@/lib/jev";

export function SearchBox({
  defaultValue,
  autoFocus,
  transitionType,
}: {
  defaultValue?: string;
  autoFocus?: boolean;
  /** Tags the navigation so the pages animate; omit for lateral searches. */
  transitionType?: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue ?? "");
  // Only disable Ask once the page is interactive, so the form still works
  // before (or without) JavaScript; the input's pattern covers that case.
  const hydrated = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );
  const empty = value.trim() === "";

  // Navigate ourselves to attach the transition type. Without JavaScript the
  // form still submits as a normal GET to /search.
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    const q = new FormData(event.currentTarget).get("q")?.toString().trim();
    if (!q) return;
    event.preventDefault();
    router.push(`/search?${new URLSearchParams({ q })}`, {
      transitionTypes: transitionType ? [transitionType] : undefined,
    });
  }

  return (
    <Form action="/search" className="w-full" onSubmit={onSubmit}>
      {/* Morphs between the centre of the home page and the results header. */}
      <ViewTransition name="search-box" share="morph" default="none">
        <InputGroup className="h-12 rounded-full bg-card">
          <InputGroupAddon className="pl-4">
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput
            name="q"
            type="search"
            required
            maxLength={MAX_QUERY_LENGTH}
            defaultValue={defaultValue}
            onChange={(event) => setValue(event.currentTarget.value)}
            pattern=".*\S.*"
            title="Type a question"
            autoFocus={autoFocus}
            autoComplete="off"
            aria-label="Ask Quairy a question"
            placeholder="Ask a question…"
            className="text-base"
          />
          <InputGroupAddon align="inline-end" className="pr-1.5">
            <InputGroupButton
            type="submit"
            variant="default"
            size="sm"
            disabled={hydrated && empty}
            className="rounded-full px-4"
          >
              Ask
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </ViewTransition>
    </Form>
  );
}

function subscribeNoop() {
  return () => {};
}
