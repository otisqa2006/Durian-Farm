'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { register } from '@/actions/auth';
import { useApp } from '@/providers/AppProvider';

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useApp();
  const [formData, setFormData] = useState({
    id: '',
    password: '',
    name: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!formData.id || !formData.password || !formData.name) {
        throw new Error('Vui lòng điền đầy đủ thông tin');
      }

      const res = await register(formData.id, formData.password);
      
      if (!res.success) {
        throw new Error(res.message);
      }

      toast('Đăng ký thành công! Hãy đăng nhập', 'success');
      router.push('/login');
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Tên đăng nhập đã tồn tại hoặc có lỗi xảy ra');
      toast(err.message || 'Tên đăng nhập đã tồn tại hoặc có lỗi xảy ra', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-surface text-white">
      <div className="glass-card w-full max-w-md p-8 animate-scale-in">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">Đăng ký tài khoản</h1>
          <p className="text-muted">Tạo tài khoản mới để sử dụng hệ thống</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-muted" htmlFor="id">
              Tên đăng nhập
            </label>
            <input
              id="id"
              name="id"
              type="text"
              value={formData.id}
              onChange={handleChange}
              className="input-field w-full"
              placeholder="Nhập tên đăng nhập"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-muted" htmlFor="name">
              Họ và tên
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              className="input-field w-full"
              placeholder="Nhập họ và tên"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-muted" htmlFor="password">
              Mật khẩu
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              className="input-field w-full"
              placeholder="Nhập mật khẩu"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary w-full mt-6 flex justify-center items-center"
          >
            {isLoading ? 'Đang xử lý...' : 'Đăng ký'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-muted">
          Đã có tài khoản?{' '}
          <Link href="/login" className="text-blue-400 hover:text-blue-300 hover:underline">
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    </div>
  );
}
