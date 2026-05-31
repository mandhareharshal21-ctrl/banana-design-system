import { type ReactNode } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import type { Theme } from '@mui/material/styles';
import { neoBrutalistTheme } from '../theme';

export interface BananaProviderProps {
  children: ReactNode;
  /** Override the default Neo-Brutalist theme. */
  theme?: Theme;
  /** Apply MUI CssBaseline (background, font reset). Defaults to true. */
  enableCssBaseline?: boolean;
}

/** Wraps the app in the Neo-Brutalist theme + CssBaseline. */
export function BananaProvider({
  children,
  theme = neoBrutalistTheme,
  enableCssBaseline = true,
}: BananaProviderProps) {
  return (
    <ThemeProvider theme={theme}>
      {enableCssBaseline ? <CssBaseline /> : null}
      {children}
    </ThemeProvider>
  );
}
