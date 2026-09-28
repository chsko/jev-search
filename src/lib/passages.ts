// Splits pasted text into numbered passages that Jev can point to. A Choice
// question accepts at most 255 options, so long texts are grouped into at most
// MAX_PASSAGES passages of neighbouring sentences.

export const MAX_TEXT_LENGTH = 30_000;
export const MAX_PASSAGES = 250;

/** Splits text into lines, then long lines into sentences, dropping blanks. */
function sentences(text: string): string[] {
  return text
    .split(/\r?\n/)
    .flatMap((line) => line.split(/(?<=[.!?])\s+(?=\S)/))
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter((s) => s !== "");
}

/** Returns at most MAX_PASSAGES passages, in document order. */
export function toPassages(text: string, max = MAX_PASSAGES): string[] {
  const all = sentences(text);
  if (all.length <= max) return all;
  const size = Math.ceil(all.length / max);
  const grouped: string[] = [];
  for (let i = 0; i < all.length; i += size) {
    grouped.push(all.slice(i, i + size).join(" "));
  }
  return grouped;
}

/** The ID Jev uses to point at a passage, e.g. "L007". */
export function passageId(index: number): string {
  return `L${String(index).padStart(3, "0")}`;
}

/** The document as Jev sees it: one tagged passage per line. */
export function tagPassages(passages: string[]): string {
  return passages.map((p, i) => `${passageId(i)}| ${p}`).join("\n");
}
