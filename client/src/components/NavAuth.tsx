import { Link, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { LogIn, LogOut, ShieldCheck, User } from 'lucide-react';
import { useAuthStore } from '../lib/auth-store';
import { RoleToggle } from './RoleToggle';

/** Right side of the navbar: login / register buttons, or the logged-in user (+ view toggle for admins) + logout. */
export function NavAuth() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  if (!user) {
    return (
      <>
        <Link
          to="/login"
          className="flex items-center gap-1.5 border border-gray-200 hover:border-orange-500 rounded-full px-4 py-1.5 transition"
        >
          <LogIn size={14} /> เข้าสู่ระบบ
        </Link>
        <Link
          to="/register"
          className="hidden sm:flex items-center bg-orange-500 hover:bg-orange-600 text-white rounded-full px-4 py-1.5 transition"
        >
          สมัครสมาชิก
        </Link>
      </>
    );
  }

  function handleLogout() {
    logout();
    queryClient.clear(); // forget the previous user's favorites, requests, …
    navigate('/');
  }

  const logoutButton = (
    <button
      type="button"
      onClick={handleLogout}
      title="ออกจากระบบ"
      aria-label="ออกจากระบบ"
      className="flex items-center border border-gray-200 hover:border-red-400 hover:text-red-500 rounded-full px-2.5 py-1.5 transition shrink-0"
    >
      <LogOut size={14} />
    </button>
  );

  // Admins: the user/admin view toggle (from the spec) + their name.
  if (user.role === 'ADMIN') {
    return (
      <>
        <RoleToggle />
        <span
          title={`ผู้ดูแลระบบ: ${user.name}`}
          className="hidden lg:flex items-center gap-1.5 border border-orange-200 bg-orange-50 text-orange-600 rounded-full px-3 py-1.5 min-w-0"
        >
          <ShieldCheck size={14} className="shrink-0" />
          <span className="truncate max-w-[90px]">{user.name}</span>
        </span>
        {logoutButton}
      </>
    );
  }

  return (
    <>
      <Link
        to="/profile"
        title="โปรไฟล์ของฉัน"
        className="flex items-center gap-1.5 border border-gray-200 hover:border-orange-500 rounded-full px-4 py-1.5 transition min-w-0"
      >
        <User size={14} className="shrink-0" />
        <span className="truncate max-w-[110px]">{user.name}</span>
      </Link>
      {logoutButton}
    </>
  );
}
