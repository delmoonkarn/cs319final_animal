import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, getErrorMessage, getErrorStatus } from '../api';
import type { AdminAdoptionRequest, Paginated } from '../types/api';
import { refreshAnimals } from './shared';
import { ConfirmDialog } from './ui';

export type AdoptionDecision = { request: AdminAdoptionRequest; action: 'approve' | 'reject' };

/** Confirm an approve / reject. Approving tells the admin how many other waiting requests get rejected. */
export function AdoptionDecisionDialog({ decision, onClose, onDone }: { decision: AdoptionDecision; onClose: () => void; onDone: (message: string) => void }) {
  const { request, action } = decision;
  const queryClient = useQueryClient();
  const approving = action === 'approve';

  // Other people still waiting for the same animal (they are rejected automatically on approve).
  const waiting = useQuery({
    queryKey: ['admin', 'adoption-requests', { animalId: request.animal.id, status: 'PENDING', pageSize: 1 }],
    queryFn: async () =>
      (await api.get<Paginated<AdminAdoptionRequest>>('/adoption-requests', {
        params: { animalId: request.animal.id, status: 'PENDING', pageSize: 1 },
      })).data.pagination.total,
    enabled: approving,
  });
  const others = Math.max(0, (waiting.data ?? 1) - 1);

  const decide = useMutation({
    mutationFn: () => api.patch(`/adoption-requests/${request.id}`, { status: approving ? 'APPROVED' : 'REJECTED' }),
    onSuccess: async () => {
      await refreshAnimals(queryClient); // admin lists + the public pages (status "ได้บ้านแล้ว")
      onDone(
        approving
          ? `อนุมัติแล้ว: ${request.user.name} ได้รับเลี้ยง "${request.animal.name}"${others ? ` · ปฏิเสธคำขออื่นอัตโนมัติ ${others} รายการ` : ''}`
          : `ปฏิเสธคำขอของ ${request.user.name} แล้ว`,
      );
      onClose();
    },
  });

  // 409 = someone else decided first, or the animal was adopted in the meantime.
  const error = decide.isError
    ? getErrorStatus(decide.error) === 409
      ? 'คำขอนี้หรือน้องตัวนี้ถูกจัดการไปแล้ว กรุณารีเฟรชรายการ'
      : getErrorMessage(decide.error)
    : null;

  return (
    <ConfirmDialog
      tone={approving ? 'success' : 'danger'}
      title={approving ? `อนุมัติให้ ${request.user.name} รับเลี้ยง "${request.animal.name}"?` : `ปฏิเสธคำขอของ ${request.user.name}?`}
      message={
        approving ? (
          <>
            น้องจะเปลี่ยนเป็น "ได้บ้านแล้ว" ทันที
            {waiting.isLoading ? (
              <span className="block mt-2 text-gray-400">กำลังตรวจสอบคำขออื่น...</span>
            ) : (
              others > 0 && <strong className="block text-red-500 mt-2">คำขออื่นที่รออยู่ของน้องตัวนี้ {others} รายการจะถูกปฏิเสธอัตโนมัติ</strong>
            )}
          </>
        ) : (
          <>คำขอรับเลี้ยง "{request.animal.name}" ของ {request.user.name} จะถูกปฏิเสธ (สถานะน้องไม่เปลี่ยน)</>
        )
      }
      confirmLabel={approving ? 'อนุมัติ' : 'ปฏิเสธคำขอ'}
      pending={decide.isPending}
      error={error}
      onConfirm={() => decide.mutate()}
      onCancel={onClose}
    />
  );
}
