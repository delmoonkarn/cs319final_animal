// Admin: Report Review — community reports of found / injured animals → approve (creates the
// animal listing) or reject.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { CheckCircle2, MapPin, Phone, XCircle } from 'lucide-react';
import { api, getErrorMessage } from '../api';
import type { AdminReport, Paginated, ReviewStatus, Species } from '../types/api';
import { RejectReportDialog } from './RejectReportDialog';
import { REVIEW_LABEL, SPECIES_LABEL, formatDate, useFlashMessage } from './shared';
import { ClickableRow, FlashBanner, Pager, ReviewBadge, RowChevron, inputClass } from './ui';

const PAGE_SIZE = 10;
const STATUS_TABS: { value: ReviewStatus | ''; label: string }[] = [
  { value: 'PENDING', label: REVIEW_LABEL.PENDING },
  { value: 'APPROVED', label: REVIEW_LABEL.APPROVED },
  { value: 'REJECTED', label: REVIEW_LABEL.REJECTED },
  { value: '', label: 'ทั้งหมด' },
];

export function ReportsPage() {
  const flash = useFlashMessage(); // e.g. "approved" from the approve page

  const [status, setStatus] = useState<ReviewStatus | ''>('PENDING');
  const [species, setSpecies] = useState<Species | ''>('');
  const [page, setPage] = useState(1);

  const params = { status: status || undefined, species: species || undefined, page, pageSize: PAGE_SIZE };
  const list = useQuery({
    queryKey: ['admin', 'reports', params],
    queryFn: async () => (await api.get<Paginated<AdminReport>>('/reports', { params })).data,
    placeholderData: keepPreviousData,
  });

  const [toReject, setToReject] = useState<AdminReport | null>(null);

  const reports = list.data?.data ?? [];

  return (
    <section>
      <div className="mb-6">
        <h2 className="text-[1.5rem] font-black text-[#3D312E]">ตรวจสอบเคสแจ้งเหตุ</h2>
        <p className="text-gray-400 font-medium text-xs">
          เคสที่ผู้ใช้แจ้งพบสัตว์จรจัด · อนุมัติแล้วน้องจะขึ้นเว็บเพื่อหาบ้าน
        </p>
      </div>

      <FlashBanner message={flash} />

      {/* Status tabs + species filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="สถานะเคส">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.label}
              type="button"
              role="tab"
              aria-selected={status === tab.value}
              onClick={() => { setStatus(tab.value); setPage(1); }}
              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition ${
                status === tab.value ? 'bg-[#3D312E] text-white' : 'bg-white text-gray-500 border border-gray-200 hover:border-orange-500'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <select
          value={species}
          onChange={(e) => { setSpecies(e.target.value as Species | ''); setPage(1); }}
          aria-label="กรองชนิดสัตว์"
          className={`${inputClass} md:w-40`}
        >
          <option value="">ทุกชนิด</option>
          <option value="DOG">หมา</option>
          <option value="CAT">แมว</option>
          <option value="OTHER">อื่น ๆ</option>
        </select>
      </div>

      <p className="text-gray-400 font-medium text-xs mb-3">พบ {list.isLoading ? '...' : list.data?.pagination.total ?? 0} เคส</p>

      {/* Table */}
      <div className="bg-white rounded-[1.5rem] border border-gray-100 shadow-sm overflow-x-auto mb-6">
        <table className="w-full text-sm min-w-[900px]">
          <thead>
            <tr className="text-left text-xs font-bold text-gray-400 border-b border-gray-100">
              <th className="px-5 py-3.5">รูปภาพ</th>
              <th className="px-3 py-3.5">รายละเอียดเคส</th>
              <th className="px-3 py-3.5">ผู้แจ้ง</th>
              <th className="px-3 py-3.5">สถานะ</th>
              <th className="px-5 py-3.5 text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody className={list.isPlaceholderData ? 'opacity-60' : ''}>
            {list.isLoading &&
              Array.from({ length: 3 }, (_, i) => (
                <tr key={i} className="border-b border-gray-50 animate-pulse">
                  <td className="px-5 py-3" colSpan={5}><div className="h-16 bg-gray-100 rounded-xl" /></td>
                </tr>
              ))}
            {list.isError && (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-red-500 font-medium">{getErrorMessage(list.error)}</td></tr>
            )}
            {list.isSuccess && reports.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-gray-400 font-medium">ไม่มีเคสในหมวดนี้</td></tr>
            )}

            {reports.map((report) => (
              <ClickableRow key={report.id} to={`/admin/reports/${report.id}`} className="border-b border-gray-50 last:border-0 align-top">
                <td className="px-5 py-4">
                  {report.images.length > 0 ? (
                    <div className="flex gap-1.5">
                      {report.images.map((image, i) => (
                        <a key={image.url} href={image.url} target="_blank" rel="noreferrer" title="ดูรูปเต็ม">
                          <img src={image.thumbUrl} alt={`รูปที่ ${i + 1}`} className="w-14 h-14 rounded-xl object-cover bg-gray-100 hover:opacity-80 transition" />
                        </a>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-300 font-medium">ไม่มีรูป (ลบแล้ว)</span>
                  )}
                </td>
                <td className="px-3 py-4 max-w-[340px]">
                  <Link to={`/admin/reports/${report.id}`} className="font-extrabold text-[#3D312E] hover:text-orange-500 transition">
                    {SPECIES_LABEL[report.species]}
                    {report.breed && <span className="font-medium text-gray-500"> · {report.breed}</span>}
                  </Link>
                  <p className="text-gray-600 font-medium text-[13px] my-1 line-clamp-2" title={report.description}>{report.description}</p>
                  <p className="flex items-start gap-1 text-[11px] text-gray-400 font-medium">
                    <MapPin size={12} className="shrink-0 mt-px" /> {report.location}
                  </p>
                </td>
                <td className="px-3 py-4 text-[13px]">
                  <p className="font-bold text-gray-700">{report.reporter.name}</p>
                  <a href={`tel:${report.reporter.phone}`} className="flex items-center gap-1 text-xs text-gray-500 hover:text-orange-500 font-medium">
                    <Phone size={11} /> {report.reporter.phone}
                  </a>
                  <p className="text-xs text-gray-400 font-medium">{report.reporter.email}</p>
                  <p className="text-[11px] text-gray-300 font-medium mt-1 whitespace-nowrap">แจ้งเมื่อ {formatDate(report.createdAt)}</p>
                </td>
                <td className="px-3 py-4">
                  <ReviewBadge status={report.status} />
                  {report.animal && <p className="text-[11px] text-gray-400 font-medium mt-1.5 whitespace-nowrap">→ น้อง "{report.animal.name}"</p>}
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center justify-end gap-3">
                    {report.status === 'PENDING' && (
                      <div className="flex flex-col items-end gap-2">
                        <Link
                          to={`/admin/reports/${report.id}/approve`}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white bg-green-500 hover:bg-green-600 transition whitespace-nowrap"
                        >
                          <CheckCircle2 size={14} /> อนุมัติให้ขึ้นเว็บ
                        </Link>
                        <button
                          type="button"
                          onClick={() => setToReject(report)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-red-500 border border-red-100 hover:bg-red-50 transition"
                        >
                          <XCircle size={14} /> ปฏิเสธ
                        </button>
                      </div>
                    )}
                    <RowChevron />
                  </div>
                </td>
              </ClickableRow>
            ))}
          </tbody>
        </table>
      </div>

      <Pager page={page} totalPages={list.data?.pagination.totalPages ?? 1} onChange={setPage} />

      {toReject && (
        <RejectReportDialog
          report={toReject}
          onClose={() => setToReject(null)}
          // The last report on this page is gone → go back one page.
          onRejected={() => { if (reports.length === 1 && page > 1) setPage(page - 1); }}
        />
      )}
    </section>
  );
}
