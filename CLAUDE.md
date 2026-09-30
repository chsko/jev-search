# CLAUDE.md

The product is **Quairy** (query + AI, and the quarry you hunt), a search engine whose
answers come from TypeSafe's Jev model.
Don't brand the product with "Jev" (it is TypeSafe's model name); UI copy speaks as
Quairy and only the footer credits Jev.

@AGENTS.md

## TypeSafe

This project builds on TypeSafe (System One models such as Jev). Use the
`typesafe-ai` skill from the `typesafe@typesafe-ai` plugin (configured in
`.claude/settings.json`) whenever working on this project, and read the live
docs at https://docs.typesafe.ai/llms.txt before writing integration code.

## Design

- UI is built with shadcn/ui, style `radix-nova` (`components.json`, components in
  `src/components/ui`). `pnpm dlx shadcn@latest apply` resets `globals.css` and fonts to
  neutral defaults; restore the Jev theme and fonts afterwards.
  Follow the `shadcn` skill in `.claude/skills/shadcn`: compose existing components,
  use semantic tokens (`bg-primary`, `text-muted-foreground`), never raw colours.
  Add components with `pnpm dlx shadcn@latest add <name>`.
- Use the `frontend-design` plugin skill for visual direction, and the
  `web-design-guidelines` skill to review UI changes.
- Theme tokens live in `src/app/globals.css` (the Quarry palette): cool slate neutrals and
  one ochre `--primary` accent. Keep button text at 4.5:1 contrast or better.
  Dark mode follows the system setting (Tailwind's media-query `dark` variant).
- The logo (`src/components/Logo.tsx`) is Bricolage Grotesque ExtraBold outlines of
  "quairy" with the "ai" in the accent colour (`fill-primary`). The favicon
  (`src/app/icon.svg`) is a white "q" on an accent tile; its colour is hard-coded, so
  regenerate it when the accent changes.
  Copy is sentence case.
- Search uses React `<ViewTransition>` (follow `.claude/skills/vercel-react-view-transitions`):
  the logo, search box and account buttons morph between pages (names `logo`,
  `search-box`, `account`; render one `Account` per page, aligned to the `max-w-3xl` column); pages rise in / sink out on `nav-forward` / `nav-back`
  (`src/components/Transitions.tsx`); answers rise in when they load. CSS lives at the end
  of `globals.css`, including the reduced-motion override.

## Jev integration notes

- Score levels must describe situations: Jev never sees a level's number, and the API
  accepts at most 10 levels. Ratings use five fixed levels (`RATING_LEVELS` in
  `src/lib/jev.ts`); code maps the most probable level onto any scale the user names.
- Don't present a score's expected value as an exact magnitude between levels.
- "Ask about a text" (`/text`, server action in `src/app/text/actions.ts`): `toPassages`
  (`src/lib/passages.ts`) splits the text into at most 250 tagged passages (`L000| …`; a
  Choice takes at most 255 options). The same request adds a Noul "does the text answer
  this" (below 0.35: "Your text doesn't say"; 0.35–0.7: partly) and a Choice over passage
  IDs for the evidence, following TypeSafe's line-by-line search cookbook. Answers use
  "only what `document` states or directly implies". Max text: 30,000 characters.
- Compare (`/search/compare?q=…`, `src/lib/compare.ts`) follows TypeSafe's composite-scoring
  pattern: one request with a Noul per quality in `QUALITIES` ("does it matter here?") and a
  three-level Score per option × quality (at most 4 options). Jev selects qualities from the
  library rather than inventing them; everything is scored up front, so sliders and "Add a
  factor" and removing one re-rank in code (`rank`) with no new request. Expected scores rank options; the
  bars are not shown as magnitudes.
  Compare only trade-offs: `tradeoffQuestion()` (a Noul, also asked speculatively in web
  pick-one searches) gates the button and the page; questions of fact ("largest planet")
  get "Nothing to compare here". Never pad the suggested qualities with irrelevant ones;
  fewer than two relevant qualities means "no factors".

- Sharing: search pages carry the answer in their metadata, and `/card?q=…`
  (`src/app/card/route.tsx`, `next/og`) renders the preview image (a brand card without `q`, for
  unsupported questions, or on errors). `search` (`src/lib/search.ts`) is wrapped in React
  `cache` so the page and its metadata share one Jev request; cards are CDN-cached for a day.
  Answer wording lives in `summarize` (`src/lib/summary.ts`), shared by the answer card and the
  share card. Satori can't read CSS variables, so the card spells out the light Quarry palette in
  hex; update it when the palette changes. Answers about a pasted text have no Share button.

## Free and Pro

- Free: `FREE_DAILY_SEARCHES` (10) distinct web searches a day (UTC), counted in Upstash Redis
  per Clerk user or, signed out, per IP (`checkSearch` in `src/lib/quota.ts`, React `cache`d so
  page and metadata count once; repeats of a question are free; link-preview bots aren't
  counted). Over the limit, metadata must not carry the answer. Compare and "Ask about a text"
  cost up to 10x a search, so they share their own allowance, `FREE_DAILY_EXTRAS` (3) a day
  (`checkExtra`; repeating the same comparison or question on the same text is free).
  Every Jev entry point (search, `/card`, `/text`, Compare) passes `checkBurst` (30/min per IP).
- Pro (`src/lib/pricing.ts`, €4/month or €30/year, one Stripe product with a price per interval,
  chosen with native radios on the Pro card that submit with the subscribe form): unlimited searches, comparisons and text questions, and search history (Redis sorted set
  per user). Stripe Checkout + customer portal (`src/lib/billing.ts`, `src/app/pro`); the price
  is found or created by lookup key. `syncSubscription` copies the latest subscription into
  Redis and is the only writer: the webhook (`/api/stripe/webhook`, needs
  `STRIPE_WEBHOOK_SECRET`) and the post-checkout page both call it.
- Auth is Clerk (`src/proxy.ts`, public-first; `ClerkProvider` with the shadcn theme in the root
  layout; sign-in and sign-up live in-app at `/sign-in` and `/sign-up`, never Clerk's hosted pages,
  so they keep the Quarry theme). Keep `Account` a client component: server-side `<Show>` makes every page dynamic.
- Integrations are provisioned through the Vercel Marketplace (Clerk, Stripe, Upstash); env vars
  come from `vercel env pull`. Production Clerk needs DNS records for the domain.

## Deployment

Quairy deploys to Vercel. Use the `vercel` plugin (enabled in `.claude/settings.json`) for
Vercel and Next.js questions, deployments, env vars and logs; its MCP server needs a
one-time Vercel login. Required env var: `TYPESAFE_API_KEY` (server only).

## Dependencies and CI

`.github/workflows/ci.yml` runs lint, typecheck, test and build on every pull request and push
to main, with no secrets (nothing that needs a key runs at build time; keep it that way).
Dependabot (`.github/dependabot.yml`) proposes npm and Actions updates weekly, only once a
version is 7 days old (`cooldown`); minor and patch updates are grouped.
`dependabot-automerge.yml` squash-merges a Dependabot pull request after CI succeeds on its
current head commit, if every update in it is minor or patch (read from the `update-type`
lines of Dependabot's commit message); failing updates and major updates stay open for a human.

## Commands

Use pnpm (never npm or yarn): `pnpm install`, `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm build`
