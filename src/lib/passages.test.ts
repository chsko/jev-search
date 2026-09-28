import type { Questions, SystemOneResult } from "@typesafe-ai/sdk";
import { describe, expect, it } from "vitest";
import { askJev, buildRequest, type JevClient } from "./jev";
import { MAX_PASSAGES, passageId, tagPassages, toPassages } from "./passages";

describe("toPassages", () => {
  it("splits lines and sentences and drops blank lines", () => {
    expect(toPassages("First line.\n\nSecond one. Third one!\nFourth")).toEqual([
      "First line.",
      "Second one.",
      "Third one!",
      "Fourth",
    ]);
  });

  it("groups long texts into at most the Choice option limit", () => {
    const text = Array.from({ length: 600 }, (_, i) => `Sentence ${i}.`).join(" ");
    const passages = toPassages(text);
    expect(passages.length).toBeLessThanOrEqual(MAX_PASSAGES);
    expect(passages[0]).toBe("Sentence 0. Sentence 1. Sentence 2.");
    expect(passages.join(" ")).toBe(text);
  });

  it("tags passages with IDs Jev can point to", () => {
    expect(passageId(7)).toBe("L007");
    expect(tagPassages(["A.", "B."])).toBe("L000| A.\nL001| B.");
  });
});

const PASSAGES = ["The sauna is for Annual members.", "Lockers are free.", "Day passes cannot be paused."];

function fakeClient(answers: SystemOneResult<Questions>["answers"]): JevClient {
  return {
    async systemOne() {
      return { model: "jev-test", answers, usage: { input_tokens: 1, output_tokens: 1 } };
    },
  };
}

function kind(choice: string) {
  const probabilities = { yes_no: 0.05, pick_one: 0.05, rate: 0.05, unsupported: 0.05, [choice]: 0.85 };
  return { type: "choice" as const, choice, confidence: 0.85, probabilities };
}

const where = {
  type: "choice" as const,
  choice: "L002",
  confidence: 0.7,
  probabilities: { L000: 0.05, L001: 0.25, L002: 0.7 },
};

describe("asking about a text", () => {
  it("adds the answered and where questions and grounds the answers in the document", () => {
    const { request } = buildRequest("Can day passes be paused?", PASSAGES);
    expect(request.state).toEqual({
      query: "Can day passes be paused?",
      document: "L000| The sauna is for Annual members.\nL001| Lockers are free.\nL002| Day passes cannot be paused.",
    });
    expect(request.questions.answered).toMatchObject({ type: "noul" });
    expect(request.questions.where).toMatchObject({
      type: "choice",
      criteria: { L000: null, L001: null, L002: null },
    });
    expect(JSON.stringify(request.questions.yes_no)).toContain("Using only what `document` states");
  });

  it("keeps general-knowledge wording for web searches", () => {
    const { request } = buildRequest("Can penguins fly?");
    expect(request.questions.answered).toBeUndefined();
    expect(JSON.stringify(request.questions.yes_no)).toContain("general knowledge");
  });

  it("answers with the passages most likely to hold the answer", async () => {
    const outcome = await askJev(
      fakeClient({
        kind: kind("yes_no"),
        yes_no: { type: "noul", noul: 0.05 },
        answered: { type: "noul", noul: 0.95 },
        where,
      }),
      "Can day passes be paused?",
      PASSAGES,
    );
    expect(outcome).toMatchObject({
      kind: "yes_no",
      yes: 0.05,
      grounding: { verdict: "answered", answered: 0.95 },
    });
    if (outcome.kind !== "yes_no") throw new Error("unreachable");
    expect(outcome.grounding?.evidence.map((e) => e.index)).toEqual([2, 1]);
  });

  it("marks answers the text only partly addresses", async () => {
    const outcome = await askJev(
      fakeClient({
        kind: kind("yes_no"),
        yes_no: { type: "noul", noul: 0.7 },
        answered: { type: "noul", noul: 0.5 },
        where,
      }),
      "Is the sauna open at weekends?",
      PASSAGES,
    );
    expect(outcome).toMatchObject({ kind: "yes_no", grounding: { verdict: "partial" } });
  });

  it("says the text does not answer when it does not", async () => {
    const outcome = await askJev(
      fakeClient({
        kind: kind("yes_no"),
        yes_no: { type: "noul", noul: 0.5 },
        answered: { type: "noul", noul: 0.04 },
        where,
      }),
      "Is there a swimming pool?",
      PASSAGES,
    );
    expect(outcome).toMatchObject({ kind: "not_in_text", answered: 0.04 });
  });

  it("still explains unsupported questions about a text", async () => {
    const outcome = await askJev(
      fakeClient({
        kind: kind("unsupported"),
        yes_no: { type: "noul", noul: 0.5 },
        answered: { type: "noul", noul: 0.9 },
        where,
      }),
      "Who runs the gym?",
      PASSAGES,
    );
    expect(outcome).toMatchObject({ kind: "unsupported" });
  });
});
