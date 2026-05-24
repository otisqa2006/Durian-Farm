'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';
import { getUserById } from '@/lib/db';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => void;
  updateUserSession: (user: User) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: () => {},
  logout: () => {},
  updateUserSession: () => {},
});

const PUBLIC_ROUTES = ['/login', '/register'];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function loadSession() {
      try {
        const storedUserId = localStorage.getItem('srm_user_id');
        if (storedUserId) {
          const dbUser = await getUserById(storedUserId);
          if (dbUser) {
            setUser(dbUser);
          } else {
            localStorage.removeItem('srm_user_id');
          }
        }
      } catch (err) {
        console.error('Failed to load session:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadSession();
  }, []);

  // Protect routes
  useEffect(() => {
    if (!isLoading) {
      const isPublic = PUBLIC_ROUTES.includes(pathname);
      if (!user && !isPublic) {
        router.replace('/login');
      } else if (user && isPublic) {
        router.replace('/');
      }
    }
  }, [user, isLoading, pathname, router]);

  const login = (newUser: User) => {
    localStorage.setItem('srm_user_id', newUser.id);
    setUser(newUser);
    router.replace('/');
  };

  const logout = () => {
    localStorage.removeItem('srm_user_id');
    setUser(null);
    router.replace('/login');
  };

  const updateUserSession = (updatedUser: User) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, updateUserSession }}>
      {/* Hide content until auth is resolved to prevent flashing protected content */}
      {!isLoading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
