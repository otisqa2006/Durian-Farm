'use client';

import { BookOpen, AlertCircle, TrendingDown, TrendingUp, Landmark, CalendarDays, Users } from 'lucide-react';

export default function HuongDanPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 rounded-xl bg-primary/20 text-primary">
          <BookOpen className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-white">Hướng dẫn sử dụng</h1>
      </div>

      <div className="space-y-6">
        {/* Section: Giới thiệu */}
        <section className="glass-card p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            Giới thiệu chung
          </h2>
          <p className="text-muted leading-relaxed">
            Hệ thống SRM Finance là ứng dụng quản lý tài chính nội bộ, giúp theo dõi các dòng tiền Thu/Chi, quản lý phân bổ Quỹ và theo dõi công nợ theo từng mùa vụ (từng năm). Hệ thống hỗ trợ làm việc cộng tác với nhiều người dùng và phân quyền rõ ràng.
          </p>
        </section>

        {/* Section: Mùa Vụ */}
        <section className="glass-card p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-warning" />
            1. Quản lý Mùa Vụ (Dành cho Admin)
          </h2>
          <div className="space-y-3 text-muted leading-relaxed">
            <p>- Mọi dữ liệu (Thu, Chi, Quỹ) đều được gắn liền với một <strong>Năm/Mùa vụ</strong>.</p>
            <p>- Chỉ có Admin mới có quyền tạo Mùa vụ mới trong mục <strong>Quản lý Mùa Vụ</strong>.</p>
            <p>- Khi tạo một năm mới, hệ thống sẽ tự động:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Chuyển trạng thái của năm mới thành <strong>Đang hoạt động (Active)</strong>.</li>
              <li>Tự động sao chép toàn bộ danh sách Quỹ (kể cả Quỹ Tổng) từ năm cũ sang năm mới với số dư khởi tạo bằng <strong>0đ</strong>.</li>
              <li>Các năm cũ sẽ chuyển sang trạng thái <strong>Lưu trữ</strong> (Chỉ được xem báo cáo, không thể chỉnh sửa hay thêm mới dữ liệu).</li>
            </ul>
          </div>
        </section>

        {/* Section: Quản lý Quỹ */}
        <section className="glass-card p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Landmark className="w-5 h-5 text-info" />
            2. Quản lý Quỹ
          </h2>
          <div className="space-y-3 text-muted leading-relaxed">
            <p>- Hệ thống có một <strong>Quỹ Tổng</strong> (tự động tạo) và nhiều quỹ nhánh (Ví dụ: Tiền mặt, Ngân hàng).</p>
            <p>- Bạn có thể dùng tính năng <strong>Cân đối quỹ</strong> bên trong màn hình chi tiết quỹ để điều chỉnh số dư khớp với thực tế (nhập số âm để giảm quỹ, số dương để tăng quỹ).</p>
            <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg text-warning text-sm">
              <AlertCircle className="w-4 h-4 inline-block mr-1 mb-0.5" />
              <strong>Lưu ý:</strong> Quỹ Tổng không cho phép sửa số dư thủ công. Số dư của Quỹ Tổng chỉ thay đổi khi có giao dịch luân chuyển tiền từ Quỹ Tổng xuống các Quỹ nhánh (hoặc ngược lại).
            </div>
            <p>- <strong>Chuyển tiền:</strong> Dùng để luân chuyển tiền qua lại giữa các quỹ nội bộ mà không làm thay đổi tổng tài sản.</p>
          </div>
        </section>

        {/* Section: Thu / Chi */}
        <section className="glass-card p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-danger" />
            3. Quản lý Thu / Chi
          </h2>
          <div className="space-y-3 text-muted leading-relaxed">
            <p>- <strong>Lọc theo Quỹ:</strong> Tại góc trên bên phải màn hình Thu/Chi, bạn có thể chọn Quỹ để xem các giao dịch thuộc quỹ đó.</p>
            <p>- Nếu chọn <strong>Quỹ Tổng</strong> ở bộ lọc, bạn sẽ xem được toàn bộ giao dịch của tất cả các quỹ, nhưng sẽ không thể thao tác thêm/sửa/xoá.</p>
            <p>- <strong>Nhập hàng loạt (Nhập Text):</strong> Chức năng đặc biệt giúp bạn copy/paste dữ liệu chi tiêu từ tin nhắn (Zalo/Messenger) vào hệ thống một cách nhanh chóng. Cú pháp mẫu:</p>
            <pre className="bg-black/30 p-4 rounded-lg font-mono text-sm text-white/80 mt-2">
              21/5:{'\n'}
              Đồ ăn, nước: 85k{'\n'}
              22/5:{'\n'}
              Đồ ăn sáng: 40k{'\n'}
              Vật tư: 1.5m
            </pre>
            <p className="text-sm">- Chữ `k` sẽ tự đổi thành `000`, `m` sẽ tự đổi thành `000.000`.</p>
          </div>
        </section>

        {/* Section: Phân quyền */}
        <section className="glass-card p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            4. Phân quyền Người dùng (Dành cho Admin)
          </h2>
          <div className="space-y-3 text-muted leading-relaxed">
            <p>- Admin có thể tạo tài khoản cho các nhân viên khác trong mục <strong>Quản lý User</strong>.</p>
            <p>- Mỗi User có thể được cấp quyền chuyên biệt:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Chỉ được nhập Thu hoặc chỉ được nhập Chi.</li>
              <li>Chỉ được phép thao tác trên các Quỹ nhất định (Ví dụ: Chỉ cho phép quản lý quỹ Tiền Mặt).</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
