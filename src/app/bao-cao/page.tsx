'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  Tooltip, Legend, ResponsiveContainer,
  XAxis, YAxis, CartesianGrid,
} from 'recharts';
import {
  BarChart3, TrendingUp, TrendingDown, Download,
  FileSpreadsheet, FileJson, Calendar, ChevronDown,
  PieChart as PieChartIcon, Activity,
} from 'lucide-react';

import { useTransactions } from '@/hooks/useTransactions';
import { useFunds } from '@/hooks/useFunds';
import { useAuth } from '@/hooks/useAuth';
import { useApp } from '@/providers/AppProvider';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES, CHART_COLORS } from '@/lib/constants';
import { formatCurrency, formatNumber, getMonthName, formatDate } from '@/lib/utils';

// ==========================================
// Types
// ==========================================
interface MonthlyTrend {
  label: string;
  income: number;
  expense: number;
}

interface CategoryData {
  name: string;
  value: number;
  color: string;
}

// ==========================================
// Custom Tooltip
// ==========================================
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card p-3 !rounded-lg text-sm" style={{ border: '1px solid rgba(71,85,105,0.6)' }}>
      {label && <p className="text-muted mb-1 text-xs">{label}</p>}
      {payload.map((entry, i) => (
        <p key={i} className="font-mono-num font-semibold" style={{ color: entry.color }}>
          {entry.name}: {formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  );
}

function PieTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: CategoryData }> }) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div className="glass-card p-3 !rounded-lg text-sm" style={{ border: '1px solid rgba(71,85,105,0.6)' }}>
      <p className="text-white font-medium">{data.name}</p>
      <p className="font-mono-num font-semibold" style={{ color: data.color }}>
        {formatCurrency(data.value)}
      </p>
    </div>
  );
}

