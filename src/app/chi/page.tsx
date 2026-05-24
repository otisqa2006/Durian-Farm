'use client';

import { useState, useMemo, useEffect } from 'react';
import { Plus, TrendingDown, Trash2, Receipt, AlertCircle, Filter, Wallet, ChevronDown } from 'lucide-react';
import { useTransactions } from '@/hooks/useTransactions';
import { useFunds } from '@/hooks/useFunds';
import { EXPENSE_CATEGORIES } from '@/lib/constants';
import { formatCurrency, formatDate, toDateInputValue } from '@/lib/utils';
import type { ExpenseCategory } from '@/types';
import Modal from '@/components/ui/Modal';
import NumericInput from '@/components/ui/NumericInput';
import { useAuth } from '@/hooks/useAuth';
import { useApp } from '@/providers/AppProvider';

export default function ChiPage() {
  const { user } = useAuth();
  const { toast, confirm, selectedSeasonId, activeSeasonId } = useApp();
  const isSeasonActive = selectedSeasonId === activeSeasonId;
  const canEdit = (user?.role === 'admin' || user?.permissions?.can_manage_chi) && isSeasonActive;

  const { expenseTransactions, totalExpense, addTransaction, addMultipleTransactions, updateTransaction, removeTransaction } = useTransactions(undefined, selectedSeasonId);
  const { funds } = useFunds(selectedSeasonId);

  // View state
  const [selectedViewFundId, setSelectedViewFundId] = useState<string>('');

  useEffect(() => {
    if (funds.length > 0 && !selectedViewFundId) {
      const masterFund = funds.find((f) => f.isMaster);
      if (masterFund) {
        setSelectedViewFundId(masterFund.id);
      } else {
        setSelectedViewFundId(funds[0].id);
      }
    }
  }, [funds, selectedViewFundId]);

  const selectedViewFund = funds.find((f) => f.id === selectedViewFundId);
  const isMasterFund = selectedViewFund?.isMaster === true;
  const canEditCurrentView = canEdit && !isMasterFund;

  const displayedTransactions = useMemo(() => {
    if (!selectedViewFundId) return [];
    if (isMasterFund) return expenseTransactions; // Quỹ tổng xem được tất cả
    return expenseTransactions.filter((t) => t.fundId === selectedViewFundId);
  }, [expenseTransactions, selectedViewFundId, isMasterFund]);

  const displayedTotalExpense = useMemo(() => {
    return displayedTransactions.reduce((sum, t) => sum + t.amount, 0);
  }, [displayedTransactions]);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Bulk import state
  const [bulkText, setBulkText] = useState('');

  // Form state
  const [category, setCategory] = useState<ExpenseCategory>('Sinh hoạt' as ExpenseCategory);
  const [amount, setAmount] = useState('');
  const [fundId, setFundId] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(toDateInputValue(new Date()));
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);

  // Category totals for summary cards
  const categoryTotals = useMemo(() => {
    return EXPENSE_CATEGORIES.map((cat) => {
      const categoryTransactions = displayedTransactions.filter((t) => t.category === cat.value);
      const total = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
      return { ...cat, total, count: categoryTransactions.length };
    });
  }, [displayedTransactions]);

  const canEditTransaction = (txn: any) => {
    if (!isSeasonActive) return false;
    if (txn.description?.startsWith('Cân đối quỹ:')) return false;
    if (user?.role !== 'admin' && !user?.permissions?.can_manage_chi) return false;
    const txnFund = funds.find(f => f.id === txn.fundId);
    if (!txnFund || txnFund.isMaster) return false;
    return true;
  };

  const resetForm = () => {
    setCategory('Sinh hoạt' as ExpenseCategory);
    setAmount('');
    setFundId('');
    setDescription('');
    setDate(toDateInputValue(new Date()));
    setFormError('');
    setEditingTransactionId(null);
  };

  const handleOpenModal = () => {
    if (!canEditCurrentView) return;
    resetForm();
    if (selectedViewFundId && !isMasterFund) {
      setFundId(selectedViewFundId);
    } else if (funds.length > 0) {
      setFundId(funds[0].id);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsBulkModalOpen(false);
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

    try {
      setIsSubmitting(true);

      if (editingTransactionId) {
        // Edit mode
        const txn = expenseTransactions.find(t => t.id === editingTransactionId);
        if (!txn || !canEditTransaction(txn)) return;
        
        await updateTransaction(editingTransactionId, {
          amount: parsedAmount,
          category,
          description,
          date: new Date(date)
        });
        toast('Đã cập nhật khoản chi', 'success');
      } else {
        // Add mode
        if (!fundId) {
          setFormError('Vui lòng chọn quỹ chi.');
          setIsSubmitting(false);
          return;
        }

        const selectedFund = funds.find((f) => f.id === fundId);
        if (selectedFund && selectedFund.balance < parsedAmount) {
          setFormError(`Quỹ không đủ tiền. Đang có: ${formatCurrency(selectedFund.balance)}`);
          setIsSubmitting(false);
          return;
        }

        await addTransaction({
          type: 'expense',
          amount: parsedAmount,
          category,
          fundId,
          description,
          date: new Date(date)
        });
        toast('Đã thêm khoản chi', 'success');
      }
      
      setIsModalOpen(false);
      resetForm();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Có lỗi xảy ra khi thêm khoản chi.';
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    if (!fundId) {
      setFormError('Vui lòng chọn quỹ chi.');
      return;
    }
    setFormError('');
    setIsSubmitting(true);

    try {
      const lines = bulkText.split('\n');
      let currentDate = new Date();
      const results = [];
      let totalAmount = 0;

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        
        // Match date: "21/5:" or "21/5"
        const dateMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2}):?$/);
        if (dateMatch) {
          const day = parseInt(dateMatch[1]);
          const month = parseInt(dateMatch[2]);
          const year = new Date().getFullYear();
          currentDate = new Date(year, month - 1, day);
          continue;
        }
        
        // Match expense: "Đồ ăn, nước: 85k"
        const expenseMatch = trimmed.match(/^(.*?):\s*([\d.,]+)\s*(k|K|m|M|đ|d)?$/i);
        if (expenseMatch) {
          const desc = expenseMatch[1].trim();
          let amountStr = expenseMatch[2].replace(/,/g, '.');
          let amountVal = parseFloat(amountStr);
          const unit = (expenseMatch[3] || '').toLowerCase();
          if (unit === 'k') amountVal *= 1000;
          if (unit === 'm') amountVal *= 1000000;
          
          results.push({
            type: 'expense' as const,
            amount: amountVal,
            category: 'Sinh hoạt' as ExpenseCategory, // Mặc định Sinh hoạt
            fundId,
            description: desc,
            date: new Date(currentDate)
          });
          totalAmount += amountVal;
        }
      }

      if (results.length === 0) {
        setFormError('Không tìm thấy khoản chi nào hợp lệ trong văn bản.');
        setIsSubmitting(false);
        return;
      }

      const selectedFund = funds.find((f) => f.id === fundId);
      if (selectedFund && selectedFund.balance < totalAmount) {
        setFormError(`Quỹ không đủ. Tổng: ${formatCurrency(totalAmount)}, dư quỹ: ${formatCurrency(selectedFund.balance)}`);
        setIsSubmitting(false);
        return;
      }

      await addMultipleTransactions(results);
      toast(`Đã thêm ${results.length} khoản chi thành công!`, 'success');
      setIsBulkModalOpen(false);
      setBulkText('');
    } catch (error: any) {
      setFormError(error.message || 'Lỗi khi nhập hàng loạt');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (txn: any) => {
    if (!canEditTransaction(txn)) return;
    resetForm();
    setEditingTransactionId(txn.id);
    setCategory(txn.category);
    setAmount(txn.amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.'));
    setFundId(txn.fundId);
    setDescription(txn.description);
    setDate(toDateInputValue(new Date(txn.date)));
    setIsModalOpen(true);
  };

  const handleDelete = async (e: React.MouseEvent, txn: any) => {
    e.stopPropagation();
    if (!canEditTransaction(txn)) return;
    const ok = await confirm('Bạn có chắc chắn muốn xoá khoản chi này?');
    if (!ok) return;
    try {
      await removeTransaction(txn.id);
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
      {/* ── Header ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2 rounded-xl gradient-danger">
              <TrendingDown className="w-6 h-6 text-white" />
            </div>
            Quản lý Dòng Chi
          </h1>
          {!isSeasonActive && (
            <p className="text-warning text-xs mt-2 bg-warning/10 inline-block px-2 py-1 rounded">
              Đang xem dữ liệu của mùa vụ lưu trữ. Không thể chỉnh sửa.
            </p>
          )}
          {isSeasonActive && <p className="text-muted mt-1 text-sm">Ghi nhận và theo dõi các khoản chi tiêu</p>}
        </div>
        
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
          <div className="relative inline-flex">
            <div className="btn btn-secondary flex items-center justify-between min-w-[140px] pointer-events-none pr-9">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-muted" />
                <span className="truncate max-w-[120px]">{selectedViewFund?.name || 'Chọn quỹ'} {isMasterFund && '(Tổng)'}</span>
              </div>
              <ChevronDown className="w-4 h-4 text-muted absolute right-3" />
            </div>
            <select
              value={selectedViewFundId}
              onChange={(e) => setSelectedViewFundId(e.target.value)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            >
              {funds.map((f) => (
                <option key={f.id} value={f.id} className="bg-card text-white">
                  {f.name} {f.isMaster && '(Tổng)'}
                </option>
              ))}
            </select>
          </div>

          {canEdit && (
            <div className="flex gap-2">
              <button 
                onClick={(e) => {
                  if (isMasterFund) { e.preventDefault(); return; }
                  resetForm();
                  if (selectedViewFundId && !isMasterFund) {
                    setFundId(selectedViewFundId);
                  } else if (funds.length > 0) setFundId(funds[0].id);
                  setIsBulkModalOpen(true);
                }} 
                className={`btn btn-secondary whitespace-nowrap ${isMasterFund ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
                disabled={isMasterFund}
                aria-disabled={isMasterFund}
              >
                <Receipt className="w-4 h-4 hidden sm:block" />
                Nhập Text
              </button>
              <button 
                onClick={(e) => {
                  if (isMasterFund) { e.preventDefault(); return; }
                  handleOpenModal();
                }} 
                className={`btn btn-primary whitespace-nowrap ${isMasterFund ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
                disabled={isMasterFund}
                aria-disabled={isMasterFund}
              >
                <Plus className="w-4 h-4 hidden sm:block" />
                Thêm khoản chi
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ============ Summary Cards ============ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 stagger-children">
        {/* Total expense card */}
        <div className="gradient-danger rounded-xl p-3 text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-white/90 truncate pr-2">Tổng chi ({selectedViewFund?.name || 'Tất cả'})</span>
            <TrendingDown className="w-3.5 h-3.5 text-white/70 flex-shrink-0" />
          </div>
          <p className="text-lg font-bold font-mono-num truncate">{formatCurrency(displayedTotalExpense)}</p>
          <p className="text-[10px] text-white/70 mt-0.5">{displayedTransactions.length} giao dịch</p>
        </div>

        {/* Per-category cards */}
        {categoryTotals.map((cat) => (
          <div key={cat.value} className="glass-card rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted truncate pr-2">{cat.label}</span>
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: cat.color }}
              />
            </div>
            <p className="text-base font-bold text-white font-mono-num truncate">
              {formatCurrency(cat.total)}
            </p>
            <p className="text-[10px] text-muted mt-0.5">
              {cat.count} giao dịch
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
            <p className="text-white font-medium mb-1">Chưa có khoản chi nào trong quỹ này</p>
            {canEditCurrentView && <p className="text-muted text-sm">Nhấn &quot;Thêm khoản chi&quot; để bắt đầu ghi nhận</p>}
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
                {displayedTransactions.map((txn) => {
                  const catInfo = getCategoryInfo(txn.category);
                  return (
                    <tr 
                      key={txn.id} 
                      className={`border-b border-border/50 transition-colors ${canEditTransaction(txn) ? 'cursor-pointer hover:bg-white/5' : ''}`}
                      onClick={() => {
                        if (canEditTransaction(txn)) {
                          handleEdit(txn);
                        }
                      }}
                    >
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
                          {!txn.description?.startsWith('Cân đối quỹ:') && (
                            <button
                              onClick={(e) => handleDelete(e, txn)}
                              className="btn btn-ghost btn-sm text-muted hover:text-danger"
                              title="Xoá"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
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
      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        title={editingTransactionId ? "Chỉnh sửa khoản chi" : "Thêm khoản chi"}
      >
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
            <NumericInput
              value={amount}
              onChange={(val) => setAmount(val)}
              className="input-field font-mono-num"
              placeholder="Nhập số tiền..."
              required
            />
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
              {isSubmitting ? 'Đang lưu...' : (editingTransactionId ? 'Sửa khoản chi' : 'Thêm khoản chi')}
            </button>
          </div>
        </form>
      </Modal>

      {/* ============ Bulk Text Import Modal ============ */}
      <Modal isOpen={isBulkModalOpen} onClose={handleCloseModal} title="Nhập hàng loạt từ Text">
        <form onSubmit={handleBulkSubmit} className="space-y-4">
          <div className="p-3 bg-info/10 border border-info/20 rounded-lg text-sm text-info/90">
            <p className="font-semibold mb-1">Cú pháp nhập mẫu:</p>
            <pre className="text-xs bg-black/20 p-2 rounded mt-1 font-mono">
              21/5:{'\n'}
              Đồ ăn, nước: 85k{'\n'}
              22/5:{'\n'}
              Đồ ăn sáng: 40k{'\n'}
              Tiền điện: 445k
            </pre>
          </div>

          {formError && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-danger/10 border border-danger/30 text-sm text-red-400">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}



          <div>
            <label className="block text-sm font-medium text-muted mb-1.5">Nội dung Text</label>
            <textarea
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              className="input-field min-h-[150px] font-mono text-sm"
              placeholder="Dán nội dung vào đây..."
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={handleCloseModal} className="btn btn-secondary">
              Huỷ
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting || !bulkText}>
              {isSubmitting ? 'Đang xử lý...' : 'Lưu tất cả'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
