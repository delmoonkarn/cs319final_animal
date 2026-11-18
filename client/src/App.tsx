// src/App.tsx
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { ReportPage } from './pages/ReportPage';
import { DonationPage } from './pages/DonationPage';
import { ProfilePage } from './pages/ProfilePage';
import { PetDetailPage } from './pages/PetDetailPage';
import { PawPrint, User, ShieldCheck } from 'lucide-react';

// สร้าง Component Navbar แยกไว้ เพื่อให้แสดงทุกหน้า
function Navbar() {
  const location = useLocation(); // ตัวเช็คว่าตอนนี้อยู่หน้าไหน

  return (
    <nav className="bg-white/95 backdrop-blur-sm px-6 md:px-12 py-4 flex justify-between items-center shadow-sm sticky top-0 z-50">
      <Link to="/" className="flex items-center gap-2 text-orange-500 font-black text-xl w-48">
        <PawPrint size={24} /> PawHome
      </Link>

      {/* เมนูตรงกลาง ใช้ <Link> เพื่อเปลี่ยนหน้า */}
      <div className="absolute left-1/2 -translate-x-1/2 hidden md:flex gap-8 text-[13px] font-bold text-gray-500">
        <Link
          to="/"
          className={`py-1 transition ${location.pathname === '/' ? 'text-orange-500 bg-orange-50 px-4 rounded-full' : 'hover:text-orange-500'}`}
        >
          หาบ้านให้น้อง
        </Link>
        <Link
          to="/report"
          className={`py-1 transition ${location.pathname === '/report' ? 'text-orange-500 bg-orange-50 px-4 rounded-full' : 'hover:text-orange-500'}`}
        >
          แจ้งพบสัตว์จร
        </Link>
        <Link
          to="/donation"
          className={`py-1 transition ${location.pathname === '/donation' ? 'text-orange-500 bg-orange-50 px-4 rounded-full' : 'hover:text-orange-500'}`}
        >
          กองทุนอุปถัมภ์
        </Link>
        <Link
          to="/profile"
          className={`py-1 transition ${location.pathname === '/profile' ? 'text-orange-500 bg-orange-50 px-4 rounded-full' : 'hover:text-orange-500'}`}
        >
          โปรไฟล์ของฉัน
        </Link>
      </div>

      <div className="flex gap-3 text-xs font-bold text-gray-600 w-48 justify-end">
        <button className="flex items-center gap-1.5 border border-gray-200 hover:border-orange-500 rounded-full px-4 py-1.5 transition"><User size={14} /> User</button>
        <button className="flex items-center gap-1.5 border border-gray-200 hover:border-orange-500 rounded-full px-4 py-1.5 transition"><ShieldCheck size={14} /> Admin</button>
      </div>
    </nav>
  );
}

// Component หลักที่เป็นตัวจัดการเส้นทาง (Router)
export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#FAFAFA] font-sans">
        <Navbar />
        {/* บริเวณนี้จะถูกสับเปลี่ยนหน้าเว็บตาม URL ที่ผู้ใช้คลิก */}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/report" element={<ReportPage />} />
          <Route path="/donation" element={<DonationPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/pet/:id" element={<PetDetailPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}