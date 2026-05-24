'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { getAllTransfers, createTransfer as dbCreateTransfer } from '@/lib/db';
import type { Transfer } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { useCallback } from 'react';

export function useTransfers() {
  const transfers = useLiveQuery(() => getAllTransfers(), [], []);

  const addTransfer = useCallback(
    async (data: {
      fromFundId: string;
      toFundId: string;
      amount: number;
      description: string;
      date: Date;
    }) => {
      const transfer: Transfer = {
        id: uuidv4(),
        ...data,
        createdAt: new Date(),
      };
      await dbCreateTransfer(transfer);
      return transfer;
    },
    []
  );

  return { transfers, addTransfer };
}
