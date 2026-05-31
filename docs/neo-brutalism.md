# Neo-Brutalism — Definition & Stylization Rules

This document defines what "Neo-Brutalism" means for the Banana Design System and translates it into
concrete, tokenizable rules. It is the design north star: every token in `@banana/tokens` and every
component override in `@banana/mui-neo` should trace back to a rule here.

## 1. What is Neo-Brutalism?

Neo-Brutalism (a.k.a. "neubrutalism") is a UI style that borrows from architectural Brutalism and early,
raw web design. It deliberately rejects soft, "safe" minimalism in favour of **honest, blocky, high-energy
interfaces** where structure is visible and nothing is hidden behind subtle gradients or blur.

Core feeling: **bold, raw, playful, confident, slightly anti-design.** Elements look like physical,
stackable objects — flat blocks with hard edges that sit on the page and cast hard shadows.

## 2. Defining characteristics

1. **Thick, solid borders.** Every interactive surface has a visible black (or near-black) outline,
   typically 2–4px, fully opaque. Borders are a primary visual element, not a detail.
2. **Hard offset shadows (no blur).** Shadows are solid color, offset on X/Y, with **zero blur and zero
   spread** — e.g. `4px 4px 0 #000`. They read as a second flat block behind the element, not soft depth.
3. **High-contrast, saturated color.** A small palette of loud, saturated accent colors on flat
   backgrounds. Pure black ink, off-white/cream or pure white paper. No muted pastels as primaries.
4. **Sharp or minimal corners.** Corners are square (0px) or only slightly rounded (≤ 4px). No pill shapes
   as a default.
5. **Bold, structural typography.** Heavy weights, large display sizes, tight tracking. A grotesk/sans for
   UI and optionally a monospace for labels/code. Type is loud and used as a graphic element.
6. **Visible structure & flatness.** No gradients, no glassmorphism, no soft elevation. Layout grids,
   dividers, and containers are explicit.
7. **Tactile interaction model.** Interactions feel physical (see §4) — pressing "pushes" the block down
   into its shadow.

## 3. Anti-patterns (what we do NOT do)

- Soft, blurred drop shadows or ambient elevation.
- Gradients, glass/frosted effects, glows.
- Large border radii / pill buttons as the default.
- Low-contrast gray-on-gray text.
- Thin 1px hairline borders as the primary outline.

## 4. Interaction model

A single consistent metaphor across interactive components:

- **Rest:** element offset up-left from its hard shadow (e.g. shadow `4px 4px 0`).
- **Hover:** shadow grows slightly OR element nudges toward the shadow (e.g. `translate(-1px,-1px)` with a
  `5px 5px 0` shadow) — signalling "liftable".
- **Active / pressed:** element translates by the shadow offset (`translate(4px,4px)`) and the shadow
  collapses to `0 0 0` — the block is "pressed flat" into the page.
- **Focus-visible:** an additional thick outline/ring in an accent color (never remove focus styling).
- **Disabled:** desaturated fill, retained border, no shadow, no motion.

## 5. Token implications

These characteristics map directly onto design-token groups (authored in `packages/tokens/src`):

| Rule | Token group | Examples |
| ---- | ----------- | -------- |
| Thick borders | `border.width` | `border.width.thin` (2px), `.regular` (3px), `.thick` (4px) |
| Border/ink color | `color.border`, `color.ink` | solid `#000000` |
| Hard shadows | `shadow.offset`, `shadow.color`, plus composite `shadow.hard.*` | `2 2 0`, `4 4 0`, `6 6 0` |
| Saturated palette | `color.brand.*`, `color.accent.*`, `color.surface.*` | yellow, pink, cyan, lime, etc. |
| Paper/ink | `color.background`, `color.text` | cream `#FFFDF5`, ink `#000` |
| Sharp corners | `radius` | `radius.none` (0), `radius.sm` (4px) |
| Bold type | `font.family`, `font.weight`, `font.size` | display grotesk + mono; weights 700/900 |
| Spacing/grid | `space.*` | 4px base scale |
| Motion | `motion.*` | press translate distance == shadow offset |

## 6. Mapping to MUI

The above tokens are mapped onto the MUI theme in `packages/mui-neo/src/theme`:

- `palette` ← `color.*` (primary/secondary/error/etc. from the saturated palette; `text`, `background`).
- `shape.borderRadius` ← `radius.none` (default square).
- `shadows[]` / per-component shadows ← composite `shadow.hard.*`.
- `typography` ← `font.*`.
- `components.MuiButton`, `MuiTextField`, `MuiCard`, etc. `styleOverrides` apply borders, hard shadows, and
  the §4 interaction model (`:hover`, `:active`, `&.Mui-focusVisible`, `&.Mui-disabled`).

Keeping every visual decision in tokens (not hard-coded in component overrides) is what lets the **same**
values flow to Figma Variables via the plugin, so design and code stay in lockstep.
