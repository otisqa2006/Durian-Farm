'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_ITEMS } from '@/lib/constants';
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowLeftRight,
  Landmark,
  BarChart3,
  X,
  Sprout,
  UserCircle,
  Users
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const iconMap = {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowLeftRight,
  Landmark,
  BarChart3,
};

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <aside className="sidebar fixed top-0 left-0 h-full z-50 hidden md:flex flex-col md:translate-x-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-[var(--header-height)] border-b border-border/50">
        <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-lg">
          <Sprout className="w-5 h-5 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-white tracking-tight">SRM Finance</span>
          <span className="text-[10px] text-muted leading-none">Quản lý Thu Chi</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-3 mb-3 text-[10px] font-semibold text-muted uppercase tracking-widest">Menu chính</p>
        {NAV_ITEMS.map((item) => {
          const Icon = iconMap[item.icon];
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Icon className="w-[18px] h-[18px] flex-shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
        
        <p className="px-3 mt-6 mb-3 text-[10px] font-semibold text-muted uppercase tracking-widest">Hệ thống</p>
        <Link
          href="/ca-nhan"
          className={`sidebar-link ${pathname === '/ca-nhan' ? 'active' : ''}`}
        >
          <UserCircle className="w-[18px] h-[18px] flex-shrink-0" />
          <span>Cá nhân</span>
        </Link>

        {user?.role === 'admin' && (
          <Link
            href="/quan-ly-user"
            className={`sidebar-link ${pathname === '/quan-ly-user' ? 'active' : ''}`}
          >
            <Users className="w-[18px] h-[18px] flex-shrink-0" />
            <span>Quản lý User</span>
          </Link>
        )}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-border/50">
        <div className="text-[11px] text-muted text-center">
          SRM Finance v1.0
        </div>
      </div>
    </aside>
  );
}
