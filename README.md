# Banana Design System

A **Neo-Brutalist design system** layered on [Material UI](https://mui.com), with a code-first → Figma
round-trip workflow. Built as a reusable pnpm monorepo to seed future projects.

> For the full architecture, decisions, and workflow, see [`CLAUDE.md`](./CLAUDE.md).

## Packages

| Package | Description |
| ------- | ----------- |
| `@banana/tokens` | DTCG design tokens + Style Dictionary build (CSS vars + TS theme). |
| `@banana/mui-neo` | The design system: `createNeoBrutalistTheme()` + components. |
| `@banana/figma-plugin` | Figma plugin syncing tokens↔Variables and building components from specs. |
| `@banana/docs` | Storybook component showcase (deployed to GitHub Pages). |

## Getting started

```bash
pnpm install
pnpm build          # build tokens + design system
pnpm storybook      # explore components locally
```

## Documentation

- [Neo-Brutalism definition & rules](./docs/neo-brutalism.md)
- [Figma workflow](./docs/figma-workflow.md)

## License

MIT
