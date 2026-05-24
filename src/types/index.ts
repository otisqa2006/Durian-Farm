// ==========================================
// SRM Finance App — Core Data Types
// ==========================================

// --- Fund (Quỹ) ---
export type FundType = 'master' | 'sub';

export interface Fund {
  id: string;
  name: string;
  holder: string;
  type: FundType;
  balance: number; // VND, always in đồng
  allowedUsers?: string[]; // Array of usernames that can access this fund
  createdAt: Date;
  updatedAt: Date;
}

// --- Transaction (Giao dịch Thu/Chi) ---
export type TransactionType = 'income' | 'expense';

export type IncomeCategory = 'Ri6' | 'Thái Dona' | 'Khác';
export type ExpenseCategory = 'Phân thuốc' | 'Công làm' | 'Sinh hoạt' | 'Trả lãi ngân hàng' | 'Khác';

export type Grade = 'A' | 'B' | 'C' | 'Dạt' | 'Kem';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number; // Always positive
  category: IncomeCategory | ExpenseCategory;
  fundId: string;
  description: string;
  date: Date;
  
  // Income specific fields
  kg?: number;
  pricePerKg?: number;
  grade?: Grade;

  createdAt: Date;
}

// --- Transfer (Chuyển tiền nội bộ) ---
export interface Transfer {
  id: string;
  fromFundId: string;
  toFundId: string;
  amount: number;
  description: string;
  date: Date;
  createdAt: Date;
}

// --- Debt (Công nợ) ---
export type DebtType = 'bank' | 'external';
export type DebtStatus = 'active' | 'paid';

export interface Debt {
  id: string;
  creditor: string;
  type: DebtType;
  principalAmount: number;
  remainingAmount: number;
  interestRate?: number; // % per year, only for bank type
  startDate: Date;
  dueDate?: Date;
  status: DebtStatus;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

// --- Debt Payment (Lịch sử trả nợ) ---
export interface DebtPayment {
  id: string;
  debtId: string;
  amount: number;
  principalPaid: number;
  interestPaid: number;
  fundId: string;
  date: Date;
  note?: string;
  createdAt: Date;
}

// --- Balance Validation ---
export interface BalanceValidation {
  isBalanced: boolean;
  masterBalance: number;
  totalSubBalance: number;
  systemTotal: number;
  computedTotal: number; // from transactions
  discrepancy: number;
}

// --- Dashboard Stats ---
export interface DashboardStats {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  totalDebt: number;
}

// --- Filter Options ---
export interface TransactionFilter {
  type?: TransactionType;
  category?: string;
  fundId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface DebtFilter {
  type?: DebtType;
  status?: DebtStatus;
}

// --- Auth & RBAC ---
export type Role = 'admin' | 'user';

export interface Permissions {
  canManageThu: boolean;
  canManageChi: boolean;
  canManageQuy: boolean;
  canViewBaoCao: boolean;
}

export interface User {
  id: string; // username
  passwordHash: string; // plain text for MVP
  name: string;
  role: Role;
  permissions: Permissions;
  createdAt: Date;
}
