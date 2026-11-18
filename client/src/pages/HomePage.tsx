// src/pages/HomePage.tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api';
import { Link } from 'react-router-dom';
import { PawPrint, Search, AlertTriangle, Home, Heart, MapPin, CheckCircle2 } from 'lucide-react';

// ================= 1. Skeleton Loader (แสดงตอนรอโหลดข้อมูล) =================
function SkeletonCard() {
  return (
    <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100/80 flex flex-col h-[400px] animate-pulse">
      <div className="h-56 bg-gray-200 w-full"></div>
      <div className="p-5 flex flex-col flex-grow gap-4">
        <div className="flex justify-between items-end">
          <div className="h-7 bg-gray-200 rounded-md w-1/2"></div>
          <div className="h-4 bg-gray-100 rounded-md w-1/4"></div>
        </div>
        <div className="h-4 bg-gray-100 rounded-md w-3/4 mb-4"></div>
        <div className="mt-auto flex gap-2">
          <div className="h-6 bg-gray-100 rounded-full w-1/3"></div>
          <div className="h-6 bg-gray-100 rounded-full w-1/4"></div>
        </div>
      </div>
    </div>
  );
}

// ================= 2. การ์ดสัตว์จรจัด (Pet Card) =================
function PetCard({ pet, isFavorite, onToggleFavorite }: { pet: any, isFavorite: boolean, onToggleFavorite: (id: string) => void }) {
  const isUrgent = pet.isUrgent;
  const isAdopted = pet.status === 'ADOPTED';
  
  let badgeColor = 'bg-white text-gray-700 shadow-sm';
  let badgeText = 'รอหาบ้าน';
  if (isAdopted) {
     badgeColor = 'bg-green-600 text-white';
     badgeText = 'ได้บ้านแล้ว';
  } else if (isUrgent) {
     badgeColor = 'bg-red-500 text-white';
     badgeText = 'เคสด่วน';
  }

  const speciesText = pet.species === 'DOG' ? 'หมา' : 'แมว';
  const genderText = pet.gender === 'MALE' ? 'ผู้' : 'เมีย';
  const imageUrl = pet?.coverImage?.url || (pet?.imageUrls && pet.imageUrls.length > 0 ? pet.imageUrls[0] : null) || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=600';

  return (
    <Link 
      to={`/pet/${pet.id}`} 
      className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100/80 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group cursor-pointer"
    >
      <div className="relative h-56 w-full overflow-hidden bg-gray-50">
        <img src={imageUrl} alt={pet.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
        
        {/* ป้ายสถานะ */}
        <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${badgeColor}`}>
          {badgeText}
        </div>
        
        {/* ปุ่มหัวใจ Wishlist */}
        <button 
          onClick={(e) => {
            e.preventDefault(); // กันไม่ให้เปลี่ยนหน้าเวลาคลิกหัวใจ
            onToggleFavorite(pet.id);
          }} 
          className="absolute top-4 right-4 p-2.5 bg-white/90 hover:bg-white rounded-full text-gray-400 hover:text-red-500 transition-all shadow-sm active:scale-90"
        >
          <Heart size={18} className={isFavorite ? 'fill-red-500 text-red-500' : ''} />
        </button>
      </div>
      
      <div className="p-5 flex flex-col flex-grow">
        <div className="flex justify-between items-end mb-2">
          <h3 className="text-[1.35rem] font-extrabold text-gray-800 tracking-tight line-clamp-1">{pet.name}</h3>
          <span className="text-xs font-medium text-gray-400 shrink-0">{speciesText} · {genderText} · {pet.ageMonths} เดือน</span>
        </div>
        <div className="flex items-start gap-1.5 text-gray-500 text-sm mb-5">
          <MapPin size={16} className="mt-0.5 shrink-0 text-gray-400" />
          <span className="line-clamp-1">{pet.locationFound}</span>
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-auto">
          {pet.isVaccinated && (
            <span className="flex items-center gap-1 text-green-500 text-xs font-bold bg-green-50 px-2 py-0.5 rounded-md">
              <CheckCircle2 size={12} /> วัคซีนแล้ว
            </span>
          )}
          {pet.personality?.slice(0, 3).map((trait: string, idx: number) => (
            <span key={idx} className="text-orange-500 text-xs font-bold bg-orange-50 px-2 py-0.5 rounded-md">
              {trait}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}

// ================= 3. หน้าแรกหลัก (Homepage) =================
export function HomePage() {
  // สถานะตัวกรองและค้นหา
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSpecies, setFilterSpecies] = useState<'ALL' | 'DOG' | 'CAT'>('ALL');
  const [filterVaccinated, setFilterVaccinated] = useState(false);
  
  // สถานะ Wishlist จำลอง (เก็บ ID ของสัตว์ที่กดหัวใจ)
  const [favorites, setFavorites] = useState<string[]>([]);

  const toggleFavorite = (id: string) => {
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(favId => favId !== id) : [...prev, id]
    );
  };

  // ดึงข้อมูลจาก API
  const { data, isLoading } = useQuery({
    queryKey: ['animals'],
    queryFn: async () => {
      const response = await api.get('/animals'); 
      return response.data?.data || response.data || [];
    }
  });

  const animals = Array.isArray(data) ? data : [];

  // คำนวณสถิติ (Stats Bar)
  const waitingCount = animals.filter((a: any) => a.status === 'AVAILABLE' && !a.isUrgent).length;
  const urgentCount = animals.filter((a: any) => a.isUrgent && a.status === 'AVAILABLE').length;
  const adoptedCount = animals.filter((a: any) => a.status === 'ADOPTED').length;

  const filteredAnimals = animals.filter((pet: any) => {
    // 1. กรองคำค้นหา (หาจาก "ชื่อ" เพียงอย่างเดียว)
    const matchSearch = searchTerm === '' || 
      pet.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // 2. กรองชนิดสัตว์
    const matchSpecies = filterSpecies === 'ALL' || pet.species === filterSpecies;
    
    // 3. กรองวัคซีน
    const matchVaccinated = !filterVaccinated || pet.isVaccinated;

    return matchSearch && matchSpecies && matchVaccinated;
  });

  return (
    <>
       {/* Hero Banner */}
       <div className="relative bg-[#FFF7F0] w-full h-[460px] flex items-center overflow-hidden">
         <div className="absolute right-0 top-0 w-[55%] h-full bg-[url('https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center [mask-image:linear-gradient(to_right,transparent_0%,black_30%)]"></div>
         <div className="relative z-10 w-full px-6 md:px-24">
            <div className="max-w-[500px]">
              <span className="text-orange-600 font-bold text-[11px] bg-orange-100 px-3 py-1.5 rounded-full mb-6 inline-flex items-center gap-1.5"><PawPrint size={12}/> ชุมชนคนรักสัตว์</span>
              <h1 className="text-4xl md:text-[3.2rem] font-black text-[#3D312E] leading-[1.1] mb-5 tracking-tight">ทุกน้องควรมี<span className="text-orange-500">บ้านที่อบอุ่น</span></h1>
              <p className="text-gray-500 mb-8 leading-relaxed font-medium text-sm pr-4">
                ร่วมเป็นครอบครัวใหม่ แจ้งพบสัตว์จร หรือช่วยค่าอาหารและวัคซีน ทุกการช่วยเหลือพาน้องกลับบ้านได้เร็วขึ้น
              </p>
              <div className="flex gap-3">
                <button className="bg-orange-500 text-white px-7 py-2.5 rounded-full text-sm font-bold shadow-md hover:bg-orange-600 transition">ดูน้องที่รอบ้าน</button>
                <Link to="/report" className="bg-white text-gray-700 px-7 py-2.5 rounded-full text-sm font-bold shadow-sm hover:bg-gray-50 transition border border-gray-200">แจ้งพบสัตว์จร</Link>
              </div>
            </div>
         </div>
       </div>

       {/* Stats Cards (แถบตัวเลข) */}
       <div className="max-w-[900px] mx-auto -mt-10 relative z-20 grid grid-cols-1 md:grid-cols-3 gap-5 px-4">
          <div className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-gray-100 flex items-center gap-5">
             <div className="bg-orange-50 p-3.5 rounded-2xl text-orange-400"><PawPrint size={22}/></div>
             <div className="flex flex-col"><span className="text-2xl font-black text-[#3D312E] leading-none">{waitingCount}</span><span className="text-[11px] font-bold text-gray-400 mt-1">รอหาบ้าน</span></div>
          </div>
          <div className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-gray-100 flex items-center gap-5">
             <div className="bg-red-50 p-3.5 rounded-2xl text-red-400"><AlertTriangle size={22}/></div>
             <div className="flex flex-col"><span className="text-2xl font-black text-[#3D312E] leading-none">{urgentCount}</span><span className="text-[11px] font-bold text-gray-400 mt-1">เคสฉุกเฉิน</span></div>
          </div>
          <div className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-gray-100 flex items-center gap-5">
             <div className="bg-green-50 p-3.5 rounded-2xl text-green-400"><Home size={22}/></div>
             <div className="flex flex-col"><span className="text-2xl font-black text-[#3D312E] leading-none">{adoptedCount}</span><span className="text-[11px] font-bold text-gray-400 mt-1">ได้บ้านแล้ว</span></div>
          </div>
       </div>

       {/* Main Content & Grid */}
       <div className="max-w-[1100px] mx-auto px-6 py-16">
         <div className="mb-8">
           <h2 className="text-[1.5rem] font-black text-[#3D312E] mb-1">น้องๆ ที่รอหาบ้านใหม่</h2>
           <p className="text-gray-400 font-medium text-xs">พบ {isLoading ? '...' : filteredAnimals.length} ตัว</p>
         </div>
         
         {/* Search & Filter Bar */}
         <div className="flex flex-col md:flex-row justify-between items-center mb-8 bg-white p-2 rounded-[2rem] shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] border border-gray-100 gap-3">
            <div className="flex-1 flex items-center px-4 w-full md:w-auto h-10">
              <Search className="text-gray-300 mr-3" size={18}/>
              <input 
                type="text" 
                placeholder="ค้นหาชื่อ สถานที่ หรือนิสัย (เช่น ขี้อ้อน)..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full outline-none bg-transparent font-medium text-sm text-gray-700 placeholder-gray-300" 
              />
            </div>
            
            <div className="flex flex-wrap gap-2 justify-center w-full md:w-auto px-2 pb-2 md:pb-0 md:px-0">
              {/* ปุ่มกรองวัคซีน */}
              <button 
                onClick={() => setFilterVaccinated(!filterVaccinated)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-[13px] font-bold transition-all border ${
                  filterVaccinated ? 'bg-green-50 text-green-600 border-green-200' : 'bg-white text-gray-400 hover:bg-gray-50 border-gray-100'
                }`}
              >
                <CheckCircle2 size={16} /> วัคซีนแล้ว
              </button>

              {/* ปุ่มกรองสายพันธุ์ */}
              <div className="flex bg-gray-50/80 p-1 rounded-full border border-gray-100">
                <button 
                  onClick={() => setFilterSpecies('ALL')}
                  className={`px-5 py-2 rounded-full text-[13px] font-bold transition-all ${filterSpecies === 'ALL' ? 'bg-[#F37021] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  ทั้งหมด
                </button>
                <button 
                  onClick={() => setFilterSpecies('DOG')}
                  className={`px-5 py-2 rounded-full text-[13px] font-bold transition-all ${filterSpecies === 'DOG' ? 'bg-[#F37021] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  หมา
                </button>
                <button 
                  onClick={() => setFilterSpecies('CAT')}
                  className={`px-5 py-2 rounded-full text-[13px] font-bold transition-all ${filterSpecies === 'CAT' ? 'bg-[#F37021] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  แมว
                </button>
              </div>
            </div>
         </div>

         {/* Grid การ์ดสัตว์ หรือ Skeleton ตอนโหลด */}
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 min-h-[400px]">
            {isLoading ? (
              // แสดง Skeleton 8 ใบตอนรอ API
              Array.from({ length: 8 }).map((_, index) => (
                <SkeletonCard key={index} />
              ))
            ) : filteredAnimals.length > 0 ? (
              // แสดงการ์ดสัตว์จริง
              filteredAnimals.map((pet: any) => (
                <PetCard 
                  key={pet.id} 
                  pet={pet} 
                  isFavorite={favorites.includes(pet.id)}
                  onToggleFavorite={toggleFavorite}
                />
              ))
            ) : (
              // กรณีค้นหาแล้วไม่เจอ
              <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-400">
                <Search size={48} className="mb-4 text-gray-200" />
                <h3 className="text-lg font-bold text-gray-600 mb-1">ไม่พบน้องๆ ที่คุณค้นหา</h3>
                <p className="text-sm">ลองปรับตัวกรอง หรือเปลี่ยนคำค้นหาใหม่อีกครั้ง</p>
              </div>
            )}
         </div>
       </div>
       
       <footer className="text-center pb-12 text-gray-400 font-medium text-xs">PawHome - ชุมชนคนรักสัตว์ ช่วยกันพาน้องกลับบ้าน</footer>
    </>
  );
}