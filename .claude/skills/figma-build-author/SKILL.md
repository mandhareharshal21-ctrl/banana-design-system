---
name: figma-build-author
description: Authoring discipline for the Banana design system's Figma build pipeline. Use when adding or editing Figma component build-specs (packages/figma-plugin/scripts/generate-component-specs.mjs and specs/components/*.json), editing the variables spec (generate-variables-spec.mjs / specs/variables.json), or improving Figma build fidelity and variable binding. Apply before authoring any spec the plugin will materialize in Figma.
---

# Figma build-author

How to author specs the Banana Figma plugin renders well, with everything bound to variables.
This is authoring discipline — for the Pull/Build/Push operating flow see `docs/figma-workflow.md`,
and treat `packages/figma-plugin/src/types.ts` as the schema source of truth.

## How the pipeline works (1-paragraph mental model)

Tokens (`packages/tokens`) are the single source of truth. Two generators read them:
`generate-variables-spec.mjs` → `specs/variables.json` (+ `specs/text-styles.json`), and
`generate-component-specs.mjs` → one `specs/components/<slug>.json` per component + a
`specs/components.json` manifest. The plugin fetches these from **GitHub `main`** at runtime, then the
sandbox renderer (`src/code.ts`) materializes Figma Variables (Pull) and component sets (Build). Paints
bind to variables **only if** their variable name already exists in the file (i.e. Pull ran first).

## Golden rules

1. **Generate, never hand-edit JSON.** Add or edit a builder function in
   `generate-component-specs.mjs`, register it in the `BUILDERS` array (this also adds it to the plugin's
   Build list via `components.json`), then rebuild: `pnpm --filter @banana/figma-plugin build`. Editing a
   `specs/*.json` by hand will be overwritten on the next build.
2. **Bind every paint to a variable.** Use the `c('color/...')` helper for every `fill`, `stroke`, and
   `textColor` so each `PaintRef` carries a `var`. A `PaintRef` with no `var` (or a `var` that doesn't
   match a real variable) silently renders as an **unbound plain hex** — see `paintOf` and the
   bound-vs-plain counters in `code.ts`. The variable name must exactly match one emitted by
   `generate-variables-spec.mjs` (e.g. `color/brand/yellow`, `color/border`, `color/text/onAccent`).
3. **Pull before Build.** Pull populates the file's variables so binding can resolve; Build also
   self-hydrates from local variables (`hydrateVarMap`), but Pull-first guarantees names exist.
4. **Confirm 0 plain paints.** After Build, the plugin log reports `N bound / M plain`. `M` should be 0.
   If not, a `var` name is wrong or the variable wasn't pulled.
5. **Push before you expect to see it.** The plugin reads specs from GitHub `main` — an unpushed commit
   means Build keeps producing the *old* component. Always `git push` after `pnpm --filter
   @banana/figma-plugin build` + commit.

## Supported node DSL (`NodeSpec` in `types.ts`)

A node is a **text node** if `text` is set, otherwise an **auto-layout frame**.

- **Frame:** `layout` (`HORIZONTAL`|`VERTICAL`), `padding` `[top,right,bottom,left]`, `itemSpacing`,
  `primaryAxisAlign` / `counterAxisAlign` (`MIN`|`CENTER`|`MAX`[|`SPACE_BETWEEN`]), `cornerRadius`,
  `fill`, `stroke`, `strokeWeight`, `opacity`, `fixedWidth`/`fixedHeight` (+ `width`/`height`),
  `shadow` `{x, y, color}` (a single hard drop shadow — **blur is always 0**), `children`.
- **Text:** `text`, `fontStyle` (`Regular`|`Medium`|`Bold`), `mono` (Space Mono vs Space Grotesk),
  `letterSpacing`, `textColor`, `bindText` (wires the characters to a TEXT component property).
- **Variants & properties:** a `ComponentSetSpec` has `variants: [{ props, node }]`; `props` keys
  (e.g. `{ Variant:'Primary', State:'Hover' }`) become Figma VARIANT properties via
  `combineAsVariants`. Declare TEXT/BOOLEAN component properties in `properties`.

Generator helpers already available: `c(path)` (bound paint), `f(opts)` (frame; pass `radius` for
corner radius), `t(text, opts)` (text), `glyph(opts)` (box icon stand-in; pass `radius`), `border()`
(→ `color/border`), `SH.sm|md|lg` (hard shadow offsets), `SIZE.xs…xxl` (font sizes), `STATES`.

## Renderer limits — design around these

- **Only COLOR paints bind.** FLOAT/STRING/BOOLEAN variables exist but are **not** wired to sizes,
  spacing, or radius — those stay raw numbers in the spec. Don't expect dimension tokens to bind.
- **Shadows:** exactly one DROP_SHADOW per node, blur forced to 0, no spread, no inner shadow.
- **Fonts:** text is Space Grotesk (or Space Mono when `mono`), `fontStyle` limited to
  Regular/Medium/Bold; resolver falls back Space Grotesk → Inter → Roboto if a font is missing.
- **Not supported:** images, vector/SVG icons (use the `glyph` box as a placeholder), gradients,
  layout constraints, nested component instances, "fill container"/grow sizing.

## Neo-brutalist quality bar (`docs/neo-brutalism.md`)

- Square corners (`cornerRadius: 0`) **unless** a component deliberately differs (e.g. the pill Switch).
- Thick solid borders via `border()` + `strokeWeight` (`border.width.regular` = 3px).
- Hard offset shadows (`SH.*`), no blur. Hover = larger shadow; Active = shadow collapses (no shadow).
- Bold display / mono type. Disabled = `opacity 0.5`.
- Complete, consistent variant × state matrices (mirror the `button()` builder's `Variant × State`).

## Pre-Build checklist

- [ ] Builder added/edited and present in `BUILDERS`.
- [ ] Every fill/stroke/textColor uses `c(...)`; names match `specs/variables.json`.
- [ ] `pnpm --filter @banana/figma-plugin build` run (regenerates specs + bundle); `typecheck` + `lint` clean.
- [ ] New tokens? Regenerate `variables.json` too, and re-run **Pull** in Figma.
- [ ] Committed **and pushed** to `main`.
- [ ] In Figma: Pull, then Build; log shows **0 plain** paints; screenshot matches the intended design.
