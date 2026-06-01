// Generate Figma component-set specs + text styles from the design tokens.
// Output:
//   specs/components/<slug>.json  — one ComponentSetSpec per component (variants/states + props)
//   specs/components.json         — manifest [{ file, name }] used by the plugin UI build list
//   specs/text-styles.json        — TextStyleSpec[] created/updated by Pull
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tokens } from '@banana/tokens';

const here = dirname(fileURLToPath(import.meta.url));
const specsDir = join(here, '..', 'specs');
const compDir = join(specsDir, 'components');

// ---- token helpers -------------------------------------------------------
function tok(path) {
  return path.split('/').reduce((n, k) => (n == null ? n : n[k]), tokens);
}
function px(v) {
  if (typeof v === 'number') return v;
  const m = String(v).match(/(-?\d*\.?\d+)/);
  return m ? parseFloat(m[1]) : 0;
}
// Color paint: bound to a variable by name, with the resolved hex as fallback.
function c(name) {
  const hex = tok(name);
  return { var: name, hex: typeof hex === 'string' ? hex : '#000000' };
}
const INK = tok('color/ink');
const SH = {
  sm: { x: 2, y: 2, color: INK },
  md: { x: 4, y: 4, color: INK },
  lg: { x: 6, y: 6, color: INK },
};
const SIZE = {
  xs: px(tok('font/size/xs')),
  sm: px(tok('font/size/sm')),
  md: px(tok('font/size/md')),
  lg: px(tok('font/size/lg')),
  xl: px(tok('font/size/xl')),
  xxl: px(tok('font/size/2xl')),
};

// ---- node builders -------------------------------------------------------
function f(o = {}) {
  return {
    layout: o.layout ?? 'HORIZONTAL',
    padding: o.padding,
    itemSpacing: o.gap,
    primaryAxisAlign: o.main ?? 'CENTER',
    counterAxisAlign: o.cross ?? 'CENTER',
    cornerRadius: o.radius ?? 0,
    fill: o.fill,
    stroke: o.stroke,
    strokeWeight: o.sw,
    shadow: o.shadow,
    width: o.w,
    height: o.h,
    fixedWidth: o.w != null,
    fixedHeight: o.h != null,
    opacity: o.opacity,
    children: o.children ?? [],
  };
}
function t(text, o = {}) {
  return {
    text,
    fontStyle: o.style ?? 'Bold',
    fontSize: o.size ?? SIZE.md,
    mono: o.mono ?? false,
    letterSpacing: o.ls,
    textColor: o.color ?? c('color/text/primary'),
    bindText: o.bind,
  };
}
const border = () => c('color/border');

// A small square "glyph" box used to stand in for icons / indicators.
function glyph(o = {}) {
  return f({
    w: o.size ?? 20,
    h: o.size ?? 20,
    radius: o.radius,
    fill: o.fill ?? c('color/white'),
    stroke: o.stroke ?? border(),
    sw: o.sw ?? 2,
    children: o.children ?? [],
  });
}

// ---- components ----------------------------------------------------------
const STATES = ['Default', 'Hover', 'Active', 'Disabled'];
function stateShadow(state, base = SH.md) {
  if (state === 'Hover') return SH.lg;
  if (state === 'Active') return null; // pressed: shadow collapses
  return base;
}
const stateOpacity = (s) => (s === 'Disabled' ? 0.5 : 1);

function button() {
  const fills = {
    Primary: { fill: c('color/brand/yellow'), text: c('color/text/onAccent') },
    Secondary: { fill: c('color/brand/cyan'), text: c('color/text/onAccent') },
    Outline: { fill: c('color/white'), text: c('color/text/primary') },
  };
  const variants = [];
  for (const [variant, st] of Object.entries(fills)) {
    for (const State of STATES) {
      variants.push({
        props: { Variant: variant, State },
        node: f({
          padding: [12, 18, 12, 18],
          gap: 8,
          fill: st.fill,
          stroke: border(),
          sw: 3,
          shadow: stateShadow(State),
          opacity: stateOpacity(State),
          children: [t('Button', { color: st.text, bind: 'Label', ls: 0.5 })],
        }),
      });
    }
  }
  return { name: 'Button', properties: [{ name: 'Label', type: 'TEXT', default: 'Button' }], variants };
}

