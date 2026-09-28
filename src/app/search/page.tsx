import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ViewTransition } from "react";
import { Answer } from "@/components/Answer";
import { ErrorCard } from "@/components/ErrorCard";
import { describeError } from "@/lib/errors";
import { MAX_QUERY_LENGTH, type Outcome } from "@/lib/jev";
import { search } from "@/lib/search";
import { summarize } from "@/lib/summary";

type Props = PageProps<"/search">;

async function readQuery(searchParams: Props["searchParams"]) {
  const q = (await searchParams).q;
  return (Array.isArray(q) ? q[0] : q)?.trim() ?? "";
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const q = await readQuery(searchParams);
  if (!q || q.length > MAX_QUERY_LENGTH) return { title: "Quairy" };

  // Link previews show the answer: the description here, and the card image,
  // which /card renders from the same question.
  let description: string | undefined;
  try {
    const summary = summarize(await search(q));
    if (summary) description = `${summary.answer}. ${summary.detail}`;
  } catch {
    // The page shows the error; the preview falls back to the site description.
  }
  const title = `${q} – Quairy`;
  const image = { url: `/card?${new URLSearchParams({ q })}`, width: 1200, height: 630, alt: title };
  return {
    title,
    description,
    openGraph: { siteName: "Quairy", title, description, images: [image] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function SearchPage({ searchParams }: Props) {
  const q = await readQuery(searchParams);
  if (!q) redirect("/");

  if (q.length > MAX_QUERY_LENGTH) {
    return <ErrorCard message={`Please keep questions under ${MAX_QUERY_LENGTH} characters.`} />;
  }

  let outcome: Outcome;
  try {
    outcome = await search(q);
  } catch (error) {
    console.error("Jev request failed", error);
    return <ErrorCard message={describeError(error)} />;
  }
  return (
    // Keyed by the query so each new answer rises in, including searches made
    // from the results header.
    <ViewTransition key={q} enter="reveal-in" default="none">
      <div>
        <h1 className="sr-only">Quairy’s answer to “{q}”</h1>
        <Answer
          outcome={outcome}
          compareHref={`/search/compare?${new URLSearchParams({ q })}`}
        />
      </div>
    </ViewTransition>
  );
}
