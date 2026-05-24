'use server';

import { supabase } from '@/lib/supabase';
import { getSession } from './auth';
import { Transaction } from '@/types';

export async function getTransactions(seasonId?: string, forReport?: boolean) {
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

    let query = supabase.from('transactions').select('*, funds!inner(is_master, season_id, holder_id)').eq('funds.season_id', targetSeasonId).order('transaction_date', { ascending: false });
    
    // Nếu không phải admin và không đang ở trang báo cáo, chỉ lấy các giao dịch thuộc quỹ mà user đó đang giữ
    const isReportMode = forReport && session.permissions?.can_view_baocao;
    if (session.role !== 'admin' && !isReportMode) {
      query = query.eq('funds.holder_id', session.id);
    }

    const { data, error } = await query;
    if (error) throw error;
    
    return data.map(t => ({
      id: t.id,
      type: t.type,
      category: t.category,
      amount: parseFloat(t.amount),
      fundId: t.fund_id,
      description: t.description,
      date: new Date(t.transaction_date),
      kg: parseFloat(t.kg || '0') || undefined,
      pricePerKg: parseFloat(t.price_per_kg || '0') || undefined,
      grade: t.grade || undefined,
      createdAt: new Date(t.created_at)
    })) as Transaction[];
  } catch (error) {
    console.error('Lỗi khi lấy giao dịch:', error);
    return [];
  }
}

export async function addTransaction(data: Omit<Transaction, 'id' | 'createdAt'>) {
  const session = await getSession();
  if (!session) throw new Error('Cần đăng nhập');

  // Kiểm tra quyền
  const perms = session.permissions;
  if (data.type === 'income' && !perms.can_manage_thu && session.role !== 'admin') {
    throw new Error('Bạn không có quyền quản lý Thu');
  }
  if (data.type === 'expense' && !perms.can_manage_chi && session.role !== 'admin') {
    throw new Error('Bạn không có quyền quản lý Chi');
  }

  // Nếu là user thường, kiểm tra xem có được gán quỹ này không
  if (session.role !== 'admin') {
    const { data: userFunds } = await supabase
      .from('user_funds')
      .select('fund_id')
      .eq('user_id', session.id)
      .eq('fund_id', data.fundId)
      .single();
      
    if (!userFunds) throw new Error('Bạn không có quyền thêm giao dịch vào quỹ này');
  }

  // Kiểm tra mùa vụ của quỹ
  const { data: fund } = await supabase.from('funds').select('season_id').eq('id', data.fundId).single();
  if (fund?.season_id) {
    const { data: season } = await supabase.from('seasons').select('is_active').eq('id', fund.season_id).single();
    if (!season || !season.is_active) {
      throw new Error('Không thể thêm giao dịch vào mùa vụ đã đóng');
    }
  }

  const { error } = await supabase
    .from('transactions')
    .insert({
      type: data.type,
      amount: data.amount,
      category: data.category,
      fund_id: data.fundId,
      description: data.description,
      kg: data.kg,
      price_per_kg: data.pricePerKg,
      grade: data.grade,
      transaction_date: data.date.toISOString().split('T')[0],
      created_by: session.id
    })
    .select()
    .single();

  if (error) throw new Error('Lỗi khi thêm giao dịch: ' + error.message);
  
  return true;
}

export async function deleteTransaction(id: string) {
  const session = await getSession();
  if (!session || session.role !== 'admin') throw new Error('Chỉ Admin mới có quyền xoá giao dịch');

  // Lấy thông tin giao dịch trước khi xoá
  const { data: txn } = await supabase.from('transactions').select('description, fund_id').eq('id', id).single();
  
  if (txn) {
    if (txn.description && txn.description.startsWith('Cân đối quỹ:')) {
      throw new Error('Không thể xoá giao dịch cân đối quỹ thủ công');
    }

    // Kiểm tra mùa vụ active
    const { data: fund } = await supabase.from('funds').select('season_id').eq('id', txn.fund_id).single();
    if (fund?.season_id) {
      const { data: season } = await supabase.from('seasons').select('is_active').eq('id', fund.season_id).single();
      if (!season || !season.is_active) throw new Error('Không thể xoá giao dịch của mùa vụ đã đóng');
    }
  }

  const { error } = await supabase.from('transactions').delete().eq('id', id);
  if (error) throw new Error('Lỗi khi xoá giao dịch');
  return true;
}

