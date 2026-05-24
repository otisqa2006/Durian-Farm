'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db, createTransaction as dbCreateTransaction, deleteTransaction as dbDeleteTransaction } from '@/lib/db';
import type { Transaction, TransactionType, IncomeCategory, ExpenseCategory, Grade } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { useCallback } from 'react';

export function useTransactions(fundId?: string) {
  const transactions = useLiveQuery(
    async () => {
      let query = db.transactions.orderBy('date').reverse();
      const all = await query.toArray();
      if (fundId) {
        return all.filter(t => t.fundId === fundId);
      }
      return all;
    },
    [fundId],
    []
  );

  const addTransaction = useCallback(
    async (data: {
      type: TransactionType;
      amount: number;
      category: IncomeCategory | ExpenseCategory;
      fundId: string;
      description: string;
      date: Date;
      kg?: number;
      pricePerKg?: number;
      grade?: Grade;
    }) => {
      const txn: Transaction = {
        id: uuidv4(),
        ...data,
        createdAt: new Date(),
      };
      await dbCreateTransaction(txn);
      return txn;
    },
    []
  );

  const removeTransaction = useCallback(async (id: string) => {
    await dbDeleteTransaction(id);
  }, []);

  const incomeTransactions = transactions.filter(t => t.type === 'income');
  const expenseTransactions = transactions.filter(t => t.type === 'expense');
  const totalIncome = incomeTransactions.reduce((s, t) => s + t.amount, 0);
  const totalExpense = expenseTransactions.reduce((s, t) => s + t.amount, 0);

  return {
    transactions,
    incomeTransactions,
    expenseTransactions,
    totalIncome,
    totalExpense,
    addTransaction,
    removeTransaction,
  };
}

export function useMonthlyTransactions(year: number, month: number) {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);

  const transactions = useLiveQuery(
    async () => {
      return db.transactions
        .where('date')
        .between(start, end, true, true)
        .reverse()
        .sortBy('date');
    },
    [year, month],
    []
  );

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  return { transactions, totalIncome, totalExpense };
}
