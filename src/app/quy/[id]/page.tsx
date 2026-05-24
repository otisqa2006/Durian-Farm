'use client';

import { use } from 'react';
import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft, Wallet, Calendar, User, ArrowRightLeft, TrendingUp, TrendingDown, Inbox, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { useFundById, useFunds } from '@/hooks/useFunds';
import { useTransactions } from '@/hooks/useTransactions';
import { getTransfersByFund } from '@/lib/db';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Transfer } from '@/types';

export default function FundDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const fund = useFundById(id);
  const { funds } = useFunds();
  const { transactions, totalIncome, totalExpense } = useTransactions(id);
  const transfers = useLiveQuery(
    () => getTransfersByFund(id),
    [id],
    [] as Transfer[]
  );

  // Helper to resolve fund name by ID
  const getFundName = (fundId: string): string => {
    const f = funds.find(fund => fund.id === fundId);
    return f?.name ?? 'Quỹ không xác định';
  };

  // Loading state
  if (fund === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted">Đang tải thông tin quỹ...</p>
        </div>
      </div>
    );
  }

  // Not found
  if (fund === null) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Wallet className="w-16 h-16 text-muted mx-auto mb-4 opacity-30" />
          <h2 className="text-xl font-semibold mb-2">Không tìm thấy quỹ</h2>
          <p className="text-muted mb-6">Quỹ này không tồn tại hoặc đã bị xóa.</p>
          <Link href="/quy" className="btn btn-primary">
            <ArrowLeft className="w-4 h-4" />
            Quay lại danh sách
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back button */}
      <Link
        href="/quy"
        className="btn btn-ghost btn-sm inline-flex items-center gap-2 mb-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Quay lại danh sách quỹ
      </Link>

      {/* ==================== Fund Info Card ==================== */}
      <div className="glass-card p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Left: Fund info */}
          <div className="flex items-start gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
              fund.type === 'master' ? 'gradient-primary' : 'gradient-accent'
            }`}>
              <Wallet className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold">{fund.name}</h1>
                <span className={`badge ${fund.type === 'master' ? 'badge-bank' : 'badge-external'}`}>
                  {fund.type === 'master' ? 'Quỹ tổng' : 'Quỹ phụ'}
                </span>
              </div>
              <div className="flex items-center gap-4 text-muted text-sm">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  {fund.holder}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Tạo ngày {formatDate(fund.createdAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Balance */}
          <div className="text-right">
            <p className="text-sm text-muted mb-1">Số dư hiện tại</p>
            <p className="text-3xl font-bold font-mono-num text-primary-light">
              {formatCurrency(fund.balance)}
            </p>
          </div>
        </div>

        {/* Quick stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-income/15 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-income" />
            </div>
            <div>
              <p className="text-xs text-muted">Tổng thu</p>
              <p className="text-lg font-semibold font-mono-num text-income">{formatCurrency(totalIncome)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-expense/15 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-expense" />
            </div>
            <div>
              <p className="text-xs text-muted">Tổng chi</p>
              <p className="text-lg font-semibold font-mono-num text-expense">{formatCurrency(totalExpense)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-info/15 flex items-center justify-center">
              <ArrowRightLeft className="w-5 h-5 text-info" />
            </div>
            <div>
              <p className="text-xs text-muted">Lượt chuyển tiền</p>
              <p className="text-lg font-semibold font-mono-num">{transfers.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== Transaction History ==================== */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary-light" />
          Lịch sử giao dịch
          <span className="text-sm text-muted font-normal ml-auto">
            {transactions.length} giao dịch
          </span>
        </h2>

        {transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Inbox className="w-12 h-12 text-muted opacity-30 mb-3" />
            <p className="text-muted">Chưa có giao dịch nào</p>
            <p className="text-sm text-muted/70 mt-1">Giao dịch thu/chi sẽ hiển thị ở đây</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ngày</th>
                  <th>Loại</th>
                  <th>Danh mục</th>
                  <th>Mô tả</th>
                  <th className="text-right">Số tiền</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((txn) => (
                  <tr key={txn.id}>
                    <td className="whitespace-nowrap text-muted">
                      {formatDate(txn.date)}
                    </td>
                    <td>
                      <span className={`badge ${txn.type === 'income' ? 'badge-income' : 'badge-expense'}`}>
                        {txn.type === 'income' ? 'Thu' : 'Chi'}
                      </span>
                    </td>
                    <td className="text-sm">{txn.category}</td>
                    <td className="text-sm text-muted max-w-[200px] truncate">
                      {txn.description || '—'}
                    </td>
                    <td className={`text-right font-semibold font-mono-num whitespace-nowrap ${
                      txn.type === 'income' ? 'text-income' : 'text-expense'
                    }`}>
                      {txn.type === 'income' ? '+' : '-'}{formatCurrency(txn.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ==================== Transfer History ==================== */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <ArrowRightLeft className="w-5 h-5 text-info" />
          Lịch sử chuyển tiền
          <span className="text-sm text-muted font-normal ml-auto">
            {transfers.length} lượt chuyển
          </span>
        </h2>

        {transfers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Inbox className="w-12 h-12 text-muted opacity-30 mb-3" />
            <p className="text-muted">Chưa có chuyển tiền nào</p>
            <p className="text-sm text-muted/70 mt-1">Lịch sử chuyển tiền nội bộ sẽ hiển thị ở đây</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ngày</th>
                  <th>Hướng</th>
                  <th>Mô tả</th>
                  <th className="text-right">Số tiền</th>
                </tr>
              </thead>
              <tbody>
                {transfers.map((tf) => {
                  const isOutgoing = tf.fromFundId === id;
                  const otherFundName = isOutgoing
                    ? getFundName(tf.toFundId)
                    : getFundName(tf.fromFundId);

                  return (
                    <tr key={tf.id}>
                      <td className="whitespace-nowrap text-muted">
                        {formatDate(tf.date)}
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          {isOutgoing ? (
                            <ArrowUpRight className="w-4 h-4 text-expense" />
                          ) : (
                            <ArrowDownLeft className="w-4 h-4 text-income" />
                          )}
                          <span className="text-sm">
                            {isOutgoing ? `Chuyển đến ${otherFundName}` : `Nhận từ ${otherFundName}`}
                          </span>
                        </div>
                      </td>
                      <td className="text-sm text-muted max-w-[200px] truncate">
                        {tf.description || '—'}
                      </td>
                      <td className={`text-right font-semibold font-mono-num whitespace-nowrap ${
                        isOutgoing ? 'text-expense' : 'text-income'
                      }`}>
                        {isOutgoing ? '-' : '+'}{formatCurrency(tf.amount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
