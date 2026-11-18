import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api';
import { useFavorites } from '../lib/favorites';
import { mergeAnimalsWithAdminChanges } from '../lib/local-animals';
import { Link } from 'react-router-dom';
import {
  PawPrint, Search, AlertTriangle, Home, Heart, MapPin, Syringe, Dog, Cat, ChevronDown,
} from 'lucide-react';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1450778869180-41d0601e046e?q=80&w=1400&auto=format&fit=crop';

function formatAge(months?: number) {
  if (months == null) return '';
  if (months < 12) return `${months} เดือน`;
  const years = Math.floor(months / 12);
  return `${years} ปี`;
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-[1.5rem] overflow-hidden border border-gray-100 flex flex-col animate-pulse">
      <div className="h-60 bg-gray-200 w-full"></div>
      <div className="p-5 flex flex-col gap-3">
        <div className="flex justify-between">
          <div className="h-5 bg-gray-200 rounded-md w-1/3"></div>
          <div className="h-4 bg-gray-100 rounded-md w-1/4"></div>
        </div>
        <div className="h-4 bg-gray-100 rounded-md w-2/3"></div>
        <div className="flex gap-2">
          <div className="h-5 bg-gray-100 rounded-full w-20"></div>
          <div className="h-5 bg-gray-100 rounded-full w-16"></div>
        </div>
      </div>
    </div>
  );
}

