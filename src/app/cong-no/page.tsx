'use client';

import { useState, useMemo } from 'react';
import {
  Landmark,
  HandCoins,
  Plus,
  CalendarDays,
  Percent,
  CreditCard,
  Wallet,
  AlertTriangle,
  CircleDollarSign,
} from 'lucide-react';
import { useDebts } from '@/hooks/useDebts';
import { useFunds } from '@/hooks/useFunds';
import { formatCurrency, formatDate, toDateInputValue } from '@/lib/utils';
import Modal from '@/components/ui/Modal';
import NumericInput from '@/components/ui/NumericInput';
import type { DebtType } from '@/types';

// Matches shape returned by getDebts() action
type DBDebt = {
  id: string;
  creditor: string;
  type: DebtType;
  principalAmount: number;
  remainingAmount: number;
  interestRate?: number;
  status: 'active' | 'paid';
  startDate: Date;
  dueDate?: Date;
  note: string;
};
import { useApp } from '@/providers/AppProvider';

// ─── Add Debt Form ─────────────────────────────────────────────
interface AddDebtFormData {
  creditor: string;
  principalAmount: string;
  interestRate: string;
  startDate: string;
  dueDate: string;
  note: string;
}

const initialDebtForm: AddDebtFormData = {
  creditor: '',
  principalAmount: '',
  interestRate: '',
  startDate: toDateInputValue(new Date()),
  dueDate: '',
  note: '',
};

// ─── Payment Form ──────────────────────────────────────────────
interface PaymentFormData {
  principalPaid: string;
  interestPaid: string;
  fundId: string;
  date: string;
}

const initialPaymentForm: PaymentFormData = {
  principalPaid: '',
  interestPaid: '',
  fundId: '',
  date: toDateInputValue(new Date()),
};

