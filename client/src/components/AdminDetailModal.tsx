// Admin: the detail panel opened by clicking a row in the admin tables (animal, report, request,
// donation). Same look as the admin modal; actions are handled by AdminPage.
import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  X, MapPin, Phone, Mail, Clock, ExternalLink, Pencil, Trash2, CheckCircle2, XCircle, Map as MapIcon,
  Loader2, Heart, Users, User, ImageOff, PawPrint,
} from 'lucide-react';
import { api } from '../api';
import {
  GENDER_LABELS,
  HOUSING_LABELS,
  SPECIES_LABELS,
  authHeaders,
  errorMessage,
  formatAge,
  formatDate,
  formatDateTime,
  type AdminDonation,
  type AdminReport,
  type AdminRequest,
  type AnimalDetail,
  type ImageDto,
  type Paginated,
} from '../lib/admin-api';

export type AdminDetail =
  | { kind: 'animal'; id: number }
  | { kind: 'report'; report: AdminReport }
  | { kind: 'request'; request: AdminRequest }
  | { kind: 'donation'; donation: AdminDonation };

type Props = {
  detail: AdminDetail;
  /** An action for this item is running */
  busy: boolean;
  onClose: () => void;
  onOpen: (detail: AdminDetail) => void;
  onEditAnimal: (animal: { id: number }) => void;
  onDeleteAnimal: (animal: { id: number; name: string }) => void;
  onApproveReport: (report: AdminReport) => void;
  onRejectReport: (report: AdminReport) => void;
  onReviewRequest: (request: AdminRequest, status: 'APPROVED' | 'REJECTED') => void;
  onConfirmDonation: (donation: AdminDonation) => void;
  onDeleteDonation: (donation: AdminDonation) => void;
};

// ─────────────── Small pieces ───────────────

export function ReviewBadge({ status, labels }: { status: string; labels: Record<string, string> }) {
  if (status === 'PENDING') {
    return (
      <span className="inline-flex items-center gap-1 bg-[#FFF5D1] text-[#9A7D0A] text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap">
        <Clock size={12} /> {labels.PENDING}
      </span>
    );
  }
  if (status === 'APPROVED' || status === 'CONFIRMED') {
    return (
      <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap">
        <CheckCircle2 size={12} /> {labels[status]}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap">
      <XCircle size={12} /> {labels[status]}
    </span>
  );
}

const REPORT_LABELS = { PENDING: 'รอตรวจสอบ', APPROVED: 'ขึ้นเว็บแล้ว', REJECTED: 'ปฏิเสธแล้ว' };
const REQUEST_LABELS = { PENDING: 'รออนุมัติ', APPROVED: 'ผ่าน', REJECTED: 'ไม่ผ่าน' };
const DONATION_LABELS = { PENDING: 'รอตรวจสอบ', CONFIRMED: 'ยืนยันแล้ว' };

function AnimalStatusBadge({ status, isUrgent }: { status: 'AVAILABLE' | 'ADOPTED'; isUrgent?: boolean }) {
  if (status === 'ADOPTED') {
    return <span className="inline-flex items-center gap-1 bg-green-600 text-white text-[11px] font-bold px-3 py-1 rounded-full whitespace-nowrap">ได้บ้านแล้ว</span>;
  }
  if (isUrgent) {
    return <span className="inline-flex items-center gap-1 bg-red-500 text-white text-[11px] font-bold px-3 py-1 rounded-full whitespace-nowrap">เคสฉุกเฉิน</span>;
  }
  return <span className="inline-flex items-center gap-1 bg-[#FFF1E4] text-[#D97706] text-[11px] font-bold px-3 py-1 rounded-full whitespace-nowrap">รอหาบ้าน</span>;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="bg-[#FFFBF7] border border-orange-50 rounded-2xl p-4">
      <h3 className="text-xs font-extrabold text-[#7A6A63] mb-2">{title}</h3>
      {children}
    </div>
  );
}

function Contact({ person }: { person: { name: string; phone: string; email: string } }) {
  return (
    <div className="flex flex-col gap-1.5 text-sm">
      <span className="flex items-center gap-2 font-bold text-[#2B211E]"><User size={15} className="text-gray-400" /> {person.name}</span>
      <a href={`tel:${person.phone}`} className="flex items-center gap-2 font-medium text-gray-600 hover:text-[#F37021]">
        <Phone size={15} className="text-gray-400" /> {person.phone}
      </a>
      <a href={`mailto:${person.email}`} className="flex items-center gap-2 font-medium text-gray-600 hover:text-[#F37021] break-all">
        <Mail size={15} className="text-gray-400 shrink-0" /> {person.email}
      </a>
    </div>
  );
}

