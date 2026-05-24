'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Header from './Header';
import BottomNav from './BottomNav';
import { seedDefaultData } from '@/lib/db';
import { NAV_ITEMS } from '@/lib/constants';
import { AuthProvider } from '@/hooks/useAuth';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Seed default data on first load
  useEffect(() => {
    seedDefaultData();
  }, []);

  const isAuthRoute = pathname === '/login' || pathname === '/register';

  if (isAuthRoute) {
    return (
      <AuthProvider>
        <main className="min-h-screen bg-background flex items-center justify-center p-4">
          {children}
        </main>
      </AuthProvider>
    );
  }

  // Find current page info for the header
  const currentNav = NAV_ITEMS.find(item => item.href === pathname);
  const pageTitle = currentNav?.label ?? 'SRM Finance';

  return (
    <AuthProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />

        <div className="flex-1 flex flex-col md:ml-[var(--sidebar-width)] min-h-0 min-w-0 relative">
          <Header title={pageTitle} />
          {/* Added pb-20 on mobile to account for BottomNav */}
          <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 pb-24 md:pb-6 md:p-6 gradient-mesh relative">
            {children}
          </main>
          <BottomNav />
        </div>
      </div>
    </AuthProvider>
  );
}
