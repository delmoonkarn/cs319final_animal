import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api';
import { getActiveUserEmail, useAuthStore } from '../store/useAuthStore';
import {
  Megaphone, Dog, Cat, Rabbit, ImagePlus, LocateFixed, Send, Clock, MapPin,
  X, CheckCircle2, Trash2, Loader2, Inbox, ChevronDown,
} from 'lucide-react';

type Species = 'DOG' | 'CAT' | 'OTHER';

export type ReportEntry = {
  id: string;
  userEmail: string;
  species: Species;
  breed?: string | null;
  images: string[];
  location: string;
  province: string;
  description: string;
  reporterName: string;
  reporterPhone: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
};

export const REPORTS_STORAGE_KEY = 'pawhome_submitted_reports_v2';
const MAX_IMAGES = 3;

const SPECIES_OPTIONS: { value: Species; label: string; icon: React.ReactNode }[] = [
  { value: 'DOG', label: 'หมา', icon: <Dog size={20} /> },
  { value: 'CAT', label: 'แมว', icon: <Cat size={20} /> },
  { value: 'OTHER', label: 'อื่นๆ / Exotic', icon: <Rabbit size={20} /> },
];

const EXOTIC_SUGGESTIONS = ['กระต่าย', 'นก', 'เต่า', 'งู', 'หนูแฮมสเตอร์', 'แกสบี้', 'อิกัวนา', 'ชูก้าไกลเดอร์'];

const FALLBACK_PROVINCES = [
  'กรุงเทพมหานคร', 'นนทบุรี', 'ปทุมธานี', 'สมุทรปราการ', 'สมุทรสาคร', 'นครปฐม',
  'เชียงใหม่', 'เชียงราย', 'ขอนแก่น', 'นครราชสีมา', 'อุบลราชธานี', 'ชลบุรี', 'ระยอง', 'ภูเก็ต', 'สงขลา',
];

function fileToDataUrl(file: File, maxDim = 900): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('อ่านไฟล์รูปไม่สำเร็จ'));
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

