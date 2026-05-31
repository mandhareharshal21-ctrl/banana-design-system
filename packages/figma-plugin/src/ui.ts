import type {
  ComponentManifestEntry,
  ComponentSetSpec,
  PluginConfig,
  TextStyleSpec,
  VariablesSpec,
} from './types';

const SPEC_BASE = 'packages/figma-plugin/specs';
const STATE_PATH = `${SPEC_BASE}/figma-state.json`;

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

// Config is persisted in the sandbox via figma.clientStorage; this is the UI mirror.
let current: PluginConfig = {
  owner: 'mandhareharshal21-ctrl',
  repo: 'banana-design-system',
  branch: 'main',
  token: '',
};

function send(message: unknown) {
  parent.postMessage({ pluginMessage: message }, '*');
}

function log(message: string) {
  const el = $('log');
  el.textContent = `${new Date().toLocaleTimeString()}  ${message}\n${el.textContent ?? ''}`;
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
  const btns = document.querySelectorAll<HTMLButtonElement>('button.action');
  btns.forEach((btn) => {
    btn.disabled = !enabled;
    btn.style.opacity = enabled ? '1' : '0.45';
    btn.style.cursor = enabled ? 'pointer' : 'not-allowed';
  });
}

function ghHeaders(): Record<string, string> {
  const headers: Record<string, string> = { Accept: 'application/vnd.github+json' };
  if (current.token) headers.Authorization = `Bearer ${current.token}`;
  return headers;
}

function describeStatus(status: number, context: string): string {
  switch (status) {
    case 401:
      return 'Unauthorized (401) — the GitHub PAT is missing, invalid, or expired.';
    case 403:
      return 'Forbidden (403) — token lacks permission, SSO is not authorized, or you are rate-limited.';
    case 404:
      return `Not found (404) — ${context}. Check Owner/Repo/Branch and the PAT's repo access.`;
    case 422:
      return 'Unprocessable (422) — usually a bad branch name or a stale file SHA. Retry.';
    default:
      if (status >= 500) return `GitHub server error (${status}) — try again shortly.`;
      return `Request failed (${status}) — ${context}.`;
  }
}
function describeNetworkError(e: unknown): string {
  const msg = (e as Error)?.message ?? String(e);
  return `Network error — ${msg}. Check your connection and that Figma allows api.github.com.`;
}

async function fetchSpec<T>(path: string): Promise<T> {
  const url = `https://api.github.com/repos/${current.owner}/${current.repo}/contents/${path}?ref=${encodeURIComponent(current.branch)}`;
  let res: Response;
  try {
    res = await fetch(url, {
      headers: { ...ghHeaders(), Accept: 'application/vnd.github.raw+json' },
      cache: 'no-store',
    });
  } catch (e) {
    throw new Error(describeNetworkError(e));
  }
  if (!res.ok) throw new Error(describeStatus(res.status, `fetching ${path}`));
  return JSON.parse(await res.text()) as T;
}

async function pushFile(path: string, json: unknown) {
  const apiBase = `https://api.github.com/repos/${current.owner}/${current.repo}/contents/${path}`;
  const headers = ghHeaders();
  let sha: string | undefined;
  const existing = await fetch(`${apiBase}?ref=${encodeURIComponent(current.branch)}`, { headers });
  if (existing.ok) sha = (await existing.json()).sha;
  else if (existing.status !== 404) throw new Error(describeStatus(existing.status, `reading ${path}`));

  const content = btoa(unescape(encodeURIComponent(JSON.stringify(json, null, 2) + '\n')));
  const res = await fetch(apiBase, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ message: `chore(figma): sync ${path}`, content, sha, branch: current.branch }),
  });
  if (!res.ok) throw new Error(describeStatus(res.status, `writing ${path} (needs Contents: write)`));
}

function readForm(): PluginConfig {
  current = {
    owner: $<HTMLInputElement>('owner').value.trim(),
    repo: $<HTMLInputElement>('repo').value.trim(),
    branch: $<HTMLInputElement>('branch').value.trim(),
    token: $<HTMLInputElement>('token').value.trim(),
  };
  send({ type: 'save-config', config: current }); // persist in clientStorage
  return current;
}

