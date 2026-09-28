import type { Outcome, SupportedKind } from "./jev";

const percent = new Intl.NumberFormat("en", { style: "percent", maximumFractionDigits: 0 });
export const pct = (p: number) => percent.format(p);

export const KIND_LABEL: Record<SupportedKind, string> = {
  yes_no: "Yes or no",
  pick_one: "Pick one",
  rate: "Rating",
};

export type Summary = {
  kind: SupportedKind;
  /** The answer itself: "No", "Jupiter", "A lot". */
  answer: string;
  /** How sure Quairy is, as a sentence. */
  detail: string;
  /** The probability behind the answer, for a bar; none for ratings, whose levels are shown instead. */
  confidence?: number;
};

/** The answer in a few words, as shown on the answer card and in share previews. */
export function summarize(outcome: Outcome): Summary | null {
  switch (outcome.kind) {
    case "unsupported":
    case "not_in_text":
      return null;
    case "yes_no": {
      const { yes } = outcome;
      const lean = yes >= 0.5 ? "Yes" : "No";
      const sure = Math.max(yes, 1 - yes);
      const close = yes > 0.4 && yes < 0.6;
      return {
        kind: "yes_no",
        answer: close ? "Too close to call" : lean,
        detail: close
          ? `Quairy leans ${lean.toLowerCase()}, at ${pct(sure)}.`
          : `Quairy is ${pct(sure)} sure.`,
        confidence: sure,
      };
    }
    case "pick_one":
      return {
        kind: "pick_one",
        answer: outcome.choice,
        detail: `Quairy is ${pct(outcome.confidence)} confident in this pick.`,
        confidence: outcome.confidence,
      };
    case "rate": {
      const { onScale } = outcome;
      const top = Math.max(...outcome.distribution.map((d) => d.probability));
      return {
        kind: "rate",
        answer: outcome.level,
        detail: `The most likely of five levels, at ${pct(top)}.${
          onScale
            ? ` Roughly ${onScale.value} on your ${onScale.scale.min} to ${onScale.scale.max} scale.`
            : ""
        }`,
      };
    }
  }
}
