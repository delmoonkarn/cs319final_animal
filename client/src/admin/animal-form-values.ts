import { getFieldErrors } from '../api';
import type { AnimalDetail, AnimalPayload, AnimalStatus, Gender, ImageDto, Species } from '../types/api';

/** Values, defaults and validation of the add / edit animal form (AnimalForm.tsx). */

export const MAX_IMAGES = 5;
export const MAX_TAGS = 8;

export type AnimalFormValues = {
  name: string;
  species: Species;
  breed: string;
  gender: Gender;
  ageYears: string;
  ageMonths: string;
  personality: string[];
  description: string;
  healthNote: string;
  isVaccinated: boolean;
  isSterilized: boolean;
  isUrgent: boolean;
  images: ImageDto[];
  locationFound: string;
  province: string;
  status: AnimalStatus;
};

export type FieldName = 'name' | 'breed' | 'age' | 'personality' | 'description' | 'healthNote' | 'images' | 'locationFound' | 'province';
export type FormErrors = Partial<Record<FieldName, string>>;

export const EMPTY_ANIMAL: AnimalFormValues = {
  name: '', species: 'DOG', breed: '', gender: 'MALE', ageYears: '0', ageMonths: '0', personality: [],
  description: '', healthNote: '', isVaccinated: false, isSterilized: false, isUrgent: false,
  images: [], locationFound: '', province: '', status: 'AVAILABLE',
};

export function toFormValues(animal: AnimalDetail): AnimalFormValues {
  return {
    name: animal.name, species: animal.species, breed: animal.breed, gender: animal.gender,
    ageYears: String(Math.floor(animal.ageMonths / 12)), ageMonths: String(animal.ageMonths % 12),
    personality: animal.personality, description: animal.description, healthNote: animal.healthNote,
    isVaccinated: animal.isVaccinated, isSterilized: animal.isSterilized, isUrgent: animal.isUrgent,
    images: animal.images, locationFound: animal.locationFound, province: animal.province, status: animal.status,
  };
}

export function toPayload(values: AnimalFormValues): AnimalPayload {
  return {
    name: values.name.trim(), species: values.species, breed: values.breed.trim(), gender: values.gender,
    ageMonths: Number(values.ageYears) * 12 + Number(values.ageMonths),
    personality: values.personality, description: values.description.trim(), healthNote: values.healthNote.trim(),
    isVaccinated: values.isVaccinated, isSterilized: values.isSterilized, isUrgent: values.isUrgent,
    imageUrls: values.images.map((image) => image.url),
    locationFound: values.locationFound.trim(), province: values.province, status: values.status,
  };
}

const isWhole = (text: string, min: number, max: number) => /^\d+$/.test(text) && Number(text) >= min && Number(text) <= max;

/** Same rules as the server, so mistakes show up before sending. */
export function validate(values: AnimalFormValues): FormErrors {
  const errors: FormErrors = {};
  if (!values.name.trim()) errors.name = 'กรุณากรอกชื่อ';
  else if (values.name.trim().length > 60) errors.name = 'ชื่อยาวได้ไม่เกิน 60 ตัวอักษร';
  if (!values.breed.trim()) errors.breed = 'กรุณากรอกสายพันธุ์';
  else if (values.breed.trim().length > 60) errors.breed = 'สายพันธุ์ยาวได้ไม่เกิน 60 ตัวอักษร';
  if (!isWhole(values.ageYears, 0, 30) || !isWhole(values.ageMonths, 0, 11)) errors.age = 'อายุ: ปี 0–30 และเดือน 0–11';
  if (values.personality.length === 0) errors.personality = 'เพิ่มนิสัยอย่างน้อย 1 อย่าง';
  if (!values.description.trim()) errors.description = 'กรุณาเล่าเรื่องราวของน้อง';
  if (!values.healthNote.trim()) errors.healthNote = 'กรุณากรอกประวัติสุขภาพ';
  if (values.images.length === 0) errors.images = 'เพิ่มรูปอย่างน้อย 1 รูป';
  if (!values.locationFound.trim()) errors.locationFound = 'กรุณากรอกสถานที่พบ';
  if (!values.province) errors.province = 'กรุณาเลือกจังหวัด';
  return errors;
}

/** Server field names → form field names (e.g. "imageUrls.0" or "animal.imageUrls.0" → images). */
export function serverErrors(error: unknown): FormErrors {
  const names: Record<string, FieldName> = { ageMonths: 'age', imageUrls: 'images' };
  const errors: FormErrors = {};
  for (const [field, message] of Object.entries(getFieldErrors(error))) {
    const key = field.replace(/^animal\./, '').split('.')[0];
    const name = names[key] ?? (key as FieldName);
    errors[name] ??= message;
  }
  return errors;
}
