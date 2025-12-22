import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { CookieOptions } from '@supabase/ssr';

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  // Handle subdomain routing
  const hostname = req.headers.get('host') || '';
  const url = req.nextUrl.clone();
  
  // Check if we're on the financial subdomain
  const isFinancialSubdomain = hostname.startsWith('financial.');
  
  // If on financial subdomain and not already on dashboard/auth routes
  if (isFinancialSubdomain) {
    // Allow dashboard and auth routes
    if (!url.pathname.startsWith('/dashboard') && 
        !url.pathname.startsWith('/login') && 
        !url.pathname.startsWith('/signup') &&
        !url.pathname.startsWith('/api') &&
        !url.pathname.startsWith('/_next')) {
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
  } else {
    // On main domain (sceneside.com)
    // If trying to access dashboard/auth routes, redirect to website
    if (url.pathname.startsWith('/dashboard') || 
        url.pathname.startsWith('/login') || 
        url.pathname.startsWith('/signup')) {
      // Redirect to financial subdomain
      url.host = 'financial.' + hostname;
      return NextResponse.redirect(url);
    }
    
    // If on root, redirect to website
    if (url.pathname === '/') {
      url.pathname = '/website';
      return NextResponse.rewrite(url);
    }
    
    // If not on /website path, redirect there
    if (!url.pathname.startsWith('/website') && 
        !url.pathname.startsWith('/api') &&
        !url.pathname.startsWith('/_next')) {
      url.pathname = '/website' + url.pathname;
      return NextResponse.rewrite(url);
    }
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: CookieOptions }>) {
          cookiesToSet.forEach(({ name, value }) =>
            req.cookies.set(name, value)
          );
          res = NextResponse.next({
            request: {
              headers: req.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options as any)
          );
        },
      },
    }
  );

  // Refresh session if expired
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Protected routes - redirect to login if not authenticated
  const protectedPaths = [
    '/dashboard',
    '/invoices',
    '/bills',
    '/expenses',
    '/inventory',
    '/assets',
    '/reports',
    '/settings',
    '/customers',
    '/vendors',
    '/journal',
    '/accounts',
  ];

  const isProtectedPath = protectedPaths.some((path) =>
    req.nextUrl.pathname.startsWith(path)
  );

  if (isProtectedPath && !session) {
    const redirectUrl = new URL('/login', req.url);
    redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect logged-in users away from auth pages
  const authPaths = ['/login', '/signup', '/forgot-password'];
  const isAuthPath = authPaths.some((path) =>
    req.nextUrl.pathname.startsWith(path)
  );

  // If signups are disabled, block access to the signup page
  const signupsEnabled = process.env.NEXT_PUBLIC_SIGNUPS_ENABLED === 'true';
  if (!signupsEnabled && req.nextUrl.pathname.startsWith('/signup')) {
    // Redirect to login with a hint
    const redirectUrl = new URL('/login', req.url);
    redirectUrl.searchParams.set('signup', 'disabled');
    return NextResponse.redirect(redirectUrl);
  }

  if (isAuthPath && session) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return res;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
