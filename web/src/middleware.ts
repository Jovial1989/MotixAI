import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Locale-aware middleware.
 *
 * URL prefixes:
 *   /ua/...  → Ukrainian (locale cookie = "uk")
 *   /bg/...  → Bulgarian (locale cookie = "bg")
 *   /...     → English / global (locale cookie = "en", set only if absent)
 *
 * The middleware rewrites the URL to strip the prefix so Next.js serves pages
 * from their original locations (no app-directory restructuring needed).
 *
 * Protected-route checking runs AFTER the prefix is stripped.
 */

const LOCALE_PREFIXES: Record<string, string> = {
  '/ua': 'uk',
  '/bg': 'bg',
};

const PROTECTED_PREFIXES = ['/dashboard', '/guides', '/vehicles', '/profile', '/onboarding', '/admin'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── 1. Detect locale prefix ──────────────────────────────────────────────
  let detectedLocale: string | null = null;
  let strippedPathname = pathname;

  for (const [prefix, locale] of Object.entries(LOCALE_PREFIXES)) {
    if (pathname === prefix || pathname.startsWith(prefix + '/')) {
      detectedLocale = locale;
      strippedPathname = pathname.slice(prefix.length) || '/';
      break;
    }
  }

  // ── 2. Build response (rewrite if prefix found, otherwise next()) ────────
  let response: NextResponse;

  if (detectedLocale) {
    // Rewrite to the un-prefixed path so Next.js serves the right page
    const url = request.nextUrl.clone();
    url.pathname = strippedPathname;
    response = NextResponse.rewrite(url);
  } else {
    response = NextResponse.next();
  }

  // ── 3. Set locale cookie ─────────────────────────────────────────────────
  if (detectedLocale) {
    response.cookies.set('motix_locale', detectedLocale, { path: '/', maxAge: 60 * 60 * 24 * 365 });
  } else {
    // Only set to 'en' when there is no existing cookie
    const existing = request.cookies.get('motix_locale')?.value;
    if (!existing) {
      response.cookies.set('motix_locale', 'en', { path: '/', maxAge: 60 * 60 * 24 * 365 });
    }
  }

  // ── 4. Protected-route guard (uses stripped pathname) ────────────────────
  const isProtected = PROTECTED_PREFIXES.some(
    (p) => strippedPathname === p || strippedPathname.startsWith(p + '/'),
  );

  if (isProtected) {
    // Currently the real auth check lives client-side (localStorage JWT).
    // Middleware just lets the request through; the client-side guard redirects
    // unauthenticated users. Extend here if cookie-based auth is added later.
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     *  - _next (internal Next.js files)
     *  - api routes
     *  - static files (images, fonts, etc.)
     */
    '/((?!_next|api|favicon\\.ico|.*\\..*).*)',
  ],
};
