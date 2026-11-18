// Admin: Pet Management — every animal in a table, with add / edit / delete.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ImageOff, Pencil, Plus, Search, Syringe, Scissors, Trash2 } from 'lucide-react';
import { api, getErrorMessage } from '../api';
import type { AnimalListItem, AnimalStatus, Paginated, Species } from '../types/api';
import { GENDER_LABEL, SPECIES_LABEL, formatAge, refreshAnimals, useDebouncedValue, useFlashMessage } from './shared';
import { ConfirmDialog, FlashBanner, Pager, StatusBadge, UrgentBadge, inputClass } from './ui';

const PAGE_SIZE = 10;

export function AnimalsPage() {
  const queryClient = useQueryClient();
  const flash = useFlashMessage(); // "saved" message from the add / edit page

  const [search, setSearch] = useState('');
  const [species, setSpecies] = useState<Species | ''>('');
  const [status, setStatus] = useState<AnimalStatus | ''>('');
  const [page, setPage] = useState(1);
  const q = useDebouncedValue(search.trim());

  const params = { q: q || undefined, species: species || undefined, status: status || undefined, page, pageSize: PAGE_SIZE };
  const list = useQuery({
    queryKey: ['admin', 'animals', params],
    queryFn: async () => (await api.get<Paginated<AnimalListItem>>('/animals', { params })).data,
    placeholderData: keepPreviousData,
  });

  const [toDelete, setToDelete] = useState<AnimalListItem | null>(null);
  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`/animals/${id}`),
    onSuccess: async () => {
      // The last animal on this page is gone → go back one page.
      if (list.data?.data.length === 1 && page > 1) setPage(page - 1);
      setToDelete(null);
      await refreshAnimals(queryClient);
    },
  });

  const animals = list.data?.data ?? [];
  const total = list.data?.pagination.total ?? 0;

  return (
    <section>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="text-[1.5rem] font-black text-[#3D312E]">ตารางรายการสัตว์</h2>
          <p className="text-gray-400 font-medium text-xs">ทั้งหมด {list.isLoading ? '...' : total} ตัว</p>
        </div>
        <Link
          to="/admin/animals/new"
          className="bg-[#F37021] hover:bg-[#E06015] text-white font-bold text-sm px-5 py-3 rounded-xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
        >
          <Plus size={18} /> เพิ่มข้อมูลสัตว์ใหม่
        </Link>
      </div>

      <FlashBanner message={flash} />

      {/* Search + filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
          <input
            type="search"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="ค้นหาชื่อ สายพันธุ์ สถานที่ หรือจังหวัด..."
            aria-label="ค้นหาสัตว์"
            className={`${inputClass} pl-11`}
          />
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
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value as AnimalStatus | ''); setPage(1); }}
          aria-label="กรองสถานะ"
          className={`${inputClass} md:w-40`}
        >
          <option value="">ทุกสถานะ</option>
          <option value="AVAILABLE">รอบ้าน</option>
          <option value="ADOPTED">ได้บ้านแล้ว</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[1.5rem] border border-gray-100 shadow-sm overflow-x-auto mb-6">
        <table className="w-full text-sm min-w-[860px]">
          <thead>
            <tr className="text-left text-xs font-bold text-gray-400 border-b border-gray-100">
              <th className="px-5 py-3.5">สัตว์</th>
              <th className="px-3 py-3.5">ข้อมูล</th>
              <th className="px-3 py-3.5">สถานที่พบ</th>
              <th className="px-3 py-3.5">สุขภาพ</th>
              <th className="px-3 py-3.5">สถานะ</th>
              <th className="px-5 py-3.5 text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody className={list.isPlaceholderData ? 'opacity-60' : ''}>
            {list.isLoading &&
              Array.from({ length: 4 }, (_, i) => (
                <tr key={i} className="border-b border-gray-50 animate-pulse">
                  <td className="px-5 py-3" colSpan={6}><div className="h-12 bg-gray-100 rounded-xl" /></td>
                </tr>
              ))}

            {list.isError && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-red-500 font-medium">{getErrorMessage(list.error)}</td>
              </tr>
            )}

            {list.isSuccess && animals.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-gray-400 font-medium">ไม่พบข้อมูลสัตว์</td>
              </tr>
            )}

            {animals.map((animal) => (
              <tr key={animal.id} className="border-b border-gray-50 last:border-0 hover:bg-orange-50/30 transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    {animal.coverImage ? (
                      <img src={animal.coverImage.thumbUrl} alt="" className="w-12 h-12 rounded-xl object-cover bg-gray-100 shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-300 shrink-0"><ImageOff size={18} /></div>
                    )}
                    <div className="min-w-0">
                      <Link to={`/pet/${animal.id}`} className="font-extrabold text-[#3D312E] hover:text-orange-500 transition">
                        {animal.name}
                      </Link>
                      <p className="text-xs text-gray-400 font-medium truncate max-w-[180px]">{animal.breed}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3 text-gray-600 font-medium whitespace-nowrap">
                  {SPECIES_LABEL[animal.species]} · {GENDER_LABEL[animal.gender]}
                  <p className="text-xs text-gray-400">{formatAge(animal.ageMonths)}</p>
                </td>
                <td className="px-3 py-3 text-gray-600 font-medium">
                  {animal.province}
                  <p className="text-xs text-gray-400 truncate max-w-[200px]">{animal.locationFound}</p>
                </td>
                <td className="px-3 py-3">
                  <div className="flex flex-col gap-1 text-xs font-bold">
                    <span className={`flex items-center gap-1 ${animal.isVaccinated ? 'text-green-600' : 'text-gray-400'}`}>
                      <Syringe size={12} /> {animal.isVaccinated ? 'ฉีดวัคซีนแล้ว' : 'ยังไม่ฉีดวัคซีน'}
                    </span>
                    <span className={`flex items-center gap-1 ${animal.isSterilized ? 'text-green-600' : 'text-gray-400'}`}>
                      <Scissors size={12} /> {animal.isSterilized ? 'ทำหมันแล้ว' : 'ยังไม่ทำหมัน'}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <div className="flex flex-col items-start gap-1">
                    <StatusBadge status={animal.status} />
                    {animal.isUrgent && <UrgentBadge />}
                  </div>
                </td>
                <td className="px-5 py-3">
                  <div className="flex justify-end gap-2">
                    <Link
                      to={`/admin/animals/${animal.id}/edit`}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-gray-600 border border-gray-200 hover:border-orange-500 hover:text-orange-500 transition"
                    >
                      <Pencil size={14} /> แก้ไข
                    </Link>
                    <button
                      type="button"
                      onClick={() => { remove.reset(); setToDelete(animal); }}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-red-500 border border-red-100 hover:bg-red-50 transition"
                    >
                      <Trash2 size={14} /> ลบ
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pager page={page} totalPages={list.data?.pagination.totalPages ?? 1} onChange={setPage} />

      {toDelete && (
        <ConfirmDialog
          title={`ลบ "${toDelete.name}"?`}
          message={
            <>
              ข้อมูล รูปภาพ คำขอรับเลี้ยง รายการโปรด และเรื่องราวอัปเดตของน้องตัวนี้จะถูกลบทั้งหมด
              <strong className="block text-red-500 mt-2">ลบแล้วกู้คืนไม่ได้</strong>
            </>
          }
          confirmLabel="ลบข้อมูล"
          pending={remove.isPending}
          error={remove.isError ? getErrorMessage(remove.error) : null}
          onConfirm={() => remove.mutate(toDelete.id)}
          onCancel={() => setToDelete(null)}
        />
      )}
    </section>
  );
}
