import { clsx, type ClassValue } from 'clsx';
import { LOCALE, CURRENCY } from './constants';

/**
 * Merge class names conditionally (Tailwind-friendly)
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/**
 * Format number as Vietnamese currency (VND)
 * Example: 1234567 → "1.234.567 ₫"
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency: CURRENCY,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format number with dot separators (no currency symbol)
 * Example: 1234567 → "1.234.567"
 */
export function formatNumber(amount: number): string {
  return new Intl.NumberFormat(LOCALE).format(amount);
}

/**
 * Format date to Vietnamese locale
 * Example: "24/05/2026"
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

/**
 * Format date with time
 * Example: "24/05/2026 09:30"
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

/**
 * Format date to ISO string for input[type=date]
 */
export function toDateInputValue(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Get start and end of a month
 */
export function getMonthRange(year: number, month: number) {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

/**
 * Get current month range
 */
export function getCurrentMonthRange() {
  const now = new Date();
  return getMonthRange(now.getFullYear(), now.getMonth());
}

/**
 * Parse currency input string back to number
 * Removes dots, commas, spaces, and ₫ symbol
 */
export function parseCurrencyInput(value: string): number {
  const cleaned = value.replace(/[.\s₫,]/g, '');
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? 0 : num;
}

/**
 * Generate a short ID for display purposes
 */
export function shortId(id: string): string {
  return id.substring(0, 8);
}

/**
 * Get Vietnamese month name
 */
export function getMonthName(month: number): string {
  const months = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4',
    'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8',
    'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
  ];
  return months[month] || '';
}

/**
 * Get relative time label
 */
export function getRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Vừa xong';
  if (minutes < 60) return `${minutes} phút trước`;
  if (hours < 24) return `${hours} giờ trước`;
  if (days < 7) return `${days} ngày trước`;
  return formatDate(date);
}
