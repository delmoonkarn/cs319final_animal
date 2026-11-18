// src/pages/DonationPage.tsx
import { useState } from 'react';
import { Bone, Syringe, ShoppingBasket, ImagePlus, Plus, Heart, X } from 'lucide-react';

interface CartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
}

export function DonationPage() {
  const [cart, setCart] = useState<CartItem[]>([]);

  // ฟังก์ชันเพิ่มลงตะกร้า
  const addToCart = (id: string, name: string, price: number) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === id);
      if (existing) {
        return prev.map(item => item.id === id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { id, name, price, qty: 1 }];
    });
  };

  // ฟังก์ชันลบออกจากตะกร้า
  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  // คำนวณยอดรวม
  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans pb-20">
      <div className="max-w-[1200px] mx-auto px-6 pt-12">
        
        {/* Header */}
        <div className="mb-10">
          <span className="inline-flex items-center gap-1.5 text-orange-600 font-bold text-[11px] bg-orange-100 px-3 py-1.5 rounded-full mb-4">
            <Heart size={14} className="fill-orange-600" /> Donation
          </span>
          <h1 className="text-4xl font-black text-[#3D312E] leading-tight mb-2 tracking-tight">
            กองทุนอุปถัมภ์น้องจร
          </h1>
          <p className="text-gray-500 font-medium text-sm">
            เลือกแพ็กเกจที่อยากช่วย ทุกบาทนำไปเป็นค่าอาหารและวัคซีนให้น้องๆ ในศูนย์
          </p>
        </div>

        {/* Layout Grid (3 คอลัมน์) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* ================= แพ็กเกจ 1: ค่าอาหาร ================= */}
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 flex flex-col h-[450px]">
            <div className="bg-orange-100/70 w-14 h-14 rounded-2xl flex items-center justify-center text-orange-500 mb-6">
              <Bone size={28} />
            </div>
            <h2 className="text-xl font-extrabold text-[#3D312E] mb-1">ค่าอาหาร</h2>
            <div className="text-3xl font-black text-[#F37021] mb-4">
              100 <span className="text-xl">บาท</span>
            </div>
            <p className="text-gray-500 text-sm font-medium">อาหารเม็ดคุณภาพดี 1 สัปดาห์ต่อน้อง 1 ตัว</p>
            
            <button 
              onClick={() => addToCart('food', 'ค่าอาหาร', 100)}
              className="mt-auto w-full bg-[#F37021] hover:bg-[#E06015] text-white font-bold py-3.5 rounded-full flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98]"
            >
              <Plus size={18} /> ใส่ตะกร้า
            </button>
          </div>

          {/* ================= แพ็กเกจ 2: ค่าวัคซีน ================= */}
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 flex flex-col h-[450px]">
            <div className="bg-orange-100/70 w-14 h-14 rounded-2xl flex items-center justify-center text-orange-500 mb-6">
              <Syringe size={28} />
            </div>
            <h2 className="text-xl font-extrabold text-[#3D312E] mb-1">ค่าวัคซีน</h2>
            <div className="text-3xl font-black text-[#F37021] mb-4">
              300 <span className="text-xl">บาท</span>
            </div>
            <p className="text-gray-500 text-sm font-medium">วัคซีนรวมหรือพิษสุนัขบ้า 1 เข็ม</p>
            
            <button 
              onClick={() => addToCart('vaccine', 'ค่าวัคซีน', 300)}
              className="mt-auto w-full bg-[#F37021] hover:bg-[#E06015] text-white font-bold py-3.5 rounded-full flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98]"
            >
              <Plus size={18} /> ใส่ตะกร้า
            </button>
          </div>

          {/* ================= ฝั่งขวา: ตะกร้าบริจาค ================= */}
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 flex flex-col h-full lg:min-h-[600px]">
            <h2 className="text-xl font-extrabold text-[#3D312E] mb-6 flex items-center gap-2">
              <ShoppingBasket size={24} className="text-[#F37021]" /> ตะกร้าบริจาค
            </h2>

            {/* รายการในตะกร้า */}
            <div className="mb-6 flex-grow">
              {cart.length === 0 ? (
                <div className="bg-[#FFF9F5] text-orange-800/60 font-medium text-sm py-4 rounded-xl text-center border border-orange-100/50">
                  ยังไม่มีแพ็กเกจในตะกร้า
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {cart.map(item => (
                    <div key={item.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <div>
                        <div className="font-bold text-sm text-gray-800">{item.name} <span className="text-orange-500 ml-1">x{item.qty}</span></div>
                        <div className="text-xs text-gray-500 font-medium">{item.price * item.qty} บาท</div>
                      </div>
                      <button onClick={() => removeFromCart(item.id)} className="text-gray-400 hover:text-red-500 p-1">
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ยอดรวม */}
            <div className="flex justify-between items-center border-y border-gray-100 py-4 mb-6">
              <span className="text-gray-500 font-bold text-sm">ยอดรวม</span>
              <span className="text-2xl font-black text-[#F37021]">{totalAmount} <span className="text-base">บาท</span></span>
            </div>

            {/* ข้อมูลโอนเงินจำลอง */}
            <div className="bg-[#FFF9F5] p-4 rounded-2xl border border-orange-100 mb-5">
              <div className="text-[#3D312E] font-bold text-[13px] mb-1">โอนเข้าบัญชี (จำลอง)</div>
              <div className="text-gray-500 text-xs font-medium">ธนาคารกสิกรไทย · 123-4-56789-0 · มูลนิธิ PawHome</div>
            </div>

            {/* ฟอร์มกรอกข้อมูล */}
            <div className="mb-5">
              <label className="block text-[#3D312E] font-bold text-[13px] mb-2">ชื่อผู้บริจาค (ไม่บังคับ)</label>
              <input 
                type="text" 
                placeholder="ผู้ใจดีไม่ประสงค์ออกนาม" 
                className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all text-sm font-medium text-gray-700 placeholder-gray-400"
              />
            </div>

            {/* อัปโหลดสลิป */}
            <div className="mb-6">
              <label className="block text-[#3D312E] font-bold text-[13px] mb-2">สลิปโอนเงิน</label>
              <div className="border-2 border-dashed border-orange-200 bg-[#FFFBF9] rounded-2xl py-8 flex flex-col items-center justify-center cursor-pointer hover:bg-orange-50/50 transition-colors">
                <div className="text-orange-500 mb-2">
                  <ImagePlus size={28} />
                </div>
                <span className="font-bold text-[#3D312E] text-sm mb-1">อัปโหลดสลิปโอนเงิน</span>
                <span className="text-gray-400 text-[11px] font-medium">ไฟล์รูปภาพสลิปจากแอปธนาคาร</span>
              </div>
            </div>

            {/* ปุ่มยืนยัน */}
            <button 
              disabled={cart.length === 0}
              className={`w-full font-bold py-3.5 rounded-full transition-all text-sm ${
                cart.length > 0 
                  ? 'bg-[#F37021] hover:bg-[#E06015] text-white shadow-md' 
                  : 'bg-orange-200 text-white cursor-not-allowed'
              }`}
            >
              ยืนยันการบริจาค
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}