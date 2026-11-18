// Admin: Adoption Approvals — who asked to adopt which animal, their reason and housing type,
// and the approve / reject decision. Approving one request makes the animal "ได้บ้านแล้ว" and
// rejects every other waiting request for it (done by the server).
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { CheckCircle2, Filter, ImageOff, Mail, Phone, X, XCircle } from 'lucide-react';
import { api, getErrorMessage } from '../api';
import type { AdminAdoptionRequest, Paginated, ReviewStatus } from '../types/api';
import { AdoptionDecisionDialog, type AdoptionDecision } from './AdoptionDecisionDialog';
import { HOUSING_ICON, HOUSING_LABEL, SPECIES_LABEL, adoptionDetailPath, formatDate } from './shared';
import { ClickableRow, FlashBanner, Pager, RequestStatusBadge, RowChevron, StatusBadge } from './ui';

const PAGE_SIZE = 10;
const STATUS_TABS: { value: ReviewStatus | ''; label: string }[] = [
  { value: 'PENDING', label: 'รอพิจารณา' },
  { value: 'APPROVED', label: 'อนุมัติแล้ว' },
  { value: 'REJECTED', label: 'ปฏิเสธแล้ว' },
  { value: '', label: 'ทั้งหมด' },
];

export function AdoptionsPage() {
  const [status, setStatus] = useState<ReviewStatus | ''>('PENDING');
  const [animalFilter, setAnimalFilter] = useState<{ id: number; name: string } | null>(null);
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [decision, setDecision] = useState<AdoptionDecision | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const params = { status: status || undefined, animalId: animalFilter?.id, page, pageSize: PAGE_SIZE };
  const list = useQuery({
    queryKey: ['admin', 'adoption-requests', params],
    queryFn: async () => (await api.get<Paginated<AdminAdoptionRequest>>('/adoption-requests', { params })).data,
    placeholderData: keepPreviousData,
  });
  const requests = list.data?.data ?? [];

  const toggleReason = (id: number) =>
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <section>
      <div className="mb-6">
        <h2 className="text-[1.5rem] font-black text-[#3D312E]">อนุมัติบ้านใหม่</h2>
        <p className="text-gray-400 font-medium text-xs">
          คำขอรับเลี้ยงจากผู้ใช้ · อนุมัติแล้วน้องจะเป็น "ได้บ้านแล้ว" ทันที และคำขออื่นของน้องตัวเดียวกันจะถูกปฏิเสธอัตโนมัติ
        </p>
      </div>

      <FlashBanner message={message} />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="สถานะคำขอ">
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
        {animalFilter && (
          <button
            type="button"
            onClick={() => { setAnimalFilter(null); setPage(1); }}
            className="self-start flex items-center gap-1.5 bg-orange-50 text-orange-600 text-xs font-bold px-3 py-2 rounded-full hover:bg-orange-100 transition"
          >
            <Filter size={13} /> เฉพาะน้อง "{animalFilter.name}" <X size={13} />
          </button>
        )}
      </div>

      <p className="text-gray-400 font-medium text-xs mb-3">พบ {list.isLoading ? '...' : list.data?.pagination.total ?? 0} คำขอ</p>

      <div className="bg-white rounded-[1.5rem] border border-gray-100 shadow-sm overflow-x-auto mb-6">
        <table className="w-full text-sm min-w-[760px]">
          <thead>
            <tr className="text-left text-xs font-bold text-gray-400 border-b border-gray-100">
              <th className="px-5 py-3.5">น้องที่ขอรับเลี้ยง</th>
              <th className="px-3 py-3.5">ผู้ขอรับเลี้ยง</th>
              <th className="px-3 py-3.5">เหตุผล</th>
              <th className="px-3 py-3.5">ที่พัก</th>
              <th className="px-5 py-3.5 text-right">สถานะ / ตัดสินใจ</th>
            </tr>
          </thead>
          <tbody className={list.isPlaceholderData ? 'opacity-60' : ''}>
            {list.isLoading &&
              Array.from({ length: 4 }, (_, i) => (
                <tr key={i} className="border-b border-gray-50 animate-pulse">
                  <td className="px-5 py-3" colSpan={5}><div className="h-14 bg-gray-100 rounded-xl" /></td>
                </tr>
              ))}
            {list.isError && (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-red-500 font-medium">{getErrorMessage(list.error)}</td></tr>
            )}
            {list.isSuccess && requests.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-gray-400 font-medium">ไม่มีคำขอในหมวดนี้</td></tr>
            )}

            {requests.map((request) => {
              const { animal, user } = request;
              const HousingIcon = HOUSING_ICON[request.housingType];
              const isOpen = expanded.has(request.id);
              const isLong = request.reason.length > 90;
              return (
                <ClickableRow key={request.id} to={adoptionDetailPath(request)} className="border-b border-gray-50 last:border-0 align-top">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {animal.coverImage ? (
                        <img src={animal.coverImage.thumbUrl} alt="" className="w-12 h-12 rounded-xl object-cover bg-gray-100 shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-300 shrink-0"><ImageOff size={18} /></div>
                      )}
                      <div className="min-w-0">
                        <Link to={`/pet/${animal.id}`} className="font-extrabold text-[#3D312E] hover:text-orange-500 transition">{animal.name}</Link>
                        <p className="text-xs text-gray-400 font-medium mb-1">{SPECIES_LABEL[animal.species]} · {animal.breed}</p>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={animal.status} />
                          {!animalFilter && (
                            <button
                              type="button"
                              onClick={() => { setAnimalFilter({ id: animal.id, name: animal.name }); setStatus(''); setPage(1); }}
                              className="text-[11px] font-bold text-gray-400 hover:text-orange-500 underline-offset-2 hover:underline whitespace-nowrap"
                            >
                              คำขอทั้งหมดของน้อง
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-4 text-[13px]">
                    <Link to={adoptionDetailPath(request)} className="font-bold text-gray-700 hover:text-orange-500 transition">{user.name}</Link>
                    <a href={`tel:${user.phone}`} className="flex items-center gap-1 text-xs text-gray-500 hover:text-orange-500 font-medium"><Phone size={11} /> {user.phone}</a>
                    <a href={`mailto:${user.email}`} className="flex items-center gap-1 text-xs text-gray-400 hover:text-orange-500 font-medium"><Mail size={11} /> {user.email}</a>
                    <p className="text-[11px] text-gray-300 font-medium mt-1">ส่งคำขอ {formatDate(request.createdAt)}</p>
                  </td>
                  <td className="px-3 py-4 max-w-[240px]">
                    <p className={`text-gray-600 font-medium text-[13px] whitespace-pre-line ${isOpen ? '' : 'line-clamp-3'}`}>{request.reason}</p>
                    {isLong && (
                      <button type="button" onClick={() => toggleReason(request.id)} className="text-[11px] font-bold text-orange-500 hover:underline mt-1">
                        {isOpen ? 'ย่อ' : 'อ่านทั้งหมด'}
                      </button>
                    )}
                  </td>
                  <td className="px-3 py-4">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 bg-gray-50 px-2.5 py-1 rounded-full whitespace-nowrap">
                      <HousingIcon size={13} /> {HOUSING_LABEL[request.housingType]}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-3">
                      {request.status === 'PENDING' && (
                        <div className="flex flex-col items-end gap-2">
                          <button
                            type="button"
                            onClick={() => setDecision({ request, action: 'approve' })}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white bg-green-500 hover:bg-green-600 transition whitespace-nowrap"
                          >
                            <CheckCircle2 size={14} /> อนุมัติ
                          </button>
                          <button
                            type="button"
                            onClick={() => setDecision({ request, action: 'reject' })}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-red-500 border border-red-100 hover:bg-red-50 transition"
                          >
                            <XCircle size={14} /> ปฏิเสธ
                          </button>
                        </div>
                      )}
                      {request.status !== 'PENDING' && <RequestStatusBadge status={request.status} />}
                      <RowChevron />
                    </div>
                  </td>
                </ClickableRow>
              );
            })}
          </tbody>
        </table>
      </div>

      <Pager page={page} totalPages={list.data?.pagination.totalPages ?? 1} onChange={setPage} />

      {decision && (
        <AdoptionDecisionDialog
          decision={decision}
          onClose={() => setDecision(null)}
          onDone={(text) => {
            setMessage(text);
            if (requests.length === 1 && page > 1) setPage(page - 1);
          }}
        />
      )}
    </section>
  );
}
