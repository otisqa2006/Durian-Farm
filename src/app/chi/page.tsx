'use client';

import { useState, useMemo } from 'react';
import { Plus, TrendingDown, Trash2, Receipt, AlertCircle } from 'lucide-react';
import { useTransactions } from '@/hooks/useTransactions';
import { useFunds } from '@/hooks/useFunds';
import { EXPENSE_CATEGORIES } from '@/lib/constants';
import { formatCurrency, formatDate, toDateInputValue } from '@/lib/utils';
import type { ExpenseCategory } from '@/types';
import Modal from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';
import { useApp } from '@/providers/AppProvider';

export default function ChiPage() {
  const { user } = useAuth();
  const { toast, confirm } = useApp();
  const canEdit = user?.role === 'admin' || user?.permissions?.canManageChi;

  const { expenseTransactions, totalExpense, addTransaction, removeTransaction } = useTransactions();
  const { funds } = useFunds();

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Form state
  const [category, setCategory] = useState<ExpenseCategory>(EXPENSE_CATEGORIES[0].value);
  const [amount, setAmount] = useState('');
  const [fundId, setFundId] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(toDateInputValue(new Date()));

  // Category totals for summary cards
  const categoryTotals = useMemo(() => {
    return EXPENSE_CATEGORIES.map((cat) => {
      const total = expenseTransactions
        .filter((t) => t.category === cat.value)
        .reduce((sum, t) => sum + t.amount, 0);
      return { ...cat, total };
    });
  }, [expenseTransactions]);

  const resetForm = () => {
    setCategory(EXPENSE_CATEGORIES[0].value);
    setAmount('');
    setFundId('');
    setDescription('');
    setDate(toDateInputValue(new Date()));
    setFormError('');
  };

  const handleOpenModal = () => {
    if (!canEdit) return;
    resetForm();
    // Default to first fund if available
    if (funds.length > 0) {
      setFundId(funds[0].id);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    setFormError('');

    const parsedAmount = Number(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      setFormError('Số tiền phải lớn hơn 0.');
      return;
    }

    if (!fundId) {
      setFormError('Vui lòng chọn quỹ chi.');
      return;
    }

    // Check fund balance
    const selectedFund = funds.find((f) => f.id === fundId);
    if (selectedFund && selectedFund.balance < parsedAmount) {
      setFormError(
        `Số dư quỹ "${selectedFund.name}" không đủ. Hiện có: ${formatCurrency(selectedFund.balance)}, cần: ${formatCurrency(parsedAmount)}.`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await addTransaction({
        type: 'expense',
        amount: parsedAmount,
        category,
        fundId,
        description: description.trim(),
        date: new Date(date),
      });
      toast('Thêm khoản chi thành công!', 'success');
      handleCloseModal();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Có lỗi xảy ra khi thêm khoản chi.';
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!canEdit) return;
    const ok = await confirm('Bạn có chắc chắn muốn xoá khoản chi này?');
    if (!ok) return;
    try {
      await removeTransaction(id);
      toast('Đã xoá khoản chi', 'success');
    } catch {
      toast('Có lỗi xảy ra khi xoá khoản chi.', 'error');
    }
  };

  // Look up fund name by id
  const getFundName = (id: string) => {
    const fund = funds.find((f) => f.id === id);
    return fund ? fund.name : '—';
  };

  // Look up category label/color
  const getCategoryInfo = (value: string) => {
    return EXPENSE_CATEGORIES.find((c) => c.value === value);
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* ============ Header ============ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2 rounded-xl gradient-danger">
              <TrendingDown className="w-6 h-6 text-white" />
            </div>
            Quản lý Dòng Chi
          </h1>
          <p className="text-muted mt-1 text-sm">Ghi nhận và theo dõi các khoản chi tiêu</p>
        </div>
        {canEdit && (
          <button onClick={handleOpenModal} className="btn btn-primary">
            <Plus className="w-4 h-4" />
            Thêm khoản chi
          </button>
        )}
      </div>

      {/* ============ Summary Cards ============ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 stagger-children">
        {/* Total expense card */}
        <div className="gradient-danger rounded-2xl p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-white/80">Tổng chi</span>
            <TrendingDown className="w-5 h-5 text-white/60" />
          </div>
          <p className="text-2xl font-bold font-mono-num">{formatCurrency(totalExpense)}</p>
          <p className="text-xs text-white/60 mt-1">{expenseTransactions.length} giao dịch</p>
        </div>

        {/* Per-category cards */}
        {categoryTotals.map((cat) => (
          <div key={cat.value} className="glass-card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted">{cat.label}</span>
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: cat.color }}
              />
            </div>
            <p className="text-xl font-bold text-white font-mono-num">
              {formatCurrency(cat.total)}
            </p>
            <p className="text-xs text-muted mt-1">
              {expenseTransactions.filter((t) => t.category === cat.value).length} giao dịch
            </p>
          </div>
        ))}
      </div>

      {/* ============ Transaction Table ============ */}
      <div className="glass-card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Receipt className="w-4 h-4 text-muted" />
            Danh sách khoản chi
          </h2>
          <span className="text-xs text-muted">
            {expenseTransactions.length} khoản chi
          </span>
        </div>

        {expenseTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-4 rounded-2xl bg-card mb-4">
              <TrendingDown className="w-8 h-8 text-muted" />
            </div>
            <p className="text-white font-medium mb-1">Chưa có khoản chi nào</p>
            <p className="text-muted text-sm">Nhấn &quot;Thêm khoản chi&quot; để bắt đầu ghi nhận</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ngày</th>
                  <th>Danh mục</th>
                  <th>Quỹ</th>
                  <th>Mô tả</th>
                  <th className="text-right">Số tiền</th>
                  {canEdit && <th className="text-center">Thao tác</th>}
                </tr>
              </thead>
              <tbody>
                {expenseTransactions.map((txn) => {
                  const catInfo = getCategoryInfo(txn.category);
                  return (
                    <tr key={txn.id}>
                      <td className="whitespace-nowrap">{formatDate(txn.date)}</td>
                      <td>
                        <span
                          className="badge badge-expense"
                          style={
                            catInfo
                              ? {
                                  background: `${catInfo.color}20`,
                                  color: catInfo.color,
                                  borderColor: `${catInfo.color}50`,
                                }
                              : undefined
                          }
                        >
                          {txn.category}
                        </span>
                      </td>
                      <td className="text-muted">{getFundName(txn.fundId)}</td>
                      <td className="text-muted max-w-[200px] truncate">
                        {txn.description || '—'}
                      </td>
                      <td className="text-right text-expense font-semibold font-mono-num whitespace-nowrap">
                        -{formatCurrency(txn.amount)}
                      </td>
                      {canEdit && (
                        <td className="text-center">
                          <button
                            onClick={() => handleDelete(txn.id)}
                            className="btn btn-ghost btn-sm text-muted hover:text-danger"
                            title="Xoá"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ============ Add Expense Modal ============ */}
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title="Thêm khoản chi">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error message */}
          {formError && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-danger/10 border border-danger/30 text-sm text-red-400">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-muted mb-1.5">Danh mục</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
              className="input-field"
              required
            >
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-muted mb-1.5">Số tiền (₫)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input-field font-mono-num"
              placeholder="Nhập số tiền..."
              min={1000}
              step={1000}
              required
            />
          </div>

          {/* Fund */}
          <div>
            <label className="block text-sm font-medium text-muted mb-1.5">Quỹ chi</label>
            <select
              value={fundId}
              onChange={(e) => setFundId(e.target.value)}
              className="input-field"
              required
            >
              <option value="" disabled>
                Chọn quỹ...
              </option>
              {funds.map((fund) => (
                <option key={fund.id} value={fund.id}>
                  {fund.name} ({formatCurrency(fund.balance)})
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-muted mb-1.5">Mô tả</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field"
              placeholder="Nhập mô tả (tuỳ chọn)..."
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-muted mb-1.5">Ngày</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input-field"
              required
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={handleCloseModal} className="btn btn-secondary">
              Huỷ
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Đang lưu...' : 'Thêm khoản chi'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