function iconButton() {
  return {
    name: 'IconButton',
    variants: STATES.map((State) => ({
      props: { State },
      node: f({
        padding: [8, 8, 8, 8],
        fill: c('color/white'),
        stroke: border(),
        sw: 3,
        shadow: stateShadow(State, SH.sm),
        opacity: stateOpacity(State),
        children: [glyph({ size: 20, fill: c('color/brand/yellow') })],
      }),
    })),
  };
}

function fab() {
  return {
    name: 'Fab',
    variants: STATES.map((State) => ({
      props: { State },
      node: f({
        padding: [14, 14, 14, 14],
        fill: c('color/brand/yellow'),
        stroke: border(),
        sw: 3,
        shadow: stateShadow(State),
        opacity: stateOpacity(State),
        children: [glyph({ size: 24, fill: c('color/white') })],
      }),
    })),
  };
}

function toggleButton() {
  const map = {
    Off: { fill: c('color/white'), text: c('color/text/primary'), shadow: SH.sm },
    On: { fill: c('color/brand/yellow'), text: c('color/text/onAccent'), shadow: null },
  };
  return {
    name: 'ToggleButton',
    properties: [{ name: 'Label', type: 'TEXT', default: 'Toggle' }],
    variants: Object.entries(map).map(([State, st]) => ({
      props: { State },
      node: f({
        padding: [10, 16, 10, 16],
        fill: st.fill,
        stroke: border(),
        sw: 3,
        shadow: st.shadow,
        children: [t('Toggle', { color: st.text, bind: 'Label' })],
      }),
    })),
  };
}

function chip() {
  const variants = [];
  for (const Variant of ['Filled', 'Outlined']) {
    for (const State of ['Default', 'Disabled']) {
      variants.push({
        props: { Variant, State },
        node: f({
          padding: [6, 12, 6, 12],
          gap: 6,
          fill: Variant === 'Filled' ? c('color/brand/yellow') : c('color/white'),
          stroke: border(),
          sw: 2,
          shadow: SH.sm,
          opacity: stateOpacity(State),
          children: [t('Chip', { size: SIZE.sm, bind: 'Label' })],
        }),
      });
    }
  }
  return { name: 'Chip', properties: [{ name: 'Label', type: 'TEXT', default: 'Chip' }], variants };
}

function badge() {
  return {
    name: 'Badge',
    properties: [{ name: 'Content', type: 'TEXT', default: '4' }],
    variants: [
      {
        props: { State: 'Default' },
        node: f({
          padding: [2, 8, 2, 8],
          fill: c('color/feedback/error'),
          stroke: border(),
          sw: 2,
          children: [t('4', { size: SIZE.xs, color: c('color/white'), bind: 'Content' })],
        }),
      },
    ],
  };
}

function avatar() {
  return {
    name: 'Avatar',
    properties: [{ name: 'Initials', type: 'TEXT', default: 'BA' }],
    variants: [
      {
        props: { State: 'Default' },
        node: f({
          w: 48,
          h: 48,
          fill: c('color/brand/purple'),
          stroke: border(),
          sw: 3,
          children: [t('BA', { color: c('color/white'), bind: 'Initials' })],
        }),
      },
    ],
  };
}

