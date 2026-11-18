import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ShoppingBasket, ImagePlus, Plus, Minus, Heart, X, CheckCircle2, AlertCircle, Loader2, LogIn, Receipt, RotateCw,
} from 'lucide-react';
import { api } from '../api';
import { useAuthStore } from '../store/useAuthStore';
import { authHeaders, errorMessage, formatDateTime, isUnauthorized, uploadImages, type ImageDto } from '../lib/admin-api';

/** GET /donation-packages */
type DonationPackage = { id: number; name: string; description: string; price: number; icon: string };

/** POST /donations and GET /donations/me */
type MyDonation = {
  id: number;
  total: number;
  status: 'PENDING' | 'CONFIRMED';
  createdAt: string;
  slip: ImageDto;
  items: { id: number; quantity: number; unitPrice: number; subtotal: number; package: { id: number; name: string; icon: string } }[];
};

/** GET /donations/summary */
type DonationSummary = { totalConfirmed: number; confirmedCount: number };

type CartItem = { pkg: DonationPackage; qty: number };

const SLIP_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_QTY = 99;

export function DonationPage() {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const logout = useAuthStore((state) => state.logout);
  const queryClient = useQueryClient();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [slipPreview, setSlipPreview] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [lastDonation, setLastDonation] = useState<MyDonation | null>(null);
  const slipInputRef = useRef<HTMLInputElement>(null);

  const packagesQ = useQuery({
    queryKey: ['donation-packages'],
    queryFn: async () => (await api.get<DonationPackage[]>('/donation-packages')).data,
  });
  const summaryQ = useQuery({
    queryKey: ['donation-summary'],
    queryFn: async () => (await api.get<DonationSummary>('/donations/summary')).data,
  });
  const myDonationsQ = useQuery({
    queryKey: ['my-donations', user?.id],
    queryFn: async () => (await api.get<MyDonation[]>('/donations/me', { headers: authHeaders() })).data,
    enabled: Boolean(token),
  });

  // The slip preview is a local object URL; free it when it changes or the page closes.
  useEffect(() => () => {
    if (slipPreview) URL.revokeObjectURL(slipPreview);
  }, [slipPreview]);

  const handleAuthError = (e: unknown, fallback: string) => {
    if (isUnauthorized(e)) {
      logout();
      setError('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่');
    } else {
      setError(errorMessage(e, fallback));
    }
  };

  const donate = useMutation({
    mutationFn: async () => {
      if (!slipFile) throw new Error('missing slip');
      const [slip] = await uploadImages([slipFile]);
      const items = cart.map((item) => ({ packageId: item.pkg.id, quantity: item.qty }));
      return (await api.post<MyDonation>('/donations', { items, slipUrl: slip.url }, { headers: authHeaders() })).data;
    },
    onSuccess: (donation) => {
      setLastDonation(donation);
      setCart([]);
      setSlipFile(null);
      setSlipPreview(null);
      queryClient.invalidateQueries({ queryKey: ['my-donations'] });
      queryClient.invalidateQueries({ queryKey: ['admin'] });
    },
    onError: (e) => handleAuthError(e, 'บริจาคไม่สำเร็จ กรุณาลองใหม่อีกครั้ง'),
  });

  const cancel = useMutation({
    mutationFn: (id: number) => api.delete(`/donations/${id}`, { headers: authHeaders() }),
    onSuccess: (_res, id) => {
      if (lastDonation?.id === id) setLastDonation(null);
      queryClient.invalidateQueries({ queryKey: ['my-donations'] });
      queryClient.invalidateQueries({ queryKey: ['admin'] });
    },
  });

  const addToCart = (pkg: DonationPackage) => {
    setLastDonation(null);
    setError('');
    setCart((prev) => {
      const existing = prev.find((item) => item.pkg.id === pkg.id);
      if (existing) {
        return prev.map((item) => (item.pkg.id === pkg.id ? { ...item, qty: Math.min(MAX_QTY, item.qty + 1) } : item));
      }
      return [...prev, { pkg, qty: 1 }];
    });
  };

  const decreaseQty = (id: number) => {
    setCart((prev) =>
      prev.map((item) => (item.pkg.id === id ? { ...item, qty: item.qty - 1 } : item)).filter((item) => item.qty > 0),
    );
  };

  const removeFromCart = (id: number) => setCart((prev) => prev.filter((item) => item.pkg.id !== id));

  const totalAmount = cart.reduce((sum, item) => sum + item.pkg.price * item.qty, 0);

  const handleSelectSlip = (fileList: FileList | null) => {
    // Read the file first: clearing the input empties this same FileList.
    const file = fileList?.[0];
    if (slipInputRef.current) slipInputRef.current.value = '';
    if (!file) return;
    if (!SLIP_TYPES.includes(file.type)) return setError('รองรับเฉพาะไฟล์สลิป JPG, PNG หรือ WEBP');
    if (file.size > 5 * 1024 * 1024) return setError('ไฟล์สลิปต้องไม่เกิน 5 MB');
    setError('');
    setSlipFile(file);
    setSlipPreview(URL.createObjectURL(file));
  };

  const handleRemoveSlip = () => {
    setSlipFile(null);
    setSlipPreview(null);
  };

  const handleConfirmDonation = () => {
    setError('');
    if (cart.length === 0) return setError('กรุณาเลือกแพ็กเกจบริจาคใส่ตะกร้าอย่างน้อย 1 รายการ');
    if (!slipFile) return setError('กรุณาอัปโหลดรูปสลิปโอนเงินก่อนยืนยันการบริจาค');
    donate.mutate();
  };

  const canSubmit = Boolean(token) && cart.length > 0 && Boolean(slipFile) && !donate.isPending;
  const packages = packagesQ.data ?? [];
  const myDonations = myDonationsQ.data ?? [];

  return (
    <div className="min-h-screen bg-[#FFFBF7] font-sans pb-20">
      <div className="max-w-[1140px] mx-auto px-4 sm:px-6 pt-12">

        <div className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
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
          {summaryQ.data && (
            <div className="bg-white border border-orange-100 rounded-2xl px-5 py-3 shadow-sm">
              <div className="text-[11px] font-bold text-gray-400">ยอดบริจาคที่ยืนยันแล้ว</div>
              <div className="text-2xl font-black text-[#F37021]">
                {summaryQ.data.totalConfirmed.toLocaleString()} <span className="text-sm">บาท</span>
              </div>
              <div className="text-[11px] font-medium text-gray-400">จาก {summaryQ.data.confirmedCount.toLocaleString()} รายการ</div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

          <div className="lg:col-span-2 flex flex-col gap-8">
            {packagesQ.isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-[2rem] h-[270px] border border-gray-100 animate-pulse" />
                ))}
              </div>
            ) : packagesQ.isError ? (
              <div className="bg-white rounded-[2rem] p-8 border border-red-100 text-center">
                <AlertCircle size={28} className="text-red-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-red-500 mb-4">{errorMessage(packagesQ.error, 'โหลดแพ็กเกจบริจาคไม่สำเร็จ')}</p>
                <button
                  type="button"
                  onClick={() => packagesQ.refetch()}
                  className="inline-flex items-center gap-1.5 bg-[#F37021] hover:bg-[#E06015] text-white text-sm font-bold px-5 py-2.5 rounded-full cursor-pointer"
                >
                  <RotateCw size={15} /> ลองใหม่
                </button>
              </div>
            ) : packages.length === 0 ? (
              <div className="bg-white rounded-[2rem] p-8 border border-gray-100 text-center text-sm font-bold text-gray-400">
                ยังไม่มีแพ็กเกจบริจาคในขณะนี้
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {packages.map((pkg) => {
                  const inCart = cart.find((item) => item.pkg.id === pkg.id)?.qty ?? 0;
                  return (
                    <div key={pkg.id} className="bg-white rounded-[2rem] p-7 shadow-sm border border-gray-100 flex flex-col min-h-[270px]">
                      <div className="flex items-start justify-between mb-5">
                        <div className="bg-orange-100/70 w-14 h-14 rounded-2xl flex items-center justify-center text-3xl" aria-hidden>
                          {pkg.icon}
                        </div>
                        {inCart > 0 && (
                          <span className="text-[11px] font-bold text-orange-600 bg-orange-50 border border-orange-100 px-2.5 py-1 rounded-full">
                            ในตะกร้า x{inCart}
                          </span>
                        )}
                      </div>
                      <h2 className="text-xl font-extrabold text-[#3D312E] mb-1">{pkg.name}</h2>
                      <div className="text-3xl font-black text-[#F37021] mb-3">
                        {pkg.price.toLocaleString()} <span className="text-xl">บาท</span>
                      </div>
                      <p className="text-gray-500 text-sm font-medium mb-6">{pkg.description}</p>
                      <button
                        type="button"
                        onClick={() => addToCart(pkg)}
                        disabled={inCart >= MAX_QTY}
                        className="mt-auto w-full bg-[#F37021] hover:bg-[#E06015] text-white font-bold py-3.5 rounded-full flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98] cursor-pointer disabled:opacity-60"
                      >
                        <Plus size={18} /> ใส่ตะกร้า
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {token && (
              <div className="bg-white rounded-[2rem] p-7 shadow-sm border border-gray-100">
                <h2 className="text-lg font-extrabold text-[#3D312E] mb-5 flex items-center gap-2">
                  <Receipt size={20} className="text-[#F37021]" /> การบริจาคของฉัน
                </h2>
                {myDonationsQ.isLoading ? (
                  <div className="flex items-center gap-2 text-sm font-bold text-gray-400">
                    <Loader2 size={16} className="animate-spin" /> กำลังโหลด...
                  </div>
                ) : myDonationsQ.isError ? (
                  <p className="text-sm font-bold text-red-500">{errorMessage(myDonationsQ.error, 'โหลดประวัติการบริจาคไม่สำเร็จ')}</p>
                ) : myDonations.length === 0 ? (
                  <p className="text-sm font-bold text-gray-400">ยังไม่มีประวัติการบริจาค</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {myDonations.map((d) => (
                      <div key={d.id} className="flex items-center gap-4 bg-[#FFF9F5] border border-orange-100 rounded-2xl p-3.5">
                        <a href={d.slip.url} target="_blank" rel="noreferrer" className="w-12 h-12 rounded-xl overflow-hidden bg-white shrink-0 block">
                          <img src={d.slip.thumbUrl} alt={`สลิปรายการ #${d.id}`} className="w-full h-full object-cover" />
                        </a>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-bold text-[#3D312E] truncate">
                            {d.items.map((item) => `${item.package.icon} ${item.package.name} x${item.quantity}`).join(' · ')}
                          </div>
                          <div className="text-xs font-medium text-gray-400">#{d.id} · {formatDateTime(d.createdAt)}</div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-sm font-black text-[#F37021]">{d.total.toLocaleString()} บาท</div>
                          <DonationStatusBadge status={d.status} />
                        </div>
                        {d.status === 'PENDING' && (
                          <button
                            type="button"
                            onClick={() => window.confirm(`ยกเลิกรายการบริจาค #${d.id}?`) && cancel.mutate(d.id)}
                            disabled={cancel.isPending}
                            className="text-gray-300 hover:text-red-500 p-1 shrink-0 cursor-pointer disabled:opacity-50"
                            aria-label={`ยกเลิกรายการ #${d.id}`}
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {cancel.isError && <p className="text-xs font-bold text-red-500 mt-3">{errorMessage(cancel.error, 'ยกเลิกรายการไม่สำเร็จ')}</p>}
              </div>
            )}
          </div>

          <div className="bg-white rounded-[2rem] p-7 sm:p-8 shadow-sm border border-gray-100 flex flex-col lg:sticky lg:top-24">
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
                  คุณ <span className="font-bold">{user?.name}</span> ได้ร่วมบริจาคยอดรวม{' '}
                  <span className="font-bold">{lastDonation.total.toLocaleString()} บาท</span>{' '}
                  (รายการ #{lastDonation.id}) ระบบได้รับสลิปโอนเงินเรียบร้อยแล้ว กำลังรอแอดมินตรวจสอบ
                </p>
              </div>
            )}

            {!token && (
              <div className="mb-5 bg-[#FFF9F5] border border-orange-100 rounded-2xl p-4">
                <p className="text-xs font-bold text-[#3D312E] mb-3">กรุณาเข้าสู่ระบบก่อนบริจาค เพื่อให้ติดตามสถานะสลิปได้</p>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 bg-[#F37021] hover:bg-[#E06015] text-white text-xs font-bold px-4 py-2 rounded-full"
                >
                  <LogIn size={14} /> เข้าสู่ระบบ
                </Link>
              </div>
            )}

            <div className="mb-6">
              {cart.length === 0 ? (
                <div className="bg-[#FFF9F5] text-orange-800/60 font-medium text-sm py-4 rounded-xl text-center border border-orange-100/50">
                  ยังไม่มีแพ็กเกจในตะกร้า
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {cart.map(({ pkg, qty }) => (
                    <div key={pkg.id} className="flex justify-between items-center gap-2 bg-[#FFF9F5] p-3.5 rounded-xl border border-orange-100">
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-[#3D312E] truncate">
                          {pkg.icon} {pkg.name} <span className="text-orange-500 ml-1">x{qty}</span>
                        </div>
                        <div className="text-xs text-gray-500 font-medium">{(pkg.price * qty).toLocaleString()} บาท</div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => decreaseQty(pkg.id)}
                          className="w-7 h-7 rounded-full bg-white border border-orange-200 text-orange-600 hover:bg-orange-50 flex items-center justify-center transition cursor-pointer"
                          aria-label="ลดจำนวน"
                        >
                          <Minus size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => addToCart(pkg)}
                          disabled={qty >= MAX_QTY}
                          className="w-7 h-7 rounded-full bg-white border border-orange-200 text-orange-600 hover:bg-orange-50 flex items-center justify-center transition cursor-pointer disabled:opacity-50"
                          aria-label="เพิ่มจำนวน"
                        >
                          <Plus size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeFromCart(pkg.id)}
                          className="text-gray-400 hover:text-red-500 p-1 ml-1 cursor-pointer"
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

            {user && (
              <div className="mb-5 text-[13px] font-bold text-[#3D312E]">
                ผู้บริจาค: <span className="text-orange-600">{user.name}</span>
              </div>
            )}

            <div className="mb-5">
              <label className="block text-[#3D312E] font-bold text-[13px] mb-2">สลิปโอนเงิน</label>
              <input
                ref={slipInputRef}
                type="file"
                accept={SLIP_TYPES.join(',')}
                className="hidden"
                onChange={(e) => handleSelectSlip(e.target.files)}
              />

              {!slipPreview ? (
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => slipInputRef.current?.click()}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && slipInputRef.current?.click()}
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
                  <span className="text-gray-400 text-[11px] font-medium">JPG, PNG หรือ WEBP ไม่เกิน 5 MB</span>
                </div>
              ) : (
                <div className="relative rounded-2xl overflow-hidden border border-orange-200 bg-[#FFFBF9] p-2">
                  <img src={slipPreview} alt="สลิปโอนเงิน" className="w-full max-h-52 object-contain rounded-xl bg-white" />
                  <button
                    type="button"
                    onClick={handleRemoveSlip}
                    disabled={donate.isPending}
                    className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/60 hover:bg-red-500 text-white flex items-center justify-center transition cursor-pointer"
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
                      disabled={donate.isPending}
                      className="text-orange-500 hover:underline font-bold cursor-pointer"
                    >
                      เปลี่ยนรูป
                    </button>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div role="alert" className="mb-4 flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 text-xs font-bold px-3.5 py-2.5 rounded-xl">
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
              {donate.isPending && <Loader2 size={16} className="animate-spin" />}
              {donate.isPending ? 'กำลังส่งสลิป...' : 'ยืนยันการบริจาค'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DonationStatusBadge({ status }: { status: MyDonation['status'] }) {
  return status === 'CONFIRMED' ? (
    <span className="inline-block text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">ยืนยันแล้ว</span>
  ) : (
    <span className="inline-block text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">รอตรวจสอบ</span>
  );
}
