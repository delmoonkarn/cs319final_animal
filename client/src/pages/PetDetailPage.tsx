// src/pages/PetDetailPage.tsx
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api';
import {
    ArrowLeft, MapPin, Heart, AlertTriangle,
    Share2, Activity, ShieldCheck, Bone, Users
} from 'lucide-react';

export function PetDetailPage() {
    const { id } = useParams();

    // ดึงข้อมูลสัตว์จรจัดตาม ID
    const { data, isLoading, isError } = useQuery({
        queryKey: ['animal', id],
        queryFn: async () => {
            const response = await api.get(`/animals`);
            const allAnimals = response.data?.data || response.data || [];
            return allAnimals.find((a: any) => a.id.toString() === id);
        }
    });

    if (isLoading) return <div className="min-h-screen flex items-center justify-center font-bold text-xl text-orange-500">กำลังโหลดข้อมูลน้อง...</div>;
    if (isError || !data) return <div className="min-h-screen flex items-center justify-center font-bold text-red-500">ไม่พบข้อมูล หรือเกิดข้อผิดพลาด</div>;

    const pet = data;
    const isAdopted = pet.status === 'ADOPTED';
    const isUrgent = pet.isUrgent;
    const speciesText = pet.species === 'DOG' ? 'น้องหมา' : 'น้องแมว';
    const genderText = pet.gender === 'MALE' ? 'ตัวผู้' : 'ตัวเมีย';
    const imageUrl = pet?.coverImage?.url || pet?.imageUrls?.[0] || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=800';

    // --- สร้างข้อมูลสำรองจำลอง (Mock Data) ไว้ตรงนี้ ---
    const mockDescriptions: Record<string, string> = {
        'ด่าง': 'ด่างถูกรถเฉี่ยวที่ปากซอยรามคำแหง 24 ช่วงแรกจะกลัวคนแปลกหน้า แต่เมื่อคุ้นเคยแล้วจะติดคนมาก ตอนนี้กำลังพักฟื้นหลังผ่าตัดขา',
        'ลูกแก้ว': 'ลูกแก้วถูกพบในกองลังหลังแผงผักในตลาดห้วยขวางตอนอายุราว 3 สัปดาห์ ยังต้องป้อนนมและดูแลใกล้ชิด',
        'ส้มโอ': 'ส้มโออาศัยอยู่แถวร้านข้าวมันไก่ในซอยอารีย์ เป็นแมวส้มที่ขี้อ้อนและชอบนอนตักทุกครั้งที่มีโอกาส'
    };

    const mockHealthNotes: Record<string, string> = {
        'ด่าง': 'ถูกรถเฉี่ยว ขาหน้าขวาเพิ่งผ่าตัดใส่เหล็ก ต้องการบ้านที่ดูแลใกล้ชิด',
        'ลูกแก้ว': 'แข็งแรงดี รอทำวัคซีนเข็มแรกสัปดาห์หน้า',
        'ส้มโอ': 'ทำหมันแล้ว ถ่ายพยาธิแล้ว'
    };

    // กำหนดตัวแปรสำหรับแสดงผล
    const displayDescription = pet.description || mockDescriptions[pet.name] || `${pet.name} ถูกพบที่ ${pet.locationFound} กำลังมองหาบ้านที่อบอุ่นและพร้อมดูแลตลอดไป`;
    const displayHealthNote = pet.healthNote || mockHealthNotes[pet.name] || 'ตรวจสุขภาพเบื้องต้น แข็งแรงดี พร้อมย้ายบ้าน';
    // -----------------------------------------------------------

    // ฟังก์ชันจำลองการกดปุ่มแชร์
    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        alert('คัดลอกลิงก์สำหรับแชร์ขอความช่วยเหลือแล้ว!');
    };

    return (
        <div className="min-h-screen bg-[#FAFAFA] font-sans pb-20 pt-8">
            <div className="max-w-[1100px] mx-auto px-6">

                {/* ปุ่มกลับ */}
                <Link to="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-orange-500 font-bold text-sm mb-8 transition-colors">
                    <ArrowLeft size={16} /> กลับไปดูน้องตัวอื่น
                </Link>

                {/* Layout หลัก: แบ่งซ้าย-ขวา */}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-10 lg:gap-14 items-start">

                    {/* ================= ฝั่งซ้าย: รูปภาพขนาดใหญ่ ================= */}
                    <div className="relative w-full h-[400px] md:h-[500px] rounded-[2.5rem] overflow-hidden shadow-sm border border-gray-100 group">
                        <img src={imageUrl} alt={pet.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />

                        {/* ป้ายสถานะ มุมซ้ายบน */}
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

                        {/* ปุ่มหัวใจ มุมขวาบน */}
                        <button className="absolute top-5 right-5 w-11 h-11 bg-white/95 hover:bg-white rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors shadow-sm">
                            <Heart size={22} />
                        </button>
                    </div>

                    {/* ================= ฝั่งขวา: ข้อมูลเชิงลึก ================= */}
                    <div className="flex flex-col h-full">
                        <span className="text-gray-400 text-sm font-bold mb-1">{speciesText} - {pet.breed || 'พันทาง'}</span>
                        <div className="flex justify-between items-start">
                            <h1 className="text-4xl md:text-[2.75rem] font-black text-[#3D312E] tracking-tight">{pet.name}</h1>
                            <div className="flex items-center gap-1 bg-orange-50 text-orange-600 px-3 py-1 rounded-lg text-xs font-bold mt-2">
                                <Users size={14} /> รอคิว {Math.floor(Math.random() * 5)} คน
                            </div>
                        </div>

                        <div className="flex items-center gap-1.5 text-gray-500 text-sm font-medium mt-3">
                            <MapPin size={16} className="text-gray-400" /> {pet.locationFound}
                        </div>

                        {/* Stats Grid 4 ช่อง */}
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

                        {/* นิสัยของน้อง */}
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

                        {/* Description (เรียกใช้ displayDescription ที่เพิ่งสร้าง) */}
                        <p className="mt-6 text-gray-600 text-sm font-medium leading-relaxed">
                            {displayDescription}
                        </p>

                        {/* ================= กล่อง CTA (ขอรับอุปการะ / แชร์ / Success Story) ================= */}
                        <div className="mt-auto pt-8">
                            {isAdopted ? (
                                // กรณีได้บ้านแล้ว โชว์กล่อง Success Story เล็กๆ
                                <div className="bg-green-50 border border-green-100 p-5 rounded-[2rem] text-center">
                                    <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <Heart size={24} />
                                    </div>
                                    <h3 className="text-green-800 font-bold mb-1">น้อง{pet.name} ได้บ้านที่อบอุ่นแล้ว!</h3>
                                    <p className="text-green-600/80 text-xs font-medium">ขอบคุณทุกการสนับสนุนและการแชร์ เลื่อนดูภาพกระดานความสุขด้านล่างได้เลย</p>
                                </div>
                            ) : (
                                // กรณียังไม่ได้บ้าน โชว์กล่องฟอร์ม
                                <div className="bg-white border border-gray-100 p-5 rounded-[2rem] shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)]">
                                    <div className="flex items-center gap-2 text-green-600 text-[11px] font-bold mb-4 bg-green-50 w-fit px-3 py-1.5 rounded-full">
                                        <ShieldCheck size={14} /> ประเมินความพร้อม 5 ข้อก่อนกรอกฟอร์ม ใช้เวลาไม่ถึง 3 นาที
                                    </div>
                                    <div className="flex gap-3">
                                        <button className="flex-1 bg-[#F37021] hover:bg-[#E06015] text-white font-bold py-3.5 rounded-full shadow-md hover:shadow-lg transition-all text-sm">
                                            ขอรับอุปการะน้อง{pet.name}
                                        </button>

                                        {/* ปุ่มแชร์โผล่มาเฉพาะเคสด่วน */}
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

                {/* ================= ส่วนล่าง: ประวัติสุขภาพ / กระดานความสุข ================= */}
                <div className="mt-12">
                    {isAdopted ? (
                        // ================= กระดานความสุข (Success Stories) =================
                        <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-gray-100 shadow-sm">
                            <h2 className="text-xl font-extrabold text-[#3D312E] mb-6 flex items-center gap-2">
                                <Heart size={24} className="text-pink-500 fill-pink-500" /> กระดานความสุขหลังได้บ้าน
                            </h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {/* ใส่รูปจำลองของไทม์ไลน์ชีวิตใหม่ */}
                                <div className="h-40 rounded-2xl overflow-hidden bg-gray-100"><img src="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&q=80" className="w-full h-full object-cover" /></div>
                                <div className="h-40 rounded-2xl overflow-hidden bg-gray-100"><img src="https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&q=80" className="w-full h-full object-cover" /></div>
                                <div className="h-40 rounded-2xl overflow-hidden bg-gray-100"><img src="https://images.unsplash.com/photo-1537151608805-ea6d11340833?w=400&q=80" className="w-full h-full object-cover" /></div>
                                <div className="h-40 rounded-2xl overflow-hidden bg-gray-100 flex flex-col items-center justify-center text-gray-400 text-sm font-bold border-2 border-dashed border-gray-200">
                                    รออัปเดตเพิ่มเติม...
                                </div>
                            </div>
                        </div>
                    ) : (
                        // ================= ประวัติสุขภาพ (Health History) =================
                        <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-gray-100 shadow-sm">
                            <h2 className="text-xl font-extrabold text-[#3D312E] mb-8 flex items-center gap-2">
                                <Activity size={24} className="text-red-500" /> ประวัติสุขภาพ
                            </h2>

                            <div className="relative border-l-2 border-gray-100 ml-3 md:ml-4 space-y-8">
                                {/* ไทม์ไลน์ 1 */}
                                <div className="relative pl-6 md:pl-8">
                                    <div className="absolute -left-[9px] top-1 w-4 h-4 bg-green-100 rounded-full flex items-center justify-center">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    </div>
                                    <div className="text-xs font-bold text-gray-400 mb-1">ล่าสุด</div>
                                    <div className="text-sm font-bold text-gray-700">
                                        {/* เรียกใช้ displayHealthNote ที่เพิ่งสร้าง */}
                                        {displayHealthNote}
                                    </div>
                                </div>

                                {/* ไทม์ไลน์ 2 (จำลองข้อมูลประวัติ) */}
                                <div className="relative pl-6 md:pl-8">
                                    <div className="absolute -left-[9px] top-1 w-4 h-4 bg-gray-100 rounded-full flex items-center justify-center">
                                        <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                                    </div>
                                    <div className="text-xs font-bold text-gray-400 mb-1">วันที่รับแจ้งเคส</div>
                                    <div className="text-sm font-medium text-gray-500">ภาวะขาดสารอาหาร ให้วิตามินและอาหารสัตว์เล็ก</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}