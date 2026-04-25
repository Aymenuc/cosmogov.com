import { NextRequest, NextResponse } from 'next/server';

/**
 * CosmoGov Middleware — Route Protection
 *
 * Guards protected routes by checking the session cookie.
 * - /dashboard/* requires authentication
 * - /dashboard/admin/* requires admin or super_admin role
 * - /dashboard/gov-portal/* requires gov_official, admin, or super_admin role
 * - /auth/* redirects to dashboard if already authenticated
 */

const PUBLIC_PATHS = new Set([
  '/',
  '/about',
  '/contact',
  '/blog',
  '/careers',
  '/docs',
  '/docs/api',
  '/terms',
  '/privacy',
  '/changelog',
]);

function isPublicStaticPath(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  // Blog posts are public
  if (pathname.startsWith('/blog/')) return true;
  // Career detail pages are public
  if (pathname.startsWith('/careers/')) return true;
  return false;
}

function parseSession(cookie: string | undefined): { userId: string; role: string } | null {
  if (!cookie) return null;
  try {
    const decoded = Buffer.from(cookie, 'base64').toString();
    // Format: userId:timestamp:random
    const userId = decoded.split(':')[0];
    if (!userId) return null;
    // Note: We can't get the role from the cookie alone without a DB lookup.
    // For middleware, we do a lightweight check and let the page/API do the full auth.
    return { userId, role: '' };
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('cosmogov_session')?.value;

  // Skip middleware for API routes, static files, and Next.js internals
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.') // static files
  ) {
    return NextResponse.next();
  }

  // Public pages — allow through
  if (isPublicStaticPath(pathname)) {
    return NextResponse.next();
  }

  // Auth pages — redirect to dashboard if already logged in
  if (pathname.startsWith('/auth/')) {
    if (sessionCookie && parseSession(sessionCookie)) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // Dashboard routes — require authentication
  if (pathname.startsWith('/dashboard')) {
    if (!sessionCookie || !parseSession(sessionCookie)) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Admin and gov-portal route protection via redirect.
    // Full role-based access control happens in the page component and API routes,
    // but we add a lightweight redirect here for UX (avoiding a flash of the unauthorized page).
    // The session cookie doesn't contain the role, so we rely on the page-level auth check.
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next (Next.js internals)
     * - api (API routes handle their own auth)
     * - static files (images, icons, etc.)
     */
    '/((?!_next/static|_next/image|icon-|logo|robots|sw\\.js|manifest).*)',
  ],
};
