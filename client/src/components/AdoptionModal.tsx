import { useEffect, useState } from 'react';
import { X, Check, Lock, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { api } from '../api';
import { getActiveUserEmail } from '../store/useAuthStore';

export type StoredAdoptionRequest = {
    id: string;
    userEmail: string;
    petId: string;
    petName: string;
    fullName: string;
    phone: string;
    address: string;
    housingType: 'HOUSE' | 'CONDO' | 'DORM';
    reason: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    createdAt: string;
};

export const ADOPTION_REQUESTS_KEY = 'pawhome_adoption_requests_v2';

export function loadAllStoredRequests(): StoredAdoptionRequest[] {
    try {
        const raw = localStorage.getItem(ADOPTION_REQUESTS_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

export function loadStoredRequests(): StoredAdoptionRequest[] {
    const email = getActiveUserEmail();
    return loadAllStoredRequests().filter((r) => (r.userEmail || 'guest').toLowerCase() === email);
}

export function saveAllStoredRequests(list: StoredAdoptionRequest[]) {
    try {
        localStorage.setItem(ADOPTION_REQUESTS_KEY, JSON.stringify(list));
    } catch {

    }
}

const CHECKLIST = [
    'ฉันมีที่อยู่อาศัยที่ปลอดภัยและเจ้าของที่อนุญาตให้เลี้ยงสัตว์',
    'ฉันพร้อมรับผิดชอบค่าอาหาร วัคซีน และค่ารักษาตลอดชีวิตของน้อง',
    'ฉันมีเวลาดูแล พาไปหาหมอ และใช้เวลาร่วมกับน้องทุกวัน',
    'สมาชิกทุกคนในบ้านยินยอมและไม่มีใครแพ้ขนสัตว์',
    'ฉันยินดีให้ทีมงานติดตามผลและอัปเดตชีวิตใหม่ของน้อง',
];

const HOUSING_OPTIONS = [
    { value: 'HOUSE', label: 'บ้านเดี่ยว / ทาวน์เฮาส์' },
    { value: 'CONDO', label: 'คอนโด (อนุญาตเลี้ยงสัตว์)' },
    { value: 'DORM', label: 'หอพัก / อพาร์ตเมนต์' },
];

type Props = {
    open: boolean;
    onClose: () => void;
    petId: number | string;
    petName: string;
};

const inputCls =
    'w-full h-11 px-4 rounded-xl border border-[#EADBCB] bg-[#FFFBF6] text-sm text-gray-700 placeholder-gray-400 outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100 transition';

export function AdoptionModal({ open, onClose, petId, petName }: Props) {
    const [checked, setChecked] = useState<boolean[]>(CHECKLIST.map(() => false));
    const [form, setForm] = useState({ fullName: '', phone: '', address: '', housingType: '', reason: '' });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const doneCount = checked.filter(Boolean).length;
    const unlocked = doneCount === CHECKLIST.length;
    const formValid =
        form.fullName.trim() && form.phone.trim() && form.address.trim() && form.housingType && form.reason.trim();

    useEffect(() => {
        if (!open) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', onKey);
        return () => {
            document.body.style.overflow = prev;
            window.removeEventListener('keydown', onKey);
        };
    }, [open, onClose]);

    useEffect(() => {
        if (open) {
            setChecked(CHECKLIST.map(() => false));
            setForm({ fullName: '', phone: '', address: '', housingType: '', reason: '' });
            setSuccess(false);

            const existing = loadStoredRequests().find(
                (r) => String(r.petId) === String(petId) && r.status !== 'REJECTED',
            );
            setError(
                existing
                    ? `คุณได้ส่งคำขอรับอุปการะน้อง${petName}ไปแล้ว (ไม่สามารถส่งคำขอซ้ำสำหรับน้องตัวเดิมได้)`
                    : '',
            );
        }
    }, [open, petId, petName]);

    if (!open) return null;

    const toggle = (i: number) => setChecked((prev) => prev.map((v, idx) => (idx === i ? !v : v)));
    const update = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        setForm((f) => ({ ...f, [key]: e.target.value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!unlocked || !formValid) return;


        const stored = loadStoredRequests();
        const duplicateLocal = stored.find(
            (r) => String(r.petId) === String(petId) && r.status !== 'REJECTED',
        );
        if (duplicateLocal) {
            setError(`คุณได้ส่งคำขอรับอุปการะน้อง${petName}ไปแล้ว ไม่สามารถส่งคำขอซ้ำได้`);
            return;
        }

        setSubmitting(true);
        setError('');

        let createdId = `req-${Date.now()}`;
        const token = localStorage.getItem('token');
        const reasonPayload = [
            form.reason.trim(),
            '',
            `ชื่อ-นามสกุล: ${form.fullName.trim()}`,
            `เบอร์โทรศัพท์: ${form.phone.trim()}`,
            `ที่อยู่: ${form.address.trim()}`,
        ].join('\n').slice(0, 1000);

        if (token) {
            try {
                const res = await api.post(
                    '/adoption-requests',
                    { animalId: Number(petId), reason: reasonPayload, housingType: form.housingType },
                    { headers: { Authorization: `Bearer ${token}` } },
                );
                if (res.data?.id) createdId = String(res.data.id);
            } catch (err: any) {
                const status = err?.response?.status;
                const msg: string = err?.response?.data?.message || err?.response?.data?.error || '';
                if (status === 409) {
                    setSubmitting(false);
                    if (msg.toLowerCase().includes('already sent')) {
                        setError(`คุณได้ส่งคำขอรับอุปการะน้อง${petName}ไปแล้ว ไม่สามารถส่งคำขอซ้ำได้`);
                    } else if (msg.toLowerCase().includes('already been adopted')) {
                        setError(`น้อง${petName}ได้บ้านไปแล้ว ไม่สามารถส่งคำขอได้`);
                    } else {
                        setError('คุณได้ส่งคำขอสำหรับสัตว์ตัวนี้ไปแล้ว');
                    }
                    return;
                }
                if (status === 403) {
                    setSubmitting(false);
                    setError('บัญชีผู้ดูแลระบบ (Admin) ไม่สามารถส่งคำขอรับอุปการะได้');
                    return;
                }

            }
        }

        const newReq: StoredAdoptionRequest = {
            id: createdId,
            userEmail: getActiveUserEmail(),
            petId: String(petId),
            petName,
            fullName: form.fullName.trim(),
            phone: form.phone.trim(),
            address: form.address.trim(),
            housingType: form.housingType as 'HOUSE' | 'CONDO' | 'DORM',
            reason: form.reason.trim(),
            status: 'PENDING',
            createdAt: new Date().toISOString(),
        };
        saveAllStoredRequests([newReq, ...loadAllStoredRequests()]);
        setSubmitting(false);
        setSuccess(true);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px]" onClick={onClose}>
            <div
                className="relative w-full max-w-[560px] max-h-[90vh] overflow-y-auto bg-[#FFFBF6] rounded-[1.75rem] shadow-2xl p-6 md:p-7"
                onClick={(e) => e.stopPropagation()}
            >
                <button onClick={onClose} className="absolute top-5 right-5 text-gray-500 hover:text-gray-800 transition" aria-label="ปิด">
                    <X size={20} />
                </button>

                {success ? (
                    <div className="py-12 flex flex-col items-center text-center">
                        <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-4">
                            <CheckCircle2 size={34} />
                        </div>
                        <h2 className="text-xl font-black text-[#2B211E] mb-1">ส่งคำขอเรียบร้อยแล้ว!</h2>
                        <p className="text-sm text-gray-500 mb-6">
                            ทีมงานได้รับคำขอรับอุปการะน้อง{petName}แล้ว สามารถดูสถานะได้ที่หน้าโปรไฟล์ของคุณ
                        </p>
                        <button onClick={onClose} className="bg-[#F37021] hover:bg-[#E06015] text-white font-bold px-8 py-3 rounded-full transition">
                            ปิดหน้าต่าง
                        </button>
                    </div>
                ) : (
                    <>
                        <h2 className="text-xl font-black text-[#2B211E] pr-8">แบบประเมินความพร้อม</h2>
                        <p className="text-sm text-gray-500 mt-0.5">ติ๊กให้ครบทั้ง 5 ข้อเพื่อปลดล็อกฟอร์มขอรับอุปการะน้อง{petName}</p>


                        {error && (
                            <div
                                role="alert"
                                className="mt-4 flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl text-sm font-bold"
                            >
                                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                                <span>{error}</span>
                            </div>
                        )}


                        <div className="mt-5 mb-4">
                            <div className="flex justify-between text-xs mb-1.5">
                                <span className="text-gray-500">ความพร้อม</span>
                                <span className="font-bold text-orange-500">{doneCount}/{CHECKLIST.length}</span>
                            </div>
                            <div className="h-2 rounded-full bg-orange-100 overflow-hidden">
                                <div
                                    className="h-full bg-[#F37021] rounded-full transition-all duration-500"
                                    style={{ width: `${(doneCount / CHECKLIST.length) * 100}%` }}
                                ></div>
                            </div>
                        </div>


                        <div className="space-y-2.5">
                            {CHECKLIST.map((item, i) => (
                                <button
                                    type="button"
                                    key={i}
                                    onClick={() => toggle(i)}
                                    className={`w-full flex items-center gap-3 text-left px-4 py-3.5 rounded-2xl border transition-all ${checked[i]
                                        ? 'bg-[#FFEBD9] border-orange-300'
                                        : 'bg-white border-[#EFE3D6] hover:border-orange-200'
                                        }`}
                                >
                                    <span
                                        className={`w-5 h-5 shrink-0 rounded-full flex items-center justify-center border-2 transition ${checked[i] ? 'bg-[#F37021] border-[#F37021] text-white' : 'border-orange-400'
                                            }`}
                                    >
                                        {checked[i] && <Check size={12} strokeWidth={3.5} />}
                                    </span>
                                    <span className="text-sm text-gray-700">{item}</span>
                                </button>
                            ))}
                        </div>


                        <form onSubmit={handleSubmit} className="relative mt-5 rounded-2xl border border-[#EFE3D6] bg-[#FDF6EE] p-5">
                            <fieldset disabled={!unlocked} className={`space-y-4 transition ${unlocked ? '' : 'blur-[3px] opacity-50 select-none'}`}>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <label className="block">
                                        <span className="block text-sm font-bold text-[#2B211E] mb-1.5">ชื่อ-นามสกุล</span>
                                        <input className={inputCls} value={form.fullName} onChange={update('fullName')} />
                                    </label>
                                    <label className="block">
                                        <span className="block text-sm font-bold text-[#2B211E] mb-1.5">เบอร์โทรศัพท์</span>
                                        <input className={inputCls} type="tel" value={form.phone} onChange={update('phone')} />
                                    </label>
                                </div>
                                <label className="block">
                                    <span className="block text-sm font-bold text-[#2B211E] mb-1.5">ที่อยู่ (เขต/จังหวัด)</span>
                                    <input className={inputCls} value={form.address} onChange={update('address')} />
                                </label>
                                <label className="block">
                                    <span className="block text-sm font-bold text-[#2B211E] mb-1.5">ลักษณะที่อยู่อาศัย</span>
                                    <select
                                        className={`${inputCls} cursor-pointer ${form.housingType ? '' : 'text-gray-400'}`}
                                        value={form.housingType}
                                        onChange={update('housingType')}
                                    >
                                        <option value="" disabled>เช่น บ้านเดี่ยวมีรั้ว, คอนโดที่อนุญาตเลี้ยงสัตว์</option>
                                        {HOUSING_OPTIONS.map((o) => (
                                            <option key={o.value} value={o.value} className="text-gray-700">{o.label}</option>
                                        ))}
                                    </select>
                                </label>
                                <label className="block">
                                    <span className="block text-sm font-bold text-[#2B211E] mb-1.5">ทำไมถึงอยากรับน้องไปดูแล</span>
                                    <textarea
                                        rows={4}
                                        maxLength={800}
                                        className={`${inputCls} h-auto py-3 resize-y`}
                                        value={form.reason}
                                        onChange={update('reason')}
                                    />
                                </label>

                                {error && (
                                    <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-600 px-3.5 py-2.5 rounded-xl text-sm font-bold">
                                        <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={!unlocked || !formValid || submitting}
                                    className="w-full flex items-center justify-center gap-2 bg-[#F37021] hover:bg-[#E06015] disabled:bg-orange-300 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-full shadow-md transition"
                                >
                                    {submitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                                    ยืนยันส่งคำขอรับเลี้ยง
                                </button>
                            </fieldset>

                            {!unlocked && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <Lock size={30} className="text-orange-500 mb-2" />
                                    <p className="text-sm font-medium text-gray-600">ฟอร์มจะปลดล็อกเมื่อติ๊กครบ 5 ข้อ</p>
                                </div>
                            )}
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}
