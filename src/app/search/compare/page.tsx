import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ViewTransition } from "react";
import { ErrorCard } from "@/components/ErrorCard";
import { getJevClient } from "@/lib/client";
import { compare, compareSetup, type Comparison } from "@/lib/compare";
import { describeError } from "@/lib/errors";
import { MAX_QUERY_LENGTH } from "@/lib/jev";
import { CompareView } from "./CompareView";

type Props = PageProps<"/search/compare">;

async function readQuery(searchParams: Props["searchParams"]) {
  const q = (await searchParams).q;
  return (Array.isArray(q) ? q[0] : q)?.trim() ?? "";
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const q = await readQuery(searchParams);
  return { title: q ? `Compare: ${q} – Quairy` : "Compare – Quairy" };
}

export default async function ComparePage({ searchParams }: Props) {
  const q = await readQuery(searchParams);
  if (!q) redirect("/");
  if (q.length > MAX_QUERY_LENGTH) {
    return <ErrorCard message={`Please keep questions under ${MAX_QUERY_LENGTH} characters.`} />;
  }
  const setup = compareSetup(q);
  if (!setup.ok) return <ErrorCard title="Nothing to compare" message={setup.reason} />;

  let comparison: Comparison;
  try {
    comparison = await compare(getJevClient(), q, setup.options);
  } catch (error) {
    console.error("Jev comparison failed", error);
    return <ErrorCard message={describeError(error)} />;
  }
  return (
    <ViewTransition key={q} enter="reveal-in" default="none">
      <div className="flex flex-col gap-6">
        <h1 className="font-display text-2xl font-bold tracking-tight text-balance">
          <span className="sr-only">Comparing: </span>
          {q}
        </h1>
        <CompareView comparison={comparison} />
      </div>
    </ViewTransition>
  );
}
