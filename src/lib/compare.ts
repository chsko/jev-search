import {
  noul,
  score,
  type Question,
  type Questions,
  type ResultFor,
  type SystemOneRequest,
  type SystemOneResult,
} from "@typesafe-ai/sdk";
import type { JevClient } from "./jev";
import { extractOptions } from "./parse";

// Compare mode follows TypeSafe's composite-scoring pattern: Jev scores each
// option on each quality independently, and code combines the scores with
// weights the user controls. Jev selects from this library rather than
// inventing qualities, and scores every quality up front, so changing a weight
// or adding a quality never needs another request.

export const MAX_COMPARE_OPTIONS = 4;
export const MAX_SHOWN = 6;
/** Fewer relevant qualities than this and there is nothing worth weighing. */
export const MIN_FACTORS = 2;
/** A question is a trade-off, and worth comparing, from this probability. */
export const TRADEOFF = 0.5;
/** A quality is shown by default when Jev thinks it matters at least this much. */
export const RELEVANT = 0.5;

type Quality = { id: string; label: string; low: string; high: string };

/** Qualities worth weighing in everyday comparisons, each phrased so higher is better. */
export const QUALITIES: Quality[] = [
  { id: "value", label: "Value for money", low: "Poor value: costs a lot for what it gives", high: "Great value: gives a lot for what it costs" },
  { id: "cost", label: "Affordability", low: "Expensive compared with alternatives", high: "Cheap compared with alternatives" },
  { id: "ease", label: "Ease of use", low: "Hard to use or get started with", high: "Very easy to use or get started with" },
  { id: "learning", label: "Ease of learning", low: "Takes a long time to learn", high: "Quick to learn for a beginner" },
  { id: "quality", label: "Quality", low: "Poorly made, or does its job badly", high: "Excellently made, and does its job very well" },
  { id: "speed", label: "Speed and performance", low: "Slow or underpowered", high: "Very fast and powerful" },
  { id: "reliability", label: "Reliability", low: "Often fails, breaks or disappoints", high: "Very dependable; rarely fails" },
  { id: "durability", label: "Durability", low: "Wears out quickly", high: "Lasts a very long time" },
  { id: "safety", label: "Safety", low: "Carries a real risk of harm", high: "Very safe" },
  { id: "health", label: "Healthiness", low: "Bad for your health", high: "Good for your health" },
  { id: "taste", label: "Taste", low: "Unpleasant to eat or drink", high: "Delicious" },
  { id: "comfort", label: "Comfort", low: "Uncomfortable", high: "Very comfortable" },
  { id: "convenience", label: "Convenience", low: "A hassle to fit into everyday life", high: "Fits effortlessly into everyday life" },
  { id: "versatility", label: "Versatility", low: "Useful for only one narrow purpose", high: "Useful in many different situations" },
  { id: "support", label: "Community and support", low: "Hard to find help, resources or other users", high: "Plenty of help, resources and other users" },
  { id: "career", label: "Career prospects", low: "Leads to few jobs or opportunities", high: "Opens many jobs and opportunities" },
  { id: "fun", label: "Enjoyment", low: "Dull or unpleasant", high: "Great fun, or very enjoyable" },
  { id: "environment", label: "Environmental friendliness", low: "Harmful to the environment", high: "Kind to the environment" },
  { id: "design", label: "Looks and design", low: "Unattractive or clumsy design", high: "Beautiful and well designed" },
  { id: "privacy", label: "Privacy and security", low: "Puts your data or security at risk", high: "Protects your data and security well" },
  { id: "portability", label: "Portability", low: "Heavy or hard to move around", high: "Light and easy to carry" },
  { id: "time", label: "Time efficiency", low: "Takes a lot of time", high: "Takes very little time" },
];

export const LEVEL_LABELS = ["Weak", "Typical", "Strong"] as const;

export type ComparedQuality = {
  id: string;
  label: string;
  /** Probability that this quality matters for the question. */
  relevance: number;
  /** Per option: position from 0 (weak) to 1 (strong), and the most likely level. */
  scores: { position: number; level: (typeof LEVEL_LABELS)[number] }[];
};

export type Comparison = {
  options: string[];
  qualities: ComparedQuality[];
  /** Qualities shown and weighted by default, most relevant first. */
  suggested: string[];
};

export type CompareResult =
  | { status: "ready"; comparison: Comparison }
  /** The question has one factual answer, so there is nothing to weigh. */
  | { status: "factual" }
  /** None of the qualities, or just one, matter for this question. */
  | { status: "no_factors" };

/**
 * Whether a pick-one question is a trade-off that depends on the asker's
 * priorities ("Which laptop is best for students?") rather than a question of
 * fact ("Which is the largest planet?"). Only trade-offs are worth comparing.
 */
