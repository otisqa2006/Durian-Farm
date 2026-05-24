'use client';

import useSWR from 'swr';
import { getTransfers, addTransfer as serverAddTransfer } from '@/actions/transfers';
import { useCallback } from 'react';

export function useTransfers(seasonId?: string | null) {
  const { data: allTransfers, mutate } = useSWR(
    seasonId ? ['transfers', seasonId] : null, 
    ([_, sid]) => getTransfers(sid as string)
  );
  const transfers = allTransfers || [];

  const addTransfer = useCallback(
    async (fromFundId: string, toFundId: string, amount: number, description: string, date: Date) => {
      if (!seasonId) return;
      await serverAddTransfer(fromFundId, toFundId, amount, description, date);
      mutate();
    },
    [mutate]
  );

  return { transfers, addTransfer };
}
