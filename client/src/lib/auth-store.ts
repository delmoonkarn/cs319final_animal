import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types/api';

type AuthState = {
  token: string | null;
  user: User | null;
  /** After login / register */
  setAuth: (token: string, user: User) => void;
  /** Fresh user data from GET /auth/me */
  setUser: (user: User) => void;
  logout: () => void;
};

/** The logged-in user and their token, kept in localStorage so a page reload stays logged in. */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      setUser: (user) => set({ user }),
      logout: () => set({ token: null, user: null }),
    }),
    { name: 'pawhome-auth' },
  ),
);
