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
import { updateFund } from '@/actions/funds';
import { getUsers, assignUserFunds, getUserFunds } from '@/actions/users';
import useSWR from 'swr';
// Use the shape returned by getFunds() action, not the old Dexie Fund type
type DBFund = { id: string; name: string; isMaster: boolean; holderId: string; balance: number; createdAt: string };
import { useApp } from '@/providers/AppProvider';

export default function FundsPage() {
  const { user } = useAuth();
  const { toast, confirm, selectedSeasonId, activeSeasonId } = useApp();
  const isSeasonActive = selectedSeasonId === activeSeasonId;
  const canEdit = (user?.role === 'admin' || user?.permissions?.can_manage_quy) && isSeasonActive;

  const { funds, masterFund, subFunds, addFund, removeFund, totalBalance } = useFunds(selectedSeasonId);
  const { isBalanced, masterBalance, totalSubBalance, systemTotal, fundCount } = useBalanceValidator(selectedSeasonId);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formHolder, setFormHolder] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingFund, setEditingFund] = useState<DBFund | null>(null);
  const [editName, setEditName] = useState('');
  const [editHolder, setEditHolder] = useState('');
  const [editBalance, setEditBalance] = useState('');
  const [editAllowedUsers, setEditAllowedUsers] = useState<string[]>([]);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  const { data: allUsers } = useSWR('users', getUsers);
  
  const getUserName = (id: string) => {
    return allUsers?.find(u => u.id === id)?.name || id;
  };
  
  // --- Fetch and cache the currently assigned funds for the editing fund ---
  // In the old Dexie code, allowedUsers were stored directly on the Fund.
  // With Supabase, we map user_funds. So we have to assign users to funds.
  // Wait, assigning user funds is actually `assignUserFunds(userId, fundIds)`.
  // To edit a fund's assigned users, we would need a different logic. Let's skip the "Allowed Users Selection" for now since permissions are better managed in the User Management page.  // --- Add Fund Handler ---
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
  const openEditModal = (fund: DBFund) => {
    setEditingFund(fund);
    setEditName(fund.name);
    setEditHolder(fund.holderId);
    setEditBalance(fund.balance.toString());
    setEditAllowedUsers([]);
    setIsEditModalOpen(true);
  };

  const handleEditFund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFund || !canEdit) return;
    setIsEditSubmitting(true);
    try {
      await updateFund(editingFund.id, editName.trim(), editHolder.trim());
      // We removed balance editing since that's handled purely by transactions now!
      setIsEditModalOpen(false);
      toast('Cập nhật quỹ thành công', 'success');
      // A small hack to force swr to refetch
      window.location.reload();
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
          {!isSeasonActive && (
            <p className="text-warning text-xs mt-1 bg-warning/10 inline-block px-2 py-1 rounded">
              Đang xem dữ liệu của mùa vụ lưu trữ. Không thể chỉnh sửa.
            </p>
          )}
          {isSeasonActive && (
            <p className="text-sm text-muted mt-1">
              Quản lý quỹ tổng và các quỹ nhánh
            </p>
          )}
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
                    Người giữ: {getUserName(masterFund.holderId)}
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
                          {getUserName(fund.holderId)}
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
            <select
              value={formHolder}
              onChange={(e) => setFormHolder(e.target.value)}
              className="input-field"
            >
              <option value="">-- Chọn người giữ quỹ --</option>
              {allUsers?.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
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
            <select
              value={editHolder}
              onChange={(e) => setEditHolder(e.target.value)}
              className="input-field"
              required
            >
              <option value="">-- Chọn người giữ quỹ --</option>
              {allUsers?.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>

          {/* Balance edit removed as per requirement */}

          {/* Gán User cho Quỹ: Tạm ẩn vì nên thực hiện ở trang Quản Lý User */}
          <div className="hidden">
            <label className="block text-sm font-medium text-white mb-2">
              Phân quyền cho User (Gắn quỹ)
            </label>
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
