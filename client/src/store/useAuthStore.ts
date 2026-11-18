import { create } from 'zustand';

export type UserRole = 'USER' | 'ADMIN';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
}

const USER_KEY = 'pawhome_auth_user';
const TOKEN_KEY = 'token';

if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('pawhome-fav-v2');
    localStorage.removeItem('pawhome_adoption_requests');
    localStorage.removeItem('pawhome_submitted_reports');
    localStorage.removeItem('pawhome_donations');
  } catch {

  }
}

function readInitialToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY) || null;
  } catch {
    return null;
  }
}

/** A saved user without a token (left by an old offline login) counts as logged out. */
function readInitialUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    if (!readInitialToken()) {
      localStorage.removeItem(USER_KEY);
      return null;
    }
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getActiveUserEmail(): string {
  const user = readInitialUser();
  return user?.email ? user.email.toLowerCase() : 'guest';
}

interface AuthStore {
  user: AuthUser | null;
  token: string | null;
  setAuth: (user: AuthUser, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: readInitialUser(),
  token: typeof window !== 'undefined' ? readInitialToken() : null,
  setAuth: (user, token) => {
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      localStorage.setItem(TOKEN_KEY, token);
    } catch {

    }
    set({ user, token });
  },
  logout: () => {
    try {
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(TOKEN_KEY);
    } catch {

    }
    set({ user: null, token: null });
  },
}));