async function renderComponentList() {
  const host = $('components');
  try {
    const manifest = await fetchSpec<ComponentManifestEntry[]>(`${SPEC_BASE}/components.json`);
    host.innerHTML = manifest
      .map(
        (m) =>
          `<div class="comp"><span>${m.name}</span>` +
          `<button class="action build" data-file="${m.file}">Build</button></div>`,
      )
      .join('');
    host.querySelectorAll<HTMLButtonElement>('button.build').forEach((btn) => {
      btn.onclick = () => void buildOne(btn.dataset.file as string, btn.previousElementSibling?.textContent ?? '');
    });
    setActionsEnabled(connected); // sync the freshly created buttons
    log(`Loaded ${manifest.length} components.`);
  } catch (e) {
    host.innerHTML = '';
    log(`Could not load component list: ${(e as Error).message}`);
  }
}

async function buildOne(file: string, name: string) {
  if (!connected) return;
  try {
    log(`Fetching spec for ${name}…`);
    const spec = await fetchSpec<ComponentSetSpec>(`${SPEC_BASE}/${file}`);
    send({ type: 'build-component', spec });
  } catch (e) {
    const reason = (e as Error).message;
    setStatus('error', reason);
    log(`Build "${name}" failed: ${reason}`);
  }
}

async function testConnection() {
  readForm();
  if (!current.owner || !current.repo || !current.branch) {
    setStatus('error', 'Fill in Owner, Repo, and Branch.');
    setActionsEnabled(false);
    return;
  }
  if (!current.token) {
    setStatus('error', 'A GitHub PAT is required (Contents: Read and write).');
    setActionsEnabled(false);
    return;
  }
  setStatus('checking', `${current.owner}/${current.repo}@${current.branch}`);

  let repoJson: { full_name?: string; permissions?: { push?: boolean } };
  try {
    const res = await fetch(`https://api.github.com/repos/${current.owner}/${current.repo}`, {
      headers: ghHeaders(),
      cache: 'no-store',
    });
    if (!res.ok) {
      const reason = describeStatus(res.status, `repo ${current.owner}/${current.repo}`);
      setStatus('error', reason);
      log(`Connection failed: ${reason}`);
      setActionsEnabled(false);
      return;
    }
    repoJson = await res.json();
  } catch (e) {
    const reason = describeNetworkError(e);
    setStatus('error', reason);
    setActionsEnabled(false);
    return;
  }

  try {
    const res = await fetch(
      `https://api.github.com/repos/${current.owner}/${current.repo}/branches/${encodeURIComponent(current.branch)}`,
      { headers: ghHeaders(), cache: 'no-store' },
    );
    if (!res.ok) {
      const reason = describeStatus(res.status, `branch "${current.branch}"`);
      setStatus('error', reason);
      log(`Connection failed: ${reason}`);
      setActionsEnabled(false);
      return;
    }
  } catch (e) {
    setStatus('error', describeNetworkError(e));
    setActionsEnabled(false);
    return;
  }

  const canPush = repoJson.permissions?.push === true;
  setStatus(
    'ok',
    `${repoJson.full_name ?? `${current.owner}/${current.repo}`}@${current.branch} · ${canPush ? 'write OK' : 'READ-ONLY (Push will fail)'}`,
  );
  log(`Connected. Push access: ${canPush ? 'yes' : 'NO — token lacks Contents: write'}.`);
  setActionsEnabled(true);
  await renderComponentList();
}

