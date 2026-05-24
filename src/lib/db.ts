import Dexie, { type EntityTable } from 'dexie';
import type { Fund, Transaction, Transfer, Debt, DebtPayment, User } from '@/types';

// ==========================================
// Database Definition
// ==========================================
const db = new Dexie('SRMFinanceDB') as Dexie & {
  funds: EntityTable<Fund, 'id'>;
  transactions: EntityTable<Transaction, 'id'>;
  transfers: EntityTable<Transfer, 'id'>;
  debts: EntityTable<Debt, 'id'>;
  debtPayments: EntityTable<DebtPayment, 'id'>;
  users: EntityTable<User, 'id'>;
};

// Increment version to 2 for the new users table
db.version(2).stores({
  funds: 'id, name, type, holder, createdAt',
  transactions: 'id, type, category, fundId, date, createdAt',
  transfers: 'id, fromFundId, toFundId, date, createdAt',
  debts: 'id, type, status, creditor, createdAt',
  debtPayments: 'id, debtId, fundId, date, createdAt',
  users: 'id, role, createdAt',
});

// ==========================================
// Seed Default Data
// ==========================================
export async function seedDefaultData() {
  const fundCount = await db.funds.count();
  const now = new Date();
  
  if (fundCount === 0) {
    await db.funds.add({
      id: 'master-fund',
      name: 'Quỹ Tổng',
      holder: 'Chung',
      type: 'master',
      balance: 0,
      createdAt: now,
      updatedAt: now,
    });
  }

  const userCount = await db.users.count();
  if (userCount === 0) {
    await db.users.add({
      id: 'admin',
      passwordHash: '1234567', // Hardcoded admin password for MVP
      name: 'Administrator',
      role: 'admin',
      permissions: {
        canManageThu: true,
        canManageChi: true,
        canManageQuy: true,
        canViewBaoCao: true,
      },
      createdAt: now,
    });
  }
}

// ==========================================
// User Operations
// ==========================================
export async function getAllUsers(): Promise<User[]> {
  return db.users.orderBy('createdAt').toArray();
}

export async function getUserById(id: string): Promise<User | undefined> {
  return db.users.get(id);
}

export async function createUser(user: User): Promise<string> {
  const existing = await db.users.get(user.id);
  if (existing) throw new Error('Tài khoản đã tồn tại');
  return db.users.add(user);
}

export async function updateUser(id: string, changes: Partial<User>): Promise<void> {
  await db.users.update(id, changes);
}

export async function deleteUser(id: string): Promise<void> {
  if (id === 'admin') throw new Error('Không thể xóa tài khoản Admin mặc định');
  await db.users.delete(id);
}

// ==========================================
// Fund Operations
// ==========================================
export async function getAllFunds(): Promise<Fund[]> {
  return db.funds.orderBy('createdAt').toArray();
}

export async function getFundById(id: string): Promise<Fund | undefined> {
  return db.funds.get(id);
}

export async function createFund(fund: Fund): Promise<string> {
  return db.funds.add(fund);
}

export async function updateFund(id: string, changes: Partial<Fund>): Promise<void> {
  await db.funds.update(id, { ...changes, updatedAt: new Date() });
}

export async function updateFundBalance(id: string, newBalance: number): Promise<void> {
  await db.funds.update(id, { balance: newBalance, updatedAt: new Date() });
}

export async function deleteFund(id: string): Promise<void> {
  // Only allow deleting sub-funds with zero balance
  const fund = await db.funds.get(id);
  if (!fund) throw new Error('Quỹ không tồn tại');
  if (fund.type === 'master') throw new Error('Không thể xóa Quỹ Tổng');
  if (fund.balance !== 0) throw new Error('Quỹ phải có số dư = 0 mới xóa được');
  await db.funds.delete(id);
}

// ==========================================
// Transaction Operations
// ==========================================
export async function getAllTransactions(): Promise<Transaction[]> {
  return db.transactions.orderBy('date').reverse().toArray();
}

export async function getTransactionsByFund(fundId: string): Promise<Transaction[]> {
  return db.transactions.where('fundId').equals(fundId).reverse().sortBy('date');
}

export async function getTransactionsByDateRange(from: Date, to: Date): Promise<Transaction[]> {
  return db.transactions
    .where('date')
    .between(from, to, true, true)
    .reverse()
    .sortBy('date');
}

export async function createTransaction(txn: Transaction): Promise<void> {
  await db.transaction('rw', [db.transactions, db.funds], async () => {
    const fund = await db.funds.get(txn.fundId);
    if (!fund) throw new Error('Quỹ không tồn tại');

    if (txn.type === 'expense') {
      if (fund.balance < txn.amount) {
        throw new Error(`Số dư quỹ "${fund.name}" không đủ. Tồn quỹ: ${fund.balance}, Cần chi: ${txn.amount}`);
      }
      await db.funds.update(txn.fundId, {
        balance: fund.balance - txn.amount,
        updatedAt: new Date(),
      });
    } else {
      await db.funds.update(txn.fundId, {
        balance: fund.balance + txn.amount,
        updatedAt: new Date(),
      });
    }

    await db.transactions.add(txn);
  });
}

export async function deleteTransaction(id: string): Promise<void> {
  await db.transaction('rw', [db.transactions, db.funds], async () => {
    const txn = await db.transactions.get(id);
    if (!txn) throw new Error('Giao dịch không tồn tại');

    const fund = await db.funds.get(txn.fundId);
    if (!fund) throw new Error('Quỹ không tồn tại');

    // Reverse the transaction effect
    if (txn.type === 'income') {
      if (fund.balance < txn.amount) {
        throw new Error('Không thể xóa: số dư quỹ sẽ âm');
      }
      await db.funds.update(txn.fundId, {
        balance: fund.balance - txn.amount,
        updatedAt: new Date(),
      });
    } else {
      await db.funds.update(txn.fundId, {
        balance: fund.balance + txn.amount,
        updatedAt: new Date(),
      });
    }

    await db.transactions.delete(id);
  });
}

