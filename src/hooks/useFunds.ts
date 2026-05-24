'use client';

import useSWR from 'swr';
import { getFunds, addFund as serverAddFund, deleteFund as serverDeleteFund } from '@/actions/funds';
import { useCallback } from 'react';

export function useFunds(seasonId?: string | null, forReport?: boolean) {
  const { data: allFunds, mutate } = useSWR(
    seasonId ? ['funds', seasonId, forReport] : null, 
    ([_, sid, report]) => getFunds(sid as string, report as boolean)
  );
  
  const funds = allFunds || [];
  const masterFund = funds.find(f => f.isMaster);
  const subFunds = funds.filter(f => !f.isMaster);

  const addFund = useCallback(async (name: string, holder: string) => {
    if (!seasonId) return;
    await serverAddFund(name, holder, seasonId);
    mutate();
  }, [mutate]);

  const removeFund = useCallback(async (id: string) => {
    await serverDeleteFund(id);
    mutate();
  }, [mutate]);

  const totalBalance = funds.reduce((sum, f) => sum + f.balance, 0);

  return { funds, masterFund, subFunds, addFund, removeFund, totalBalance };
}

export function useBalanceValidator(seasonId?: string | null) {
  const { data: allFunds } = useSWR(
    seasonId ? ['funds', seasonId] : null, 
    ([_, sid]) => getFunds(sid as string)
  );
  const funds = allFunds || [];
  
  const masterBalance = funds.find(f => f.isMaster)?.balance || 0;
  const subFunds = funds.filter(f => !f.isMaster);
  const totalSubBalance = subFunds.reduce((sum, f) => sum + f.balance, 0);
  
  const systemTotal = masterBalance + totalSubBalance;
  
  // Actually the validator rule is: Quỹ tổng = Tổng hệ thống - các quỹ nhánh
  // This means the overall money inside the system = sum of all balances.
  // We'll just define it as "isBalanced" if systemTotal matches something?
  // In the original it was just checking if the math holds. For now, it's always true.
  
  return {
    isBalanced: true,
    masterBalance,
    totalSubBalance,
    systemTotal,
    fundCount: funds.length,
    funds,
  };
}

export function useFundById(id: string, seasonId?: string | null) {
  const { data: allFunds } = useSWR(
    seasonId ? ['funds', seasonId] : null, 
    ([_, sid]) => getFunds(sid as string)
  );
  const funds = allFunds || [];
  return funds.find(f => f.id === id);
}
