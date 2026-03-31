'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Shield, Eye, Users, Settings, Lock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { UserRole, ROLE_LABELS } from '@/lib/types';
import Button from '@/components/ui/Button';

const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'Thmanyah2024',
};

const ROLES: Array<{
  value: UserRole;
  icon: React.ElementType;
  description: string;
  color: string;
}> = [
  {
    value: 'admin',
    icon: Settings,
    description: 'وصول كامل لجميع البيانات والإعدادات والتقييمات',
    color: '#F24935',
  },
  {
    value: 'hr',
    icon: Shield,
    description: 'الوصول لجميع الموظفين والتقييمات وتعليقات الموارد البشرية',
    color: '#00C17A',
  },
  {
    value: 'manager',
    icon: Users,
    description: 'الوصول لبيانات وتقييمات موظفي إدارتك فقط',
    color: '#0072F9',
  },
  {
    value: 'viewer',
    icon: Eye,
    description: 'عرض البيانات الأساسية فقط بدون تقييمات أو تعليقات حساسة',
    color: '#FFBC0A',
  },
];

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [mode, setMode] = useState<'admin' | 'role'>('admin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('hr');
  const [department, setDepartment] = useState('');
  const [loginError, setLoginError] = useState('');

  const handleAdminLogin = () => {
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
      login('مدير النظام', 'admin@thmanyah.com', 'admin');
      router.push('/dashboard');
    } else {
      setLoginError('اسم المستخدم أو كلمة المرور غير صحيحة');
    }
  };

  const handleRoleLogin = () => {
    if (!name.trim() || !email.trim()) return;
    login(name, email, role, department || undefined);
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-neutral-off-white flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-[520px]"
      >
        {/* Header */}
        <div className="text-center mb-10">
          <div className="bg-brand-black p-4 rounded-2xl inline-block mb-6">
            <Image src="/fonts/thamanyah.png" alt="ثمانية" width={48} height={48} />
          </div>
          <h1 className="font-display font-black text-[32px] mb-2">تسجيل الدخول</h1>
          <p className="font-body text-[15px] text-neutral-muted">
            سجّل دخولك للوصول إلى منصة تحليل التقييمات
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => { setMode('admin'); setLoginError(''); }}
            className={`flex-1 py-3 rounded-lg font-ui font-bold text-[14px] transition-all ${
              mode === 'admin'
                ? 'bg-brand-black text-white'
                : 'bg-white text-neutral-muted border border-neutral-warm-gray hover:border-brand-black'
            }`}
          >
            <Lock className="w-4 h-4 inline-block ml-2" />
            دخول المدير
          </button>
          <button
            onClick={() => { setMode('role'); setLoginError(''); }}
            className={`flex-1 py-3 rounded-lg font-ui font-bold text-[14px] transition-all ${
              mode === 'role'
                ? 'bg-brand-black text-white'
                : 'bg-white text-neutral-muted border border-neutral-warm-gray hover:border-brand-black'
            }`}
          >
            <Users className="w-4 h-4 inline-block ml-2" />
            دخول بالصلاحية
          </button>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-md p-8">
          {mode === 'admin' ? (
            <div className="space-y-5">
              <div>
                <label className="block font-ui font-bold text-[14px] mb-2">اسم المستخدم</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setLoginError(''); }}
                  placeholder="admin"
                  dir="ltr"
                  className="w-full px-4 py-3 rounded-lg border border-neutral-warm-gray font-ui text-[14px] text-left focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green"
                />
              </div>

              <div>
                <label className="block font-ui font-bold text-[14px] mb-2">كلمة المرور</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setLoginError(''); }}
                  placeholder="••••••••••"
                  dir="ltr"
                  className="w-full px-4 py-3 rounded-lg border border-neutral-warm-gray font-ui text-[14px] text-left focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green"
                  onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
                />
              </div>

              {loginError && (
                <p className="text-brand-red font-ui font-bold text-[13px]">{loginError}</p>
              )}

              <Button
                variant="primary"
                size="lg"
                className="w-full mt-4 font-bold text-[16px]"
                onClick={handleAdminLogin}
                disabled={!username.trim() || !password.trim()}
              >
                دخول المنصة
              </Button>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <label className="block font-ui font-bold text-[14px] mb-2">الاسم</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="أدخل اسمك الكامل"
                  className="w-full px-4 py-3 rounded-lg border border-neutral-warm-gray font-ui text-[14px] font-bold focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green"
                />
              </div>

              <div>
                <label className="block font-ui font-bold text-[14px] mb-2">البريد الإلكتروني</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@thmanyah.com"
                  dir="ltr"
                  className="w-full px-4 py-3 rounded-lg border border-neutral-warm-gray font-ui text-[14px] text-left focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green"
                />
              </div>

              {/* Role selection */}
              <div>
                <label className="block font-ui font-bold text-[14px] mb-3">الصلاحية</label>
                <div className="grid grid-cols-2 gap-3">
                  {ROLES.map((r) => {
                    const isSelected = role === r.value;
                    return (
                      <button
                        key={r.value}
                        onClick={() => setRole(r.value)}
                        className={`
                          text-right p-4 rounded-lg border-2 transition-all duration-200
                          ${isSelected
                            ? 'border-brand-green bg-brand-green/5'
                            : 'border-neutral-warm-gray hover:border-neutral-muted'
                          }
                        `}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <r.icon
                            className="w-5 h-5"
                            style={{ color: isSelected ? r.color : '#494C6B' }}
                          />
                          <span className="font-ui font-bold text-[14px]">
                            {ROLE_LABELS[r.value]}
                          </span>
                        </div>
                        <p className="font-ui text-[11px] text-neutral-muted leading-relaxed">
                          {r.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Department for manager role */}
              {role === 'manager' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                >
                  <label className="block font-ui font-bold text-[14px] mb-2">الإدارة</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="مثال: الإنتاج، التقنية، الأعمال"
                    className="w-full px-4 py-3 rounded-lg border border-neutral-warm-gray font-ui text-[14px] font-bold focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green"
                  />
                </motion.div>
              )}

              <Button
                variant="primary"
                size="lg"
                className="w-full mt-4 font-bold text-[16px]"
                onClick={handleRoleLogin}
                disabled={!name.trim() || !email.trim()}
              >
                دخول المنصة
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
