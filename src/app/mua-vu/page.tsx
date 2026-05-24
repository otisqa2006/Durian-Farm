'use client';

import { useState } from 'react';
import { Plus, CalendarDays, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { useApp } from '@/providers/AppProvider';
import { addSeason, toggleSeasonActive } from '@/actions/seasons';
import Modal from '@/components/ui/Modal';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

export default function SeasonsPage() {
  const { user } = useAuth();
  const { seasons, refreshSeasons, toast, confirm } = useApp();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newYear, setNewYear] = useState<string>(new Date().getFullYear().toString());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Chỉ Admin được xem
  if (user && user.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <AlertTriangle className="w-16 h-16 text-danger mb-4 opacity-50" />
        <h2 className="text-xl font-semibold mb-2">Không có quyền truy cập</h2>
        <p className="text-muted mb-6">Trang này chỉ dành cho Quản trị viên.</p>
        <Link href="/" className="btn btn-primary">Về trang chủ</Link>
      </div>
    );
  }

  const handleAddSeason = async (e: React.FormEvent) => {
    e.preventDefault();
    const year = parseInt(newYear);
    
    if (isNaN(year) || year < 2000 || year > 2100) {
      toast('Năm không hợp lệ.', 'error');
      return;
    }
    
    if (seasons.some(s => s.year === year)) {
      toast('Mùa vụ năm này đã tồn tại!', 'error');
      return;
    }

    const confirmed = await confirm(`Bạn có chắc muốn tạo mùa vụ năm ${year}?\n\nLưu ý: Mùa vụ mới sẽ tự động được Kích hoạt (Active), tất cả các quỹ sẽ được copy sang năm mới với số dư 0.`);
    if (!confirmed) return;

    setIsSubmitting(true);
    try {
      await addSeason(year);
      toast(`Đã tạo và kích hoạt mùa vụ năm ${year} thành công!`, 'success');
      setIsModalOpen(false);
      await refreshSeasons();
    } catch (err: any) {
      toast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (id: string, year: number) => {
    const confirmed = await confirm(`Chuyển năm ${year} thành mùa vụ đang chạy (Active)?\nCác năm khác sẽ tự động chuyển thành Lưu trữ.`);
    if (!confirmed) return;

    try {
      await toggleSeasonActive(id);
      toast(`Đã kích hoạt năm ${year}`, 'success');
      await refreshSeasons();
    } catch (err: any) {
      toast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <CalendarDays className="w-8 h-8 text-primary-light" />
            Quản lý Mùa Vụ
          </h1>
          <p className="text-muted mt-1 text-sm">Thêm mùa vụ mới và quản lý trạng thái các năm</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary whitespace-nowrap">
          <Plus className="w-4 h-4" />
          Thêm Mùa Vụ
        </button>
      </div>

      <div className="p-4 bg-info/10 border border-info/20 rounded-xl flex items-start gap-3">
        <Info className="w-5 h-5 text-info shrink-0 mt-0.5" />
        <div className="text-sm text-info/90">
          <p className="font-semibold mb-1">Quy tắc hệ thống:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Chỉ có <strong>duy nhất 1 mùa vụ (năm)</strong> được Kích hoạt (Active) tại một thời điểm.</li>
            <li>Khi tạo năm mới, hệ thống sẽ <strong>tự động copy</strong> toàn bộ Quỹ Tổng & Quỹ Nhánh của năm cũ sang năm mới với số dư là 0.</li>
            <li>Các mùa vụ Lưu trữ (Deactive) chỉ có thể xem báo cáo, <strong>không thể thêm/sửa/xóa</strong> quỹ hay giao dịch.</li>
          </ul>
        </div>
      </div>

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {seasons.map(season => (
          <div key={season.id} className={`glass-card p-5 relative overflow-hidden ${season.isActive ? 'border-primary/50 ring-1 ring-primary/20' : ''}`}>
            {season.isActive && (
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-bl-full -z-10" />
            )}
            
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold font-mono-num">Năm {season.year}</h3>
                <p className="text-xs text-muted mt-1">Tạo ngày: {formatDate(season.createdAt)}</p>
              </div>
              
              {season.isActive ? (
                <span className="badge bg-primary/20 text-primary-light border border-primary/30 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Đang chạy
                </span>
              ) : (
                <span className="badge badge-outline text-muted flex items-center gap-1.5">
                  Lưu trữ
                </span>
              )}
            </div>

            <div className="pt-4 border-t border-border mt-auto">
              {!season.isActive ? (
                <button 
                  onClick={() => handleToggleActive(season.id, season.year)}
                  className="btn btn-outline border-border/50 text-muted hover:text-white hover:border-border w-full"
                >
                  Kích hoạt năm này
                </button>
              ) : (
                <button 
                  disabled
                  className="btn bg-primary/10 text-primary-light w-full cursor-default opacity-80"
                >
                  Đang Kích Hoạt
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Thêm Mùa Vụ Mới"
      >
        <form onSubmit={handleAddSeason} className="space-y-4">
          <div>
            <label className="block text-sm text-muted mb-1.5">Năm</label>
            <input
              type="number"
              value={newYear}
              onChange={(e) => setNewYear(e.target.value)}
              className="input-field font-mono-num text-lg"
              min="2000"
              max="2100"
              required
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="btn btn-secondary"
              disabled={isSubmitting}
            >
              Huỷ
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Đang tạo...' : 'Xác nhận tạo'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
