/// <reference types="@figma/plugin-typings" />
import type {
  VariablesSpec,
  ComponentSetSpec,
  NodeSpec,
  PaintRef,
  TextStyleSpec,
  PluginConfig,
  UiToCode,
} from './types';

figma.showUI(__html__, { width: 400, height: 620 });

// Variable lookup, keyed by variable name (e.g. "color/brand/yellow").
const varByName = new Map<string, Variable>();

function log(message: string) {
  figma.ui.postMessage({ type: 'log', message });
}
function result(action: 'pull' | 'build', ok: boolean, message: string) {
  figma.ui.postMessage({ type: 'result', action, ok, message });
}

function hexToRgba(hex: string) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((ch) => ch + ch).join('') : h;
  return {
    r: parseInt(full.slice(0, 2), 16) / 255,
    g: parseInt(full.slice(2, 4), 16) / 255,
    b: parseInt(full.slice(4, 6), 16) / 255,
    a: full.length >= 8 ? parseInt(full.slice(6, 8), 16) / 255 : 1,
  };
}
function rgb(hex: string) {
  const { r, g, b } = hexToRgba(hex);
  return { r, g, b };
}

// ---- config persistence (figma.clientStorage) ----------------------------
const CONFIG_KEY = 'banana.config';
async function getConfig(): Promise<PluginConfig> {
  const stored = (await figma.clientStorage.getAsync(CONFIG_KEY)) as PluginConfig | undefined;
  return {
    owner: stored?.owner ?? 'mandhareharshal21-ctrl',
    repo: stored?.repo ?? 'banana-design-system',
    branch: stored?.branch ?? 'main',
    token: stored?.token ?? '',
  };
}
async function saveConfig(config: PluginConfig) {
  await figma.clientStorage.setAsync(CONFIG_KEY, config);
}

// ---- fonts ---------------------------------------------------------------
// Prefer the DS fonts; fall back to Inter when they are not installed.
const fontCache = new Map<string, FontName>();
async function resolveFont(family: string, style: string): Promise<FontName> {
  const key = `${family}|${style}`;
  const cached = fontCache.get(key);
  if (cached) return cached;
  const attempts: FontName[] = [
    { family, style },
    { family: 'Inter', style },
    { family: 'Inter', style: 'Regular' },
  ];
  for (const font of attempts) {
    try {
      await figma.loadFontAsync(font);
      fontCache.set(key, font);
      return font;
    } catch {
      /* try next */
    }
  }
  const fallback: FontName = { family: 'Roboto', style: 'Regular' };
  await figma.loadFontAsync(fallback);
  fontCache.set(key, fallback);
  return fallback;
}

// ---- variables -----------------------------------------------------------
async function pullVariables(spec: VariablesSpec) {
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  let collection = collections.find((cl) => cl.name === spec.collection);
  if (!collection) collection = figma.variables.createVariableCollection(spec.collection);

  const modeIdByName = new Map<string, string>();
  const firstMode = spec.modes[0] ?? 'Default';
  if (collection.modes[0].name !== firstMode) {
    collection.renameMode(collection.modes[0].modeId, firstMode);
  }
  modeIdByName.set(firstMode, collection.modes[0].modeId);
  for (const mode of spec.modes.slice(1)) {
    const found = collection.modes.find((m) => m.name === mode);
    modeIdByName.set(mode, found ? found.modeId : collection.addMode(mode));
  }

  const existing = await figma.variables.getLocalVariablesAsync();
  let created = 0;
  for (const v of spec.variables) {
    let variable = existing.find(
      (e) => e.name === v.name && e.variableCollectionId === collection.id,
    );
    if (!variable) {
      variable = figma.variables.createVariable(v.name, collection, v.type);
      created += 1;
    }
    for (const [modeName, value] of Object.entries(v.valuesByMode)) {
      const modeId = modeIdByName.get(modeName);
      if (!modeId) continue;
      const resolved = v.type === 'COLOR' ? hexToRgba(String(value)) : value;
      variable.setValueForMode(modeId, resolved as VariableValue);
    }
    varByName.set(v.name, variable);
  }
  return { count: spec.variables.length, created };
}

