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
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
  { href: '/employees', label: 'الموظفون', icon: Users },
  { href: '/probation', label: 'فترات التجربة', icon: ClipboardCheck },
  { href: '/departments', label: 'الإدارات', icon: Building2 },
];

export default function Sidebar() {
  const pathname = usePathname();

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
        <span className="font-display font-bold text-white text-[18px]">
          منصة التقييمات
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname?.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg text-[14px] font-ui font-medium
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
        <Link
          href="/dashboard?upload=true"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-[14px] font-ui font-medium text-white/70 hover:text-white hover:bg-white/5 transition-all duration-200"
        >
          <Upload className="w-5 h-5" />
          <span>رفع ملف</span>
        </Link>
        <Link
          href="/"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-[14px] font-ui font-medium text-white/70 hover:text-white hover:bg-white/5 transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span>الصفحة الرئيسية</span>
        </Link>
      </div>
    </aside>
  );
}
