'use client';

import useSWR from 'swr';
import { getDebts, addDebt as serverAddDebt, payDebt as serverPayDebt } from '@/actions/debts';
import type { DebtType } from '@/types';
import { useCallback } from 'react';

export function useDebts() {
  const { data: allDebts, mutate } = useSWR('debts', getDebts);
  const debts = allDebts || [];
  
  // We skip loading payments for the overview for now to save bandwidth
  const payments: any[] = []; 

  const bankDebts = debts.filter(d => d.type === 'bank');
  const externalDebts = debts.filter(d => d.type === 'external');
  const activeDebts = debts.filter(d => d.status === 'active');

  const totalBankDebt = bankDebts
    .filter(d => d.status === 'active')
    .reduce((sum, d) => sum + d.remainingAmount, 0);

  const totalExternalDebt = externalDebts
    .filter(d => d.status === 'active')
    .reduce((sum, d) => sum + d.remainingAmount, 0);

  const totalDebt = totalBankDebt + totalExternalDebt;

  const addDebt = useCallback(
    async (data: {
      creditor: string;
      type: DebtType;
      principalAmount: number;
      interestRate?: number;
      startDate: Date;
      dueDate?: Date;
      note?: string;
    }) => {
      await serverAddDebt(data);
      mutate();
    },
    [mutate]
  );

  const payDebt = useCallback(
    async (data: {
      debtId: string;
      amount: number;
      principalPaid: number;
      interestPaid: number;
      fundId: string;
      date: Date;
      note?: string;
    }) => {
      await serverPayDebt(data.debtId, data.principalPaid, data.interestPaid, data.fundId, data.date);
      mutate();
    },
    [mutate]
  );

  return {
    debts,
    bankDebts,
    externalDebts,
    activeDebts,
    totalDebt,
    totalBankDebt,
    totalExternalDebt,
    payments,
    addDebt,
    payDebt,
  };
}

export function useDebtDetail(debtId: string) {
  const { data: allDebts } = useSWR('debts', getDebts);
  const debt = (allDebts || []).find(d => d.id === debtId);
  const payments: any[] = []; // Skipping payments detail for now

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalPrincipalPaid = payments.reduce((sum, p) => sum + p.principalPaid, 0);
  const totalInterestPaid = payments.reduce((sum, p) => sum + p.interestPaid, 0);

  return { debt, payments, totalPaid, totalPrincipalPaid, totalInterestPaid };
}
