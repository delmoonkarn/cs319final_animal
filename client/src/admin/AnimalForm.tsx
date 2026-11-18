// The add / edit animal form. Reused later when an admin approves a report (pre-filled from it).
import { useId, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from 'react';
import { useMutation } from '@tanstack/react-query';
import { AlertCircle, Loader2, Save, Star, Upload, X } from 'lucide-react';
import { getErrorMessage } from '../api';
import type { AnimalPayload, AnimalStatus, ImageDto } from '../types/api';
import { MAX_IMAGES, MAX_TAGS, serverErrors, toPayload, validate, type AnimalFormValues, type FieldName, type FormErrors } from './animal-form-values';
import { GENDER_LABEL, IMAGE_TYPES, MAX_FILE_MB, SPECIES_LABEL, uploadImages, useProvinces } from './shared';
import { Field, inputClass } from './ui';

type AnimalFormProps = {
  initial: AnimalFormValues;
  submitLabel: string;
  submitting: boolean;
  /** Error of the last save (shown above the buttons, or under the field it's about) */
  saveError: unknown;
  onSubmit: (payload: AnimalPayload) => void;
  onCancel: () => void;
  /** Species can't change (e.g. it comes from a report) */
  lockSpecies?: boolean;
  /** No status choice (an approved report always becomes an AVAILABLE animal) */
  hideStatus?: boolean;
};

export function AnimalForm({ initial, submitLabel, submitting, saveError, onSubmit, onCancel, lockSpecies, hideStatus }: AnimalFormProps) {
  const [values, setValues] = useState(initial);
  // Errors show after the first save attempt, then update live while the admin fixes the fields.
  const [triedToSave, setTriedToSave] = useState(false);
  const errors: FormErrors = triedToSave ? validate(values) : {};
  const set = <K extends keyof AnimalFormValues>(key: K, value: AnimalFormValues[K]) =>
    setValues((current) => ({ ...current, [key]: value }));
  const provinces = useProvinces();
  const ids = { name: useId(), breed: useId(), description: useId(), health: useId(), location: useId(), province: useId(), status: useId() };

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setTriedToSave(true);
    const found = validate(values);
    if (Object.keys(found).length > 0) {
      requestAnimationFrame(() => document.querySelector('[data-invalid="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
      return;
    }
    onSubmit(toPayload(values));
  }

  const fromServer = saveError ? serverErrors(saveError) : {};
  const errorOf = (name: FieldName) => errors[name] ?? fromServer[name];
  const generalError = saveError && Object.keys(fromServer).length === 0 ? getErrorMessage(saveError) : null;

  return (
    <form onSubmit={handleSubmit} noValidate className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
      {/* ================= Left: details ================= */}
      <div className="flex flex-col gap-6">
        <Card title="ข้อมูลพื้นฐาน">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="ชื่อน้อง" error={errorOf('name')} htmlFor={ids.name}>
              <input id={ids.name} data-invalid={Boolean(errorOf('name'))} value={values.name} onChange={(e) => set('name', e.target.value)} className={inputClass} placeholder="เช่น ข้าวตัง" />
            </Field>
            <Field label="สายพันธุ์" error={errorOf('breed')} htmlFor={ids.breed}>
              <input id={ids.breed} data-invalid={Boolean(errorOf('breed'))} value={values.breed} onChange={(e) => set('breed', e.target.value)} className={inputClass} placeholder="เช่น ไทยพันทาง" />
            </Field>
          </div>
          <Field label="ชนิดสัตว์" hint={lockSpecies ? 'ตามที่ผู้แจ้งระบุ' : undefined}>
            <Segmented options={['DOG', 'CAT', 'OTHER'] as const} labels={SPECIES_LABEL} value={values.species} onChange={(v) => set('species', v)} disabled={lockSpecies} />
          </Field>
          <Field label="เพศ">
            <Segmented options={['MALE', 'FEMALE', 'UNKNOWN'] as const} labels={GENDER_LABEL} value={values.gender} onChange={(v) => set('gender', v)} />
          </Field>
          <Field label="อายุ (โดยประมาณ)" error={errorOf('age')}>
            <div className="flex items-center gap-2" data-invalid={Boolean(errorOf('age'))}>
              <div className="w-24"><input type="number" inputMode="numeric" min={0} max={30} value={values.ageYears} onChange={(e) => set('ageYears', e.target.value)} className={inputClass} aria-label="ปี" /></div>
              <span className="text-sm font-bold text-gray-500">ปี</span>
              <div className="w-24 ml-2"><input type="number" inputMode="numeric" min={0} max={11} value={values.ageMonths} onChange={(e) => set('ageMonths', e.target.value)} className={inputClass} aria-label="เดือน" /></div>
              <span className="text-sm font-bold text-gray-500">เดือน</span>
            </div>
          </Field>
        </Card>

        <Card title="นิสัยและเรื่องราว">
          <Field label="นิสัย (แท็ก)" error={errorOf('personality')} hint={`พิมพ์แล้วกด Enter · สูงสุด ${MAX_TAGS} แท็ก`}>
            <TagInput tags={values.personality} onChange={(tags) => set('personality', tags)} invalid={Boolean(errorOf('personality'))} />
          </Field>
          <Field label="เรื่องราวของน้อง" error={errorOf('description')} htmlFor={ids.description}>
            <textarea id={ids.description} data-invalid={Boolean(errorOf('description'))} rows={4} value={values.description} onChange={(e) => set('description', e.target.value)} className={`${inputClass} resize-y`} placeholder="พบน้องที่ไหน เป็นอย่างไร ชอบอะไร..." />
          </Field>
        </Card>

        <Card title="สุขภาพ">
          <Field label="ประวัติสุขภาพ" error={errorOf('healthNote')} hint="บรรทัดละ 1 รายการ เช่น ฉีดวัคซีนรวมแล้ว" htmlFor={ids.health}>
            <textarea id={ids.health} data-invalid={Boolean(errorOf('healthNote'))} rows={4} value={values.healthNote} onChange={(e) => set('healthNote', e.target.value)} className={`${inputClass} resize-y`} placeholder={'ถ่ายพยาธิแล้ว\nฉีดวัคซีนรวมแล้ว'} />
          </Field>
          <div className="flex flex-wrap gap-2">
            <Toggle label="ฉีดวัคซีนแล้ว" checked={values.isVaccinated} onChange={(v) => set('isVaccinated', v)} />
            <Toggle label="ทำหมันแล้ว" checked={values.isSterilized} onChange={(v) => set('isSterilized', v)} />
            <Toggle label="เคสด่วน" checked={values.isUrgent} onChange={(v) => set('isUrgent', v)} danger />
          </div>
        </Card>

        <Card title="สถานที่พบ">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_220px] gap-5">
            <Field label="จุดที่พบ" error={errorOf('locationFound')} htmlFor={ids.location}>
              <input id={ids.location} data-invalid={Boolean(errorOf('locationFound'))} value={values.locationFound} onChange={(e) => set('locationFound', e.target.value)} className={inputClass} placeholder="เช่น ซอยลาดพร้าว 101 เขตบางกะปิ" />
            </Field>
            <Field label="จังหวัด" error={errorOf('province') ?? (provinces.isError ? 'โหลดรายชื่อจังหวัดไม่ได้' : undefined)} htmlFor={ids.province}>
              <select id={ids.province} data-invalid={Boolean(errorOf('province'))} value={values.province} onChange={(e) => set('province', e.target.value)} className={inputClass}>
                <option value="">{provinces.isLoading ? 'กำลังโหลด...' : 'เลือกจังหวัด'}</option>
                {provinces.data?.map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
            </Field>
          </div>
        </Card>
      </div>

      {/* ================= Right: photos, status, save ================= */}
      <div className="flex flex-col gap-6 lg:sticky lg:top-24">
        <Card title="รูปภาพ">
          <PhotoPicker
            images={values.images}
            onChange={(change) => setValues((current) => ({ ...current, images: change(current.images) }))}
            error={errorOf('images')}
          />
        </Card>

        {!hideStatus && (
          <Card title="สถานะ">
            <select id={ids.status} aria-label="สถานะ" value={values.status} onChange={(e) => set('status', e.target.value as AnimalStatus)} className={inputClass}>
              <option value="AVAILABLE">รอบ้าน</option>
              <option value="ADOPTED">ได้บ้านแล้ว (รับเลี้ยงนอกเว็บ)</option>
            </select>
            <p className="text-gray-400 text-xs font-medium -mt-2">
              ตั้งเป็น "ได้บ้านแล้ว" จะปฏิเสธคำขอรับเลี้ยงที่รออยู่ทั้งหมด · ปกติสถานะจะเปลี่ยนเองเมื่ออนุมัติคำขอ
            </p>
          </Card>
        )}

        {generalError && (
          <div role="alert" className="flex items-start gap-2 bg-red-50 text-red-600 text-sm font-medium rounded-xl px-4 py-3">
            <AlertCircle size={18} className="shrink-0 mt-px" /> {generalError}
          </div>
        )}
        <div className="flex gap-3">
          <button type="button" onClick={onCancel} className="flex-1 py-3.5 rounded-xl text-sm font-bold text-gray-600 border border-gray-200 bg-white hover:bg-gray-50 transition">
            ยกเลิก
          </button>
          <button type="submit" disabled={submitting} className="flex-[2] bg-[#F37021] hover:bg-[#E06015] disabled:opacity-60 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all">
            {submitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} {submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}

// ─────────────── Pieces ───────────────

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="bg-white p-6 rounded-[1.5rem] shadow-sm border border-gray-100 flex flex-col gap-5">
      <h3 className="font-black text-[#3D312E] text-[1.05rem]">{title}</h3>
      {children}
    </div>
  );
}

function Segmented<T extends string>({ options, labels, value, onChange, disabled }: {
  options: readonly T[];
  labels: Record<T, string>;
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={value === option}
          disabled={disabled && value !== option}
          onClick={() => onChange(option)}
          className={`py-2.5 rounded-xl border-2 text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
            value === option ? 'border-orange-200 bg-orange-50 text-orange-600' : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
          }`}
        >
          {labels[option]}
        </button>
      ))}
    </div>
  );
}

