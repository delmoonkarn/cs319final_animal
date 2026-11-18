import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  PawPrint, Megaphone, ClipboardCheck, Plus, Pencil, Trash2, Heart, AlertTriangle, Home,
  Dog, Cat, Rabbit, CheckCircle2, XCircle, MapPin, X, ImagePlus, HandCoins, Loader2,
  ChevronLeft, ChevronRight, ExternalLink,
} from 'lucide-react';
import { api } from '../api';
import { useAuthStore } from '../store/useAuthStore';
import { resetLocalAdminData } from '../lib/local-animals';
import { AdminDetailModal, ReviewBadge, type AdminDetail } from '../components/AdminDetailModal';
import {
  HOUSING_LABELS,
  authHeaders,
  errorMessage,
  formatAge,
  formatDate,
  isUnauthorized,
  refreshAfterAdminChange,
  uploadImages,
  useAdminStats,
  type AdminDonation,
  type AdminReport,
  type AdminRequest,
  type AnimalDetail,
  type AnimalRow,
  type AnimalStatus,
  type Gender,
  type ImageDto,
  type Paginated,
  type Species,
} from '../lib/admin-api';

const FALLBACK_PROVINCES = [
  'กรุงเทพมหานคร', 'นนทบุรี', 'ปทุมธานี', 'สมุทรปราการ', 'สมุทรสาคร', 'นครปฐม',
  'เชียงใหม่', 'เชียงราย', 'ขอนแก่น', 'นครราชสีมา', 'อุบลราชธานี', 'ชลบุรี', 'ระยอง', 'ภูเก็ต', 'สงขลา',
];

const PLACEHOLDER_IMG = 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=200';
const PAGE_SIZE = 20;
const MAX_IMAGES = 5;
const MAX_TAGS = 8;
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

type Tab = 'pets' | 'reports' | 'requests' | 'donations';
type Filters = {
  pets: 'AVAILABLE' | 'ADOPTED' | 'ALL';
  reports: 'PENDING' | 'ALL';
  requests: 'PENDING' | 'ALL';
  donations: 'PENDING' | 'ALL';
};

const SECTION_TITLES: Record<Tab, string> = {
  pets: 'ข้อมูลสัตว์',
  reports: 'เคสแจ้งเหตุ',
  requests: 'คำขอรับเลี้ยง',
  donations: 'รายการบริจาค',
};
const FILTER_OPTIONS: { [K in Tab]: [Filters[K], string][] } = {
  pets: [['AVAILABLE', 'รอหาบ้าน'], ['ADOPTED', 'ได้บ้านแล้ว'], ['ALL', 'ทั้งหมด']],
  reports: [['PENDING', 'รอตรวจสอบ'], ['ALL', 'ทั้งหมด']],
  requests: [['PENDING', 'รออนุมัติ'], ['ALL', 'ทั้งหมด']],
  donations: [['PENDING', 'รอตรวจสอบ'], ['ALL', 'ทั้งหมด']],
};

/** Table rows open their detail when clicked. */
const rowClass = 'hover:bg-[#FFF4EA] cursor-pointer transition-colors focus:outline-none focus-visible:bg-[#FFF4EA]';

/** Key of the busy spinner for a detail panel item. */
function detailKey(detail: AdminDetail): string {
  switch (detail.kind) {
    case 'animal': return `animal-${detail.id}`;
    case 'report': return `report-${detail.report.id}`;
    case 'request': return `request-${detail.request.id}`;
    case 'donation': return `donation-${detail.donation.id}`;
  }
}

/** Props that make a table row open its detail when clicked (buttons/links inside keep their own action). */
function rowProps(open: () => void) {
  return {
    onClick: (e: React.MouseEvent<HTMLTableRowElement>) => {
      if ((e.target as HTMLElement).closest('a, button, input, select, textarea, label')) return;
      if (window.getSelection()?.toString()) return; // selecting text (e.g. a phone number)
      open();
    },
    onKeyDown: (e: React.KeyboardEvent<HTMLTableRowElement>) => {
      if (e.key === 'Enter' && e.target === e.currentTarget) open();
    },
    tabIndex: 0,
    title: 'คลิกเพื่อดูรายละเอียด',
  };
}

type PetFormState = {
  name: string;
  species: Species;
  breed: string;
  gender: Gender;
  ageMonths: number;
  province: string;
  locationFound: string;
  isVaccinated: boolean;
  isSterilized: boolean;
  isUrgent: boolean;
  status: AnimalStatus;
  healthNote: string;
  description: string;
  personalityText: string;
  /** All photos in order; the first is the cover */
  images: ImageDto[];
};

/** What the animal modal is doing: adding, editing, or approving a report (creates the animal). */
type ModalState = { mode: 'create' } | { mode: 'edit'; animalId: number } | { mode: 'approve'; report: AdminReport };

const EMPTY_FORM: PetFormState = {
  name: '',
  species: 'DOG',
  breed: 'ไทยพันทาง',
  gender: 'MALE',
  ageMonths: 6,
  province: 'กรุงเทพมหานคร',
  locationFound: '',
  isVaccinated: false,
  isSterilized: false,
  isUrgent: false,
  status: 'AVAILABLE',
  healthNote: 'ตรวจสุขภาพเบื้องต้นแล้ว',
  description: '',
  personalityText: 'ร่าเริง, ขี้อ้อน',
  images: [],
};

/** A report → the animal form, pre-filled. The reporter's contact (added by the report page) stays private. */
function formFromReport(report: AdminReport, provinces: string[]): PetFormState {
  const location = report.location.trim();
  const province = provinces.find((p) => location.endsWith(p));
  return {
    ...EMPTY_FORM,
    name: '',
    species: report.species,
    breed: report.breed || (report.species === 'CAT' ? 'แมวไทยพันทาง' : 'ไทยพันทาง'),
    province: province ?? 'กรุงเทพมหานคร',
    locationFound: province ? location.slice(0, -province.length).replace(/[,\s]+$/, '') || location : location,
    description: report.description.replace(/\s*\(ผู้แจ้ง:[^)]*\)\s*$/, ''),
    healthNote: 'รอสัตวแพทย์ตรวจสุขภาพ',
    personalityText: 'รอประเมินนิสัย',
    isUrgent: true,
    images: report.images.slice(0, MAX_IMAGES),
  };
}

