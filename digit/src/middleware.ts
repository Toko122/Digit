import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJWT } from '@/lib/jwt';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  const isDashboardRoute = pathname.startsWith('/dashboard');
  const isAuthRoute = pathname === '/login' || pathname === '/register';

  if (isDashboardRoute) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const payload = await verifyJWT(token);
    if (!payload || !payload.is_active) {
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('token');
      return response;
    }

    const userRole = payload.role;

    if (pathname === '/dashboard') {
      return NextResponse.redirect(new URL(`/dashboard/${userRole}`, request.url));
    }

    if (pathname.startsWith('/dashboard/business') && userRole !== 'business') {
      return NextResponse.redirect(new URL(`/dashboard/${userRole}`, request.url));
    }
    if (pathname.startsWith('/dashboard/manager') && userRole !== 'manager') {
      return NextResponse.redirect(new URL(`/dashboard/${userRole}`, request.url));
    }
    if (pathname.startsWith('/dashboard/worker') && userRole !== 'worker') {
      return NextResponse.redirect(new URL(`/dashboard/${userRole}`, request.url));
    }
    if (pathname.startsWith('/dashboard/admin') && userRole !== 'admin') {
      return NextResponse.redirect(new URL(`/dashboard/${userRole}`, request.url));
    }
  }

  if (isAuthRoute && token) {
    const payload = await verifyJWT(token);
    if (payload && payload.is_active) {
      return NextResponse.redirect(new URL(`/dashboard/${payload.role}`, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register'],
};
