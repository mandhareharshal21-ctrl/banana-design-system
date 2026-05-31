// Generate a Figma-oriented variables spec from the resolved design tokens.
// Output: specs/variables.json — consumed by the plugin (Pull) to create Figma Variables.
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tokens } from '@banana/tokens';

const here = dirname(fileURLToPath(import.meta.url));
const specsDir = join(here, '..', 'specs');
const outPath = join(specsDir, 'variables.json');

const COLLECTION = 'Banana';
const MODE = 'Default';

// Token groups that do not map cleanly onto Figma variable primitives.
// Hard shadows become Figma effect styles, not variables.
const SKIP_PREFIXES = ['shadow'];

/** Classify a resolved token value into a Figma variable type + normalized value. */
function classify(value) {
  if (typeof value === 'number') return { type: 'FLOAT', value };
  if (typeof value === 'string') {
    if (/^#([0-9a-f]{3,8})$/i.test(value)) return { type: 'COLOR', value };
    const dimension = value.match(/^(-?\d*\.?\d+)(px|ms|em|rem)?$/);
    if (dimension) return { type: 'FLOAT', value: parseFloat(dimension[1]) };
    return { type: 'STRING', value };
  }
  return null;
}

const variables = [];
function walk(node, path) {
  if (node && typeof node === 'object' && !Array.isArray(node)) {
    for (const key of Object.keys(node)) walk(node[key], [...path, key]);
    return;
  }
  const name = path.join('/');
  if (SKIP_PREFIXES.some((p) => path[0] === p)) return;
  const classified = classify(node);
  if (!classified) return;
  variables.push({
    name,
    type: classified.type,
    valuesByMode: { [MODE]: classified.value },
  });
}

walk(tokens, []);

const spec = { collection: COLLECTION, modes: [MODE], variables };

if (!existsSync(specsDir)) mkdirSync(specsDir, { recursive: true });
writeFileSync(outPath, JSON.stringify(spec, null, 2) + '\n');
console.log(`figma-plugin: wrote ${variables.length} variables -> specs/variables.json`);
