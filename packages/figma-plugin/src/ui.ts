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

function loadConfig(): Config {
  return {
    owner: localStorage.getItem('banana.owner') ?? 'mandhareharshal21-ctrl',
    repo: localStorage.getItem('banana.repo') ?? 'banana-design-system',
    branch: localStorage.getItem('banana.branch') ?? 'main',
    token: localStorage.getItem('banana.token') ?? '',
  };
}

function saveConfig(cfg: Config) {
  localStorage.setItem('banana.owner', cfg.owner);
  localStorage.setItem('banana.repo', cfg.repo);
  localStorage.setItem('banana.branch', cfg.branch);
  localStorage.setItem('banana.token', cfg.token);
}

function log(message: string) {
  const el = $('log');
  el.textContent = `${new Date().toLocaleTimeString()}  ${message}\n${el.textContent ?? ''}`;
}

function send(message: unknown) {
  parent.postMessage({ pluginMessage: message }, '*');
}

function rawUrl(cfg: Config, path: string) {
  return `https://raw.githubusercontent.com/${cfg.owner}/${cfg.repo}/${cfg.branch}/${path}`;
}

async function fetchJson<T>(cfg: Config, path: string): Promise<T> {
  const res = await fetch(rawUrl(cfg, path), { cache: 'no-store' });
  if (!res.ok) throw new Error(`GET ${path} -> ${res.status}`);
  return (await res.json()) as T;
}

async function pushFile(cfg: Config, path: string, json: unknown) {
  const apiBase = `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${path}`;
  const headers = {
    Authorization: `token ${cfg.token}`,
    Accept: 'application/vnd.github+json',
  };
  let sha: string | undefined;
  const existing = await fetch(`${apiBase}?ref=${cfg.branch}`, { headers });
  if (existing.ok) sha = (await existing.json()).sha;

  const content = btoa(unescape(encodeURIComponent(JSON.stringify(json, null, 2) + '\n')));
  const res = await fetch(apiBase, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      message: `chore(figma): sync ${path}`,
      content,
      sha,
      branch: cfg.branch,
    }),
  });
  if (!res.ok) throw new Error(`PUT ${path} -> ${res.status} ${await res.text()}`);
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

document.body.innerHTML = `
  <style>
    body { font-family: 'Inter', system-ui, sans-serif; margin: 0; padding: 12px; font-size: 12px; }
    h2 { margin: 0 0 8px; font-size: 14px; }
    label { display: block; margin: 6px 0 2px; font-weight: 600; }
    input { width: 100%; box-sizing: border-box; padding: 6px; border: 2px solid #000; border-radius: 0; }
    .row { display: flex; gap: 8px; }
    .row > div { flex: 1; }
    button { margin-top: 10px; margin-right: 6px; padding: 8px 12px; border: 3px solid #000;
      background: #FFD23F; font-weight: 700; cursor: pointer; border-radius: 0;
      box-shadow: 4px 4px 0 #000; }
    button:active { transform: translate(4px, 4px); box-shadow: 0 0 0 #000; }
    pre { background: #f4f4f4; border: 2px solid #000; padding: 6px; height: 120px; overflow: auto;
      white-space: pre-wrap; margin-top: 10px; }
  </style>
  <h2>Banana DS Sync</h2>
  <div class="row">
    <div><label>Owner</label><input id="owner" /></div>
    <div><label>Repo</label><input id="repo" /></div>
  </div>
  <div class="row">
    <div><label>Branch</label><input id="branch" /></div>
    <div><label>GitHub PAT</label><input id="token" type="password" /></div>
  </div>
  <div>
    <button id="pull">Pull Variables</button>
    <button id="build">Build Components</button>
    <button id="push">Push State</button>
  </div>
  <pre id="log"></pre>
`;

const initial = loadConfig();
$<HTMLInputElement>('owner').value = initial.owner;
$<HTMLInputElement>('repo').value = initial.repo;
$<HTMLInputElement>('branch').value = initial.branch;
$<HTMLInputElement>('token').value = initial.token;

$('pull').onclick = async () => {
  try {
    const cfg = readForm();
    log('Fetching variables spec…');
    const spec = await fetchJson<VariablesSpec>(cfg, `${SPEC_BASE}/variables.json`);
    send({ type: 'pull-variables', spec });
  } catch (e) {
    log(`Error: ${(e as Error).message}`);
  }
};

$('build').onclick = async () => {
  try {
    const cfg = readForm();
    log('Fetching component specs…');
    const specs: ComponentSpec[] = [];
    for (const file of COMPONENT_FILES) {
      specs.push(await fetchJson<ComponentSpec>(cfg, `${SPEC_BASE}/${file}`));
    }
    send({ type: 'build-components', specs });
  } catch (e) {
    log(`Error: ${(e as Error).message}`);
  }
};

$('push').onclick = () => {
  readForm();
  log('Exporting Figma state…');
  send({ type: 'export-state' });
};

window.onmessage = async (event: MessageEvent) => {
  const msg = event.data.pluginMessage;
  if (!msg) return;
  if (msg.type === 'log') {
    log(msg.message);
  } else if (msg.type === 'state') {
    try {
      const cfg = loadConfig();
      if (!cfg.token) {
        log('Error: a GitHub PAT is required to push.');
        return;
      }
      log('Pushing state to GitHub…');
      await pushFile(cfg, STATE_PATH, msg.payload);
      log(`Pushed ${STATE_PATH}`);
    } catch (e) {
      log(`Error: ${(e as Error).message}`);
    }
  }
};
