'use server';

import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const secretKey = process.env.JWT_SECRET || 'super_secret_jwt_key_for_srm_finance_app_2026_!@#';
const encodedKey = new TextEncoder().encode(secretKey);
const COOKIE_NAME = 'srm_session';

// Typed session payload
export interface SessionData {
  id: string;
  username: string;
  role: 'admin' | 'user';
  permissions: {
    can_manage_thu: boolean;
    can_manage_chi: boolean;
    can_manage_quy: boolean;
    can_view_baocao: boolean;
  };
}

export async function encrypt(payload: SessionData) {
  return new SignJWT(payload as any)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(encodedKey);
}

export async function decrypt(session: string | undefined = ''): Promise<SessionData | null> {
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ['HS256'],
    });
    return payload as unknown as SessionData;
  } catch (error) {
    return null;
  }
}

export async function login(username: string, password: string) {
  try {
    // 1. Fetch user from DB
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (error || !user) {
      return { success: false, message: 'Sai tên đăng nhập hoặc mật khẩu.' };
    }

    // 2. Verify password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return { success: false, message: 'Sai tên đăng nhập hoặc mật khẩu.' };
    }

    // 3. Create Session (JWT)
    const sessionData: SessionData = {
      id: user.id,
      username: user.username,
      role: user.role,
      permissions: {
        can_manage_thu: user.can_manage_thu ?? false,
        can_manage_chi: user.can_manage_chi ?? false,
        can_manage_quy: user.can_manage_quy ?? false,
        can_view_baocao: user.can_view_baocao ?? false,
      }
    };

    const session = await encrypt(sessionData);

    // 4. Set Cookie
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, session, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });

    return { success: true, data: sessionData };
  } catch (error: any) {
    console.error('Login error:', error);
    return { success: false, message: 'Lỗi hệ thống khi đăng nhập.' };
  }
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  return { success: true };
}

export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get(COOKIE_NAME)?.value;
  if (!session) return null;
  
  const payload = await decrypt(session);
  return payload;
}

export async function register(username: string, password: string) {
  try {
    // 1. Check if user exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .single();

    if (existing) {
      return { success: false, message: 'Tên đăng nhập đã tồn tại.' };
    }

    // 2. Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // 3. Insert user
    const { error } = await supabase
      .from('users')
      .insert({
        username,
        password_hash,
        role: 'user', // Default role
        can_manage_thu: false,
        can_manage_chi: false,
        can_manage_quy: false,
        can_view_baocao: false,
      });

    if (error) {
      console.error('Registration DB error:', error);
      return { success: false, message: 'Lỗi khi tạo tài khoản.' };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Registration error:', error);
    return { success: false, message: 'Lỗi hệ thống khi đăng ký.' };
  }
}

export async function updateProfile(newPassword: string) {
  const session = await getSession();
  if (!session) return { success: false, message: 'Chưa đăng nhập' };

  try {
    const password_hash = await bcrypt.hash(newPassword, 10);
    const { error } = await supabase
      .from('users')
      .update({ password_hash })
      .eq('id', session.id);
    
    if (error) throw error;
    return { success: true };
  } catch (err) {
    return { success: false, message: 'Lỗi cập nhật mật khẩu' };
  }
}
