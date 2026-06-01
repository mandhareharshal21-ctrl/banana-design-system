---
name: figma-replicate-from-code
description: Precision discipline for using the Figma MCP `use_figma` tool to replicate UI components in Figma so the canvas matches the source code exactly. Use when building, replicating, syncing, or correcting a component/screen in Figma from code, or when fixing geometry/spacing, shadow/effect, typography, or variable-binding mismatches between code and a Figma file. Project- and framework-agnostic — works for any design system.
---

# Replicate code in Figma with `use_figma`

A portable workflow for making a Figma component look **identical to its coded source**, with every paint
bound to a design variable. The code is the source of truth; Figma is the replica. `use_figma` runs
arbitrary JavaScript via the **full Figma Plugin API** against a file by `fileKey`, so there is no DSL
ceiling — you can reproduce exact pixels, real fonts, effects, and variable bindings.

## The one rule that fixes discrepancies

**Never eyeball. Copy the numbers from the code.** Almost every mismatch — wrong size, blurred shadow,
wrong font weight, plain-hex fill instead of a bound variable — comes from approximating instead of reading
the exact value out of the source. Read the component's styles, build a property table, then reproduce it.

## Tooling map

| Tool | Role |
| --- | --- |
| **`use_figma`** | Write. Runs Plugin-API JS by `fileKey`. The only tool you use to create/edit nodes. |
| `get_metadata` | Read structure: page list, then a node's XML subtree (ids, types, names, sizes). |
| `get_screenshot` | Render a node to PNG for visual verification. Needs `nodeId` + `fileKey`. |
| `get_variable_defs` | List the variables actually **bound** on a node — your binding proof. |
| `get_design_context` | Reference code + screenshot for an existing node (design→code direction). |
| `generate_figma_design` | Only for first-time capture of a **web** page into Figma; otherwise use `use_figma`. |

## Step 1 — Read the coded component (source of truth)

Open the component's styles (CSS / styled-components / theme overrides / token files) and resolve every
value. Build a **variant × state property table** capturing:

- size (`width`/`height` or hug/fill), `padding`, gap/`itemSpacing`, corner radius
- border width + color, background/fill
- font family / weight / size / letter-spacing / line-height
- shadows / effects (offset, blur, spread, color)
- per-state deltas: hover, active/pressed, focus, disabled, selected, etc.

CSS pseudo-states (`:hover`, `:active`, `:disabled`) have no equivalent inside a Figma component — encode
each as a **variant** (e.g. `State=Default|Hover|Active|Focus|Disabled`).

## Step 2 — Replicate with `use_figma`

Call `use_figma` with `fileKey` (from the Figma URL `figma.com/design/:fileKey/...`, or `whoami`) and a
`code` string (≤ 50 000 chars). Patterns that eliminate each discrepancy class:

**Bind every paint to a variable (fixes "plain hex"):**
```js
const localVars = await figma.variables.getLocalVariablesAsync();
const byName = new Map(localVars.map((v) => [v.name, v]));     // variable names use "/" as group separator
const v = byName.get('color/brand/primary');                   // must already exist in the file
let fills = [{ type: 'SOLID', color: { r: 1, g: 0.82, b: 0.25 } }];
fills[0] = figma.variables.setBoundVariableForPaint(fills[0], 'color', v); // returns a bound paint
node.fills = fills;                                            // same pattern for node.strokes / textNode.fills
```
If the variable doesn't exist, create the collection/variable first (or run your token-sync step) — do
**not** fall back to a literal color; the unbound literal *is* the discrepancy.

**Exact geometry (fixes size/spacing):** set explicit numbers, never rely on defaults —
`layoutMode = 'HORIZONTAL'|'VERTICAL'|'NONE'`, `paddingTop/Right/Bottom/Left`, `itemSpacing`,
`primaryAxisAlignItems`/`counterAxisAlignItems`, `cornerRadius`, `strokeWeight`, `strokeAlign`,
`resize(w, h)`, and `layoutSizingHorizontal/Vertical = 'FIXED'|'HUG'|'FILL'` to match fixed/hug/grow intent.
For absolute layouts (`layoutMode='NONE'`), append children first, then set their `x`/`y` (coordinates are
relative to the new parent).

