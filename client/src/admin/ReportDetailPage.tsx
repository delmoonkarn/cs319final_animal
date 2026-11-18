// Admin: one community report in full (/admin/reports/:id) — all photos, the whole description,
// the reporter's contact details, and the approve / reject actions.
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, Clock, ExternalLink, ImageOff, Loader2, Mail, Map as MapIcon, MapPin, Pencil, Phone, User, XCircle } from 'lucide-react';
import { api, getErrorMessage } from '../api';
import type { AdminReport } from '../types/api';
import { RejectReportDialog } from './RejectReportDialog';
import { SPECIES_LABEL, STATUS_LABEL } from './shared';
import { ReviewBadge } from './ui';

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('th-TH', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function ReportDetailPage() {
  const { id } = useParams();
  const report = useQuery({
    queryKey: ['admin', 'report', id],
    queryFn: async () => (await api.get<AdminReport>(`/reports/${id}`)).data,
  });
  const [selected, setSelected] = useState(0);
  const [rejecting, setRejecting] = useState(false);

  const back = (
    <Link to="/admin/reports" className="inline-flex items-center gap-1.5 text-sm font-bold text-gray-500 hover:text-orange-500 mb-4 transition">
      <ArrowLeft size={16} /> กลับไปรายการเคสแจ้งเหตุ
    </Link>
  );

  if (report.isLoading) {
    return <div className="flex justify-center py-20 text-orange-500"><Loader2 size={28} className="animate-spin" /></div>;
  }
  if (report.isError || !report.data) {
    return (
      <div>
        {back}
        <p className="text-red-500 font-medium">{getErrorMessage(report.error, 'โหลดข้อมูลเคสไม่สำเร็จ')}</p>
      </div>
    );
  }

  const r = report.data;
  const photo = r.images[Math.min(selected, r.images.length - 1)];
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.location)}`;

  return (
    <section>
      {back}

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <h2 className="text-[1.5rem] font-black text-[#3D312E]">
          เคสแจ้งพบ{r.species === 'OTHER' ? 'สัตว์อื่น ๆ' : SPECIES_LABEL[r.species]}
          {r.breed && <span className="text-gray-400 font-bold"> · {r.breed}</span>}
        </h2>
        <ReviewBadge status={r.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
        {/* ================= Left: photos + description ================= */}
        <div className="flex flex-col gap-6">
          <div className="bg-white p-4 rounded-[1.5rem] shadow-sm border border-gray-100">
            {photo ? (
              <>
                <a href={photo.url} target="_blank" rel="noreferrer" title="เปิดรูปขนาดเต็ม">
                  <img src={photo.url} alt={`รูปที่ ${selected + 1}`} className="w-full aspect-[4/3] max-h-[440px] object-cover rounded-2xl bg-gray-100" />
                </a>
                {r.images.length > 1 && (
                  <div className="flex gap-2 mt-3">
                    {r.images.map((image, i) => (
                      <button
                        key={image.url}
                        type="button"
                        onClick={() => setSelected(i)}
                        aria-label={`ดูรูปที่ ${i + 1}`}
                        aria-pressed={i === selected}
                        className={`rounded-xl overflow-hidden border-2 transition ${i === selected ? 'border-orange-500' : 'border-transparent opacity-70 hover:opacity-100'}`}
                      >
                        <img src={image.thumbUrl} alt="" className="w-20 h-16 object-cover bg-gray-100" />
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="aspect-[4/3] max-h-[440px] w-full rounded-2xl bg-gray-50 flex flex-col items-center justify-center gap-2 text-gray-300">
                <ImageOff size={32} />
                <span className="text-sm font-bold">รูปภาพถูกลบแล้ว (เคสถูกปฏิเสธ)</span>
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-[1.5rem] shadow-sm border border-gray-100">
            <h3 className="font-black text-[#3D312E] text-[1.05rem] mb-3">อาการ / รายละเอียดที่แจ้ง</h3>
            <p className="text-gray-600 font-medium text-[15px] leading-relaxed whitespace-pre-line">{r.description}</p>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-5 pt-5 border-t border-gray-100 text-sm">
              <span className="flex items-start gap-1.5 text-gray-600 font-medium">
                <MapPin size={16} className="text-orange-500 shrink-0 mt-0.5" /> {r.location}
              </span>
              <a href={mapUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs font-bold text-orange-500 hover:underline shrink-0">
                <MapIcon size={14} /> เปิดใน Google Maps
              </a>
            </div>
          </div>
        </div>

        {/* ================= Right: reporter, status, actions ================= */}
        <div className="flex flex-col gap-6 lg:sticky lg:top-24">
          <div className="bg-white p-6 rounded-[1.5rem] shadow-sm border border-gray-100 flex flex-col gap-3 text-sm">
            <h3 className="font-black text-[#3D312E] text-[1.05rem]">ผู้แจ้ง</h3>
            <p className="flex items-center gap-2 font-bold text-gray-700"><User size={16} className="text-gray-400" /> {r.reporter.name}</p>
            <a href={`tel:${r.reporter.phone}`} className="flex items-center gap-2 font-medium text-gray-600 hover:text-orange-500">
              <Phone size={16} className="text-gray-400" /> {r.reporter.phone}
            </a>
            <a href={`mailto:${r.reporter.email}`} className="flex items-center gap-2 font-medium text-gray-600 hover:text-orange-500 break-all">
              <Mail size={16} className="text-gray-400 shrink-0" /> {r.reporter.email}
            </a>
            <p className="flex items-center gap-2 font-medium text-gray-400 text-xs pt-2 border-t border-gray-100">
              <Clock size={14} /> แจ้งเมื่อ {formatDateTime(r.createdAt)}
            </p>
          </div>

          <div className="bg-white p-6 rounded-[1.5rem] shadow-sm border border-gray-100 flex flex-col gap-3">
            <h3 className="font-black text-[#3D312E] text-[1.05rem]">การตรวจสอบ</h3>

            {r.status === 'PENDING' && (
              <>
                <p className="text-gray-500 text-xs font-medium">ตรวจสอบรูปและรายละเอียดแล้ว เลือกอนุมัติให้น้องขึ้นเว็บเพื่อหาบ้าน หรือปฏิเสธเคส</p>
                <Link
                  to={`/admin/reports/${r.id}/approve`}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white bg-green-500 hover:bg-green-600 shadow-md transition"
                >
                  <CheckCircle2 size={18} /> อนุมัติให้ขึ้นเว็บ
                </Link>
                <button
                  type="button"
                  onClick={() => setRejecting(true)}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-red-500 border border-red-100 hover:bg-red-50 transition"
                >
                  <XCircle size={18} /> ปฏิเสธ
                </button>
              </>
            )}

            {r.status === 'APPROVED' && r.animal && (
              <>
                <p className="text-gray-500 text-sm font-medium">
                  อนุมัติแล้ว น้องขึ้นเว็บชื่อ <strong className="text-[#3D312E]">"{r.animal.name}"</strong> · สถานะตอนนี้: {STATUS_LABEL[r.animal.status]}
                </p>
                <Link to={`/pet/${r.animal.id}`} className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 transition">
                  <ExternalLink size={16} /> ดูหน้าน้องบนเว็บ
                </Link>
                <Link to={`/admin/animals/${r.animal.id}/edit`} className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-gray-600 border border-gray-200 hover:border-orange-500 hover:text-orange-500 transition">
                  <Pencil size={16} /> แก้ไขข้อมูลน้อง
                </Link>
              </>
            )}
            {r.status === 'APPROVED' && !r.animal && (
              <p className="text-gray-500 text-sm font-medium">อนุมัติแล้ว แต่ข้อมูลน้องที่สร้างจากเคสนี้ถูกลบไปแล้ว</p>
            )}

            {r.status === 'REJECTED' && (
              <p className="text-gray-500 text-sm font-medium">เคสนี้ถูกปฏิเสธแล้ว และไม่ได้ขึ้นเว็บ</p>
            )}
          </div>
        </div>
      </div>

      {rejecting && <RejectReportDialog report={r} onClose={() => setRejecting(false)} />}
    </section>
  );
}
