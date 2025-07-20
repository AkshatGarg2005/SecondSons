import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Paths that require authentication
const protectedPaths = [
  '/admin',
  '/worker',
  '/customer',
  '/restaurant',
  '/homeowner',
  '/settings',
];

// Paths that should redirect to dashboard if already authenticated
const authPaths = ['/login', '/register'];

// Public paths that don't require authentication
const publicPaths = ['/', '/services'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for API routes, static files, and public paths
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname === '/'
  ) {
    return NextResponse.next();
  }
  
  // Allow access to service browsing pages without auth
  if (pathname.startsWith('/services') && !pathname.includes('/book')) {
    return NextResponse.next();
  }
  
  // For now, we'll rely on client-side protection
  // In production, you would validate the Firebase token here
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
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};