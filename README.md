# Needle

A search engine that answers questions instead of listing links, powered by
[Jev](https://typesafe.ai), TypeSafe's System One model. Built with Next.js (App Router), TypeScript, Tailwind CSS and
[shadcn/ui](https://ui.shadcn.com), deployed on Vercel.

Needle answers three kinds of question:

| Kind | Example | Answer shown |
| --- | --- | --- |
| Yes / no | *Can penguins fly?* | Yes or no, with its probability |
| Pick one | *Which is the largest planet: Mars, Jupiter or Venus?* | The chosen option, with a probability for each |
| Rating | *How spicy is a jalapeño?* | The most likely of five levels (none to extreme), with a probability for each; a named scale such as "1 to 10" also gets an approximate number |

Anything else gets a message explaining how to phrase the question.

## How it works

`/search?q=…` is a server-rendered page, so the API key stays on the server and
results are shareable links. Each search makes **one** Jev request
(`src/lib/jev.ts`) that asks, in parallel:

- `kind` (choice): which of the three kinds the question is, or `unsupported`;
- `yes_no` (noul): the answer, if it is a yes/no question;
- `pick_one` (choice): the answer among the listed options plus "none of the listed options",
  asked only when code found options after a colon (`src/lib/parse.ts`);
- `rate` (score): the rating on five descriptive levels. Jev judges each level on its own and
  never sees its number, so levels describe situations; code maps the result onto any scale
  the question names (`src/lib/parse.ts`).

Code then uses only the answer matching `kind`. Asking speculatively saves a
second round trip at the cost of a few extra tokens per search.

## Development

```sh
cp .env.example .env.local   # add TYPESAFE_API_KEY
pnpm install
pnpm dev                      # http://localhost:3000
pnpm test                     # unit tests (Jev is faked)
pnpm lint && pnpm typecheck
```

## Deploying to Vercel

1. Import this repository in Vercel (framework preset: Next.js; Vercel detects pnpm from `pnpm-lock.yaml` and `packageManager`).
2. Add `TYPESAFE_API_KEY` under **Settings → Environment Variables** (optionally `TYPESAFE_DEFAULT_MODEL`).
3. Deploy. Every search calls the TypeSafe API with your key, so consider
   Vercel's firewall rate limiting before sharing the URL widely.
