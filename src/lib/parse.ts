// Deterministic parsing that runs before Jev is called. Jev selects among
// candidates rather than generating them, so the options of a pick-one
// question and the bounds of a rating scale are found here, in code.

export const MAX_OPTIONS = 10;
export const MAX_OPTION_LENGTH = 120;

export type Scale = { min: number; max: number };

export type ScaleParse =
  | { ok: true; scale: Scale | null }
  | { ok: false; reason: string };

function cleanOption(raw: string): string {
  return raw
    .trim()
    .replace(/^(?:or|and)\s+/i, "")
    .replace(/[?.!]+$/, "")
    .trim();
}

/**
 * Finds the options a question lists after a colon or a question mark, e.g.
 * "Which is heavier: a tonne of bricks, or a tonne of feathers?" or
 * "Which planet is biggest? Mars, Jupiter or Venus". Returns `null` when
 * fewer than two usable options are listed.
 */
export function extractOptions(question: string): string[] | null {
  const text = question.trim();
  const colon = text.lastIndexOf(":");
  const mark = text.indexOf("?");
  let list: string | null = null;
  if (colon !== -1) {
    list = text.slice(colon + 1);
  } else if (mark !== -1 && text.slice(mark + 1).trim() !== "") {
    list = text.slice(mark + 1);
  }
  if (list === null) return null;

  const options: string[] = [];
  const seen = new Set<string>();
  for (const part of list.split(/\s*,\s*|\s+or\s+|\s*;\s*/i)) {
    const option = cleanOption(part);
    const key = option.toLowerCase();
    if (option === "" || seen.has(key)) continue;
    if (option.length > MAX_OPTION_LENGTH) return null;
    seen.add(key);
    options.push(option);
  }
  if (options.length < 2 || options.length > MAX_OPTIONS) return null;
  return options;
}

const SCALE_PATTERNS: RegExp[] = [
  /\b(?:scale|range)\s+(?:of\s+|from\s+)?(-?\d+)\s*(?:to|-|–|—)\s*(-?\d+)/i,
  /\b(-?\d+)\s*(?:-|–|—|to)\s*(-?\d+)\s+scale\b/i,
  /\bfrom\s+(-?\d+)\s+to\s+(-?\d+)\b/i,
  /\((-?\d+)\s*(?:-|–|—|to)\s*(-?\d+)\)/,
];

/**
 * Finds the rating scale a question names, e.g. "on a scale of 1 to 5" or
 * "out of 10". Jev rates on descriptive levels; code maps the result onto this
 * scale, so any range works. `scale` is null when the question names none.
 */
export function extractScale(question: string): ScaleParse {
  let scale: Scale | null = null;
  for (const pattern of SCALE_PATTERNS) {
    const match = question.match(pattern);
    if (match) {
      scale = { min: Number(match[1]), max: Number(match[2]) };
      break;
    }
  }
  if (!scale) {
    const outOf = question.match(/\bout\s+of\s+(\d+)\b/i);
    if (outOf) scale = { min: 0, max: Number(outOf[1]) };
  }
  if (!scale) return { ok: true, scale: null };

  if (scale.min >= scale.max) {
    return {
      ok: false,
      reason: `The scale ${scale.min} to ${scale.max} must go from a lower to a higher number.`,
    };
  }
  return { ok: true, scale };
}
