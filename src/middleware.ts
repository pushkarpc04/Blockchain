import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { ROUTES } from '@/lib/constants';

const protectedRoutes = [
  ROUTES.DASHBOARD,
  ROUTES.REGISTER_DOCUMENT,
  // Add other routes that need authentication
];

const authRoutes = [
  ROUTES.LOGIN,
  ROUTES.REGISTER,
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionToken = request.cookies.get('firebaseIdToken'); // Example, adjust if using different cookie name

  // If user is trying to access a protected route without a session, redirect to login
  if (protectedRoutes.some(route => pathname.startsWith(route)) && !sessionToken) {
    const loginUrl = new URL(ROUTES.LOGIN, request.url);
    loginUrl.searchParams.set('redirect', pathname); // Optional: redirect back after login
    return NextResponse.redirect(loginUrl);
  }

  // If user is authenticated and tries to access login/register, redirect to dashboard
  if (authRoutes.some(route => pathname.startsWith(route)) && sessionToken) {
    return NextResponse.redirect(new URL(ROUTES.DASHBOARD, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images (public images folder)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|images).*)',
  ],
};
