import { describe, expect, it } from "vitest";
import type { Classification, Outcome } from "./jev";
import { summarize } from "./summary";

const classification = (kind: Classification["kind"]): Classification => ({
  kind,
  confidence: 0.9,
  probabilities: { yes_no: 0, pick_one: 0, rate: 0, unsupported: 0, [kind]: 0.9 },
});

describe("summarize", () => {
  it("states a yes/no answer and how sure it is", () => {
    const outcome: Outcome = { kind: "yes_no", classification: classification("yes_no"), yes: 0.08 };
    expect(summarize(outcome)).toEqual({
      kind: "yes_no",
      answer: "No",
      detail: "Quairy is 92% sure.",
      confidence: 0.92,
    });
  });

  it("calls near-even answers too close to call", () => {
    const outcome: Outcome = { kind: "yes_no", classification: classification("yes_no"), yes: 0.55 };
    expect(summarize(outcome)).toMatchObject({
      answer: "Too close to call",
      detail: "Quairy leans yes, at 55%.",
    });
  });

  it("gives ratings as a level, without a bar", () => {
    const outcome: Outcome = {
      kind: "rate",
      classification: classification("rate"),
      level: "A lot",
      confidence: 0.6,
      distribution: [
        { label: "None", probability: 0.05 },
        { label: "A lot", probability: 0.6 },
      ],
      onScale: { scale: { min: 1, max: 10 }, value: 8 },
    };
    const summary = summarize(outcome);
    expect(summary).toMatchObject({ answer: "A lot" });
    expect(summary?.detail).toBe("The most likely of five levels, at 60%. Roughly 8 on your 1 to 10 scale.");
    expect(summary?.confidence).toBeUndefined();
  });

  it("has nothing to share for unsupported questions", () => {
    expect(summarize({ kind: "unsupported", classification: classification("unsupported") })).toBeNull();
  });
});
