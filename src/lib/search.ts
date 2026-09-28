import "server-only";
import { cache } from "react";
import { getJevClient } from "./client";
import { askJev } from "./jev";

/**
 * Answers a web search. Cached per request, so the page and its metadata
 * (which carries the answer into link previews) share one Jev request.
 */
export const search = cache((query: string) => askJev(getJevClient(), query));
