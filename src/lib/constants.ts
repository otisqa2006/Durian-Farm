import { IncomeCategory, ExpenseCategory } from '@/types';

// ==========================================
// Income Categories — Danh mục Thu
// ==========================================
export const INCOME_CATEGORIES: { value: IncomeCategory; label: string; color: string }[] = [
  { value: 'Ri6', label: 'Sầu riêng Ri6', color: '#10B981' },
  { value: 'Thái Dona', label: 'Sầu riêng Thái Dona', color: '#34D399' },
  { value: 'Khác', label: 'Thu nhập khác', color: '#6EE7B7' },
];

// ==========================================
// Expense Categories — Danh mục Chi
// ==========================================
export const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string; color: string }[] = [
  { value: 'Phân thuốc', label: 'Phân thuốc', color: '#F59E0B' },
  { value: 'Công làm', label: 'Công làm', color: '#EF4444' },
  { value: 'Sinh hoạt', label: 'Sinh hoạt hàng ngày', color: '#8B5CF6' },
  { value: 'Trả lãi ngân hàng', label: 'Trả lãi ngân hàng', color: '#EC4899' },
  { value: 'Khác', label: 'Chi phí khác', color: '#6B7280' },
];

// ==========================================
// Navigation Items
// ==========================================
export const NAV_ITEMS = [
  { href: '/', label: 'Tổng quan', icon: 'LayoutDashboard' as const },
  { href: '/thu', label: 'Quản lý Thu', icon: 'TrendingUp' as const },
  { href: '/chi', label: 'Quản lý Chi', icon: 'TrendingDown' as const },
  { href: '/quy', label: 'Quản lý Quỹ', icon: 'Wallet' as const },
  { href: '/chuyen-tien', label: 'Chuyển tiền', icon: 'ArrowLeftRight' as const },
  { href: '/cong-no', label: 'Công nợ', icon: 'Landmark' as const },
  { href: '/bao-cao', label: 'Báo cáo', icon: 'BarChart3' as const },
];

// ==========================================
// Chart Colors
// ==========================================
export const CHART_COLORS = [
  '#10B981', '#3B82F6', '#F59E0B', '#EF4444',
  '#8B5CF6', '#EC4899', '#14B8A6', '#F97316',
  '#06B6D4', '#84CC16',
];

// ==========================================
// Currency & Locale
// ==========================================
export const CURRENCY = 'VND';
export const LOCALE = 'vi-VN';

// ==========================================
// App Info
// ==========================================
export const APP_NAME = 'SRM Finance';
export const APP_DESCRIPTION = 'Quản lý Thu Chi Rẫy Sầu Riêng';
