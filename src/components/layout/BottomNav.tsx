'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  Wallet,
  Menu,
  X,
  ChevronRight,
  ArrowLeftRight,
  Landmark,
  BarChart3
} from 'lucide-react';
import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { NAV_ITEMS } from '@/lib/constants';
import { useAuth } from '@/hooks/useAuth';

const BOTTOM_NAV_ITEMS = [
  { href: '/', label: 'Tổng quan', icon: LayoutDashboard },
  { href: '/thu', label: 'Thu', icon: TrendingUp },
  { href: '/chi', label: 'Chi', icon: TrendingDown },
  { href: '/quy', label: 'Quỹ', icon: Wallet },
];

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowLeftRight,
  Landmark,
  BarChart3
};

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  return (
    <>
      <nav className="fixed bottom-0 left-0 w-full z-40 md:hidden pb-safe">
        {/* Glassmorphism background */}
        <div className="absolute inset-0 bg-surface/80 backdrop-blur-xl border-t border-border/50" />
        
        <div className="relative flex items-center justify-around px-2 h-16">
          {BOTTOM_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative flex flex-col items-center justify-center w-full h-full"
              >
                <div
                  className={`flex flex-col items-center justify-center p-1 transition-colors ${
                    isActive ? 'text-primary-light' : 'text-muted hover:text-white'
                  }`}
                >
                  <Icon className={`w-5 h-5 mb-1 ${isActive ? 'animate-pulse-glow' : ''}`} />
                  <span className="text-[10px] font-medium tracking-wide">
                    {item.label}
                  </span>
                </div>
                {isActive && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary-light rounded-b-full shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                )}
              </Link>
            );
          })}

          {/* More Menu Button */}
          <button
            onClick={() => setIsMoreMenuOpen(true)}
            className="relative flex flex-col items-center justify-center w-full h-full text-muted hover:text-white transition-colors"
          >
            <div className="flex flex-col items-center justify-center p-1">
              <Menu className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-medium tracking-wide">Khác</span>
            </div>
          </button>
        </div>
      </nav>

      {/* Slide-over More Menu */}
      {isMoreMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-[999] backdrop-blur-sm transition-opacity lg:hidden" 
          onClick={() => setIsMoreMenuOpen(false)}
        />
      )}
      
      <div 
        className={`fixed top-0 right-0 bottom-0 w-[75vw] max-w-sm bg-background border-l border-border/50 z-[1000] shadow-2xl transition-transform duration-300 ease-in-out flex flex-col lg:hidden ${isMoreMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="p-4 border-b border-border/50 flex items-center justify-between bg-card/50">
          <h2 className="text-lg font-bold text-white">Tính năng khác</h2>
          <button 
            onClick={() => setIsMoreMenuOpen(false)} 
            className="p-2 -mr-2 text-muted hover:text-white transition-colors rounded-full hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {NAV_ITEMS.filter(item => !BOTTOM_NAV_ITEMS.some(nav => nav.href === item.href)).map(item => {
            const Icon = ICON_MAP[item.icon as string];
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMoreMenuOpen(false)}
                className="flex items-center justify-between p-3.5 rounded-xl bg-card hover:bg-card-hover border border-border/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                    {Icon ? <Icon className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </div>
                  <span className="text-sm font-medium text-white">{item.label}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted" />
              </Link>
            );
          })}

          <div className="my-4 border-t border-border/50"></div>

          <Link
            href="/ca-nhan"
            onClick={() => setIsMoreMenuOpen(false)}
            className="flex items-center justify-between p-3.5 rounded-xl bg-card hover:bg-card-hover border border-border/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              <span className="text-sm font-medium text-white">Cá nhân</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted" />
          </Link>

          <Link
            href="/huong-dan"
            onClick={() => setIsMoreMenuOpen(false)}
            className="flex items-center justify-between p-3.5 rounded-xl bg-card hover:bg-card-hover border border-border/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                <span className="text-xs">?</span>
              </div>
              <span className="text-sm font-medium text-white">Hướng dẫn</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted" />
          </Link>

          {user?.role === 'admin' && (
            <Link
              href="/quan-ly-user"
              onClick={() => setIsMoreMenuOpen(false)}
              className="flex items-center justify-between p-3.5 rounded-xl bg-card hover:bg-card-hover border border-border/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
                <span className="text-sm font-medium text-white">Quản lý User</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted" />
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
