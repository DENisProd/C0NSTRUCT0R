import { create } from 'zustand';
import type { TokenResponse } from '../lib/api/auth';

interface AuthState {
  token: string | null;
  expiresIn: number | null;
  email: string | null;
  username: string | null;
  setToken: (t: TokenResponse, email?: string, username?: string) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null,
  expiresIn: null,
  email: null,
  username: null,
  setToken: (t, email, username) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', t.access_token);
    }
    set({ token: t.access_token, expiresIn: t.expires_in, email: email || null, username: username || null });
  },
  clear: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
    set({ token: null, expiresIn: null, email: null, username: null });
  },
}));