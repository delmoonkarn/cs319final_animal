import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Heart, ClipboardList, PawPrint, Clock, Home, X, CheckCircle2, XCircle, Mail, Phone, LogIn,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api';
import { useFavorites } from '../lib/favorites';
import { useAuthStore } from '../store/useAuthStore';
import { mergeAnimalsWithAdminChanges } from '../lib/local-animals';
import { PetCard } from './HomePage';
import {
  loadAllStoredRequests,
  loadStoredRequests,
  saveAllStoredRequests,
  type StoredAdoptionRequest,
} from '../components/AdoptionModal';

const HOUSING_LABELS: Record<string, string> = {
  HOUSE: 'บ้านเดี่ยว / ทาวน์เฮาส์',
  CONDO: 'คอนโด (อนุญาตเลี้ยงสัตว์)',
  DORM: 'หอพัก / อพาร์ตเมนต์',
};

const STATUS_BADGE: Record<
  StoredAdoptionRequest['status'],
  { label: string; cls: string; icon: React.ReactNode }
> = {
  PENDING: {
    label: 'รออนุมัติ',
    cls: 'bg-[#FFF5D1] text-[#9A7D0A] border border-yellow-200',
    icon: <Clock size={12} />,
  },
  APPROVED: {
    label: 'ผ่าน',
    cls: 'bg-green-100 text-green-700 border border-green-200',
    icon: <CheckCircle2 size={12} />,
  },
  REJECTED: {
    label: 'ไม่ผ่าน',
    cls: 'bg-red-100 text-red-700 border border-red-200',
    icon: <XCircle size={12} />,
  },
};

