import {
  choice,
  type ChoiceCriteria,
  noul,
  score,
  type ChoiceResponse,
  type Question,
  type Questions,
  type ResultFor,
  type SystemOneRequest,
  type SystemOneResult,
} from "@typesafe-ai/sdk";
import { extractOptions, extractScale, type Scale } from "./parse";

export const MAX_QUERY_LENGTH = 400;

/** The three kinds of question Jev answers, plus everything else. */
export const KIND_CRITERIA = {
  yes_no: {
    meaning: "A question whose answer is simply yes or no.",
    examples: ["Is the Pacific the largest ocean?", "Can penguins fly?"],
  },
  pick_one: {
    meaning:
      "A question asking which one of several alternatives is the answer, where the question itself lists every alternative.",
    examples: [
      "Which is the largest planet: Mars, Jupiter or Venus?",
      "Which is the better first programming language for kids, Python or C++?",
    ],
  },
  rate: {
    meaning:
      "A question asking how much of a gradable quality something has, answerable as a rating on a scale.",
    examples: [
      "How spicy is a jalapeño?",
      "On a scale of 1 to 10, how risky is skydiving?",
    ],
  },
  unsupported: {
    meaning:
      "Anything else: questions answered with a name, number, date, place, list, explanation or instructions; requests to choose without listing the alternatives; greetings, commands, or text that is not a question.",
    examples: [
      "Who wrote Hamlet?",
      "How tall is Mount Everest?",
      "How do I bake sourdough bread?",
      "What is the best laptop?",
    ],
  },
} satisfies ChoiceCriteria;

export type QuestionKind = keyof typeof KIND_CRITERIA;
export type SupportedKind = Exclude<QuestionKind, "unsupported">;

export const NONE_OF_THESE = "None of the listed options";

/**
 * Rating levels, lowest first. Jev judges each level on its own and never
 * sees its position, so each describes a situation rather than a number.
 */
export const RATING_LEVELS = [
  {
    label: "None",
    description: "The subject of `query` has none of the quality that `query` asks about.",
  },
  {
    label: "A little",
    description:
      "The subject of `query` has a little of the quality that `query` asks about, less than is typical.",
  },
  {
    label: "Moderate",
    description:
      "The subject of `query` has a typical, middling amount of the quality that `query` asks about.",
  },
  {
    label: "A lot",
    description:
      "The subject of `query` has a lot of the quality that `query` asks about, clearly more than is typical.",
  },
  {
    label: "Extreme",
    description:
      "The subject of `query` has an extreme amount of the quality that `query` asks about, about as much as anything has.",
  },
] as const;

export type Classification = {
  kind: QuestionKind;
  confidence: number;
  probabilities: Record<QuestionKind, number>;
};

export type Outcome =
  | {
      kind: "yes_no";
      classification: Classification;
      /** Probability that the answer is yes. */
      yes: number;
    }
  | {
      kind: "pick_one";
      classification: Classification;
      choice: string;
      confidence: number;
      /** Listed options and "none of them", most probable first. */
      options: { label: string; probability: number; none: boolean }[];
    }
  | {
      kind: "rate";
      classification: Classification;
      /** The most probable level's label. */
      level: string;
      confidence: number;
      /** Every level, lowest first. */
      distribution: { label: string; probability: number }[];
      /** The most probable level placed on the scale the question named, rounded. */
      onScale: { scale: Scale; value: number } | null;
    }
  | {
      kind: "unsupported";
      classification: Classification;
      /** Why a question that looked answerable could not be asked. */
      reason?: string;
    };

/** The part of `TypeSafeClient` this module needs, so tests can supply a fake. */
export interface JevClient {
  systemOne(
    request: SystemOneRequest<Questions>,
  ): PromiseLike<SystemOneResult<Questions>>;
}

/**
 * Builds one request that classifies the query and, speculatively, answers it
 * as each kind that code could prepare. The answers run in parallel with the
 * classification; only the one matching the classification is used.
 */
