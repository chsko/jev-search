import {
  choice,
  type ChoiceCriteria,
  noul,
  score,
  type ChoiceResponse,
  type EntryType,
  type Question,
  type Questions,
  type ResultFor,
  type ScoreCriteria,
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
      "On a scale of 1 to 10, how spicy is a jalapeño?",
      "How risky is skydiving?",
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
      scale: Scale;
      /** The scale was not stated in the question, so the default was used. */
      defaulted: boolean;
      /** Expected rating on the question's own scale. */
      rating: number;
      confidence: number;
      distribution: { value: number; probability: number }[];
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

function scaleCriteria(scale: Scale): ScoreCriteria {
  const levels: EntryType[] = [];
  for (let value = scale.min; value <= scale.max; value++) {
    if (value === scale.min) {
      levels.push(
        `${value}, the lowest rating on the ${scale.min}–${scale.max} scale: the quality asked about in \`query\` is absent or as low as it gets.`,
      );
    } else if (value === scale.max) {
      levels.push(
        `${value}, the highest rating on the ${scale.min}–${scale.max} scale: the quality asked about in \`query\` is as high as it gets.`,
      );
    } else {
      levels.push(
        `${value} on the ${scale.min}–${scale.max} scale, where ${scale.min} means the quality asked about in \`query\` is absent and ${scale.max} means it is as high as it gets.`,
      );
    }
  }
  return levels as unknown as ScoreCriteria;
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

  if (scale.ok) {
    questions.rate = score(
      `Assume \`query\` asks for a rating from ${scale.scale.min} to ${scale.scale.max}. Using well-established general knowledge, how would a well-informed person rate what \`query\` asks about?`,
      scaleCriteria(scale.scale),
    );
  }

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
      if (!built.scale.ok || !isType(answer, "score")) {
        return {
          kind: "unsupported",
          classification,
          reason: built.scale.ok
            ? undefined
            : `It looks like you want a rating, but ${built.scale.reason.charAt(0).toLowerCase()}${built.scale.reason.slice(1)}`,
        };
      }
      const { scale, defaulted } = built.scale;
      const distribution = Object.entries(answer.probabilities)
        .map(([level, probability]) => ({
          value: scale.min + Number(level),
          probability,
        }))
        .sort((a, b) => a.value - b.value);
      return {
        kind: "rate",
        classification,
        scale,
        defaulted,
        rating: scale.min + answer.score,
        confidence: answer.confidence,
        distribution,
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