export function ProfilePage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'favorites' | 'requests'>('favorites');
  const [requests, setRequests] = useState<StoredAdoptionRequest[]>(() => loadStoredRequests());

  useEffect(() => {
    setRequests(loadStoredRequests());
  }, [activeTab, user?.email]);

  const cancelRequest = (req: StoredAdoptionRequest) => {

    if (req.status !== 'PENDING') return;
    const nextMine = requests.filter((r) => r.id !== req.id);
    setRequests(nextMine);
    const nextAll = loadAllStoredRequests().filter((r) => r.id !== req.id);
    saveAllStoredRequests(nextAll);
    const token = localStorage.getItem('token');
    if (token && !req.id.startsWith('req-')) {
      api
        .delete(`/adoption-requests/${req.id}`, { headers: { Authorization: `Bearer ${token}` } })
        .catch(() => { });
    }
  };


  // Favorites come from the database (with the animal data), so every favorite shows here.
  const { favoriteAnimals: favoritedAnimals, toggleFavorite, isLoading } = useFavorites();
  const { data: animals = [] } = useQuery({
    queryKey: ['animals_profile'],
    queryFn: async () => {
      try {
        const res = await api.get('/animals?pageSize=50');
        if (Array.isArray(res.data)) return res.data;
        if (res.data && Array.isArray(res.data.data)) return res.data.data;
        return [];
      } catch (error) {
        console.error('ดึงข้อมูลหน้าโปรไฟล์ไม่สำเร็จ:', error);
        return [];
      }
    },
  });


  const allAnimals = mergeAnimalsWithAdminChanges(animals);

  const findPetForRequest = (petId: string) =>
    allAnimals.find((a: any) => String(a?.id) === String(petId) || String(a?.key) === String(petId));

  return (
    <div className="min-h-screen bg-[#FFFBF7] font-sans pb-20">
      <div className="max-w-[1000px] mx-auto px-6 pt-10">


        <div className="bg-white rounded-[2rem] shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] border border-gray-100 flex flex-col overflow-hidden mb-8">
          <div className="h-32 bg-gradient-to-r from-orange-200 to-orange-50 relative w-full"></div>

          <div className="px-8 pb-8 relative flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
            <div className="w-24 h-24 bg-[#F37021] rounded-2xl border-4 border-white shadow-sm flex items-center justify-center text-white -mt-12 relative z-10 shrink-0">
              <PawPrint size={40} />
            </div>

            <div className="mt-2 sm:mt-4 text-center sm:text-left flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="text-3xl font-black text-[#3D312E] tracking-tight mb-1">
                    {user ? user.name : 'สมาชิก PawHome'}
                  </h1>
                  {user && (
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs font-bold text-gray-400 mb-2">
                      <span className="inline-flex items-center gap-1">
                        <Mail size={13} /> {user.email}
                      </span>
                      {user.phone && (
                        <span className="inline-flex items-center gap-1">
                          <Phone size={13} /> {user.phone}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                {!user && (
                  <Link
                    to="/login"
                    className="self-center sm:self-start inline-flex items-center gap-1.5 bg-orange-50 hover:bg-orange-100 text-orange-600 text-xs font-bold px-4 py-2 rounded-full transition"
                  >
                    <LogIn size={14} /> เข้าสู่ระบบ / สมัครสมาชิก
                  </Link>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-sm font-medium text-gray-500">
                <span className="flex items-center gap-1.5">
                  <Heart size={14} className="text-orange-500" /> รายการโปรด {favoritedAnimals.length} ตัว
                </span>
                <span className="text-gray-300">•</span>
                <span className="flex items-center gap-1.5">
                  <ClipboardList size={14} className="text-orange-500" /> คำขอรับเลี้ยง {requests.length} รายการ
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setActiveTab('favorites')}
            className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm transition-all duration-300 cursor-pointer ${activeTab === 'favorites'
              ? 'bg-[#F37021] text-white shadow-md'
              : 'bg-orange-50 text-orange-600 hover:bg-orange-100'
              }`}
          >
            <Heart size={18} className={activeTab === 'favorites' ? 'fill-white' : ''} /> รายการโปรด
          </button>

          <button
            onClick={() => setActiveTab('requests')}
            className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm transition-all duration-300 cursor-pointer ${activeTab === 'requests'
              ? 'bg-[#F37021] text-white shadow-md'
              : 'bg-orange-50 text-orange-600 hover:bg-orange-100'
              }`}
          >
            <ClipboardList size={18} /> สถานะคำขอรับเลี้ยง
          </button>
        </div>

        {activeTab === 'favorites' && (
          isLoading ? (
            <div className="bg-white rounded-[2rem] border-2 border-dashed border-gray-200/80 p-12 flex items-center justify-center text-orange-500 font-bold">
              กำลังโหลดข้อมูลรายการโปรด...
            </div>
          ) : favoritedAnimals.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
              {favoritedAnimals.map((pet: any) => {
                const uniqueKey = pet.id ? String(pet.id) : String(pet.key);
                return (
                  <PetCard
                    key={uniqueKey}
                    pet={pet}
                    isFavorite={true}
                    onToggleFavorite={toggleFavorite}
                  />
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-[2rem] border-2 border-dashed border-gray-200/80 p-12 md:p-24 flex flex-col items-center justify-center text-center min-h-[400px] transition-all">
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
            </div>
          )
        )}

        {activeTab === 'requests' && (
          requests.length > 0 ? (
            <div className="flex flex-col gap-4">
              {requests.map((req) => {
                const matchedPet = findPetForRequest(req.petId);
                const petImage =
                  matchedPet?.coverImage?.url ||
                  matchedPet?.images?.[0]?.url ||
                  matchedPet?.imageUrls?.[0] ||
                  null;
                const badge = STATUS_BADGE[req.status] || STATUS_BADGE.PENDING;
                const isPending = req.status === 'PENDING';

                return (
                  <div
                    key={req.id}
                    className="bg-white p-5 sm:p-6 rounded-[1.75rem] border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start sm:items-center gap-4 min-w-0">
                      <Link
                        to={`/pet/${req.petId}`}
                        className="w-20 h-20 rounded-2xl overflow-hidden bg-orange-50 shrink-0 flex items-center justify-center text-orange-400 border border-gray-100"
                      >
                        {petImage ? (
                          <img src={petImage} alt={req.petName} className="w-full h-full object-cover" />
                        ) : (
                          <PawPrint size={28} />
                        )}
                      </Link>

                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <Link
                            to={`/pet/${req.petId}`}
                            className="text-lg font-extrabold text-[#3D312E] hover:text-orange-500 transition-colors"
                          >
                            น้อง{req.petName || matchedPet?.name || 'สัตว์เลี้ยง'}
                          </Link>
                          <span className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-0.5 rounded-full ${badge.cls}`}>
                            {badge.icon} {badge.label}
                          </span>
                        </div>

                        <p className="text-sm text-gray-600 font-medium line-clamp-2 break-words">
                          {req.reason}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 font-medium pt-0.5">
                          <span className="inline-flex items-center gap-1">
                            <Home size={13} /> {HOUSING_LABELS[req.housingType] || req.housingType}
                          </span>
                          {req.fullName && (
                            <>
                              <span>•</span>
                              <span>
                                ผู้ขอ: {req.fullName}
                                {req.phone ? ` (${req.phone})` : ''}
                              </span>
                            </>
                          )}
                          <span>•</span>
                          <span>
                            ยื่นเมื่อ{' '}
                            {new Date(req.createdAt).toLocaleDateString('th-TH', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {isPending && (
                      <button
                        type="button"
                        onClick={() => cancelRequest(req)}
                        title="ยกเลิกคำขอรับเลี้ยง"
                        className="self-end sm:self-center inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-red-600 bg-gray-50 hover:bg-red-50 border border-gray-200 hover:border-red-200 px-3.5 py-2 rounded-full transition shrink-0 cursor-pointer"
                      >
                        <X size={14} /> ยกเลิกคำขอ
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-[2rem] border-2 border-dashed border-gray-200/80 p-12 md:p-24 flex flex-col items-center justify-center text-center min-h-[400px] transition-all">
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
            </div>
          )
        )}

      </div>
    </div>
  );
}