export function tradeoffQuestion() {
  return noul(
    "Does `query` ask which option is best depending on what the asker needs or values, where several factors could be weighed against each other?",
    {
      true: "A choice that depends on priorities, such as which is better, best for a purpose, or worth it.",
      false:
        "A question of fact with one correct answer, such as which is largest, oldest, first, or located somewhere.",
    },
  );
}

export type CompareSetup =
  | { ok: true; options: string[] }
  | { ok: false; reason: string };

/** Finds the options a comparison needs, e.g. "Which is better: A, B or C?". */
export function compareSetup(query: string): CompareSetup {
  const options = extractOptions(query);
  if (!options) {
    return {
      ok: false,
      reason:
        "To compare, list the options after a colon, like “Which is better for a beginner: Python or Rust?”",
    };
  }
  if (options.length > MAX_COMPARE_OPTIONS) {
    return { ok: false, reason: `Compare up to ${MAX_COMPARE_OPTIONS} options at a time.` };
  }
  return { ok: true, options };
}

const scoreId = (option: number, quality: string) => `score_${option}_${quality}`;
const relevanceId = (quality: string) => `matters_${quality}`;

export function buildCompareRequest(query: string, options: string[]) {
  const questions: Questions = { tradeoff: tradeoffQuestion() };
  for (const q of QUALITIES) {
    questions[relevanceId(q.id)] = noul(
      `Is ${q.label.toLowerCase()} an important consideration when answering \`query\`?`,
      {
        true: `Someone answering \`query\` would weigh this: ${q.high.toLowerCase()} versus ${q.low.toLowerCase()}.`,
        false: "This has little or no bearing on the answer.",
      },
    );
    options.forEach((option, i) => {
      questions[scoreId(i, q.id)] = score(
        `For the purpose in \`query\`, how does "${option}" do on ${q.label.toLowerCase()} compared with typical alternatives?`,
        [q.low, `About typical for its kind: neither a strength nor a weakness`, q.high],
      );
    });
  }
  const request: SystemOneRequest<Questions> = { state: { query }, questions };
  return request;
}

function isType<T extends Question["type"]>(
  answer: ResultFor<Question> | undefined,
  type: T,
): answer is Extract<ResultFor<Question>, { type: T }> {
  return answer?.type === type;
}

export function interpretCompare(
  options: string[],
  result: SystemOneResult<Questions>,
): CompareResult {
  const tradeoff = result.answers.tradeoff;
  if (!isType(tradeoff, "noul")) throw new Error("Jev did not judge the question.");
  if (tradeoff.noul < TRADEOFF) return { status: "factual" };

  const qualities: ComparedQuality[] = QUALITIES.map((q) => {
    const matters = result.answers[relevanceId(q.id)];
    if (!isType(matters, "noul")) throw new Error(`Jev did not judge ${q.id}.`);
    const scores = options.map((_, i) => {
      const answer = result.answers[scoreId(i, q.id)];
      if (!isType(answer, "score")) throw new Error(`Jev did not score ${q.id}.`);
      const probabilities = answer.probabilities as Record<string, number>;
      const top = [0, 1, 2].reduce((best, l) =>
        (probabilities[String(l)] ?? 0) > (probabilities[String(best)] ?? 0) ? l : best,
      );
      // The expected score ranks options well; it is not shown as a magnitude.
      return { position: answer.score / 2, level: LEVEL_LABELS[top] };
    });
    return { id: q.id, label: q.label, relevance: matters.noul, scores };
  });

  // Only qualities Jev judged relevant: padding the list with the least
  // irrelevant ones would ask people to weigh factors that don't apply.
  const suggested = [...qualities]
    .sort((a, b) => b.relevance - a.relevance)
    .filter((q) => q.relevance >= RELEVANT)
    .slice(0, MAX_SHOWN)
    .map((q) => q.id);
  if (suggested.length < MIN_FACTORS) return { status: "no_factors" };
  return { status: "ready", comparison: { options, qualities, suggested } };
}

/** Each option's weighted position from 0 to 1, best first. Weights of 0 are ignored. */
export function rank(comparison: Comparison, weights: Record<string, number>) {
  const weighted = comparison.qualities.filter((q) => (weights[q.id] ?? 0) > 0);
  const total = weighted.reduce((sum, q) => sum + weights[q.id], 0);
  return comparison.options
    .map((option, i) => ({
      option,
      index: i,
      fit:
        total === 0
          ? 0
          : weighted.reduce((sum, q) => sum + weights[q.id] * q.scores[i].position, 0) / total,
    }))
    .sort((a, b) => b.fit - a.fit || a.index - b.index);
}

export async function compare(client: JevClient, query: string, options: string[]) {
  const result = await client.systemOne(buildCompareRequest(query, options));
  return interpretCompare(options, result);
}
