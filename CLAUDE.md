# CLAUDE.md

The product is **Needle**, a search engine whose answers come from TypeSafe's Jev model.
Don't brand the product with "Jev" (it is TypeSafe's model name); UI copy speaks as
Needle and only the footer credits Jev.

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
- Theme tokens live in `src/app/globals.css`: violet `--primary` is the only accent.
  Dark mode follows the system setting (Tailwind's media-query `dark` variant).
- The logo (`src/components/Logo.tsx`) is Bricolage Grotesque ExtraBold outlines of
  "needle" with the "l" drawn as a violet sewing needle (search: a needle in a haystack;
  judgment: where the needle lands). The favicon (`src/app/icon.svg`) is a dial whose
  pointer is that needle.
  Copy is sentence case.

## Jev integration notes

- Score levels must describe situations: Jev never sees a level's number, and the API
  accepts at most 10 levels. Ratings use five fixed levels (`RATING_LEVELS` in
  `src/lib/jev.ts`); code maps the most probable level onto any scale the user names.
- Don't present a score's expected value as an exact magnitude between levels.

## Commands

Use pnpm (never npm or yarn): `pnpm install`, `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm build`
