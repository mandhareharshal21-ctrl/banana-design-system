# Figma Workflow Runbook

How design tokens and components move between this repo and Figma. The pipeline is
**git-spec pull**: Claude authors declarative JSON specs in the repo, our own Figma plugin
pulls them from GitHub and materializes Variables + components, and pushes Figma state back
to GitHub for reconciliation. There is no third-party bridge, MCP, or live WebSocket.

## Why a first-party plugin

- Figma's REST **Variables write** API is Enterprise-only, so it is unavailable on Free/Pro/Org.
- A Figma file is cloud-only; nothing outside Figma can write to it directly.
- The **Plugin API (running inside Figma)** is the only way to create Variables, components, and
  nodes. So we build and own `packages/figma-plugin`.

## The single source of truth

DTCG token JSON in `packages/tokens/src/tokens/*.json` feeds **both** sides:

- **Code**: `packages/tokens/build.mjs` resolves aliases → `src/generated.ts` (typed TS) +
  `dist/tokens.css` → consumed by `@banana/mui-neo` theme.
- **Figma**: `packages/figma-plugin/scripts/generate-variables-spec.mjs` imports the same tokens
  and emits `specs/variables.json` (collection / mode / variable mapping). Shadows are skipped
  (they map to Figma effects on components, not Variables).
