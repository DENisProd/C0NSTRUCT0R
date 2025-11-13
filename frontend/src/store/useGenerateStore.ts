import { create } from 'zustand';
import type { Block } from '../types';
import type { ColorPalette, GenerateLandingResponse } from '../lib/api/generateLanding';

interface GenerateStore {
  isLoading: boolean;
  error: string | null;
  generatedBlocks: Block[];
  generatedPalette: ColorPalette | null;
  generatedMeta?: Record<string, unknown> | null;
  
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setGenerated: (data: GenerateLandingResponse) => void;
  clearGenerated: () => void;
}

export const useGenerateStore = create<GenerateStore>((set) => ({
  isLoading: false,
  error: null,
  generatedBlocks: [],
  generatedPalette: null,
  generatedMeta: null,

  setLoading: (loading) => set({ isLoading: loading, error: null }),
  setError: (error) => set({ error, isLoading: false }),
  setGenerated: (data) => set({
    generatedBlocks: data.blocks,
    generatedPalette: data.palette,
    generatedMeta: (data.meta as Record<string, unknown> | undefined) ?? null,
    isLoading: false,
    error: null,
  }),
  clearGenerated: () => set({
    generatedBlocks: [],
    generatedPalette: null,
    generatedMeta: null,
    error: null,
  }),
}));


