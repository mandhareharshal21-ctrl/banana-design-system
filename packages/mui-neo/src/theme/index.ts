import { createTheme, type Theme, type ThemeOptions } from '@mui/material/styles';
import { tokens } from '@banana/tokens';

const { color, border, radius, shadow, font, motion } = tokens;

/** Strip a `"4px"` dimension token to the numeric `4` that some MUI fields expect. */
const px = (value: string): number => parseFloat(value);

const noShadow = `0px 0px 0px 0px ${color.ink}`;
const transition = `transform ${motion.duration.fast} ${motion.easing.snap}, box-shadow ${motion.duration.fast} ${motion.easing.snap}`;
const press = motion.pressOffset;

const focusRing = {
  outline: `${border.width.regular} solid ${color.brand.cyan}`,
  outlineOffset: 2,
};

/**
 * Build the Neo-Brutalist MUI theme from design tokens.
 * Every visual decision traces back to `@banana/tokens` so code and Figma stay in lockstep.
 */
export function createNeoBrutalistTheme(options: ThemeOptions = {}): Theme {
  return createTheme(
    {
      palette: {
        mode: 'light',
        primary: { main: color.brand.yellow, contrastText: color.text.onAccent },
        secondary: { main: color.brand.pink, contrastText: color.text.onAccent },
        info: { main: color.feedback.info, contrastText: color.text.onAccent },
        success: { main: color.feedback.success, contrastText: color.text.onAccent },
        warning: { main: color.feedback.warning, contrastText: color.text.onAccent },
        error: { main: color.feedback.error, contrastText: color.white },
        text: {
          primary: color.text.primary,
          secondary: color.text.secondary,
          disabled: color.text.disabled,
        },
        background: { default: color.background.default, paper: color.background.paper },
        divider: color.border,
      },
      shape: { borderRadius: px(radius.none) },
      typography: {
        fontFamily: font.family.body,
        fontWeightRegular: font.weight.regular,
        fontWeightMedium: font.weight.bold,
        fontWeightBold: font.weight.black,
        h1: {
          fontFamily: font.family.display,
          fontWeight: font.weight.black,
          fontSize: font.size['3xl'],
          letterSpacing: font.letterSpacing.tight,
          lineHeight: 1.0,
        },
        h2: {
          fontFamily: font.family.display,
          fontWeight: font.weight.black,
          fontSize: font.size['2xl'],
          letterSpacing: font.letterSpacing.tight,
          lineHeight: 1.05,
        },
        h3: {
          fontFamily: font.family.display,
          fontWeight: font.weight.bold,
          fontSize: font.size.xl,
          lineHeight: 1.1,
        },
        h4: { fontFamily: font.family.display, fontWeight: font.weight.bold, fontSize: font.size.lg },
        h5: { fontFamily: font.family.display, fontWeight: font.weight.bold, fontSize: font.size.md },
        h6: {
          fontFamily: font.family.mono,
          fontWeight: font.weight.bold,
          fontSize: font.size.sm,
          letterSpacing: font.letterSpacing.wide,
          textTransform: 'uppercase',
        },
        body1: { fontSize: font.size.md },
        body2: { fontSize: font.size.sm },
        button: {
          fontWeight: font.weight.bold,
          letterSpacing: font.letterSpacing.wide,
          textTransform: 'none',
        },
      },
      components: {
        MuiCssBaseline: {
          styleOverrides: {
            body: {
              backgroundColor: color.background.default,
              color: color.text.primary,
              fontFamily: font.family.body,
            },
          },
        },
        MuiButton: {
          defaultProps: { disableElevation: true, disableRipple: true, variant: 'contained' },
          styleOverrides: {
            root: {
              borderRadius: px(radius.none),
              border: `${border.width.regular} solid ${color.border}`,
              boxShadow: shadow.hard.md,
              padding: '8px 18px',
              transition,
              '&:hover': { boxShadow: shadow.hard.lg, transform: 'translate(-1px, -1px)' },
              '&:active': { boxShadow: noShadow, transform: `translate(${press}, ${press})` },
              '&.Mui-focusVisible': focusRing,
              '&.Mui-disabled': {
                boxShadow: 'none',
                transform: 'none',
                backgroundColor: '#E6E6E6',
                color: color.text.disabled,
                borderColor: color.text.disabled,
              },
            },
            outlined: { backgroundColor: color.background.paper },
            text: { border: 'none', boxShadow: 'none', '&:hover': { boxShadow: 'none', transform: 'none' } },
          },
        },
        MuiOutlinedInput: {
          styleOverrides: {
            root: {
              borderRadius: px(radius.none),
              backgroundColor: color.background.paper,
              boxShadow: shadow.hard.sm,
              transition,
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: color.border,
                borderWidth: border.width.regular,
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: color.border,
                borderWidth: border.width.regular,
              },
              '&.Mui-focused': { boxShadow: shadow.hard.md },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: color.border,
                borderWidth: border.width.regular,
              },
            },
          },
        },
        MuiTextField: { defaultProps: { variant: 'outlined' } },
        MuiPaper: {
          defaultProps: { elevation: 0 },
          styleOverrides: { root: { backgroundImage: 'none' } },
        },
        MuiCard: {
          defaultProps: { elevation: 0 },
          styleOverrides: {
            root: {
              borderRadius: px(radius.none),
              border: `${border.width.thick} solid ${color.border}`,
              boxShadow: shadow.hard.lg,
              backgroundColor: color.background.paper,
            },
          },
        },
        MuiCheckbox: {
          defaultProps: { disableRipple: true },
          styleOverrides: {
            root: {
              color: color.border,
              borderRadius: 0,
              '&.Mui-checked': { color: color.ink },
              '&.Mui-focusVisible': focusRing,
            },
          },
        },
        MuiSwitch: {
          styleOverrides: {
            root: { width: 60, height: 34, padding: 6 },
            switchBase: {
              padding: 7,
              '&.Mui-checked': {
                transform: 'translateX(26px)',
                '& + .MuiSwitch-track': { backgroundColor: color.brand.lime, opacity: 1 },
              },
              '&.Mui-focusVisible .MuiSwitch-thumb': focusRing,
            },
            thumb: {
              width: 16,
              height: 16,
              borderRadius: 0,
              backgroundColor: color.ink,
              boxShadow: 'none',
            },
            track: {
              borderRadius: 0,
              border: `${border.width.thin} solid ${color.border}`,
              backgroundColor: color.white,
              opacity: 1,
            },
          },
        },
        MuiBadge: {
          styleOverrides: {
            badge: {
              borderRadius: 0,
              border: `${border.width.thin} solid ${color.border}`,
              fontWeight: font.weight.bold,
              fontFamily: font.family.mono,
            },
          },
        },
        MuiContainer: {
          styleOverrides: { root: { paddingTop: 16, paddingBottom: 16 } },
        },
      },
    },
    options,
  );
}

/** Default theme instance. */
export const neoBrutalistTheme = createNeoBrutalistTheme();
