import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getErrorMessage } from '../api';
import type { AdminReport } from '../types/api';
import { REVIEW_LABEL, SPECIES_LABEL, refreshAnimals } from './shared';
import { ConfirmDialog } from './ui';

/** "Reject this report?" — used by the report list and the report detail page. */
export function RejectReportDialog({ report, onClose, onRejected }: {
  report: AdminReport;
  onClose: () => void;
  onRejected?: () => void;
}) {
  const queryClient = useQueryClient();
  const reject = useMutation({
    mutationFn: () => api.patch(`/reports/${report.id}`, { status: 'REJECTED' }),
    onSuccess: async () => {
      await refreshAnimals(queryClient); // refreshes every admin list + the report itself
      onRejected?.();
      onClose();
    },
  });

  return (
    <ConfirmDialog
      title="ปฏิเสธเคสนี้?"
      message={
        <>
          เคสของ {report.reporter.name} ({SPECIES_LABEL[report.species]}, {report.location}) จะไม่ขึ้นเว็บ
          และรูปภาพที่แนบมาจะถูกลบ ผู้แจ้งจะเห็นสถานะ "{REVIEW_LABEL.REJECTED}"
        </>
      }
      confirmLabel="ปฏิเสธเคส"
      pending={reject.isPending}
      error={reject.isError ? getErrorMessage(reject.error) : null}
      onConfirm={() => reject.mutate()}
      onCancel={onClose}
    />
  );
}