function Pager({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (page: number) => void }) {
  if (totalPages <= 1) return null;
  const btn = 'p-2 rounded-full border border-gray-200 bg-white hover:border-orange-400 disabled:opacity-40 transition cursor-pointer disabled:cursor-default';
  return (
    <div className="flex items-center justify-center gap-3 text-xs font-bold text-gray-500 py-4">
      <button type="button" className={btn} disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="หน้าก่อนหน้า">
        <ChevronLeft size={16} />
      </button>
      หน้า {page} / {totalPages}
      <button type="button" className={btn} disabled={page >= totalPages} onClick={() => onChange(page + 1)} aria-label="หน้าถัดไป">
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

export function AdminPage() {
  const { user, logout } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [tab, setTab] = useState<Tab>('pets');
  const [pages, setPages] = useState<Record<Tab, number>>({ pets: 1, reports: 1, requests: 1, donations: 1 });
  const setPage = (page: number) => setPages((p) => ({ ...p, [tab]: page }));
  // Status filter of each section (the stat cards set it; chips above the table change it).
  const [filters, setFilters] = useState<Filters>({ pets: 'AVAILABLE', reports: 'PENDING', requests: 'PENDING', donations: 'PENDING' });
  const openSection = <K extends Tab>(section: K, filter: Filters[K]) => {
    setTab(section);
    setFilters((f) => ({ ...f, [section]: filter }));
    setPages((p) => ({ ...p, [section]: 1 }));
  };
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  /** The detail panel opened by clicking a table row */
  const [detail, setDetail] = useState<AdminDetail | null>(null);
  const closeDetail = useCallback(() => setDetail(null), []);

  const [modal, setModal] = useState<ModalState | null>(null);
  const [form, setForm] = useState<PetFormState>(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Old admin changes kept in this browser (before everything went through the API) would
  // still hide or alter animals on the home page — clear them once.
  useEffect(() => {
    resetLocalAdminData();
  }, []);

  // ─────────────── Data (all from the API) ───────────────
  const stats = useAdminStats(isAdmin);
  const list = <T,>(path: string, page: number, status: string) => async () =>
    (await api.get<Paginated<T>>(path, {
      params: { page, pageSize: PAGE_SIZE, status: status === 'ALL' ? undefined : status },
      headers: authHeaders(),
    })).data;

  const animalsQ = useQuery({
    queryKey: ['admin', 'animals', pages.pets, filters.pets],
    queryFn: list<AnimalRow>('/animals', pages.pets, filters.pets),
    enabled: isAdmin && tab === 'pets',
    placeholderData: keepPreviousData,
    retry: false,
  });
  const reportsQ = useQuery({
    queryKey: ['admin', 'reports', pages.reports, filters.reports],
    queryFn: list<AdminReport>('/reports', pages.reports, filters.reports),
    enabled: isAdmin && tab === 'reports',
    placeholderData: keepPreviousData,
    retry: false,
  });
  const requestsQ = useQuery({
    queryKey: ['admin', 'requests', pages.requests, filters.requests],
    queryFn: list<AdminRequest>('/adoption-requests', pages.requests, filters.requests),
    enabled: isAdmin && tab === 'requests',
    placeholderData: keepPreviousData,
    retry: false,
  });
  const donationsQ = useQuery({
    queryKey: ['admin', 'donations', pages.donations, filters.donations],
    queryFn: list<AdminDonation>('/donations', pages.donations, filters.donations),
    enabled: isAdmin && tab === 'donations',
    placeholderData: keepPreviousData,
    retry: false,
  });
  const { data: provinces = FALLBACK_PROVINCES } = useQuery<string[]>({
    queryKey: ['provinces'],
    queryFn: async () => {
      const res = await api.get('/provinces');
      return Array.isArray(res.data) && res.data.length > 0 ? res.data : FALLBACK_PROVINCES;
    },
    staleTime: Infinity,
  });

  // Expired login on any admin request → log in again.
  const sessionExpired = [stats, animalsQ, reportsQ, requestsQ, donationsQ].some((q) => isUnauthorized(q.error));
  useEffect(() => {
    if (sessionExpired) {
      logout();
      navigate('/login', { replace: true });
    }
  }, [sessionExpired, logout, navigate]);

  if (!user || !isAdmin) {
    return <Navigate to="/login" replace />;
  }

  // ─────────────── Actions ───────────────

  /**
   * Runs an API call for a row (or the open detail panel): spinner on that item, then a message,
   * then refreshes. On success the detail panel closes, since its data has changed.
   */
  const runAction = async (key: string, action: () => Promise<unknown>, success: string) => {
    setBusyKey(key);
    setNotice(null);
    try {
      await action();
      await refreshAfterAdminChange(queryClient);
      setDetail(null);
      setNotice({ type: 'success', text: success });
    } catch (error) {
      if (isUnauthorized(error)) {
        logout();
        navigate('/login', { replace: true });
        return;
      }
      setNotice({ type: 'error', text: errorMessage(error) });
    } finally {
      setBusyKey(null);
    }
  };

  const openCreateModal = () => {
    setModal({ mode: 'create' });
    setForm(EMPTY_FORM);
    setFormError('');
  };

  const openEditModal = async (pet: { id: number }) => {
    setDetail(null);
    setFormError('');
    setBusyKey(`animal-${pet.id}`);
    try {
      const { data } = await api.get<AnimalDetail>(`/animals/${pet.id}`);
      setForm({
        name: data.name,
        species: data.species,
        breed: data.breed,
        gender: data.gender,
        ageMonths: data.ageMonths,
        province: data.province,
        locationFound: data.locationFound,
        isVaccinated: data.isVaccinated,
        isSterilized: data.isSterilized,
        isUrgent: data.isUrgent,
        status: data.status,
        healthNote: data.healthNote,
        description: data.description,
        personalityText: data.personality.join(', '),
        images: data.images,
      });
      setModal({ mode: 'edit', animalId: pet.id });
    } catch (error) {
      setNotice({ type: 'error', text: errorMessage(error, 'โหลดข้อมูลน้องไม่สำเร็จ') });
    } finally {
      setBusyKey(null);
    }
  };

  const openApproveModal = (report: AdminReport) => {
    setDetail(null);
    setForm(formFromReport(report, provinces));
    setFormError('');
    setModal({ mode: 'approve', report });
  };

  /** Upload a photo through the API; it replaces the cover (other photos stay). */
  const handleUploadModalImage = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (!IMAGE_TYPES.includes(file.type)) return setFormError('รองรับเฉพาะไฟล์ JPG, PNG หรือ WEBP');
    if (file.size > 5 * 1024 * 1024) return setFormError('รูปต้องมีขนาดไม่เกิน 5 MB');
    setUploading(true);
    setFormError('');
    try {
      const [uploaded] = await uploadImages([file]);
      setForm((prev) => ({ ...prev, images: [uploaded, ...prev.images.slice(1)] }));
    } catch (error) {
      setFormError(errorMessage(error, 'อัปโหลดรูปไม่สำเร็จ'));
    } finally {
      setUploading(false);
    }
  };

  /** Pasting a link sets the cover photo (empty = remove the cover). */
  const setCoverUrl = (url: string) =>
    setForm((prev) => {
      const rest = prev.images.slice(1);
      return { ...prev, images: url.trim() ? [{ url: url.trim(), thumbUrl: url.trim() }, ...rest] : rest };
    });

  const handleSaveAnimal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modal) return;
    if (!form.name.trim()) return setFormError('กรุณากรอกชื่อน้อง');
    if (!form.breed.trim()) return setFormError('กรุณากรอกสายพันธุ์');
    if (!form.locationFound.trim()) return setFormError('กรุณากรอกจุดที่พบ / พื้นที่');
    if (form.images.length === 0) return setFormError('กรุณาเพิ่มรูปภาพน้องอย่างน้อย 1 รูป');

    const personality = [...new Set(form.personalityText.split(',').map((t) => t.trim()).filter(Boolean))]
      .map((t) => t.slice(0, 40))
      .slice(0, MAX_TAGS);
    if (personality.length === 0) return setFormError('กรุณากรอกนิสัยอย่างน้อย 1 อย่าง');

    const animal = {
      name: form.name.trim(),
      breed: form.breed.trim(),
      gender: form.gender,
      ageMonths: Math.max(0, Math.round(Number(form.ageMonths) || 0)),
      province: form.province,
      locationFound: form.locationFound.trim(),
      isVaccinated: form.isVaccinated,
      isSterilized: form.isSterilized,
      isUrgent: form.status === 'ADOPTED' ? false : form.isUrgent,
      healthNote: form.healthNote.trim() || 'ตรวจสุขภาพเบื้องต้นแล้ว',
      description:
        form.description.trim() || `${form.name.trim()} ถูกพบที่ ${form.locationFound.trim()} กำลังมองหาบ้านที่อบอุ่น`,
      personality,
      imageUrls: form.images.map((image) => image.url).slice(0, MAX_IMAGES),
    };

    setSaving(true);
    setFormError('');
    try {
      let success: string;
      if (modal.mode === 'create') {
        await api.post('/animals', { ...animal, species: form.species, status: form.status }, { headers: authHeaders() });
        success = `เพิ่มน้อง${animal.name}เข้าระบบแล้ว`;
      } else if (modal.mode === 'edit') {
        await api.patch(`/animals/${modal.animalId}`, { ...animal, species: form.species, status: form.status }, { headers: authHeaders() });
        success = `บันทึกข้อมูลน้อง${animal.name}แล้ว`;
      } else {
        // Creates the animal from the report and marks the report approved, in one request.
        await api.patch(`/reports/${modal.report.id}`, { status: 'APPROVED', animal }, { headers: authHeaders() });
        success = `อนุมัติแล้ว: น้อง${animal.name}ขึ้นเว็บเพื่อหาบ้านแล้ว`;
      }
      await refreshAfterAdminChange(queryClient);
      setModal(null);
      setNotice({ type: 'success', text: success });
    } catch (error) {
      if (isUnauthorized(error)) {
        logout();
        navigate('/login', { replace: true });
        return;
      }
      setFormError(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAnimal = (pet: { id: number; name: string }) => {
    if (!window.confirm(`ลบข้อมูลน้อง${pet.name}?\nรูปภาพ คำขอรับเลี้ยง และรายการโปรดของน้องจะถูกลบด้วย ลบแล้วกู้คืนไม่ได้`)) return;
    void runAction(`animal-${pet.id}`, () => api.delete(`/animals/${pet.id}`, { headers: authHeaders() }), `ลบข้อมูลน้อง${pet.name}แล้ว`);
  };

  const handleRejectReport = (report: AdminReport) => {
    if (!window.confirm('ปฏิเสธเคสนี้? เคสจะไม่ขึ้นเว็บ และรูปภาพที่แนบมาจะถูกลบ')) return;
    void runAction(
      `report-${report.id}`,
      () => api.patch(`/reports/${report.id}`, { status: 'REJECTED' }, { headers: authHeaders() }),
      'ปฏิเสธเคสแล้ว',
    );
  };

  const handleReviewRequest = (req: AdminRequest, status: 'APPROVED' | 'REJECTED') => {
    const question =
      status === 'APPROVED'
        ? `อนุมัติให้ ${req.user.name} รับเลี้ยงน้อง${req.animal.name}?\nน้องจะเป็น "ได้บ้านแล้ว" ทันที และคำขออื่นที่รออยู่ของน้องตัวนี้จะถูกปฏิเสธอัตโนมัติ`
        : `ปฏิเสธคำขอของ ${req.user.name}?`;
    if (!window.confirm(question)) return;
    void runAction(
      `request-${req.id}`,
      () => api.patch(`/adoption-requests/${req.id}`, { status }, { headers: authHeaders() }),
      status === 'APPROVED' ? `อนุมัติแล้ว: ${req.user.name} ได้รับเลี้ยงน้อง${req.animal.name}` : 'ปฏิเสธคำขอแล้ว',
    );
  };

  const handleConfirmDonation = (donation: AdminDonation) =>
    void runAction(
      `donation-${donation.id}`,
      () => api.patch(`/donations/${donation.id}`, { status: 'CONFIRMED' }, { headers: authHeaders() }),
      `ยืนยันสลิปของ ${donation.user.name} แล้ว (${donation.total.toLocaleString()} บาท)`,
    );

  const handleDeleteDonation = (donation: AdminDonation) => {
    if (!window.confirm(`ลบรายการบริจาคของ ${donation.user.name} (${donation.total.toLocaleString()} บาท)?\nใช้สำหรับสลิปปลอม · ลบแล้วกู้คืนไม่ได้`)) return;
    void runAction(
      `donation-${donation.id}`,
      () => api.delete(`/donations/${donation.id}`, { headers: authHeaders() }),
      'ลบรายการบริจาคแล้ว',
    );
  };

  const speciesIcon = (species: string) =>
    species === 'DOG' ? <Dog size={18} /> : species === 'CAT' ? <Cat size={18} /> : <Rabbit size={18} />;

  const s = stats.data;
  const animals = animalsQ.data?.data ?? [];
  const reports = reportsQ.data?.data ?? [];
  const requests = requestsQ.data?.data ?? [];
  const donations = donationsQ.data?.data ?? [];
  const activeQuery = { pets: animalsQ, reports: reportsQ, requests: requestsQ, donations: donationsQ }[tab];

  /** The stat cards are the main navigation: each opens its section (and filter). */
  const cards = [
    { key: 'available', value: s?.available, label: 'รอหาบ้าน', icon: <Heart size={16} />, active: tab === 'pets' && filters.pets === 'AVAILABLE', open: () => openSection('pets', 'AVAILABLE') },
    { key: 'adopted', value: s?.adopted, label: 'ได้บ้านแล้ว', icon: <Home size={16} />, active: tab === 'pets' && filters.pets === 'ADOPTED', open: () => openSection('pets', 'ADOPTED') },
    { key: 'reports', value: s?.pendingReports, label: 'เคสรอตรวจสอบ', icon: <Megaphone size={16} />, active: tab === 'reports', open: () => openSection('reports', 'PENDING'), queue: true },
    { key: 'requests', value: s?.pendingRequests, label: 'คำขอรออนุมัติ', icon: <ClipboardCheck size={16} />, active: tab === 'requests', open: () => openSection('requests', 'PENDING'), queue: true },
    { key: 'donations', value: s?.pendingDonations, label: 'สลิปรอตรวจสอบ', icon: <HandCoins size={16} />, active: tab === 'donations', open: () => openSection('donations', 'PENDING'), queue: true },
  ];

  /** Status chips for the open section (e.g. รอตรวจสอบ / ทั้งหมด). */
  const filterChips = (FILTER_OPTIONS[tab] as [string, string][]).map(([value, label]) => {
    const active = filters[tab] === value;
    return (
      <button
        key={value}
        type="button"
        aria-pressed={active}
        onClick={() => {
          setFilters((f) => ({ ...f, [tab]: value }));
          setPages((p) => ({ ...p, [tab]: 1 }));
        }}
        className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition cursor-pointer ${active ? 'bg-[#2B211E] text-white' : 'bg-white border border-gray-200 text-gray-500 hover:border-[#F37021] hover:text-[#F37021]'
          }`}
      >
        {label}
      </button>
    );
  });
  const emptyText = filters[tab] === 'ALL' ? 'ยังไม่มีรายการ' : 'ไม่มีรายการในหมวดนี้';

  const tableState = (empty: string, count: number) => {
    if (activeQuery.isLoading) {
      return <div className="p-14 flex justify-center text-orange-500"><Loader2 size={26} className="animate-spin" /></div>;
    }
    if (activeQuery.isError) {
      return <div className="p-14 text-center text-red-500 font-bold text-sm">{errorMessage(activeQuery.error, 'โหลดข้อมูลไม่สำเร็จ')}</div>;
    }
    if (count === 0) {
      return <div className="p-14 text-center text-gray-400 font-bold text-sm">{empty}</div>;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-[#FFFBF7] font-sans flex flex-col">
      <div className="max-w-[1140px] w-full mx-auto px-6 pt-10 pb-20 flex-1">

        <div className="mb-8">
          <span className="text-xs font-extrabold text-[#F37021] tracking-wide">Admin View</span>
          <h1 className="text-3xl md:text-[2.2rem] font-black text-[#2B211E] mt-0.5">แผงควบคุมแอดมิน</h1>
        </div>

        <nav className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8" aria-label="เมนูแอดมิน">
          {cards.map((card) => (
            <button
              key={card.key}
              type="button"
              onClick={card.open}
              aria-pressed={card.active}
              className={`relative text-left rounded-3xl p-6 border shadow-xs transition cursor-pointer ${card.active
                ? 'bg-[#FFF4EA] border-[#F37021] ring-2 ring-orange-100'
                : 'bg-white border-gray-100 hover:border-orange-200 hover:-translate-y-0.5'
                }`}
            >
              <span className={`absolute top-5 right-5 ${card.active ? 'text-[#F37021]' : 'text-gray-300'}`}>{card.icon}</span>
              <div className={`text-3xl font-black ${card.active ? 'text-[#F37021]' : 'text-[#2B211E]'}`}>{card.value ?? '–'}</div>
              <div className="text-xs font-bold text-gray-400 mt-1 flex items-center gap-1.5">
                {card.label}
                {card.queue && (card.value ?? 0) > 0 && <span className="w-2 h-2 rounded-full bg-red-500" aria-label="มีรายการรอดำเนินการ" />}
              </div>
            </button>
          ))}
        </nav>

        {notice && (
          <div
            role={notice.type === 'error' ? 'alert' : 'status'}
            className={`flex items-start justify-between gap-3 rounded-2xl px-5 py-3.5 mb-6 text-sm font-bold ${notice.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'
              }`}
          >
            <span>{notice.text}</span>
            <button type="button" onClick={() => setNotice(null)} aria-label="ปิดข้อความ" className="shrink-0 opacity-60 hover:opacity-100 cursor-pointer">
              <X size={16} />
            </button>
          </div>
        )}

        {/* Section title + status chips (+ add button for animals) */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="flex items-center gap-2 text-lg font-black text-[#2B211E]">
              {{ pets: <PawPrint size={18} />, reports: <Megaphone size={18} />, requests: <ClipboardCheck size={18} />, donations: <HandCoins size={18} /> }[tab]}
              {SECTION_TITLES[tab]}
            </h2>
            <div className="flex flex-wrap gap-1.5">{filterChips}</div>
          </div>
          {tab === 'pets' && (
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 bg-[#F37021] hover:bg-[#E06015] text-white text-xs font-extrabold px-5 py-3 rounded-full shadow-sm transition cursor-pointer"
            >
              <Plus size={16} /> เพิ่มน้องตัวใหม่
            </button>
          )}
        </div>

        {/* ================= Animals ================= */}
        {tab === 'pets' && (
          <div>
            <div className="bg-white rounded-[1.75rem] border border-gray-100 shadow-xs overflow-hidden">
              {tableState(filters.pets === 'ALL' ? 'ยังไม่มีข้อมูลสัตว์ในระบบ' : emptyText, animals.length) ?? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#FFF4EA] text-[#7A6A63] text-xs font-extrabold">
                        <th className="py-3.5 pl-6 pr-4">น้อง</th>
                        <th className="py-3.5 px-4 text-center">ชนิด</th>
                        <th className="py-3.5 px-4">พื้นที่</th>
                        <th className="py-3.5 px-4 text-center">วัคซีน</th>
                        <th className="py-3.5 px-4">สถานะ</th>
                        <th className="py-3.5 pl-4 pr-6 text-right">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y divide-gray-100 text-sm ${animalsQ.isPlaceholderData ? 'opacity-60' : ''}`}>
                      {animals.map((pet) => {
                        const isAdopted = pet.status === 'ADOPTED';
                        const isUrgent = pet.isUrgent && !isAdopted;
                        const busy = busyKey === `animal-${pet.id}`;

                        return (
                          <tr key={pet.id} {...rowProps(() => setDetail({ kind: 'animal', id: pet.id }))} className={rowClass}>
                            <td className="py-3.5 pl-6 pr-4">
                              <div className="flex items-center gap-3.5">
                                <img
                                  src={pet.coverImage?.thumbUrl || PLACEHOLDER_IMG}
                                  alt={pet.name}
                                  className="w-11 h-11 rounded-full object-cover border border-gray-200 shrink-0"
                                />
                                <div>
                                  <div className="font-extrabold text-[#2B211E] leading-tight">{pet.name}</div>
                                  <div className="text-xs text-gray-400 font-medium mt-0.5">
                                    {pet.breed || 'พันทาง'} · {formatAge(pet.ageMonths)}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-4 text-center text-gray-600">
                              <div className="inline-flex items-center justify-center">{speciesIcon(pet.species)}</div>
                            </td>

                            <td className="py-3.5 px-4 text-xs font-bold text-gray-600">
                              {pet.province || pet.locationFound}
                            </td>

                            <td className="py-3.5 px-4 text-center text-xs font-bold text-gray-600">
                              {pet.isVaccinated ? <span className="text-green-700">ครบ</span> : '-'}
                            </td>

                            <td className="py-3.5 px-4">
                              {isAdopted ? (
                                <span className="inline-flex items-center gap-1 bg-green-600 text-white text-[11px] font-bold px-3 py-1 rounded-full">
                                  <Home size={11} /> ได้บ้านแล้ว
                                </span>
                              ) : isUrgent ? (
                                <span className="inline-flex items-center gap-1 bg-red-500 text-white text-[11px] font-bold px-3 py-1 rounded-full">
                                  <AlertTriangle size={11} /> เคสฉุกเฉิน
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 bg-[#FFF1E4] text-[#D97706] text-[11px] font-bold px-3 py-1 rounded-full">
                                  <Heart size={11} /> รอหาบ้าน
                                </span>
                              )}
                            </td>

                            <td className="py-3.5 pl-4 pr-6 text-right">
                              <div className="inline-flex items-center gap-2">
                                {busy && <Loader2 size={16} className="animate-spin text-orange-500" />}
                                <button
                                  type="button"
                                  onClick={() => openEditModal(pet)}
                                  disabled={busy}
                                  title="แก้ไขข้อมูล / อาการ / สถานะวัคซีน"
                                  aria-label={`แก้ไขข้อมูลน้อง${pet.name}`}
                                  className="p-2 rounded-xl text-gray-500 hover:text-[#F37021] hover:bg-orange-50 transition cursor-pointer disabled:opacity-40"
                                >
                                  <Pencil size={16} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAnimal(pet)}
                                  disabled={busy}
                                  title="ลบรายการ"
                                  aria-label={`ลบข้อมูลน้อง${pet.name}`}
                                  className="p-2 rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer disabled:opacity-40"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <Pager page={pages.pets} totalPages={animalsQ.data?.pagination.totalPages ?? 1} onChange={setPage} />
          </div>
        )}

        {/* ================= Reports ================= */}
        {tab === 'reports' && (
          <div>
            <div className="bg-white rounded-[1.75rem] border border-gray-100 shadow-xs overflow-hidden">
              {tableState(filters.reports === 'ALL' ? 'ยังไม่มีรายการแจ้งพบสัตว์จรจัดจากผู้ใช้' : 'ไม่มีเคสรอตรวจสอบ', reports.length) ?? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#FFF4EA] text-[#7A6A63] text-xs font-extrabold">
                        <th className="py-3.5 pl-6 pr-4">รูป / อาการที่แจ้ง</th>
                        <th className="py-3.5 px-4">ชนิด</th>
                        <th className="py-3.5 px-4">พิกัดที่พบ</th>
                        <th className="py-3.5 px-4">ผู้แจ้ง</th>
                        <th className="py-3.5 px-4">สถานะ</th>
                        <th className="py-3.5 pl-4 pr-6 text-right">การตรวจสอบ</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y divide-gray-100 text-sm ${reportsQ.isPlaceholderData ? 'opacity-60' : ''}`}>
                      {reports.map((r) => (
                        <tr key={r.id} {...rowProps(() => setDetail({ kind: 'report', report: r }))} className={rowClass}>
                          <td className="py-4 pl-6 pr-4">
                            <div className="flex items-center gap-3.5">
                              {r.images[0] ? (
                                <a href={r.images[0].url} target="_blank" rel="noreferrer" title="ดูรูปเต็ม" className="shrink-0">
                                  <img src={r.images[0].thumbUrl} alt="" className="w-12 h-12 rounded-2xl object-cover border border-gray-200" />
                                </a>
                              ) : (
                                <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
                                  {speciesIcon(r.species)}
                                </div>
                              )}
                              <div>
                                <div className="font-bold text-[#2B211E] max-w-[260px]">{r.description}</div>
                                <div className="text-[11px] text-gray-400 font-medium mt-0.5">แจ้งเมื่อ {formatDate(r.createdAt)}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-xs font-bold text-gray-600">
                            {r.species === 'DOG' ? 'หมา' : r.species === 'CAT' ? 'แมว' : r.breed || 'Exotic / อื่นๆ'}
                          </td>
                          <td className="py-4 px-4 text-xs font-medium text-gray-600">
                            <span className="inline-flex items-center gap-1">
                              <MapPin size={13} className="text-gray-400 shrink-0" />
                              {r.location}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-xs font-medium text-gray-600">
                            {r.reporter.name}
                            <div className="text-gray-400">{r.reporter.phone}</div>
                          </td>
                          <td className="py-4 px-4">
                            <ReviewBadge status={r.status} labels={{ PENDING: 'รอตรวจสอบ', APPROVED: 'ขึ้นเว็บแล้ว', REJECTED: 'ปฏิเสธแล้ว' }} />
                            {r.animal && (
                              <Link to={`/pet/${r.animal.id}`} className="flex items-center gap-1 text-[11px] font-bold text-orange-500 hover:underline mt-1.5 whitespace-nowrap">
                                <ExternalLink size={11} /> น้อง{r.animal.name}
                              </Link>
                            )}
                          </td>
                          <td className="py-4 pl-4 pr-6 text-right">
                            {r.status === 'PENDING' ? (
                              <div className="inline-flex items-center gap-2">
                                {busyKey === `report-${r.id}` && <Loader2 size={16} className="animate-spin text-orange-500" />}
                                <button
                                  type="button"
                                  onClick={() => openApproveModal(r)}
                                  disabled={busyKey === `report-${r.id}`}
                                  className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-3.5 py-2 rounded-full transition cursor-pointer whitespace-nowrap disabled:opacity-50"
                                >
                                  <CheckCircle2 size={14} /> อนุมัติให้ขึ้นเว็บ
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRejectReport(r)}
                                  disabled={busyKey === `report-${r.id}`}
                                  className="inline-flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold px-3.5 py-2 rounded-full transition cursor-pointer disabled:opacity-50"
                                >
                                  <XCircle size={14} /> ปฏิเสธ
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400 font-bold">ดำเนินการแล้ว</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <Pager page={pages.reports} totalPages={reportsQ.data?.pagination.totalPages ?? 1} onChange={setPage} />
          </div>
        )}

        {/* ================= Adoption requests ================= */}
        {tab === 'requests' && (
          <div>
            <div className="bg-white rounded-[1.75rem] border border-gray-100 shadow-xs overflow-hidden">
              {tableState(filters.requests === 'ALL' ? 'ยังไม่มีคำขอรับอุปการะที่ส่งเข้ามา' : 'ไม่มีคำขอรออนุมัติ', requests.length) ?? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#FFF4EA] text-[#7A6A63] text-xs font-extrabold">
                        <th className="py-3.5 pl-6 pr-4">น้องที่ขอรับเลี้ยง</th>
                        <th className="py-3.5 px-4">ผู้ยื่นคำขอ</th>
                        <th className="py-3.5 px-4">ที่อยู่อาศัย</th>
                        <th className="py-3.5 px-4">เหตุผล</th>
                        <th className="py-3.5 px-4">สถานะ</th>
                        <th className="py-3.5 pl-4 pr-6 text-right">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y divide-gray-100 text-sm ${requestsQ.isPlaceholderData ? 'opacity-60' : ''}`}>
                      {requests.map((req) => (
                        <tr key={req.id} {...rowProps(() => setDetail({ kind: 'request', request: req }))} className={`${rowClass} align-top`}>
                          <td className="py-4 pl-6 pr-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={req.animal.coverImage?.thumbUrl || PLACEHOLDER_IMG}
                                alt=""
                                className="w-10 h-10 rounded-full object-cover border border-gray-200 shrink-0"
                              />
                              <div>
                                <div className="font-extrabold text-[#2B211E]">น้อง{req.animal.name}</div>
                                <div className="text-[11px] text-gray-400 font-medium">ส่งคำขอ {formatDate(req.createdAt)}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-xs font-bold text-gray-700">
                            {req.user.name}
                            <div className="text-gray-400 font-medium">{req.user.phone}</div>
                            <div className="text-gray-400 font-medium">{req.user.email}</div>
                          </td>
                          <td className="py-4 px-4 text-xs font-medium text-gray-600">
                            {HOUSING_LABELS[req.housingType] || req.housingType}
                          </td>
                          <td className="py-4 px-4 text-xs font-medium text-gray-600 max-w-[280px] whitespace-pre-line">{req.reason}</td>
                          <td className="py-4 px-4">
                            <ReviewBadge status={req.status} labels={{ PENDING: 'รออนุมัติ', APPROVED: 'ผ่าน', REJECTED: 'ไม่ผ่าน' }} />
                          </td>
                          <td className="py-4 pl-4 pr-6 text-right">
                            {req.status === 'PENDING' ? (
                              <div className="inline-flex items-center gap-2">
                                {busyKey === `request-${req.id}` && <Loader2 size={16} className="animate-spin text-orange-500" />}
                                <button
                                  type="button"
                                  onClick={() => handleReviewRequest(req, 'APPROVED')}
                                  disabled={busyKey === `request-${req.id}`}
                                  className="inline-flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-3.5 py-2 rounded-full transition cursor-pointer disabled:opacity-50"
                                >
                                  <CheckCircle2 size={13} /> อนุมัติ
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleReviewRequest(req, 'REJECTED')}
                                  disabled={busyKey === `request-${req.id}`}
                                  className="inline-flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold px-3.5 py-2 rounded-full transition cursor-pointer disabled:opacity-50"
                                >
                                  <XCircle size={13} /> ปฏิเสธ
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400 font-bold">ตรวจสอบแล้ว</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <Pager page={pages.requests} totalPages={requestsQ.data?.pagination.totalPages ?? 1} onChange={setPage} />
          </div>
        )}

        {/* ================= Donations ================= */}
        {tab === 'donations' && (
          <div>
            <div className="bg-white rounded-[1.75rem] border border-gray-100 shadow-xs overflow-hidden">
              {tableState(filters.donations === 'ALL' ? 'ยังไม่มีรายการบริจาค' : 'ไม่มีสลิปรอตรวจสอบ', donations.length) ?? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#FFF4EA] text-[#7A6A63] text-xs font-extrabold">
                        <th className="py-3.5 pl-6 pr-4">สลิป</th>
                        <th className="py-3.5 px-4">ผู้บริจาค</th>
                        <th className="py-3.5 px-4">รายการ</th>
                        <th className="py-3.5 px-4 text-right">ยอดรวม</th>
                        <th className="py-3.5 px-4">สถานะ</th>
                        <th className="py-3.5 pl-4 pr-6 text-right">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y divide-gray-100 text-sm ${donationsQ.isPlaceholderData ? 'opacity-60' : ''}`}>
                      {donations.map((d) => (
                        <tr key={d.id} {...rowProps(() => setDetail({ kind: 'donation', donation: d }))} className={`${rowClass} align-top`}>
                          <td className="py-4 pl-6 pr-4">
                            <a href={d.slip.url} target="_blank" rel="noreferrer" title="เปิดสลิปขนาดเต็ม">
                              <img src={d.slip.thumbUrl} alt="สลิปโอนเงิน" className="w-14 h-20 rounded-xl object-cover border border-gray-200 hover:opacity-80 transition" />
                            </a>
                          </td>
                          <td className="py-4 px-4 text-xs font-bold text-gray-700">
                            {d.user.name}
                            <div className="text-gray-400 font-medium">{d.user.phone}</div>
                            <div className="text-[11px] text-gray-400 font-medium mt-1">{formatDate(d.createdAt)}</div>
                          </td>
                          <td className="py-4 px-4 text-xs font-medium text-gray-600">
                            {d.items.map((item) => (
                              <div key={item.id} className="whitespace-nowrap">
                                {item.package.icon} {item.package.name} × {item.quantity}
                              </div>
                            ))}
                          </td>
                          <td className="py-4 px-4 text-right font-black text-[#2B211E] whitespace-nowrap">
                            {d.total.toLocaleString()} ฿
                          </td>
                          <td className="py-4 px-4">
                            <ReviewBadge status={d.status} labels={{ PENDING: 'รอตรวจสอบ', CONFIRMED: 'ยืนยันแล้ว' }} />
                          </td>
                          <td className="py-4 pl-4 pr-6 text-right">
                            <div className="inline-flex items-center gap-2">
                              {busyKey === `donation-${d.id}` && <Loader2 size={16} className="animate-spin text-orange-500" />}
                              {d.status === 'PENDING' && (
                                <button
                                  type="button"
                                  onClick={() => handleConfirmDonation(d)}
                                  disabled={busyKey === `donation-${d.id}`}
                                  className="inline-flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-3.5 py-2 rounded-full transition cursor-pointer whitespace-nowrap disabled:opacity-50"
                                >
                                  <CheckCircle2 size={13} /> ยืนยันสลิป
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDeleteDonation(d)}
                                disabled={busyKey === `donation-${d.id}`}
                                title="ลบ (สลิปปลอม)"
                                aria-label={`ลบรายการบริจาคของ ${d.user.name}`}
                                className="p-2 rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer disabled:opacity-40"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <Pager page={pages.donations} totalPages={donationsQ.data?.pagination.totalPages ?? 1} onChange={setPage} />
          </div>
        )}
      </div>

      {/* ================= Detail panel (click a row) ================= */}
      {detail && !modal && (
        <AdminDetailModal
          detail={detail}
          busy={busyKey === detailKey(detail)}
          onClose={closeDetail}
          onOpen={setDetail}
          onEditAnimal={openEditModal}
          onDeleteAnimal={handleDeleteAnimal}
          onApproveReport={openApproveModal}
          onRejectReport={handleRejectReport}
          onReviewRequest={handleReviewRequest}
          onConfirmDonation={handleConfirmDonation}
          onDeleteDonation={handleDeleteDonation}
        />
      )}

      {/* ================= Add / edit / approve-report modal ================= */}
      {modal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px] flex items-center justify-center p-4"
          onClick={() => !saving && setModal(null)}
        >
          <div
            className="bg-white rounded-[1.75rem] w-full max-w-[580px] max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setModal(null)}
              disabled={saving}
              aria-label="ปิด"
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-700"
            >
              <X size={20} />
            </button>

            <h2 className="text-xl font-black text-[#2B211E] mb-1">
              {modal.mode === 'create'
                ? 'เพิ่มข้อมูลสัตว์ใหม่'
                : modal.mode === 'edit'
                  ? `แก้ไขข้อมูลน้อง${form.name}`
                  : 'อนุมัติเคสให้ขึ้นเว็บ'}
            </h2>
            <p className="text-xs text-gray-400 font-medium mb-5">
              {modal.mode === 'approve'
                ? 'กรอกข้อมูลน้องให้ครบ ข้อมูลจากเคสใส่ไว้ให้แล้ว · บันทึกแล้วน้องจะขึ้นหน้าเว็บทันที'
                : 'อัปเดตประวัติสุขภาพ สถานะวัคซีน หรือสถานะการหาบ้าน'}
            </p>

            {modal.mode === 'approve' && (
              <div className="bg-[#FFF8F1] border border-orange-100 rounded-2xl p-4 mb-5 text-xs text-gray-600 font-medium">
                <div className="font-extrabold text-[#2B211E] mb-1">เคสที่ผู้ใช้แจ้ง</div>
                {modal.report.description}
                <div className="text-gray-400 mt-1">
                  {modal.report.location} · แจ้งโดย {modal.report.reporter.name} ({modal.report.reporter.phone})
                </div>
              </div>
            )}

            <form onSubmit={handleSaveAnimal} className="space-y-4 text-sm">
              {/* รูปภาพ */}
              <div>
                <label className="block text-xs font-bold text-[#2B211E] mb-1.5">รูปภาพน้อง (รูปปก)</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={IMAGE_TYPES.join(',')}
                  className="hidden"
                  onChange={(e) => handleUploadModalImage(e.target.files)}
                />
                <div className="flex items-center gap-3">
                  {form.images[0] ? (
                    <img src={form.images[0].thumbUrl} alt="" className="w-16 h-16 rounded-2xl object-cover border shrink-0" />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-orange-50 text-orange-400 flex items-center justify-center shrink-0">
                      <ImagePlus size={22} />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-orange-200 bg-orange-50 text-orange-600 text-xs font-bold hover:bg-orange-100 cursor-pointer shrink-0 disabled:opacity-60"
                  >
                    {uploading && <Loader2 size={13} className="animate-spin" />}
                    {uploading ? 'กำลังอัปโหลด...' : 'อัปโหลดรูปภาพ'}
                  </button>
                  <input
                    type="text"
                    value={form.images[0]?.url ?? ''}
                    onChange={(e) => setCoverUrl(e.target.value)}
                    placeholder="หรือวางลิงก์รูปภาพ URL"
                    className="flex-1 min-w-0 border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-orange-400"
                  />
                </div>
                {form.images.length > 1 && (
                  <p className="text-[11px] text-gray-400 font-medium mt-1.5">
                    รูปอื่นของน้องอีก {form.images.length - 1} รูปจะถูกเก็บไว้เหมือนเดิม
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#2B211E] mb-1">ชื่อน้อง</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-orange-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#2B211E] mb-1">สายพันธุ์</label>
                  <input
                    type="text"
                    value={form.breed}
                    onChange={(e) => setForm({ ...form, breed: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-orange-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#2B211E] mb-1">ชนิดสัตว์</label>
                  <select
                    value={form.species}
                    onChange={(e) => setForm({ ...form, species: e.target.value as Species })}
                    disabled={modal.mode === 'approve'}
                    title={modal.mode === 'approve' ? 'ตามที่ผู้แจ้งระบุ' : undefined}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none disabled:bg-gray-50 disabled:text-gray-500"
                  >
                    <option value="DOG">หมา</option>
                    <option value="CAT">แมว</option>
                    <option value="OTHER">อื่นๆ / Exotic</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#2B211E] mb-1">เพศ</label>
                  <select
                    value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value as Gender })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none"
                  >
                    <option value="MALE">ตัวผู้</option>
                    <option value="FEMALE">ตัวเมีย</option>
                    <option value="UNKNOWN">ไม่ทราบ</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#2B211E] mb-1">อายุ (เดือน)</label>
                  <input
                    type="number"
                    min={0}
                    max={360}
                    value={form.ageMonths}
                    onChange={(e) => setForm({ ...form, ageMonths: Number(e.target.value) })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#2B211E] mb-1">จุดที่พบ</label>
                  <input
                    type="text"
                    value={form.locationFound}
                    onChange={(e) => setForm({ ...form, locationFound: e.target.value })}
                    placeholder="เช่น ซอยสุขุมวิท 31"
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#2B211E] mb-1">จังหวัด / พื้นที่</label>
                  <select
                    value={form.province}
                    onChange={(e) => setForm({ ...form, province: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none"
                  >
                    {provinces.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                <label className="flex items-center gap-2 bg-gray-50 px-3 py-2.5 rounded-xl text-xs font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isVaccinated}
                    onChange={(e) => setForm({ ...form, isVaccinated: e.target.checked })}
                  />
                  ฉีดวัคซีนครบ
                </label>
                <label className="flex items-center gap-2 bg-gray-50 px-3 py-2.5 rounded-xl text-xs font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isSterilized}
                    onChange={(e) => setForm({ ...form, isSterilized: e.target.checked })}
                  />
                  ทำหมันแล้ว
                </label>
                <label className="flex items-center gap-2 bg-red-50 text-red-600 px-3 py-2.5 rounded-xl text-xs font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isUrgent}
                    disabled={form.status === 'ADOPTED'}
                    onChange={(e) => setForm({ ...form, isUrgent: e.target.checked })}
                  />
                  เคสฉุกเฉิน
                </label>
                {modal.mode !== 'approve' && (
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as AnimalStatus })}
                    aria-label="สถานะ"
                    className="border border-gray-200 rounded-xl px-2.5 py-2 text-xs font-bold outline-none"
                  >
                    <option value="AVAILABLE">รอหาบ้าน</option>
                    <option value="ADOPTED">ได้บ้านแล้ว</option>
                  </select>
                )}
              </div>
              {modal.mode === 'edit' && form.status === 'ADOPTED' && (
                <p className="text-[11px] text-gray-400 font-medium -mt-2">
                  ตั้งเป็น "ได้บ้านแล้ว" (รับเลี้ยงนอกเว็บ) จะปฏิเสธคำขอรับเลี้ยงที่รออยู่ของน้องตัวนี้ทั้งหมด
                </p>
              )}

              <div>
                <label className="block text-xs font-bold text-[#2B211E] mb-1">
                  ประวัติสุขภาพ / อาการ (1 บรรทัดต่อ 1 รายการ)
                </label>
                <textarea
                  rows={2}
                  value={form.healthNote}
                  onChange={(e) => setForm({ ...form, healthNote: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2B211E] mb-1">เรื่องราวของน้อง</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="พบน้องที่ไหน เป็นอย่างไร ชอบอะไร..."
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2B211E] mb-1">นิสัย (คั่นด้วยเครื่องหมายจุลภาค , สูงสุด 8 อย่าง)</label>
                <input
                  type="text"
                  value={form.personalityText}
                  onChange={(e) => setForm({ ...form, personalityText: e.target.value })}
                  placeholder="เช่น ร่าเริง, ขี้อ้อน"
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm outline-none"
                />
              </div>

              {formError && <p role="alert" className="text-xs font-bold text-red-500">{formError}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  disabled={saving}
                  className="px-5 py-2.5 rounded-full border border-gray-200 text-xs font-bold text-gray-600"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={saving || uploading}
                  className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-[#F37021] hover:bg-[#E06015] text-white text-xs font-bold shadow-sm cursor-pointer disabled:opacity-60"
                >
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  {modal.mode === 'approve' ? 'อนุมัติและลงประกาศ' : 'บันทึกข้อมูล'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <footer className="bg-[#FFF4EA] border-t border-orange-100/60 text-center py-6 text-gray-500 font-medium text-xs">
        PawHome · ชุมชนคนรักสัตว์ ช่วยกันพาน้องกลับบ้าน
      </footer>
    </div>
  );
}