/** Big photo + thumbnails to switch; click the big photo to open it full size. */
function Gallery({ images, emptyText }: { images: ImageDto[]; emptyText: string }) {
  const [selected, setSelected] = useState(0);
  const photo = images[Math.min(selected, images.length - 1)];
  if (!photo) {
    return (
      <div className="aspect-[16/10] rounded-2xl bg-gray-50 flex flex-col items-center justify-center gap-2 text-gray-300">
        <ImageOff size={28} /> <span className="text-xs font-bold">{emptyText}</span>
      </div>
    );
  }
  return (
    <div>
      <a href={photo.url} target="_blank" rel="noreferrer" title="เปิดรูปขนาดเต็ม">
        <img src={photo.url} alt="" className="w-full aspect-[16/10] max-h-[340px] object-cover rounded-2xl bg-gray-100" />
      </a>
      {images.length > 1 && (
        <div className="flex gap-2 mt-2">
          {images.map((image, i) => (
            <button
              key={image.url}
              type="button"
              onClick={() => setSelected(i)}
              aria-label={`ดูรูปที่ ${i + 1}`}
              aria-pressed={i === selected}
              className={`rounded-xl overflow-hidden border-2 transition cursor-pointer ${i === selected ? 'border-[#F37021]' : 'border-transparent opacity-70 hover:opacity-100'}`}
            >
              <img src={image.thumbUrl} alt="" className="w-16 h-12 object-cover bg-gray-100" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const btnPrimary = 'inline-flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-4 py-2.5 rounded-full transition cursor-pointer disabled:opacity-50';
const btnDanger = 'inline-flex items-center justify-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold px-4 py-2.5 rounded-full transition cursor-pointer disabled:opacity-50';
const btnPlain = 'inline-flex items-center justify-center gap-1.5 border border-gray-200 hover:border-[#F37021] hover:text-[#F37021] text-gray-600 text-xs font-bold px-4 py-2.5 rounded-full transition cursor-pointer disabled:opacity-50';

// ─────────────── The panel ───────────────

export function AdminDetailModal(props: Props) {
  const { detail, onClose, busy } = props;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px] flex items-center justify-center p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className="bg-white rounded-[1.75rem] w-full max-w-[720px] max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" onClick={onClose} aria-label="ปิด" className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 cursor-pointer">
          <X size={20} />
        </button>
        {busy && (
          <div className="absolute top-5 right-14 text-[#F37021]"><Loader2 size={18} className="animate-spin" /></div>
        )}
        {detail.kind === 'animal' && <AnimalView {...props} id={detail.id} />}
        {detail.kind === 'report' && <ReportView {...props} report={detail.report} />}
        {detail.kind === 'request' && <RequestView {...props} request={detail.request} />}
        {detail.kind === 'donation' && <DonationView {...props} donation={detail.donation} />}
      </div>
    </div>
  );
}

// ─────────────── Animal ───────────────

function AnimalView({ id, busy, onOpen, onEditAnimal, onDeleteAnimal }: Props & { id: number }) {
  const animal = useQuery({
    queryKey: ['admin', 'animal-detail', id],
    queryFn: async () => (await api.get<AnimalDetail & { favoriteCount: number; requestCount: number }>(`/animals/${id}`)).data,
  });
  const requests = useQuery({
    queryKey: ['admin', 'requests-of-animal', id],
    queryFn: async () =>
      (await api.get<Paginated<AdminRequest>>('/adoption-requests', { params: { animalId: id, pageSize: 50 }, headers: authHeaders() })).data.data,
  });

  if (animal.isLoading) return <div className="py-16 flex justify-center text-[#F37021]"><Loader2 size={26} className="animate-spin" /></div>;
  if (animal.isError || !animal.data) return <p className="py-10 text-center text-red-500 font-bold text-sm">{errorMessage(animal.error, 'โหลดข้อมูลน้องไม่สำเร็จ')}</p>;
  const a = animal.data;

  return (
    <div className="flex flex-col gap-4">
      <div className="pr-10">
        <span className="text-xs font-extrabold text-[#F37021]">ข้อมูลสัตว์</span>
        <div className="flex flex-wrap items-center gap-2 mt-0.5">
          <h2 className="text-2xl font-black text-[#2B211E]">{a.name}</h2>
          <AnimalStatusBadge status={a.status} isUrgent={a.isUrgent} />
        </div>
      </div>

      <Gallery images={a.images} emptyText="ไม่มีรูปภาพ" />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
        {[
          ['ชนิด / พันธุ์', `${SPECIES_LABELS[a.species]} · ${a.breed}`],
          ['เพศ / อายุ', `${GENDER_LABELS[a.gender]} · ${formatAge(a.ageMonths)}`],
          ['วัคซีน', a.isVaccinated ? 'ครบแล้ว' : 'ยังไม่ครบ'],
          ['ทำหมัน', a.isSterilized ? 'ทำแล้ว' : 'ยังไม่ทำ'],
        ].map(([label, value]) => (
          <div key={label} className="bg-[#FFF8F3] rounded-2xl p-3">
            <div className="text-[11px] font-bold text-gray-400">{label}</div>
            <div className="text-sm font-black text-[#2B211E]">{value}</div>
          </div>
        ))}
      </div>

      <Section title="พื้นที่ที่พบ">
        <p className="flex items-start gap-1.5 text-sm font-medium text-gray-700"><MapPin size={15} className="text-[#F37021] shrink-0 mt-0.5" /> {a.locationFound}, {a.province}</p>
      </Section>

      <Section title="นิสัย">
        <div className="flex flex-wrap gap-1.5">
          {a.personality.map((tag) => (
            <span key={tag} className="bg-[#FFEFE3] text-[#D97706] px-3 py-1 rounded-full text-xs font-bold">{tag}</span>
          ))}
        </div>
      </Section>

      <Section title="เรื่องราวของน้อง">
        <p className="text-sm font-medium text-gray-700 whitespace-pre-line leading-relaxed">{a.description}</p>
      </Section>

      <Section title="ประวัติสุขภาพ">
        <ul className="list-disc pl-5 text-sm font-medium text-gray-700 space-y-0.5">
          {a.healthNote.split('\n').filter((line) => line.trim()).map((line, i) => <li key={i}>{line}</li>)}
        </ul>
      </Section>

      <Section title={`คำขอรับเลี้ยง (${requests.data?.length ?? a.requestCount}) · ถูกใจ ${a.favoriteCount} คน`}>
        {requests.isLoading ? (
          <Loader2 size={18} className="animate-spin text-[#F37021]" />
        ) : !requests.data || requests.data.length === 0 ? (
          <p className="text-xs font-bold text-gray-400">ยังไม่มีคำขอ</p>
        ) : (
          <ul className="divide-y divide-orange-50">
            {requests.data.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => onOpen({ kind: 'request', request: r })}
                  className="w-full flex items-center justify-between gap-3 py-2 text-left hover:text-[#F37021] cursor-pointer"
                >
                  <span className="text-sm font-bold">{r.user.name} <span className="text-xs text-gray-400 font-medium">· {HOUSING_LABELS[r.housingType]} · {formatDate(r.createdAt)}</span></span>
                  <ReviewBadge status={r.status} labels={REQUEST_LABELS} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <div className="flex flex-wrap justify-end gap-2 pt-1">
        <Link to={`/pet/${a.id}`} className={btnPlain}><ExternalLink size={14} /> ดูหน้าเว็บ</Link>
        <button type="button" disabled={busy} onClick={() => onEditAnimal({ id: a.id })} className={btnPlain}><Pencil size={14} /> แก้ไข</button>
        <button type="button" disabled={busy} onClick={() => onDeleteAnimal({ id: a.id, name: a.name })} className={btnDanger}><Trash2 size={14} /> ลบ</button>
      </div>
    </div>
  );
}

// ─────────────── Report ───────────────

function ReportView({ report: r, busy, onOpen, onApproveReport, onRejectReport }: Props & { report: AdminReport }) {
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.location)}`;
  return (
    <div className="flex flex-col gap-4">
      <div className="pr-10">
        <span className="text-xs font-extrabold text-[#F37021]">เคสแจ้งเหตุ</span>
        <div className="flex flex-wrap items-center gap-2 mt-0.5">
          <h2 className="text-2xl font-black text-[#2B211E]">
            แจ้งพบ{r.species === 'OTHER' ? (r.breed || 'สัตว์อื่นๆ') : SPECIES_LABELS[r.species]}
          </h2>
          <ReviewBadge status={r.status} labels={REPORT_LABELS} />
        </div>
      </div>

      <Gallery images={r.images} emptyText="รูปภาพถูกลบแล้ว (เคสถูกปฏิเสธ)" />

      <Section title="อาการ / รายละเอียดที่แจ้ง">
        <p className="text-sm font-medium text-gray-700 whitespace-pre-line leading-relaxed">{r.description}</p>
      </Section>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Section title="จุดที่พบ">
          <p className="flex items-start gap-1.5 text-sm font-medium text-gray-700"><MapPin size={15} className="text-[#F37021] shrink-0 mt-0.5" /> {r.location}</p>
          <a href={mapUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-[#F37021] hover:underline mt-2">
            <MapIcon size={13} /> เปิดใน Google Maps
          </a>
        </Section>
        <Section title="ผู้แจ้ง">
          <Contact person={r.reporter} />
          <p className="flex items-center gap-1.5 text-[11px] text-gray-400 font-medium mt-2"><Clock size={12} /> แจ้งเมื่อ {formatDateTime(r.createdAt)}</p>
        </Section>
      </div>

      {r.animal && (
        <Section title="น้องที่ขึ้นเว็บจากเคสนี้">
          <button
            type="button"
            onClick={() => onOpen({ kind: 'animal', id: r.animal!.id })}
            className="flex items-center gap-2 text-sm font-bold text-[#2B211E] hover:text-[#F37021] cursor-pointer"
          >
            <PawPrint size={15} /> น้อง{r.animal.name}
          </button>
        </Section>
      )}

      {r.status === 'PENDING' && (
        <div className="flex flex-wrap justify-end gap-2 pt-1">
          <button type="button" disabled={busy} onClick={() => onRejectReport(r)} className={btnDanger}><XCircle size={14} /> ปฏิเสธ</button>
          <button type="button" disabled={busy} onClick={() => onApproveReport(r)} className={btnPrimary}><CheckCircle2 size={14} /> อนุมัติให้ขึ้นเว็บ</button>
        </div>
      )}
    </div>
  );
}

// ─────────────── Adoption request ───────────────

function RequestView({ request: r, busy, onOpen, onReviewRequest }: Props & { request: AdminRequest }) {
  // Everyone who asked for the same animal (this request is in the list too).
  const all = useQuery({
    queryKey: ['admin', 'requests-of-animal', r.animal.id],
    queryFn: async () =>
      (await api.get<Paginated<AdminRequest>>('/adoption-requests', { params: { animalId: r.animal.id, pageSize: 50 }, headers: authHeaders() })).data.data,
  });
  const current = all.data?.find((x) => x.id === r.id) ?? r; // fresh status after a change
  const others = (all.data ?? []).filter((x) => x.id !== r.id);
  const othersWaiting = others.filter((x) => x.status === 'PENDING').length;

  return (
    <div className="flex flex-col gap-4">
      <div className="pr-10">
        <span className="text-xs font-extrabold text-[#F37021]">คำขอรับเลี้ยง</span>
        <div className="flex flex-wrap items-center gap-2 mt-0.5">
          <h2 className="text-2xl font-black text-[#2B211E]">
            น้อง{r.animal.name} <span className="text-gray-400 font-bold">โดย {r.user.name}</span>
          </h2>
          <ReviewBadge status={current.status} labels={REQUEST_LABELS} />
        </div>
      </div>

      <button
        type="button"
        onClick={() => onOpen({ kind: 'animal', id: r.animal.id })}
        className="flex items-center gap-3 bg-[#FFFBF7] border border-orange-50 rounded-2xl p-3 text-left hover:border-orange-200 transition cursor-pointer"
      >
        {r.animal.coverImage ? (
          <img src={r.animal.coverImage.thumbUrl} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" />
        ) : (
          <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center text-gray-300 shrink-0"><ImageOff size={18} /></div>
        )}
        <div className="flex-1 min-w-0">
          <div className="font-extrabold text-[#2B211E]">น้อง{r.animal.name}</div>
          <div className="text-xs text-gray-500 font-medium">{SPECIES_LABELS[r.animal.species]} · {r.animal.breed} · {formatAge(r.animal.ageMonths)}</div>
        </div>
        <AnimalStatusBadge status={r.animal.status} isUrgent={r.animal.isUrgent} />
      </button>

      <Section title="เหตุผลที่อยากรับเลี้ยง">
        <p className="text-sm font-medium text-gray-700 whitespace-pre-line leading-relaxed">{r.reason}</p>
        <div className="flex flex-wrap gap-3 mt-3 text-xs font-bold text-gray-500">
          <span className="bg-white border border-gray-100 px-2.5 py-1 rounded-full">ที่อยู่อาศัย: {HOUSING_LABELS[r.housingType] || r.housingType}</span>
          <span className="flex items-center gap-1"><Clock size={12} /> ส่งคำขอเมื่อ {formatDateTime(r.createdAt)}</span>
        </div>
      </Section>

      <Section title="ผู้ยื่นคำขอ">
        <Contact person={r.user} />
      </Section>

      <Section title={`ผู้ขอรับเลี้ยงน้อง${r.animal.name}คนอื่น (${all.isLoading ? '…' : others.length})`}>
        {all.isLoading ? (
          <Loader2 size={18} className="animate-spin text-[#F37021]" />
        ) : others.length === 0 ? (
          <p className="text-xs font-bold text-gray-400">ไม่มีผู้ขอคนอื่น</p>
        ) : (
          <ul className="divide-y divide-orange-50">
            {others.map((o) => (
              <li key={o.id}>
                <button
                  type="button"
                  onClick={() => onOpen({ kind: 'request', request: o })}
                  className="w-full flex items-center justify-between gap-3 py-2 text-left hover:text-[#F37021] cursor-pointer"
                >
                  <span className="text-sm font-bold flex items-center gap-1.5"><Users size={14} className="text-gray-400" /> {o.user.name} <span className="text-xs text-gray-400 font-medium">· {formatDate(o.createdAt)}</span></span>
                  <ReviewBadge status={o.status} labels={REQUEST_LABELS} />
                </button>
              </li>
            ))}
          </ul>
        )}
        {current.status === 'PENDING' && othersWaiting > 0 && (
          <p className="text-xs text-red-500 font-bold mt-2">ถ้าอนุมัติคำขอนี้ คำขออื่นที่รออยู่ {othersWaiting} รายการจะถูกปฏิเสธอัตโนมัติ</p>
        )}
      </Section>

      {current.status === 'PENDING' && (
        <div className="flex flex-wrap justify-end gap-2 pt-1">
          <button type="button" disabled={busy} onClick={() => onReviewRequest(current, 'REJECTED')} className={btnDanger}><XCircle size={14} /> ปฏิเสธ</button>
          <button type="button" disabled={busy} onClick={() => onReviewRequest(current, 'APPROVED')} className={btnPrimary}><CheckCircle2 size={14} /> อนุมัติให้รับเลี้ยง</button>
        </div>
      )}
    </div>
  );
}

// ─────────────── Donation ───────────────

function DonationView({ donation: d, busy, onConfirmDonation, onDeleteDonation }: Props & { donation: AdminDonation }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="pr-10">
        <span className="text-xs font-extrabold text-[#F37021]">รายการบริจาค</span>
        <div className="flex flex-wrap items-center gap-2 mt-0.5">
          <h2 className="text-2xl font-black text-[#2B211E]">{d.total.toLocaleString()} บาท</h2>
          <ReviewBadge status={d.status} labels={DONATION_LABELS} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[220px_1fr] gap-4">
        <a href={d.slip.url} target="_blank" rel="noreferrer" title="เปิดสลิปขนาดเต็ม" className="block">
          <img src={d.slip.url} alt="สลิปโอนเงิน" className="w-full max-h-[380px] object-contain rounded-2xl bg-gray-50 border border-gray-100" />
          <span className="block text-center text-[11px] font-bold text-gray-400 mt-1">กดเพื่อเปิดสลิปขนาดเต็ม</span>
        </a>

        <div className="flex flex-col gap-3">
          <Section title="ผู้บริจาค">
            <Contact person={d.user} />
            <p className="flex items-center gap-1.5 text-[11px] text-gray-400 font-medium mt-2"><Clock size={12} /> {formatDateTime(d.createdAt)}</p>
          </Section>
          <Section title="รายการ">
            <table className="w-full text-sm">
              <tbody>
                {d.items.map((item) => (
                  <tr key={item.id} className="border-b border-orange-50 last:border-0">
                    <td className="py-1.5 font-medium text-gray-700">{item.package.icon} {item.package.name}</td>
                    <td className="py-1.5 text-xs text-gray-500 text-right whitespace-nowrap">{item.quantity} × {item.unitPrice.toLocaleString()}</td>
                    <td className="py-1.5 font-bold text-[#2B211E] text-right whitespace-nowrap pl-3">{item.subtotal.toLocaleString()} ฿</td>
                  </tr>
                ))}
                <tr>
                  <td className="pt-2 font-black text-[#2B211E]" colSpan={2}>รวม</td>
                  <td className="pt-2 font-black text-[#F37021] text-right whitespace-nowrap">{d.total.toLocaleString()} ฿</td>
                </tr>
              </tbody>
            </table>
          </Section>
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-2 pt-1">
        <button type="button" disabled={busy} onClick={() => onDeleteDonation(d)} className={btnDanger}><Trash2 size={14} /> ลบ (สลิปปลอม)</button>
        {d.status === 'PENDING' && (
          <button type="button" disabled={busy} onClick={() => onConfirmDonation(d)} className={btnPrimary}><Heart size={14} /> ยืนยันสลิป</button>
        )}
      </div>
    </div>
  );
}
