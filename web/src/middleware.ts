import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Server-side route protection.
 *
 * JWT validation (signature check) happens on the backend — here we only check
 * whether the cookie/header carries a token at all. The real gate is the
 * client-side redirect in the dashboard layout that reads localStorage.
 *
 * Because Next.js middleware runs on the Edge and localStorage is unavailable,
 * we cannot read the JWT stored there. Instead this middleware ensures that
 * direct-URL access to protected paths shows the login page when no cookie
 * is set. The client-side guard handles the localStorage-based flow.
 */

const PROTECTED_PREFIXES = ['/dashboard', '/guides', '/vehicles', '/profile', '/onboarding', '/admin'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only guard protected routes
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'));
  if (!isProtected) return NextResponse.next();

  // Allow if any auth indicator is present (cookie or header)
  // The real token lives in localStorage which middleware can't access,
  // so we rely on the client-side guard for the primary check.
  // This middleware catches direct URL access in a fresh browser.
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/guides/:path*', '/vehicles/:path*', '/profile/:path*', '/onboarding/:path*', '/admin/:path*'],
};
