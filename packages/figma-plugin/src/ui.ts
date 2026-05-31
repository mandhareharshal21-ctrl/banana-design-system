import type { ComponentSpec, VariablesSpec } from './types';

const SPEC_BASE = 'packages/figma-plugin/specs';
const STATE_PATH = `${SPEC_BASE}/figma-state.json`;
const COMPONENT_FILES = ['components/button.json'];

interface Config {
  owner: string;
  repo: string;
  branch: string;
  token: string;
}

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

// Figma's plugin UI runs in a sandboxed null-origin iframe where localStorage
// access can throw SecurityError. Wrap it and fall back to an in-memory store so
// a throw never kills UI bootstrap (which would leave dead buttons + no error).
const memStore: Record<string, string> = {};

function storeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return key in memStore ? memStore[key] : null;
  }
}

function storeSet(key: string, value: string) {
  memStore[key] = value;
  try {
    localStorage.setItem(key, value);
  } catch {
    /* in-memory only for this session */
  }
}

function loadConfig(): Config {
  return {
    owner: storeGet('banana.owner') ?? 'mandhareharshal21-ctrl',
    repo: storeGet('banana.repo') ?? 'banana-design-system',
    branch: storeGet('banana.branch') ?? 'main',
    token: storeGet('banana.token') ?? '',
  };
}

function saveConfig(cfg: Config) {
  storeSet('banana.owner', cfg.owner);
  storeSet('banana.repo', cfg.repo);
  storeSet('banana.branch', cfg.branch);
  storeSet('banana.token', cfg.token);
}

function log(message: string) {
  const el = $('log');
  el.textContent = `${new Date().toLocaleTimeString()}  ${message}\n${el.textContent ?? ''}`;
}

function send(message: unknown) {
  parent.postMessage({ pluginMessage: message }, '*');
}

type StatusKind = 'idle' | 'checking' | 'ok' | 'error';
let connected = false;

function setStatus(kind: StatusKind, text: string) {
  const el = $('status');
  const palette: Record<StatusKind, { bg: string; label: string }> = {
    idle: { bg: '#E6E6E6', label: 'NOT CONNECTED' },
    checking: { bg: '#FFD23F', label: 'CHECKING…' },
    ok: { bg: '#9EFF3F', label: 'CONNECTED' },
    error: { bg: '#FF5CA2', label: 'ERROR' },
  };
  const p = palette[kind];
  el.style.background = p.bg;
  el.textContent = `${p.label} — ${text}`;
}

function setActionsEnabled(enabled: boolean) {
  connected = enabled;
  for (const id of ['pull', 'build', 'push']) {
    const btn = $<HTMLButtonElement>(id);
    btn.disabled = !enabled;
    btn.style.opacity = enabled ? '1' : '0.45';
    btn.style.cursor = enabled ? 'pointer' : 'not-allowed';
  }
}

function ghHeaders(cfg: Config): Record<string, string> {
  const headers: Record<string, string> = { Accept: 'application/vnd.github+json' };
  if (cfg.token) headers.Authorization = `Bearer ${cfg.token}`;
  return headers;
}

// Turn an HTTP status (or a thrown fetch error) into a human-readable cause.
function describeStatus(status: number, context: string): string {
  switch (status) {
    case 401:
      return 'Unauthorized (401) — the GitHub PAT is missing, invalid, or expired.';
    case 403:
      return 'Forbidden (403) — the token lacks permission, SSO is not authorized for it, or you are rate-limited.';
    case 404:
      return `Not found (404) — ${context}. Check Owner/Repo/Branch, and that the fine-grained PAT grants access to this repo.`;
    case 422:
      return 'Unprocessable (422) — usually a bad branch name or a stale file SHA. Retry.';
    default:
      if (status >= 500) return `GitHub server error (${status}) — try again shortly.`;
      return `Request failed (${status}) — ${context}.`;
  }
}

function describeNetworkError(e: unknown): string {
  const msg = (e as Error)?.message ?? String(e);
  return `Network error — ${msg}. Check your connection and that Figma allows api.github.com (manifest networkAccess).`;
}

async function fetchSpec<T>(cfg: Config, path: string): Promise<T> {
  // Authenticated contents API is immediate (no raw CDN lag) and gives clear auth errors.
  const url = `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${path}?ref=${encodeURIComponent(cfg.branch)}`;
  let res: Response;
  try {
    res = await fetch(url, {
      headers: { ...ghHeaders(cfg), Accept: 'application/vnd.github.raw+json' },
      cache: 'no-store',
    });
  } catch (e) {
    throw new Error(describeNetworkError(e));
  }
  if (!res.ok) throw new Error(describeStatus(res.status, `fetching ${path}`));
  return JSON.parse(await res.text()) as T;
}

