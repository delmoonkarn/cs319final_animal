import { useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  PawPrint, Megaphone, ClipboardCheck, Plus, Pencil, Trash2, Heart, AlertTriangle, Home,
  Dog, Cat, Rabbit, CheckCircle2, XCircle, Clock, MapPin, X, ImagePlus,
} from 'lucide-react';
import { api } from '../api';
import { useAuthStore } from '../store/useAuthStore';
import {
  loadAllStoredRequests,
  saveAllStoredRequests,
  type StoredAdoptionRequest,
} from '../components/AdoptionModal';
import { loadAllSavedReports, saveAllReports } from './ReportPage';
import {
  addLocalAnimal,
  deleteLocalAnimal,
  mergeAnimalsWithAdminChanges,
  updateLocalAnimal,
} from '../lib/local-animals';

const FALLBACK_PROVINCES = [
  'กรุงเทพมหานคร', 'นนทบุรี', 'ปทุมธานี', 'สมุทรปราการ', 'สมุทรสาคร', 'นครปฐม',
  'เชียงใหม่', 'เชียงราย', 'ขอนแก่น', 'นครราชสีมา', 'อุบลราชธานี', 'ชลบุรี', 'ระยอง', 'ภูเก็ต', 'สงขลา',
];

const HOUSING_LABELS: Record<string, string> = {
  HOUSE: 'บ้านเดี่ยว / ทาวน์เฮาส์',
  CONDO: 'คอนโด (อนุญาตเลี้ยงสัตว์)',
  DORM: 'หอพัก / อพาร์ตเมนต์',
};

function formatAge(months?: number) {
  if (months == null) return '';
  if (months < 12) return `${months} เดือน`;
  const years = Math.floor(months / 12);
  return `${years} ปี`;
}

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

type PetFormState = {
  id?: string;
  name: string;
  species: 'DOG' | 'CAT' | 'OTHER';
  breed: string;
  gender: 'MALE' | 'FEMALE';
  ageMonths: number;
  province: string;
  locationFound: string;
  isVaccinated: boolean;
  isSterilized: boolean;
  isUrgent: boolean;
  status: 'AVAILABLE' | 'ADOPTED';
  healthNote: string;
  description: string;
  personalityText: string;
  imageUrl: string;
};

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
  imageUrl: '',
};

