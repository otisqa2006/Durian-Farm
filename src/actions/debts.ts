'use server';

import { supabase } from '@/lib/supabase';
import { getSession } from './auth';

export async function getDebts() {
  const session = await getSession();
  if (!session) return [];
  
  if (session.role !== 'admin' && !session.permissions.can_manage_quy) {
    return [];
  }

  try {
    const { data, error } = await supabase.from('debts').select('*').order('start_date', { ascending: false });
    if (error) throw error;
    
    return data.map(d => ({
      id: d.id,
      creditor: d.creditor,
      type: d.type,
      principalAmount: parseFloat(d.principal_amount),
      remainingAmount: parseFloat(d.remaining_amount),
      interestRate: d.interest_rate ? parseFloat(d.interest_rate) : undefined,
      status: d.status,
      startDate: new Date(d.start_date),
      dueDate: d.due_date ? new Date(d.due_date) : undefined,
      note: d.note || ''
    }));
  } catch (err) {
    console.error('getDebts error:', err);
    return [];
  }
}

export async function addDebt(data: any) {
  const session = await getSession();
  if (!session || session.role !== 'admin') throw new Error('Chỉ Admin mới có quyền quản lý Công nợ');

  const { error } = await supabase
    .from('debts')
    .insert({
      creditor: data.creditor,
      type: data.type,
      principal_amount: data.principalAmount,
      remaining_amount: data.principalAmount,
      interest_rate: data.interestRate,
      status: 'active',
      start_date: data.startDate.toISOString().split('T')[0],
      due_date: data.dueDate ? data.dueDate.toISOString().split('T')[0] : null,
      note: data.note,
      created_by: session.id
    });

  if (error) throw new Error('Lỗi khi thêm công nợ');
  return true;
}

export async function payDebt(debtId: string, principalPaid: number, interestPaid: number, fundId: string, date: Date) {
  const session = await getSession();
  if (!session || session.role !== 'admin') throw new Error('Chỉ Admin mới có quyền trả nợ');

  const { error } = await supabase
    .from('debt_payments')
    .insert({
      debt_id: debtId,
      fund_id: fundId,
      principal_paid: principalPaid,
      interest_paid: interestPaid,
      payment_date: date.toISOString().split('T')[0],
      created_by: session.id
    });

  if (error) throw new Error('Lỗi khi trả nợ');
  return true;
}
