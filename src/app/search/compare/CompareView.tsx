"use client";

import { startTransition, useState, ViewTransition } from "react";
import { PlusIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { rank, type Comparison } from "@/lib/compare";
import { cn } from "@/lib/utils";

const WEIGHT_LABELS = ["Off", "A little", "Some", "A lot"];
const DEFAULT_WEIGHT = 2;
/** Factors offered before "Show all", most relevant first. */
const OFFERED = 8;

export function CompareView({ comparison }: { comparison: Comparison }) {
  const byId = new Map(comparison.qualities.map((q) => [q.id, q]));
  const [shown, setShown] = useState<string[]>(comparison.suggested);
  // Live weights move the sliders; committed weights re-rank, so the list
  // re-sorts (with a view transition) when a slider is released.
  const [weights, setWeights] = useState<Record<string, number>>(() =>
    Object.fromEntries(comparison.suggested.map((id) => [id, DEFAULT_WEIGHT])),
  );
  const [committed, setCommitted] = useState(weights);
  const [showAll, setShowAll] = useState(false);

  const ranking = rank(comparison, committed);
  const leader = ranking[0];
  const hidden = comparison.qualities
    .filter((q) => !shown.includes(q.id))
    .sort((a, b) => b.relevance - a.relevance);
  const offered = showAll ? hidden : hidden.slice(0, OFFERED);
  const anyWeight = Object.values(committed).some((w) => w > 0);

  function commit(next: Record<string, number>) {
    startTransition(() => setCommitted(next));
  }

  function setWeight(id: string, value: number) {
    setWeights((w) => ({ ...w, [id]: value }));
  }

  function addQuality(id: string) {
    const next = { ...weights, [id]: DEFAULT_WEIGHT };
    setShown((s) => [...s, id]);
    setWeights(next);
    commit(next);
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardDescription>Best match for what matters to you</CardDescription>
          <CardTitle className="font-display text-4xl font-bold tracking-tight break-words">
            {anyWeight ? leader.option : "Turn on a factor"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="flex flex-col gap-3">
            {ranking.map((r) => (
              <ViewTransition key={r.option}>
                <li className="grid grid-cols-[minmax(0,14rem)_1fr] items-center gap-3 text-sm">
                  <span className="truncate" title={r.option}>
                    {r.option}
                  </span>
                  <Progress
                    value={r.fit * 100}
                    aria-label={`${r.option}: ${Math.round(r.fit * 100)} out of 100 for your weights`}
                  />
                </li>
              </ViewTransition>
            ))}
          </ol>
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground">
          Bars combine Quairy’s ratings using your weights, so they rank the options rather than
          measure them.
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">What matters to you</CardTitle>
          <CardDescription>
            Quairy picked the factors that matter most here. Change how much each one counts.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {shown.map((id) => {
            const q = byId.get(id)!;
            const weight = weights[id] ?? 0;
            return (
              <div key={id} className="flex flex-col gap-3">
                <div className="flex items-baseline justify-between gap-3">
                  <span id={`label-${id}`} className="font-medium">
                    {q.label}
                  </span>
                  <span className="text-sm text-muted-foreground">{WEIGHT_LABELS[weight]}</span>
                </div>
                <Slider
                  aria-labelledby={`label-${id}`}
                  aria-valuetext={WEIGHT_LABELS[weight]}
                  min={0}
                  max={3}
                  step={1}
                  value={[weight]}
                  onValueChange={([v]) => setWeight(id, v)}
                  onValueCommit={([v]) => commit({ ...weights, [id]: v })}
                />
                <div className={cn("flex flex-wrap gap-2", weight === 0 && "opacity-50")}>
                  {comparison.options.map((option, i) => (
                    <Badge
                      key={option}
                      variant={q.scores[i].level === "Strong" ? "default" : "secondary"}
                    >
                      {option}: {q.scores[i].level.toLowerCase()}
                    </Badge>
                  ))}
                </div>
              </div>
            );
          })}
        </CardContent>
        {hidden.length > 0 && (
          <CardFooter className="flex-col items-start gap-2">
            <span className="text-sm text-muted-foreground">Add a factor</span>
            <div className="flex flex-wrap gap-2">
              {offered.map((q) => (
                <Button
                  key={q.id}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={() => addQuality(q.id)}
                >
                  <PlusIcon data-icon="inline-start" />
                  {q.label}
                </Button>
              ))}
              {offered.length < hidden.length && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowAll(true)}>
                  Show all factors
                </Button>
              )}
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
