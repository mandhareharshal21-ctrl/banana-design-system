---
name: figma-build-author
description: Precision discipline for replicating Banana design-system components in Figma so the canvas matches the code exactly. Use when building/replicating/correcting a Banana component in Figma via the Figma MCP (`use_figma`), when fixing geometry/spacing, shadow, typography, or variable-binding discrepancies between the repo and a Figma file, or when authoring/editing the custom plugin's build-specs (packages/figma-plugin/scripts/generate-component-specs.mjs, specs/components/*.json) or the variables spec. Apply before writing any Figma or any spec the plugin will materialize.
---

# Figma build-author

How to make a Banana component in Figma look **identical to the coded component**, with every paint bound
to a variable. The code is the source of truth; Figma is the replica. For the Pull/Build/Push operating
flow see `docs/figma-workflow.md`; treat `packages/figma-plugin/src/types.ts` as the plugin schema source.

## The one rule that fixes discrepancies

**Never eyeball. Copy the numbers from the code.** Every discrepancy (wrong size, blurred shadow, wrong
font, plain-hex fill) comes from approximating instead of reading the exact value out of
`packages/mui-neo/src/theme/index.ts` and `packages/tokens`. Open the override, resolve the tokens, build
a property table, then reproduce it.

## Two build paths — pick the right one

| Path | Use it for | Fidelity |
| --- | --- | --- |
| **`use_figma` MCP (primary)** | Replicate or correct **one** component exactly from code; fix discrepancies. Runs arbitrary JS via the **full Figma Plugin API** by `fileKey` — no DSL ceiling. | Pixel-exact |
| **Custom plugin (secondary)** | **Pull** variables into the file; **bulk-build** many components from committed `specs/*.json`. | DSL-limited (approximate) |

The plugin's DSL is why builds drift (single blur-0 shadow, only COLOR binds, raw-number geometry). For
anything where the user reports a mismatch, use `use_figma`. **Always run plugin Pull first** so the
`Banana` variable collection exists — `use_figma` binds paints to variables *by name*, and they must
already be in the file.

## Step 1 — Read the coded component (source of truth)

Before touching Figma, open the `components.Mui<X>.styleOverrides` block in
`packages/mui-neo/src/theme/index.ts` and resolve each token from `packages/tokens`. Build a
**variant × state property table** capturing every visual fact:

- size (`width`/`height` or hug), `padding`, `itemSpacing`/gap, `cornerRadius`
- `border` width + color, `fill`
- font family / weight / size / letterSpacing / lineHeight
- shadow offset + color (and which token: `shadow.hard.sm|md|lg`)
- per-state deltas: hover (translate + larger shadow), active (translate + shadow collapse), focus
  (focus ring), disabled (opacity / bg).

CSS pseudo-states (`:hover`, `:active`, `.Mui-disabled`) have no equivalent in a Figma component — encode
each as a **variant** (`State=Default|Hover|Active|Focus|Disabled`), mirroring the existing
`specs/components/button.json` matrix.

### Resolved token values (current — re-read if tokens change)

- Colors: `color/ink` `#000000`, `color/white` `#FFFFFF`, `color/paper` `#FFFDF5`,
  `color/brand/yellow` `#FFD23F`, `color/brand/lime` `#9EFF3F`, `color/brand/cyan` `#3FC1FF`,
  `color/border` = ink `#000000`, `color/text/onAccent` = ink `#000000`, `color/text/disabled` `#9A9A9A`.
- Border width: thin `2`, regular `3`, thick `4` (px). Radius: none `0`, sm `4`, md `8`.
- Shadow (all blur 0, spread 0, color ink): `sm` offset 2/2, `md` 4/4, `lg` 6/6.
- Fonts: **Space Grotesk** (body + display), **Space Mono** (mono). Weight map: 500→`Medium`,
  700→`Bold`. ⚠️ `font.weight.black` is **900** but Space Grotesk ships no Black — use `Bold` and flag it.
- letterSpacing: `wide` 0.04em → Figma `{ value: 4, unit: 'PERCENT' }`; `tight` -0.02em → `-2%`.
- Example — **Button (contained primary, Default)**: fill `color/brand/yellow`, border `3px` `color/border`,
  radius `0`, padding `8/18`, shadow `hard.md` (4/4), label `color/text/onAccent` Space Grotesk **Bold**
  letterSpacing `4%`, textTransform none. Hover → shadow `hard.lg` (6/6). Active → no shadow.
  Focus → 3px cyan ring. Disabled → bg `#E6E6E6`, text/border `color/text/disabled`, no shadow.

## Step 2 — Replicate with `use_figma` (the recipe)

Call `use_figma` with `fileKey` + a `code` string (≤ 50 000 chars). `fileKey` comes from the Figma URL
(`figma.com/design/:fileKey/...`) or `whoami`; the Banana file key is `U0bynIRHU9Y5rDljFuAGqF`.

**Bind every paint to a variable (fixes "plain hex"):**
```js
const vars = await figma.variables.getLocalVariablesAsync();
const byName = new Map(vars.map((v) => [v.name, v]));         // names use "/" groups
const v = byName.get('color/brand/yellow');                   // must exist (Pull first)
let fills = [{ type: 'SOLID', color: { r: 1, g: 0.82, b: 0.247 } }];
fills[0] = figma.variables.setBoundVariableForPaint(fills[0], 'color', v); // returns a bound paint
node.fills = fills;                                            // same pattern for node.strokes / text.fills
```
If `byName.get(...)` is undefined the variable wasn't pulled — stop and run plugin **Pull**, don't fall
back to a literal color (that *is* the discrepancy).

