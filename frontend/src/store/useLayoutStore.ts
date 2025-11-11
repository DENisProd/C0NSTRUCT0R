import { create } from 'zustand';

interface LayoutStore {
  blocksPanelWidth: number; // in px
  propertiesPanelWidth: number; // in px
  setBlocksPanelWidth: (width: number) => void;
  setPropertiesPanelWidth: (width: number) => void;
}

const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

export const useLayoutStore = create<LayoutStore>((set) => ({
  blocksPanelWidth: 300,
  propertiesPanelWidth: 300,
  setBlocksPanelWidth: (width) => set({ blocksPanelWidth: clamp(Math.round(width), 200, 600) }),
  setPropertiesPanelWidth: (width) => set({ propertiesPanelWidth: clamp(Math.round(width), 240, 640) }),
}));