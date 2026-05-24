'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db, getAllFunds, createFund as dbCreateFund, deleteFund as dbDeleteFund, validateBalance } from '@/lib/db';
import type { Fund } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';

export function useFunds() {
  const { user } = useAuth();
  const allFunds = useLiveQuery(() => getAllFunds(), [], []);
  
  const funds = useMemo(() => {
    if (!allFunds) return [];
    if (user?.role === 'admin') return allFunds;
    // For regular users, only show funds where they are allowed
    return allFunds.filter(f => f.allowedUsers?.includes(user?.id || ''));
  }, [allFunds, user]);

  const masterFund = funds.find(f => f.type === 'master');
  const subFunds = funds.filter(f => f.type === 'sub');

  const addFund = useCallback(async (name: string, holder: string) => {
    const now = new Date();
    const fund: Fund = {
      id: uuidv4(),
      name,
      holder,
      type: 'sub',
      balance: 0,
      allowedUsers: [], // default empty, admin has to assign
      createdAt: now,
      updatedAt: now,
    };
    await dbCreateFund(fund);
    return fund;
  }, []);

  const removeFund = useCallback(async (id: string) => {
    await dbDeleteFund(id);
  }, []);

  const totalBalance = funds.reduce((sum, f) => sum + f.balance, 0);

  return { funds, masterFund, subFunds, addFund, removeFund, totalBalance };
}

export function useBalanceValidator() {
  const validation = useLiveQuery(() => validateBalance(), []);

  return {
    isBalanced: validation?.isBalanced ?? true,
    masterBalance: validation?.masterBalance ?? 0,
    totalSubBalance: validation?.totalSubBalance ?? 0,
    systemTotal: validation?.systemTotal ?? 0,
    fundCount: validation?.fundCount ?? 0,
    funds: validation?.funds ?? [],
  };
}

export function useFundById(id: string) {
  const fund = useLiveQuery(() => db.funds.get(id), [id]);
  return fund;
}