// ================================================================
//  Page Component
// ================================================================
export default function DebtManagementPage() {
  const { toast } = useApp();
  const {
    debts,
    bankDebts,
    externalDebts,
    totalDebt,
    totalBankDebt,
    totalExternalDebt,
    addDebt,
    payDebt,
  } = useDebts();
  const { funds } = useFunds();

  // ── Tab state ────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<DebtType>('bank');

  // ── Add Debt modal ───────────────────────────────────────────
  const [showAddModal, setShowAddModal] = useState(false);
  const [debtForm, setDebtForm] = useState<AddDebtFormData>(initialDebtForm);
  const [submittingDebt, setSubmittingDebt] = useState(false);

  // ── Payment modal ────────────────────────────────────────────
  const [payingDebt, setPayingDebt] = useState<DBDebt | null>(null);
  const [paymentForm, setPaymentForm] = useState<PaymentFormData>(initialPaymentForm);
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // ── Filtered debts by tab ────────────────────────────────────
  const filteredDebts = useMemo(() => {
    const list = activeTab === 'bank' ? bankDebts : externalDebts;
    // active debts first, then sorted by start date descending
    return [...list].sort((a, b) => {
      if (a.status !== b.status) return a.status === 'active' ? -1 : 1;
      return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
    });
  }, [activeTab, bankDebts, externalDebts]);

  // ── Computed payment total ───────────────────────────────────
  const paymentTotal = useMemo(() => {
    const principal = parseFloat(paymentForm.principalPaid) || 0;
    const interest = parseFloat(paymentForm.interestPaid) || 0;
    return principal + interest;
  }, [paymentForm.principalPaid, paymentForm.interestPaid]);

  // ── Handlers ─────────────────────────────────────────────────
  const openAddModal = () => {
    setDebtForm(initialDebtForm);
    setShowAddModal(true);
  };

  const handleAddDebt = async () => {
    const creditor = debtForm.creditor.trim();
    const principalAmount = parseFloat(debtForm.principalAmount);
    const interestRate = parseFloat(debtForm.interestRate) || undefined;

    if (!creditor) {
      toast('Vui lòng nhập tên chủ nợ / ngân hàng.', 'error');
      return;
    }
    if (!principalAmount || principalAmount <= 0) {
      toast('Số tiền gốc phải lớn hơn 0.', 'error');
      return;
    }
    if (!debtForm.startDate) {
      toast('Vui lòng chọn ngày vay.', 'error');
      return;
    }

    try {
      setSubmittingDebt(true);
      await addDebt({
        creditor,
        type: activeTab,
        principalAmount,
        interestRate: activeTab === 'bank' ? interestRate : undefined,
        startDate: new Date(debtForm.startDate),
        dueDate: debtForm.dueDate ? new Date(debtForm.dueDate) : undefined,
        note: debtForm.note.trim() || undefined,
      });
      setShowAddModal(false);
      setDebtForm(initialDebtForm);
      toast('Thêm khoản nợ thành công', 'success');
    } catch (err) {
      console.error(err);
      toast('Không thể thêm khoản nợ. Vui lòng thử lại.', 'error');
    } finally {
      setSubmittingDebt(false);
    }
  };

  const openPaymentModal = (debt: DBDebt) => {
    setPayingDebt(debt);
    setPaymentForm({
      ...initialPaymentForm,
      fundId: funds.length > 0 ? funds[0].id : '',
    });
  };

  const handlePayDebt = async () => {
    if (!payingDebt) return;

    const principalPaid = parseFloat(paymentForm.principalPaid) || 0;
    const interestPaid = parseFloat(paymentForm.interestPaid) || 0;
    const total = principalPaid + interestPaid;

    if (total <= 0) {
      toast('Tổng trả phải lớn hơn 0.', 'error');
      return;
    }
    if (principalPaid > payingDebt.remainingAmount) {
      toast(`Gốc trả không thể vượt quá số dư còn lại (${formatCurrency(payingDebt.remainingAmount)}).`, 'error');
      return;
    }
    if (!paymentForm.fundId) {
      toast('Vui lòng chọn quỹ trả.', 'error');
      return;
    }

    const selectedFund = funds.find(f => f.id === paymentForm.fundId);
    if (!selectedFund) {
      toast('Quỹ không hợp lệ.', 'error');
      return;
    }
    if (total > selectedFund.balance) {
      toast(`Số dư quỹ "${selectedFund.name}" không đủ (${formatCurrency(selectedFund.balance)}).`, 'error');
      return;
    }
    if (!paymentForm.date) {
      toast('Vui lòng chọn ngày trả.', 'error');
      return;
    }

    try {
      setSubmittingPayment(true);
      await payDebt({
        debtId: payingDebt.id,
        amount: total,
        principalPaid,
        interestPaid,
        fundId: paymentForm.fundId,
        date: new Date(paymentForm.date),
      });
      setPayingDebt(null);
      setPaymentForm(initialPaymentForm);
      toast('Đã ghi nhận thanh toán', 'success');
    } catch (err) {
      console.error(err);
      toast('Không thể trả nợ. Vui lòng thử lại.', 'error');
    } finally {
      setSubmittingPayment(false);
    }
  };

  // ── Progress helper ──────────────────────────────────────────
  const getProgress = (debt: DBDebt) => {
    if (debt.principalAmount === 0) return 0;
    return ((debt.principalAmount - debt.remainingAmount) / debt.principalAmount) * 100;
  };

  // ================================================================
  //  Render
  // ================================================================
  return (
    <div className="space-y-6 animate-fade-in">
      {/* ─── Header ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Quản lý Công nợ</h1>
          <p className="text-muted text-sm mt-1">Theo dõi nợ ngân hàng và nợ ngoài</p>
        </div>
        <button onClick={openAddModal} className="btn btn-primary">
          <Plus className="w-4 h-4" />
          Thêm khoản nợ
        </button>
      </div>

      {/* ─── Summary Cards ──────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 stagger-children">
        {/* Tổng nợ */}
        <div className="gradient-danger rounded-2xl p-5 text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-white/80">Tổng nợ</span>
          </div>
          <p className="text-2xl font-bold font-mono-num">{formatCurrency(totalDebt)}</p>
        </div>

        {/* Nợ ngân hàng */}
        <div className="gradient-info rounded-2xl p-5 text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Landmark className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-white/80">Nợ ngân hàng</span>
          </div>
          <p className="text-2xl font-bold font-mono-num">{formatCurrency(totalBankDebt)}</p>
        </div>

        {/* Nợ ngoài */}
        <div className="gradient-purple rounded-2xl p-5 text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <HandCoins className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-white/80">Nợ ngoài</span>
          </div>
          <p className="text-2xl font-bold font-mono-num">{formatCurrency(totalExternalDebt)}</p>
        </div>
      </div>

      {/* ─── Tab Navigation ─────────────────────────────────── */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('bank')}
          className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
            activeTab === 'bank'
              ? 'bg-primary text-white shadow-lg shadow-primary/30'
              : 'bg-card text-muted hover:text-white'
          }`}
        >
          <Landmark className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
          Nợ Ngân hàng
        </button>
        <button
          onClick={() => setActiveTab('external')}
          className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
            activeTab === 'external'
              ? 'bg-primary text-white shadow-lg shadow-primary/30'
              : 'bg-card text-muted hover:text-white'
          }`}
        >
          <HandCoins className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
          Nợ Ngoài
        </button>
      </div>

      {/* ─── Debt Cards ─────────────────────────────────────── */}
      {filteredDebts.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <CircleDollarSign className="w-12 h-12 text-muted mx-auto mb-3 opacity-40" />
          <p className="text-muted">
            Chưa có khoản nợ {activeTab === 'bank' ? 'ngân hàng' : 'ngoài'} nào.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 stagger-children">
          {filteredDebts.map((debt) => {
            const progress = getProgress(debt);
            const paid = debt.principalAmount - debt.remainingAmount;
            return (
              <div key={debt.id} className="glass-card p-5 space-y-4">
                {/* Top row: creditor + badges */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`p-2 rounded-xl shrink-0 ${
                      debt.type === 'bank' ? 'bg-info/20' : 'bg-purple-500/20'
                    }`}>
                      {debt.type === 'bank'
                        ? <Landmark className="w-5 h-5 text-info" />
                        : <HandCoins className="w-5 h-5 text-purple-400" />
                      }
                    </div>
                    <h3 className="text-white font-semibold truncate">{debt.creditor}</h3>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`badge ${debt.type === 'bank' ? 'badge-bank' : 'badge-external'}`}>
                      {debt.type === 'bank' ? 'Ngân hàng' : 'Nợ ngoài'}
                    </span>
                    <span className={`badge ${debt.status === 'active' ? 'badge-active' : 'badge-paid'}`}>
                      {debt.status === 'active' ? 'Đang nợ' : 'Đã trả'}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex justify-between text-xs text-muted mb-1.5">
                    <span>Tiến độ trả nợ</span>
                    <span className="font-mono-num">{progress.toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-surface rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        progress >= 100
                          ? 'bg-success'
                          : progress >= 50
                          ? 'bg-primary-light'
                          : 'bg-warning'
                      }`}
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Amount details */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-xs text-muted mb-1">Gốc vay</p>
                    <p className="text-sm font-semibold text-white font-mono-num">
                      {formatCurrency(debt.principalAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted mb-1">Đã trả</p>
                    <p className="text-sm font-semibold text-success font-mono-num">
                      {formatCurrency(paid)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted mb-1">Còn lại</p>
                    <p className="text-sm font-semibold text-danger font-mono-num">
                      {formatCurrency(debt.remainingAmount)}
                    </p>
                  </div>
                </div>

                {/* Extra info */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
                  {debt.type === 'bank' && debt.interestRate != null && (
                    <span className="flex items-center gap-1">
                      <Percent className="w-3.5 h-3.5" />
                      Lãi suất: {debt.interestRate}%/năm
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <CalendarDays className="w-3.5 h-3.5" />
                    Ngày vay: {formatDate(debt.startDate)}
                  </span>
                  {debt.dueDate && (
                    <span className="flex items-center gap-1">
                      <CalendarDays className="w-3.5 h-3.5" />
                      Đáo hạn: {formatDate(debt.dueDate)}
                    </span>
                  )}
                </div>

                {debt.note && (
                  <p className="text-xs text-muted italic border-t border-border/30 pt-3">
                    {debt.note}
                  </p>
                )}

                {/* Action */}
                {debt.status === 'active' && (
                  <div className="pt-1">
                    <button
                      onClick={() => openPaymentModal(debt)}
                      className="btn btn-primary btn-sm w-full"
                    >
                      <CreditCard className="w-4 h-4" />
                      Trả nợ
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Add Debt Modal ─────────────────────────────────── */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={`Thêm khoản nợ ${activeTab === 'bank' ? 'ngân hàng' : 'ngoài'}`}
      >
        <div className="space-y-4">
          {/* Creditor */}
          <div>
            <label className="block text-sm font-medium text-muted mb-1.5">
              {activeTab === 'bank' ? 'Ngân hàng' : 'Chủ nợ'}
            </label>
            <input
              type="text"
              className="input-field"
              placeholder={activeTab === 'bank' ? 'VD: Agribank, BIDV...' : 'Tên chủ nợ'}
              value={debtForm.creditor}
              onChange={(e) => setDebtForm(prev => ({ ...prev, creditor: e.target.value }))}
            />
          </div>

          {/* Principal */}
          <div>
            <label className="block text-sm font-medium text-muted mb-1.5">Số tiền gốc (₫)</label>
            <NumericInput
              value={debtForm.principalAmount}
              onChange={(val) => setDebtForm(prev => ({ ...prev, principalAmount: val }))}
              className="input-field"
              placeholder="Nhập số tiền gốc..."
              required
            />
          </div>

          {/* Interest rate (bank only) */}
          {activeTab === 'bank' && (
            <div>
              <label className="block text-sm font-medium text-muted mb-1.5">Lãi suất (%/năm)</label>
              <input
                type="number"
                className="input-field"
                placeholder="VD: 7.5"
                step={0.1}
                min={0}
                value={debtForm.interestRate}
                onChange={(e) => setDebtForm(prev => ({ ...prev, interestRate: e.target.value }))}
              />
            </div>
          )}

          {/* Start date */}
          <div>
            <label className="block text-sm font-medium text-muted mb-1.5">Ngày vay</label>
            <input
              type="date"
              className="input-field"
              value={debtForm.startDate}
              onChange={(e) => setDebtForm(prev => ({ ...prev, startDate: e.target.value }))}
            />
          </div>

          {/* Due date */}
          <div>
            <label className="block text-sm font-medium text-muted mb-1.5">
              Ngày đáo hạn <span className="text-muted/60">(tuỳ chọn)</span>
            </label>
            <input
              type="date"
              className="input-field"
              value={debtForm.dueDate}
              onChange={(e) => setDebtForm(prev => ({ ...prev, dueDate: e.target.value }))}
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-muted mb-1.5">Ghi chú</label>
            <textarea
              className="input-field min-h-[80px] resize-none"
              placeholder="Ghi chú thêm..."
              value={debtForm.note}
              onChange={(e) => setDebtForm(prev => ({ ...prev, note: e.target.value }))}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setShowAddModal(false)}
              className="btn btn-secondary flex-1"
            >
              Huỷ
            </button>
            <button
              onClick={handleAddDebt}
              disabled={submittingDebt}
              className="btn btn-primary flex-1"
            >
              {submittingDebt ? 'Đang lưu...' : 'Thêm khoản nợ'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ─── Payment Modal ──────────────────────────────────── */}
      <Modal
        isOpen={!!payingDebt}
        onClose={() => setPayingDebt(null)}
        title={`Trả nợ: ${payingDebt?.creditor ?? ''}`}
      >
        {payingDebt && (
          <div className="space-y-4">
            {/* Remaining display */}
            <div className="bg-surface/60 rounded-xl p-4 flex items-center justify-between">
              <span className="text-sm text-muted">Còn lại</span>
              <span className="text-lg font-bold text-danger font-mono-num">
                {formatCurrency(payingDebt.remainingAmount)}
              </span>
            </div>

            {/* Principal paid */}
            <div>
              <label className="block text-sm font-medium text-muted mb-1.5">Gốc trả (₫)</label>
              <NumericInput
                value={paymentForm.principalPaid}
                onChange={(val) => setPaymentForm(prev => ({ ...prev, principalPaid: val }))}
                className="input-field"
                placeholder="Nhập số gốc trả..."
                required
              />
            </div>

            {/* Interest paid (bank only) */}
            {payingDebt.type === 'bank' && (
              <div>
                <label className="block text-sm font-medium text-muted mb-1.5">Lãi trả (₫)</label>
                <NumericInput
                  value={paymentForm.interestPaid}
                  onChange={(val) => setPaymentForm(prev => ({ ...prev, interestPaid: val }))}
                  className="input-field"
                  placeholder="Nhập số lãi trả..."
                  required
                />
              </div>
            )}

            {/* Total display */}
            <div className="bg-surface/60 rounded-xl p-4 flex items-center justify-between">
              <span className="text-sm text-muted">Tổng trả</span>
              <span className="text-lg font-bold text-white font-mono-num">
                {formatCurrency(paymentTotal)}
              </span>
            </div>

            {/* Fund select */}
            <div>
              <label className="block text-sm font-medium text-muted mb-1.5">Quỹ trả</label>
              <select
                className="input-field"
                value={paymentForm.fundId}
                onChange={(e) => setPaymentForm(prev => ({ ...prev, fundId: e.target.value }))}
              >
                <option value="">— Chọn quỹ —</option>
                {funds.map(fund => (
                  <option key={fund.id} value={fund.id}>
                    {fund.name} — {formatCurrency(fund.balance)}
                  </option>
                ))}
              </select>
            </div>

            {/* Payment date */}
            <div>
              <label className="block text-sm font-medium text-muted mb-1.5">Ngày trả</label>
              <input
                type="date"
                className="input-field"
                value={paymentForm.date}
                onChange={(e) => setPaymentForm(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setPayingDebt(null)}
                className="btn btn-secondary flex-1"
              >
                Huỷ
              </button>
              <button
                onClick={handlePayDebt}
                disabled={submittingPayment}
                className="btn btn-primary flex-1"
              >
                <Wallet className="w-4 h-4" />
                {submittingPayment ? 'Đang xử lý...' : 'Xác nhận trả'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
