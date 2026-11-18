// src/pages/RegisterPage.tsx
import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Lock, Mail, Phone, User, UserPlus } from 'lucide-react';
import { api, getErrorMessage, getErrorStatus, getFieldErrors } from '../api';
import { useAuthStore } from '../lib/auth-store';
import { AuthLayout, EMAIL_PATTERN, FormAlert, SubmitButton, TextField } from '../components/AuthForm';
import type { AuthResponse } from '../types/api';

type Fields = { name: string; email: string; phone: string; password: string; confirmPassword: string };
type FieldErrors = Partial<Record<keyof Fields, string>>;

const EMPTY: Fields = { name: '', email: '', phone: '', password: '', confirmPassword: '' };

/** Same rules as the server, so most mistakes are shown before sending. */
function validate(fields: Fields): FieldErrors {
  const errors: FieldErrors = {};
  if (!fields.name.trim()) errors.name = 'กรุณากรอกชื่อ-นามสกุล';
  if (!EMAIL_PATTERN.test(fields.email.trim())) errors.email = 'กรุณากรอกอีเมลให้ถูกต้อง';
  if (!/^0\d{8,9}$/.test(fields.phone.replace(/[\s-]/g, ''))) errors.phone = 'กรุณากรอกเบอร์โทรให้ถูกต้อง เช่น 0812345678';
  if (fields.password.length < 8) errors.password = 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร';
  if (fields.confirmPassword !== fields.password) errors.confirmPassword = 'รหัสผ่านไม่ตรงกัน';
  return errors;
}

export function RegisterPage() {
  const user = useAuthStore((state) => state.user);
  const setAuth = useAuthStore((state) => state.setAuth);
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/';

  const [fields, setFields] = useState<Fields>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const set = (key: keyof Fields) => (value: string) => setFields((current) => ({ ...current, [key]: value }));

  const register = useMutation({
    mutationFn: async () => {
      const { name, email, phone, password } = fields;
      return (await api.post<AuthResponse>('/auth/register', { name, email, phone, password })).data;
    },
    onSuccess: (data) => setAuth(data.token, data.user),
  });

  if (user) {
    return <Navigate to={from} replace />;
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const next = validate(fields);
    setErrors(next);
    if (Object.keys(next).length === 0) {
      register.mutate();
    }
  }

  // Errors the server found (e.g. the email is already registered) are shown under the field.
  const status = register.isError ? getErrorStatus(register.error) : undefined;
  const serverErrors: FieldErrors = register.isError ? getFieldErrors(register.error) : {};
  if (status === 409) serverErrors.email = 'อีเมลนี้ถูกใช้สมัครสมาชิกแล้ว';
  const fieldError = (key: keyof Fields) => errors[key] ?? serverErrors[key];
  const alert =
    register.isError && status !== 409 && Object.keys(serverErrors).length === 0 ? getErrorMessage(register.error) : null;

  return (
    <AuthLayout
      title="สมัครสมาชิก"
      subtitle="สร้างบัญชีเพื่อขอรับเลี้ยง แจ้งพบสัตว์จร และร่วมบริจาค"
      footer={
        <>
          มีบัญชีอยู่แล้ว?{' '}
          <Link to="/login" state={location.state} className="text-orange-500 font-bold hover:underline">
            เข้าสู่ระบบ
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <FormAlert message={alert} />
        <TextField label="ชื่อ-นามสกุล" icon={User} value={fields.name} onChange={set('name')} error={fieldError('name')} autoComplete="name" />
        <TextField
          label="อีเมล"
          icon={Mail}
          type="email"
          value={fields.email}
          onChange={set('email')}
          error={fieldError('email')}
          placeholder="you@example.com"
          autoComplete="email"
        />
        <TextField
          label="เบอร์โทรศัพท์"
          icon={Phone}
          type="tel"
          value={fields.phone}
          onChange={set('phone')}
          error={fieldError('phone')}
          placeholder="0812345678"
          autoComplete="tel"
        />
        <TextField
          label="รหัสผ่าน"
          icon={Lock}
          type="password"
          value={fields.password}
          onChange={set('password')}
          error={fieldError('password')}
          placeholder="อย่างน้อย 8 ตัวอักษร"
          autoComplete="new-password"
        />
        <TextField
          label="ยืนยันรหัสผ่าน"
          icon={Lock}
          type="password"
          value={fields.confirmPassword}
          onChange={set('confirmPassword')}
          error={fieldError('confirmPassword')}
          autoComplete="new-password"
        />
        <SubmitButton pending={register.isPending} icon={UserPlus}>
          สมัครสมาชิก
        </SubmitButton>
      </form>
    </AuthLayout>
  );
}