function checkbox() {
  const map = {
    Unchecked: { fill: c('color/white'), mark: false },
    Checked: { fill: c('color/brand/yellow'), mark: true },
    Disabled: { fill: c('color/white'), mark: false, op: 0.5 },
  };
  return {
    name: 'Checkbox',
    variants: Object.entries(map).map(([State, st]) => ({
      props: { State },
      node: f({
        w: 24,
        h: 24,
        fill: st.fill,
        stroke: border(),
        sw: 3,
        opacity: st.op ?? 1,
        children: st.mark ? [t('X', { size: SIZE.sm, color: c('color/ink') })] : [],
      }),
    })),
  };
}

function radio() {
  const map = {
    Unselected: { dot: false },
    Selected: { dot: true },
    Disabled: { dot: false, op: 0.5 },
  };
  return {
    name: 'Radio',
    variants: Object.entries(map).map(([State, st]) => ({
      props: { State },
      node: f({
        w: 24,
        h: 24,
        fill: c('color/white'),
        stroke: border(),
        sw: 3,
        opacity: st.op ?? 1,
        children: st.dot ? [glyph({ size: 10, fill: c('color/ink'), sw: 0 })] : [],
      }),
    })),
  };
}

function switchComp() {
  // Pill-shaped switch (matches Figma node 15-169). State names + visuals mirror
  // the Figma source exactly: 'Disabled ON' is drawn in the OFF position and
  // 'Disabled OFF' in the ON position.
  const map = {
    Off: { fill: c('color/white'), main: 'MIN' },
    On: { fill: c('color/brand/lime'), main: 'MAX' },
    'Disabled ON': { fill: c('color/white'), main: 'MIN', op: 0.5 },
    'Disabled OFF': { fill: c('color/brand/lime'), main: 'MAX', op: 0.5 },
  };
  return {
    name: 'Switch',
    variants: Object.entries(map).map(([State, st]) => ({
      props: { State },
      node: f({
        w: 52,
        h: 30,
        radius: 999,
        padding: [3, 4, 3, 4],
        main: st.main,
        cross: 'CENTER',
        fill: st.fill,
        stroke: border(),
        sw: 3,
        opacity: st.op ?? 1,
        children: [glyph({ size: 20, radius: 999, fill: c('color/ink'), sw: 0 })],
      }),
    })),
  };
}

function textField() {
  const map = {
    Default: { stroke: border(), label: c('color/text/secondary') },
    Focused: { stroke: c('color/brand/cyan'), label: c('color/text/primary'), shadow: SH.sm },
    Error: { stroke: c('color/feedback/error'), label: c('color/feedback/error') },
    Disabled: { stroke: border(), label: c('color/text/disabled'), op: 0.5 },
  };
  return {
    name: 'TextField',
    properties: [
      { name: 'Label', type: 'TEXT', default: 'Label' },
      { name: 'Value', type: 'TEXT', default: 'Value' },
    ],
    variants: Object.entries(map).map(([State, st]) => ({
      props: { State },
      node: f({
        layout: 'VERTICAL',
        cross: 'MIN',
        gap: 4,
        w: 240,
        opacity: st.op ?? 1,
        children: [
          t('Label', { size: SIZE.sm, color: st.label, bind: 'Label' }),
          f({
            w: 240,
            padding: [10, 12, 10, 12],
            main: 'MIN',
            fill: c('color/white'),
            stroke: st.stroke,
            sw: 3,
            shadow: st.shadow,
            children: [t('Value', { style: 'Regular', color: c('color/text/primary'), bind: 'Value' })],
          }),
        ],
      }),
    })),
  };
}

function alert() {
  const sev = {
    Info: c('color/feedback/info'),
    Success: c('color/feedback/success'),
    Warning: c('color/feedback/warning'),
    Error: c('color/feedback/error'),
  };
  return {
    name: 'Alert',
    properties: [
      { name: 'Title', type: 'TEXT', default: 'Heads up' },
      { name: 'Message', type: 'TEXT', default: 'This is an alert.' },
    ],
    variants: Object.entries(sev).map(([Severity, fill]) => ({
      props: { Severity },
      node: f({
        layout: 'VERTICAL',
        cross: 'MIN',
        gap: 2,
        w: 320,
        padding: [12, 14, 12, 14],
        main: 'MIN',
        fill,
        stroke: border(),
        sw: 3,
        shadow: SH.md,
        children: [
          t('Heads up', { color: c('color/ink'), bind: 'Title' }),
          t('This is an alert.', { style: 'Regular', size: SIZE.sm, color: c('color/ink'), bind: 'Message' }),
        ],
      }),
    })),
  };
}

