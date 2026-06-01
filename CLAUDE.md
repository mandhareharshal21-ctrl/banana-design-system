# CLAUDE.md — Banana Design System (Master Reference)

> This is the durable, authoritative reference for this repository. Read it first in every session.
> It must be updated whenever the user declares a **major version** bump (see Version-Update Protocol).

## 1. Project overview & goals

Banana Design System is a **long-term, reusable Neo-Brutalist design system** layered on **Material UI**,
with a **code-first → Figma round-trip** workflow. The repo is a pnpm monorepo intended to seed future
projects, so it is structured for reuse from day one, with Dependabot + CI from the first commit.

End-to-end pipeline:
**Define neo-brutalism → consume MUI → Dependabot → apply theme → host on Storybook → review → refine →
set up Figma variables (own plugin) → build Figma components (git-spec pull) → refine in Figma →
per-component improvement loop driven by shared Figma designs.**

## 2. Locked architectural decisions

- **MUI usage**: consume `@mui/material` as an npm **dependency** + a custom theme/wrappers. NOT a fork of
  the MUI monorepo. Keeps Dependabot upgrades clean.
- **Figma integration**: REST Variables write is Enterprise-only, so we ship our **own first-party Figma
  plugin** (`packages/figma-plugin`) as the **bulk** variable-sync + multi-component build path. No Tokens
  Studio, no third-party/bridge MCP. **Update (2026-06-01):** the Figma MCP tool **`use_figma`** runs the
  full Figma Plugin API by `fileKey` and **is** a sanctioned high-fidelity write path — it is the
  **primary** tool for replicating/correcting a single component exactly from code (the plugin DSL only
  approximates: single blur-0 shadow, only COLOR binds, raw-number geometry). The plugin stays the bulk
  Pull/Build/Push mechanism; `use_figma` is the precision per-component tool.
- **Claude → Figma channel**: two paths — (1) **git-spec pull** (Claude authors JSON specs → plugin pulls
  + renders → exports state → git) for bulk work; (2) **`use_figma` MCP** for exact per-component
  replication, verified by `get_screenshot` diff vs Storybook. See `.claude/skills/figma-build-author`.
- **Repo**: `banana-design-system`, public, GitHub `mandhareharshal21-ctrl`.
- **Structure**: pnpm monorepo (workspaces). **Hosting**: Storybook → GitHub Pages.
- **First components**: Button, TextField, Card, Checkbox, Switch, Badge, Typography, Container.

**Single source of truth for design decisions** = the DTCG token JSON in `packages/tokens/src`. It feeds
both code (Style Dictionary → MUI theme) and Figma (own plugin → Variables), so the two never drift.

## 3. Repo map

```
packages/tokens/        @banana/tokens     — DTCG design tokens + Style Dictionary build (CSS vars + TS theme)
packages/mui-neo/       @banana/mui-neo    — the design system: createNeoBrutalistTheme() + components
packages/figma-plugin/  @banana/figma-plugin — Figma plugin: GitHub<->Figma variables + component build/push
apps/docs/              @banana/docs       — Storybook (deployed to GitHub Pages)
docs/neo-brutalism.md                      — definition + stylization rules
docs/figma-workflow.md                     — token→variable→component runbook (+ PAT setup)
.github/dependabot.yml, workflows/         — Dependabot + CI + Pages deploy
.changeset/                                — Changesets versioning
.claude/skills/figma-build-author/         — project skill: replicate Banana components in Figma (use_figma) + plugin spec discipline
.claude/skills/figma-replicate-from-code/  — generic, portable skill: replicate any coded component in Figma via use_figma (no project specifics)
figma-MCP.SKILL.md                         — root-level readable copy of the portable skill (for discovery/sharing; active copy lives in .claude/skills/)
```

## 4. Tooling