function Toggle({ label, checked, onChange, danger }: { label: string; checked: boolean; onChange: (checked: boolean) => void; danger?: boolean }) {
  const on = danger ? 'border-red-200 bg-red-50 text-red-500' : 'border-green-200 bg-green-50 text-green-600';
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`px-4 py-2 rounded-full border-2 text-sm font-bold transition ${checked ? on : 'border-gray-100 text-gray-400 hover:border-gray-200'}`}
    >
      {checked ? '✓ ' : ''}{label}
    </button>
  );
}

function TagInput({ tags, onChange, invalid }: { tags: string[]; onChange: (tags: string[]) => void; invalid: boolean }) {
  const [text, setText] = useState('');

  function add() {
    const tag = text.trim().replace(/,$/, '').trim();
    if (tag && !tags.includes(tag) && tags.length < MAX_TAGS) onChange([...tags, tag.slice(0, 40)]);
    setText('');
  }
  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      add();
    } else if (event.key === 'Backspace' && !text && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  }

  return (
    <div data-invalid={invalid} className={`flex flex-wrap items-center gap-2 border rounded-xl px-3 py-2 bg-white focus-within:ring-2 transition-all ${invalid ? 'border-red-300 focus-within:ring-red-100' : 'border-gray-200 focus-within:border-orange-500 focus-within:ring-orange-100'}`}>
      {tags.map((tag) => (
        <span key={tag} className="flex items-center gap-1 bg-orange-50 text-orange-600 text-xs font-bold pl-3 pr-1.5 py-1 rounded-full">
          {tag}
          <button type="button" onClick={() => onChange(tags.filter((t) => t !== tag))} aria-label={`ลบแท็ก ${tag}`} className="hover:bg-orange-100 rounded-full p-0.5">
            <X size={12} />
          </button>
        </span>
      ))}
      {tags.length < MAX_TAGS && (
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={add}
          maxLength={40}
          placeholder={tags.length === 0 ? 'เช่น ขี้อ้อน แล้วกด Enter' : 'เพิ่มแท็ก...'}
          aria-label="เพิ่มแท็กนิสัย"
          className="flex-1 min-w-[120px] py-1 outline-none bg-transparent text-sm font-medium text-gray-700 placeholder-gray-300"
        />
      )}
    </div>
  );
}

