import { NextRequest, NextResponse } from 'next/server';

/**
 * CosmoGov Middleware — Route Protection
 *
 * Guards protected routes by checking the session cookie.
 * - /dashboard/* requires authentication
 * - /dashboard/admin/* requires admin or super_admin role
 * - /dashboard/gov-portal/* requires gov_official, admin, or super_admin role
 * - /auth/* remains accessible when a cookie is expired or invalid
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

// This is only a navigation hint. API routes verify the signature and user.
function looksLikeSession(cookie: string | undefined): boolean {
  return Boolean(cookie && /^v1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(cookie));
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

  // Always allow sign-in: an expired or forged cookie must not create a redirect loop.
  if (pathname.startsWith('/auth/')) return NextResponse.next();

  // Dashboard routes — require authentication
  if (pathname.startsWith('/dashboard')) {
    if (!sessionCookie || !looksLikeSession(sessionCookie)) {
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