export function loadAllSavedReports(): ReportEntry[] {
  try {
    const raw = localStorage.getItem(REPORTS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function loadMySavedReports(): ReportEntry[] {
  const email = getActiveUserEmail();
  return loadAllSavedReports().filter((r) => (r.userEmail || 'guest').toLowerCase() === email);
}

export function saveAllReports(list: ReportEntry[]) {
  try {
    localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(list));
  } catch {

  }
}

function formatThaiDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
}

export function ReportPage() {
  const { user } = useAuthStore();
  const [animalType, setAnimalType] = useState<Species>('DOG');
  const [otherKind, setOtherKind] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [location, setLocation] = useState('');
  const [province, setProvince] = useState('กรุงเทพมหานคร');
  const [description, setDescription] = useState('');
  const [reporterName, setReporterName] = useState('');
  const [reporterPhone, setReporterPhone] = useState('');

  const [reports, setReports] = useState<ReportEntry[]>(() => loadMySavedReports());
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [justSubmitted, setJustSubmitted] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: provinces = FALLBACK_PROVINCES } = useQuery<string[]>({
    queryKey: ['provinces'],
    queryFn: async () => {
      const res = await api.get('/provinces');
      return Array.isArray(res.data) && res.data.length > 0 ? res.data : FALLBACK_PROVINCES;
    },
  });

  useEffect(() => {
    setReports(loadMySavedReports());
  }, [user?.email]);

  const handleSelectFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setError('');
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) {
      setError(`อัปโหลดได้สูงสุด ${MAX_IMAGES} รูป`);
      return;
    }
    const picked = Array.from(fileList)
      .filter((f) => f.type.startsWith('image/'))
      .slice(0, remaining);
    if (picked.length === 0) {
      setError('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
      return;
    }
    try {
      const urls = await Promise.all(picked.map((f) => fileToDataUrl(f)));
      setImages((prev) => [...prev, ...urls]);
      setFiles((prev) => [...prev, ...picked]);
    } catch {
      setError('ไม่สามารถอ่านไฟล์รูปภาพได้');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleLocate = () => {
    if (!navigator.geolocation) {
      setError('เบราว์เซอร์ของคุณไม่รองรับการดึงพิกัด');
      return;
    }
    setLocating(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocation((prev) => {
          const coords = `พิกัด ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
          return prev.trim() ? `${prev.trim()} (${coords})` : coords;
        });
        setLocating(false);
      },
      () => {
        setError('ไม่สามารถดึงพิกัดได้ กรุณาพิมพ์จุดที่พบด้วยตนเอง');
        setLocating(false);
      },
      { timeout: 8000 },
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setJustSubmitted(false);

    if (images.length === 0) return setError('กรุณาอัปโหลดรูปภาพน้องอย่างน้อย 1 รูป');
    if (!location.trim()) return setError('กรุณาระบุพิกัดหรือจุดที่พบน้อง');
    if (!description.trim()) return setError('กรุณาระบุอาการหรือรายละเอียดที่พบ');
    if (!reporterName.trim()) return setError('กรุณาระบุชื่อผู้แจ้ง');
    if (!reporterPhone.trim()) return setError('กรุณาระบุเบอร์ติดต่อ');

    setSubmitting(true);
    const fullLocation = `${location.trim()}, ${province}`;
    const breed = animalType === 'OTHER' ? otherKind.trim() || 'สัตว์ Exotic / อื่นๆ' : null;
    let createdId = `local-${Date.now()}`;
    let storedImages = images;

    const token = localStorage.getItem('token');
    if (token && files.length > 0) {
      try {
        const formData = new FormData();
        files.forEach((f) => formData.append('images', f));
        const uploadRes = await api.post('/uploads', formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const uploadedUrls: string[] = (uploadRes.data || []).map((u: any) => u.url);
        if (uploadedUrls.length > 0) {
          const reportRes = await api.post(
            '/reports',
            {
              species: animalType,
              breed,
              imageUrls: uploadedUrls,
              location: fullLocation,
              description: `${description.trim()} (ผู้แจ้ง: ${reporterName.trim()} โทร ${reporterPhone.trim()})`,
            },
            { headers: { Authorization: `Bearer ${token}` } },
          );
          if (reportRes.data?.id) createdId = String(reportRes.data.id);
          storedImages = uploadedUrls;
        }
      } catch {
      }
    }

    const newReport: ReportEntry = {
      id: createdId,
      userEmail: getActiveUserEmail(),
      species: animalType,
      breed,
      images: storedImages,
      location: location.trim(),
      province,
      description: description.trim(),
      reporterName: reporterName.trim(),
      reporterPhone: reporterPhone.trim(),
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    const nextAll = [newReport, ...loadAllSavedReports()];
    saveAllReports(nextAll);
    setReports((prev) => [newReport, ...prev]);
    setImages([]);
    setFiles([]);
    setOtherKind('');
    setLocation('');
    setDescription('');
    setReporterName('');
    setReporterPhone('');
    setSubmitting(false);
    setJustSubmitted(true);
  };

  const handleDeleteReport = (id: string) => {
    setReports((prev) => prev.filter((r) => r.id !== id));
    saveAllReports(loadAllSavedReports().filter((r) => r.id !== id));
    const token = localStorage.getItem('token');
    if (token && !id.startsWith('local-')) {
      api.delete(`/reports/${id}`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => { });
    }
  };

  const speciesIcon = (s: Species) =>
    s === 'DOG' ? <Dog size={26} /> : s === 'CAT' ? <Cat size={26} /> : <Rabbit size={26} />;

  const speciesBadge = (r: ReportEntry) =>
    r.species === 'DOG' ? 'หมา' : r.species === 'CAT' ? 'แมว' : r.breed || 'อื่นๆ / Exotic';

  return (
    <div className="min-h-screen bg-[#FFFBF7] font-sans pb-20">
      <div className="max-w-[1140px] mx-auto px-6 pt-12 grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-12 items-start">

        <div>
          <div className="mb-8">
            <span className="inline-flex items-center gap-1.5 text-red-500 font-bold text-xs bg-red-50 px-3 py-1.5 rounded-full mb-4">
              <Megaphone size={14} /> Community Report
            </span>
            <h1 className="text-[2.5rem] font-black text-[#3D312E] leading-tight mb-3">
              แจ้งพบสัตว์จรจัด
            </h1>
            <p className="text-gray-500 font-medium text-[15px] leading-relaxed max-w-[520px]">
              เจอน้องที่บาดเจ็บ ถูกทิ้ง หรือต้องการความช่วยเหลือ? ไม่ว่าจะเป็นหมา แมว หรือสัตว์ Exotic ก็แจ้งทีมงานได้ที่นี่ เมื่อแอดมินตรวจสอบแล้ว เคสจะขึ้นเว็บเพื่อหาบ้านทันที
            </p>
          </div>

          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">

              <div>
                <label className="block text-[#3D312E] font-bold text-[15px] mb-3">ชนิดสัตว์</label>
                <div className="grid grid-cols-3 gap-3">
                  {SPECIES_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setAnimalType(opt.value)}
                      className={`flex items-center justify-center gap-2 py-3.5 px-2 rounded-2xl border-2 transition-all font-bold text-sm ${animalType === opt.value
                        ? 'border-orange-300 bg-orange-50 text-orange-600'
                        : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
                        }`}
                    >
                      {opt.icon} {opt.label}
                    </button>
                  ))}
                </div>

                {animalType === 'OTHER' && (
                  <div className="mt-4 p-4 rounded-2xl bg-[#FFFBF9] border border-orange-100">
                    <label className="block text-[#3D312E] font-bold text-sm mb-2">
                      ระบุชนิดสัตว์ <span className="text-gray-400 font-medium">(ถ้าไม่แน่ใจ เว้นว่างได้)</span>
                    </label>
                    <input
                      type="text"
                      value={otherKind}
                      onChange={(e) => setOtherKind(e.target.value)}
                      maxLength={60}
                      placeholder="เช่น กระต่าย, เต่าซูคาต้า, นกแก้ว, งูหลาม"
                      className="w-full border border-gray-200 bg-white rounded-xl px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all text-sm font-medium text-gray-700 placeholder-gray-300"
                    />
                    <div className="flex flex-wrap gap-2 mt-3">
                      {EXOTIC_SUGGESTIONS.map((kind) => (
                        <button
                          key={kind}
                          type="button"
                          onClick={() => setOtherKind(kind)}
                          className={`px-3 py-1 rounded-full text-xs font-bold border transition ${otherKind === kind
                            ? 'bg-orange-500 text-white border-orange-500'
                            : 'bg-white text-gray-500 border-gray-200 hover:border-orange-300 hover:text-orange-500'
                            }`}
                        >
                          {kind}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-[#3D312E] font-bold text-[15px]">รูปภาพน้อง</label>
                  <span className="text-xs font-bold text-gray-400">{images.length}/{MAX_IMAGES} รูป</span>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleSelectFiles(e.target.files)}
                />

                {images.length === 0 ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleSelectFiles(e.dataTransfer.files);
                    }}
                    className="border-2 border-dashed border-orange-200 bg-[#FFFBF9] rounded-2xl h-48 flex flex-col items-center justify-center cursor-pointer hover:bg-orange-50/50 transition-colors"
                  >
                    <div className="bg-white p-3 rounded-xl shadow-sm text-orange-500 mb-3 border border-orange-100">
                      <ImagePlus size={24} />
                    </div>
                    <span className="font-bold text-[#3D312E] mb-1">แตะเพื่ออัปโหลดรูปน้อง</span>
                    <span className="text-gray-400 text-xs font-medium">รูปที่ชัดช่วยให้ทีมงานประเมินอาการได้เร็วขึ้น (สูงสุด 3 รูป)</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {images.map((src, idx) => (
                      <div key={idx} className="relative h-36 rounded-2xl overflow-hidden border border-gray-200 group bg-gray-50">
                        <img src={src} alt={`รูปที่ ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 hover:bg-red-500 text-white flex items-center justify-center transition"
                          aria-label="ลบรูป"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    {images.length < MAX_IMAGES && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="h-36 rounded-2xl border-2 border-dashed border-orange-200 bg-[#FFFBF9] hover:bg-orange-50/60 flex flex-col items-center justify-center text-orange-500 font-bold text-xs gap-1.5 transition"
                      >
                        <ImagePlus size={22} />
                        เพิ่มรูป
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-[1fr_200px] gap-4 items-end">
                <div>
                  <label className="block text-[#3D312E] font-bold text-[15px] mb-3">พิกัด / จุดที่พบ</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="เช่น หน้าเซเว่น ซอยลาดพร้าว 71"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all text-sm font-medium text-gray-700 placeholder-gray-300"
                    />
                    <button
                      type="button"
                      onClick={handleLocate}
                      disabled={locating}
                      title="ดึงพิกัดปัจจุบัน"
                      className="bg-orange-100 text-orange-600 p-3 rounded-xl hover:bg-orange-200 transition-colors shrink-0 disabled:opacity-50"
                    >
                      {locating ? <Loader2 size={20} className="animate-spin" /> : <LocateFixed size={20} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-[#3D312E] font-bold text-[15px] mb-3">จังหวัด</label>
                  <div className="relative">
                    <select
                      value={province}
                      onChange={(e) => setProvince(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl pl-4 pr-9 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all text-sm font-medium text-gray-700 appearance-none bg-white cursor-pointer"
                    >
                      {provinces.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[#3D312E] font-bold text-[15px] mb-3">อาการที่พบ</label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="เช่น ขาเจ็บ ผอม มีแผล ดูหิวน้ำ"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all text-sm font-medium text-gray-700 placeholder-gray-300 resize-none"
                ></textarea>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#3D312E] font-bold text-[15px] mb-3">ชื่อผู้แจ้ง</label>
                  <input
                    type="text"
                    value={reporterName}
                    onChange={(e) => setReporterName(e.target.value)}
                    placeholder="ชื่อ-นามสกุล หรือชื่อเล่น"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all text-sm font-medium text-gray-700 placeholder-gray-300"
                  />
                </div>
                <div>
                  <label className="block text-[#3D312E] font-bold text-[15px] mb-3">เบอร์ติดต่อ</label>
                  <input
                    type="tel"
                    value={reporterPhone}
                    onChange={(e) => setReporterPhone(e.target.value)}
                    placeholder="08X-XXX-XXXX"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all text-sm font-medium text-gray-700 placeholder-gray-300"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 text-sm font-bold px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}

              {justSubmitted && (
                <div className="bg-green-50 border border-green-100 text-green-700 text-sm font-bold px-4 py-3 rounded-xl flex items-center gap-2">
                  <CheckCircle2 size={18} className="shrink-0" />
                  ส่งเรื่องแจ้งเหตุเรียบร้อยแล้ว! เคสของคุณปรากฏในรายการทางด้านขวา
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#F37021] hover:bg-[#E06015] disabled:bg-orange-300 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all mt-1 cursor-pointer"
              >
                {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                ส่งเรื่องแจ้งเหตุ
              </button>
            </form>
          </div>
        </div>

        <div className="lg:pt-[4.5rem]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[1.35rem] font-black text-[#3D312E]">เคสที่แจ้งเข้ามา</h2>
            {reports.length > 0 && (
              <span className="text-xs font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
                {reports.length} เคส
              </span>
            )}
          </div>

          {reports.length === 0 ? (
            <div className="bg-white p-10 rounded-3xl border border-dashed border-gray-200 text-center flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-400 flex items-center justify-center mb-3">
                <Inbox size={26} />
              </div>
              <p className="font-bold text-[#3D312E] text-sm mb-1">ยังไม่มีเคสที่แจ้งเข้ามา</p>
              <p className="text-xs text-gray-400 font-medium max-w-[240px]">
                เมื่อคุณกรอกฟอร์มและกดส่งเรื่องแจ้งเหตุ รายการเคสและรูปที่อัปโหลดจะแสดงตรงนี้ทันที
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {reports.map((r) => (
                <div
                  key={r.id}
                  className="bg-white p-5 rounded-3xl border border-gray-100 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] flex gap-4 items-start group"
                >
                  {r.images[0] ? (
                    <img
                      src={r.images[0]}
                      alt={r.description}
                      className="w-[4.75rem] h-[4.75rem] rounded-2xl object-cover shrink-0 border border-gray-100"
                    />
                  ) : (
                    <div className="w-[4.75rem] h-[4.75rem] bg-[#F7F5F4] rounded-2xl flex items-center justify-center text-[#A69B97] shrink-0">
                      {speciesIcon(r.species)}
                    </div>
                  )}

                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                      <span className="inline-flex items-center gap-1 bg-[#FFF5D1] text-[#9A7D0A] text-[10px] font-bold px-2 py-0.5 rounded">
                        <Clock size={10} /> กำลังรอแอดมินตรวจสอบ
                      </span>
                      <span className="text-[10px] font-bold bg-orange-50 text-orange-600 px-2 py-0.5 rounded">
                        {speciesBadge(r)}
                      </span>
                    </div>

                    <h3 className="font-extrabold text-[#3D312E] text-sm mb-1 leading-snug break-words">
                      {r.description}
                    </h3>

                    <div className="flex items-center gap-1 text-[11px] text-gray-400 font-medium mb-0.5">
                      <MapPin size={12} className="shrink-0" />
                      <span className="truncate">
                        {r.location}{r.province ? `, ${r.province}` : ''}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-gray-400 font-medium">
                      <Clock size={12} className="shrink-0" />
                      <span>
                        {formatThaiDate(r.createdAt)} · โดย {r.reporterName}
                        {r.reporterPhone ? ` (${r.reporterPhone})` : ''}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteReport(r.id)}
                    title="ยกเลิกการแจ้งเคสนี้"
                    className="text-gray-300 hover:text-red-500 p-1.5 rounded-lg transition shrink-0"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
