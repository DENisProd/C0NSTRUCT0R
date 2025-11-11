import { create } from 'zustand';
import type { LibraryBlock } from '../lib/api/library';

interface LibraryStore {
  systemBlocks: LibraryBlock[];
  communityBlocks: LibraryBlock[];
  userBlocks: LibraryBlock[];
  isLoading: boolean;
  error: string | null;
  
  setSystemBlocks: (blocks: LibraryBlock[]) => void;
  setCommunityBlocks: (blocks: LibraryBlock[]) => void;
  setUserBlocks: (blocks: LibraryBlock[]) => void;
  addUserBlock: (block: LibraryBlock) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useLibraryStore = create<LibraryStore>((set) => ({
  systemBlocks: [],
  communityBlocks: [],
  userBlocks: [],
  isLoading: false,
  error: null,

  setSystemBlocks: (blocks) => set({ systemBlocks: blocks }),
  setCommunityBlocks: (blocks) => set({ communityBlocks: blocks }),
  setUserBlocks: (blocks) => set({ userBlocks: blocks }),
  addUserBlock: (block) => set((state) => ({
    userBlocks: [...state.userBlocks, block],
  })),
  setLoading: (loading) => set({ isLoading: loading, error: null }),
  setError: (error) => set({ error, isLoading: false }),
}));


