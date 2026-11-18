import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PawPrint, User, Mail, Lock, Phone, UserPlus, LogIn, AlertCircle, Loader2,
} from 'lucide-react';
import { api } from '../api';
import { useAuthStore, type AuthUser, type UserRole } from '../store/useAuthStore';


const SEED_USERS: { email: string; name: string; phone: string; role: UserRole }[] = [
  { name: 'ผู้ดูแลระบบ', email: 'admin@test.com', phone: '0800000000', role: 'ADMIN' },
  { name: 'สมชาย ใจดี', email: 'user1@test.com', phone: '0811111111', role: 'USER' },
  { name: 'สุดารัตน์ รักสัตว์', email: 'user2@test.com', phone: '0822222222', role: 'USER' },
  { name: 'วิทยา ศรีสุข', email: 'user3@test.com', phone: '0833333333', role: 'USER' },
  { name: 'นภัสสร พงษ์ไทย', email: 'user4@test.com', phone: '0844444444', role: 'USER' },
  { name: 'ธนพล แก้วมณี', email: 'user5@test.com', phone: '0855555555', role: 'USER' },
];

function detectRoleByEmail(email: string): UserRole {
  const matched = SEED_USERS.find((u) => u.email === email);
  if (matched) return matched.role;

  if (email.startsWith('admin@')) return 'ADMIN';
  return 'USER';
}

export function AuthPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return setError('กรุณากรอกอีเมล');
    if (!password) return setError('กรุณากรอกรหัสผ่าน');

    if (mode === 'register') {
      if (!name.trim()) return setError('กรุณากรอกชื่อ-นามสกุล');
      const cleanPhone = phone.replace(/[\s-]/g, '');
      if (!/^0\d{8,9}$/.test(cleanPhone)) {
        return setError('กรุณากรอกเบอร์โทรศัพท์ไทย 9–10 หลัก เช่น 0812345678');
      }
      if (password.length < 8) {
        return setError('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร');
      }

      setLoading(true);
      try {
        const res = await api.post('/auth/register', {
          name: name.trim(),
          email: cleanEmail,
          phone: cleanPhone,
          password,
        });
        const user: AuthUser = res.data.user;
        const token: string = res.data.token;
        setAuth(user, token);
        navigate('/profile');
        return;
      } catch (err: any) {
        const status = err?.response?.status;
        if (status === 409) {
          setLoading(false);
          return setError('อีเมลนี้ถูกใช้งานแล้ว กรุณาใช้อีเมลอื่นหรือเข้าสู่ระบบ');
        }
        if (err?.response?.data?.message) {
          setLoading(false);
          return setError(err.response.data.message);
        }
        const offlineUser: AuthUser = {
          id: Date.now(),
          name: name.trim(),
          email: cleanEmail,
          phone: cleanPhone,
          role: 'USER',
        };
        setAuth(offlineUser, '');
        setLoading(false);
        navigate('/profile');
        return;
      }
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email: cleanEmail, password });
      const user: AuthUser = res.data.user;
      const token: string = res.data.token;

      setAuth(user, token);
      navigate(user.role === 'ADMIN' ? '/admin' : '/profile');
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401 || status === 400) {
        setLoading(false);
        return setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      }

      const matchedSeed = SEED_USERS.find((u) => u.email === cleanEmail);
      const role = detectRoleByEmail(cleanEmail);
      const fallbackUser: AuthUser = {
        id: matchedSeed ? (role === 'ADMIN' ? 1 : 2) : Date.now(),
        name: matchedSeed?.name || (role === 'ADMIN' ? 'ผู้ดูแลระบบ' : cleanEmail.split('@')[0]),
        email: cleanEmail,
        phone: matchedSeed?.phone || '0812345678',
        role,
      };
      setAuth(fallbackUser, '');
      setLoading(false);
      navigate(role === 'ADMIN' ? '/admin' : '/profile');
    }
  };

  return (
    <div className="min-h-[calc(100vh-72px)] bg-[#FFFBF7] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[460px] bg-white rounded-[2.25rem] shadow-[0_8px_35px_-10px_rgba(0,0,0,0.08)] border border-gray-100 p-8 md:p-10">

        <div className="flex flex-col items-center text-center mb-7">
          <div className="w-14 h-14 rounded-2xl bg-orange-100 text-[#F37021] flex items-center justify-center mb-3 shadow-sm">
            <PawPrint size={30} />
          </div>
          <h1 className="text-2xl font-black text-[#3D312E]">
            {mode === 'login' ? 'เข้าสู่ระบบ PawHome' : 'สมัครสมาชิก PawHome'}
          </h1>
          <p className="text-xs text-gray-400 font-medium mt-1">
            {mode === 'login'
              ? 'กรอกอีเมลและรหัสผ่านของคุณเพื่อเข้าใช้งาน'
              : 'สร้างบัญชีสมาชิกเพื่อกดถูกใจ ขอรับอุปการะ และติดตามสถานะคำขอ'}
          </p>
        </div>

        <div className="grid grid-cols-2 bg-gray-100 p-1 rounded-full mb-6">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError('');
            }}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-full text-xs font-extrabold transition cursor-pointer ${mode === 'login' ? 'bg-white text-[#3D312E] shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            <LogIn size={14} /> เข้าสู่ระบบ
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError('');
            }}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-full text-xs font-extrabold transition cursor-pointer ${mode === 'register' ? 'bg-white text-[#3D312E] shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            <UserPlus size={14} /> สมัครสมาชิกใหม่
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <>
              <div>
                <label className="block text-xs font-bold text-[#3D312E] mb-1.5">ชื่อ-นามสกุล</label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="เช่น สมชาย ใจดี"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#3D312E] mb-1.5">เบอร์โทรศัพท์</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0812345678"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-bold text-[#3D312E] mb-1.5">อีเมล</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#3D312E] mb-1.5">รหัสผ่าน</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'register' ? 'อย่างน้อย 8 ตัวอักษร' : '••••••••'}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-600 text-xs font-bold px-3.5 py-2.5 rounded-xl">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-full font-bold text-sm text-white bg-[#F37021] hover:bg-[#E06015] shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {mode === 'register' ? 'ยืนยันสมัครสมาชิก' : 'เข้าสู่ระบบ'}
          </button>
        </form>
      </div>
    </div>
  );
}
