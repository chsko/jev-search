import type { Questions, SystemOneResult } from "@typesafe-ai/sdk";
import { describe, expect, it } from "vitest";
import {
  buildCompareRequest,
  compareSetup,
  interpretCompare,
  MAX_SHOWN,
  type Comparison,
  QUALITIES,
  rank,
} from "./compare";

describe("compareSetup", () => {
  it("needs options listed after a colon, at most four", () => {
    expect(compareSetup("Which is better for a beginner: Python or Rust?")).toEqual({
      ok: true,
      options: ["Python", "Rust"],
    });
    expect(compareSetup("Is Python better than Rust?").ok).toBe(false);
    expect(compareSetup("Best fruit: a, b, c, d or e?").ok).toBe(false);
  });
});

describe("buildCompareRequest", () => {
  it("asks whether each quality matters and scores every option on it", () => {
    const request = buildCompareRequest("Which is better: A or B?", ["A", "B"]);
    const ids = Object.keys(request.questions);
    expect(ids).toHaveLength(QUALITIES.length * 3 + 1);
    expect(request.questions.tradeoff).toMatchObject({ type: "noul" });
    expect(request.questions.matters_cost).toMatchObject({ type: "noul" });
    expect(request.questions.score_1_cost).toMatchObject({
      type: "score",
      criteria: [
        "Expensive compared with alternatives",
        "About typical for its kind: neither a strength nor a weakness",
        "Cheap compared with alternatives",
      ],
    });
    expect((request.questions.score_1_cost as { instructions: string }).instructions).toBe(
      'For the purpose in `query`, how does "B" do on affordability compared with typical alternatives?',
    );
  });
});

/**
 * A fake result: `relevance` per quality id (default 0.1), a trade-off unless
 * `tradeoff` says otherwise; option 0 is strong on speed, option 1 on cost.
 */
function result(
  options: string[],
  relevance: Record<string, number>,
  tradeoff = 0.9,
): SystemOneResult<Questions> {
  const answers: Record<string, SystemOneResult<Questions>["answers"][string]> = {
    tradeoff: { type: "noul", noul: tradeoff },
  };
  for (const q of QUALITIES) {
    answers[`matters_${q.id}`] = { type: "noul", noul: relevance[q.id] ?? 0.1 };
    options.forEach((_, i) => {
      const strong = (i === 0 && q.id === "speed") || (i === 1 && q.id === "cost");
      answers[`score_${i}_${q.id}`] = {
        type: "score",
        score: strong ? 1.8 : 1,
        confidence: 0.6,
        legend: {},
        probabilities: strong ? { 0: 0, 1: 0.2, 2: 0.8 } : { 0: 0.1, 1: 0.8, 2: 0.1 },
      };
    });
  }
  return { model: "jev-test", answers, usage: { input_tokens: 1, output_tokens: 1 } };
}

const options = ["Fast car", "Cheap car"];
const relevant = { speed: 0.9, cost: 0.8 };

function ready(r: ReturnType<typeof interpretCompare>): Comparison {
  if (r.status !== "ready") throw new Error(`expected a comparison, got ${r.status}`);
  return r.comparison;
}

describe("interpretCompare", () => {
  it("suggests the relevant qualities, most relevant first, at most six", () => {
    const relevance = Object.fromEntries(QUALITIES.slice(0, 9).map((q, i) => [q.id, 0.95 - i * 0.01]));
    const comparison = ready(interpretCompare(options, result(options, relevance)));
    expect(comparison.suggested).toHaveLength(MAX_SHOWN);
    expect(comparison.suggested[0]).toBe(QUALITIES[0].id);
  });

  it("never pads the list with qualities that don't matter", () => {
    const comparison = ready(interpretCompare(options, result(options, relevant)));
    expect(comparison.suggested).toEqual(["speed", "cost"]);
  });

  it("finds nothing to compare when fewer than two qualities matter", () => {
    expect(interpretCompare(options, result(options, { speed: 0.9 }))).toEqual({
      status: "no_factors",
    });
    expect(interpretCompare(options, result(options, {}))).toEqual({ status: "no_factors" });
  });

  it("does not compare questions of fact", () => {
    const planets = ["Mars", "Jupiter", "Venus"];
    expect(interpretCompare(planets, result(planets, relevant, 0.05))).toEqual({
      status: "factual",
    });
  });

  it("reads positions and the most likely level", () => {
    const comparison = ready(interpretCompare(options, result(options, relevant)));
    const speed = comparison.qualities.find((q) => q.id === "speed")!;
    expect(speed.scores[0]).toEqual({ position: 0.9, level: "Strong" });
    expect(speed.scores[1]).toEqual({ position: 0.5, level: "Typical" });
  });
});

describe("rank", () => {
  const comparison = ready(interpretCompare(options, result(options, relevant)));

  it("ranks by the weighted qualities and ignores weights of zero", () => {
    expect(rank(comparison, { speed: 3, cost: 1 })[0].option).toBe("Fast car");
    expect(rank(comparison, { speed: 1, cost: 3 })[0].option).toBe("Cheap car");
    expect(rank(comparison, { speed: 0, cost: 1 })[0].option).toBe("Cheap car");
  });

  it("keeps the original order when nothing is weighted", () => {
    expect(rank(comparison, {}).map((r) => [r.option, r.fit])).toEqual([
      ["Fast car", 0],
      ["Cheap car", 0],
    ]);
  });
});
