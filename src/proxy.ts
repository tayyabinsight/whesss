import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (metadata files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host') || '';
  const adminSession = request.cookies.get('admin_session');
  const isAuthorized = adminSession?.value === 'authorized';

  // 1. Subdomain Handling (admin.localhost)
  if (hostname.startsWith('admin.')) {
    if (pathname === '/') {
      // Agar admin subdomain ke root pr hai aur logged in hai to dashboard bhejo
      if (isAuthorized) {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      }
      // Warna login rewrite kro
      return NextResponse.rewrite(new URL('/admin-auth', request.url));
    }
  }

  // 2. Protect Admin Routes (excluding auth pages)
  // Hum check krte hain ke path '/admin' se start ho raha hai lekin '/admin-auth' nahi hai
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin-auth')) {
    if (!isAuthorized) {
      // Agar authorized nahi hai to login pr redirect kro
      return NextResponse.redirect(new URL('/admin-auth', request.url));
    }
  }

  // 3. Prevent logged-in admins from accessing the login page
  if (pathname.startsWith('/admin-auth')) {
    if (isAuthorized) {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
  }

  return NextResponse.next();
}
