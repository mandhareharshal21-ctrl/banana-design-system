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

Because both derive from the same tokens, code and Figma never drift.

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
4. **Run the plugin** and fill the form: Owner `mandhareharshal21-ctrl`, Repo
   `banana-design-system`, Branch `main`, and paste the PAT. The PAT is stored only in the
   plugin iframe's `localStorage` — it is never written to the repo.
5. **Click "Test Connection".** The plugin calls the GitHub API to verify the repo, branch, and
   token, then reports the result in the status banner. The Pull / Build / Push buttons stay
   **disabled until the test passes** (green). Editing any field re-locks them so you re-test.

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

## Daily flow

After a green connection test, the plugin UI has three action buttons (each updates the status
banner with a success/error result):

| Button | What it does |
| --- | --- |
| **Pull Variables** | Fetches `specs/variables.json` via the authenticated GitHub **contents API** (no raw-CDN lag) → creates/updates the `Banana` Variable collection, modes, and typed variables via `setValueForMode`. Run this **first** so components can bind to variables. |
| **Build Components** | Fetches each spec in `COMPONENT_FILES` (e.g. `components/button.json`) → creates auto-layout components with fills/strokes **bound** to local Variables, hard drop-shadow effects, and text. The log reports `N bound / M plain` paints; if nothing bound, run Pull first. |
| **Push State** | Serializes current Figma Variables + component metadata → JSON → commits `specs/figma-state.json` back to GitHub via the contents API (GET sha, then PUT base64). Requires **Contents: write**. |

## Round-trip (refinement loop)

1. Designer edits Variables/components in Figma.
2. **Push State** writes `specs/figma-state.json` to the repo.
3. Claude reads that JSON, diffs it against tokens/code, and reconciles changes back into
   `packages/tokens` and `@banana/mui-neo`.
4. Re-run token + plugin builds; cut a release via Changesets if tokens changed.

## Authoring a new component spec

1. Add a `ComponentSpec` JSON file under `packages/figma-plugin/specs/components/`.
2. Reference variables by their slash-path name (e.g. `color/brand/yellow`) in `fillVar`,
   `strokeVar`, `textColorVar` — these must exist in `variables.json`.
3. Register the file in `COMPONENT_FILES` in `packages/figma-plugin/src/ui.ts`.
4. Rebuild the plugin and run **Build Components** in Figma.

## Files

- `packages/figma-plugin/manifest.json` — plugin manifest; `networkAccess.allowedDomains`
  limited to `api.github.com` + `raw.githubusercontent.com`.
- `packages/figma-plugin/src/code.ts` — sandbox: Variable + component creation (Plugin API).
- `packages/figma-plugin/src/ui.ts` — iframe UI: GitHub auth, Pull/Build/Push, GitHub I/O.
- `packages/figma-plugin/specs/` — Claude-authored specs (committed) + pushed-back state.
