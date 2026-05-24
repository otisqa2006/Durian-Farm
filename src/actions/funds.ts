'use server';

import { supabase } from '@/lib/supabase';
import { getSession } from './auth';

export async function getFunds(seasonId?: string, forReport?: boolean) {
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

    // Tạm bỏ createMasterFundIfNeeded ở đây, vì admin sẽ dùng addSeason để tạo quỹ tổng cho năm đó

    let query = supabase.from('funds').select('*').eq('season_id', targetSeasonId);
    
    // Nếu không phải admin và không phải đang xem báo cáo (hoặc xem báo cáo nhưng k có quyền xem tất cả), chỉ lấy quỹ được gán (holder_id)
    const isReportMode = forReport && session.permissions?.can_view_baocao;
    if (session.role !== 'admin' && !isReportMode) {
      query = query.eq('holder_id', session.id);
    }

    const { data, error } = await query;
    if (error) throw error;
    
    // Map data về chuẩn cũ
    return data.map(f => ({
      id: f.id,
      name: f.name,
      isMaster: f.is_master,
      holderId: f.holder_id,
      balance: parseFloat(f.balance),
      createdAt: f.created_at
    }));
  } catch (err) {
    console.error('getFunds error:', err);
    return [];
  }
}

export async function addFund(name: string, holderId: string, seasonId: string) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    throw new Error('Chỉ Admin mới có quyền tạo quỹ');
  }

  // Kiểm tra season có active không
  const { data: season } = await supabase.from('seasons').select('is_active').eq('id', seasonId).single();
  if (!season || !season.is_active) {
    throw new Error('Không thể thêm quỹ vào mùa vụ đã đóng');
  }

  const { data, error } = await supabase
    .from('funds')
    .insert({
      name,
      holder_id: holderId,
      is_master: false,
      balance: 0,
      season_id: seasonId
    })
    .select()
    .single();

  if (error) {
    console.error('Supabase addFund error:', error);
    throw new Error('Lỗi khi tạo quỹ mới: ' + error.message);
  }

  return {
    id: data.id,
    name: data.name,
    isMaster: data.is_master,
    holderId: data.holder_id,
    balance: parseFloat(data.balance),
    createdAt: data.created_at
  };
}

export async function createMasterFundIfNeeded() {
  const session = await getSession();
  if (!session || session.role !== 'admin') return null;

  const { data: master } = await supabase
    .from('funds')
    .select('*')
    .eq('is_master', true)
    .maybeSingle();

  if (!master) {
    const { data, error } = await supabase
      .from('funds')
      .insert({
        name: 'Quỹ Tổng',
        holder_id: session.id, // Must be UUID
        is_master: true,
        balance: 0
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
  return master;
}

export async function deleteFund(id: string) {
  const session = await getSession();
  if (!session || session.role !== 'admin') throw new Error('Không có quyền');

  // Kiểm tra mùa vụ active
  const { data: fund } = await supabase.from('funds').select('season_id').eq('id', id).single();
  if (fund?.season_id) {
    const { data: season } = await supabase.from('seasons').select('is_active').eq('id', fund.season_id).single();
    if (!season || !season.is_active) throw new Error('Không thể xoá quỹ của mùa vụ đã đóng');
  }

  const { error } = await supabase.from('funds').delete().eq('id', id);
  if (error) throw new Error('Không thể xoá quỹ này');
  return true;
}

export async function updateFund(id: string, name: string, holder: string) {
  const session = await getSession();
  if (!session || session.role !== 'admin') throw new Error('Không có quyền');

  // Kiểm tra mùa vụ active
  const { data: fund } = await supabase.from('funds').select('season_id').eq('id', id).single();
  if (fund?.season_id) {
    const { data: season } = await supabase.from('seasons').select('is_active').eq('id', fund.season_id).single();
    if (!season || !season.is_active) throw new Error('Không thể sửa quỹ của mùa vụ đã đóng');
  }

  const { error } = await supabase.from('funds').update({ name, holder_id: holder }).eq('id', id);
  if (error) throw new Error('Không thể cập nhật quỹ');
  return true;
}