TypeScript · React 19 · MUI v7 (Emotion) · tsup (package builds) · owned DTCG token builder
(`packages/tokens/build.mjs` → CSS vars + typed TS; chosen over Style Dictionary to avoid its
composite-shadow/alias quirks) · esbuild (Figma plugin bundle) · Storybook 8 (React-Vite) ·
Changesets (versioning) · ESLint + Prettier · Vitest + Testing Library.

## 5. Pipeline phases & current status

- [x] Phase 0 — Repo + infra bootstrap (pushed to GitHub, CI green, Pages live, Dependabot active)
- [x] Phase 1 — Define neo-brutalism (`docs/neo-brutalism.md`)
- [x] Phase 2 — Tokens + theme (owned DTCG builder → CSS/TS; `createNeoBrutalistTheme()`)
- [x] Phase 3 — Core components + tests (Button, TextField, Card, Checkbox, Switch, Badge, Typography, Container)
- [x] Phase 4 — Storybook → GitHub Pages (live: https://mandhareharshal21-ctrl.github.io/banana-design-system/)
- [ ] Phase 5 — User review + refinement (NEXT: user reviews hosted Storybook)
- [~] Phase 6 — Figma plugin + variable sync — plugin built & committed; `specs/variables.json` generated. Pending: run Pull in Figma.
- [~] Phase 7 — Build components in Figma — Button build-spec authored (`specs/components/button.json`). Pending: run Build in Figma.
- [~] Phase 8 — Refine in Figma, plugin pushes back — Push code written. Pending: exercise round-trip in Figma.
- [ ] Phase 9 — Per-component improvement loop (steady state)

> Keep this checklist current as phases complete.

## 6. Commands cheat-sheet

```
pnpm install              # install all workspaces
pnpm build                # build all packages (tsup)
pnpm tokens:build         # build design tokens only
pnpm test                 # run all tests (Vitest)
pnpm typecheck            # typecheck all workspaces
pnpm lint / pnpm format   # lint / format
pnpm storybook            # run Storybook locally
pnpm build-storybook      # build static Storybook
pnpm changeset            # author a changeset
pnpm version              # apply changesets -> bump versions + changelog
```

## 7. Figma workflow

See `docs/figma-workflow.md`. **Bulk path:** tokens (source of truth) → `figma-plugin/specs/*.json` → run
the plugin in Figma (Pull = create Variables, Build = create components, Push = export state back to
GitHub). Requires a GitHub PAT scoped to this repo, entered in the plugin UI.

**Precision path (per component):** read the coded `Mui<X>` override + tokens → replicate exactly with the
`use_figma` MCP (full Plugin API: exact geometry, hard shadows, fonts, and paints **bound** to the
already-pulled `Banana` variables) → verify by `get_screenshot` diff vs the Storybook render. The
**`figma-build-author`** skill (`.claude/skills/figma-build-author/SKILL.md`) auto-surfaces this discipline
and the recipes for the four discrepancy classes (geometry, shadow, typography, variable binding). A
**generic, project-agnostic** version of the same `use_figma` discipline lives in
`.claude/skills/figma-replicate-from-code/SKILL.md` — portable for any design system, no Banana/neo-brutalist
specifics. Precision builds are **on-demand only** (run when explicitly asked); the plugin remains the
default bulk-build path. Proven end-to-end on the **Slider** (2026-06-01): built via `use_figma`, all paints
bound (`get_variable_defs` confirmed `color/white`, `color/border`, `color/brand/yellow`), geometry + hard
shadow matched the coded override.

## 8. Version Log

| Version | Date | Summary |
| ------- | ---- | ------- |
| 0.1.0   | 2026-05-31 | Initial scaffold: monorepo, infra, Dependabot, CI, Pages, Changesets. |

## 9. Version-Update Protocol (user-triggered)

The **user** decides when a major version happens. On each declared major bump:
1. Append a dated row to the **Version Log** (version, date, summary/scope).
2. Update the repo map / tooling / phase-status sections for any architectural deltas.
3. Ensure the Changesets release + git tag match the recorded version.

This keeps CLAUDE.md the authoritative, current reference across all future sessions.
