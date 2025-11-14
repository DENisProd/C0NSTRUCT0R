import { create } from 'zustand';

export type Breakpoint = 'desktop' | 'tablet' | 'mobile';

export interface ResponsiveStyle {
  fontSize?: string;
  padding?: string;
  margin?: string;
  width?: string;
  textAlign?: 'left' | 'center' | 'right';
  borderRadius?: string;
}

export interface ResponsiveConfig {
  desktop?: ResponsiveStyle;
  tablet?: ResponsiveStyle;
  mobile?: ResponsiveStyle;
}

// Коэффициенты масштабирования по умолчанию
export const DEFAULT_SCALE_FACTORS = {
  tablet: 0.75,
  mobile: 0.5,
};

interface ResponsiveStore {
  currentBreakpoint: Breakpoint;
  scaleFactors: {
    tablet: number;
    mobile: number;
  };
  setBreakpoint: (breakpoint: Breakpoint) => void;
  setScaleFactor: (device: 'tablet' | 'mobile', factor: number) => void;
}

export const useResponsiveStore = create<ResponsiveStore>((set) => ({
  currentBreakpoint: 'desktop',
  scaleFactors: DEFAULT_SCALE_FACTORS,
  setBreakpoint: (breakpoint) => set({ currentBreakpoint: breakpoint }),
  setScaleFactor: (device, factor) =>
    set((state) => ({
      scaleFactors: {
        ...state.scaleFactors,
        [device]: Math.max(0.1, Math.min(1.5, factor)), // Ограничиваем от 0.1 до 1.5
      },
    })),
}));