/** `onChange` gets a function of the current list, so an upload that finishes later never loses edits. */
function PhotoPicker({ images, onChange, error }: {
  images: ImageDto[];
  onChange: (change: (current: ImageDto[]) => ImageDto[]) => void;
  error?: string;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [problem, setProblem] = useState<string | null>(null);

  const upload = useMutation({
    mutationFn: uploadImages,
    onSuccess: (uploaded) => onChange((current) => [...current, ...uploaded].slice(0, MAX_IMAGES)),
  });

  function pick(files: FileList | null) {
    if (!files || files.length === 0) return;
    const list = [...files];
    const room = MAX_IMAGES - images.length;
    if (list.some((file) => !IMAGE_TYPES.includes(file.type))) return setProblem('รองรับเฉพาะไฟล์ JPG, PNG หรือ WEBP');
    if (list.some((file) => file.size > MAX_FILE_MB * 1024 * 1024)) return setProblem(`แต่ละรูปต้องไม่เกิน ${MAX_FILE_MB} MB`);
    if (list.length > room) return setProblem(`เพิ่มได้อีก ${room} รูป (สูงสุด ${MAX_IMAGES} รูป)`);
    setProblem(null);
    upload.mutate(list);
  }

  const moveToCover = (url: string) =>
    onChange((current) => [...current.filter((image) => image.url === url), ...current.filter((image) => image.url !== url)]);
  const removeImage = (url: string) => onChange((current) => current.filter((image) => image.url !== url));
  const message = problem ?? (upload.isError ? getErrorMessage(upload.error, 'อัปโหลดรูปไม่สำเร็จ') : null) ?? error;

  return (
    <div className="flex flex-col gap-3" data-invalid={Boolean(error)}>
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-3 gap-2">
          {images.map((image, index) => (
            <div key={image.url} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 group">
              <img src={image.thumbUrl} alt={`รูปที่ ${index + 1}`} className="w-full h-full object-cover" />
              {index === 0 ? (
                <span className="absolute left-1.5 top-1.5 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">รูปปก</span>
              ) : (
                <button type="button" onClick={() => moveToCover(image.url)} title="ตั้งเป็นรูปปก" aria-label={`ตั้งรูปที่ ${index + 1} เป็นรูปปก`} className="absolute left-1.5 top-1.5 bg-white/90 text-gray-500 hover:text-orange-500 p-1 rounded-full shadow-sm">
                  <Star size={12} />
                </button>
              )}
              <button type="button" onClick={() => removeImage(image.url)} title="ลบรูป" aria-label={`ลบรูปที่ ${index + 1}`} className="absolute right-1.5 top-1.5 bg-white/90 text-gray-500 hover:text-red-500 p-1 rounded-full shadow-sm">
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {images.length < MAX_IMAGES && (
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          disabled={upload.isPending}
          className={`border-2 border-dashed rounded-2xl py-6 flex flex-col items-center justify-center gap-1.5 transition-colors ${
            error && !problem ? 'border-red-200 bg-red-50/40' : 'border-orange-200 bg-[#FFFBF9] hover:bg-orange-50/50'
          }`}
        >
          {upload.isPending ? <Loader2 size={22} className="text-orange-500 animate-spin" /> : <Upload size={22} className="text-orange-500" />}
          <span className="font-bold text-[#3D312E] text-sm">{upload.isPending ? 'กำลังอัปโหลด...' : 'เพิ่มรูปน้อง'}</span>
          <span className="text-gray-400 text-xs font-medium">JPG / PNG / WEBP · ไม่เกิน {MAX_FILE_MB} MB · {images.length}/{MAX_IMAGES} รูป</span>
        </button>
      )}
      <input
        ref={fileInput}
        type="file"
        accept={IMAGE_TYPES.join(',')}
        multiple
        hidden
        onChange={(e) => { pick(e.target.files); e.target.value = ''; }}
      />
      {message && <p className="text-red-500 text-xs font-medium">{message}</p>}
      {images.length > 1 && !message && <p className="text-gray-400 text-xs font-medium">รูปแรกเป็นรูปปก · กด ☆ เพื่อเปลี่ยน</p>}
    </div>
  );
}
