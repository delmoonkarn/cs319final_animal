// src/pages/LoginPage.tsx
import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Lock, LogIn, Mail } from 'lucide-react';
import { api, getErrorMessage, getErrorStatus } from '../api';
import { useAuthStore } from '../lib/auth-store';
import { AuthLayout, EMAIL_PATTERN, FormAlert, SubmitButton, TextField } from '../components/AuthForm';
import type { AuthResponse } from '../types/api';

export function LoginPage() {
  const user = useAuthStore((state) => state.user);
  const setAuth = useAuthStore((state) => state.setAuth);
  const location = useLocation();
  // Where to go after logging in (set by RequireAuth), e.g. /profile
  const from = (location.state as { from?: string } | null)?.from ?? '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const login = useMutation({
    mutationFn: async () => (await api.post<AuthResponse>('/auth/login', { email, password })).data,
    onSuccess: (data) => setAuth(data.token, data.user),
  });

  // Logged in (already, or just now) → go back to where the user came from.
  if (user) {
    return <Navigate to={from} replace />;
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const next: typeof errors = {};
    if (!EMAIL_PATTERN.test(email.trim())) next.email = 'กรุณากรอกอีเมลให้ถูกต้อง';
    if (!password) next.password = 'กรุณากรอกรหัสผ่าน';
    setErrors(next);
    if (Object.keys(next).length === 0) {
      login.mutate();
    }
  }

  const errorMessage = login.isError
    ? getErrorStatus(login.error) === 401
      ? 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
      : getErrorMessage(login.error)
    : null;

  return (
    <AuthLayout
      title="เข้าสู่ระบบ"
      subtitle="ยินดีต้อนรับกลับมา! เข้าสู่ระบบเพื่อขอรับเลี้ยงและติดตามน้อง ๆ"
      footer={
        <>
          ยังไม่มีบัญชี?{' '}
          <Link to="/register" state={location.state} className="text-orange-500 font-bold hover:underline">
            สมัครสมาชิก
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <FormAlert message={errorMessage} />
        <TextField
          label="อีเมล"
          icon={Mail}
          type="email"
          value={email}
          onChange={setEmail}
          error={errors.email}
          placeholder="you@example.com"
          autoComplete="email"
        />
        <TextField
          label="รหัสผ่าน"
          icon={Lock}
          type="password"
          value={password}
          onChange={setPassword}
          error={errors.password}
          autoComplete="current-password"
        />
        <SubmitButton pending={login.isPending} icon={LogIn}>
          เข้าสู่ระบบ
        </SubmitButton>
      </form>
    </AuthLayout>
  );
}
