import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  console.log(`🔒 Middleware: ${pathname}`);

  // Skip middleware for static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    console.log(`✅ Skipping middleware for static file or api route: ${pathname}`);
    return NextResponse.next();
  }

  // Public routes that don't require auth
  const publicRoutes = ['/login', '/register'];
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route) || pathname === '/');

  if (isPublicRoute) {
    console.log(`✅ Skipping middleware for public route: ${pathname}`);
    return NextResponse.next();
  }

  // For protected routes, check if user has a session token
  // Better-auth is setting 'better-auth.session_token' based on the logs
  const sessionToken = request.cookies.get('better-auth.session_token')?.value ||
                      request.cookies.get('better-auth.session')?.value ||
                      request.cookies.get('session')?.value ||
                      request.headers.get('authorization')?.replace('Bearer ', '');

  console.log(`Auth check for ${pathname}:`, {
    hasSession: !!sessionToken,
    sessionTokenFound: sessionToken ? 'found' : 'not found',
    cookieCount: request.cookies.getAll().length,
    cookies: request.cookies.getAll().map(c => `${c.name}=${c.value.substring(0, 10)}...`)
  });

  if (!sessionToken) {
    console.log(`❌ Redirecting ${pathname} to /login - no session`);
    return NextResponse.redirect(new URL('/login', request.url));
  }

  console.log(`✅ Allowing access to ${pathname}`);
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all pages except static assets and api routes
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
