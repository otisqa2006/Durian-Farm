'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getUsers, updateUserPermissions, deleteUser as serverDeleteUser } from '@/actions/users';
import useSWR from 'swr';
import { Permissions } from '@/types';
import { ShieldAlert, Trash2 } from 'lucide-react';
import { useApp } from '@/providers/AppProvider';

export default function QuanLyUserPage() {
  const { user } = useAuth();
  const { toast, confirm } = useApp();
  const { data, mutate, isLoading } = useSWR('users', getUsers);
  const users = data || [];

  if (isLoading) {
    return <div className="p-4 text-center text-muted">Đang tải dữ liệu...</div>;
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Truy cập bị từ chối</h1>
        <p className="text-muted text-center">
          Bạn không có quyền truy cập trang này. Vui lòng liên hệ Admin.
        </p>
      </div>
    );
  }

  const handleTogglePermission = async (userId: string, key: keyof Permissions, currentValue: boolean) => {
    try {
      const targetUser = users.find(u => u.id === userId);
      if (!targetUser) return;

      const newPermissions = {
        ...targetUser.permissions,
        [key]: !currentValue
      };

      await updateUserPermissions(userId, newPermissions);
      mutate();
      toast('Cập nhật quyền thành công', 'success');
    } catch (error: any) {
      toast(error.message || 'Lỗi khi cập nhật quyền', 'error');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const ok = await confirm(`Bạn có chắc chắn muốn xóa tài khoản "${userId}"?`);
    if (!ok) return;

    try {
      await serverDeleteUser(userId);
      mutate();
      toast('Xóa người dùng thành công', 'success');
    } catch (error: any) {
      toast(error.message || 'Lỗi khi xóa người dùng', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Quản lý Phân Quyền (RBAC)</h1>
      </div>

      <div className="glass-card p-6">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tên Đăng Nhập</th>
                <th>Họ Tên</th>
                <th>Vai Trò</th>
                <th>Quyền Hạn</th>
                <th className="text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isAdmin = u.role === 'admin';
                return (
                  <tr key={u.id}>
                    <td className="font-medium text-white">{u.id}</td>
                    <td>{u.name}</td>
                    <td>
                      <span className={`badge ${isAdmin ? 'badge-active' : 'badge-income'}`}>
                        {isAdmin ? 'Admin' : 'User'}
                      </span>
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-4">
                        <label className={`flex items-center gap-2 ${isAdmin ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                          <input
                            type="checkbox"
                            checked={u.permissions.canManageThu}
                            disabled={isAdmin}
                            onChange={() => handleTogglePermission(u.id, 'canManageThu', u.permissions.canManageThu)}
                            className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-primary-500 focus:ring-primary-500 focus:ring-offset-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                          <span className={isAdmin ? 'text-muted' : 'text-slate-300'}>Thu</span>
                        </label>
                        <label className={`flex items-center gap-2 ${isAdmin ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                          <input
                            type="checkbox"
                            checked={u.permissions.canManageChi}
                            disabled={isAdmin}
                            onChange={() => handleTogglePermission(u.id, 'canManageChi', u.permissions.canManageChi)}
                            className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-primary-500 focus:ring-primary-500 focus:ring-offset-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                          <span className={isAdmin ? 'text-muted' : 'text-slate-300'}>Chi</span>
                        </label>
                        <label className={`flex items-center gap-2 ${isAdmin ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                          <input
                            type="checkbox"
                            checked={u.permissions.canManageQuy}
                            disabled={isAdmin}
                            onChange={() => handleTogglePermission(u.id, 'canManageQuy', u.permissions.canManageQuy)}
                            className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-primary-500 focus:ring-primary-500 focus:ring-offset-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                          <span className={isAdmin ? 'text-muted' : 'text-slate-300'}>Quỹ</span>
                        </label>
                        <label className={`flex items-center gap-2 ${isAdmin ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                          <input
                            type="checkbox"
                            checked={u.permissions.canViewBaoCao}
                            disabled={isAdmin}
                            onChange={() => handleTogglePermission(u.id, 'canViewBaoCao', u.permissions.canViewBaoCao)}
                            className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-primary-500 focus:ring-primary-500 focus:ring-offset-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                          <span className={isAdmin ? 'text-muted' : 'text-slate-300'}>Báo Cáo</span>
                        </label>
                      </div>
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        disabled={isAdmin}
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800/50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title={isAdmin ? "Không thể xóa admin" : "Xóa người dùng"}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-muted">
                    Không có dữ liệu người dùng
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
