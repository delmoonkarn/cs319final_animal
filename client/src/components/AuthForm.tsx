import { useId, useState, type ReactNode } from 'react';
import { AlertCircle, Eye, EyeOff, Loader2, PawPrint, type LucideIcon } from 'lucide-react';

/** Shared building blocks for the login and register pages. */

export function AuthLayout({ title, subtitle, children, footer }: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="bg-[#FAFAFA] flex items-start justify-center px-4 py-12 md:py-16">
      <div className="w-full max-w-[440px]">
        <div className="text-center mb-8">
          <div className="inline-flex bg-orange-100 text-orange-500 p-3.5 rounded-2xl mb-4">
            <PawPrint size={28} />
          </div>
          <h1 className="text-[2rem] font-black text-[#3D312E] leading-tight mb-2">{title}</h1>
          <p className="text-gray-500 font-medium text-sm">{subtitle}</p>
        </div>
        <div className="bg-white p-6 sm:p-8 rounded-[2rem] shadow-sm border border-gray-100">{children}</div>
        <p className="text-center text-sm text-gray-500 font-medium mt-6">{footer}</p>
      </div>
    </div>
  );
}

type TextFieldProps = {
  label: string;
  icon: LucideIcon;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: 'text' | 'email' | 'tel' | 'password';
  placeholder?: string;
  autoComplete?: string;
};

export function TextField({ label, icon: Icon, value, onChange, error, type = 'text', placeholder, autoComplete }: TextFieldProps) {
  const id = useId();
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';

  return (
    <div>
      <label htmlFor={id} className="block text-[#3D312E] font-bold text-sm mb-2">{label}</label>
      <div
        className={`flex items-center gap-2.5 border rounded-xl px-4 bg-white transition-all focus-within:ring-2 ${
          error
            ? 'border-red-300 focus-within:ring-red-100'
            : 'border-gray-200 focus-within:border-orange-500 focus-within:ring-orange-100'
        }`}
      >
        <Icon size={18} className="text-gray-300 shrink-0" />
        <input
          id={id}
          type={isPassword && showPassword ? 'text' : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          className="w-full min-w-0 py-3 outline-none bg-transparent text-sm font-medium text-gray-700 placeholder-gray-300"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((shown) => !shown)}
            aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
            className="text-gray-300 hover:text-gray-500 transition-colors shrink-0"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && <p className="text-red-500 text-xs font-medium mt-1.5">{error}</p>}
    </div>
  );
}

export function FormAlert({ message }: { message: string | null }) {
  if (!message) {
    return null;
  }
  return (
    <div role="alert" className="flex items-start gap-2 bg-red-50 text-red-600 text-sm font-medium rounded-xl px-4 py-3">
      <AlertCircle size={18} className="shrink-0 mt-px" />
      <span>{message}</span>
    </div>
  );
}

export function SubmitButton({ pending, icon: Icon, children }: { pending: boolean; icon: LucideIcon; children: ReactNode }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-[#F37021] hover:bg-[#E06015] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
    >
      {pending ? <Loader2 size={18} className="animate-spin" /> : <Icon size={18} />}
      {children}
    </button>
  );
}

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
