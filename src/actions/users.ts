'use server';

import { supabase } from '@/lib/supabase';
import { getSession } from './auth';

export async function getUsers() {
  const session = await getSession();
  if (!session || session.role !== 'admin') return [];

  const { data, error } = await supabase.from('users').select('id, username, role, can_manage_thu, can_manage_chi, can_manage_quy, can_view_baocao');
  if (error) return [];
  
  return data.map(u => ({
    id: u.id,
    name: u.username,
    role: u.role,
    passwordHash: '', // Hidden
    permissions: {
      canManageThu: u.can_manage_thu,
      canManageChi: u.can_manage_chi,
      canManageQuy: u.can_manage_quy,
      canViewBaoCao: u.can_view_baocao
    }
  }));
}

export async function updateUserPermissions(userId: string, permissions: any) {
  const session = await getSession();
  if (!session || session.role !== 'admin') throw new Error('Không có quyền');

  const { error } = await supabase
    .from('users')
    .update({
      can_manage_thu: permissions.canManageThu,
      can_manage_chi: permissions.canManageChi,
      can_manage_quy: permissions.canManageQuy,
      can_view_baocao: permissions.canViewBaoCao
    })
    .eq('id', userId);

  if (error) throw new Error('Lỗi cập nhật quyền');
  return true;
}

export async function getUserFunds(userId: string) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return [];

  const { data, error } = await supabase.from('user_funds').select('fund_id').eq('user_id', userId);
  if (error) return [];
  
  return data.map(uf => uf.fund_id);
}

export async function assignUserFunds(userId: string, fundIds: string[]) {
  const session = await getSession();
  if (!session || session.role !== 'admin') throw new Error('Không có quyền');

  // Xoá cũ
  await supabase.from('user_funds').delete().eq('user_id', userId);
  
  // Thêm mới
  if (fundIds.length > 0) {
    const inserts = fundIds.map(fId => ({ user_id: userId, fund_id: fId }));
    const { error } = await supabase.from('user_funds').insert(inserts);
    if (error) throw new Error('Lỗi cập nhật quỹ');
  }
  
  return true;
}

export async function deleteUser(userId: string) {
  const session = await getSession();
  if (!session || session.role !== 'admin') throw new Error('Không có quyền');

  const { error } = await supabase.from('users').delete().eq('id', userId);
  if (error) throw new Error('Lỗi xoá người dùng');
  return true;
}
