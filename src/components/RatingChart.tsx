"use client";

import { useSyncExternalStore } from "react";
import { Bar, BarChart, XAxis } from "recharts";
import { pct } from "@/lib/summary";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const config = {
  probability: { label: "Probability", color: "var(--chart-1)" },
} satisfies ChartConfig;

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia(REDUCED_MOTION);
      query.addEventListener("change", onChange);
      return () => query.removeEventListener("change", onChange);
    },
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => true,
  );
}

export function RatingChart({
  distribution,
}: {
  distribution: { label: string; probability: number }[];
}) {
  const reducedMotion = usePrefersReducedMotion();
  const data = distribution.map((d) => ({
    level: d.label,
    probability: d.probability * 100,
  }));
  return (
    <ChartContainer config={config} className="aspect-auto h-40 w-full">
      <BarChart data={data} accessibilityLayer margin={{ top: 4, left: 0, right: 0, bottom: 0 }}>
        <XAxis dataKey="level" tickLine={false} axisLine={false} tickMargin={8} />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideIndicator formatter={(v) => `${pct(Number(v) / 100)} likely`} />}
        />
        <Bar dataKey="probability" fill="var(--color-probability)" radius={6} isAnimationActive={!reducedMotion} />
      </BarChart>
    </ChartContainer>
  );
}
