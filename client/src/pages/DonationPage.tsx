import { useRef, useState } from 'react';
import {
  Bone, Syringe, ShoppingBasket, ImagePlus, Plus, Minus, Heart, X, CheckCircle2, AlertCircle, Loader2,
} from 'lucide-react';
import { api } from '../api';
import { getActiveUserEmail } from '../store/useAuthStore';

interface CartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
}

interface DonationRecord {
  id: string;
  userEmail: string;
  donorName: string;
  totalAmount: number;
  items: CartItem[];
  slipPreview: string;
  createdAt: string;
}

const DONATION_STORAGE_KEY = 'pawhome_donations_v2';

function fileToDataUrl(file: File, maxDim = 900): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('อ่านไฟล์สลิปไม่สำเร็จ'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => resolve(String(reader.result));
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(String(reader.result));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export function DonationPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [donorName, setDonorName] = useState('');
  const [slipPreview, setSlipPreview] = useState<string | null>(null);
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [lastDonation, setLastDonation] = useState<DonationRecord | null>(null);

  const slipInputRef = useRef<HTMLInputElement>(null);

  const addToCart = (id: string, name: string, price: number) => {
    setLastDonation(null);
    setError('');
    setCart((prev) => {
      const existing = prev.find((item) => item.id === id);
      if (existing) {
        return prev.map((item) => (item.id === id ? { ...item, qty: item.qty + 1 } : item));
      }
      return [...prev, { id, name, price, qty: 1 }];
    });
  };

  const decreaseQty = (id: string) => {
    setCart((prev) =>
      prev
        .map((item) => (item.id === id ? { ...item, qty: item.qty - 1 } : item))
        .filter((item) => item.qty > 0),
    );
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  const handleSelectSlip = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const file = fileList[0];
    if (!file.type.startsWith('image/')) {
      setError('กรุณาเลือกไฟล์รูปภาพสลิปโอนเงินเท่านั้น');
      return;
    }
    setError('');
    try {
      const dataUrl = await fileToDataUrl(file);
      setSlipPreview(dataUrl);
      setSlipFile(file);
    } catch {
      setError('ไม่สามารถอ่านไฟล์รูปภาพสลิปได้');
    }
    if (slipInputRef.current) slipInputRef.current.value = '';
  };

  const handleRemoveSlip = () => {
    setSlipPreview(null);
    setSlipFile(null);
  };

  const handleConfirmDonation = async () => {
    setError('');
    if (cart.length === 0) {
      setError('กรุณาเลือกแพ็กเกจบริจาคใส่ตะกร้าอย่างน้อย 1 รายการ');
      return;
    }
    if (!slipPreview) {
      setError('กรุณาอัปโหลดรูปสลิปโอนเงินก่อนยืนยันการบริจาค');
      return;
    }

    setSubmitting(true);

    const token = localStorage.getItem('token');
    if (token && slipFile) {
      try {
        const pkgsRes = await api.get('/donation-packages');
        const pkgs: any[] = Array.isArray(pkgsRes.data) ? pkgsRes.data : [];
        const formData = new FormData();
        formData.append('images', slipFile);
        const upRes = await api.post('/uploads', formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const slipUrl = upRes.data?.[0]?.url;
        if (slipUrl && pkgs.length > 0) {
          const items = cart
            .map((c) => {
              const found = pkgs.find((p) => p.price === c.price || p.name?.includes(c.name));
              return found ? { packageId: Number(found.id), quantity: c.qty } : null;
            })
            .filter(Boolean);
          if (items.length > 0) {
            await api.post(
              '/donations',
              { items, slipUrl },
              { headers: { Authorization: `Bearer ${token}` } },
            );
          }
        }
      } catch {

      }
    }

    const record: DonationRecord = {
      id: `don-${Date.now()}`,
      userEmail: getActiveUserEmail(),
      donorName: donorName.trim() || 'ผู้ใจดีไม่ประสงค์ออกนาม',
      totalAmount,
      items: cart,
      slipPreview,
      createdAt: new Date().toISOString(),
    };

    try {
      const raw = localStorage.getItem(DONATION_STORAGE_KEY);
      const prev = raw ? JSON.parse(raw) : [];
      localStorage.setItem(
        DONATION_STORAGE_KEY,
        JSON.stringify([record, ...(Array.isArray(prev) ? prev : [])]),
      );
    } catch {

    }

    setLastDonation(record);
    setCart([]);
    setDonorName('');
    setSlipPreview(null);
    setSlipFile(null);
    setSubmitting(false);
  };

  const canSubmit = cart.length > 0 && Boolean(slipPreview) && !submitting;

  return (
    <div className="min-h-screen bg-[#FFFBF7] font-sans pb-20">
      <div className="max-w-[1140px] mx-auto px-6 pt-12">

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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

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
              type="button"
              onClick={() => addToCart('food', 'ค่าอาหาร', 100)}
              className="mt-auto w-full bg-[#F37021] hover:bg-[#E06015] text-white font-bold py-3.5 rounded-full flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98] cursor-pointer"
            >
              <Plus size={18} /> ใส่ตะกร้า
            </button>
          </div>

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
              type="button"
              onClick={() => addToCart('vaccine', 'ค่าวัคซีน', 300)}
              className="mt-auto w-full bg-[#F37021] hover:bg-[#E06015] text-white font-bold py-3.5 rounded-full flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98] cursor-pointer"
            >
              <Plus size={18} /> ใส่ตะกร้า
            </button>
          </div>

          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 flex flex-col h-full lg:min-h-[600px]">
            <h2 className="text-xl font-extrabold text-[#3D312E] mb-6 flex items-center gap-2">
              <ShoppingBasket size={24} className="text-[#F37021]" /> ตะกร้าบริจาค
            </h2>

            {lastDonation && (
              <div className="mb-5 bg-green-50 border border-green-200 rounded-2xl p-4 text-green-800">
                <div className="flex items-center gap-2 font-extrabold text-sm mb-1">
                  <CheckCircle2 size={18} className="text-green-600 shrink-0" />
                  ขอบคุณสำหรับการสนับสนุน!
                </div>
                <p className="text-xs text-green-700 font-medium leading-relaxed">
                  คุณ <span className="font-bold">{lastDonation.donorName}</span> ได้ร่วมบริจาคยอดรวม{' '}
                  <span className="font-bold">{lastDonation.totalAmount.toLocaleString()} บาท</span>{' '}
                  ระบบได้รับสลิปโอนเงินเรียบร้อยแล้ว (กำลังรอแอดมินตรวจสอบ)
                </p>
              </div>
            )}

            <div className="mb-6 flex-grow">
              {cart.length === 0 ? (
                <div className="bg-[#FFF9F5] text-orange-800/60 font-medium text-sm py-4 rounded-xl text-center border border-orange-100/50">
                  ยังไม่มีแพ็กเกจในตะกร้า
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {cart.map((item) => (
                    <div key={item.id} className="flex justify-between items-center bg-[#FFF9F5] p-3.5 rounded-xl border border-orange-100">
                      <div>
                        <div className="font-bold text-sm text-[#3D312E]">
                          {item.name} <span className="text-orange-500 ml-1">x{item.qty}</span>
                        </div>
                        <div className="text-xs text-gray-500 font-medium">
                          {(item.price * item.qty).toLocaleString()} บาท
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => decreaseQty(item.id)}
                          className="w-7 h-7 rounded-full bg-white border border-orange-200 text-orange-600 hover:bg-orange-50 flex items-center justify-center transition"
                          aria-label="ลดจำนวน"
                        >
                          <Minus size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => addToCart(item.id, item.name, item.price)}
                          className="w-7 h-7 rounded-full bg-white border border-orange-200 text-orange-600 hover:bg-orange-50 flex items-center justify-center transition"
                          aria-label="เพิ่มจำนวน"
                        >
                          <Plus size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          className="text-gray-400 hover:text-red-500 p-1 ml-1"
                          aria-label="ลบรายการ"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-between items-center border-y border-gray-100 py-4 mb-6">
              <span className="text-gray-500 font-bold text-sm">ยอดรวม</span>
              <span className="text-2xl font-black text-[#F37021]">
                {totalAmount.toLocaleString()} <span className="text-base">บาท</span>
              </span>
            </div>

            <div className="bg-[#FFF9F5] p-4 rounded-2xl border border-orange-100 mb-5">
              <div className="text-[#3D312E] font-bold text-[13px] mb-1">โอนเข้าบัญชี (จำลอง)</div>
              <div className="text-gray-500 text-xs font-medium">ธนาคารกสิกรไทย · 123-4-56789-0 · มูลนิธิ PawHome</div>
            </div>

            <div className="mb-5">
              <label className="block text-[#3D312E] font-bold text-[13px] mb-2">ชื่อผู้บริจาค (ไม่บังคับ)</label>
              <input
                type="text"
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                placeholder="ผู้ใจดีไม่ประสงค์ออกนาม"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all text-sm font-medium text-gray-700 placeholder-gray-400"
              />
            </div>

            <div className="mb-5">
              <label className="block text-[#3D312E] font-bold text-[13px] mb-2">สลิปโอนเงิน</label>
              <input
                ref={slipInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleSelectSlip(e.target.files)}
              />

              {!slipPreview ? (
                <div
                  onClick={() => slipInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleSelectSlip(e.dataTransfer.files);
                  }}
                  className="border-2 border-dashed border-orange-200 bg-[#FFFBF9] rounded-2xl py-8 flex flex-col items-center justify-center cursor-pointer hover:bg-orange-50/50 transition-colors"
                >
                  <div className="text-orange-500 mb-2">
                    <ImagePlus size={28} />
                  </div>
                  <span className="font-bold text-[#3D312E] text-sm mb-1">อัปโหลดสลิปโอนเงิน</span>
                  <span className="text-gray-400 text-[11px] font-medium">ไฟล์รูปภาพสลิปจากแอปธนาคาร</span>
                </div>
              ) : (
                <div className="relative rounded-2xl overflow-hidden border border-orange-200 bg-[#FFFBF9] p-2">
                  <img
                    src={slipPreview}
                    alt="สลิปโอนเงิน"
                    className="w-full max-h-52 object-contain rounded-xl bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveSlip}
                    className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/60 hover:bg-red-500 text-white flex items-center justify-center transition"
                    aria-label="ลบสลิป"
                  >
                    <X size={14} />
                  </button>
                  <div className="mt-2 flex items-center justify-between px-1 text-xs">
                    <span className="font-bold text-green-600 flex items-center gap-1">
                      <CheckCircle2 size={14} /> แนบสลิปเรียบร้อยแล้ว
                    </span>
                    <button
                      type="button"
                      onClick={() => slipInputRef.current?.click()}
                      className="text-orange-500 hover:underline font-bold"
                    >
                      เปลี่ยนรูป
                    </button>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 text-xs font-bold px-3.5 py-2.5 rounded-xl">
                <AlertCircle size={15} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleConfirmDonation}
              disabled={!canSubmit}
              className={`w-full font-bold py-3.5 rounded-full transition-all text-sm flex items-center justify-center gap-2 ${canSubmit
                ? 'bg-[#F37021] hover:bg-[#E06015] text-white shadow-md cursor-pointer'
                : 'bg-orange-200 text-white cursor-not-allowed'
                }`}
            >
              {submitting && <Loader2 size={16} className="animate-spin" />}
              ยืนยันการบริจาค
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}
