'use server';

import { supabase } from '@/lib/supabase';
import { getSession } from './auth';

export type Season = {
  id: string;
  year: number;
  isActive: boolean;
  createdAt: Date;
};

export async function getSeasons(): Promise<Season[]> {
  const session = await getSession();
  if (!session) return [];

  const { data, error } = await supabase
    .from('seasons')
    .select('*')
    .order('year', { ascending: false });

  if (error) {
    console.error('getSeasons error:', error);
    return [];
  }

  return data.map(s => ({
    id: s.id,
    year: s.year,
    isActive: s.is_active,
    createdAt: new Date(s.created_at)
  }));
}

export async function addSeason(year: number) {
  const session = await getSession();
  if (!session || session.role !== 'admin') throw new Error('Chỉ Admin mới có quyền tạo năm mới');

  // Lấy năm đang active hiện tại để copy dữ liệu quỹ
  const { data: oldActiveSeason } = await supabase
    .from('seasons')
    .select('id')
    .eq('is_active', true)
    .maybeSingle();

  // Tạo mùa vụ mới và set active luôn (trigger sẽ tự deactive các mùa vụ khác)
  const { data: newSeason, error: insertError } = await supabase
    .from('seasons')
    .insert({ year, is_active: true })
    .select('id')
    .single();

  if (insertError) {
    if (insertError.code === '23505' || insertError.message.includes('seasons_year_key')) {
      throw new Error(`Năm ${year} đã tồn tại trong hệ thống. Vui lòng nhập năm khác.`);
    }
    throw new Error('Lỗi khi tạo năm: ' + insertError.message);
  }

  const newSeasonId = newSeason.id;

  // Nếu có mùa vụ cũ, copy danh sách quỹ
  if (oldActiveSeason) {
    const { data: oldFunds } = await supabase
      .from('funds')
      .select('*')
      .eq('season_id', oldActiveSeason.id);

    if (oldFunds && oldFunds.length > 0) {
      // Chuẩn bị dữ liệu quỹ mới (balance = 0)
      const newFundsData = oldFunds.map(f => ({
        name: f.name,
        holder_id: f.holder_id,
        is_master: f.is_master,
        balance: 0,
        season_id: newSeasonId
      }));

      const { data: insertedFunds, error: copyFundsError } = await supabase
        .from('funds')
        .insert(newFundsData)
        .select('id, name');

      if (!copyFundsError && insertedFunds) {
        // Tiếp tục copy quyền user_funds
        const { data: oldUserFunds } = await supabase
          .from('user_funds')
          .select('user_id, fund_id');

        if (oldUserFunds && oldUserFunds.length > 0) {
          const newUserFundsData = [];

          for (const oldUf of oldUserFunds) {
            // Tìm tên quỹ của quỹ cũ
            const oldFundName = oldFunds.find(f => f.id === oldUf.fund_id)?.name;
            if (!oldFundName) continue;

            // Tìm ID quỹ mới tương ứng (cùng tên)
            const newFundId = insertedFunds.find(f => f.name === oldFundName)?.id;
            if (newFundId) {
              newUserFundsData.push({
                user_id: oldUf.user_id,
                fund_id: newFundId
              });
            }
          }

          if (newUserFundsData.length > 0) {
            await supabase.from('user_funds').insert(newUserFundsData);
          }
        }
      }
    }
  } else {
    // Nếu không có mùa vụ cũ nào, chỉ tạo Quỹ Tổng mặc định
    await supabase.from('funds').insert({
      name: 'Quỹ Tổng',
      holder_id: session.id,
      is_master: true,
      balance: 0,
      season_id: newSeasonId
    });
  }

  return true;
}

export async function toggleSeasonActive(id: string) {
  const session = await getSession();
  if (!session || session.role !== 'admin') throw new Error('Chỉ Admin mới có quyền đổi trạng thái');

  // Set this season to active (Trigger will deactivate others)
  const { error } = await supabase
    .from('seasons')
    .update({ is_active: true })
    .eq('id', id);

  if (error) throw new Error('Lỗi khi cập nhật trạng thái');
  return true;
}