export async function addTransactions(dataList: Omit<Transaction, 'id' | 'createdAt'>[]) {
  const session = await getSession();
  if (!session) throw new Error('Cần đăng nhập');

  if (dataList.length === 0) return true;

  const perms = session.permissions;
  
  // Verify permissions for all items
  for (const data of dataList) {
    if (data.type === 'income' && !perms.can_manage_thu && session.role !== 'admin') {
      throw new Error('Bạn không có quyền quản lý Thu');
    }
    if (data.type === 'expense' && !perms.can_manage_chi && session.role !== 'admin') {
      throw new Error('Bạn không có quyền quản lý Chi');
    }
  }

  // Pre-fetch funds if user is not admin
  if (session.role !== 'admin') {
    const { data: userFunds } = await supabase
      .from('user_funds')
      .select('fund_id')
      .eq('user_id', session.id);
    
    const allowedFundIds = new Set((userFunds || []).map(uf => uf.fund_id));
    for (const data of dataList) {
      if (!allowedFundIds.has(data.fundId)) {
        throw new Error('Bạn không có quyền thêm giao dịch vào quỹ: ' + data.fundId);
      }
    }
  }

  // Active season check
  const { data: activeSeason } = await supabase.from('seasons').select('id').eq('is_active', true).maybeSingle();

  // Fetch all related funds to check their season_id
  const fundIds = Array.from(new Set(dataList.map(d => d.fundId)));
  const { data: funds } = await supabase.from('funds').select('id, season_id').in('id', fundIds);
  
  const fundSeasonMap = new Map((funds || []).map(f => [f.id, f.season_id]));

  for (const data of dataList) {
    const seasonId = fundSeasonMap.get(data.fundId);
    if (seasonId) {
      if (!activeSeason || seasonId !== activeSeason.id) {
        throw new Error('Không thể thêm giao dịch vào quỹ thuộc mùa vụ đã lưu trữ (Deactive)');
      }
    }
  }

  const inserts = dataList.map(data => ({
    type: data.type,
    amount: data.amount,
    category: data.category,
    fund_id: data.fundId,
    description: data.description,
    transaction_date: data.date.toISOString(),
    kg: data.kg,
    price_per_kg: data.pricePerKg,
    grade: data.grade,
    created_by: session.id
  }));

  const { error } = await supabase.from('transactions').insert(inserts);
  if (error) throw new Error('Lỗi khi thêm giao dịch: ' + error.message);
  
  return true;
}

export async function updateTransaction(id: string, data: Partial<Omit<Transaction, 'id' | 'createdAt'>>) {
  const session = await getSession();
  if (!session) throw new Error('Cần đăng nhập');

  // Lấy thông tin giao dịch hiện tại
  const { data: txn } = await supabase.from('transactions').select('*, funds!inner(season_id)').eq('id', id).single();
  if (!txn) throw new Error('Không tìm thấy giao dịch');

  if (txn.description && txn.description.startsWith('Cân đối quỹ:')) {
    throw new Error('Không thể sửa giao dịch cân đối quỹ thủ công');
  }

  // Kiểm tra mùa vụ active
  const { data: season } = await supabase.from('seasons').select('is_active').eq('id', txn.funds.season_id).single();
  if (!season || !season.is_active) throw new Error('Không thể sửa giao dịch của mùa vụ đã đóng');

  // Nếu người dùng không phải admin, kiểm tra quyền quản lý thu/chi và quỹ
  if (session.role !== 'admin') {
    const perms = session.permissions;
    if (txn.type === 'expense' && !perms.can_manage_chi) throw new Error('Bạn không có quyền sửa giao dịch Chi');
    if (txn.type === 'income' && !perms.can_manage_thu) throw new Error('Bạn không có quyền sửa giao dịch Thu');

    const { data: userFunds } = await supabase.from('user_funds').select('fund_id').eq('user_id', session.id);
    const hasFundAccess = userFunds?.some(uf => uf.fund_id === txn.fund_id);
    if (!hasFundAccess) throw new Error('Bạn không có quyền sửa giao dịch của quỹ này');
  }

  const updateData: any = {};
  if (data.amount !== undefined) updateData.amount = data.amount;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.date !== undefined) updateData.transaction_date = data.date.toISOString().split('T')[0];

  const { error } = await supabase.from('transactions').update(updateData).eq('id', id);
  if (error) throw new Error('Lỗi khi cập nhật giao dịch: ' + error.message);
  
  return true;
}