export function PetCard({ pet, isFavorite, onToggleFavorite }: { pet: any; isFavorite: boolean; onToggleFavorite: (id: string) => void }) {
  const isUrgent = pet.isUrgent;
  const isAdopted = pet.status === 'ADOPTED';
  const petId = pet.id ? String(pet.id) : String(pet.key);

  const speciesText = pet.species === 'DOG' ? 'หมา' : pet.species === 'CAT' ? 'แมว' : 'อื่นๆ';
  const genderText = pet.gender === 'MALE' ? 'ผู้' : 'เมีย';
  const imageUrl =
    pet?.coverImage?.url || pet?.images?.[0]?.url || pet?.imageUrls?.[0] ||
    'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=600';

  const badge = isAdopted
    ? { cls: 'bg-green-600 text-white', icon: <Home size={11} />, text: 'ได้บ้านแล้ว' }
    : isUrgent
      ? { cls: 'bg-red-500 text-white', icon: <AlertTriangle size={11} />, text: 'เคสฉุกเฉิน' }
      : { cls: 'bg-white text-orange-600', icon: <Heart size={11} />, text: 'รอหาบ้าน' };

  return (
    <Link
      to={`/pet/${petId}`}
      className={`bg-white rounded-[1.5rem] overflow-hidden border hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group ${isUrgent && !isAdopted ? 'border-red-100 shadow-[0_4px_20px_-8px_rgba(239,68,68,0.25)]' : 'border-gray-100 shadow-sm'
        }`}
    >
      <div className="relative h-60 w-full overflow-hidden bg-gray-50">
        <img src={imageUrl} alt={pet.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />

        <div className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 shadow-sm ${badge.cls}`}>
          {badge.icon} {badge.text}
        </div>

        <button
          onClick={(e) => {
            e.preventDefault();
            if (petId) onToggleFavorite(petId);
          }}
          className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center bg-white/95 hover:bg-white rounded-full text-gray-500 hover:text-red-500 transition-all shadow-sm active:scale-90"
        >
          <Heart size={17} className={isFavorite ? 'fill-red-500 text-red-500' : ''} />
        </button>
      </div>

      <div className="p-4 flex flex-col flex-grow">
        <div className="flex justify-between items-center mb-1.5">
          <h3 className="text-lg font-extrabold text-[#3D312E] line-clamp-1">{pet.name}</h3>
          <span className="text-[11px] font-medium text-gray-400 shrink-0">
            {speciesText} · {genderText} · {formatAge(pet.ageMonths)}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-3">
          <MapPin size={13} className="shrink-0 text-gray-400" />
          <span className="line-clamp-1">{pet.locationFound}</span>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-auto">
          {pet.isVaccinated ? (
            <span className="flex items-center gap-1 text-green-700 text-[11px] font-bold bg-green-100 px-2.5 py-0.5 rounded-full">
              <Syringe size={11} /> ฉีดวัคซีนแล้ว
            </span>
          ) : (
            <span className="text-gray-500 text-[11px] font-bold bg-gray-100 px-2.5 py-0.5 rounded-full">
              ยังไม่ฉีดวัคซีน
            </span>
          )}
          {pet.personality?.slice(0, 2).map((trait: string, idx: number) => (
            <span key={idx} className="text-[#B45309] text-[11px] font-bold bg-[#FFF1E6] px-2.5 py-0.5 rounded-full">
              {trait}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}

export function HomePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSpecies, setFilterSpecies] = useState<'ALL' | 'DOG' | 'CAT'>('ALL');
  const [filterVaccinated, setFilterVaccinated] = useState(false);
  const [filterProvince, setFilterProvince] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'AVAILABLE' | 'URGENT' | 'ADOPTED'>('ALL');

  const { favorites, toggleFavorite } = useFavorites();

  const handleStatusClick = (status: 'AVAILABLE' | 'URGENT' | 'ADOPTED') => {
    setFilterStatus((prev) => (prev === status ? 'ALL' : status));
  };

  const { data: animals = [], isLoading, isError } = useQuery({
    queryKey: ['animals'],
    queryFn: async () => {
      const res = await api.get('/animals?pageSize=50');
      if (Array.isArray(res.data)) return res.data;
      if (res.data && Array.isArray(res.data.data)) return res.data.data;
      return [];
    },
  });

  const safeAnimals: any[] = mergeAnimalsWithAdminChanges(Array.isArray(animals) ? animals : []);
  const waitingCount = safeAnimals.filter((a) => a.status === 'AVAILABLE' && !a.isUrgent).length;
  const urgentCount = safeAnimals.filter((a) => a.isUrgent && a.status === 'AVAILABLE').length;
  const adoptedCount = safeAnimals.filter((a) => a.status === 'ADOPTED').length;

  const provinces = useMemo(
    () => Array.from(new Set(safeAnimals.map((a) => a.province).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'th')),
    [safeAnimals],
  );

  const filteredAnimals = safeAnimals.filter((pet) => {
    const q = searchTerm.trim().toLowerCase();
    const haystack = [pet.name, pet.breed, pet.locationFound, pet.province, ...(pet.personality || [])]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    const matchSearch = q === '' || haystack.includes(q);
    const matchSpecies = filterSpecies === 'ALL' || pet.species === filterSpecies;
    const matchVaccinated = !filterVaccinated || pet.isVaccinated;
    const matchProvince = filterProvince === 'ALL' || pet.province === filterProvince;

    let matchStatus = true;
    if (filterStatus === 'AVAILABLE') matchStatus = pet.status === 'AVAILABLE' && !pet.isUrgent;
    else if (filterStatus === 'URGENT') matchStatus = pet.status === 'AVAILABLE' && pet.isUrgent;
    else if (filterStatus === 'ADOPTED') matchStatus = pet.status === 'ADOPTED';

    return matchSearch && matchSpecies && matchVaccinated && matchProvince && matchStatus;
  });

  const scrollToList = () => document.getElementById('pet-list')?.scrollIntoView({ behavior: 'smooth' });

  const statCards = [
    { key: 'AVAILABLE' as const, count: waitingCount, label: 'รอหาบ้าน', icon: <PawPrint size={20} />, iconCls: 'bg-orange-50 text-orange-500', active: 'border-orange-400 ring-4 ring-orange-50' },
    { key: 'URGENT' as const, count: urgentCount, label: 'เคสฉุกเฉิน', icon: <AlertTriangle size={20} />, iconCls: 'bg-red-50 text-red-500', active: 'border-red-400 ring-4 ring-red-50' },
    { key: 'ADOPTED' as const, count: adoptedCount, label: 'ได้บ้านแล้ว', icon: <Home size={20} />, iconCls: 'bg-green-50 text-green-600', active: 'border-green-400 ring-4 ring-green-50' },
  ];

  const speciesOptions = [
    { key: 'ALL' as const, label: 'ทั้งหมด', icon: <PawPrint size={14} /> },
    { key: 'DOG' as const, label: 'หมา', icon: <Dog size={14} /> },
    { key: 'CAT' as const, label: 'แมว', icon: <Cat size={14} /> },
  ];

  return (
    <div className="bg-[#FFFBF7]">

      <section className="w-full bg-gradient-to-br from-[#FFF4EA] via-[#FFF8F2] to-[#FFFBF7]">
        <div className="relative max-w-[1440px] mx-auto overflow-hidden">
          <div
            className="absolute right-0 top-0 w-full md:w-[58%] h-full bg-cover bg-center opacity-30 md:opacity-100 [mask-image:linear-gradient(to_right,transparent_0%,black_35%,black_90%,transparent_100%)]"
            style={{ backgroundImage: `url('${HERO_IMAGE}')` }}
          ></div>
          <div className="relative z-10 max-w-[1100px] mx-auto px-6 pt-20 pb-28 md:pt-24 md:pb-32">
            <div className="max-w-[480px]">
              <span className="text-orange-600 font-bold text-[11px] bg-orange-100/80 px-3 py-1.5 rounded-full mb-6 inline-flex items-center gap-1.5">
                <PawPrint size={12} /> ชุมชนคนรักสัตว์
              </span>
              <h1 className="text-4xl md:text-[3rem] font-black text-[#2B211E] leading-[1.15] mb-5 tracking-tight">
                ทุกน้องควรมี<span className="text-orange-500">บ้านที่อบอุ่น</span>
              </h1>
              <p className="text-gray-600 mb-8 leading-relaxed font-medium text-[15px]">
                ร่วมเป็นครอบครัวใหม่ แจ้งพบน้องจร หรือช่วยค่าอาหารและวัคซีน ทุกการช่วยเหลือพาน้องกลับบ้านได้เร็วขึ้น
              </p>
              <div className="flex gap-3">
                <button onClick={scrollToList} className="bg-[#F37021] text-white px-7 py-3 rounded-full text-sm font-bold shadow-md hover:bg-[#E06015] transition cursor-pointer">
                  ดูน้องที่รอบ้าน
                </button>
                <Link to="/report" className="bg-white text-gray-700 px-7 py-3 rounded-full text-sm font-bold shadow-sm hover:bg-gray-50 transition border border-gray-200">
                  แจ้งพบสัตว์จร
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-[1100px] mx-auto -mt-14 relative z-20 grid grid-cols-1 md:grid-cols-3 gap-5 px-6">
        {statCards.map((card) => (
          <div
            key={card.key}
            onClick={() => handleStatusClick(card.key)}
            className={`bg-white rounded-[1.5rem] px-6 py-5 shadow-[0_4px_20px_-6px_rgba(0,0,0,0.08)] border flex items-center gap-4 cursor-pointer hover:-translate-y-1 transition-all duration-300 select-none ${filterStatus === card.key ? card.active : 'border-gray-100'
              }`}
          >
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${card.iconCls}`}>{card.icon}</div>
            <div className="flex flex-col">
              <span className="text-2xl font-black text-[#2B211E] leading-none">{card.count}</span>
              <span className="text-xs font-medium text-gray-500 mt-1">{card.label}</span>
            </div>
          </div>
        ))}
      </div>

      <div id="pet-list" className="max-w-[1100px] mx-auto px-6 pt-14 pb-20 scroll-mt-20">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-black text-[#2B211E]">
              {filterStatus === 'URGENT'
                ? 'เคสฉุกเฉินที่ต้องการความช่วยเหลือ'
                : filterStatus === 'ADOPTED'
                  ? 'น้องๆ ที่ได้บ้านแล้ว'
                  : 'น้องๆ ที่รอบ้านใหม่'}
            </h2>
            {isError ? (
              <p className="text-red-500 font-medium text-xs mt-1">เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล</p>
            ) : (
              <p className="text-gray-400 font-medium text-xs mt-1">พบ {isLoading ? '...' : filteredAnimals.length} ตัว</p>
            )}
          </div>
          {filterStatus !== 'ALL' && (
            <button onClick={() => setFilterStatus('ALL')} className="text-xs font-bold text-gray-400 hover:text-orange-500 underline">
              แสดงทั้งหมด
            </button>
          )}
        </div>

        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2.5 mb-7 bg-white p-2 rounded-[1.25rem] shadow-[0_2px_15px_-5px_rgba(0,0,0,0.08)] border border-gray-100">
          <div className="flex-1 flex items-center px-4 h-11 border border-gray-200 rounded-full">
            <Search className="text-gray-400 mr-2.5 shrink-0" size={16} />
            <input
              type="text"
              placeholder="ค้นหาชื่อ สายพันธุ์ นิสัย หรือสถานที่"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full outline-none bg-transparent font-medium text-sm text-gray-700 placeholder-gray-400"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex bg-[#FFF4EA] p-1 rounded-full">
              {speciesOptions.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setFilterSpecies(opt.key)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-bold transition-all ${filterSpecies === opt.key ? 'bg-[#F37021] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  {opt.icon} {opt.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => setFilterVaccinated(!filterVaccinated)}
              className="flex items-center gap-2 pl-3.5 pr-2 h-10 rounded-full border border-gray-200 text-[13px] font-bold text-gray-600 hover:bg-gray-50 transition"
            >
              <Syringe size={14} className="text-green-600" /> ฉีดวัคซีนแล้ว
              <span className={`relative w-9 h-5 rounded-full transition-colors ${filterVaccinated ? 'bg-green-500' : 'bg-gray-200'}`}>
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${filterVaccinated ? 'translate-x-4' : ''}`}></span>
              </span>
            </button>

            <div className="relative">
              <select
                value={filterProvince}
                onChange={(e) => setFilterProvince(e.target.value)}
                className="appearance-none h-10 pl-4 pr-9 rounded-full border border-gray-200 bg-white text-[13px] font-bold text-gray-600 outline-none cursor-pointer min-w-[140px]"
              >
                <option value="ALL">ทุกพื้นที่</option>
                {provinces.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>


        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 min-h-[400px]">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, index) => <SkeletonCard key={index} />)
          ) : isError ? (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-400">
              <AlertTriangle size={48} className="mb-4 text-red-200" />
              <h3 className="text-lg font-bold text-gray-600 mb-1">ไม่สามารถดึงข้อมูลได้</h3>
              <p className="text-sm">โปรดตรวจสอบว่าเปิดเซิร์ฟเวอร์ Backend แล้วหรือไม่</p>
            </div>
          ) : filteredAnimals.length > 0 ? (
            filteredAnimals.map((pet, index) => {
              const uniqueKey = pet.id ? String(pet.id) : pet.key ? String(pet.key) : String(index);
              return (
                <PetCard
                  key={uniqueKey}
                  pet={pet}
                  isFavorite={favorites.includes(uniqueKey)}
                  onToggleFavorite={toggleFavorite}
                />
              );
            })
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-400">
              <Search size={48} className="mb-4 text-gray-200" />
              <h3 className="text-lg font-bold text-gray-600 mb-1">ไม่พบน้องๆ ที่คุณค้นหา</h3>
              <p className="text-sm">ลองปรับตัวกรอง หรือเปลี่ยนคำค้นหาใหม่อีกครั้ง</p>
            </div>
          )}
        </div>
      </div>

      <footer className="bg-[#FFF4EA] border-t border-orange-100/60 text-center py-8 text-gray-500 font-medium text-xs">
        PawHome · ชุมชนคนรักสัตว์ ช่วยกันพาน้องกลับบ้าน
      </footer>
    </div>
  );
}