function tooltip() {
  return {
    name: 'Tooltip',
    properties: [{ name: 'Label', type: 'TEXT', default: 'Tooltip' }],
    variants: [
      {
        props: { State: 'Default' },
        node: f({
          padding: [6, 10, 6, 10],
          fill: c('color/ink'),
          stroke: border(),
          sw: 2,
          children: [t('Tooltip', { mono: true, style: 'Regular', size: SIZE.xs, color: c('color/white'), bind: 'Label' })],
        }),
      },
    ],
  };
}

function tab() {
  const map = {
    Default: { fill: c('color/white'), text: c('color/text/primary') },
    Selected: { fill: c('color/brand/yellow'), text: c('color/text/onAccent') },
    Disabled: { fill: c('color/white'), text: c('color/text/disabled'), op: 0.5 },
  };
  return {
    name: 'Tab',
    properties: [{ name: 'Label', type: 'TEXT', default: 'Tab' }],
    variants: Object.entries(map).map(([State, st]) => ({
      props: { State },
      node: f({
        padding: [10, 16, 10, 16],
        fill: st.fill,
        stroke: border(),
        sw: 3,
        opacity: st.op ?? 1,
        children: [t('Tab', { color: st.text, bind: 'Label' })],
      }),
    })),
  };
}

function link() {
  const map = {
    Default: c('color/brand/pink'),
    Hover: c('color/ink'),
  };
  return {
    name: 'Link',
    properties: [{ name: 'Label', type: 'TEXT', default: 'Link' }],
    variants: Object.entries(map).map(([State, color]) => ({
      props: { State },
      node: f({
        padding: [2, 2, 2, 2],
        children: [t('Link', { color, bind: 'Label', ls: 0.3 })],
      }),
    })),
  };
}

function divider() {
  return {
    name: 'Divider',
    variants: [
      {
        props: { Orientation: 'Horizontal' },
        node: f({ w: 240, h: 3, fill: c('color/border') }),
      },
    ],
  };
}

function slider() {
  return {
    name: 'Slider',
    variants: [
      {
        props: { State: 'Default' },
        node: f({
          w: 240,
          h: 28,
          padding: [0, 0, 0, 0],
          main: 'MIN',
          cross: 'CENTER',
          children: [
            f({
              w: 240,
              h: 8,
              main: 'MIN',
              fill: c('color/white'),
              stroke: border(),
              sw: 2,
              children: [f({ w: 120, h: 8, fill: c('color/brand/yellow') })],
            }),
          ],
        }),
      },
    ],
  };
}

function linearProgress() {
  return {
    name: 'LinearProgress',
    variants: [
      {
        props: { State: 'Determinate' },
        node: f({
          w: 240,
          h: 16,
          main: 'MIN',
          fill: c('color/white'),
          stroke: border(),
          sw: 3,
          children: [f({ w: 150, h: 16, fill: c('color/brand/yellow') })],
        }),
      },
    ],
  };
}

function card() {
  return {
    name: 'Card',
    properties: [
      { name: 'Title', type: 'TEXT', default: 'Card title' },
      { name: 'Body', type: 'TEXT', default: 'Card body text goes here.' },
    ],
    variants: [
      {
        props: { State: 'Default' },
        node: f({
          layout: 'VERTICAL',
          cross: 'MIN',
          gap: 8,
          w: 280,
          padding: [16, 16, 16, 16],
          main: 'MIN',
          fill: c('color/background/paper'),
          stroke: border(),
          sw: 3,
          shadow: SH.lg,
          children: [
            t('Card title', { size: SIZE.lg, bind: 'Title' }),
            t('Card body text goes here.', { style: 'Regular', size: SIZE.sm, color: c('color/text/secondary'), bind: 'Body' }),
          ],
        }),
      },
    ],
  };
}

