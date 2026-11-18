import { create } from 'zustand';
import { persist } from 'zustand/middleware';

function getCurrentUserKey(): string {
  try {
    const raw = localStorage.getItem('pawhome_auth_user');
    if (!raw) return 'guest';
    const user = JSON.parse(raw);
    return user?.email ? String(user.email).toLowerCase() : 'guest';
  } catch {
    return 'guest';
  }
}

interface FavoriteStore {

  favoritesByUser: Record<string, string[]>;
  favorites: string[];
  toggleFavorite: (id: string) => void;
  syncForCurrentUser: () => void;
}

export const useFavoriteStore = create<FavoriteStore>()(
  persist(
    (set, get) => ({
      favoritesByUser: {},
      favorites: [],
      toggleFavorite: (id) => {
        const userKey = getCurrentUserKey();
        const strId = String(id);
        const current = (get().favoritesByUser[userKey] || []).map(String);
        const nextList = current.includes(strId)
          ? current.filter((f) => f !== strId)
          : [...current, strId];
        set((state) => ({
          favoritesByUser: { ...state.favoritesByUser, [userKey]: nextList },
          favorites: nextList,
        }));
      },
      syncForCurrentUser: () => {
        const userKey = getCurrentUserKey();
        const list = get().favoritesByUser[userKey] || [];
        set({ favorites: list });
      },
    }),
    {
      name: 'pawhome-fav-by-user-v1',
      onRehydrateStorage: () => (state) => {
        state?.syncForCurrentUser();
      },
    },
  ),
);
