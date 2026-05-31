export type FigmaVarType = 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN';

export interface VariablesSpec {
  collection: string;
  modes: string[];
  variables: Array<{
    name: string;
    type: FigmaVarType;
    valuesByMode: Record<string, string | number | boolean>;
  }>;
}

/** A color reference: bound to a Figma variable by name, with a hex fallback. */
export interface PaintRef {
  var?: string;
  hex?: string;
}

export type AxisAlign = 'MIN' | 'CENTER' | 'MAX' | 'SPACE_BETWEEN';

/** Recursive node: a text node if `text` is set, otherwise an auto-layout frame. */
export interface NodeSpec {
  name?: string;
  // Text node
  text?: string;
  fontSize?: number;
  fontStyle?: 'Regular' | 'Medium' | 'Bold';
  mono?: boolean;
  letterSpacing?: number;
  textColor?: PaintRef;
  /** Bind this text node's characters to a TEXT component property of this name. */
  bindText?: string;
  // Frame node
  layout?: 'HORIZONTAL' | 'VERTICAL';
  width?: number;
  height?: number;
  fixedWidth?: boolean;
  fixedHeight?: boolean;
  /** [top, right, bottom, left] */
  padding?: [number, number, number, number];
  itemSpacing?: number;
  primaryAxisAlign?: AxisAlign;
  counterAxisAlign?: 'MIN' | 'CENTER' | 'MAX';
  cornerRadius?: number;
  fill?: PaintRef;
  stroke?: PaintRef;
  strokeWeight?: number;
  shadow?: { x: number; y: number; color: string };
  opacity?: number;
  children?: NodeSpec[];
}

export interface ComponentProperty {
  name: string;
  type: 'TEXT' | 'BOOLEAN';
  default?: string | boolean;
}

export interface VariantSpec {
  /** Variant property values, e.g. { Variant: 'Primary', State: 'Hover' }. */
  props: Record<string, string>;
  node: NodeSpec;
}

export interface ComponentSetSpec {
  name: string;
  properties?: ComponentProperty[];
  variants: VariantSpec[];
}

/** One entry per component file, used to render the build list in the UI. */
export interface ComponentManifestEntry {
  file: string;
  name: string;
}

export interface TextStyleSpec {
  name: string;
  fontFamily: string;
  fontStyle: 'Regular' | 'Medium' | 'Bold';
  fontSize: number;
  letterSpacing?: number;
}

export interface PluginConfig {
  owner: string;
  repo: string;
  branch: string;
  token: string;
}

export type UiToCode =
  | { type: 'pull-variables'; spec: VariablesSpec; textStyles: TextStyleSpec[] }
  | { type: 'build-component'; spec: ComponentSetSpec }
  | { type: 'export-state' }
  | { type: 'get-config' }
  | { type: 'save-config'; config: PluginConfig };

export type CodeToUi =
  | { type: 'log'; message: string }
  | { type: 'result'; action: 'pull' | 'build'; ok: boolean; message: string }
  | { type: 'config'; config: PluginConfig }
  | { type: 'state'; payload: unknown };
