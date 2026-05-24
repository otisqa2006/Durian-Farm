import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from '@/actions/auth';

const publicRoutes = ['/login', '/register'];

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isPublicRoute = publicRoutes.includes(path);

  // Skip for static files, api routes, and Next.js internals
  if (
    path.startsWith('/_next') ||
    path.startsWith('/api') ||
    path.includes('.')
  ) {
    return NextResponse.next();
  }

  const cookie = request.cookies.get('srm_session')?.value;
  const session = await decrypt(cookie);

  // 1. Nếu đang ở trang private mà không có session -> Redirect về /login
  if (!session && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.nextUrl));
  }

  // 2. Nếu đã đăng nhập mà cố vào /login hoặc /register -> Redirect về /
  if (session && isPublicRoute) {
    return NextResponse.redirect(new URL('/', request.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
