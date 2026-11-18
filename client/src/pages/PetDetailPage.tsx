import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { api } from '../api';
import { AdoptionModal, loadAllStoredRequests } from '../components/AdoptionModal';
import { findLocalOrOverrideAnimal } from '../lib/local-animals';
import { useFavorites } from '../lib/favorites';
import { SuccessStories } from '../components/SuccessStories';
import {
    ArrowLeft, MapPin, Heart, AlertTriangle,
    Share2, Activity, ShieldCheck, Bone, Users
} from 'lucide-react';

export function PetDetailPage() {
    const { id } = useParams();
    const [showAdoptForm, setShowAdoptForm] = useState(false);
    const { favorites, toggleFavorite } = useFavorites();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const { data, isLoading, isError } = useQuery({
        queryKey: ['animal', id],
        queryFn: async () => {
            const localOnly = findLocalOrOverrideAnimal(id!);
            if (localOnly && String(localOnly.id).startsWith('local-')) {
                return localOnly;
            }
            try {
                const response = await api.get(`/animals/${id}`);
                const fromApi = response.data?.data || response.data;
                return findLocalOrOverrideAnimal(id!, fromApi) ?? fromApi;
            } catch {
                return localOnly;
            }
        },
        enabled: !!id,
    });

    if (isLoading) return <div className="min-h-screen flex items-center justify-center font-bold text-xl text-orange-500">กำลังโหลดข้อมูลน้อง...</div>;
    if (isError || !data) return <div className="min-h-screen flex items-center justify-center font-bold text-red-500">ไม่พบข้อมูล หรือเกิดข้อผิดพลาด</div>;

    const pet = data;
    const petKey = String(pet.id ?? pet.key ?? id);
    const isFavorite = favorites.includes(petKey);
    const localReqCount = loadAllStoredRequests().filter((r) => String(r.petId) === petKey).length;
    const queueCount = Math.max(Number(pet.requestCount ?? 0), localReqCount);
    const isAdopted = pet.status === 'ADOPTED';
    const isUrgent = pet.isUrgent;
    const speciesText = pet.species === 'DOG' ? 'น้องหมา' : pet.species === 'CAT' ? 'น้องแมว' : 'สัตว์อื่นๆ / Exotic';
    const genderText = pet.gender === 'MALE' ? 'ตัวผู้' : 'ตัวเมีย';
    const imageUrl = pet?.images?.[0]?.url || pet?.coverImage?.url || pet?.imageUrls?.[0] || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=800';

    const displayDescription = pet.description || `${pet.name} ถูกพบที่ ${pet.locationFound} กำลังมองหาบ้านที่อบอุ่นและพร้อมดูแลตลอดไป`;

    const healthEntries: string[] = (pet.healthNote || '')
        .split('\n')
        .map((line: string) => line.trim())
        .filter(Boolean);
    const formatDate = (value?: string) =>
        value ? new Date(value).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' }) : '';


    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        alert('คัดลอกลิงก์สำหรับแชร์ขอความช่วยเหลือแล้ว!');
    };

    return (
        <div className="min-h-screen bg-[#FFFBF7] font-sans pb-20 pt-8">
            <div className="max-w-[1100px] mx-auto px-6">


                <Link to="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-orange-500 font-bold text-sm mb-8 transition-colors">
                    <ArrowLeft size={16} /> กลับไปดูน้องตัวอื่น
                </Link>


                <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-10 lg:gap-14 items-start">


                    <div className="relative w-full h-[400px] md:h-[500px] rounded-[2.5rem] overflow-hidden shadow-sm border border-gray-100 group">
                        <img src={imageUrl} alt={pet.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />


                        <div className="absolute top-5 left-5">
                            {isAdopted ? (
                                <span className="bg-green-600 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-1.5 shadow-md">
                                    <Heart size={16} /> ได้บ้านแล้ว
                                </span>
                            ) : isUrgent ? (
                                <span className="bg-red-500 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-1.5 shadow-md">
                                    <AlertTriangle size={16} /> เคสฉุกเฉิน
                                </span>
                            ) : (
                                <span className="bg-white/95 text-gray-700 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-1.5 shadow-sm">
                                    รอหาบ้าน
                                </span>
                            )}
                        </div>


                        <button
                            type="button"
                            onClick={() => toggleFavorite(petKey)}
                            className="absolute top-5 right-5 w-11 h-11 bg-white/95 hover:bg-white rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors shadow-sm cursor-pointer"
                        >
                            <Heart size={22} className={isFavorite ? 'fill-red-500 text-red-500' : ''} />
                        </button>
                    </div>


                    <div className="flex flex-col h-full">
                        <span className="text-gray-400 text-sm font-bold mb-1">{speciesText} - {pet.breed || 'พันทาง'}</span>
                        <div className="flex justify-between items-start">
                            <h1 className="text-4xl md:text-[2.75rem] font-black text-[#3D312E] tracking-tight">{pet.name}</h1>
                            <div className="flex items-center gap-1 bg-orange-50 text-orange-600 px-3 py-1 rounded-lg text-xs font-bold mt-2">
                                <Users size={14} /> ยื่นขอรับเลี้ยง {queueCount} คน
                            </div>
                        </div>

                        <div className="flex items-center gap-1.5 text-gray-500 text-sm font-medium mt-3">
                            <MapPin size={16} className="text-gray-400" /> {pet.locationFound}
                        </div>

                        <div className="grid grid-cols-4 gap-3 mt-8">
                            <div className="bg-[#FFF8F3] rounded-2xl p-3 flex flex-col items-center justify-center text-center">
                                <span className="text-gray-400 text-[11px] font-bold mb-0.5">อายุ</span>
                                <span className="text-[#3D312E] font-black text-sm">{pet.ageMonths} เดือน</span>
                            </div>
                            <div className="bg-[#FFF8F3] rounded-2xl p-3 flex flex-col items-center justify-center text-center">
                                <span className="text-gray-400 text-[11px] font-bold mb-0.5">เพศ</span>
                                <span className="text-[#3D312E] font-black text-sm">{genderText}</span>
                            </div>
                            <div className="bg-[#FFF8F3] rounded-2xl p-3 flex flex-col items-center justify-center text-center">
                                <span className="text-gray-400 text-[11px] font-bold mb-0.5">วัคซีน</span>
                                <span className={`font-black text-sm ${pet.isVaccinated ? 'text-green-600' : 'text-[#3D312E]'}`}>
                                    {pet.isVaccinated ? 'ครบแล้ว' : 'ยังไม่ครบ'}
                                </span>
                            </div>
                            <div className="bg-[#FFF8F3] rounded-2xl p-3 flex flex-col items-center justify-center text-center">
                                <span className="text-gray-400 text-[11px] font-bold mb-0.5">ทำหมัน</span>
                                <span className={`font-black text-sm ${pet.isSterilized ? 'text-green-600' : 'text-[#3D312E]'}`}>
                                    {pet.isSterilized ? 'ทำแล้ว' : 'ยังไม่ทำ'}
                                </span>
                            </div>
                        </div>

                        <div className="mt-8">
                            <h3 className="font-extrabold text-[#3D312E] text-base mb-3 flex items-center gap-2">
                                <Bone size={18} className="text-orange-500" /> นิสัยของน้อง
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {pet.personality?.map((trait: string, idx: number) => (
                                    <span key={idx} className="bg-[#FFEFE3] text-[#D97706] px-4 py-1.5 rounded-full text-xs font-bold">
                                        {trait}
                                    </span>
                                )) || <span className="text-sm text-gray-400">ยังไม่มีข้อมูลระบุ</span>}
                            </div>
                        </div>


                        <p className="mt-6 text-gray-600 text-sm font-medium leading-relaxed">
                            {displayDescription}
                        </p>


                        <div className="mt-auto pt-8">
                            {isAdopted ? (

                                <div className="bg-green-50 border border-green-100 p-5 rounded-[2rem] text-center">
                                    <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <Heart size={24} />
                                    </div>
                                    <h3 className="text-green-800 font-bold mb-1">น้อง{pet.name} ได้บ้านที่อบอุ่นแล้ว!</h3>
                                    <p className="text-green-600/80 text-xs font-medium">ขอบคุณทุกการสนับสนุนและการแชร์ เลื่อนดูภาพกระดานความสุขด้านล่างได้เลย</p>
                                </div>
                            ) : (

                                <div className="bg-white border border-[#F0E4D8] p-5 rounded-[1.75rem] shadow-[0_8px_30px_-12px_rgba(243,112,33,0.25)]">
                                    <div className="flex items-center gap-2 text-gray-600 text-sm font-medium mb-3">
                                        <ShieldCheck size={18} className="text-green-600 shrink-0" /> ประเมินความพร้อม 5 ข้อก่อนกรอกฟอร์ม ใช้เวลาไม่ถึง 3 นาที
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setShowAdoptForm(true)}
                                            className="flex-1 bg-[#F37021] hover:bg-[#E06015] text-white font-bold py-4 rounded-full shadow-[0_6px_20px_-6px_rgba(243,112,33,0.6)] hover:shadow-lg transition-all text-base"
                                        >
                                            ขอรับอุปการะน้อง{pet.name}
                                        </button>


                                        {isUrgent && (
                                            <button onClick={handleShare} className="bg-red-50 hover:bg-red-100 text-red-600 px-5 rounded-full font-bold transition-all shadow-sm flex items-center justify-center border border-red-100">
                                                <Share2 size={18} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                    </div>
                </div>

                <div className="mt-12">
                    {isAdopted ? (
                        // Real success-story updates from the database; the owner (or an admin) can post.
                        <SuccessStories animalId={Number(pet.id)} animalName={pet.name} updates={Array.isArray(pet.updates) ? pet.updates : []} />
                    ) : (

                        <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-gray-100 shadow-sm">
                            <h2 className="text-xl font-extrabold text-[#3D312E] mb-8 flex items-center gap-2">
                                <Activity size={24} className="text-red-500" /> ประวัติสุขภาพ
                            </h2>

                            <div className="relative border-l-2 border-gray-100 ml-3 md:ml-4 space-y-8">

                                {healthEntries.length > 0 ? (
                                    [...healthEntries].reverse().map((entry, idx) => (
                                        <div key={idx} className="relative pl-6 md:pl-8">
                                            <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full flex items-center justify-center ${idx === 0 ? 'bg-green-100' : 'bg-gray-100'}`}>
                                                <div className={`w-2 h-2 rounded-full ${idx === 0 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                            </div>
                                            <div className="text-xs font-bold text-gray-400 mb-1">{idx === 0 ? 'ล่าสุด' : 'บันทึกก่อนหน้า'}</div>
                                            <div className={`text-sm ${idx === 0 ? 'font-bold text-gray-700' : 'font-medium text-gray-500'}`}>
                                                {entry}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="relative pl-6 md:pl-8">
                                        <div className="absolute -left-[9px] top-1 w-4 h-4 bg-gray-100 rounded-full flex items-center justify-center">
                                            <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                                        </div>
                                        <div className="text-xs font-bold text-gray-400 mb-1">ล่าสุด</div>
                                        <div className="text-sm font-medium text-gray-500">ยังไม่มีบันทึกสุขภาพ</div>
                                    </div>
                                )}
                                <div className="relative pl-6 md:pl-8">
                                    <div className="absolute -left-[9px] top-1 w-4 h-4 bg-gray-100 rounded-full flex items-center justify-center">
                                        <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                                    </div>
                                    <div className="text-xs font-bold text-gray-400 mb-1">วัคซีนและการทำหมัน</div>
                                    <div className="text-sm font-medium text-gray-500">
                                        {pet.isVaccinated ? 'ได้รับวัคซีนครบแล้ว' : 'ยังได้รับวัคซีนไม่ครบ'} · {pet.isSterilized ? 'ทำหมันแล้ว' : 'ยังไม่ได้ทำหมัน'}
                                    </div>
                                </div>


                                <div className="relative pl-6 md:pl-8">
                                    <div className="absolute -left-[9px] top-1 w-4 h-4 bg-gray-100 rounded-full flex items-center justify-center">
                                        <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                                    </div>
                                    <div className="text-xs font-bold text-gray-400 mb-1">
                                        วันที่รับเข้าดูแล{pet.createdAt ? ` · ${formatDate(pet.createdAt)}` : ''}
                                    </div>
                                    <div className="text-sm font-medium text-gray-500">
                                        พบที่ {pet.locationFound}{pet.province ? (pet.province === 'กรุงเทพมหานคร' ? ` ${pet.province}` : ` จ.${pet.province}`) : ''} และรับเข้าสู่ระบบเพื่อประเมินสุขภาพเบื้องต้น
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

            </div>

            <AdoptionModal
                open={showAdoptForm}
                onClose={() => setShowAdoptForm(false)}
                petId={pet.id}
                petName={pet.name}
            />
        </div>
    );
}