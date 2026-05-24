'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  Wallet,
  Menu,
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

      {/* More Menu Modal (Bottom Sheet style for mobile) */}
      <Modal
        isOpen={isMoreMenuOpen}
        onClose={() => setIsMoreMenuOpen(false)}
        title="Tính năng khác"
      >
        <div className="grid grid-cols-2 gap-3 py-2">
          {NAV_ITEMS.filter(item => !BOTTOM_NAV_ITEMS.some(nav => nav.href === item.href)).map(item => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMoreMenuOpen(false)}
              className="flex flex-col items-center gap-3 p-4 rounded-xl bg-card hover:bg-card-hover border border-border/50 transition-colors"
            >
              <span className="text-sm font-medium text-white text-center">{item.label}</span>
            </Link>
          ))}

          <Link
            href="/ca-nhan"
            onClick={() => setIsMoreMenuOpen(false)}
            className="flex flex-col items-center gap-3 p-4 rounded-xl bg-card hover:bg-card-hover border border-border/50 transition-colors"
          >
            <span className="text-sm font-medium text-white text-center">Cá nhân</span>
          </Link>

          {user?.role === 'admin' && (
            <Link
              href="/quan-ly-user"
              onClick={() => setIsMoreMenuOpen(false)}
              className="flex flex-col items-center gap-3 p-4 rounded-xl bg-card hover:bg-card-hover border border-border/50 transition-colors"
            >
              <span className="text-sm font-medium text-white text-center">Quản lý User</span>
            </Link>
          )}
        </div>
      </Modal>
    </>
  );
}
