'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import {
  getAllDebts,
  getDebtById,
  createDebt as dbCreateDebt,
  updateDebt as dbUpdateDebt,
  createDebtPayment as dbCreateDebtPayment,
  getPaymentsByDebt,
  getAllDebtPayments,
} from '@/lib/db';
import type { Debt, DebtPayment, DebtType } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { useCallback } from 'react';

export function useDebts() {
  const debts = useLiveQuery(() => getAllDebts(), [], []);
  const payments = useLiveQuery(() => getAllDebtPayments(), [], []);

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
      const now = new Date();
      const debt: Debt = {
        id: uuidv4(),
        ...data,
        remainingAmount: data.principalAmount,
        status: 'active',
        createdAt: now,
        updatedAt: now,
      };
      await dbCreateDebt(debt);
      return debt;
    },
    []
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
      const payment: DebtPayment = {
        id: uuidv4(),
        ...data,
        createdAt: new Date(),
      };
      await dbCreateDebtPayment(payment);
      return payment;
    },
    []
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
  const debt = useLiveQuery(() => getDebtById(debtId), [debtId]);
  const payments = useLiveQuery(() => getPaymentsByDebt(debtId), [debtId], []);

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalPrincipalPaid = payments.reduce((sum, p) => sum + p.principalPaid, 0);
  const totalInterestPaid = payments.reduce((sum, p) => sum + p.interestPaid, 0);

  return { debt, payments, totalPaid, totalPrincipalPaid, totalInterestPaid };
}
