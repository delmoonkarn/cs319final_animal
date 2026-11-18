import axios, { isAxiosError } from 'axios';
import { useAuthStore } from './lib/auth-store';
import type { ApiErrorBody } from './types/api';

export const api = axios.create({
  // Set VITE_API_URL in client/.env to use another server; defaults to the local one.
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api',
});

// Send the login token with every request.
api.interceptors.request.use((config) => {
  const { token } = useAuthStore.getState();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// A 401 on a request that had a token = expired token or deleted account → log out.
api.interceptors.response.use(undefined, (error: unknown) => {
  if (isAxiosError(error) && error.response?.status === 401 && error.config?.headers?.Authorization) {
    useAuthStore.getState().logout();
  }
  return Promise.reject(error);
});

/** HTTP status of a failed request (undefined if the server couldn't be reached). */
export function getErrorStatus(error: unknown): number | undefined {
  return isAxiosError(error) ? error.response?.status : undefined;
}

/** The server's error message, or a Thai fallback when there is none. */
export function getErrorMessage(error: unknown, fallback = 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'): string {
  if (isAxiosError<ApiErrorBody>(error)) {
    if (!error.response) {
      return 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาลองใหม่อีกครั้ง';
    }
    return error.response.data?.message ?? fallback;
  }
  return fallback;
}

/** Field errors from a 400 response, as { field: message }. */
export function getFieldErrors(error: unknown): Record<string, string> {
  const fields: Record<string, string> = {};
  if (isAxiosError<ApiErrorBody>(error)) {
    for (const { field, message } of error.response?.data?.errors ?? []) {
      fields[field] ??= message;
    }
  }
  return fields;
}
