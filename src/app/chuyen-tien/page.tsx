'use client';

import { useState, useMemo } from 'react';
import {
  ArrowLeftRight,
  ArrowRight,
  Info,
  Send,
  Inbox,
} from 'lucide-react';
import Modal from '@/components/ui/Modal';
import NumericInput from '@/components/ui/NumericInput';
import { useFunds } from '@/hooks/useFunds';
import { useTransfers } from '@/hooks/useTransfers';
import { formatCurrency, formatDate, toDateInputValue } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

import { useApp } from '@/providers/AppProvider';

export default function ChuyenTienPage() {
  const { user } = useAuth();
  const { selectedSeasonId, activeSeasonId } = useApp();
  const isSeasonActive = selectedSeasonId === activeSeasonId;
  const canEdit = (user?.role === 'admin' || user?.permissions?.can_manage_quy) && isSeasonActive;

  const { funds, totalBalance } = useFunds(selectedSeasonId);
  const { transfers, addTransfer } = useTransfers(selectedSeasonId);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [fromFundId, setFromFundId] = useState('');
  const [toFundId, setToFundId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(toDateInputValue(new Date()));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Derived
  const sourceFund = useMemo(
    () => funds.find((f) => f.id === fromFundId),
    [funds, fromFundId],
  );

  const destinationFunds = useMemo(
    () => funds.filter((f) => f.id !== fromFundId),
    [funds, fromFundId],
  );

  const sortedTransfers = useMemo(
    () =>
      [...transfers].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      ),
    [transfers],
  );

  // Helpers
  const getFundName = (fundId: string) => {
    const fund = funds.find((f) => f.id === fundId);
    return fund ? fund.name : 'Đã xoá';
  };

  const resetForm = () => {
    setFromFundId('');
    setToFundId('');
    setAmount('');
    setDescription('');
    setDate(toDateInputValue(new Date()));
    setFormError('');
  };

  const openModal = () => {
    if (!canEdit) return;
    resetForm();
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    setFormError('');

    // Validation
    const numAmount = Number(amount);

    if (!fromFundId) {
      setFormError('Vui lòng chọn quỹ nguồn.');
      return;
    }
    if (!toFundId) {
      setFormError('Vui lòng chọn quỹ đích.');
      return;
    }
    if (fromFundId === toFundId) {
      setFormError('Quỹ nguồn và quỹ đích không được trùng nhau.');
      return;
    }
    if (!numAmount || numAmount <= 0) {
      setFormError('Số tiền phải lớn hơn 0.');
      return;
    }
    if (sourceFund && numAmount > sourceFund.balance) {
      setFormError(
        `Số dư quỹ "${sourceFund.name}" không đủ. Hiện có: ${formatCurrency(sourceFund.balance)}`,
      );
      return;
    }

    try {
      setIsSubmitting(true);
      await addTransfer(
        fromFundId,
        toFundId,
        numAmount,
        description.trim() || 'Chuyển tiền nội bộ',
        new Date(date),
      );
      setIsModalOpen(false);
      resetForm();
    } catch {
      setFormError('Đã xảy ra lỗi khi chuyển tiền. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ============ Header ============ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl gradient-info flex items-center justify-center shadow-lg">
              <ArrowLeftRight className="w-5 h-5 text-white" />
            </div>
            Chuyển tiền Nội bộ
          </h1>
          {!isSeasonActive && (
            <p className="text-warning text-xs mt-2 bg-warning/10 inline-block px-2 py-1 rounded">
              Đang xem dữ liệu của mùa vụ lưu trữ. Không thể chỉnh sửa.
            </p>
          )}
        </div>
        {canEdit && (
          <button className="btn btn-primary" onClick={openModal}>
            <ArrowLeftRight className="w-4 h-4" />
            Chuyển tiền
          </button>
        )}
      </div>

      {/* ===== Info Banner ===== */}
      <div className="glass-card p-4 flex items-start gap-3 border-info/30 !bg-info/5">
        <div className="p-2 rounded-lg bg-info/15 text-info shrink-0 mt-0.5">
          <Info className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-info mb-1">
            Lưu ý về chuyển tiền nội bộ
          </p>
          <p className="text-sm text-muted leading-relaxed">
            Chuyển tiền nội bộ không làm thay đổi tổng quỹ hệ thống. Tiền chỉ
            di chuyển giữa các quỹ.
          </p>
        </div>
      </div>

      {/* ===== Transfer History ===== */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">
            Lịch sử chuyển tiền
          </h2>
          <span className="text-sm text-muted">
            {transfers.length} giao dịch
          </span>
        </div>

        {sortedTransfers.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-4 rounded-2xl bg-card mb-4">
              <Inbox className="w-10 h-10 text-muted" />
            </div>
            <p className="text-white font-semibold mb-1">
              Chưa có lượt chuyển tiền nào
            </p>
            <p className="text-sm text-muted max-w-xs">
              Nhấn &quot;Chuyển tiền&quot; để bắt đầu di chuyển tiền giữa các
              quỹ.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ngày</th>
                  <th>Từ quỹ</th>
                  <th className="text-center w-10"></th>
                  <th>Đến quỹ</th>
                  <th className="text-right">Số tiền</th>
                  <th>Mô tả</th>
                </tr>
              </thead>
              <tbody>
                {sortedTransfers.map((transfer) => (
                  <tr key={transfer.id}>
                    <td className="text-muted whitespace-nowrap">
                      {formatDate(transfer.date)}
                    </td>
                    <td className="font-medium text-white whitespace-nowrap">
                      {getFundName(transfer.fromFundId)}
                    </td>
                    <td className="text-center">
                      <ArrowRight className="w-4 h-4 text-info mx-auto" />
                    </td>
                    <td className="font-medium text-white whitespace-nowrap">
                      {getFundName(transfer.toFundId)}
                    </td>
                    <td className="text-right font-mono-num text-info font-semibold whitespace-nowrap">
                      {formatCurrency(transfer.amount)}
                    </td>
                    <td className="text-muted max-w-[200px] truncate">
                      {transfer.description || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ===== Transfer Form Modal ===== */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Chuyển tiền nội bộ"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Source Fund */}
          <div>
            <label className="block text-sm font-medium text-muted mb-1.5">
              Quỹ nguồn
            </label>
            <select
              className="input-field"
              value={fromFundId}
              onChange={(e) => {
                setFromFundId(e.target.value);
                // Reset destination if it now equals source
                if (e.target.value === toFundId) setToFundId('');
              }}
            >
              <option value="">— Chọn quỹ nguồn —</option>
              {funds.map((fund) => (
                <option key={fund.id} value={fund.id}>
                  {fund.name} ({formatCurrency(fund.balance)})
                </option>
              ))}
            </select>
          </div>

          {/* Arrow visual */}
          <div className="flex justify-center">
            <div className="p-2.5 rounded-full bg-info/15 text-info">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
          </div>

          {/* Destination Fund */}
          <div>
            <label className="block text-sm font-medium text-muted mb-1.5">
              Quỹ đích
            </label>
            <select
              className="input-field"
              value={toFundId}
              onChange={(e) => setToFundId(e.target.value)}
            >
              <option value="">— Chọn quỹ đích —</option>
              {destinationFunds.map((fund) => (
                <option key={fund.id} value={fund.id}>
                  {fund.name} ({formatCurrency(fund.balance)})
                </option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-muted mb-1.5">
              Số tiền
            </label>
            <NumericInput
              value={amount}
              onChange={(val) => setAmount(val)}
              className="input-field font-mono-num"
              placeholder="Nhập số tiền..."
            />
            {sourceFund && (
              <p className="text-xs text-muted mt-1">
                Số dư hiện tại:{' '}
                <span className="font-mono-num text-white">
                  {formatCurrency(sourceFund.balance)}
                </span>
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-muted mb-1.5">
              Mô tả
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="Chuyển tiền nội bộ"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-muted mb-1.5">
              Ngày
            </label>
            <input
              type="date"
              className="input-field"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {/* Error message */}
          {formError && (
            <div className="p-3 rounded-lg bg-danger/10 border border-danger/30 text-danger text-sm">
              {formError}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              className="btn btn-secondary flex-1"
              onClick={() => setIsModalOpen(false)}
            >
              Huỷ
            </button>
            <button
              type="submit"
              className="btn btn-primary flex-1"
              disabled={isSubmitting}
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? 'Đang xử lý...' : 'Chuyển tiền'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
