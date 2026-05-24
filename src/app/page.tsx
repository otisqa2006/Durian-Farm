'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Landmark,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ReceiptText,
  PieChart,
} from 'lucide-react';
import { useFunds, useBalanceValidator } from '@/hooks/useFunds';
import { useTransactions, useMonthlyTransactions } from '@/hooks/useTransactions';
import { useDebts } from '@/hooks/useDebts';
import { formatCurrency, formatDate, getMonthName } from '@/lib/utils';
import { CHART_COLORS } from '@/lib/constants';
import { useApp } from '@/providers/AppProvider';

// ==========================================
// KPI Card Component
// ==========================================
function KPICard({
  label,
  amount,
  icon: Icon,
  gradientClass,
}: {
  label: string;
  amount: number;
  icon: React.ElementType;
  gradientClass: string;
}) {
  return (
    <div className="glass-card p-3 sm:p-5 flex flex-col gap-2 sm:gap-3 overflow-hidden">
      <div className="flex items-center justify-between gap-1">
        <span className="text-[11px] sm:text-sm text-muted font-medium line-clamp-1">{label}</span>
        <div
          className={`${gradientClass} w-7 h-7 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shadow-lg shrink-0`}
        >
          <Icon className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white" />
        </div>
      </div>
      <p 
        className="text-base sm:text-2xl font-bold font-mono-num tracking-tight text-white truncate"
        title={formatCurrency(amount)}
      >
        {formatCurrency(amount)}
      </p>
    </div>
  );
}

// ==========================================
// Dashboard Page
// ==========================================
export default function DashboardPage() {
  const { selectedSeasonId, activeSeasonId } = useApp();
  
  const { funds, masterFund, subFunds, totalBalance } = useFunds(selectedSeasonId);
  const { transactions } = useTransactions(undefined, selectedSeasonId);
  const { totalDebt } = useDebts();
  const validator = useBalanceValidator(selectedSeasonId);

  // Current month stats
  const now = new Date();
  const { totalIncome: monthlyIncome, totalExpense: monthlyExpense } =
    useMonthlyTransactions(now.getFullYear(), now.getMonth(), selectedSeasonId);

  // Recent 8 transactions
  const recentTransactions = useMemo(
    () => transactions.slice(0, 8),
    [transactions],
  );

  // Fund distribution — compute max for bar proportions
  const maxFundBalance = useMemo(
    () => Math.max(...funds.map((f) => f.balance), 1),
    [funds],
  );

  const currentMonth = getMonthName(now.getMonth());

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Season Warning */}
      {selectedSeasonId && activeSeasonId && selectedSeasonId !== activeSeasonId && (
        <div className="bg-warning/20 border border-warning/50 text-warning px-4 py-3 rounded-xl flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">Bạn đang xem dữ liệu của mùa vụ lưu trữ. Dữ liệu chỉ có thể xem, không thể chỉnh sửa.</p>
        </div>
      )}

      {/* 🌟 KPI Cards 🌟 */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 stagger-children">
        <KPICard
          label="Tổng tồn quỹ"
          amount={totalBalance}
          icon={Wallet}
          gradientClass="gradient-primary"
        />
        <KPICard
          label={`Thu ${currentMonth.toLowerCase()}`}
          amount={monthlyIncome}
          icon={TrendingUp}
          gradientClass="gradient-info"
        />
        <KPICard
          label={`Chi ${currentMonth.toLowerCase()}`}
          amount={monthlyExpense}
          icon={TrendingDown}
          gradientClass="gradient-danger"
        />
        <KPICard
          label="Tổng nợ"
          amount={totalDebt}
          icon={Landmark}
          gradientClass="gradient-purple"
        />
      </div>

      {/* ── Balance Validator Banner ── */}
      <div className="glass-card p-5 animate-slide-up">
        <div className="flex items-center gap-3 mb-4">
          {validator.isBalanced ? (
            <CheckCircle2 className="w-6 h-6 text-success shrink-0" />
          ) : (
            <AlertTriangle className="w-6 h-6 text-danger shrink-0" />
          )}
          <h2 className="text-lg font-semibold text-white">
            Kiểm tra cân đối quỹ
          </h2>
        </div>

        {/* Equation */}
        <div
          className={`rounded-xl p-4 mb-4 border ${
            validator.isBalanced
              ? 'bg-success/5 border-success/20'
              : 'bg-danger/5 border-danger/20'
          }`}
        >
          <p className="text-sm text-muted mb-2 font-medium">
            Phương trình cân đối
          </p>
          <div className="flex flex-wrap items-center gap-2 text-base font-mono-num">
            <span className="text-white">
              Quỹ Tổng (
              <span className="text-primary-light">
                {formatCurrency(validator.masterBalance)}
              </span>
              )
            </span>
            <span className="text-muted">+</span>
            <span className="text-white">
              Σ Quỹ Nhánh (
              <span className="text-info">
                {formatCurrency(validator.totalSubBalance)}
              </span>
              )
            </span>
            <span className="text-muted">=</span>
            <span className="text-white font-bold">
              Tổng (
              <span
                className={
                  validator.isBalanced ? 'text-success' : 'text-danger'
                }
              >
                {formatCurrency(validator.systemTotal)}
              </span>
              )
            </span>
          </div>
        </div>

        {/* Fund list */}
        {validator.funds.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {validator.funds.map((f) => (
              <div
                key={f.id}
                className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface/60 border border-border/30"
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      f.isMaster ? 'bg-primary-light' : 'bg-info'
                    }`}
                  />
                  <span className="text-sm text-white truncate max-w-[140px]">
                    {f.name}
                  </span>
                </div>
                <span className="text-sm font-mono-num text-muted">
                  {formatCurrency(f.balance)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 🌟 Bottom: Recent Transactions 🌟 */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ReceiptText className="w-5 h-5 text-muted" />
            <h2 className="text-lg font-semibold text-white">
              Giao dịch gần đây
            </h2>
          </div>
          <Link
              href="/thu"
              className="btn btn-ghost btn-sm text-sm text-primary-light hover:text-primary flex items-center gap-1"
            >
              Xem thêm <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {recentTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ReceiptText className="w-12 h-12 text-muted/30 mb-3" />
              <p className="text-muted text-sm">Chưa có giao dịch nào</p>
              <p className="text-muted/60 text-xs mt-1">
                Bắt đầu ghi nhận thu chi để thấy dữ liệu tại đây
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {recentTransactions.map((txn) => (
                <div
                  key={txn.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-card-hover/40 transition-colors"
                >
                  {/* Badge */}
                  <span
                    className={`badge shrink-0 ${
                      txn.type === 'income' ? 'badge-income' : 'badge-expense'
                    }`}
                  >
                    {txn.type === 'income' ? 'Thu' : 'Chi'}
                  </span>

                  {/* Category + Description */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">
                      {txn.category}
                      {txn.description && (
                        <span className="text-muted ml-1.5">
                          — {txn.description}
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Amount */}
                  <span
                    className={`text-sm font-semibold font-mono-num shrink-0 ${
                      txn.type === 'income' ? 'text-income' : 'text-expense'
                    }`}
                  >
                    {txn.type === 'income' ? '+' : '-'}
                    {formatCurrency(txn.amount)}
                  </span>

                  {/* Date */}
                  <span className="text-xs text-muted shrink-0 hidden sm:block w-[80px] text-right">
                    {formatDate(txn.date)}
                  </span>
                </div>
              ))}
            </div>
          )}
      </div>
    </div>
  );
}