**Exact geometry (fixes size/spacing):** set explicit numbers, never defaults —
`node.layoutMode = 'HORIZONTAL'|'VERTICAL'`; `paddingTop/Right/Bottom/Left`; `itemSpacing`;
`primaryAxisAlignItems`/`counterAxisAlignItems`; `cornerRadius`; `strokeWeight`; `resize(w, h)`; and
`layoutSizingHorizontal/Vertical = 'FIXED'|'HUG'` to match the component's fixed-vs-hug intent.

**Hard neo-brutalist shadow (fixes blur/offset):**
```js
node.effects = [{ type: 'DROP_SHADOW', color: { r: 0, g: 0, b: 0, a: 1 },
  offset: { x: 4, y: 4 }, radius: 0, spread: 0, blendMode: 'NORMAL', visible: true }];
```
`radius: 0` (no blur) and `spread: 0` are non-negotiable; offset comes from the `shadow.hard.*` token.
Active-state variant = `node.effects = []`.

**Typography (fixes wrong font/weight):** load the font **before** setting characters —
```js
await figma.loadFontAsync({ family: 'Space Grotesk', style: 'Bold' });
text.fontName = { family: 'Space Grotesk', style: 'Bold' };
text.fontSize = 16;
text.letterSpacing = { value: 4, unit: 'PERCENT' };
```
Use `Space Mono` for mono labels. If a font isn't installed, `loadFontAsync` throws — fall back to Inter,
whose styles are spelled **`"Semi Bold"` / `"Extra Bold"`** (with a space), and report the substitution.

**Variants:** build one component per row of the table, then
`figma.combineAsVariants(nodes, parentSet)`; name each `State=Hover` etc.

**`use_figma` gotchas:** `getPluginData`/`setPluginData` are unsupported; don't assign `figma.currentPage`
(use `await figma.setCurrentPageAsync(page)`); all variable/font/node lookups are the **async** variants;
keep `code` under 50 000 chars (split a big component set across calls).

## Step 3 — Verify by screenshot diff (close the loop)

After writing, call `get_screenshot` on the built node (and `get_variable_defs` to confirm bindings,
`get_design_context` for detail), render the same component in Storybook (Claude Preview MCP), and compare
against the four classes: **geometry, shadow, typography, variable-binding**. Report drift and iterate the
`use_figma` code until they match. This screenshot diff is the fidelity gate (the plugin equivalent is its
"N bound / 0 plain" log).

## Per-discrepancy quick-fix

| Symptom | Fix | Read from |
| --- | --- | --- |
| Size / padding / radius off | set `resize`, `padding*`, `itemSpacing`, `cornerRadius`, `strokeWeight` to exact px | the `Mui<X>` override |
| Shadow blurred / wrong offset | `effects` DROP_SHADOW, `radius:0`, `spread:0`, offset = token | `shadow.hard.*` |
| Wrong font / weight | `loadFontAsync` then `fontName` Space Grotesk/Mono + style; set `fontSize`/`letterSpacing` | `font.*` tokens |
| Fill/stroke/text plain hex | `setBoundVariableForPaint(paint,'color',byName.get(name))`; Pull if missing | `variables.json` names |

## Neo-brutalist quality bar (`docs/neo-brutalism.md`)

Square corners (radius 0) **unless** a component deliberately differs (e.g. the pill Switch, radius 999).
Thick solid `color/border`. Hard offset shadows, no blur. Hover = larger shadow; Active = shadow collapse.
Bold display / mono type. Disabled = opacity 0.5 (or the override's explicit disabled colors). Reproduce
the **complete** variant × state matrix — mirror the `button()` builder.

## Secondary path — custom plugin spec discipline (condensed)

When editing the bulk-build plugin instead of `use_figma`:
1. **Generate, never hand-edit JSON.** Add/edit a builder in `generate-component-specs.mjs`, register it
   in `BUILDERS`, then `pnpm --filter @banana/figma-plugin build`. Hand edits to `specs/*.json` are
   overwritten on the next build.
2. **Bind every paint** via the `c('color/...')` helper so each `PaintRef` carries a `var` matching a name
   from `generate-variables-spec.mjs`; an unmatched/missing `var` silently renders as plain hex.
3. **Pull before Build**; confirm the log reports **0 plain** paints.
4. **Push before you expect to see it** — the plugin fetches specs from GitHub `main`; an unpushed commit
   builds the *old* component (the exact issue hit with the Switch).
5. **DSL limits:** only COLOR paints bind (FLOAT/STRING/BOOLEAN stay raw numbers); one DROP_SHADOW, blur
   forced to 0; fonts Space Grotesk/Mono (Inter→Roboto fallback); no images, vectors, gradients, nested
   instances. When a limit blocks fidelity, switch to `use_figma`.

## Pre-flight checklist

- [ ] Read the coded `Mui<X>` override + resolved tokens; built the variant × state property table.
- [ ] Plugin **Pull** has run so the `Banana` variables exist in the file.
- [ ] `use_figma`: every fill/stroke/text color bound via `setBoundVariableForPaint` (no literal fallback).
- [ ] Geometry, shadow (radius 0), and font (loaded before use) set to exact values.
- [ ] `get_screenshot` vs Storybook: geometry / shadow / typography / binding all match.
- [ ] (Secondary path only) generator rebuilt; specs committed **and pushed** to `main`.
