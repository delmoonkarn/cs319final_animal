import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuthStore } from '../store/useAuthStore';
import { authHeaders, type AnimalRow } from './admin-api';

/** GET /favorites — one wishlist entry (newest first). */
export type FavoriteItem = { animalId: number; createdAt: string; animal: AnimalRow | null };

/**
 * The logged-in user's favorites, from the database (server state → TanStack Query).
 * Toggling updates the hearts immediately and rolls back if the server refuses.
 * Logged-out users are sent to /login when they press a heart.
 */
export function useFavorites() {
  const token = useAuthStore((state) => state.token);
  const userId = useAuthStore((state) => state.user?.id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const queryKey = ['favorites', userId];

  const query = useQuery({
    queryKey,
    queryFn: async () => (await api.get<FavoriteItem[]>('/favorites', { headers: authHeaders() })).data,
    enabled: Boolean(token),
  });

  const mutation = useMutation({
    mutationFn: ({ animalId, add }: { animalId: string; add: boolean }) =>
      add
        ? api.put(`/favorites/${animalId}`, null, { headers: authHeaders() })
        : api.delete(`/favorites/${animalId}`, { headers: authHeaders() }),
    onMutate: async ({ animalId, add }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<FavoriteItem[]>(queryKey);
      queryClient.setQueryData<FavoriteItem[]>(queryKey, (old = []) =>
        add
          ? [{ animalId: Number(animalId), createdAt: new Date().toISOString(), animal: null }, ...old]
          : old.filter((item) => String(item.animalId) !== animalId),
      );
      return { previous };
    },
    onError: (_error, _variables, context) => queryClient.setQueryData(queryKey, context?.previous),
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  const items = token ? (query.data ?? []) : [];
  const favorites = items.map((item) => String(item.animalId));

  const toggleFavorite = (animalId: string) => {
    if (!token) {
      navigate('/login');
      return;
    }
    mutation.mutate({ animalId: String(animalId), add: !favorites.includes(String(animalId)) });
  };

  return {
    /** Ids (as strings) of the favorite animals */
    favorites,
    /** The favorite animals themselves (for the profile page) */
    favoriteAnimals: items.map((item) => item.animal).filter((animal): animal is AnimalRow => animal !== null),
    toggleFavorite,
    isLoading: Boolean(token) && query.isLoading,
    isError: query.isError,
  };
}
