// src/pages/ReportPage.tsx
import { useState } from 'react';
import { Megaphone, Dog, Cat, ImagePlus, LocateFixed, Send, Clock, MapPin } from 'lucide-react';

export function ReportPage() {
  const [animalType, setAnimalType] = useState<'DOG' | 'CAT'>('DOG');

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans pb-20">
      
      {/* Container หลัก */}
      <div className="max-w-[1200px] mx-auto px-6 pt-12 grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-12">
        
        {/* ================= ฝั่งซ้าย: ฟอร์มแจ้งเหตุ ================= */}
        <div>
          {/* Header */}
          <div className="mb-8">
            <span className="inline-flex items-center gap-1.5 text-red-500 font-bold text-xs bg-red-50 px-3 py-1.5 rounded-full mb-4">
              <Megaphone size={14} /> Community Report
            </span>
            <h1 className="text-[2.5rem] font-black text-[#3D312E] leading-tight mb-3">
              แจ้งพบสัตว์จรจัด
            </h1>
            <p className="text-gray-500 font-medium text-[15px] leading-relaxed max-w-[500px]">
              เจอน้องที่บาดเจ็บหรือต้องการความช่วยเหลือ? แจ้งทีมงานได้ที่นี่ เมื่อแอดมินตรวจสอบแล้ว เคสจะขึ้นเว็บเพื่อหาบ้านทันที
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
            <form className="flex flex-col gap-6">
              
              {/* ชนิดสัตว์ */}
              <div>
                <label className="block text-[#3D312E] font-bold text-[15px] mb-3">ชนิดสัตว์</label>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    type="button"
                    onClick={() => setAnimalType('DOG')}
                    className={`flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 transition-all font-bold ${
                      animalType === 'DOG' 
                        ? 'border-orange-200 bg-orange-50 text-orange-600' 
                        : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
                    }`}
                  >
                    <Dog size={20} /> หมา
                  </button>
                  <button 
                    type="button"
                    onClick={() => setAnimalType('CAT')}
                    className={`flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 transition-all font-bold ${
                      animalType === 'CAT' 
                        ? 'border-orange-200 bg-orange-50 text-orange-600' 
                        : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
                    }`}
                  >
                    <Cat size={20} /> แมว
                  </button>
                </div>
              </div>

              {/* รูปภาพน้อง */}
              <div>
                <label className="block text-[#3D312E] font-bold text-[15px] mb-3">รูปภาพน้อง</label>
                <div className="border-2 border-dashed border-orange-200 bg-[#FFFBF9] rounded-2xl h-48 flex flex-col items-center justify-center cursor-pointer hover:bg-orange-50/50 transition-colors">
                  <div className="bg-white p-3 rounded-xl shadow-sm text-orange-500 mb-3 border border-orange-100">
                    <ImagePlus size={24} />
                  </div>
                  <span className="font-bold text-[#3D312E] mb-1">แตะเพื่ออัปโหลดรูปน้อง</span>
                  <span className="text-gray-400 text-xs font-medium">รูปที่ชัดช่วยให้ทีมงานประเมินอาการได้เร็วขึ้น</span>
                </div>
              </div>

              {/* พิกัด และ จังหวัด */}
              <div className="grid grid-cols-[1fr_200px] gap-4 items-end">
                <div>
                  <label className="block text-[#3D312E] font-bold text-[15px] mb-3">พิกัด / จุดที่พบ</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="เช่น หน้าเซเว่น ซอยลาดพร้าว 71" 
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all text-sm font-medium text-gray-700 placeholder-gray-300"
                    />
                    <button type="button" className="bg-orange-100 text-orange-600 p-3 rounded-xl hover:bg-orange-200 transition-colors shrink-0">
                      <LocateFixed size={20} />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-[#3D312E] font-bold text-[15px] mb-3">จังหวัด</label>
                  <select className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all text-sm font-medium text-gray-700 appearance-none bg-white">
                    <option>กรุงเทพฯ</option>
                    <option>นนทบุรี</option>
                    <option>ปทุมธานี</option>
                  </select>
                </div>
              </div>

              {/* อาการที่พบ */}
              <div>
                <label className="block text-[#3D312E] font-bold text-[15px] mb-3">อาการที่พบ</label>
                <textarea 
                  rows={4}
                  placeholder="เช่น ขาเจ็บ ผอม มีแผล ดูหิวน้ำ"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all text-sm font-medium text-gray-700 placeholder-gray-300 resize-none"
                ></textarea>
              </div>

              {/* ชื่อผู้แจ้ง และ เบอร์ติดต่อ */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#3D312E] font-bold text-[15px] mb-3">ชื่อผู้แจ้ง</label>
                  <input 
                    type="text" 
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all text-sm font-medium text-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-[#3D312E] font-bold text-[15px] mb-3">เบอร์ติดต่อ</label>
                  <input 
                    type="text" 
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all text-sm font-medium text-gray-700"
                  />
                </div>
              </div>

              {/* ปุ่มส่งเรื่อง */}
              <button 
                type="button"
                className="w-full bg-[#F37021] hover:bg-[#E06015] text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all mt-2"
              >
                <Send size={18} /> ส่งเรื่องแจ้งเหตุ
              </button>
            </form>
          </div>
        </div>

        {/* ================= ฝั่งขวา: เคสที่แจ้งเข้ามา ================= */}
        <div className="pt-[4.5rem]">
          <h2 className="text-[1.35rem] font-black text-[#3D312E] mb-6">เคสที่แจ้งเข้ามา</h2>
          
          <div className="flex flex-col gap-4">
            {/* Card รายการเคส 1 */}
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] flex gap-4">
              <div className="w-[4.5rem] h-[4.5rem] bg-[#F7F5F4] rounded-2xl flex items-center justify-center text-[#A69B97] shrink-0">
                <Dog size={28} />
              </div>
              <div className="flex flex-col flex-1 justify-center">
                <span className="inline-flex items-center gap-1 bg-[#FFF5D1] text-[#9A7D0A] text-[10px] font-bold px-2 py-0.5 rounded flex-start w-fit mb-1.5">
                  <Clock size={10} /> กำลังรอแอดมินตรวจสอบ
                </span>
                <h3 className="font-extrabold text-[#3D312E] text-sm mb-1 leading-snug line-clamp-1">
                  ขาหลังเดินกะเผลก ผอมมาก มีแผลที่หู
                </h3>
                <div className="flex items-center gap-1 text-[11px] text-gray-400 font-medium mb-0.5">
                  <MapPin size={12} /> หน้าตลาดสดบางกะปิ, กรุงเทพฯ
                </div>
                <div className="flex items-center gap-1 text-[11px] text-gray-400 font-medium">
                  <Clock size={12} /> 16 พ.ย. 2569 · โดย สมชาย
                </div>
              </div>
            </div>
            
            {/* หากต้องการเพิ่ม Card อื่นๆ ก็สามารถ Copy โครงสร้างด้านบนมาวางต่อได้เลยครับ */}
          </div>
        </div>

      </div>
    </div>
  );
}