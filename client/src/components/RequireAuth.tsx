import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../lib/auth-store';
import type { Role } from '../types/api';

/**
 * Wrap routes that need a logged-in user:
 *   <Route element={<RequireAuth />}> … </Route>
 *   <Route element={<RequireAuth role="ADMIN" />}> … </Route>
 * Logged-out users go to /login and come back here afterwards; other roles go to the home page.
 */
export function RequireAuth({ role }: { role?: Role }) {
  const user = useAuthStore((state) => state.user);
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  if (role && user.role !== role) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}
