# Jev Search

A search page that answers questions with [Jev](https://typesafe.ai), TypeSafe's
System One model. Built with Next.js (App Router), TypeScript, Tailwind CSS and
[shadcn/ui](https://ui.shadcn.com), deployed on Vercel.

Jev answers three kinds of question:

| Kind | Example | Answer shown |
| --- | --- | --- |
| Yes / no | *Can penguins fly?* | Yes or no, with Jev's probability |
| Pick one | *Which is the largest planet: Mars, Jupiter or Venus?* | The chosen option, with a probability for each |
| Rating | *On a scale of 1 to 5, how spicy is a jalapeño?* | Expected rating and its distribution (1–10 if no scale is given) |

Anything else gets a message explaining how to phrase the question.

## How it works

`/search?q=…` is a server-rendered page, so the API key stays on the server and
results are shareable links. Each search makes **one** Jev request
(`src/lib/jev.ts`) that asks, in parallel:

- `kind` (choice): which of the three kinds the question is, or `unsupported`;
- `yes_no` (noul): the answer, if it is a yes/no question;
- `pick_one` (choice): the answer among the listed options plus "none of the listed options",
  asked only when code found options after a colon (`src/lib/parse.ts`);
- `rate` (score): the rating, one level per step of the scale code found in the question.

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
