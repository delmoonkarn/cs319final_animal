import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { ReportPage } from './pages/ReportPage';
import { DonationPage } from './pages/DonationPage';
import { ProfilePage } from './pages/ProfilePage';
import { PetDetailPage } from './pages/PetDetailPage';
import { AuthPage } from './pages/AuthPage';
import { AdminPage } from './pages/AdminPage';
import { PawPrint, User, ShieldCheck, LogOut, LogIn } from 'lucide-react';
import { useAuthStore } from './store/useAuthStore';
import { useAdminStats } from './lib/admin-api';


function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const isAdminAccount = user?.role === 'ADMIN';
  const isAdminView = location.pathname.startsWith('/admin');
  // Waiting requests + reports + donation slips, from the server (same cache as the admin page).
  const { data: adminStats } = useAdminStats(isAdminAccount);
  const pendingTotal = adminStats
    ? adminStats.pendingRequests + adminStats.pendingReports + adminStats.pendingDonations
    : 0;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };


  if (isAdminAccount && isAdminView) {
    return (
      <nav className="bg-[#362823] text-white shadow-md sticky top-0 z-50">
        <div className="max-w-[1280px] mx-auto px-6 md:px-10 py-3.5 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="flex items-center gap-2.5 font-black text-xl tracking-tight shrink-0">
              <span className="w-9 h-9 rounded-full bg-[#F37021] text-white flex items-center justify-center shadow-xs">
                <PawPrint size={19} strokeWidth={2.3} />
              </span>
              <span>
                <span className="text-white">Paw</span>
                <span className="text-[#F37021]">Home</span>
              </span>
            </Link>

            <div className="hidden sm:flex items-center gap-2 text-xs font-bold ml-2">
              <Link
                to="/admin"
                className="bg-[#F37021] text-white px-4 py-1.5 rounded-full shadow-xs"
              >
                แผงควบคุมแอดมิน
              </Link>
              <Link
                to="/"
                className="text-gray-300 hover:text-white px-3 py-1.5 rounded-full transition"
              >
                ดูหน้าเว็บ
              </Link>
              {pendingTotal > 0 && (
                <span className="bg-red-500 text-white text-[11px] font-extrabold px-2.5 py-0.5 rounded-full">
                  รอตรวจสอบ {pendingTotal}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-xs font-bold">
            <Link
              to="/admin"
              className="flex items-center gap-1.5 bg-[#F37021] text-white px-4 py-1.5 rounded-full shadow-xs"
            >
              <ShieldCheck size={13} /> Admin
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              title="ออกจากระบบ"
              className="flex items-center gap-1 text-gray-300 hover:text-red-300 border border-[#5A4740] hover:border-red-400 px-3 py-1.5 rounded-full transition cursor-pointer"
            >
              <LogOut size={14} /> ออกจากระบบ
            </button>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-[#FFFDF9]/95 backdrop-blur-sm border-b border-[#F2E8DC] sticky top-0 z-50">
      <div className="max-w-[1280px] mx-auto px-6 md:px-10 py-3.5 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2.5 font-black text-xl tracking-tight shrink-0">
          <span className="w-9 h-9 rounded-full bg-[#F37021] text-white flex items-center justify-center shadow-xs">
            <PawPrint size={19} strokeWidth={2.3} />
          </span>
          <span>
            <span className="text-[#2B211E]">Paw</span>
            <span className="text-[#F37021]">Home</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-6 text-[13px] font-bold text-gray-500">
          <Link
            to="/"
            className={`py-1.5 transition ${location.pathname === '/' ? 'text-orange-500 bg-orange-50 px-4 rounded-full' : 'hover:text-orange-500'
              }`}
          >
            หาบ้านให้น้อง
          </Link>
          <Link
            to="/report"
            className={`py-1.5 transition ${location.pathname === '/report' ? 'text-orange-500 bg-orange-50 px-4 rounded-full' : 'hover:text-orange-500'
              }`}
          >
            แจ้งพบสัตว์จร
          </Link>
          <Link
            to="/donation"
            className={`py-1.5 transition ${location.pathname === '/donation' ? 'text-orange-500 bg-orange-50 px-4 rounded-full' : 'hover:text-orange-500'
              }`}
          >
            กองทุนอุปถัมภ์
          </Link>
          <Link
            to="/profile"
            className={`py-1.5 transition ${location.pathname === '/profile' ? 'text-orange-500 bg-orange-50 px-4 rounded-full' : 'hover:text-orange-500'
              }`}
          >
            โปรไฟล์ของฉัน
          </Link>
        </div>

        <div className="flex items-center gap-2.5 text-xs font-bold text-gray-600 shrink-0">
          {!user ? (
            <Link
              to="/login"
              className="flex items-center gap-1.5 bg-[#F37021] hover:bg-[#E06015] text-white rounded-full px-4 py-2 transition shadow-sm"
            >
              <LogIn size={14} /> เข้าสู่ระบบ / สมัครสมาชิก
            </Link>
          ) : isAdminAccount ? (
            <>
              <Link
                to="/admin"
                className="flex items-center gap-1.5 bg-[#F37021] hover:bg-[#E06015] text-white px-4 py-1.5 rounded-full shadow-xs transition"
              >
                <ShieldCheck size={14} /> Admin
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                title="ออกจากระบบ"
                className="flex items-center gap-1 border border-gray-200 hover:border-red-300 hover:text-red-500 rounded-full px-3 py-1.5 transition cursor-pointer"
              >
                <LogOut size={14} /> ออกจากระบบ
              </button>
            </>
          ) : (

            <>
              <Link
                to="/profile"
                className="flex items-center gap-1.5 border border-orange-200 bg-orange-50 text-orange-600 rounded-full px-4 py-1.5 transition"
              >
                <User size={14} /> {user.name}
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                title="ออกจากระบบ"
                className="flex items-center gap-1 border border-gray-200 hover:border-red-300 hover:text-red-500 rounded-full px-3 py-1.5 transition cursor-pointer"
              >
                <LogOut size={14} /> ออกจากระบบ
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#FAFAFA] font-sans">
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/report" element={<ReportPage />} />
          <Route path="/donation" element={<DonationPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/pet/:id" element={<PetDetailPage />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
