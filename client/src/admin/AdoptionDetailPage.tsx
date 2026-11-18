// Admin: one adoption request in full (/admin/adoptions/:id?animal=:animalId) — the applicant,
// their reason and housing, the animal they asked for, the other applicants for that animal,
// and the approve / reject decision.
import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, Clock, ExternalLink, ImageOff, Loader2, Mail, MapPin, Pencil, Phone, Scissors, Syringe, User, Users, XCircle } from 'lucide-react';
import { api, getErrorMessage } from '../api';
import type { AdminAdoptionRequest, AnimalDetail, Paginated } from '../types/api';
import { AdoptionDecisionDialog, type AdoptionDecision } from './AdoptionDecisionDialog';
import { GENDER_LABEL, HOUSING_ICON, HOUSING_LABEL, SPECIES_LABEL, adoptionDetailPath, formatAge, formatDate } from './shared';
import { FlashBanner, RequestStatusBadge, StatusBadge, UrgentBadge } from './ui';

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('th-TH', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function AdoptionDetailPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const animalId = Number(searchParams.get('animal'));
  const validAnimal = Number.isInteger(animalId) && animalId > 0;

  // Every request for this animal (this one + the other applicants).
  const requests = useQuery({
    queryKey: ['admin', 'adoption-requests', { animalId, pageSize: 50 }],
    queryFn: async () =>
      (await api.get<Paginated<AdminAdoptionRequest>>('/adoption-requests', { params: { animalId, pageSize: 50 } })).data.data,
    enabled: validAnimal,
  });
  const animal = useQuery({
    queryKey: ['admin', 'animal', String(animalId)],
    queryFn: async () => (await api.get<AnimalDetail>(`/animals/${animalId}`)).data,
    enabled: validAnimal,
  });

  const [decision, setDecision] = useState<AdoptionDecision | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const back = (
    <Link to="/admin/adoptions" className="inline-flex items-center gap-1.5 text-sm font-bold text-gray-500 hover:text-orange-500 mb-4 transition">
      <ArrowLeft size={16} /> กลับไปรายการคำขอรับเลี้ยง
    </Link>
  );

  if (validAnimal && (requests.isLoading || animal.isLoading)) {
    return <div className="flex justify-center py-20 text-orange-500"><Loader2 size={28} className="animate-spin" /></div>;
  }
  const request = requests.data?.find((r) => String(r.id) === id);
  if (!validAnimal || requests.isError || animal.isError || !request || !animal.data) {
    return (
      <div>
        {back}
        <p className="text-red-500 font-medium">
          {requests.isError || animal.isError ? getErrorMessage(requests.error ?? animal.error) : 'ไม่พบคำขอนี้ กรุณาเปิดจากรายการคำขอ'}
        </p>
      </div>
    );
  }

  const a = animal.data;
  const others = requests.data?.filter((r) => r.id !== request.id) ?? [];
  const HousingIcon = HOUSING_ICON[request.housingType];
  const cover = a.images[0];

  return (
    <section>
      {back}

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <h2 className="text-[1.5rem] font-black text-[#3D312E]">
          คำขอรับเลี้ยง "{a.name}" <span className="text-gray-400 font-bold">โดย {request.user.name}</span>
        </h2>
        <RequestStatusBadge status={request.status} />
      </div>

      <FlashBanner message={message} />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
        {/* ================= Left: the request ================= */}
        <div className="flex flex-col gap-6">
          <div className="bg-white p-6 rounded-[1.5rem] shadow-sm border border-gray-100">
            <h3 className="font-black text-[#3D312E] text-[1.05rem] mb-3">เหตุผลที่อยากรับเลี้ยง</h3>
            <p className="text-gray-600 font-medium text-[15px] leading-relaxed whitespace-pre-line">{request.reason}</p>
            <div className="flex flex-wrap items-center gap-3 mt-5 pt-5 border-t border-gray-100 text-sm">
              <span className="inline-flex items-center gap-1.5 font-bold text-gray-700 bg-gray-50 px-3 py-1.5 rounded-full">
                <HousingIcon size={15} /> ที่พัก: {HOUSING_LABEL[request.housingType]}
              </span>
              <span className="inline-flex items-center gap-1.5 text-gray-400 text-xs font-medium">
                <Clock size={14} /> ส่งคำขอเมื่อ {formatDateTime(request.createdAt)}
              </span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[1.5rem] shadow-sm border border-gray-100">
            <h3 className="font-black text-[#3D312E] text-[1.05rem] mb-4 flex items-center gap-2">
              <Users size={18} className="text-orange-500" /> ผู้ขอรับเลี้ยงน้อง{a.name}คนอื่น ({others.length})
            </h3>
            {others.length === 0 ? (
              <p className="text-gray-400 text-sm font-medium">ไม่มีผู้ขอคนอื่น</p>
            ) : (
              <ul className="flex flex-col divide-y divide-gray-50">
                {others.map((other) => (
                  <li key={other.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <Link to={adoptionDetailPath(other)} className="font-bold text-gray-700 hover:text-orange-500 text-sm">{other.user.name}</Link>
                      <p className="text-xs text-gray-400 font-medium truncate">{HOUSING_LABEL[other.housingType]} · {other.reason}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[11px] text-gray-300 font-medium">{formatDate(other.createdAt)}</span>
                      <RequestStatusBadge status={other.status} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {request.status === 'PENDING' && others.some((o) => o.status === 'PENDING') && (
              <p className="text-xs text-red-500 font-bold mt-3">ถ้าอนุมัติคำขอนี้ คำขออื่นที่รอพิจารณาจะถูกปฏิเสธอัตโนมัติ</p>
            )}
          </div>
        </div>

        {/* ================= Right: applicant, animal, decision ================= */}
        <div className="flex flex-col gap-6 lg:sticky lg:top-24">
          <div className="bg-white p-6 rounded-[1.5rem] shadow-sm border border-gray-100 flex flex-col gap-3 text-sm">
            <h3 className="font-black text-[#3D312E] text-[1.05rem]">ผู้ขอรับเลี้ยง</h3>
            <p className="flex items-center gap-2 font-bold text-gray-700"><User size={16} className="text-gray-400" /> {request.user.name}</p>
            <a href={`tel:${request.user.phone}`} className="flex items-center gap-2 font-medium text-gray-600 hover:text-orange-500">
              <Phone size={16} className="text-gray-400" /> {request.user.phone}
            </a>
            <a href={`mailto:${request.user.email}`} className="flex items-center gap-2 font-medium text-gray-600 hover:text-orange-500 break-all">
              <Mail size={16} className="text-gray-400 shrink-0" /> {request.user.email}
            </a>
          </div>

          <div className="bg-white p-4 rounded-[1.5rem] shadow-sm border border-gray-100">
            {cover ? (
              <img src={cover.url} alt={a.name} className="w-full aspect-[4/3] max-h-72 lg:max-h-none object-cover rounded-2xl bg-gray-100" />
            ) : (
              <div className="w-full aspect-[4/3] max-h-72 lg:max-h-none rounded-2xl bg-gray-100 flex items-center justify-center text-gray-300"><ImageOff size={28} /></div>
            )}
            <div className="px-2 pt-4 pb-1 flex flex-col gap-2 text-sm">
              <div className="flex items-center justify-between gap-2">
                <p className="font-black text-[#3D312E] text-lg">{a.name}</p>
                <div className="flex gap-1.5"><StatusBadge status={a.status} />{a.isUrgent && <UrgentBadge />}</div>
              </div>
              <p className="text-gray-500 font-medium">{SPECIES_LABEL[a.species]} · {a.breed} · {GENDER_LABEL[a.gender]} · {formatAge(a.ageMonths)}</p>
              <p className="flex items-start gap-1.5 text-gray-500 font-medium text-xs"><MapPin size={13} className="shrink-0 mt-px" /> {a.locationFound}, {a.province}</p>
              <div className="flex gap-3 text-xs font-bold">
                <span className={`flex items-center gap-1 ${a.isVaccinated ? 'text-green-600' : 'text-gray-300'}`}><Syringe size={12} /> {a.isVaccinated ? 'ฉีดวัคซีนแล้ว' : 'ยังไม่ฉีดวัคซีน'}</span>
                <span className={`flex items-center gap-1 ${a.isSterilized ? 'text-green-600' : 'text-gray-300'}`}><Scissors size={12} /> {a.isSterilized ? 'ทำหมันแล้ว' : 'ยังไม่ทำหมัน'}</span>
              </div>
              <div className="flex gap-2 mt-2">
                <Link to={`/pet/${a.id}`} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 transition">
                  <ExternalLink size={14} /> หน้าน้องบนเว็บ
                </Link>
                <Link to={`/admin/animals/${a.id}/edit`} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-gray-600 border border-gray-200 hover:border-orange-500 hover:text-orange-500 transition">
                  <Pencil size={14} /> แก้ไขข้อมูล
                </Link>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[1.5rem] shadow-sm border border-gray-100 flex flex-col gap-3">
            <h3 className="font-black text-[#3D312E] text-[1.05rem]">การตัดสินใจ</h3>
            {request.status === 'PENDING' ? (
              <>
                <button
                  type="button"
                  onClick={() => setDecision({ request, action: 'approve' })}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white bg-green-500 hover:bg-green-600 shadow-md transition"
                >
                  <CheckCircle2 size={18} /> อนุมัติให้รับเลี้ยง
                </button>
                <button
                  type="button"
                  onClick={() => setDecision({ request, action: 'reject' })}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-red-500 border border-red-100 hover:bg-red-50 transition"
                >
                  <XCircle size={18} /> ปฏิเสธคำขอ
                </button>
              </>
            ) : (
              <p className="text-gray-500 text-sm font-medium">
                {request.status === 'APPROVED'
                  ? `อนุมัติแล้ว ${request.user.name} เป็นผู้รับเลี้ยงน้อง${a.name}`
                  : 'คำขอนี้ถูกปฏิเสธแล้ว'}
              </p>
            )}
          </div>
        </div>
      </div>

      {decision && <AdoptionDecisionDialog decision={decision} onClose={() => setDecision(null)} onDone={setMessage} />}
    </section>
  );
}