async function pushFile(cfg: Config, path: string, json: unknown) {
  const apiBase = `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${path}`;
  const headers = ghHeaders(cfg);
  let sha: string | undefined;
  try {
    const existing = await fetch(`${apiBase}?ref=${encodeURIComponent(cfg.branch)}`, { headers });
    if (existing.ok) sha = (await existing.json()).sha;
    else if (existing.status !== 404) throw new Error(describeStatus(existing.status, `reading ${path}`));
  } catch (e) {
    if (e instanceof Error && e.message.startsWith('Unauthorized')) throw e;
    if (e instanceof Error && /\(\d{3}\)/.test(e.message)) throw e;
    throw new Error(describeNetworkError(e));
  }

  const content = btoa(unescape(encodeURIComponent(JSON.stringify(json, null, 2) + '\n')));
  let res: Response;
  try {
    res = await fetch(apiBase, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        message: `chore(figma): sync ${path}`,
        content,
        sha,
        branch: cfg.branch,
      }),
    });
  } catch (e) {
    throw new Error(describeNetworkError(e));
  }
  if (!res.ok) throw new Error(describeStatus(res.status, `writing ${path} (needs Contents: write)`));
}

function readForm(): Config {
  const cfg: Config = {
    owner: $<HTMLInputElement>('owner').value.trim(),
    repo: $<HTMLInputElement>('repo').value.trim(),
    branch: $<HTMLInputElement>('branch').value.trim(),
    token: $<HTMLInputElement>('token').value.trim(),
  };
  saveConfig(cfg);
  return cfg;
}

async function testConnection(silent = false) {
  const cfg = readForm();
  if (!cfg.owner || !cfg.repo || !cfg.branch) {
    setStatus('error', 'Fill in Owner, Repo, and Branch.');
    setActionsEnabled(false);
    return;
  }
  if (!cfg.token) {
    setStatus('error', 'A GitHub PAT is required (Contents: Read and write).');
    setActionsEnabled(false);
    return;
  }
  setStatus('checking', `${cfg.owner}/${cfg.repo}@${cfg.branch}`);
  if (!silent) log('Testing GitHub connection…');

  // 1) Repo access + push permission.
  let repoJson: { full_name?: string; permissions?: { push?: boolean } };
  try {
    const res = await fetch(`https://api.github.com/repos/${cfg.owner}/${cfg.repo}`, {
      headers: ghHeaders(cfg),
      cache: 'no-store',
    });
    if (!res.ok) {
      const reason = describeStatus(res.status, `repo ${cfg.owner}/${cfg.repo}`);
      setStatus('error', reason);
      log(`Connection failed: ${reason}`);
      setActionsEnabled(false);
      return;
    }
    repoJson = await res.json();
  } catch (e) {
    const reason = describeNetworkError(e);
    setStatus('error', reason);
    log(`Connection failed: ${reason}`);
    setActionsEnabled(false);
    return;
  }

  // 2) Branch exists.
  try {
    const res = await fetch(
      `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/branches/${encodeURIComponent(cfg.branch)}`,
      { headers: ghHeaders(cfg), cache: 'no-store' },
    );
    if (!res.ok) {
      const reason = describeStatus(res.status, `branch "${cfg.branch}"`);
      setStatus('error', reason);
      log(`Connection failed: ${reason}`);
      setActionsEnabled(false);
      return;
    }
  } catch (e) {
    const reason = describeNetworkError(e);
    setStatus('error', reason);
    setActionsEnabled(false);
    return;
  }

  const canPush = repoJson.permissions?.push === true;
  setStatus(
    'ok',
    `${repoJson.full_name ?? `${cfg.owner}/${cfg.repo}`}@${cfg.branch} · ${canPush ? 'write OK' : 'READ-ONLY (Push will fail)'}`,
  );
  log(`Connected to ${repoJson.full_name}. Push access: ${canPush ? 'yes' : 'NO — token lacks Contents: write'}.`);
  setActionsEnabled(true);
}

