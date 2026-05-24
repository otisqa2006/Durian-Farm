'use client';

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import Modal from '@/components/ui/Modal';

type ToastType = 'success' | 'error' | 'info';

interface ToastOptions {
  id: string;
  message: string;
  type: ToastType;
}

interface ConfirmState {
  isOpen: boolean;
  message: string;
  resolve?: (value: boolean) => void;
}

interface AppContextType {
  toast: (message: string, type?: ToastType) => void;
  confirm: (message: string) => Promise<boolean>;
}

const AppContext = createContext<AppContextType | null>(null);

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  // Toast State
  const [toasts, setToasts] = useState<ToastOptions[]>([]);

  // Confirm State
  const [confirmState, setConfirmState] = useState<ConfirmState>({
    isOpen: false,
    message: '',
  });

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2000);
  }, []);

  const confirm = useCallback((message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        message,
        resolve,
      });
    });
  }, []);

  const handleConfirmClose = (result: boolean) => {
    if (confirmState.resolve) {
      confirmState.resolve(result);
    }
    setConfirmState({ isOpen: false, message: '' });
  };

  return (
    <AppContext.Provider value={{ toast, confirm }}>
      {children}

      {/* --- Toasts Container --- */}
      <div className="fixed bottom-4 left-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border backdrop-blur-md animate-slide-up transition-all ${
              t.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-500/30 text-emerald-400'
                : t.type === 'error'
                ? 'bg-red-950/80 border-red-500/30 text-red-400'
                : 'bg-blue-950/80 border-blue-500/30 text-blue-400'
            }`}
          >
            {t.type === 'success' && <CheckCircle2 className="w-5 h-5 flex-shrink-0" />}
            {t.type === 'error' && <AlertTriangle className="w-5 h-5 flex-shrink-0" />}
            {t.type === 'info' && <Info className="w-5 h-5 flex-shrink-0" />}
            <span className="text-sm font-medium text-white">{t.message}</span>
          </div>
        ))}
      </div>

      {/* --- Confirm Modal --- */}
      <Modal
        isOpen={confirmState.isOpen}
        onClose={() => handleConfirmClose(false)}
        title="Xác nhận"
        maxWidth="max-w-sm"
      >
        <div className="py-2">
          <p className="text-white text-sm mb-6">{confirmState.message}</p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => handleConfirmClose(false)}
              className="btn btn-secondary"
            >
              Huỷ
            </button>
            <button
              onClick={() => handleConfirmClose(true)}
              className="btn btn-danger"
            >
              Đồng ý
            </button>
          </div>
        </div>
      </Modal>
    </AppContext.Provider>
  );
}
