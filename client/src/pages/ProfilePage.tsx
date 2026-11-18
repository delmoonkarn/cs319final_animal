// src/pages/ProfilePage.tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ClipboardList, PawPrint } from 'lucide-react';

export function ProfilePage() {
  // สร้าง State สำหรับสลับแท็บ (favorites หรือ requests)
  const [activeTab, setActiveTab] = useState<'favorites' | 'requests'>('favorites');

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans pb-20">
      <div className="max-w-[1000px] mx-auto px-6 pt-10">
        
        {/* ================= ส่วน Header โปรไฟล์ ================= */}
        <div className="bg-white rounded-[2rem] shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] border border-gray-100 flex flex-col overflow-hidden mb-8">
          {/* หน้าปก (Cover Background) */}
          <div className="h-32 bg-gradient-to-r from-orange-200 to-orange-50 relative w-full"></div>
          
          <div className="px-8 pb-8 relative flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
            {/* รูปโปรไฟล์ (Avatar ลอยทับหน้าปก) */}
            <div className="w-24 h-24 bg-[#F37021] rounded-2xl border-4 border-white shadow-sm flex items-center justify-center text-white -mt-12 relative z-10 shrink-0">
              <PawPrint size={40} />
            </div>
            
            {/* ข้อมูลชื่อและสถิติ */}
            <div className="mt-2 sm:mt-4 text-center sm:text-left">
              <h1 className="text-3xl font-black text-[#3D312E] tracking-tight mb-1">สมาชิก PawHome</h1>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-sm font-medium text-gray-500">
                <span className="flex items-center gap-1.5"><Heart size={14} className="text-orange-500" /> รายการโปรด 0 ตัว</span>
                <span className="text-gray-300">•</span>
                <span className="flex items-center gap-1.5"><ClipboardList size={14} className="text-orange-500" /> คำขอรับเลี้ยง 0 รายการ</span>
              </div>
            </div>
          </div>
        </div>

        {/* ================= ส่วนปุ่มสลับแท็บ (Tabs) ================= */}
        <div className="flex gap-3 mb-6">
          <button 
            onClick={() => setActiveTab('favorites')}
            className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm transition-all duration-300 ${
              activeTab === 'favorites' 
                ? 'bg-[#F37021] text-white shadow-md' 
                : 'bg-orange-50 text-orange-600 hover:bg-orange-100'
            }`}
          >
            <Heart size={18} className={activeTab === 'favorites' ? 'fill-white' : ''} /> รายการโปรด
          </button>
          
          <button 
            onClick={() => setActiveTab('requests')}
            className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm transition-all duration-300 ${
              activeTab === 'requests' 
                ? 'bg-[#F37021] text-white shadow-md' 
                : 'bg-orange-50 text-orange-600 hover:bg-orange-100'
            }`}
          >
            <ClipboardList size={18} /> สถานะคำขอรับเลี้ยง
          </button>
        </div>

        {/* ================= ส่วนพื้นที่แสดงเนื้อหา (Content Area) ================= */}
        <div className="bg-white rounded-[2rem] border-2 border-dashed border-gray-200/80 p-12 md:p-24 flex flex-col items-center justify-center text-center min-h-[400px] transition-all">
          
          {/* เนื้อหาแท็บรายการโปรด */}
          {activeTab === 'favorites' && (
            <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
              <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center text-orange-500 mb-6">
                <Heart size={40} className="fill-orange-100/50" />
              </div>
              <h3 className="text-xl font-extrabold text-[#3D312E] mb-2">ยังไม่มีน้องในรายการโปรด</h3>
              <p className="text-gray-500 font-medium text-sm mb-8 max-w-[350px] leading-relaxed">
                กดรูปหัวใจบนการ์ดน้องหมาน้องแมวที่คุณสนใจ เพื่อบันทึกเก็บไว้ดูภายหลังได้ที่นี่
              </p>
              <Link 
                to="/" 
                className="bg-[#F37021] hover:bg-[#E06015] text-white px-8 py-3.5 rounded-full font-bold shadow-md hover:shadow-lg transition-all active:scale-95"
              >
                ไปดูน้องๆ เลย
              </Link>
            </div>
          )}

          {/* เนื้อหาแท็บสถานะคำขอ */}
          {activeTab === 'requests' && (
            <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
              <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center text-orange-500 mb-6">
                <ClipboardList size={40} />
              </div>
              <h3 className="text-xl font-extrabold text-[#3D312E] mb-2">ยังไม่มีคำขอรับอุปการะ</h3>
              <p className="text-gray-500 font-medium text-sm mb-8 max-w-[350px] leading-relaxed">
                หากคุณเจอเพื่อนซี้สี่ขาที่ถูกใจแล้ว สามารถกดขอรับอุปการะ และติดตามสถานะการอนุมัติได้ที่หน้านี้
              </p>
              <Link 
                to="/" 
                className="bg-orange-100 hover:bg-orange-200 text-orange-700 px-8 py-3.5 rounded-full font-bold transition-all active:scale-95"
              >
                หาบ้านให้น้อง
              </Link>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}