import { create } from 'zustand';
import type { UserProfile } from '../lib/api/user';
import { getUserProfile, updateUserProfile, type UpdateUserProfileRequest } from '../lib/api/user';

interface UserStore {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  fetchProfile: () => Promise<void>;
  updateProfile: (request: UpdateUserProfileRequest) => Promise<void>;
  clearProfile: () => void;
}

export const useUserStore = create<UserStore>((set, get) => ({
  profile: null,
  isLoading: false,
  error: null,

  fetchProfile: async () => {
    set({ isLoading: true, error: null });
    try {
      const profile = await getUserProfile();
      set({ profile, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка загрузки профиля';
      set({ error: errorMessage, isLoading: false });
      console.error('Ошибка загрузки профиля:', error);
    }
  },

  updateProfile: async (request) => {
    set({ isLoading: true, error: null });
    try {
      const updatedProfile = await updateUserProfile(request);
      set({ profile: updatedProfile, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка обновления профиля';
      set({ error: errorMessage, isLoading: false });
      console.error('Ошибка обновления профиля:', error);
      throw error;
    }
  },

  clearProfile: () => {
    set({ profile: null, error: null });
  },
}));

