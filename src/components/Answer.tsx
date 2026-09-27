import Link from "next/link";
import type { Outcome, SupportedKind } from "@/lib/jev";
import { EXAMPLES } from "@/lib/examples";

const pct = (p: number) => `${Math.round(p * 100)}%`;

function Card({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted">
        {label}
      </p>
      {children}
    </section>
  );
}

function Bar({ value, tone = "accent" }: { value: number; tone?: "accent" | "dim" }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-track">
      <div
        className={`h-full rounded-full ${tone === "accent" ? "bg-brand-blue" : "bg-muted"}`}
        style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }}
      />
    </div>
  );
}

function YesNo({ yes }: { yes: number }) {
  const close = yes > 0.4 && yes < 0.6;
  const answer = yes >= 0.5 ? "Yes" : "No";
  const sure = yes >= 0.5 ? yes : 1 - yes;
  return (
    <Card label="Yes / no answer">
      <p className="text-4xl font-semibold">
        {close ? "Too close to call" : answer}
      </p>
      <p className="mt-2 text-sm text-muted">
        {close
          ? `Jev leans ${answer.toLowerCase()}, at ${pct(sure)}.`
          : `Jev is ${pct(sure)} sure.`}
      </p>
      <div className="mt-5 flex items-center gap-3 text-sm">
        <span className="w-8 text-muted">Yes</span>
        <Bar value={yes} />
        <span className="w-10 text-right tabular-nums">{pct(yes)}</span>
      </div>
    </Card>
  );
}

function PickOne({
  choice,
  options,
}: Extract<Outcome, { kind: "pick_one" }>) {
  return (
    <Card label="Pick-one answer">
      <p className="text-4xl font-semibold break-words">{choice}</p>
      <ul className="mt-5 space-y-3 text-sm">
        {options.map((o) => (
          <li key={o.label} className="grid grid-cols-[minmax(0,14rem)_1fr_3rem] items-center gap-3">
            <span className={`truncate ${o.none ? "italic text-muted" : ""}`} title={o.label}>
              {o.label}
            </span>
            <Bar value={o.probability} tone={o.none ? "dim" : "accent"} />
            <span className="text-right tabular-nums">{pct(o.probability)}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function Rate({
  scale,
  defaulted,
  rating,
  confidence,
  distribution,
}: Extract<Outcome, { kind: "rate" }>) {
  const peak = Math.max(...distribution.map((d) => d.probability), 0.0001);
  return (
    <Card label="Rating">
      <p className="text-4xl font-semibold tabular-nums">
        {rating.toFixed(1)}
        <span className="text-xl font-normal text-muted"> / {scale.max}</span>
      </p>
      <p className="mt-2 text-sm text-muted">
        Expected rating on a {scale.min}–{scale.max} scale
        {defaulted ? " (no scale was given, so Jev used 1 to 10)" : ""}. Jev’s
        confidence is {pct(confidence)}.
      </p>
      <div className="mt-5 flex h-28 items-end gap-1" aria-label="Probability of each rating">
        {distribution.map((d) => (
          <div key={d.value} className="flex flex-1 flex-col items-center gap-1">
            <div
              className="w-full rounded-t bg-brand-blue"
              style={{ height: `${(d.probability / peak) * 80}px` }}
              title={`${d.value}: ${pct(d.probability)}`}
            />
            <span className="text-xs text-muted tabular-nums">{d.value}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function Guidance({ reason }: { reason?: string }) {
  return (
    <Card label="Jev can’t answer that yet">
      <p className="text-lg">
        {reason ?? "Jev answers three kinds of question. Try rephrasing yours as one of them:"}
      </p>
      {reason && <p className="mt-2 text-sm text-muted">Jev answers three kinds of question:</p>}
      <dl className="mt-5 space-y-5">
        {(Object.keys(EXAMPLES) as SupportedKind[]).map((kind) => {
          const { label, description, questions } = EXAMPLES[kind];
          return (
            <div key={kind}>
              <dt className="font-medium">{label}</dt>
              <dd className="mt-1 text-sm text-muted">{description}</dd>
              <dd className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                {questions.map((q) => (
                  <Link
                    key={q}
                    href={{ pathname: "/search", query: { q } }}
                    className="text-link hover:underline"
                  >
                    {q}
                  </Link>
                ))}
              </dd>
            </div>
          );
        })}
      </dl>
    </Card>
  );
}

const KIND_LABEL: Record<SupportedKind, string> = {
  yes_no: "a yes/no question",
  pick_one: "a pick-one question",
  rate: "a rating question",
};

export function Answer({ outcome }: { outcome: Outcome }) {
  if (outcome.kind === "unsupported") return <Guidance reason={outcome.reason} />;
  return (
    <div className="space-y-3">
      {outcome.kind === "yes_no" && <YesNo yes={outcome.yes} />}
      {outcome.kind === "pick_one" && <PickOne {...outcome} />}
      {outcome.kind === "rate" && <Rate {...outcome} />}
      <p className="px-1 text-xs text-muted">
        Jev read this as {KIND_LABEL[outcome.kind]} ({pct(outcome.classification.confidence)} confidence).
        Answers are Jev’s judgment from general knowledge, not a cited source.
      </p>
    </div>
  );
}
