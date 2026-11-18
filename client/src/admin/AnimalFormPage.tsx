// Admin: add a new animal (/admin/animals/new) or edit one (/admin/animals/:id/edit).
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { api, getErrorMessage } from '../api';
import type { AnimalDetail, AnimalPayload } from '../types/api';
import { AnimalForm } from './AnimalForm';
import { EMPTY_ANIMAL, toFormValues } from './animal-form-values';
import { refreshAnimals } from './shared';

export function AnimalFormPage() {
  const { id } = useParams();
  const isEdit = id !== undefined;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const animal = useQuery({
    queryKey: ['admin', 'animal', id],
    queryFn: async () => (await api.get<AnimalDetail>(`/animals/${id}`)).data,
    enabled: isEdit,
  });

  const save = useMutation({
    mutationFn: (payload: AnimalPayload) =>
      isEdit ? api.patch<AnimalDetail>(`/animals/${id}`, payload) : api.post<AnimalDetail>('/animals', payload),
    onSuccess: async ({ data }) => {
      await refreshAnimals(queryClient);
      navigate('/admin', { state: { flash: isEdit ? `บันทึกการแก้ไข "${data.name}" แล้ว` : `เพิ่ม "${data.name}" เข้าระบบแล้ว` } });
    },
  });

  const back = (
    <Link to="/admin" className="inline-flex items-center gap-1.5 text-sm font-bold text-gray-500 hover:text-orange-500 mb-4 transition">
      <ArrowLeft size={16} /> กลับไปตารางรายการสัตว์
    </Link>
  );

  if (isEdit && animal.isLoading) {
    return <div className="flex justify-center py-20 text-orange-500"><Loader2 size={28} className="animate-spin" /></div>;
  }
  if (isEdit && animal.isError) {
    return (
      <div>
        {back}
        <p className="text-red-500 font-medium">{getErrorMessage(animal.error, 'โหลดข้อมูลไม่สำเร็จ')}</p>
      </div>
    );
  }

  return (
    <section>
      {back}
      <h2 className="text-[1.5rem] font-black text-[#3D312E] mb-6">
        {isEdit ? `แก้ไขข้อมูล "${animal.data?.name}"` : 'เพิ่มข้อมูลสัตว์ใหม่'}
      </h2>
      <AnimalForm
        key={id ?? 'new'}
        initial={isEdit && animal.data ? toFormValues(animal.data) : EMPTY_ANIMAL}
        submitLabel={isEdit ? 'บันทึกการแก้ไข' : 'เพิ่มข้อมูลสัตว์'}
        submitting={save.isPending}
        saveError={save.error}
        onSubmit={(payload) => save.mutate(payload)}
        onCancel={() => navigate('/admin')}
      />
    </section>
  );
}