document.body.innerHTML = `
  <style>
    body { font-family: 'Inter', system-ui, sans-serif; margin: 0; padding: 12px; font-size: 12px; }
    h2 { margin: 0 0 8px; font-size: 14px; }
    label { display: block; margin: 6px 0 2px; font-weight: 600; }
    input { width: 100%; box-sizing: border-box; padding: 6px; border: 2px solid #000; border-radius: 0; }
    .row { display: flex; gap: 8px; }
    .row > div { flex: 1; }
    #status { margin: 10px 0 4px; padding: 7px 9px; border: 3px solid #000; font-weight: 700;
      box-shadow: 3px 3px 0 #000; word-break: break-word; }
    button { margin-top: 10px; margin-right: 6px; padding: 8px 12px; border: 3px solid #000;
      background: #FFD23F; font-weight: 700; cursor: pointer; border-radius: 0;
      box-shadow: 4px 4px 0 #000; }
    button:not(:disabled):active { transform: translate(4px, 4px); box-shadow: 0 0 0 #000; }
    button#connect { background: #3FC1FF; }
    details { margin-top: 10px; border: 2px solid #000; padding: 6px 8px; }
    summary { font-weight: 700; cursor: pointer; }
    details ol { margin: 6px 0 0; padding-left: 18px; }
    details li { margin: 3px 0; }
    code { background: #f4f4f4; padding: 0 3px; }
    pre { background: #f4f4f4; border: 2px solid #000; padding: 6px; height: 110px; overflow: auto;
      white-space: pre-wrap; margin-top: 10px; }
  </style>
  <h2>Banana DS Sync</h2>
  <div class="row">
    <div><label>Owner</label><input id="owner" /></div>
    <div><label>Repo</label><input id="repo" /></div>
  </div>
  <div class="row">
    <div><label>Branch</label><input id="branch" /></div>
    <div><label>GitHub PAT</label><input id="token" type="password" placeholder="github_pat_…" /></div>
  </div>
  <div id="status"></div>
  <div>
    <button id="connect">Test Connection</button>
  </div>
  <div>
    <button id="pull">Pull Variables</button>
    <button id="build">Build Components</button>
    <button id="push">Push State</button>
  </div>
  <details>
    <summary>How to connect &amp; troubleshoot</summary>
    <ol>
      <li>On GitHub: <b>Settings → Developer settings → Fine-grained tokens → Generate new token</b>.</li>
      <li>Scope it to the <code>banana-design-system</code> repo with <b>Repository permissions → Contents: Read and write</b>.</li>
      <li>Paste the token above, then click <b>Test Connection</b>. Green = ready; the actions unlock.</li>
      <li><b>401</b> = bad/expired token. <b>403</b> = no permission / SSO not authorized / rate-limited.
        <b>404</b> = wrong Owner/Repo/Branch or token can't see the repo. <b>READ-ONLY</b> = token missing
        Contents: write (Push will fail).</li>
      <li>Order: <b>Pull</b> (creates Variables) → <b>Build</b> (creates components bound to them) →
        <b>Push</b> (writes Figma state back to the repo).</li>
    </ol>
  </details>
  <pre id="log"></pre>
`;

// Surface any uncaught error in the iframe instead of dying silently.
window.onerror = (message) => {
  const el = document.getElementById('status');
  if (el) {
    el.style.background = '#FF5CA2';
    el.textContent = `ERROR — UI crashed: ${message}`;
  }
  return false;
};

const initial = loadConfig();
$<HTMLInputElement>('owner').value = initial.owner;
$<HTMLInputElement>('repo').value = initial.repo;
$<HTMLInputElement>('branch').value = initial.branch;
$<HTMLInputElement>('token').value = initial.token;

setActionsEnabled(false);
setStatus('idle', 'Enter your repo + PAT, then Test Connection.');

$('connect').onclick = () => {
  void testConnection(false);
};

// Re-lock actions whenever connection inputs change; user must re-test.
for (const id of ['owner', 'repo', 'branch', 'token']) {
  $<HTMLInputElement>(id).oninput = () => {
    if (connected) {
      setActionsEnabled(false);
      setStatus('idle', 'Inputs changed — Test Connection again.');
    }
  };
}

$('pull').onclick = async () => {
  if (!connected) return;
  try {
    const cfg = readForm();
    log('Fetching variables spec…');
    const spec = await fetchSpec<VariablesSpec>(cfg, `${SPEC_BASE}/variables.json`);
    send({ type: 'pull-variables', spec });
  } catch (e) {
    const reason = (e as Error).message;
    setStatus('error', reason);
    log(`Pull failed: ${reason}`);
  }
};

$('build').onclick = async () => {
  if (!connected) return;
  try {
    const cfg = readForm();
    log('Fetching component specs…');
    const specs: ComponentSpec[] = [];
    for (const file of COMPONENT_FILES) {
      specs.push(await fetchSpec<ComponentSpec>(cfg, `${SPEC_BASE}/${file}`));
    }
    send({ type: 'build-components', specs });
  } catch (e) {
    const reason = (e as Error).message;
    setStatus('error', reason);
    log(`Build failed: ${reason}`);
  }
};

$('push').onclick = () => {
  if (!connected) return;
  readForm();
  log('Exporting Figma state…');
  send({ type: 'export-state' });
};

window.onmessage = async (event: MessageEvent) => {
  const msg = event.data.pluginMessage;
  if (!msg) return;
  if (msg.type === 'log') {
    log(msg.message);
  } else if (msg.type === 'result') {
    setStatus(msg.ok ? 'ok' : 'error', msg.message);
  } else if (msg.type === 'state') {
    try {
      const cfg = loadConfig();
      if (!cfg.token) {
        setStatus('error', 'A GitHub PAT is required to push.');
        log('Push failed: no PAT.');
        return;
      }
      log('Pushing state to GitHub…');
      await pushFile(cfg, STATE_PATH, msg.payload);
      setStatus('ok', `Pushed ${STATE_PATH}`);
      log(`Pushed ${STATE_PATH}`);
    } catch (e) {
      const reason = (e as Error).message;
      setStatus('error', reason);
      log(`Push failed: ${reason}`);
    }
  }
};
