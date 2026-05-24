'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { updateUser } from '@/lib/db';
import { Shield, User as UserIcon, Key, LogOut, Save } from 'lucide-react';
import { useApp } from '@/providers/AppProvider';

export default function ProfilePage() {
  const { user, logout, updateUserSession } = useAuth();
  const { toast } = useApp();
  
  const [name, setName] = useState('');
  const [isUpdatingName, setIsUpdatingName] = useState(false);

  const [password, setPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
    }
  }, [user]);

  if (!user) return null;

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast('Vui lòng nhập họ tên', 'error');
    
    setIsUpdatingName(true);
    try {
      await updateUser(user.id, { name: name.trim() });
      updateUserSession({ ...user, name: name.trim() });
      toast('Cập nhật họ tên thành công', 'success');
    } catch (err) {
      console.error(err);
      toast('Có lỗi xảy ra khi cập nhật tên', 'error');
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return toast('Vui lòng nhập mật khẩu mới', 'error');
    
    setIsUpdatingPassword(true);
    try {
      await updateUser(user.id, { passwordHash: password.trim() });
      updateUserSession({ ...user, passwordHash: password.trim() });
      setPassword('');
      toast('Đổi mật khẩu thành công', 'success');
    } catch (err) {
      console.error(err);
      toast('Có lỗi xảy ra khi đổi mật khẩu', 'error');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Cá nhân</h1>
        <p className="text-sm text-muted mt-1">
          Quản lý thông tin tài khoản và bảo mật
        </p>
      </div>

      {/* User Info Card */}
      <div className="glass-card p-6 flex items-start gap-5">
        <div className="p-4 rounded-full bg-primary/20 text-primary">
          <UserIcon className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">{user.name}</h2>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="badge badge-bank">@{user.id}</span>
            <span className="badge badge-active flex items-center gap-1">
              <Shield className="w-3 h-3" />
              {user.role === 'admin' ? 'Quản trị viên' : 'Nhân viên'}
            </span>
          </div>
        </div>
      </div>

      {/* Forms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Form 1: Update Name */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <UserIcon className="w-5 h-5 text-primary" />
            <h3 className="text-base font-bold text-white">Thông tin cá nhân</h3>
          </div>
          <form onSubmit={handleUpdateName} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted mb-1.5">Họ và tên</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field"
                placeholder="Nhập họ tên mới..."
              />
            </div>
            <button
              type="submit"
              disabled={isUpdatingName || name === user.name}
              className="btn btn-primary w-full justify-center"
            >
              <Save className="w-4 h-4" />
              {isUpdatingName ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </form>
        </div>

        {/* Form 2: Change Password */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Key className="w-5 h-5 text-warning" />
            <h3 className="text-base font-bold text-white">Đổi mật khẩu</h3>
          </div>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted mb-1.5">Mật khẩu mới</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="Nhập mật khẩu mới..."
              />
            </div>
            <button
              type="submit"
              disabled={isUpdatingPassword || !password}
              className="btn btn-secondary w-full justify-center"
            >
              <Key className="w-4 h-4" />
              {isUpdatingPassword ? 'Đang đổi...' : 'Đổi mật khẩu'}
            </button>
          </form>
        </div>
      </div>

      {/* Logout */}
      <div className="pt-6">
        <button
          onClick={logout}
          className="btn btn-danger w-full py-4 text-lg font-bold justify-center"
        >
          <LogOut className="w-6 h-6" />
          Đăng xuất
        </button>
      </div>
    </div>
  );
}
