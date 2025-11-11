import type { ColorPalette } from './api/generateLanding';
import type { Theme } from '../types';
export function paletteToTheme(palette: ColorPalette): Partial<Theme> {
  return {
    accent: palette.accent || palette.primary,
    text: palette.text,
    heading: palette.text,
    background: palette.background,
    surface: palette.secondary || palette.background,
    border: palette.secondary || '#e0e0e0',
    mode: 'light',
  };
}

export function applyPaletteToProject(
  palette: ColorPalette,
  updateTheme: (updates: Partial<Theme>) => void
): void {
  const themeUpdates = paletteToTheme(palette);
  updateTheme(themeUpdates);
}


