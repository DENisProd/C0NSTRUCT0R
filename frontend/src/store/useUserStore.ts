import { create } from 'zustand';
import type { UserProfile } from '../lib/api/user';
import { getUserProfile, updateUserProfile, uploadAvatar as uploadAvatarApi, deleteAvatar as deleteAvatarApi, type UpdateUserProfileRequest } from '../lib/api/user';

interface UserStore {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  fetchProfile: () => Promise<void>;
  updateProfile: (request: UpdateUserProfileRequest) => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>;
  deleteAvatar: () => Promise<void>;
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
      set({ isLoading: false, error: errorMessage === 'Unauthorized' ? null : errorMessage });
      if (errorMessage !== 'Unauthorized') {
        console.error('Ошибка загрузки профиля:', error);
      }
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

  uploadAvatar: async (file) => {
    set({ isLoading: true, error: null });
    try {
      const updatedProfile = await uploadAvatarApi(file);
      set({ profile: updatedProfile, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка загрузки аватара';
      set({ error: errorMessage, isLoading: false });
      console.error('Ошибка загрузки аватара:', error);
      throw error;
    }
  },

  deleteAvatar: async () => {
    set({ isLoading: true, error: null });
    try {
      const updatedProfile = await deleteAvatarApi();
      set({ profile: updatedProfile, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка удаления аватара';
      set({ error: errorMessage, isLoading: false });
      console.error('Ошибка удаления аватара:', error);
      throw error;
    }
  },

  clearProfile: () => {
    set({ profile: null, error: null });
  },
}));