export function buildRequest(query: string) {
  const options = extractOptions(query);
  const scale = extractScale(query);

  const questions: Questions = {
    kind: choice(
      "Which kind of question is `query`? Judge its form, not whether it is easy or true.",
      KIND_CRITERIA,
    ),
    yes_no: noul(
      "Assume `query` is a yes/no question. Using well-established general knowledge, is the answer to `query` yes?",
      { true: "The answer is yes.", false: "The answer is no." },
    ),
  };

  if (options) {
    const criteria: Record<string, null> = {};
    for (const option of options) criteria[option] = null;
    if (!options.some((o) => o.toLowerCase() === NONE_OF_THESE.toLowerCase())) {
      criteria[NONE_OF_THESE] = null;
    }
    questions.pick_one = choice(
      "Assume `query` asks which one of the listed alternatives is the answer. Using well-established general knowledge, which alternative best answers `query`? Choose the none option only if no listed alternative is a reasonable answer.",
      criteria,
    );
  }

  const [lowest, next, ...higher] = RATING_LEVELS.map((level) => level.description);
  questions.rate = score(
    "Assume `query` asks how much of a quality its subject has. Using well-established general knowledge, how much of that quality does the subject have?",
    [lowest, next, ...higher],
  );

  const request: SystemOneRequest<Questions> = {
    state: { query },
    questions,
  };
  return { request, options, scale };
}

function isType<T extends Question["type"]>(
  answer: ResultFor<Question> | undefined,
  type: T,
): answer is Extract<ResultFor<Question>, { type: T }> {
  return answer?.type === type;
}

/** Turns Jev's answers into what the page shows. */
export function interpret(
  built: ReturnType<typeof buildRequest>,
  result: SystemOneResult<Questions>,
): Outcome {
  const { answers } = result;
  const kindAnswer = answers.kind;
  if (!isType(kindAnswer, "choice")) {
    throw new Error("Jev did not classify the question.");
  }
  const kinds = kindAnswer as ChoiceResponse<typeof KIND_CRITERIA>;
  const classification: Classification = {
    kind: kinds.choice,
    confidence: kinds.confidence,
    probabilities: { ...kinds.probabilities },
  };

  switch (classification.kind) {
    case "yes_no": {
      const answer = answers.yes_no;
      if (!isType(answer, "noul")) break;
      return { kind: "yes_no", classification, yes: answer.noul };
    }
    case "pick_one": {
      const answer = answers.pick_one;
      if (!built.options || !isType(answer, "choice")) {
        return {
          kind: "unsupported",
          classification,
          reason:
            "It looks like you want Jev to pick between alternatives, but it couldn't find at least two listed after a colon.",
        };
      }
      const options = Object.entries(answer.probabilities)
        .map(([label, probability]) => ({
          label,
          probability,
          none: label === NONE_OF_THESE,
        }))
        .sort((a, b) => b.probability - a.probability);
      return {
        kind: "pick_one",
        classification,
        choice: answer.choice,
        confidence: answer.confidence,
        options,
      };
    }
    case "rate": {
      const answer = answers.rate;
      if (!built.scale.ok) {
        return {
          kind: "unsupported",
          classification,
          reason: `It looks like you want a rating, but ${built.scale.reason.charAt(0).toLowerCase()}${built.scale.reason.slice(1)}`,
        };
      }
      if (!isType(answer, "score")) break;
      const probabilities = answer.probabilities as Record<string, number>;
      const distribution = RATING_LEVELS.map((level, i) => ({
        label: level.label,
        probability: probabilities[String(i)] ?? 0,
      }));
      // The most probable level, not the expected score: Jev's levels are not
      // calibrated for interpolating a magnitude between them.
      const top = distribution.reduce(
        (best, d, i) => (d.probability > distribution[best].probability ? i : best),
        0,
      );
      const { scale } = built.scale;
      const onScale = scale && {
        scale,
        value: Math.round(scale.min + (top / (RATING_LEVELS.length - 1)) * (scale.max - scale.min)),
      };
      return {
        kind: "rate",
        classification,
        level: distribution[top].label,
        confidence: answer.confidence,
        distribution,
        onScale,
      };
    }
    case "unsupported":
      return { kind: "unsupported", classification };
  }
  throw new Error(`Jev returned no answer for a ${classification.kind} question.`);
}

/** Classifies and answers a query with a single Jev request. */
export async function askJev(client: JevClient, query: string): Promise<Outcome> {
  const built = buildRequest(query);
  const result = await client.systemOne(built.request);
  return interpret(built, result);
}
