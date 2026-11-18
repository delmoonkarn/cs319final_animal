import { Link, Outlet, useLocation } from 'react-router-dom';
import { HeartHandshake, Megaphone, PawPrint, ShieldCheck, type LucideIcon } from 'lucide-react';

/** Admin pages; `match` = the URL prefixes that highlight the tab. Add new admin pages here. */
const TABS: { to: string; label: string; icon: LucideIcon; match: (path: string) => boolean }[] = [
  {
    to: '/admin',
    label: 'จัดการข้อมูลสัตว์',
    icon: PawPrint,
    match: (path) => path === '/admin' || path.startsWith('/admin/animals'),
  },
  {
    to: '/admin/reports',
    label: 'ตรวจสอบเคสแจ้งเหตุ',
    icon: Megaphone,
    match: (path) => path.startsWith('/admin/reports'),
  },
  {
    to: '/admin/adoptions',
    label: 'อนุมัติบ้านใหม่',
    icon: HeartHandshake,
    match: (path) => path.startsWith('/admin/adoptions'),
  },
];

/** Frame of every /admin page: title + tabs, the page itself below. */
export function AdminLayout() {
  const { pathname } = useLocation();

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-10 pb-20">
      <div className="mb-6">
        <span className="inline-flex items-center gap-1.5 text-orange-600 font-bold text-xs bg-orange-100 px-3 py-1.5 rounded-full mb-3">
          <ShieldCheck size={14} /> Admin
        </span>
        <h1 className="text-[1.6rem] sm:text-[2rem] md:text-[2.5rem] font-black text-[#3D312E] leading-tight">
          ระบบจัดการสำหรับ<span className="whitespace-nowrap">แอดมิน</span>
        </h1>
      </div>

      <nav className="flex flex-wrap gap-2 mb-8" aria-label="เมนูแอดมิน">
        {TABS.map(({ to, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <Link
              key={to}
              to={to}
              aria-current={active ? 'page' : undefined}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition ${
                active ? 'bg-orange-500 text-white shadow-md' : 'bg-white text-gray-500 border border-gray-200 hover:border-orange-500 hover:text-orange-500'
              }`}
            >
              <Icon size={16} /> {label}
            </Link>
          );
        })}
      </nav>

      <Outlet />
    </div>
  );
}
