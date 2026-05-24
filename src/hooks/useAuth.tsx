'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getSession, logout as serverLogout } from '@/actions/auth';

interface AuthContextType {
  user: any | null;
  isLoading: boolean;
  logout: () => Promise<void>;
  updateUserSession: (user: any) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  logout: async () => {},
  updateUserSession: () => {},
});

const PUBLIC_ROUTES = ['/login', '/register'];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function loadSession() {
      try {
        const session = await getSession();
        if (session) {
          setUser(session);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Failed to load session:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadSession();
  }, [pathname]);

  const logout = async () => {
    await serverLogout();
    setUser(null);
    router.replace('/login');
  };

  const updateUserSession = (updatedUser: any) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, logout, updateUserSession }}>
      {/* Hide content until auth is resolved to prevent flashing protected content */}
      {!isLoading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
