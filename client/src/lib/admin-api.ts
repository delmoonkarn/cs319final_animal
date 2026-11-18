import { isAxiosError } from 'axios';
import { useQuery, type QueryClient } from '@tanstack/react-query';
import { api } from '../api';
import { useAuthStore } from '../store/useAuthStore';

/** Shapes and helpers for the admin pages (all data comes from the server API). */

export type ImageDto = { url: string; thumbUrl: string };
export type Paginated<T> = { data: T[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } };
export type Species = 'DOG' | 'CAT' | 'OTHER';
export type Gender = 'MALE' | 'FEMALE' | 'UNKNOWN';
export type AnimalStatus = 'AVAILABLE' | 'ADOPTED';
export type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
type Person = { id: number; name: string; email: string; phone: string };

/** GET /stats/admin */
export type AdminStats = {
  total: number;
  available: number;
  adopted: number;
  urgent: number;
  pendingRequests: number;
  pendingReports: number;
  pendingDonations: number;
};

/** GET /animals (one row) */
export type AnimalRow = {
  id: number;
  name: string;
  species: Species;
  breed: string;
  gender: Gender;
  ageMonths: number;
  personality: string[];
  isVaccinated: boolean;
  isSterilized: boolean;
  isUrgent: boolean;
  status: AnimalStatus;
  locationFound: string;
  province: string;
  coverImage: ImageDto | null;
};

/** GET /animals/:id */
export type AnimalDetail = Omit<AnimalRow, 'coverImage'> & { description: string; healthNote: string; images: ImageDto[] };

/** GET /reports (admin) */
export type AdminReport = {
  id: number;
  species: Species;
  breed: string | null;
  location: string;
  description: string;
  status: ReviewStatus;
  createdAt: string;
  images: ImageDto[];
  animal: { id: number; name: string; status: AnimalStatus } | null;
  reporter: Person;
};

/** GET /adoption-requests (admin) */
export type AdminRequest = {
  id: number;
  reason: string;
  housingType: 'HOUSE' | 'CONDO' | 'DORM';
  status: ReviewStatus;
  createdAt: string;
  animal: AnimalRow;
  user: Person;
};

/** GET /donations (admin) */
export type AdminDonation = {
  id: number;
  total: number;
  status: 'PENDING' | 'CONFIRMED';
  createdAt: string;
  slip: ImageDto;
  items: { id: number; quantity: number; unitPrice: number; subtotal: number; package: { id: number; name: string; icon: string } }[];
  user: Person;
};

export const HOUSING_LABELS: Record<string, string> = {
  HOUSE: 'บ้านเดี่ยว / ทาวน์เฮาส์',
  CONDO: 'คอนโด (อนุญาตเลี้ยงสัตว์)',
  DORM: 'หอพัก / อพาร์ตเมนต์',
};
export const SPECIES_LABELS: Record<Species, string> = { DOG: 'หมา', CAT: 'แมว', OTHER: 'อื่นๆ / Exotic' };
export const GENDER_LABELS: Record<Gender, string> = { MALE: 'ตัวผู้', FEMALE: 'ตัวเมีย', UNKNOWN: 'ไม่ทราบเพศ' };

export function formatAge(months?: number): string {
  if (months == null) return '';
  if (months < 12) return `${months} เดือน`;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  return rest ? `${years} ปี ${rest} เดือน` : `${years} ปี`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('th-TH', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/** The logged-in admin's token, for the `headers` option of api calls. */
export function authHeaders(): Record<string, string> {
  const token = useAuthStore.getState().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** Expired / invalid login (the caller should log out and go to /login). */
export function isUnauthorized(error: unknown): boolean {
  return isAxiosError(error) && error.response?.status === 401;
}

/** The server's error message ({ message }), or a Thai fallback. */
export function errorMessage(error: unknown, fallback = 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'): string {
  if (isAxiosError<{ message?: string }>(error)) {
    if (!error.response) return 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาลองใหม่อีกครั้ง';
    return error.response.data?.message || fallback;
  }
  return fallback;
}

/** POST /uploads — returns [{ url, thumbUrl }] in the same order as the files. */
export async function uploadImages(files: File[]): Promise<ImageDto[]> {
  const form = new FormData();
  for (const file of files) form.append('images', file);
  return (await api.post<ImageDto[]>('/uploads', form, { headers: authHeaders() })).data;
}

/** After an admin change: refresh the admin data and every user page that shows animals. */
export function refreshAfterAdminChange(queryClient: QueryClient): Promise<unknown> {
  return Promise.all(
    [['admin'], ['animals'], ['animal'], ['animals_profile']].map((queryKey) =>
      queryClient.invalidateQueries({ queryKey }),
    ),
  );
}

/** GET /stats/admin — shared by the admin page and the navbar badge (same cache). */
export function useAdminStats(enabled: boolean) {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => (await api.get<AdminStats>('/stats/admin', { headers: authHeaders() })).data,
    enabled,
    retry: false,
  });
}
