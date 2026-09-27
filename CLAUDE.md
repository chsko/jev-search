# CLAUDE.md

@AGENTS.md

## TypeSafe

This project builds on TypeSafe (System One models such as Jev). Use the
`typesafe-ai` skill from the `typesafe@typesafe-ai` plugin (configured in
`.claude/settings.json`) whenever working on this project, and read the live
docs at https://docs.typesafe.ai/llms.txt before writing integration code.

## Design

- UI is built with shadcn/ui (`components.json`, components in `src/components/ui`).
  Follow the `shadcn` skill in `.claude/skills/shadcn`: compose existing components,
  use semantic tokens (`bg-primary`, `text-muted-foreground`), never raw colours.
  Add components with `pnpm dlx shadcn@latest add <name>`.
- Use the `frontend-design` plugin skill for visual direction, and the
  `web-design-guidelines` skill to review UI changes.
- Theme tokens live in `src/app/globals.css`: violet `--primary` is the only accent.
  Dark mode follows the system setting (Tailwind's media-query `dark` variant).
- The logo (`src/components/Logo.tsx`) is Bricolage Grotesque ExtraBold outlines
  with a gauge replacing the dot of the "j"; the favicon (`src/app/icon.svg`) is the gauge.
  Copy is sentence case.

## Commands

Use pnpm (never npm or yarn): `pnpm install`, `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm build`
