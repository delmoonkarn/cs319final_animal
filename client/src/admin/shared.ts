import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery, type QueryClient } from '@tanstack/react-query';
import { Building, Home, Hotel, type LucideIcon } from 'lucide-react';
import { api } from '../api';
import type { AdminAdoptionRequest, AnimalStatus, Gender, HousingType, ImageDto, ReviewStatus, Species } from '../types/api';

/** Labels, API helpers and hooks shared by the admin pages. */

export const SPECIES_LABEL: Record<Species, string> = { DOG: 'หมา', CAT: 'แมว', OTHER: 'อื่น ๆ' };
export const GENDER_LABEL: Record<Gender, string> = { MALE: 'ตัวผู้', FEMALE: 'ตัวเมีย', UNKNOWN: 'ไม่ทราบเพศ' };
export const STATUS_LABEL: Record<AnimalStatus, string> = { AVAILABLE: 'รอบ้าน', ADOPTED: 'ได้บ้านแล้ว' };
export const REVIEW_LABEL: Record<ReviewStatus, string> = { PENDING: 'รอตรวจสอบ', APPROVED: 'อนุมัติแล้ว', REJECTED: 'ปฏิเสธแล้ว' };
export const HOUSING_LABEL: Record<HousingType, string> = { HOUSE: 'บ้าน', CONDO: 'คอนโด', DORM: 'หอพัก' };
export const HOUSING_ICON: Record<HousingType, LucideIcon> = { HOUSE: Home, CONDO: Building, DORM: Hotel };

/**
 * Link to an adoption request's detail page. The API has no "get one request" endpoint, so the
 * page loads the animal's requests (GET /adoption-requests?animalId=) — the animal id rides along.
 */
export function adoptionDetailPath(request: Pick<AdminAdoptionRequest, 'id' | 'animal'>): string {
  return `/admin/adoptions/${request.id}?animal=${request.animal.id}`;
}

export function formatAge(months: number): string {
  if (months < 12) return `${months} เดือน`;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  return rest ? `${years} ปี ${rest} เดือน` : `${years} ปี`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─────────────── Photos ───────────────

export const MAX_FILE_MB = 5;
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/** POST /uploads — compresses on the server, returns [{ url, thumbUrl }] in the same order. */
export async function uploadImages(files: File[]): Promise<ImageDto[]> {
  const form = new FormData();
  for (const file of files) form.append('images', file);
  return (await api.post<ImageDto[]>('/uploads', form)).data;
}

// ─────────────── Data ───────────────

/** The 77 provinces for dropdowns (they never change, so fetched once). */
export function useProvinces() {
  return useQuery({
    queryKey: ['provinces'],
    queryFn: async () => (await api.get<string[]>('/provinces')).data,
    staleTime: Infinity,
  });
}

/** After an admin change: refresh the admin lists AND the public pages that show animals. */
export function refreshAnimals(queryClient: QueryClient): Promise<unknown> {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ['admin'] }),
    queryClient.invalidateQueries({ queryKey: ['animals'] }), // home page
    queryClient.invalidateQueries({ queryKey: ['animal'] }), // pet detail page
  ]);
}

/**
 * A one-time message passed with navigate(path, { state: { flash } }), e.g. "saved".
 * Cleared from the browser history right away, so a reload doesn't show it again.
 */
export function useFlashMessage(): string | null {
  const location = useLocation();
  const navigate = useNavigate();
  const [flash] = useState(() => (location.state as { flash?: string } | null)?.flash ?? null);
  useEffect(() => {
    if (flash) navigate(location.pathname, { replace: true, state: null });
  }, [flash, navigate, location.pathname]);
  return flash;
}

/** The value, but only after it stopped changing for `delay` ms (for search boxes). */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
