import { useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck, User } from 'lucide-react';

/**
 * Admins only: switches between the normal website (user view) and the admin pages.
 * Normal users never see it, and the server refuses admin actions from them anyway.
 */
export function RoleToggle() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const inAdmin = pathname.startsWith('/admin');

  const option = (active: boolean) =>
    `flex items-center gap-1 rounded-full px-3 py-1 transition ${
      active ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-orange-500'
    }`;

  return (
    <div role="group" aria-label="สลับมุมมอง" className="flex items-center bg-gray-100 rounded-full p-0.5 shrink-0">
      <button type="button" aria-pressed={!inAdmin} aria-label="มุมมองผู้ใช้" title="มุมมองผู้ใช้" onClick={() => navigate('/')} className={option(!inAdmin)}>
        <User size={13} /> <span className="hidden sm:inline">ผู้ใช้</span>
      </button>
      <button type="button" aria-pressed={inAdmin} aria-label="มุมมองแอดมิน" title="มุมมองแอดมิน" onClick={() => navigate('/admin')} className={option(inAdmin)}>
        <ShieldCheck size={13} /> <span className="hidden sm:inline">แอดมิน</span>
      </button>
    </div>
  );
}
