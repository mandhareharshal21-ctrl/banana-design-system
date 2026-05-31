/// <reference types="@figma/plugin-typings" />
import type { VariablesSpec, ComponentSpec, UiToCode } from './types';

figma.showUI(__html__, { width: 380, height: 540 });

// Variable lookup populated by Pull, used when binding component paints.
const varByName = new Map<string, Variable>();

function log(message: string) {
  figma.ui.postMessage({ type: 'log', message });
}

function hexToRgba(hex: string) {
  const h = hex.replace('#', '');
  const full = h.length === 3
    ? h.split('').map((c) => c + c).join('')
    : h;
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

async function pullVariables(spec: VariablesSpec) {
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  let collection = collections.find((c) => c.name === spec.collection);
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
  log(`Pulled ${spec.variables.length} variables (${created} new) into "${spec.collection}".`);
}

function boundOrPlain(hex: string, varName: string | undefined): SolidPaint {
  const paint: SolidPaint = { type: 'SOLID', color: rgb(hex) };
  const variable = varName ? varByName.get(varName) : undefined;
  return variable ? figma.variables.setBoundVariableForPaint(paint, 'color', variable) : paint;
}

async function buildComponents(specs: ComponentSpec[]) {
  await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });
  let cursorX = 0;
  for (const s of specs) {
    const comp = figma.createComponent();
    comp.name = s.name;
    comp.layoutMode = 'HORIZONTAL';
    comp.primaryAxisAlignItems = 'CENTER';
    comp.counterAxisAlignItems = 'CENTER';
    comp.primaryAxisSizingMode = 'AUTO';
    comp.counterAxisSizingMode = 'AUTO';
    const [pt, pr, pb, pl] = s.padding ?? [12, 18, 12, 18];
    comp.paddingTop = pt;
    comp.paddingRight = pr;
    comp.paddingBottom = pb;
    comp.paddingLeft = pl;
    comp.cornerRadius = s.cornerRadius ?? 0;

    comp.fills = [boundOrPlain(s.fill ?? '#FFFFFF', s.fillVar)];
    comp.strokes = [boundOrPlain(s.stroke ?? '#000000', s.strokeVar)];
    comp.strokeWeight = s.strokeWeight ?? 3;

    if (s.shadow) {
      comp.effects = [
        {
          type: 'DROP_SHADOW',
          color: hexToRgba(s.shadow.color),
          offset: { x: s.shadow.x, y: s.shadow.y },
          radius: 0,
          spread: 0,
          visible: true,
          blendMode: 'NORMAL',
        },
      ];
    }

    if (s.text) {
      const text = figma.createText();
      text.fontName = { family: 'Inter', style: 'Bold' };
      text.characters = s.text;
      text.fontSize = s.fontSize ?? 16;
      text.fills = [boundOrPlain(s.textColor ?? '#000000', s.textColorVar)];
      comp.appendChild(text);
    }

    comp.x = cursorX;
    cursorX += 240;
    figma.currentPage.appendChild(comp);
  }
  log(`Built ${specs.length} component(s).`);
}

async function exportState() {
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const variables = await figma.variables.getLocalVariablesAsync();
  return {
    generatedAt: new Date().toISOString(),
    collections: collections.map((c) => ({ name: c.name, modes: c.modes.map((m) => m.name) })),
    variables: variables.map((v) => ({
      name: v.name,
      type: v.resolvedType,
      valuesByMode: v.valuesByMode,
    })),
    components: figma.currentPage.children
      .filter((n): n is ComponentNode => n.type === 'COMPONENT')
      .map((n) => ({ name: n.name, width: Math.round(n.width), height: Math.round(n.height) })),
  };
}

figma.ui.onmessage = async (msg: UiToCode) => {
  try {
    if (msg.type === 'pull-variables') await pullVariables(msg.spec);
    else if (msg.type === 'build-components') await buildComponents(msg.specs);
    else if (msg.type === 'export-state') {
      figma.ui.postMessage({ type: 'state', payload: await exportState() });
    }
  } catch (error) {
    log(`Error: ${(error as Error).message}`);
  }
};
