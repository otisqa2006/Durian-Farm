'use client';

import { Menu, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useBalanceValidator } from '@/hooks/useFunds';
import { formatCurrency } from '@/lib/utils';
import { useApp } from '@/providers/AppProvider';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const { selectedSeasonId } = useApp();
  const { isBalanced, systemTotal } = useBalanceValidator(selectedSeasonId);

  return (
    <header className="h-[var(--header-height)] flex items-center justify-between px-4 md:px-6 border-b border-border/50 bg-surface/80 backdrop-blur-lg sticky top-0 z-30">
      {/* Left: Menu + Title */}
      <div className="flex items-center gap-3">

        <div>
          <h1 className="text-lg font-bold text-white leading-tight">{title}</h1>
          {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
        </div>
      </div>

      {/* Right: Balance Validator */}
      <div className="flex items-center gap-3">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${
          isBalanced
            ? 'bg-success/10 text-success border border-success/20'
            : 'bg-danger/10 text-danger border border-danger/20 animate-pulse-glow'
        }`}>
          {isBalanced ? (
            <CheckCircle2 className="w-3.5 h-3.5" />
          ) : (
            <AlertTriangle className="w-3.5 h-3.5" />
          )}
          <span className="inline">{isBalanced ? 'Cân đối' : 'Lệch!'}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-muted uppercase tracking-wider hidden sm:block">Tổng quỹ</span>
          <span className="text-sm font-bold text-white font-mono-num">
            {formatCurrency(systemTotal)}
          </span>
        </div>
      </div>
    </header>
  );
}