// ==========================================
// Pie Chart Label
// ==========================================
const RADIAN = Math.PI / 180;
function renderCustomizedLabel({
  cx, cy, midAngle, innerRadius, outerRadius, percent,
}: any) {
  if (percent < 0.05) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

// ==========================================
// Main Page Component
// ==========================================
export default function BaoCaoPage() {
  const { user } = useAuth();
  const { toast, selectedSeasonId } = useApp();
  const canView = user?.role === 'admin' || user?.permissions?.can_view_baocao;

  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());

  const { transactions } = useTransactions(undefined, selectedSeasonId, true);
  const { funds } = useFunds(selectedSeasonId, true);

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] animate-fade-in p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-danger/10 flex items-center justify-center mb-4 text-danger">
          <Activity className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Không có quyền truy cập</h1>
        <p className="text-muted">Tài khoản của bạn chưa được cấp quyền xem Báo Cáo.</p>
        <p className="text-sm text-muted mt-2">Vui lòng liên hệ Admin để được cấp quyền.</p>
      </div>
    );
  }

  // --- Monthly Stats ---
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [monthlyExpense, setMonthlyExpense] = useState(0);

  // --- Category Data ---
  const [incomeByCat, setIncomeByCat] = useState<CategoryData[]>([]);
  const [expenseByCat, setExpenseByCat] = useState<CategoryData[]>([]);

  // --- 6-Month Trend ---
  const [trendData, setTrendData] = useState<MonthlyTrend[]>([]);
  const [trendLoading, setTrendLoading] = useState(true);

  // Compute monthly stats for selected month
  useEffect(() => {
    try {
      const currentMonthTxns = transactions.filter(t => {
        const d = new Date(t.date);
        return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
      });

      const income = currentMonthTxns.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const expense = currentMonthTxns.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

      setMonthlyIncome(income);
      setMonthlyExpense(expense);

      // Income by category
      const incomeRaw: Record<string, number> = {};
      currentMonthTxns.filter(t => t.type === 'income').forEach(t => {
        incomeRaw[t.category] = (incomeRaw[t.category] || 0) + t.amount;
      });
      const incomeData: CategoryData[] = INCOME_CATEGORIES
        .map(cat => ({
          name: cat.label,
          value: incomeRaw[cat.value] || 0,
          color: cat.color,
        }))
        .filter(d => d.value > 0);
      setIncomeByCat(incomeData);

      // Expense by category
      const expenseRaw: Record<string, number> = {};
      currentMonthTxns.filter(t => t.type === 'expense').forEach(t => {
        expenseRaw[t.category] = (expenseRaw[t.category] || 0) + t.amount;
      });
      const expenseData: CategoryData[] = EXPENSE_CATEGORIES
        .map(cat => ({
          name: cat.label,
          value: expenseRaw[cat.value] || 0,
          color: cat.color,
        }))
        .filter(d => d.value > 0);
      setExpenseByCat(expenseData);
    } catch (err) {
      console.error('Failed to load monthly stats:', err);
    }
  }, [selectedYear, selectedMonth, transactions]);

  // Compute 6-month trend
  useEffect(() => {
    setTrendLoading(true);
    try {
      const result: MonthlyTrend[] = [];
      for (let i = 5; i >= 0; i--) {
        let m = selectedMonth - i;
        let y = selectedYear;
        while (m < 0) { m += 12; y -= 1; }

        const monthTxns = transactions.filter(t => {
          const d = new Date(t.date);
          return d.getFullYear() === y && d.getMonth() === m;
        });

        const income = monthTxns.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const expense = monthTxns.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

        result.push({
          label: getMonthName(m),
          income,
          expense,
        });
      }
      setTrendData(result);
    } catch (err) {
      console.error('Failed to load trend data:', err);
    } finally {
      setTrendLoading(false);
    }
  }, [selectedYear, selectedMonth, transactions]);

  // --- Net ---
  const net = monthlyIncome - monthlyExpense;

  // --- Year Options ---
  const yearOptions = useMemo(() => {
    const years: number[] = [];
    for (let y = now.getFullYear() - 5; y <= now.getFullYear() + 1; y++) {
      years.push(y);
    }
    return years;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Export CSV ---
  const exportCSV = useCallback(() => {
    try {
      const fundMap = new Map(funds.map(f => [f.id, f.name]));
      const headers = 'Ngày,Loại,Danh mục,Quỹ,Mô tả,Số tiền';
      const rows = transactions.map(t => {
        const date = formatDate(t.date);
        const type = t.type === 'income' ? 'Thu' : 'Chi';
        const fundName = fundMap.get(t.fundId) || t.fundId;
        const desc = `"${(t.description || '').replace(/"/g, '""')}"`;
        return `${date},${type},${t.category},${fundName},${desc},${t.amount}`;
      });
      const csv = [headers, ...rows].join('\n');
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `srm-finance-${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast('Xuất CSV thành công!', 'success');
    } catch (err) {
      toast('Xuất CSV thất bại: ' + (err instanceof Error ? err.message : 'Lỗi không xác định'), 'error');
    }
  }, [transactions, funds, selectedYear, selectedMonth, toast]);

  // --- Export JSON ---
  const exportJSON = useCallback(() => {
    try {
      const fundMap = new Map(funds.map(f => [f.id, f.name]));
      const data = transactions.map(t => ({
        ngay: formatDate(t.date),
        loai: t.type === 'income' ? 'Thu' : 'Chi',
        danhMuc: t.category,
        quy: fundMap.get(t.fundId) || t.fundId,
        moTa: t.description,
        soTien: t.amount,
      }));
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `srm-finance-${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast('Xuất JSON thành công!', 'success');
    } catch (err) {
      toast('Xuất JSON thất bại: ' + (err instanceof Error ? err.message : 'Lỗi không xác định'), 'error');
    }
  }, [transactions, funds, selectedYear, selectedMonth, toast]);

  // --- Format Y-Axis ---
  const formatYAxis = (value: number) => {
    if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
    return String(value);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ========== Action Bar ========== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-4">
        {/* Period Selector */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
              className="input-field pl-9 pr-8 appearance-none cursor-pointer min-w-[120px]"
            >
              {yearOptions.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(Number(e.target.value))}
              className="input-field pr-8 appearance-none cursor-pointer min-w-[140px]"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i} value={i}>{getMonthName(i)}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ========== Monthly Summary Cards ========== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger-children">
        {/* Income Card */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-muted text-sm">Thu nhập tháng</p>
                <p className="text-xs text-muted">{getMonthName(selectedMonth)} {selectedYear}</p>
              </div>
            </div>
          </div>
          <p className="text-2xl font-bold text-income font-mono-num">
            {formatCurrency(monthlyIncome)}
          </p>
        </div>

        {/* Expense Card */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-danger flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-muted text-sm">Chi phí tháng</p>
                <p className="text-xs text-muted">{getMonthName(selectedMonth)} {selectedYear}</p>
              </div>
            </div>
          </div>
          <p className="text-2xl font-bold text-expense font-mono-num">
            {formatCurrency(monthlyExpense)}
          </p>
        </div>
      </div>

      {/* Net Result */}
      <div className="glass-card p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-muted" />
          <span className="text-muted text-sm font-medium">Chênh lệch Thu - Chi ({getMonthName(selectedMonth)})</span>
        </div>
        <span className={`text-xl font-bold font-mono-num ${net >= 0 ? 'text-income' : 'text-expense'}`}>
          {net >= 0 ? '+' : ''}{formatCurrency(net)}
        </span>
      </div>

      {/* ========== Charts Row ========== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income by Category */}
        <div className="glass-card p-5">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-income" />
            Doanh thu theo loại sầu riêng
          </h2>
          {incomeByCat.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={incomeByCat} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(71,85,105,0.3)" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#94A3B8', fontSize: 12 }}
                  axisLine={{ stroke: '#334155' }}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={formatYAxis}
                  tick={{ fill: '#94A3B8', fontSize: 12 }}
                  axisLine={{ stroke: '#334155' }}
                  tickLine={false}
                />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="value" name="Doanh thu" radius={[6, 6, 0, 0]} maxBarSize={60}>
                  {incomeByCat.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-[300px] text-muted">
              <BarChart3 className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm">Chưa có dữ liệu thu nhập</p>
              <p className="text-xs mt-1">trong {getMonthName(selectedMonth)} {selectedYear}</p>
            </div>
          )}
        </div>

        {/* Expense by Category */}
        <div className="glass-card p-5">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <PieChartIcon className="w-5 h-5 text-expense" />
            Cơ cấu chi phí
          </h2>
          {expenseByCat.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={expenseByCat}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={100}
                  dataKey="value"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  stroke="rgba(15,23,42,0.8)"
                  strokeWidth={2}
                >
                  {expenseByCat.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  iconSize={10}
                  formatter={(value: string) => (
                    <span className="text-muted text-xs">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-[300px] text-muted">
              <PieChartIcon className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm">Chưa có dữ liệu chi phí</p>
              <p className="text-xs mt-1">trong {getMonthName(selectedMonth)} {selectedYear}</p>
            </div>
          )}
        </div>
      </div>

      {/* ========== 6-Month Trend ========== */}
      <div className="glass-card p-5">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-info" />
          Xu hướng Thu-Chi 6 tháng gần nhất
        </h2>
        {trendLoading ? (
          <div className="flex items-center justify-center h-[320px] text-muted">
            <div className="animate-pulse text-sm">Đang tải dữ liệu...</div>
          </div>
        ) : trendData.some(d => d.income > 0 || d.expense > 0) ? (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={trendData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(71,85,105,0.3)" />
              <XAxis
                dataKey="label"
                tick={{ fill: '#94A3B8', fontSize: 12 }}
                axisLine={{ stroke: '#334155' }}
                tickLine={false}
              />
              <YAxis
                tickFormatter={formatYAxis}
                tick={{ fill: '#94A3B8', fontSize: 12 }}
                axisLine={{ stroke: '#334155' }}
                tickLine={false}
              />
              <Tooltip content={<ChartTooltip />} />
              <Legend
                verticalAlign="top"
                iconType="circle"
                iconSize={10}
                formatter={(value: string) => (
                  <span className="text-muted text-sm">{value}</span>
                )}
              />
              <Bar dataKey="income" name="Thu nhập" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={40} />
              <Bar dataKey="expense" name="Chi phí" fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-[320px] text-muted">
            <Activity className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">Chưa có dữ liệu giao dịch</p>
            <p className="text-xs mt-1">trong 6 tháng gần nhất</p>
          </div>
        )}
      </div>

      {/* ========== Data Export ========== */}
      <div className="glass-card p-5">
        <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
          <Download className="w-5 h-5 text-muted" />
          Xuất dữ liệu
        </h2>
        <p className="text-muted text-sm mb-4">
          Tải xuống toàn bộ dữ liệu giao dịch ({transactions.length} giao dịch)
        </p>
        <div className="flex flex-wrap gap-3">
          <button onClick={exportCSV} className="btn btn-secondary">
            <FileSpreadsheet className="w-4 h-4" />
            Xuất CSV
          </button>
          <button onClick={exportJSON} className="btn btn-secondary">
            <FileJson className="w-4 h-4" />
            Xuất JSON
          </button>
        </div>
      </div>
    </div>
  );
}