// ---- text styles ---------------------------------------------------------
async function createTextStyles(styles: TextStyleSpec[]) {
  const existing = await figma.getLocalTextStylesAsync();
  let created = 0;
  for (const s of styles) {
    let style = existing.find((e) => e.name === s.name);
    if (!style) {
      style = figma.createTextStyle();
      style.name = s.name;
      created += 1;
    }
    const font = await resolveFont(s.fontFamily, s.fontStyle);
    style.fontName = font;
    style.fontSize = s.fontSize;
    if (s.letterSpacing != null) style.letterSpacing = { value: s.letterSpacing, unit: 'PIXELS' };
  }
  return { count: styles.length, created };
}

// ---- component rendering -------------------------------------------------
let boundPaintCount = 0;
let plainPaintCount = 0;
async function hydrateVarMap() {
  const locals = await figma.variables.getLocalVariablesAsync();
  for (const v of locals) varByName.set(v.name, v);
}
function paintOf(ref: PaintRef | undefined): SolidPaint | null {
  if (!ref) return null;
  const paint: SolidPaint = { type: 'SOLID', color: rgb(ref.hex ?? '#000000') };
  const variable = ref.var ? varByName.get(ref.var) : undefined;
  if (variable) {
    boundPaintCount += 1;
    return figma.variables.setBoundVariableForPaint(paint, 'color', variable);
  }
  plainPaintCount += 1;
  return paint;
}

interface TextBinding {
  prop: string;
  node: TextNode;
}

// Apply frame-level properties to a container (a component root or a child frame).
function applyFrame(node: NodeSpec, target: FrameNode | ComponentNode) {
  target.layoutMode = node.layout ?? 'HORIZONTAL';
  target.primaryAxisAlignItems = node.primaryAxisAlign ?? 'CENTER';
  target.counterAxisAlignItems = (node.counterAxisAlign ?? 'CENTER') as 'MIN' | 'CENTER' | 'MAX';
  const [pt, pr, pb, pl] = node.padding ?? [0, 0, 0, 0];
  target.paddingTop = pt;
  target.paddingRight = pr;
  target.paddingBottom = pb;
  target.paddingLeft = pl;
  if (node.itemSpacing != null) target.itemSpacing = node.itemSpacing;
  target.cornerRadius = node.cornerRadius ?? 0;
  target.primaryAxisSizingMode = node.fixedWidth ? 'FIXED' : 'AUTO';
  target.counterAxisSizingMode = node.fixedHeight ? 'FIXED' : 'AUTO';

  const fill = paintOf(node.fill);
  target.fills = fill ? [fill] : [];
  const stroke = paintOf(node.stroke);
  target.strokes = stroke ? [stroke] : [];
  if (node.strokeWeight != null) target.strokeWeight = node.strokeWeight;
  if (node.shadow) {
    target.effects = [
      {
        type: 'DROP_SHADOW',
        color: hexToRgba(node.shadow.color),
        offset: { x: node.shadow.x, y: node.shadow.y },
        radius: 0,
        spread: 0,
        visible: true,
        blendMode: 'NORMAL',
      },
    ];
  }
  if (node.opacity != null) target.opacity = node.opacity;
}

async function renderChildren(node: NodeSpec, parent: FrameNode | ComponentNode, bindings: TextBinding[]) {
  for (const child of node.children ?? []) {
    const built = await renderNode(child, bindings);
    parent.appendChild(built);
  }
  // Fixed dimensions must be resized after children + sizing modes are set.
  if (node.fixedWidth || node.fixedHeight) {
    parent.resize(node.width ?? parent.width, node.height ?? parent.height);
  }
}

async function renderNode(node: NodeSpec, bindings: TextBinding[]): Promise<SceneNode> {
  if (node.text != null) {
    const text = figma.createText();
    text.fontName = await resolveFont(node.mono ? 'Space Mono' : 'Space Grotesk', node.fontStyle ?? 'Bold');
    text.characters = node.text;
    text.fontSize = node.fontSize ?? 16;
    if (node.letterSpacing != null) text.letterSpacing = { value: node.letterSpacing, unit: 'PIXELS' };
    const fill = paintOf(node.textColor);
    if (fill) text.fills = [fill];
    if (node.name) text.name = node.name;
    if (node.bindText) bindings.push({ prop: node.bindText, node: text });
    return text;
  }
  const frame = figma.createFrame();
  if (node.name) frame.name = node.name;
  applyFrame(node, frame);
  await renderChildren(node, frame, bindings);
  return frame;
}

