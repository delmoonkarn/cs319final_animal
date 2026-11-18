import { useEffect } from 'react';
import { api } from '../api';
import { useAuthStore } from './auth-store';
import type { User } from '../types/api';

/**
 * On page load, re-checks the saved token with GET /auth/me and refreshes the user's data
 * (name, role). An expired token gets a 401, and the api interceptor logs the user out.
 */
export function useRefreshUser(): void {
  const token = useAuthStore((state) => state.token);
  const setUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    if (!token) {
      return;
    }
    api
      .get<{ user: User }>('/auth/me')
      .then((response) => setUser(response.data.user))
      .catch(() => {
        // 401 is handled by the interceptor; a network error keeps the saved user for now.
      });
  }, [token, setUser]);
}
