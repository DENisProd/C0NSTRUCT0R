export const theme = {
  spacing: {
    xxs: '4px',
    xs: '8px',
    sm: '12px',
    md: '16px',
    lg: '20px',
    xl: '24px',
    '2xl': '28px',
    '3xl': '32px',
    '4xl': '40px',
  },
  colors: {
    textPrimary: '#000000',
    textSecondary: '#333333',
    textMuted: '#666666',
    surface: '#ffffff',
    surfaceAlt: '#f8fafc',
    surfaceMuted: '#f9fafb',
    border: '#e0e0e0',
    primary: '#4200FF',
    success: '#28a745',
    highlightBlue: '#f0f8ff',
    highlightGreen: '#f0fff4',
  },
} as const;

export type AppTheme = typeof theme;