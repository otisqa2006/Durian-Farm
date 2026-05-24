'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  AlertTriangle,
  Plus,
  Crown,
  Wallet,
  Trash2,
  ChevronRight,
  Landmark,
  Edit,
} from 'lucide-react';
import { useFunds, useBalanceValidator } from '@/hooks/useFunds';
import { formatCurrency } from '@/lib/utils';
import Modal from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';
import { useLiveQuery } from 'dexie-react-hooks';
import { getAllUsers, updateFund } from '@/lib/db';
import type { Fund } from '@/types';
import { useApp } from '@/providers/AppProvider';

export default function FundsPage() {
  const { user } = useAuth();
  const { toast, confirm } = useApp();
  const canEdit = user?.role === 'admin' || user?.permissions?.canManageQuy;

  const { funds, masterFund, subFunds, addFund, removeFund, totalBalance } = useFunds();
  const { isBalanced, masterBalance, totalSubBalance, systemTotal, fundCount } = useBalanceValidator();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formHolder, setFormHolder] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingFund, setEditingFund] = useState<Fund | null>(null);
  const [editName, setEditName] = useState('');
  const [editHolder, setEditHolder] = useState('');
  const [editBalance, setEditBalance] = useState('');
  const [editAllowedUsers, setEditAllowedUsers] = useState<string[]>([]);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  const allUsers = useLiveQuery(() => getAllUsers(), []) || [];

  // --- Add Fund Handler ---
  const handleAddFund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    const name = formName.trim();
    const holder = formHolder.trim();

    if (!name) {
      toast('Vui lòng nhập tên quỹ.', 'error');
      return;
    }
    if (!holder) {
      toast('Vui lòng nhập tên người giữ quỹ.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await addFund(name, holder);
      setFormName('');
      setFormHolder('');
      setIsModalOpen(false);
      toast('Đã tạo quỹ mới thành công', 'success');
    } catch (err) {
      console.error(err);
      toast('Không thể tạo quỹ. Vui lòng thử lại.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Delete Fund Handler ---
  const handleDeleteFund = async (id: string, name: string, balance: number) => {
    if (!canEdit) return;
    if (balance !== 0) {
      toast('Chỉ có thể xoá quỹ có số dư bằng 0.', 'error');
      return;
    }
    const confirmed = await confirm(`Bạn có chắc muốn xoá quỹ "${name}"?`);
    if (!confirmed) return;

    try {
      await removeFund(id);
      toast('Đã xoá quỹ', 'success');
    } catch (err) {
      console.error(err);
      toast('Không thể xoá quỹ. Vui lòng thử lại.', 'error');
    }
  };

  // --- Edit Fund Handlers ---
  const openEditModal = (fund: Fund) => {
    setEditingFund(fund);
    setEditName(fund.name);
    setEditHolder(fund.holder);
    setEditBalance(fund.balance.toString());
    setEditAllowedUsers(fund.allowedUsers || []);
    setIsEditModalOpen(true);
  };

  const handleEditFund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFund || !canEdit) return;
    setIsEditSubmitting(true);
    try {
      const changes: Partial<Fund> = {
        name: editName.trim(),
        holder: editHolder.trim(),
        allowedUsers: editAllowedUsers,
      };
      if (editingFund.type === 'master') {
         changes.balance = Number(editBalance) || 0;
      }
      await updateFund(editingFund.id, changes);
      setIsEditModalOpen(false);
      toast('Cập nhật quỹ thành công', 'success');
    } catch(err) {
      console.error(err);
      toast('Lỗi cập nhật quỹ', 'error');
    } finally {
      setIsEditSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ============================================
          1. Balance Invariant Check Banner
          ============================================ */}
      <div
        className={`glass-card p-5 border-2 ${
          isBalanced
            ? 'border-success/60'
            : 'border-danger/60'
        }`}
      >
        <div className="flex items-center gap-3 mb-3">
          {isBalanced ? (
            <div className="p-2 rounded-xl bg-success/15">
              <CheckCircle2 className="w-5 h-5 text-success" />
            </div>
          ) : (
            <div className="p-2 rounded-xl bg-danger/15">
              <AlertTriangle className="w-5 h-5 text-danger" />
            </div>
          )}
          <h3 className="text-sm font-bold text-white">
            {isBalanced ? 'Hệ thống cân bằng' : 'Hệ thống KHÔNG cân bằng!'}
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <span className="text-muted">Quỹ Tổng</span>
          <span className="font-mono-num font-semibold text-white">
            {formatCurrency(masterBalance)}
          </span>
          <span className="text-muted">+</span>
          <span className="text-muted">Σ Quỹ Nhánh</span>
          <span className="font-mono-num font-semibold text-white">
            {formatCurrency(totalSubBalance)}
          </span>
          <span className="text-muted">=</span>
          <span className="text-muted">Tổng hệ thống</span>
          <span
            className={`font-mono-num font-bold ${
              isBalanced ? 'text-success' : 'text-danger'
            }`}
          >
            {formatCurrency(systemTotal)}
          </span>
        </div>
      </div>

      {/* ============================================
          2. Header
          ============================================ */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Quản lý Quỹ</h1>
          <p className="text-sm text-muted mt-1">
            Quản lý quỹ tổng và các quỹ nhánh
          </p>
        </div>
        {canEdit && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary"
          >
            <Plus className="w-4 h-4" />
            Tạo Quỹ Nhánh
          </button>
        )}
      </div>

      {/* ============================================
          3. Master Fund Card
          ============================================ */}
      {masterFund && (
        <Link href={`/quy/${masterFund.id}`} className="block group">
          <div className="glass-card p-6 border-l-4 border-l-primary relative overflow-hidden">
            {/* Decorative gradient overlay */}
            <div className="absolute top-0 right-0 w-40 h-40 gradient-primary opacity-[0.07] rounded-full -translate-y-1/2 translate-x-1/2" />

            <div className="flex items-start justify-between relative z-10">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl gradient-primary shadow-lg shadow-primary/20">
                  <Crown className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-white">
                      {masterFund.name}
                    </h2>
                    <span className="badge badge-income text-[11px]">Quỹ chính</span>
                  </div>
                  <p className="text-sm text-muted mt-0.5">
                    Người giữ: {masterFund.holder}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs text-muted uppercase tracking-wide mb-1">
                    Số dư
                  </p>
                  <p className="text-2xl font-bold text-white font-mono-num">
                    {formatCurrency(masterFund.balance)}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted group-hover:text-white transition-colors" />
              </div>
            </div>

            {canEdit && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  openEditModal(masterFund);
                }}
                className="absolute top-3 right-3 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 bg-white/10 hover:bg-white/20 text-white transition-all"
                title="Chỉnh sửa quỹ"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}
          </div>
        </Link>
      )}

      {/* ============================================
          4. Sub-Fund Cards Grid
          ============================================ */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Wallet className="w-4 h-4 text-muted" />
          <h2 className="text-base font-semibold text-white">
            Quỹ Nhánh
          </h2>
          <span className="badge badge-bank text-[11px]">
            {subFunds.length} quỹ
          </span>
        </div>

        {subFunds.length === 0 ? (
          <div className="glass-card p-10 text-center">
            <Wallet className="w-10 h-10 text-muted mx-auto mb-3 opacity-40" />
            <p className="text-muted text-sm">
              Chưa có quỹ nhánh nào. Nhấn &quot;Tạo Quỹ Nhánh&quot; để bắt đầu.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
            {subFunds.map((fund) => (
              <div key={fund.id} className="glass-card p-5 relative group/card">
                {/* Card content — link to detail */}
                <Link href={`/quy/${fund.id}`} className="block">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-info/15">
                        <Wallet className="w-5 h-5 text-info" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white group-hover/card:text-primary-light transition-colors">
                          {fund.name}
                        </h3>
                        <p className="text-xs text-muted mt-0.5">
                          {fund.holder}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted opacity-0 group-hover/card:opacity-100 transition-opacity" />
                  </div>

                  <div>
                    <p className="text-xs text-muted uppercase tracking-wide mb-1">
                      Số dư
                    </p>
                    <p className="text-xl font-bold text-white font-mono-num">
                      {formatCurrency(fund.balance)}
                    </p>
                  </div>
                </Link>

                {/* Edit button */}
                {canEdit && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      openEditModal(fund);
                    }}
                    className={`absolute top-3 right-${fund.balance === 0 ? '10' : '3'} p-1.5 rounded-lg opacity-0 group-hover/card:opacity-100 hover:bg-white/10 text-muted hover:text-white transition-all`}
                    title="Chỉnh sửa quỹ"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Delete button — only if balance is 0 */}
                {canEdit && fund.balance === 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFund(fund.id, fund.name, fund.balance);
                    }}
                    className="absolute top-3 right-3 p-1.5 rounded-lg opacity-0 group-hover/card:opacity-100 hover:bg-danger/20 text-muted hover:text-danger transition-all"
                    title="Xoá quỹ"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ============================================
          5. Summary Footer
          ============================================ */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-accent/15">
            <Landmark className="w-4 h-4 text-accent" />
          </div>
          <h3 className="text-sm font-bold text-white">Tổng kết hệ thống</h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-muted uppercase tracking-wide mb-1">
              Tổng số quỹ
            </p>
            <p className="text-lg font-bold text-white font-mono-num">
              {fundCount}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted uppercase tracking-wide mb-1">
              Quỹ nhánh
            </p>
            <p className="text-lg font-bold text-white font-mono-num">
              {subFunds.length}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted uppercase tracking-wide mb-1">
              Tổng số dư hệ thống
            </p>
            <p className="text-xl font-bold text-success font-mono-num">
              {formatCurrency(totalBalance)}
            </p>
          </div>
        </div>
      </div>

      {/* ============================================
          6. Add Fund Modal
          ============================================ */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setFormName('');
          setFormHolder('');
        }}
        title="Tạo Quỹ Nhánh Mới"
      >
        <form onSubmit={handleAddFund} className="space-y-4">
          {/* Fund Name */}
          <div>
            <label className="block text-sm font-medium text-muted mb-1.5">
              Tên quỹ <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="VD: Quỹ Phân Bón"
              className="input-field"
              autoFocus
            />
          </div>

          {/* Holder Name */}
          <div>
            <label className="block text-sm font-medium text-muted mb-1.5">
              Người giữ quỹ <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={formHolder}
              onChange={(e) => setFormHolder(e.target.value)}
              placeholder="VD: Anh Ba"
              className="input-field"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                setFormName('');
                setFormHolder('');
              }}
              className="btn btn-secondary btn-sm"
            >
              Huỷ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary btn-sm"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang tạo...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Tạo quỹ
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* ============================================
          7. Edit Fund Modal
          ============================================ */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Chỉnh Sửa Quỹ"
      >
        <form onSubmit={handleEditFund} className="space-y-4">
          {/* Fund Name */}
          <div>
            <label className="block text-sm font-medium text-muted mb-1.5">
              Tên quỹ <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="input-field"
              required
            />
          </div>

          {/* Holder Name */}
          <div>
            <label className="block text-sm font-medium text-muted mb-1.5">
              Người giữ quỹ <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={editHolder}
              onChange={(e) => setEditHolder(e.target.value)}
              className="input-field"
              required
            />
          </div>

          {/* Balance for Master Fund */}
          {editingFund?.type === 'master' && (
            <div>
              <label className="block text-sm font-medium text-muted mb-1.5">
                Số dư hiện tại (₫) <span className="text-danger">*</span>
              </label>
              <input
                type="number"
                value={editBalance}
                onChange={(e) => setEditBalance(e.target.value)}
                className="input-field font-mono-num"
                required
              />
              <p className="text-xs text-info mt-1">Lưu ý: Đổi số dư quỹ tổng có thể làm lệch hệ thống nếu không khớp với giao dịch.</p>
            </div>
          )}

          {/* Allowed Users Selection */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Phân quyền cho User (Gắn quỹ)
            </label>
            <div className="bg-card/50 border border-border/50 rounded-xl p-3 max-h-48 overflow-y-auto space-y-2">
              {allUsers.filter(u => u.role !== 'admin').length === 0 ? (
                <p className="text-xs text-muted">Chưa có user nào.</p>
              ) : (
                allUsers.filter(u => u.role !== 'admin').map(u => (
                  <label key={u.id} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-border/50 bg-card text-primary focus:ring-0 focus:ring-offset-0"
                      checked={editAllowedUsers.includes(u.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setEditAllowedUsers(prev => [...prev, u.id]);
                        } else {
                          setEditAllowedUsers(prev => prev.filter(id => id !== u.id));
                        }
                      }}
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-white">{u.name}</span>
                      <span className="text-xs text-muted">@{u.id}</span>
                    </div>
                  </label>
                ))
              )}
            </div>
            <p className="text-[11px] text-muted mt-2">Admin mặc định có quyền với tất cả các quỹ.</p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="btn btn-secondary btn-sm"
            >
              Huỷ
            </button>
            <button
              type="submit"
              disabled={isEditSubmitting}
              className="btn btn-primary btn-sm"
            >
              {isEditSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
