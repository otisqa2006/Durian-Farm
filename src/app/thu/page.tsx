'use client';

import { useState } from 'react';
import { Plus, Trash2, TrendingUp, Leaf, TreePalm } from 'lucide-react';
import { useTransactions } from '@/hooks/useTransactions';
import { useFunds } from '@/hooks/useFunds';
import { INCOME_CATEGORIES } from '@/lib/constants';
import { formatCurrency, formatDate, toDateInputValue } from '@/lib/utils';
import Modal from '@/components/ui/Modal';
import type { IncomeCategory, Grade } from '@/types';

import { useAuth } from '@/hooks/useAuth';
import { useApp } from '@/providers/AppProvider';

// ─── Initial form state ──────────────────────────────
const defaultForm = () => ({
  category: INCOME_CATEGORIES[0].value as IncomeCategory,
  grade: 'A' as Grade,
  kg: '',
  pricePerKg: '',
  description: '',
  date: toDateInputValue(new Date()),
});

// ======================================================
// Thu (Income) Page
// ======================================================
export default function ThuPage() {
  const { user } = useAuth();
  const { toast, confirm } = useApp();
  const canEdit = user?.role === 'admin' || user?.permissions?.canManageThu;

  const { incomeTransactions, totalIncome, addTransaction, removeTransaction } =
    useTransactions();
  const { funds, masterFund } = useFunds();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);

  // ─── Derived KPIs ─────────────────────────────────
  const incomeRi6 = incomeTransactions
    .filter((t) => t.category === 'Ri6')
    .reduce((s, t) => s + t.amount, 0);

  const incomeTD = incomeTransactions
    .filter((t) => t.category === 'Thái Dona')
    .reduce((s, t) => s + t.amount, 0);

  // ─── Helpers ──────────────────────────────────────
  const fundName = (fundId: string) =>
    funds.find((f) => f.id === fundId)?.name ?? '—';

  const categoryLabel = (value: string) =>
    INCOME_CATEGORIES.find((c) => c.value === value)?.label ?? value;

  const openModal = () => {
    if (!canEdit) return;
    setForm(defaultForm());
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setForm(defaultForm);
  };

  // ─── Submit handler ───────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;

    if (!masterFund) {
      toast('Lỗi: Không tìm thấy Quỹ Tổng trong hệ thống.', 'error');
      return;
    }

    const numKg = Number(form.kg);
    const priceStr = form.pricePerKg.toString().replace(/\./g, '');
    const price = Number(priceStr);
    const amount = numKg * price;

    if (!numKg || numKg <= 0) {
      toast('Vui lòng nhập số kg hợp lệ.', 'error');
      return;
    }
    if (!price || price <= 0) {
      toast('Vui lòng nhập đơn giá hợp lệ.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const extraInfo = `[Mẫu ${form.grade}] ${numKg}kg x ${formatCurrency(price)}`;
      const finalDescription = form.description ? `${extraInfo} - ${form.description}` : extraInfo;

      await addTransaction({
        type: 'income',
        amount,
        category: form.category,
        fundId: masterFund.id,
        description: finalDescription,
        date: new Date(form.date),
        kg: numKg,
        pricePerKg: price,
        grade: form.grade,
      });
      toast('Đã thêm khoản thu thành công!', 'success');
      closeModal();
    } catch (err) {
      console.error(err);
      toast('Có lỗi xảy ra khi thêm khoản thu. Vui lòng thử lại.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Delete handler ───────────────────────────────
  const handleDelete = async (id: string) => {
    if (!canEdit) return;
    const ok = await confirm('Bạn có chắc muốn xoá khoản thu này?');
    if (!ok) return;
    try {
      await removeTransaction(id);
      toast('Đã xoá khoản thu', 'success');
    } catch (err) {
      console.error(err);
      toast('Không thể xoá. Vui lòng thử lại.', 'error');
    }
  };

  // ──────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Header ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Quản lý Dòng Thu</h1>
        {canEdit && (
          <button onClick={openModal} className="btn btn-primary gap-2">
            <Plus className="w-4 h-4" />
            Thêm khoản thu
          </button>
        )}
      </div>

      {/* ── Summary Cards ──────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 stagger-children">
        {/* Tổng thu */}
        <div className="glass-card gradient-primary p-5 animate-slide-up">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-white/10">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm text-white/70">Tổng thu</span>
          </div>
          <p className="text-2xl font-bold text-white font-mono-num">
            {formatCurrency(totalIncome)}
          </p>
        </div>

        {/* Thu Ri6 */}
        <div className="glass-card p-5 animate-slide-up">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <Leaf className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-sm text-muted">Thu Ri6</span>
          </div>
          <p className="text-2xl font-bold text-white font-mono-num">
            {formatCurrency(incomeRi6)}
          </p>
        </div>

        {/* Thu Thái Dona */}
        <div className="glass-card p-5 animate-slide-up">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-teal-500/10">
              <TreePalm className="w-5 h-5 text-teal-400" />
            </div>
            <span className="text-sm text-muted">Thu Thái Dona</span>
          </div>
          <p className="text-2xl font-bold text-white font-mono-num">
            {formatCurrency(incomeTD)}
          </p>
        </div>
      </div>

      {/* ── Transaction Table ──────────────────────── */}
      <div className="glass-card p-0 overflow-hidden animate-slide-up">
        <div className="px-6 py-4 border-b border-border/50">
          <h2 className="text-base font-bold text-white">
            Danh sách khoản thu
          </h2>
        </div>

        {incomeTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted">
            <TrendingUp className="w-10 h-10 mb-3 opacity-30" />
            <p>Chưa có khoản thu nào</p>
            {canEdit && (
              <button
                onClick={openModal}
                className="mt-3 btn btn-primary btn-sm gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Thêm ngay
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ngày</th>
                  <th>Loại</th>
                  <th>Quỹ</th>
                  <th>Mô tả</th>
                  <th className="text-right">Số tiền</th>
                  {canEdit && <th className="text-center">Thao tác</th>}
                </tr>
              </thead>
              <tbody>
                {incomeTransactions.map((txn) => (
                  <tr key={txn.id}>
                    <td className="whitespace-nowrap">
                      {formatDate(txn.date)}
                    </td>
                    <td>
                      <span className="badge badge-income">
                        {categoryLabel(txn.category)}
                      </span>
                    </td>
                    <td>{fundName(txn.fundId)}</td>
                    <td className="max-w-[200px] truncate">
                      {txn.description || '—'}
                    </td>
                    <td className="text-right font-mono-num text-emerald-400 font-semibold whitespace-nowrap">
                      +{formatCurrency(txn.amount)}
                    </td>
                    {canEdit && (
                      <td className="text-center">
                        <button
                          onClick={() => handleDelete(txn.id)}
                          className="btn btn-ghost btn-sm text-muted hover:text-red-400"
                          title="Xoá"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Add Income Modal ───────────────────────── */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title="Thêm khoản thu"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Loại sầu riêng */}
            <div>
              <label className="block text-sm text-muted mb-1.5">
                Loại sầu riêng
              </label>
              <select
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value as IncomeCategory })
                }
                className="input-field"
                required
              >
                {INCOME_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Mẫu (Grade) */}
            <div>
              <label className="block text-sm text-muted mb-1.5">
                Mẫu
              </label>
              <select
                value={form.grade}
                onChange={(e) =>
                  setForm({ ...form, grade: e.target.value as Grade })
                }
                className="input-field"
                required
              >
                {['A', 'B', 'C', 'Dạt', 'Kem'].map((g) => (
                  <option key={g} value={g}>Mẫu {g}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Số kg */}
            <div>
              <label className="block text-sm text-muted mb-1.5">
                Số lượng (kg)
              </label>
              <input
                type="number"
                value={form.kg}
                onChange={(e) => setForm({ ...form, kg: e.target.value })}
                min={0}
                step={0.1}
                placeholder="Ví dụ: 150"
                className="input-field"
                required
              />
            </div>

            {/* Giá / kg */}
            <div>
              <label className="block text-sm text-muted mb-1.5">
                Giá / kg (₫)
              </label>
              <input
                type="text"
                value={form.pricePerKg}
                onChange={(e) => {
                  const rawValue = e.target.value.replace(/\D/g, '');
                  const formatted = rawValue.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
                  setForm({ ...form, pricePerKg: formatted });
                }}
                placeholder="Ví dụ: 65.000"
                className="input-field"
                required
              />
            </div>
          </div>

          {/* Tổng tiền tự tính */}
          <div>
            <label className="block text-sm text-muted mb-1.5">
              Tổng số tiền (₫)
            </label>
            <div className="input-field bg-card/50 text-emerald-400 font-bold font-mono-num cursor-not-allowed border-border/30">
              {(() => {
                const numKg = Number(form.kg) || 0;
                const price = Number(form.pricePerKg.toString().replace(/\./g, '')) || 0;
                return formatCurrency(numKg * price);
              })()}
            </div>
          </div>

          {/* Quỹ nhận (Read-only) */}
          <div>
            <label className="block text-sm text-muted mb-1.5">
              Quỹ nhận (Mặc định)
            </label>
            <div className="input-field bg-card/50 text-white cursor-not-allowed border-border/30">
              {masterFund ? `${masterFund.name} (${masterFund.holder})` : 'Quỹ Tổng (Chung)'}
            </div>
          </div>

          {/* Mô tả */}
          <div>
            <label className="block text-sm text-muted mb-1.5">Mô tả</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="Ghi chú ngắn..."
              className="input-field"
            />
          </div>

          {/* Ngày */}
          <div>
            <label className="block text-sm text-muted mb-1.5">Ngày</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="input-field"
              required
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={closeModal}
              className="btn btn-secondary"
              disabled={submitting}
            >
              Huỷ
            </button>
            <button
              type="submit"
              className="btn btn-primary gap-2"
              disabled={submitting}
            >
              {submitting ? (
                <>Đang lưu…</>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Thêm khoản thu
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