// ==========================================
// Transfer Operations (ATOMIC)
// ==========================================
export async function createTransfer(transfer: Transfer): Promise<void> {
  await db.transaction('rw', [db.transfers, db.funds], async () => {
    const fromFund = await db.funds.get(transfer.fromFundId);
    const toFund = await db.funds.get(transfer.toFundId);

    if (!fromFund) throw new Error('Quỹ nguồn không tồn tại');
    if (!toFund) throw new Error('Quỹ đích không tồn tại');
    if (fromFund.id === toFund.id) throw new Error('Không thể chuyển tiền cho chính mình');
    if (fromFund.balance < transfer.amount) {
      throw new Error(`Số dư quỹ "${fromFund.name}" không đủ. Tồn: ${fromFund.balance}, Cần: ${transfer.amount}`);
    }

    // Atomic: debit source + credit destination
    await db.funds.update(transfer.fromFundId, {
      balance: fromFund.balance - transfer.amount,
      updatedAt: new Date(),
    });
    await db.funds.update(transfer.toFundId, {
      balance: toFund.balance + transfer.amount,
      updatedAt: new Date(),
    });

    await db.transfers.add(transfer);
  });
}

export async function getAllTransfers(): Promise<Transfer[]> {
  return db.transfers.orderBy('date').reverse().toArray();
}

export async function getTransfersByFund(fundId: string): Promise<Transfer[]> {
  const outgoing = await db.transfers.where('fromFundId').equals(fundId).toArray();
  const incoming = await db.transfers.where('toFundId').equals(fundId).toArray();
  return [...outgoing, ...incoming].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

// ==========================================
// Debt Operations
// ==========================================
export async function getAllDebts(): Promise<Debt[]> {
  return db.debts.orderBy('createdAt').reverse().toArray();
}

export async function getDebtById(id: string): Promise<Debt | undefined> {
  return db.debts.get(id);
}

export async function createDebt(debt: Debt): Promise<void> {
  await db.debts.add(debt);
}

export async function updateDebt(id: string, changes: Partial<Debt>): Promise<void> {
  await db.debts.update(id, { ...changes, updatedAt: new Date() });
}

// ==========================================
// Debt Payment Operations (ATOMIC)
// ==========================================
export async function createDebtPayment(payment: DebtPayment): Promise<void> {
  await db.transaction('rw', [db.debtPayments, db.debts, db.funds], async () => {
    const debt = await db.debts.get(payment.debtId);
    if (!debt) throw new Error('Khoản nợ không tồn tại');

    const fund = await db.funds.get(payment.fundId);
    if (!fund) throw new Error('Quỹ không tồn tại');

    if (fund.balance < payment.amount) {
      throw new Error(`Số dư quỹ "${fund.name}" không đủ để trả nợ`);
    }

    // Deduct from fund
    await db.funds.update(payment.fundId, {
      balance: fund.balance - payment.amount,
      updatedAt: new Date(),
    });

    // Reduce debt remaining
    const newRemaining = Math.max(0, debt.remainingAmount - payment.principalPaid);
    await db.debts.update(payment.debtId, {
      remainingAmount: newRemaining,
      status: newRemaining === 0 ? 'paid' : 'active',
      updatedAt: new Date(),
    });

    await db.debtPayments.add(payment);
  });
}

export async function getPaymentsByDebt(debtId: string): Promise<DebtPayment[]> {
  return db.debtPayments.where('debtId').equals(debtId).reverse().sortBy('date');
}

export async function getAllDebtPayments(): Promise<DebtPayment[]> {
  return db.debtPayments.orderBy('date').reverse().toArray();
}

// ==========================================
// Balance Validation
// ==========================================
export async function validateBalance() {
  const funds = await db.funds.toArray();
  const master = funds.find(f => f.type === 'master');
  const subs = funds.filter(f => f.type === 'sub');

  const masterBalance = master?.balance ?? 0;
  const totalSubBalance = subs.reduce((sum, f) => sum + f.balance, 0);
  const systemTotal = masterBalance + totalSubBalance;

  return {
    isBalanced: true, // Always true by construction since we use atomic transactions
    masterBalance,
    totalSubBalance,
    systemTotal,
    fundCount: funds.length,
    funds: funds.map(f => ({ id: f.id, name: f.name, balance: f.balance, type: f.type })),
  };
}

// ==========================================
// Statistics
// ==========================================
export async function getMonthlyStats(year: number, month: number) {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);

  const transactions = await db.transactions
    .where('date')
    .between(start, end, true, true)
    .toArray();

  const income = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const expense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  return { income, expense, net: income - expense, transactionCount: transactions.length };
}

export async function getIncomeByCategory(year: number, month: number) {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);

  const transactions = await db.transactions
    .where('date')
    .between(start, end, true, true)
    .toArray();

  const incomeByCategory: Record<string, number> = {};
  transactions
    .filter(t => t.type === 'income')
    .forEach(t => {
      incomeByCategory[t.category] = (incomeByCategory[t.category] || 0) + t.amount;
    });

  return incomeByCategory;
}

export async function getExpenseByCategory(year: number, month: number) {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);

  const transactions = await db.transactions
    .where('date')
    .between(start, end, true, true)
    .toArray();

  const expenseByCategory: Record<string, number> = {};
  transactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
    });

  return expenseByCategory;
}

export { db };
