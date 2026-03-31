'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  Building2,
  Upload,
  LogOut,
  Star,
  Search,
  Shield,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ROLE_LABELS } from '@/lib/types';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout, canViewReviews, canUploadData } = useAuth();

  const navItems = [
    { href: '/dashboard', label: 'لوحة التحكم', icon: LayoutDashboard, show: true },
    { href: '/search', label: 'البحث الذكي', icon: Search, show: true },
    { href: '/employees', label: 'الموظفون', icon: Users, show: true },
    { href: '/reviews', label: 'تقييمات الأداء', icon: Star, show: canViewReviews },
    { href: '/leaders', label: 'تقييمات القادة', icon: Shield, show: canViewReviews },
    { href: '/probation', label: 'فترات التجربة', icon: ClipboardCheck, show: canViewReviews },
    { href: '/departments', label: 'الإدارات', icon: Building2, show: true },
  ];

  return (
    <aside className="fixed right-0 top-0 h-screen w-[260px] bg-brand-black flex flex-col z-50">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-white/10">
        <Image
          src="/fonts/thamanyah.png"
          alt="ثمانية"
          width={36}
          height={36}
          className="rounded-md"
        />
        <span className="font-display font-black text-white text-[18px]">
          منصة التقييمات
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.filter(i => i.show).map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname?.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg text-[14px] font-ui font-bold
                transition-all duration-200
                ${isActive
                  ? 'bg-brand-green/15 text-brand-green border-r-2 border-brand-green'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
                }
              `}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="px-3 py-4 border-t border-white/10 space-y-1">
        {canUploadData && (
          <Link
            href="/dashboard?upload=true"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-[14px] font-ui font-bold text-white/70 hover:text-white hover:bg-white/5 transition-all duration-200"
          >
            <Upload className="w-5 h-5" />
            <span>رفع ملف</span>
          </Link>
        )}
        <Link
          href="/"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-[14px] font-ui font-bold text-white/70 hover:text-white hover:bg-white/5 transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span>الصفحة الرئيسية</span>
        </Link>
      </div>

      {/* User info */}
      {user && (
        <div className="px-4 py-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-brand-green/20 flex items-center justify-center flex-shrink-0">
              <Shield className="w-4 h-4 text-brand-green" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-ui font-bold text-[13px] text-white truncate">{user.name}</p>
              <p className="font-ui text-[11px] text-white/40">{ROLE_LABELS[user.role]}</p>
            </div>
            <button
              onClick={() => { logout(); window.location.href = '/login'; }}
              className="text-white/30 hover:text-white/70 transition-colors"
              title="تسجيل الخروج"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
