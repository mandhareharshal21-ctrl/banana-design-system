// Bundle the Figma plugin: dist/code.js (sandbox) + dist/ui.html (iframe with inlined JS).
import { build } from 'esbuild';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const dist = join(here, 'dist');
if (!existsSync(dist)) mkdirSync(dist, { recursive: true });

await build({
  entryPoints: [join(here, 'src/code.ts')],
  bundle: true,
  outfile: join(dist, 'code.js'),
  target: 'es2017',
  format: 'iife',
  logLevel: 'warning',
});

const ui = await build({
  entryPoints: [join(here, 'src/ui.ts')],
  bundle: true,
  write: false,
  target: 'es2017',
  format: 'iife',
  logLevel: 'warning',
});

const js = ui.outputFiles[0].text;
const html = `<!DOCTYPE html><html><head><meta charset="utf-8" /></head><body></body><script>${js}</script></html>`;
writeFileSync(join(dist, 'ui.html'), html);

console.log('figma-plugin: bundled dist/code.js + dist/ui.html');