**Shadows / effects (fixes blur/offset):**
```js
node.effects = [{ type: 'DROP_SHADOW', color: { r: 0, g: 0, b: 0, a: 1 },
  offset: { x: 4, y: 4 }, radius: 8, spread: 0, blendMode: 'NORMAL', visible: true }];
```
`radius` = blur, `spread` = spread — copy them from the CSS box-shadow. A hard/offset shadow is
`radius: 0`. Remove an effect in a state by setting `effects = []`.

**Typography (fixes wrong font/weight):** load the font **before** assigning it —
```js
await figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' });
text.fontName = { family: 'Inter', style: 'Semi Bold' };
text.fontSize = 16;
text.letterSpacing = { value: 0.5, unit: 'PERCENT' };   // or unit: 'PIXELS'
text.lineHeight = { value: 24, unit: 'PIXELS' };        // or { unit: 'AUTO' }
```
Map CSS `font-weight` to the family's Figma style name. Gotcha: for **Inter** the styles are
`"Semi Bold"` / `"Extra Bold"` (with a space), not `"SemiBold"`. If `loadFontAsync` throws, the font isn't
installed — fall back and report the substitution.

**Variants:** build one component per row of the table, then `figma.combineAsVariants(nodes, parentSet)`;
name each component `Prop=Value` (e.g. `State=Hover`) so the props parse into variant properties.

**`use_figma` gotchas:**
- The tool often returns **no value** — `return`/`console.log` may not surface in the result. To read back
  what you built, query afterward: `get_metadata` (no `nodeId` → page list; then page id → XML subtree to
  find node ids) and `get_variable_defs` (confirm bindings).
- `getPluginData` / `setPluginData` are unsupported.
- Don't assign `figma.currentPage`; use `await figma.setCurrentPageAsync(page)`.
- All variable/font/node lookups are the **async** variants (`getLocalVariablesAsync`,
  `getNodeByIdAsync`, `loadFontAsync`).
- Keep `code` under 50 000 chars — split a large component set across multiple calls.

## Step 3 — Verify by screenshot diff (close the loop)

After writing, find the node id with `get_metadata`, then:
1. `get_screenshot` the node and compare against the live component (running app / Storybook / browser).
2. `get_variable_defs` on the node to confirm fills/strokes/text are bound (it lists only bound variables).
3. Diff against the four classes — **geometry, shadow/effect, typography, variable binding** — and iterate
   the `use_figma` code until they match. This screenshot diff is the fidelity gate.

## Per-discrepancy quick-fix

| Symptom | Fix | Read from |
| --- | --- | --- |
| Size / padding / radius off | set `resize`, `padding*`, `itemSpacing`, `cornerRadius`, `strokeWeight` to exact px | the component's styles |
| Shadow blurred / wrong offset | `effects` DROP_SHADOW; copy `radius` (blur), `spread`, `offset`, `color` from CSS | box-shadow rule |
| Wrong font / weight | `loadFontAsync` then `fontName`; map `font-weight`→style name; set `fontSize`/`letterSpacing`/`lineHeight` | typography tokens |
| Fill/stroke/text plain hex | `setBoundVariableForPaint(paint,'color',byName.get(name))`; create the variable if missing | color tokens/variables |

## Checklist

- [ ] Read the source styles; built the variant × state property table (exact numbers).
- [ ] The needed design variables exist in the Figma file (binding resolves by name).
- [ ] Every fill/stroke/text color bound via `setBoundVariableForPaint` (no literal fallback).
- [ ] Geometry, effects (copy blur/spread), and fonts (loaded before use) set to exact values.
- [ ] Verified: `get_screenshot` vs the live component + `get_variable_defs` shows the bindings; iterated to match.
