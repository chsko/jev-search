import { OPERATOR } from "@/lib/legal";

/** A terms or policy page: a title, when it last changed, then numbered-free plain sections. */
export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <article className="flex flex-col gap-8 text-[15px] leading-relaxed">
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">Last updated {updated}</p>
      </header>
      {children}
    </article>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-display text-xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export function List({ children }: { children: React.ReactNode }) {
  return <ul className="flex list-disc flex-col gap-1.5 pl-5 marker:text-muted-foreground">{children}</ul>;
}

export function Email() {
  return (
    <a href={`mailto:${OPERATOR.email}`} className="font-medium underline underline-offset-4">
      {OPERATOR.email}
    </a>
  );
}

/** Who runs Quairy and how to reach them. */
export function OperatorDetails() {
  return (
    <p>
      Quairy is run by {OPERATOR.name}
      {OPERATOR.organisationNumber
        ? `, a sole proprietorship in ${OPERATOR.country} (organisation number ${OPERATOR.organisationNumber})`
        : `, a private individual in ${OPERATOR.country}`}
      .
      {OPERATOR.address ? ` Address: ${OPERATOR.address}.` : ""} You can reach us at <Email />.
    </p>
  );
}
