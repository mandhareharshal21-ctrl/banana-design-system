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

export interface ComponentSpec {
  name: string;
  width?: number;
  height?: number;
  cornerRadius?: number;
  /** [top, right, bottom, left] */
  padding?: [number, number, number, number];
  fillVar?: string;
  fill?: string;
  strokeVar?: string;
  stroke?: string;
  strokeWeight?: number;
  shadow?: { x: number; y: number; color: string };
  text?: string;
  textColorVar?: string;
  textColor?: string;
  fontSize?: number;
  fontWeight?: number;
}

export type UiToCode =
  | { type: 'pull-variables'; spec: VariablesSpec }
  | { type: 'build-components'; specs: ComponentSpec[] }
  | { type: 'export-state' };

export type CodeToUi =
  | { type: 'log'; message: string }
  | { type: 'result'; action: 'pull' | 'build'; ok: boolean; message: string }
  | { type: 'state'; payload: unknown };
