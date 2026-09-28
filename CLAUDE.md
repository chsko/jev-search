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
  the logo and search box morph between home and the results header (names `logo`,
  `search-box`); pages rise in / sink out on `nav-forward` / `nav-back`
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
  factor" re-rank in code (`rank`) with no new request. Expected scores rank options; the
  bars are not shown as magnitudes.

## Deployment

Quairy deploys to Vercel. Use the `vercel` plugin (enabled in `.claude/settings.json`) for
Vercel and Next.js questions, deployments, env vars and logs; its MCP server needs a
one-time Vercel login. Required env var: `TYPESAFE_API_KEY` (server only).

## Commands

Use pnpm (never npm or yarn): `pnpm install`, `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm build`