function accordion() {
  const map = {
    Collapsed: { body: false },
    Expanded: { body: true },
  };
  return {
    name: 'Accordion',
    properties: [{ name: 'Title', type: 'TEXT', default: 'Section' }],
    variants: Object.entries(map).map(([State, st]) => ({
      props: { State },
      node: f({
        layout: 'VERTICAL',
        cross: 'MIN',
        w: 320,
        main: 'MIN',
        fill: c('color/background/paper'),
        stroke: border(),
        sw: 3,
        shadow: SH.md,
        children: [
          f({
            w: 320,
            padding: [12, 14, 12, 14],
            main: 'SPACE_BETWEEN',
            fill: c('color/brand/yellow'),
            children: [t('Section', { bind: 'Title' }), t(st.body ? '–' : '+', { size: SIZE.lg })],
          }),
          ...(st.body
            ? [
                f({
                  w: 320,
                  padding: [12, 14, 12, 14],
                  main: 'MIN',
                  children: [t('Panel content.', { style: 'Regular', size: SIZE.sm, color: c('color/text/secondary') })],
                }),
              ]
            : []),
        ],
      }),
    })),
  };
}

const BUILDERS = [
  button,
  iconButton,
  fab,
  toggleButton,
  chip,
  badge,
  avatar,
  checkbox,
  radio,
  switchComp,
  textField,
  alert,
  tooltip,
  tab,
  link,
  divider,
  slider,
  linearProgress,
  card,
  accordion,
];

const slug = (name) => name.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();

// ---- text styles ---------------------------------------------------------
const GROTESK = 'Space Grotesk';
const MONO = 'Space Mono';
const textStyles = [
  { name: 'Display/2xl', fontFamily: GROTESK, fontStyle: 'Bold', fontSize: SIZE.xxl },
  { name: 'Heading/xl', fontFamily: GROTESK, fontStyle: 'Bold', fontSize: SIZE.xl },
  { name: 'Heading/lg', fontFamily: GROTESK, fontStyle: 'Bold', fontSize: SIZE.lg },
  { name: 'Body/md', fontFamily: GROTESK, fontStyle: 'Regular', fontSize: SIZE.md },
  { name: 'Body/sm', fontFamily: GROTESK, fontStyle: 'Regular', fontSize: SIZE.sm },
  { name: 'Label/Button', fontFamily: GROTESK, fontStyle: 'Bold', fontSize: SIZE.md, letterSpacing: 0.5 },
  { name: 'Caption', fontFamily: GROTESK, fontStyle: 'Regular', fontSize: SIZE.xs },
  { name: 'Mono/sm', fontFamily: MONO, fontStyle: 'Regular', fontSize: SIZE.sm },
];

// ---- write ---------------------------------------------------------------
if (!existsSync(compDir)) mkdirSync(compDir, { recursive: true });

const manifest = [];
for (const build of BUILDERS) {
  const spec = build();
  const file = `components/${slug(spec.name)}.json`;
  writeFileSync(join(specsDir, file), JSON.stringify(spec, null, 2) + '\n');
  manifest.push({ file, name: spec.name });
}

writeFileSync(join(specsDir, 'components.json'), JSON.stringify(manifest, null, 2) + '\n');
writeFileSync(join(specsDir, 'text-styles.json'), JSON.stringify(textStyles, null, 2) + '\n');

console.log(
  `figma-plugin: wrote ${manifest.length} component specs + ${textStyles.length} text styles -> specs/`,
);
