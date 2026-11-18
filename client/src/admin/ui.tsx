import { useEffect, useId, type MouseEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import type { AnimalStatus, ReviewStatus } from '../types/api';
import { REVIEW_LABEL, STATUS_LABEL } from './shared';

/** Small UI pieces shared by the admin pages (same look as the rest of the site). */

export const inputClass =
  'w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all text-sm font-medium text-gray-700 placeholder-gray-300 bg-white';

export function Field({ label, hint, error, children, htmlFor }: {
  label: string;
  hint?: string;
  error?: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-[#3D312E] font-bold text-sm mb-2">{label}</label>
      {children}
      {error ? (
        <p className="text-red-500 text-xs font-medium mt-1.5">{error}</p>
      ) : (
        hint && <p className="text-gray-400 text-xs font-medium mt-1.5">{hint}</p>
      )}
    </div>
  );
}

/**
 * A table row that opens `to` when clicked anywhere. Buttons and links inside the row keep their
 * own action; selecting text doesn't navigate; Ctrl/⌘-click or middle-click opens a new tab.
 */
export function ClickableRow({ to, className = '', children }: { to: string; className?: string; children: ReactNode }) {
  const navigate = useNavigate();

  function open(event: MouseEvent<HTMLTableRowElement>, newTab: boolean) {
    if ((event.target as HTMLElement).closest('a, button, input, select, textarea, label')) return;
    if (window.getSelection()?.toString()) return;
    if (newTab) window.open(to, '_blank');
    else navigate(to);
  }

  return (
    <tr
      onClick={(event) => open(event, event.ctrlKey || event.metaKey)}
      onAuxClick={(event) => event.button === 1 && open(event, true)}
      className={`cursor-pointer hover:bg-orange-50/50 transition-colors group ${className}`}
    >
      {children}
    </tr>
  );
}

/** The ">" at the end of a clickable row. */
export function RowChevron() {
  return <ChevronRight size={18} className="text-gray-300 group-hover:text-orange-500 group-hover:translate-x-0.5 transition shrink-0" aria-hidden />;
}

export function StatusBadge({ status }: { status: AnimalStatus }) {
  const style = status === 'ADOPTED' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600';
  return <span className={`inline-block text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${style}`}>{STATUS_LABEL[status]}</span>;
}

export function ReviewBadge({ status }: { status: ReviewStatus }) {
  const style = {
    PENDING: 'bg-[#FFF5D1] text-[#9A7D0A]',
    APPROVED: 'bg-green-50 text-green-600',
    REJECTED: 'bg-gray-100 text-gray-500',
  }[status];
  return <span className={`inline-block text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${style}`}>{REVIEW_LABEL[status]}</span>;
}

/** Adoption request status (PENDING reads "waiting for a decision" rather than "waiting for review"). */
export function RequestStatusBadge({ status }: { status: ReviewStatus }) {
  if (status !== 'PENDING') return <ReviewBadge status={status} />;
  return <span className="inline-block text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap bg-[#FFF5D1] text-[#9A7D0A]">รอพิจารณา</span>;
}

export function FlashBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div role="status" className="flex items-center gap-2 bg-green-50 text-green-700 text-sm font-bold rounded-xl px-4 py-3 mb-5">
      <CheckCircle2 size={18} className="shrink-0" /> {message}
    </div>
  );
}

export function UrgentBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-red-50 text-red-500 whitespace-nowrap">
      <AlertTriangle size={11} /> ด่วน
    </span>
  );
}

export function Pager({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (page: number) => void }) {
  if (totalPages <= 1) return null;
  const button = 'p-2 rounded-xl border border-gray-200 bg-white hover:border-orange-500 disabled:opacity-40 disabled:hover:border-gray-200 transition';
  return (
    <div className="flex items-center justify-center gap-3 text-sm font-bold text-gray-500">
      <button type="button" className={button} disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="หน้าก่อนหน้า">
        <ChevronLeft size={16} />
      </button>
      <span>หน้า {page} / {totalPages}</span>
      <button type="button" className={button} disabled={page >= totalPages} onClick={() => onChange(page + 1)} aria-label="หน้าถัดไป">
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

export function ConfirmDialog({ title, message, confirmLabel, pending, error, onConfirm, onCancel, tone = 'danger' }: {
  title: string;
  message: ReactNode;
  confirmLabel: string;
  pending: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
  /** Red confirm button (delete / reject) or green (approve) */
  tone?: 'danger' | 'success';
}) {
  const titleId = useId();
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !pending) onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pending, onCancel]);

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4" onClick={() => !pending && onCancel()}>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="bg-white rounded-[1.75rem] p-6 w-full max-w-sm shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id={titleId} className="text-lg font-black text-[#3D312E] mb-2">{title}</h2>
        <div className="text-sm text-gray-500 font-medium mb-5">{message}</div>
        {error && <p className="text-sm text-red-500 font-medium mb-4">{error}</p>}
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-600 border border-gray-200 hover:bg-gray-50 transition"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            autoFocus
            className={`px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-60 transition flex items-center gap-2 ${
              tone === 'success' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
            }`}
          >
            {pending && <Loader2 size={16} className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
