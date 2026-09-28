import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { APIError, TypeSafeError } from "@typesafe-ai/sdk";
import { AlertCircleIcon } from "lucide-react";
import { ViewTransition } from "react";
import { Answer } from "@/components/Answer";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getJevClient } from "@/lib/client";
import { askJev, MAX_QUERY_LENGTH, type Outcome } from "@/lib/jev";

type Props = PageProps<"/search">;

async function readQuery(searchParams: Props["searchParams"]) {
  const q = (await searchParams).q;
  return (Array.isArray(q) ? q[0] : q)?.trim() ?? "";
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const q = await readQuery(searchParams);
  return { title: q ? `${q} – Needle` : "Needle" };
}

function describeError(error: unknown): string {
  if (error instanceof APIError) {
    if (error.status === 401 || error.status === 403) {
      return "Needle isn’t authorised to call its answer service. Check the TYPESAFE_API_KEY setting.";
    }
    if (error.status === 429) return "Needle is busy right now. Please try again in a moment.";
    return "Needle couldn’t answer right now. Please try again.";
  }
  if (error instanceof TypeSafeError && /api key/i.test(error.message)) {
    return "Needle isn’t configured yet: set TYPESAFE_API_KEY on the server.";
  }
  return "Needle couldn’t reach its answer service. Please try again.";
}

export default async function SearchPage({ searchParams }: Props) {
  const q = await readQuery(searchParams);
  if (!q) redirect("/");

  if (q.length > MAX_QUERY_LENGTH) {
    return <ErrorCard message={`Please keep questions under ${MAX_QUERY_LENGTH} characters.`} />;
  }

  let outcome: Outcome;
  try {
    outcome = await askJev(getJevClient(), q);
  } catch (error) {
    console.error("Jev request failed", error);
    return <ErrorCard message={describeError(error)} />;
  }
  return (
    // Keyed by the query so each new answer rises in, including searches made
    // from the results header.
    <ViewTransition key={q} enter="reveal-in" default="none">
      <div>
        <h1 className="sr-only">Needle’s answer to “{q}”</h1>
        <Answer outcome={outcome} />
      </div>
    </ViewTransition>
  );
}

function ErrorCard({ message }: { message: string }) {
  return (
    <Alert variant="destructive">
      <AlertCircleIcon />
      <AlertTitle>No answer this time</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
