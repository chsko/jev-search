"use client";

import { useSearchParams } from "next/navigation";
import { SearchBox } from "@/components/SearchBox";

/** The header search box, prefilled with the current query. */
export function QueryBox() {
  const q = useSearchParams().get("q") ?? "";
  // Keyed so the uncontrolled input resets when the query changes.
  return <SearchBox key={q} defaultValue={q} />;
}
