'use server';

import { supabase } from '@/lib/supabase';
import { getSession } from './auth';

export async function getTransfers(seasonId?: string) {
  const session = await getSession();
  if (!session) return [];

  try {
    // Nếu không truyền seasonId, lấy season active
    let targetSeasonId = seasonId;
    if (!targetSeasonId) {
      const { data: activeSeason } = await supabase.from('seasons').select('id').eq('is_active', true).maybeSingle();
      if (!activeSeason) return [];
      targetSeasonId = activeSeason.id;
    }

    let query = supabase.from('transfers').select('*, funds!from_fund_id(season_id)').eq('funds.season_id', targetSeasonId).order('transfer_date', { ascending: false });
    
    if (session.role !== 'admin') {
      const { data: userFunds } = await supabase
        .from('user_funds')
        .select('fund_id')
        .eq('user_id', session.id);
        
      if (!userFunds || userFunds.length === 0) return [];
      const fundIds = userFunds.map(uf => uf.fund_id);
      
      // Transfers involving the user's funds
      query = query.or(`from_fund_id.in.(${fundIds.join(',')}),to_fund_id.in.(${fundIds.join(',')})`);
    }

    const { data, error } = await query;
    if (error) throw error;
    
    return data.map(t => ({
      id: t.id,
      fromFundId: t.from_fund_id,
      toFundId: t.to_fund_id,
      amount: parseFloat(t.amount),
      description: t.description || '',
      date: new Date(t.transfer_date),
    }));
  } catch (err) {
    console.error('getTransfers error:', err);
    return [];
  }
}

export async function addTransfer(fromFundId: string, toFundId: string, amount: number, description: string, date: Date) {
  const session = await getSession();
  if (!session || session.role !== 'admin') throw new Error('Chỉ Admin mới có quyền chuyển tiền nội bộ');

  // Kiểm tra mùa vụ active
  const { data: fund } = await supabase.from('funds').select('season_id').eq('id', fromFundId).single();
  if (fund?.season_id) {
    const { data: season } = await supabase.from('seasons').select('is_active').eq('id', fund.season_id).single();
    if (!season || !season.is_active) throw new Error('Không thể chuyển tiền trong mùa vụ đã đóng');
  }

  const { error } = await supabase
    .from('transfers')
    .insert({
      from_fund_id: fromFundId,
      to_fund_id: toFundId,
      amount,
      description,
      transfer_date: date.toISOString().split('T')[0],
      created_by: session.id
    });

  if (error) throw new Error('Lỗi khi chuyển tiền');
  return true;
}
