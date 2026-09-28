import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { MAX_QUERY_LENGTH, type Outcome } from "@/lib/jev";
import { checkBurst } from "@/lib/quota";
import { search } from "@/lib/search";
import { KIND_LABEL, summarize, type Summary } from "@/lib/summary";
import { WORDMARK } from "@/lib/wordmark";

// The share card: the image link previews show for a search (/card?q=…), or
// a brand card without a question. Satori can't read CSS variables or oklch,
// so the Quarry palette's light theme is spelled out in hex.
const COLOR = {
  background: "#fafcfd",
  card: "#ffffff",
  foreground: "#15191e",
  muted: "#62686f",
  track: "#eef1f4",
  border: "#e0e4e8",
  primary: "#995b00",
  accent: "#fbf2e3",
  accentForeground: "#6b4200",
};

const SIZE = { width: 1200, height: 630 };

const fontsDir = join(process.cwd(), "src/assets/fonts");
const fonts = Promise.all([
  readFile(join(fontsDir, "instrument-sans-latin-400-normal.woff")),
  readFile(join(fontsDir, "instrument-sans-latin-600-normal.woff")),
  readFile(join(fontsDir, "bricolage-grotesque-latin-800-normal.woff")),
]).then(([regular, semibold, display]) => [
  { name: "Instrument Sans", data: regular, weight: 400 as const, style: "normal" as const },
  { name: "Instrument Sans", data: semibold, weight: 600 as const, style: "normal" as const },
  { name: "Bricolage Grotesque", data: display, weight: 800 as const, style: "normal" as const },
]);

/** Answers are the same for everyone, so CDNs keep a card for a day and Jev is asked rarely. */
const CACHED = "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800";

function clip(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

function Wordmark({ height }: { height: number }) {
  return (
    <svg
      viewBox={WORDMARK.viewBox}
      width={(height * WORDMARK.width) / WORDMARK.height}
      height={height}
    >
      <path fill={COLOR.foreground} d={WORDMARK.text} />
      <path fill={COLOR.primary} d={WORDMARK.ai} />
    </svg>
  );
}

function BrandCard() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 40,
        background: COLOR.background,
        fontFamily: "Instrument Sans",
      }}
    >
      <Wordmark height={200} />
      <div style={{ fontSize: 40, color: COLOR.muted }}>
        Ask a question. Get the answer, and how sure it is.
      </div>
    </div>
  );
}

/** A bar for yes/no and pick-one answers; the five levels, with the answer marked, for ratings. */
function Certainty({ outcome, summary }: { outcome: Outcome; summary: Summary }) {
  if (outcome.kind === "rate") {
    return (
      <div style={{ display: "flex", gap: 12 }}>
        {outcome.distribution.map((d) => {
          const top = d.label === outcome.level;
          return (
            <div
              key={d.label}
              style={{
                display: "flex",
                padding: "10px 22px",
                borderRadius: 999,
                fontSize: 28,
                fontWeight: 600,
                background: top ? COLOR.primary : COLOR.track,
                color: top ? COLOR.card : COLOR.muted,
              }}
            >
              {d.label}
            </div>
          );
        })}
      </div>
    );
  }
  return (
    <div style={{ display: "flex", height: 16, borderRadius: 999, background: COLOR.track }}>
      <div
        style={{
          width: `${Math.round((summary.confidence ?? 0) * 100)}%`,
          borderRadius: 999,
          background: COLOR.primary,
        }}
      />
    </div>
  );
}

function AnswerCard({
  question,
  outcome,
  summary,
  host,
}: {
  question: string;
  outcome: Outcome;
  summary: Summary;
  host: string;
}) {
  const answer = clip(summary.answer, 60);
  const answerSize = answer.length <= 10 ? 150 : answer.length <= 20 ? 110 : answer.length <= 36 ? 80 : 60;
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: "56px 72px",
        background: COLOR.background,
        color: COLOR.foreground,
        fontFamily: "Instrument Sans",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Wordmark height={64} />
        <div
          style={{
            display: "flex",
            padding: "8px 20px",
            borderRadius: 999,
            fontSize: 26,
            fontWeight: 600,
            background: COLOR.accent,
            color: COLOR.accentForeground,
          }}
        >
          {KIND_LABEL[summary.kind]} question
        </div>
      </div>
      <div style={{ display: "flex", marginTop: 44, fontSize: 40, fontWeight: 600, color: COLOR.muted }}>
        {clip(question, 110)}
      </div>
      <div
        style={{
          display: "flex",
          flexGrow: 1,
          alignItems: "center",
          fontFamily: "Bricolage Grotesque",
          fontWeight: 800,
          fontSize: answerSize,
          lineHeight: 1.05,
          letterSpacing: "-0.02em",
        }}
      >
        {answer}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "flex", fontSize: 34 }}>{summary.detail}</div>
        <Certainty outcome={outcome} summary={summary} />
        <div style={{ display: "flex", fontSize: 26, color: COLOR.muted }}>
          Ask your own at {host}
        </div>
      </div>
    </div>
  );
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const options = { ...SIZE, fonts: await fonts };
  // A brief cache, so a passing outage or throttle doesn't stick to the link's preview.
  const brief = { ...options, headers: { "Cache-Control": "public, max-age=60, s-maxage=60" } };

  if (q && q.length <= MAX_QUERY_LENGTH) {
    if (!(await checkBurst())) return new ImageResponse(<BrandCard />, brief);
    try {
      const outcome = await search(q);
      const summary = summarize(outcome);
      if (summary) {
        return new ImageResponse(
          <AnswerCard question={q} outcome={outcome} summary={summary} host={request.nextUrl.host} />,
          { ...options, headers: { "Cache-Control": CACHED } },
        );
      }
    } catch (error) {
      console.error("Jev request failed for a share card", error);
      return new ImageResponse(<BrandCard />, brief);
    }
  }
  return new ImageResponse(<BrandCard />, { ...options, headers: { "Cache-Control": CACHED } });
}