document.body.innerHTML = `
  <style>
    body { font-family: 'Inter', system-ui, sans-serif; margin: 0; padding: 12px; font-size: 12px; }
    h2 { margin: 0 0 8px; font-size: 14px; }
    label { display: block; margin: 6px 0 2px; font-weight: 600; }
    input { width: 100%; box-sizing: border-box; padding: 6px; border: 2px solid #000; border-radius: 0; }
    .row { display: flex; gap: 8px; }
    .row > div { flex: 1; }
    details#setup { border: 3px solid #000; padding: 6px 10px; box-shadow: 4px 4px 0 #000; }
    details#setup > summary { font-weight: 700; cursor: pointer; font-size: 13px; }
    #status { margin: 10px 0; padding: 7px 9px; border: 3px solid #000; font-weight: 700;
      box-shadow: 3px 3px 0 #000; word-break: break-word; }
    button { border: 3px solid #000; background: #FFD23F; font-weight: 700; cursor: pointer;
      border-radius: 0; box-shadow: 4px 4px 0 #000; padding: 8px 12px; }
    button:not(:disabled):active { transform: translate(4px, 4px); box-shadow: 0 0 0 #000; }
    button#connect { width: 100%; background: #3FC1FF; margin-bottom: 10px; }
    .variables { display: flex; gap: 8px; margin-bottom: 10px; }
    .variables > button { flex: 1; }
    h3 { margin: 6px 0 4px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; }
    #components { border: 3px solid #000; max-height: 220px; overflow: auto; }
    .comp { display: flex; align-items: center; justify-content: space-between;
      padding: 6px 8px; border-bottom: 2px solid #000; }
    .comp:last-child { border-bottom: 0; }
    .comp span { font-weight: 600; }
    .comp button { padding: 4px 10px; box-shadow: 3px 3px 0 #000; }
    pre { background: #f4f4f4; border: 2px solid #000; padding: 6px; height: 90px; overflow: auto;
      white-space: pre-wrap; margin-top: 10px; }
  </style>
  <h2>Banana DS Sync</h2>
  <details id="setup">
    <summary>Token setup</summary>
    <div class="row">
      <div><label>Owner</label><input id="owner" /></div>
      <div><label>Repo</label><input id="repo" /></div>
    </div>
    <div class="row">
      <div><label>Branch</label><input id="branch" /></div>
      <div><label>GitHub PAT</label><input id="token" type="password" placeholder="github_pat_…" /></div>
    </div>
    <p style="margin:6px 0 2px">Fine-grained PAT scoped to the repo with <b>Contents: Read and write</b>.
      Saved on the plugin (clientStorage) — enter it once.</p>
  </details>
  <div id="status"></div>
  <button id="connect">Test Connection</button>
  <div class="variables">
    <button class="action" id="pull">Pull Variables</button>
    <button class="action" id="push">Push State</button>
  </div>
  <h3>Components</h3>
  <div id="components"></div>
  <pre id="log"></pre>
`;

window.onerror = (message) => {
  const el = document.getElementById('status');
  if (el) {
    el.style.background = '#FF5CA2';
    el.textContent = `ERROR — UI crashed: ${message}`;
  }
  return false;
};

function fillForm(cfg: PluginConfig) {
  $<HTMLInputElement>('owner').value = cfg.owner;
  $<HTMLInputElement>('repo').value = cfg.repo;
  $<HTMLInputElement>('branch').value = cfg.branch;
  $<HTMLInputElement>('token').value = cfg.token;
}

setActionsEnabled(false);
setStatus('idle', 'Open Token setup, enter your PAT, then Test Connection.');
fillForm(current);
send({ type: 'get-config' }); // ask the sandbox for the saved config

$('connect').onclick = () => void testConnection();

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
    log('Fetching variables + text styles…');
    const spec = await fetchSpec<VariablesSpec>(`${SPEC_BASE}/variables.json`);
    const textStyles = await fetchSpec<TextStyleSpec[]>(`${SPEC_BASE}/text-styles.json`);
    send({ type: 'pull-variables', spec, textStyles });
  } catch (e) {
    const reason = (e as Error).message;
    setStatus('error', reason);
    log(`Pull failed: ${reason}`);
  }
};

$('push').onclick = () => {
  if (!connected) return;
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
  } else if (msg.type === 'config') {
    current = msg.config;
    fillForm(current);
    // Auto-test if a token was already saved.
    if (current.token) void testConnection();
  } else if (msg.type === 'state') {
    try {
      if (!current.token) {
        setStatus('error', 'A GitHub PAT is required to push.');
        return;
      }
      log('Pushing state to GitHub…');
      await pushFile(STATE_PATH, msg.payload);
      setStatus('ok', `Pushed ${STATE_PATH}`);
      log(`Pushed ${STATE_PATH}`);
    } catch (e) {
      const reason = (e as Error).message;
      setStatus('error', reason);
      log(`Push failed: ${reason}`);
    }
  }
};
