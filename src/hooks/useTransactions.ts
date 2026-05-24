'use client';

import useSWR from 'swr';
import { getTransactions, addTransaction as serverAddTransaction, addTransactions as serverAddTransactions, updateTransaction as serverUpdateTransaction, deleteTransaction as serverDeleteTransaction } from '@/actions/transactions';
import type { Transaction, TransactionType, IncomeCategory, ExpenseCategory, Grade } from '@/types';
import { useCallback } from 'react';

export function useTransactions(fundId?: string, seasonId?: string | null) {
  const { data: allTransactions, mutate } = useSWR(
    seasonId ? ['transactions', seasonId] : null,
    ([_, sid]) => getTransactions(sid as string)
  );
  
  let transactions = allTransactions || [];
  if (fundId) {
    transactions = transactions.filter(t => t.fundId === fundId);
  }

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
      await serverAddTransaction(data);
      mutate();
    },
    [mutate]
  );

  const addMultipleTransactions = useCallback(
    async (dataList: Omit<Transaction, 'id' | 'createdAt'>[]) => {
      await serverAddTransactions(dataList);
      mutate();
    },
    [mutate]
  );

  const updateTransaction = useCallback(
    async (id: string, data: Partial<Omit<Transaction, 'id' | 'createdAt'>>) => {
      await serverUpdateTransaction(id, data);
      mutate();
    },
    [mutate]
  );

  const removeTransaction = useCallback(async (id: string) => {
    await serverDeleteTransaction(id);
    mutate();
  }, [mutate]);

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
    addMultipleTransactions,
    updateTransaction,
    removeTransaction,
  };
}

export function useMonthlyTransactions(year: number, month: number, seasonId?: string | null) {
  const { data: allTransactions } = useSWR(
    seasonId ? ['transactions', seasonId] : null,
    ([_, sid]) => getTransactions(sid as string)
  );
  
  const transactions = (allTransactions || []).filter(t => {
    const d = new Date(t.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  return { transactions, totalIncome, totalExpense };
}
