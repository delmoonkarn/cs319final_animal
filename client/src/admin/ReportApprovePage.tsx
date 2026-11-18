// Admin: approve a report (/admin/reports/:id/approve) — the add-animal form, pre-filled from the
// report. Saving creates the animal listing (AVAILABLE) and marks the report approved in one request.
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Clock, Loader2, MapPin, Megaphone, Phone } from 'lucide-react';
import { api, getErrorMessage, getErrorStatus } from '../api';
import type { AdminReport, AnimalPayload, ReportAnimalPayload } from '../types/api';
import { AnimalForm } from './AnimalForm';
import { EMPTY_ANIMAL, type AnimalFormValues } from './animal-form-values';
import { SPECIES_LABEL, formatDate, refreshAnimals } from './shared';
import { ReviewBadge } from './ui';

function fromReport(report: AdminReport): AnimalFormValues {
  return {
    ...EMPTY_ANIMAL,
    species: report.species,
    breed: report.breed ?? '',
    description: report.description,
    images: report.images,
    locationFound: report.location,
  };
}

export function ReportApprovePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const report = useQuery({
    queryKey: ['admin', 'report', id],
    queryFn: async () => (await api.get<AdminReport>(`/reports/${id}`)).data,
  });

  const approve = useMutation({
    mutationFn: (animal: ReportAnimalPayload) => api.patch<AdminReport>(`/reports/${id}`, { status: 'APPROVED', animal }),
    onSuccess: async ({ data }) => {
      await refreshAnimals(queryClient);
      navigate('/admin/reports', { state: { flash: `อนุมัติแล้ว: "${data.animal?.name}" ขึ้นเว็บเพื่อหาบ้านแล้ว` } });
    },
  });

  // Species comes from the report and a new listing is always AVAILABLE, so neither is sent.
  function handleSubmit({ species: _species, status: _status, ...animal }: AnimalPayload) {
    approve.mutate(animal);
  }

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
  if (r.status !== 'PENDING') {
    return (
      <div>
        {back}
        <div className="bg-white p-6 rounded-[1.5rem] border border-gray-100 shadow-sm flex items-center gap-3">
          <ReviewBadge status={r.status} />
          <p className="text-gray-600 font-medium text-sm">เคสนี้ตรวจสอบไปแล้ว ไม่ต้องอนุมัติซ้ำ</p>
        </div>
      </div>
    );
  }

  // Another admin approved / rejected it while this form was open.
  const alreadyReviewed = approve.isError && getErrorStatus(approve.error) === 409;

  return (
    <section>
      {back}
      <h2 className="text-[1.5rem] font-black text-[#3D312E] mb-1">อนุมัติเคสให้ขึ้นเว็บ</h2>
      <p className="text-gray-400 font-medium text-xs mb-6">กรอกข้อมูลน้องให้ครบ ข้อมูลจากเคสถูกใส่ไว้ให้แล้ว · บันทึกแล้วน้องจะขึ้นหน้าเว็บทันที</p>

      {/* What the user reported */}
      <div className="bg-[#FFFBF9] border border-orange-100 rounded-[1.5rem] p-5 mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex gap-2 shrink-0">
          {r.images.map((image, i) => (
            <a key={image.url} href={image.url} target="_blank" rel="noreferrer">
              <img src={image.thumbUrl} alt={`รูปที่ ${i + 1}`} className="w-20 h-20 rounded-xl object-cover bg-gray-100" />
            </a>
          ))}
        </div>
        <div className="min-w-0 text-sm">
          <p className="inline-flex items-center gap-1.5 text-red-500 font-bold text-xs bg-red-50 px-2.5 py-1 rounded-full mb-2">
            <Megaphone size={12} /> เคสที่ผู้ใช้แจ้ง · {SPECIES_LABEL[r.species]}{r.breed ? ` · ${r.breed}` : ''}
          </p>
          <p className="text-gray-700 font-medium mb-2">{r.description}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 font-medium">
            <span className="flex items-center gap-1"><MapPin size={12} /> {r.location}</span>
            <span className="flex items-center gap-1"><Phone size={12} /> {r.reporter.name} · {r.reporter.phone}</span>
            <span className="flex items-center gap-1"><Clock size={12} /> {formatDate(r.createdAt)}</span>
          </div>
        </div>
      </div>

      {alreadyReviewed ? (
        <div role="alert" className="bg-red-50 text-red-600 text-sm font-bold rounded-xl px-4 py-3">
          เคสนี้ถูกตรวจสอบไปแล้วโดยแอดมินคนอื่น · <Link to="/admin/reports" className="underline">กลับไปรายการเคส</Link>
        </div>
      ) : (
        <AnimalForm
          key={r.id}
          initial={fromReport(r)}
          submitLabel="อนุมัติและลงประกาศ"
          submitting={approve.isPending}
          saveError={approve.error}
          onSubmit={handleSubmit}
          onCancel={() => navigate('/admin/reports')}
          lockSpecies
          hideStatus
        />
      )}
    </section>
  );
}
