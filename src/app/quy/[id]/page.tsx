'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Wallet, Calendar, User, ArrowRightLeft, TrendingUp, TrendingDown, Inbox, ArrowUpRight, ArrowDownLeft, AlertTriangle } from 'lucide-react';
import { useFundById, useFunds } from '@/hooks/useFunds';
import { useTransactions } from '@/hooks/useTransactions';
import { getTransfers } from '@/actions/transfers';
import { getUsers } from '@/actions/users';
import useSWR from 'swr';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Transfer } from '@/types';

import Modal from '@/components/ui/Modal';
import { useApp } from '@/providers/AppProvider';
import NumericInput from '@/components/ui/NumericInput';

export default function FundDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { toast, selectedSeasonId, activeSeasonId } = useApp();
  const isSeasonActive = selectedSeasonId === activeSeasonId;

  const fund = useFundById(id, selectedSeasonId);
  const { funds } = useFunds(selectedSeasonId);
  const { transactions, totalIncome, totalExpense, addTransaction } = useTransactions(id, selectedSeasonId);
  const { data: allTransfers } = useSWR(
    selectedSeasonId ? ['transfers', selectedSeasonId] : null, 
    ([_, sid]) => getTransfers(sid as string)
  );
  const transfers = (allTransfers || []).filter(t => t.fromFundId === id || t.toFundId === id);

  // Helper to resolve fund name by ID
  const getFundName = (fundId: string): string => {
    const f = funds.find(fund => fund.id === fundId);
    return f?.name ?? 'Quỹ không xác định';
  };

  const { data: allUsers } = useSWR('users', getUsers);
  const getUserName = (userId: string) => {
    return allUsers?.find(u => u.id === userId)?.name || userId;
  };

  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState<string>('');
  const [adjustReason, setAdjustReason] = useState<string>('');
  const [isAdjusting, setIsAdjusting] = useState(false);

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustAmount || !adjustReason.trim()) {
      toast('Vui lòng nhập số tiền và lý do cân đối.', 'error');
      return;
    }
    const amountNum = parseFloat(adjustAmount);
    if (isNaN(amountNum) || amountNum === 0) {
      toast('Số tiền không hợp lệ (phải khác 0).', 'error');
      return;
    }

    setIsAdjusting(true);
    try {
      await addTransaction({
        type: amountNum > 0 ? 'income' : 'expense',
        amount: Math.abs(amountNum),
        category: 'Khác',
        fundId: id,
        description: `Cân đối quỹ: ${adjustReason.trim()}`,
        date: new Date(),
      });
      toast('Cân đối thành công!', 'success');
      setIsAdjustModalOpen(false);
      setAdjustAmount('');
      setAdjustReason('');
    } catch (err) {
      console.error(err);
      toast('Lỗi khi cân đối quỹ.', 'error');
    } finally {
      setIsAdjusting(false);
    }
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
              fund.isMaster ? 'gradient-primary' : 'gradient-accent'
            }`}>
              <Wallet className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold">{fund.name}</h1>
                <span className={`badge ${fund.isMaster ? 'badge-bank' : 'badge-external'}`}>
                  {fund.isMaster ? 'Quỹ tổng' : 'Quỹ phụ'}
                </span>
              </div>
              <div className="flex items-center gap-4 text-muted text-sm">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                   {getUserName(fund.holderId)}
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
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-border">
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
          
          {/* Action Button */}
          {fund.isMaster && isSeasonActive && (
            <div className="flex-shrink-0 self-start md:self-center mt-4 md:mt-0">
              <button 
                onClick={() => setIsAdjustModalOpen(true)}
                className="btn btn-outline border-primary/30 text-primary-light hover:bg-primary/20"
              >
                Cân đối thủ công
              </button>
            </div>
          )}
        </div>
      </div>

      {!isSeasonActive && (
        <div className="bg-warning/20 border border-warning/50 text-warning px-4 py-3 rounded-xl flex items-center gap-3 animate-fade-in">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">Bạn đang xem dữ liệu của mùa vụ lưu trữ. Dữ liệu chỉ có thể xem, không thể chỉnh sửa.</p>
        </div>
      )}

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

      {/* Adjust Modal */}
      <Modal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        title="Cân Đối Quỹ Thủ Công"
      >
        <form onSubmit={handleAdjust} className="space-y-4">
          <div className="p-3 bg-info/10 text-info border border-info/20 rounded-lg text-sm mb-4">
            Tính năng này tạo ra một giao dịch Khác để điều chỉnh số dư khớp với thực tế. <br/>
            - Nhập số <b>Dương</b> để <b>tăng</b> quỹ. <br/>
            - Nhập số <b>Âm</b> (VD: -500000) để <b>giảm</b> quỹ.
          </div>
          
          <div>
            <label className="block text-sm font-medium text-muted mb-1.5">
              Số tiền điều chỉnh <span className="text-danger">*</span>
            </label>
            <NumericInput
              value={adjustAmount}
              onChange={(val) => setAdjustAmount(val)}
              placeholder="Ví dụ: -500.000 hoặc 500.000"
              className="input-field font-mono-num"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted mb-1.5">
              Lý do cân đối <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              placeholder="VD: Nhập nhầm giao dịch tuần trước"
              className="input-field"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setIsAdjustModalOpen(false)}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isAdjusting}
              className="btn btn-primary btn-sm"
            >
              {isAdjusting ? 'Đang lưu...' : 'Xác nhận Cân đối'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