- **Components + text styles**: `scripts/generate-component-specs.mjs` imports the same tokens and
  emits one `specs/components/<slug>.json` per component (each a **component set** with its
  variants/states + a TEXT component property such as `Label`), a `specs/components.json` manifest
  (drives the plugin's build list), and `specs/text-styles.json` (typography styles applied on Pull).

Because everything derives from the same tokens, code and Figma never drift. To add or change a
component, edit the builder in `generate-component-specs.mjs` and rebuild — never hand-edit the
generated JSON.

## One-time setup

1. **GitHub PAT** — create a fine-grained personal access token scoped to the
   `banana-design-system` repo with **Contents: Read and write**. The plugin needs read for
   Pull/Build and write for Push.
2. **Build the plugin bundle**:
   ```bash
   pnpm --filter @banana/figma-plugin build
   ```
   This regenerates `specs/variables.json` and bundles `dist/code.js` + `dist/ui.html`.
3. **Import into Figma**: Figma desktop → Plugins → Development → *Import plugin from
   manifest…* → select `packages/figma-plugin/manifest.json`.
4. **Run the plugin**, open the **Token setup** dropdown, and fill the form: Owner
   `mandhareharshal21-ctrl`, Repo `banana-design-system`, Branch `main`, and paste the PAT. The PAT
   is saved on the plugin via `figma.clientStorage` (persists across runs, scoped to this plugin) —
   enter it once. It is never written to the repo.
5. **Click "Test Connection"** (the full-width button below the status banner). The plugin calls the
   GitHub API to verify the repo, branch, and token, reports the result in the status banner, and
   loads the component build list. The Pull / Push / Build buttons stay **disabled until the test
   passes** (green). Editing any field re-locks them so you re-test.

## Connecting & status states

The status banner above the action buttons reflects the GitHub connection:

| Banner | Meaning |
| --- | --- |
| **NOT CONNECTED** (grey) | Initial state, or inputs changed — fill the form and Test Connection. |
| **CHECKING…** (yellow) | A connection test is in flight. |
| **CONNECTED** (green) | Repo + branch reachable and token valid. Shows `owner/repo@branch · write OK` (or `READ-ONLY` if the token lacks Contents: write — Push will fail). Actions unlock. |
| **ERROR** (pink) | Something failed; the banner names the cause (see below). Actions stay locked. |

Common error causes (shown verbatim in the banner + log):

- **401 Unauthorized** — the PAT is missing, invalid, or expired. Regenerate it.
- **403 Forbidden** — token lacks permission, SSO is not authorized for the org, or you are rate-limited.
- **404 Not found** — wrong Owner/Repo/Branch, or the fine-grained PAT doesn't grant access to this repo.
- **READ-ONLY** — connection works but the token is missing **Contents: write**; Pull/Build still work, Push won't.
- **Network error** — no connection, or Figma blocked the host. `manifest.json` must allow `api.github.com`.

## Plugin UI layout

Top to bottom: **Token setup** dropdown (collapsible) → **status banner** → full-width **Test
Connection** button → **Pull Variables** / **Push State** row → **Components** list (one row per
component with a **Build** button) → activity log.

## Daily flow

After a green connection test, each action updates the status banner with a success/error result:

| Action | What it does |
| --- | --- |
| **Pull Variables** | Fetches `specs/variables.json` + `specs/text-styles.json` via the authenticated GitHub **contents API** (no raw-CDN lag) → creates/updates the `Banana` Variable collection (modes + typed variables) **and** the Figma **text styles** (typography). Run this **first** so components can bind to variables. |
| **Build** (per component) | Each row in the Components list fetches that component's spec → builds a **component set** with all its variants/states (e.g. Button: Variant × State), fills/strokes **bound** to local Variables, hard drop-shadow effects, text, and a TEXT **component property** (e.g. `Label`). The log reports `N bound / M plain` paints; if nothing bound, run Pull first. |
| **Push State** | Serializes current Figma Variables + text styles + component-set metadata → JSON → commits `specs/figma-state.json` back to GitHub via the contents API (GET sha, then PUT base64). Requires **Contents: write**. |

## Round-trip (refinement loop)

1. Designer edits Variables/components in Figma.
2. **Push State** writes `specs/figma-state.json` to the repo.
3. Claude reads that JSON, diffs it against tokens/code, and reconciles changes back into
   `packages/tokens` and `@banana/mui-neo` (see next section).
4. Re-run token + plugin builds; cut a release via Changesets if tokens changed.

## Figma → tokens reconcile (on-request)

**Push only snapshots Figma** into `specs/figma-state.json`; it changes no code. To make a Figma
**variable** edit actually affect the live component, the change has to land in the DTCG source tokens
(`packages/tokens/src/tokens/*.json`) → `pnpm tokens:build` → theme → Storybook. This is a **deliberate,
on-request, Claude-driven** step — *not* an automatic write-back. The round-trip is lossy
(`build.mjs` resolves aliases to flat hex, `generate-variables-spec.mjs` strips units and skips shadows,
and several tokens share a value), so a blind auto-overwrite would corrupt the source of truth. Trigger it
explicitly, e.g. *"align tokens with Figma"*.

Procedure:

1. **Source the changes.** Read `specs/figma-state.json` (each entry: variable `name` + resolved
   `valuesByMode`), or read live values via MCP (`get_variable_defs` on a node, or `use_figma`
   `getLocalVariablesAsync`).
2. **Map name → token path.** Replace `/` with `.` (`color/brand/yellow` → `color.brand.yellow`). The
   top-level key picks the file: `color.json`, `border.json` (border + radius), `typography.json`,
   `space.json`. **Shadows** live in `shadow.json` and are **not** Figma variables.
3. **Diff vs resolved tokens.** Compare each Figma value to the built value from `@banana/tokens`; act
   only on changed values.
4. **Alias-aware write — the critical rule.** If the mapped token is an alias (e.g.
   `color.border = "{color.ink}"`), do **not** overwrite the alias with a literal. Decide intent:
   - a changed **base** value → edit the base token (`color.ink`) so every alias follows;
   - an intentional **divergence** (one of several same-valued variables changed) → break *that one*
     token's alias into a literal (or a different alias), leaving the rest pointing at the base.
   Re-attach the unit Figma stripped (`border.width.regular` stays `"3px"`, not `3`). Shadows/geometry are
   not variables — reconcile by hand from the component if that's what changed.
5. **Rebuild + verify.** `pnpm tokens:build` → `pnpm build`; open the affected component in Storybook and
   confirm it reflects the change; `pnpm test` / `typecheck` / `lint` clean.
6. **Commit** with a clear message; push only when the user authorizes it.

*Worked example.* Figma `color/brand/yellow` changed `#FFD23F` → `#FFC400`. It is a base token (not an
alias), so edit only `color.brand.yellow.$value` in `color.json`. `color.border`/`color.text.onAccent`
(aliases of `color.ink`) are untouched. `pnpm tokens:build` regenerates `generated.ts` + `tokens.css`;
the Button's contained fill updates in Storybook; nothing else moves.

## Authoring a new component (or editing one)

Specs are **generated**, not hand-written. Add or edit a builder function in
`scripts/generate-component-specs.mjs`:

1. Write a builder returning a `ComponentSetSpec` — `{ name, properties?, variants: [{ props, node }] }`.
   `props` are the variant keys (e.g. `{ Variant: 'Primary', State: 'Hover' }`); `node` is a
   recursive `NodeSpec` (auto-layout frame or text). Use the `c('color/brand/yellow')` helper to bind
   a paint to a variable, and `bind: 'Label'` on a text node to wire a TEXT component property.
2. Add the builder to the `BUILDERS` array (this also adds it to `components.json` → the UI list).
3. Rebuild the plugin (`pnpm --filter @banana/figma-plugin build`) and push, then **reload** the
   plugin in Figma and click the component's **Build** button.

The renderer creates one `ComponentNode` per variant, `combineAsVariants` into a set, then adds the
declared component properties — so variants/states show up as Figma variant properties automatically.

## Files

- `packages/figma-plugin/manifest.json` — plugin manifest; `networkAccess.allowedDomains`
  limited to `api.github.com` + `raw.githubusercontent.com`.
- `packages/figma-plugin/src/code.ts` — sandbox: Variables, text styles, and component-set creation.
- `packages/figma-plugin/src/ui.ts` — iframe UI: token setup, connection test, Pull/Push, build list.
- `packages/figma-plugin/scripts/generate-component-specs.mjs` — generates component + text-style specs.
- `packages/figma-plugin/scripts/generate-variables-spec.mjs` — generates the variables spec.
- `packages/figma-plugin/specs/` — generated specs (committed) + pushed-back `figma-state.json`.