export function AdminPage() {
  const { user, token } = useAuthStore();
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<'pets' | 'reports' | 'requests'>('pets');
  const [version, setVersion] = useState(0);

  const [requests, setRequests] = useState<StoredAdoptionRequest[]>(() => loadAllStoredRequests());
  const [reports, setReports] = useState<any[]>(() => loadAllSavedReports());


  const [modalOpen, setModalOpen] = useState(false);
  const [editingMode, setEditingMode] = useState<'create' | 'edit'>('create');
  const [form, setForm] = useState<PetFormState>(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: apiAnimals = [] } = useQuery({
    queryKey: ['animals', version],
    queryFn: async () => {
      try {
        const res = await api.get('/animals?pageSize=50');
        if (Array.isArray(res.data)) return res.data;
        if (res.data && Array.isArray(res.data.data)) return res.data.data;
        return [];
      } catch {
        return [];
      }
    },
  });

  const { data: provinces = FALLBACK_PROVINCES } = useQuery<string[]>({
    queryKey: ['provinces'],
    queryFn: async () => {
      const res = await api.get('/provinces');
      return Array.isArray(res.data) && res.data.length > 0 ? res.data : FALLBACK_PROVINCES;
    },
  });

  useEffect(() => {
    setRequests(loadAllStoredRequests());
    setReports(loadAllSavedReports());
  }, [tab, version]);

  if (!user || user.role !== 'ADMIN') {
    return <Navigate to="/login" replace />;
  }

  const animals = mergeAnimalsWithAdminChanges(apiAnimals);
  const waitingCount = animals.filter((a) => a.status === 'AVAILABLE').length;
  const adoptedCount = animals.filter((a) => a.status === 'ADOPTED').length;
  const pendingReportsCount = reports.filter((r) => (r.status || 'PENDING') === 'PENDING').length;
  const pendingRequestsCount = requests.filter((r) => r.status === 'PENDING').length;

  const refreshAll = () => {
    setVersion((v) => v + 1);
    queryClient.invalidateQueries({ queryKey: ['animals'] });
  };

  const openCreateModal = () => {
    setEditingMode('create');
    setForm(EMPTY_FORM);
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = async (pet: any) => {
    setEditingMode('edit');
    setFormError('');
    const petId = String(pet.id ?? pet.key);
    let fullPet = pet;
    if (!petId.startsWith('local-')) {
      try {
        const res = await api.get(`/animals/${petId}`);
        fullPet = { ...(res.data?.data || res.data), ...pet };
      } catch {
      }
    }
    setForm({
      id: petId,
      name: fullPet.name || '',
      species: fullPet.species || 'DOG',
      breed: fullPet.breed || 'ไทยพันทาง',
      gender: fullPet.gender === 'FEMALE' ? 'FEMALE' : 'MALE',
      ageMonths: Number(fullPet.ageMonths ?? 6),
      province: fullPet.province || 'กรุงเทพมหานคร',
      locationFound: fullPet.locationFound || '',
      isVaccinated: Boolean(fullPet.isVaccinated),
      isSterilized: Boolean(fullPet.isSterilized),
      isUrgent: Boolean(fullPet.isUrgent),
      status: fullPet.status === 'ADOPTED' ? 'ADOPTED' : 'AVAILABLE',
      healthNote: fullPet.healthNote || 'ตรวจสุขภาพเบื้องต้นแล้ว',
      description: fullPet.description || '',
      personalityText: Array.isArray(fullPet.personality) ? fullPet.personality.join(', ') : 'ร่าเริง',
      imageUrl:
        fullPet?.coverImage?.url ||
        fullPet?.images?.[0]?.url ||
        fullPet?.imageUrls?.[0] ||
        'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=600',
    });
    setModalOpen(true);
  };

  const handleUploadModalImage = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const f = files[0];
    if (!f.type.startsWith('image/')) {
      setFormError('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
      return;
    }
    try {
      const dataUrl = await fileToDataUrl(f);
      setForm((prev) => ({ ...prev, imageUrl: dataUrl }));
      setFormError('');
    } catch {
      setFormError('ไม่สามารถอ่านไฟล์รูปภาพได้');
    }
  };

  const handleSaveAnimal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return setFormError('กรุณากรอกชื่อน้อง');
    if (!form.breed.trim()) return setFormError('กรุณากรอกสายพันธุ์');
    if (!form.locationFound.trim()) return setFormError('กรุณากรอกจุดที่พบ / พื้นที่');

    const personality = form.personalityText
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const coverUrl =
      form.imageUrl.trim() ||
      'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=600';

    const payload = {
      name: form.name.trim(),
      species: form.species,
      breed: form.breed.trim(),
      gender: form.gender,
      ageMonths: Math.max(0, Number(form.ageMonths) || 0),
      province: form.province,
      locationFound: form.locationFound.trim(),
      isVaccinated: form.isVaccinated,
      isSterilized: form.isSterilized,
      isUrgent: form.status === 'ADOPTED' ? false : form.isUrgent,
      status: form.status,
      healthNote: form.healthNote.trim() || 'ตรวจสุขภาพเบื้องต้นแล้ว',
      description:
        form.description.trim() ||
        `${form.name.trim()} ถูกพบที่ ${form.locationFound.trim()} กำลังมองหาบ้านที่อบอุ่น`,
      personality: personality.length > 0 ? personality : ['เป็นมิตร'],
      coverImage: { url: coverUrl, thumbUrl: coverUrl },
      images: [{ url: coverUrl, thumbUrl: coverUrl }],
      imageUrls: [coverUrl],
    };

    if (editingMode === 'create') {
      let createdId = `local-${Date.now()}`;
      if (token) {
        try {
          const validImageUrl = /^https?:\/\//i.test(coverUrl)
            ? coverUrl
            : 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=600';
          const res = await api.post(
            '/animals',
            {
              name: payload.name,
              species: payload.species,
              breed: payload.breed,
              gender: payload.gender,
              ageMonths: payload.ageMonths,
              province: payload.province,
              locationFound: payload.locationFound,
              isVaccinated: payload.isVaccinated,
              isSterilized: payload.isSterilized,
              isUrgent: payload.isUrgent,
              status: payload.status,
              healthNote: payload.healthNote,
              description: payload.description,
              personality: payload.personality,
              imageUrls: [validImageUrl],
            },
            { headers: { Authorization: `Bearer ${token}` } },
          );
          if (res.data?.id) createdId = String(res.data.id);
        } catch {

        }
      }
      addLocalAnimal({
        id: createdId,
        createdAt: new Date().toISOString(),
        ...payload,
      });
    } else if (form.id) {
      updateLocalAnimal(form.id, payload);
      if (token && !String(form.id).startsWith('local-')) {
        api
          .patch(
            `/animals/${form.id}`,
            {
              name: payload.name,
              species: payload.species,
              breed: payload.breed,
              gender: payload.gender,
              ageMonths: payload.ageMonths,
              province: payload.province,
              locationFound: payload.locationFound,
              isVaccinated: payload.isVaccinated,
              isSterilized: payload.isSterilized,
              isUrgent: payload.isUrgent,
              status: payload.status,
              healthNote: payload.healthNote,
              description: payload.description,
              personality: payload.personality,
            },
            { headers: { Authorization: `Bearer ${token}` } },
          )
          .catch(() => { });
      }
    }

    setModalOpen(false);
    refreshAll();
  };

  const handleDeleteAnimal = (pet: any) => {
    const petId = String(pet.id ?? pet.key);
    deleteLocalAnimal(petId);
    if (token && !petId.startsWith('local-')) {
      api.delete(`/animals/${petId}`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => { });
    }
    refreshAll();
  };

  const handleApproveReportToWebsite = (report: any) => {
    const coverUrl =
      report.images?.[0] ||
      'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=600';
    const speciesLabel =
      report.species === 'DOG' ? 'น้องหมา' : report.species === 'CAT' ? 'น้องแมว' : report.breed || 'น้องExotic';

    addLocalAnimal({
      id: `local-rep-${Date.now()}`,
      name: `${speciesLabel} (${report.location?.slice(0, 18) || 'เคสแจ้งเหตุ'})`,
      species: report.species || 'DOG',
      breed: report.breed || (report.species === 'CAT' ? 'แมวไทยพันทาง' : 'ไทยพันทาง'),
      gender: 'MALE',
      ageMonths: 6,
      province: report.province || 'กรุงเทพมหานคร',
      locationFound: report.location || 'ได้รับแจ้งจากพลเมืองดี',
      isVaccinated: false,
      isSterilized: false,
      isUrgent: true,
      status: 'AVAILABLE',
      healthNote: report.description || 'รับแจ้งเหตุและกำลังประเมินอาการเบื้องต้น',
      description: `${report.description || ''} (แจ้งโดยคุณ ${report.reporterName || 'พลเมืองดี'})`,
      personality: ['รอประเมินนิสัย'],
      coverImage: { url: coverUrl, thumbUrl: coverUrl },
      images: (report.images || [coverUrl]).map((u: string) => ({ url: u, thumbUrl: u })),
      imageUrls: report.images?.length ? report.images : [coverUrl],
      createdAt: new Date().toISOString(),
    });

    const next = reports.map((r) => (r.id === report.id ? { ...r, status: 'APPROVED' as const } : r));
    setReports(next);
    saveAllReports(next);
    refreshAll();
  };

  const handleRejectReport = (reportId: string) => {
    const next = reports.map((r) => (r.id === reportId ? { ...r, status: 'REJECTED' as const } : r));
    setReports(next);
    saveAllReports(next);
    refreshAll();
  };

  const handleReviewRequest = (req: StoredAdoptionRequest, status: 'APPROVED' | 'REJECTED') => {
    const next = requests.map((r) => {
      if (r.id === req.id) return { ...r, status };
      if (status === 'APPROVED' && String(r.petId) === String(req.petId) && r.status === 'PENDING') {
        return { ...r, status: 'REJECTED' as const };
      }
      return r;
    });
    setRequests(next);
    saveAllStoredRequests(next);
    if (status === 'APPROVED') {
      updateLocalAnimal(req.petId, {
        status: 'ADOPTED',
        isUrgent: false,
        adoptedAt: new Date().toISOString(),
      });
    }
    if (token && !req.id.startsWith('req-')) {
      api
        .patch(
          `/adoption-requests/${req.id}`,
          { status },
          { headers: { Authorization: `Bearer ${token}` } },
        )
        .catch(() => { });
    }
    refreshAll();
  };

  const speciesIcon = (species: string) =>
    species === 'DOG' ? <Dog size={18} /> : species === 'CAT' ? <Cat size={18} /> : <Rabbit size={18} />;

  return (
    <div className="min-h-screen bg-[#FFFBF7] font-sans flex flex-col">
      <div className="max-w-[1140px] w-full mx-auto px-6 pt-10 pb-20 flex-1">

        <div className="mb-8">
          <span className="text-xs font-extrabold text-[#F37021] tracking-wide">Admin View</span>
          <h1 className="text-3xl md:text-[2.2rem] font-black text-[#2B211E] mt-0.5">แผงควบคุมแอดมิน</h1>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs">
            <div className="text-3xl font-black text-[#2B211E]">{waitingCount}</div>
            <div className="text-xs font-bold text-gray-400 mt-1">รอหาบ้าน</div>
          </div>
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs">
            <div className="text-3xl font-black text-[#2B211E]">{adoptedCount}</div>
            <div className="text-xs font-bold text-gray-400 mt-1">ได้บ้านแล้ว</div>
          </div>
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs">
            <div className="text-3xl font-black text-[#2B211E]">{pendingReportsCount}</div>
            <div className="text-xs font-bold text-gray-400 mt-1">เคสรอตรวจสอบ</div>
          </div>
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs">
            <div className="text-3xl font-black text-[#2B211E]">{pendingRequestsCount}</div>
            <div className="text-xs font-bold text-gray-400 mt-1">คำขอรออนุมัติ</div>
          </div>
        </div>

        <div className="inline-flex flex-wrap items-center gap-1 bg-[#FFF1E4] p-1.5 rounded-full mb-6">
          <button
            type="button"
            onClick={() => setTab('pets')}
            className={`inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-extrabold transition cursor-pointer ${tab === 'pets' ? 'bg-[#F37021] text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            <PawPrint size={14} /> ข้อมูลสัตว์
          </button>

          <button
            type="button"
            onClick={() => setTab('reports')}
            className={`inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-extrabold transition cursor-pointer ${tab === 'reports' ? 'bg-[#F37021] text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            <Megaphone size={14} /> เคสแจ้งเหตุ
            {pendingReportsCount > 0 && (
              <span className="ml-0.5 min-w-5 h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center">
                {pendingReportsCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setTab('requests')}
            className={`inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-extrabold transition cursor-pointer ${tab === 'requests' ? 'bg-[#F37021] text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            <ClipboardCheck size={14} /> อนุมัติบ้านใหม่
            {pendingRequestsCount > 0 && (
              <span className="ml-0.5 min-w-5 h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center">
                {pendingRequestsCount}
              </span>
            )}
          </button>
        </div>

        {tab === 'pets' && (
          <div>
            <div className="flex justify-end mb-4">
              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex items-center gap-2 bg-[#F37021] hover:bg-[#E06015] text-white text-xs font-extrabold px-5 py-3 rounded-full shadow-sm transition cursor-pointer"
              >
                <Plus size={16} /> เพิ่มน้องตัวใหม่
              </button>
            </div>

            <div className="bg-white rounded-[1.75rem] border border-gray-100 shadow-xs overflow-hidden">
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
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {animals.map((pet) => {
                      const petId = String(pet.id ?? pet.key);
                      const img =
                        pet?.coverImage?.url ||
                        pet?.images?.[0]?.url ||
                        pet?.imageUrls?.[0] ||
                        'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=200';
                      const isAdopted = pet.status === 'ADOPTED';
                      const isUrgent = pet.isUrgent && !isAdopted;

                      return (
                        <tr key={petId} className="hover:bg-[#FFFBF7] transition-colors">
                          <td className="py-3.5 pl-6 pr-4">
                            <div className="flex items-center gap-3.5">
                              <img
                                src={img}
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
                              <button
                                type="button"
                                onClick={() => openEditModal(pet)}
                                title="แก้ไขข้อมูล / อาการ / สถานะวัคซีน"
                                className="p-2 rounded-xl text-gray-500 hover:text-[#F37021] hover:bg-orange-50 transition cursor-pointer"
                              >
                                <Pencil size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteAnimal(pet)}
                                title="ลบรายการ"
                                className="p-2 rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
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
            </div>
          </div>
        )}

        {tab === 'reports' && (
          <div className="bg-white rounded-[1.75rem] border border-gray-100 shadow-xs overflow-hidden">
            {reports.length === 0 ? (
              <div className="p-14 text-center text-gray-400 font-bold text-sm">
                ยังไม่มีรายการแจ้งพบสัตว์จรจัดจากผู้ใช้
              </div>
            ) : (
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
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {reports.map((r) => {
                      const status = r.status || 'PENDING';
                      return (
                        <tr key={r.id} className="hover:bg-[#FFFBF7]">
                          <td className="py-4 pl-6 pr-4">
                            <div className="flex items-center gap-3.5">
                              {r.images?.[0] ? (
                                <img
                                  src={r.images[0]}
                                  alt=""
                                  className="w-12 h-12 rounded-2xl object-cover border border-gray-200 shrink-0"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
                                  {speciesIcon(r.species)}
                                </div>
                              )}
                              <div className="font-bold text-[#2B211E] max-w-[260px]">{r.description}</div>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-xs font-bold text-gray-600">
                            {r.species === 'DOG' ? 'หมา' : r.species === 'CAT' ? 'แมว' : r.breed || 'Exotic / อื่นๆ'}
                          </td>
                          <td className="py-4 px-4 text-xs font-medium text-gray-600">
                            <span className="inline-flex items-center gap-1">
                              <MapPin size={13} className="text-gray-400 shrink-0" />
                              {r.location} {r.province ? `(${r.province})` : ''}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-xs font-medium text-gray-600">
                            {r.reporterName || 'พลเมืองดี'}
                            {r.reporterPhone ? <div className="text-gray-400">{r.reporterPhone}</div> : null}
                          </td>
                          <td className="py-4 px-4">
                            {status === 'PENDING' && (
                              <span className="inline-flex items-center gap-1 bg-[#FFF5D1] text-[#9A7D0A] text-xs font-bold px-2.5 py-1 rounded-full">
                                <Clock size={12} /> รอตรวจสอบ
                              </span>
                            )}
                            {status === 'APPROVED' && (
                              <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full">
                                <CheckCircle2 size={12} /> ขึ้นเว็บแล้ว
                              </span>
                            )}
                            {status === 'REJECTED' && (
                              <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-xs font-bold px-2.5 py-1 rounded-full">
                                <XCircle size={12} /> ปฏิเสธแล้ว
                              </span>
                            )}
                          </td>
                          <td className="py-4 pl-4 pr-6 text-right">
                            {status === 'PENDING' ? (
                              <div className="inline-flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleApproveReportToWebsite(r)}
                                  className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-3.5 py-2 rounded-full transition cursor-pointer"
                                >
                                  <CheckCircle2 size={14} /> อนุมัติให้ขึ้นเว็บ
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRejectReport(r.id)}
                                  className="inline-flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold px-3.5 py-2 rounded-full transition cursor-pointer"
                                >
                                  <XCircle size={14} /> ปฏิเสธ
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400 font-bold">ดำเนินการแล้ว</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === 'requests' && (
          <div className="bg-white rounded-[1.75rem] border border-gray-100 shadow-xs overflow-hidden">
            {requests.length === 0 ? (
              <div className="p-14 text-center text-gray-400 font-bold text-sm">
                ยังไม่มีคำขอรับอุปการะที่ส่งเข้ามา
              </div>
            ) : (
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
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {requests.map((req) => (
                      <tr key={req.id} className="hover:bg-[#FFFBF7]">
                        <td className="py-4 pl-6 pr-4 font-extrabold text-[#2B211E]">น้อง{req.petName}</td>
                        <td className="py-4 px-4 text-xs font-bold text-gray-700">
                          {req.fullName}
                          <div className="text-gray-400 font-medium">{req.phone}</div>
                        </td>
                        <td className="py-4 px-4 text-xs font-medium text-gray-600">
                          {HOUSING_LABELS[req.housingType] || req.housingType}
                        </td>
                        <td className="py-4 px-4 text-xs font-medium text-gray-600 max-w-[260px]">{req.reason}</td>
                        <td className="py-4 px-4">
                          {req.status === 'PENDING' && (
                            <span className="inline-flex items-center gap-1 bg-[#FFF5D1] text-[#9A7D0A] text-xs font-bold px-2.5 py-1 rounded-full">
                              <Clock size={12} /> รออนุมัติ
                            </span>
                          )}
                          {req.status === 'APPROVED' && (
                            <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full">
                              <CheckCircle2 size={12} /> ผ่าน
                            </span>
                          )}
                          {req.status === 'REJECTED' && (
                            <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-xs font-bold px-2.5 py-1 rounded-full">
                              <XCircle size={12} /> ไม่ผ่าน
                            </span>
                          )}
                        </td>
                        <td className="py-4 pl-4 pr-6 text-right">
                          {req.status === 'PENDING' ? (
                            <div className="inline-flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleReviewRequest(req, 'APPROVED')}
                                className="inline-flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-3.5 py-2 rounded-full transition cursor-pointer"
                              >
                                <CheckCircle2 size={13} /> อนุมัติ
                              </button>
                              <button
                                type="button"
                                onClick={() => handleReviewRequest(req, 'REJECTED')}
                                className="inline-flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold px-3.5 py-2 rounded-full transition cursor-pointer"
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
        )}
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px] flex items-center justify-center p-4"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="bg-white rounded-[1.75rem] w-full max-w-[580px] max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-700"
            >
              <X size={20} />
            </button>

            <h2 className="text-xl font-black text-[#2B211E] mb-1">
              {editingMode === 'create' ? 'เพิ่มข้อมูลสัตว์ใหม่' : `แก้ไขข้อมูลน้อง${form.name}`}
            </h2>
            <p className="text-xs text-gray-400 font-medium mb-5">
              อัปเดตประวัติสุขภาพ สถานะวัคซีน หรือสถานะการหาบ้าน
            </p>

            <form onSubmit={handleSaveAnimal} className="space-y-4 text-sm">
              {/* รูปภาพ */}
              <div>
                <label className="block text-xs font-bold text-[#2B211E] mb-1.5">รูปภาพน้อง</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleUploadModalImage(e.target.files)}
                />
                <div className="flex items-center gap-3">
                  {form.imageUrl ? (
                    <img src={form.imageUrl} alt="" className="w-16 h-16 rounded-2xl object-cover border" />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-orange-50 text-orange-400 flex items-center justify-center">
                      <ImagePlus size={22} />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl border border-orange-200 bg-orange-50 text-orange-600 text-xs font-bold hover:bg-orange-100 cursor-pointer"
                  >
                    อัปโหลดรูปภาพ
                  </button>
                  <input
                    type="text"
                    value={form.imageUrl}
                    onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                    placeholder="หรือวางลิงก์รูปภาพ URL"
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-orange-400"
                  />
                </div>
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
                    onChange={(e) => setForm({ ...form, species: e.target.value as PetFormState['species'] })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none"
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
                    onChange={(e) => setForm({ ...form, gender: e.target.value as PetFormState['gender'] })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none"
                  >
                    <option value="MALE">ตัวผู้</option>
                    <option value="FEMALE">ตัวเมีย</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#2B211E] mb-1">อายุ (เดือน)</label>
                  <input
                    type="number"
                    min={0}
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
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as PetFormState['status'] })}
                  className="border border-gray-200 rounded-xl px-2.5 py-2 text-xs font-bold outline-none"
                >
                  <option value="AVAILABLE">รอหาบ้าน</option>
                  <option value="ADOPTED">ได้บ้านแล้ว</option>
                </select>
              </div>

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
                <label className="block text-xs font-bold text-[#2B211E] mb-1">นิสัย (คั่นด้วยเครื่องหมายจุลภาค ,)</label>
                <input
                  type="text"
                  value={form.personalityText}
                  onChange={(e) => setForm({ ...form, personalityText: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm outline-none"
                />
              </div>

              {formError && <p className="text-xs font-bold text-red-500">{formError}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 rounded-full border border-gray-200 text-xs font-bold text-gray-600"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-[#F37021] hover:bg-[#E06015] text-white text-xs font-bold shadow-sm cursor-pointer"
                >
                  บันทึกข้อมูล
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
