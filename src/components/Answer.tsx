import { MessageCircleQuestionIcon } from "lucide-react";
import { ExampleQuestions } from "@/components/ExampleQuestions";
import { RatingChart } from "@/components/RatingChart";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Progress } from "@/components/ui/progress";
import { EXAMPLES } from "@/lib/examples";
import type { Outcome, SupportedKind } from "@/lib/jev";
import { cn } from "@/lib/utils";

const percent = new Intl.NumberFormat("en", { style: "percent", maximumFractionDigits: 0 });
const pct = (p: number) => percent.format(p);

const KIND_LABEL: Record<SupportedKind, string> = {
  yes_no: "Yes or no",
  pick_one: "Pick one",
  rate: "Rating",
};

function AnswerCard({
  outcome,
  answer,
  description,
  children,
}: {
  outcome: Exclude<Outcome, { kind: "unsupported" }>;
  answer: React.ReactNode;
  description: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{KIND_LABEL[outcome.kind]} question</CardDescription>
        <CardTitle className="font-display text-4xl font-bold tracking-tight break-words">
          {answer}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
        <CardAction>
          <Badge variant="secondary" title="How sure Jev is about the kind of question">
            Read as {KIND_LABEL[outcome.kind].toLowerCase()}, {pct(outcome.classification.confidence)}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent>{children}</CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        Jev’s judgment from general knowledge, not a cited source.
      </CardFooter>
    </Card>
  );
}

function ProbabilityRow({
  label,
  probability,
  muted,
}: {
  label: string;
  probability: number;
  muted?: boolean;
}) {
  return (
    <li className="grid grid-cols-[minmax(0,14rem)_1fr_3rem] items-center gap-3 text-sm">
      <span className={cn("truncate", muted && "text-muted-foreground italic")} title={label}>
        {label}
      </span>
      <Progress value={probability * 100} aria-label={`${label}: ${pct(probability)}`} />
      <span className="text-right tabular-nums">{pct(probability)}</span>
    </li>
  );
}

export function Guidance({ reason }: { reason?: string }) {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <MessageCircleQuestionIcon />
        </EmptyMedia>
        <EmptyTitle>Jev can’t answer that yet</EmptyTitle>
        <EmptyDescription>
          {reason ?? "Jev answers three kinds of question. Rephrase yours as one of these:"}
          {reason && " Jev answers three kinds of question:"}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent className="max-w-xl items-stretch gap-6 text-left">
        {(Object.keys(EXAMPLES) as SupportedKind[]).map((kind) => {
          const { label, description, questions } = EXAMPLES[kind];
          return (
            <div key={kind} className="flex flex-col gap-2">
              <div>
                <h2 className="font-display font-semibold">{label}</h2>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
              <ExampleQuestions questions={questions} />
            </div>
          );
        })}
      </EmptyContent>
    </Empty>
  );
}

export function Answer({ outcome }: { outcome: Outcome }) {
  switch (outcome.kind) {
    case "unsupported":
      return <Guidance reason={outcome.reason} />;
    case "yes_no": {
      const yes = outcome.yes;
      const answer = yes >= 0.5 ? "Yes" : "No";
      const close = yes > 0.4 && yes < 0.6;
      return (
        <AnswerCard
          outcome={outcome}
          answer={close ? "Too close to call" : answer}
          description={
            close
              ? `Jev leans ${answer.toLowerCase()}, at ${pct(Math.max(yes, 1 - yes))}.`
              : `Jev is ${pct(Math.max(yes, 1 - yes))} sure.`
          }
        >
          <ul className="flex flex-col gap-3">
            <ProbabilityRow label="Yes" probability={yes} />
            <ProbabilityRow label="No" probability={1 - yes} />
          </ul>
        </AnswerCard>
      );
    }
    case "pick_one":
      return (
        <AnswerCard
          outcome={outcome}
          answer={outcome.choice}
          description={`Jev is ${pct(outcome.confidence)} confident in this pick.`}
        >
          <ul className="flex flex-col gap-3">
            {outcome.options.map((o) => (
              <ProbabilityRow key={o.label} label={o.label} probability={o.probability} muted={o.none} />
            ))}
          </ul>
        </AnswerCard>
      );
    case "rate":
      return (
        <AnswerCard
          outcome={outcome}
          answer={
            <>
              {outcome.rating.toFixed(1)}
              <span className="text-xl font-medium text-muted-foreground"> out of {outcome.scale.max}</span>
            </>
          }
          description={`Expected rating on a ${outcome.scale.min} to ${outcome.scale.max} scale${
            outcome.defaulted ? ", since the question didn’t name one" : ""
          }. Jev is ${pct(outcome.confidence)} confident.`}
        >
          <RatingChart distribution={outcome.distribution} />
        </AnswerCard>
      );
  }
}