function variantName(props: Record<string, string>): string {
  return Object.entries(props)
    .map(([k, v]) => `${k}=${v}`)
    .join(', ');
}

async function buildComponent(spec: ComponentSetSpec) {
  await hydrateVarMap();
  boundPaintCount = 0;
  plainPaintCount = 0;

  const components: ComponentNode[] = [];
  const bindingsByProp = new Map<string, TextNode[]>();

  for (const variant of spec.variants) {
    const comp = figma.createComponent();
    comp.name = variantName(variant.props);
    const bindings: TextBinding[] = [];
    applyFrame(variant.node, comp);
    await renderChildren(variant.node, comp, bindings);
    for (const b of bindings) {
      const list = bindingsByProp.get(b.prop) ?? [];
      list.push(b.node);
      bindingsByProp.set(b.prop, list);
    }
    components.push(comp);
  }

  // Combine into a variant set (gives the VARIANT properties from the names).
  const set = figma.combineAsVariants(components, figma.currentPage);
  set.name = spec.name;
  set.layoutMode = 'HORIZONTAL';
  set.itemSpacing = 24;
  set.counterAxisSpacing = 24;
  set.paddingTop = set.paddingBottom = set.paddingLeft = set.paddingRight = 24;

  // Add TEXT / BOOLEAN component properties and bind referenced nodes.
  for (const prop of spec.properties ?? []) {
    const def = set.addComponentProperty(
      prop.name,
      prop.type,
      (prop.default ?? (prop.type === 'TEXT' ? '' : true)) as string | boolean,
    );
    if (prop.type === 'TEXT') {
      for (const node of bindingsByProp.get(prop.name) ?? []) {
        node.componentPropertyReferences = { characters: def };
      }
    }
  }

  // Position near the viewport and frame it.
  set.x = Math.round(figma.viewport.center.x - set.width / 2);
  set.y = Math.round(figma.viewport.center.y - set.height / 2);
  figma.currentPage.appendChild(set);
  figma.viewport.scrollAndZoomIntoView([set]);

  const message =
    `Built "${spec.name}" set with ${spec.variants.length} variant(s). ` +
    `Paints: ${boundPaintCount} bound, ${plainPaintCount} plain.`;
  log(message);
  if (boundPaintCount === 0 && plainPaintCount > 0) {
    result('build', false, `${message} No paints bound — run Pull Variables first.`);
  } else {
    result('build', true, message);
  }
}

// ---- export (push) -------------------------------------------------------
async function exportState() {
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const variables = await figma.variables.getLocalVariablesAsync();
  const textStyles = await figma.getLocalTextStylesAsync();
  return {
    generatedAt: new Date().toISOString(),
    collections: collections.map((cl) => ({ name: cl.name, modes: cl.modes.map((m) => m.name) })),
    variables: variables.map((v) => ({ name: v.name, type: v.resolvedType, valuesByMode: v.valuesByMode })),
    textStyles: textStyles.map((s) => ({
      name: s.name,
      fontName: s.fontName,
      fontSize: s.fontSize,
    })),
    componentSets: figma.currentPage.children
      .filter((n): n is ComponentSetNode => n.type === 'COMPONENT_SET')
      .map((n) => ({
        name: n.name,
        variants: n.children.map((v) => v.name),
        width: Math.round(n.width),
        height: Math.round(n.height),
      })),
  };
}

figma.ui.onmessage = async (msg: UiToCode) => {
  try {
    if (msg.type === 'get-config') {
      figma.ui.postMessage({ type: 'config', config: await getConfig() });
    } else if (msg.type === 'save-config') {
      await saveConfig(msg.config);
    } else if (msg.type === 'pull-variables') {
      const v = await pullVariables(msg.spec);
      const ts = await createTextStyles(msg.textStyles);
      const message =
        `Pulled ${v.count} variables (${v.created} new) + ` +
        `${ts.count} text styles (${ts.created} new).`;
      log(message);
      result('pull', true, message);
    } else if (msg.type === 'build-component') {
      await buildComponent(msg.spec);
    } else if (msg.type === 'export-state') {
      figma.ui.postMessage({ type: 'state', payload: await exportState() });
    }
  } catch (error) {
    const message = (error as Error).message;
    log(`Error: ${message}`);
    if (msg.type === 'pull-variables') result('pull', false, message);
    else if (msg.type === 'build-component') result('build', false, message);
  }
};
