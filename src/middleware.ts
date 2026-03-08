import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

const BASE_DOMAIN    = process.env.NEXT_PUBLIC_BASE_DOMAIN    || 'fieldstone.pro';
const DEFAULT_TENANT = process.env.NEXT_PUBLIC_DEFAULT_TENANT || 'ipquest';

const CLERK_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '';
const hasValidClerkKey =
  CLERK_KEY.startsWith('pk_') &&
  !CLERK_KEY.includes('placeholder') &&
  CLERK_KEY.length > 20;

const isEnvDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

const isProtectedRoute = createRouteMatcher(['(pm\\.*)'  ]);
const ADMIN_ROUTES     = ['/pm/admin'];

/** Extract tenant from subdomain. */
function extractTenant(req: NextRequest): string {
  const host     = req.headers.get('host') || '';
  const hostname = host.split(':')[0];

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return req.headers.get('x-tenant-id') || DEFAULT_TENANT;
  }

  if (hostname.endsWith(`.${BASE_DOMAIN}`)) {
    const subdomain = hostname.replace(`.${BASE_DOMAIN}`, '');
    if (['www', 'app'].includes(subdomain)) return DEFAULT_TENANT;
    return subdomain;
  }

  return DEFAULT_TENANT;
}

/** Returns true if auth should be bypassed (demo / dev / no Clerk key). */
function shouldBypassAuth(req: NextRequest): boolean {
  if (isEnvDemoMode || !hasValidClerkKey) return true;
  const hostname = (req.headers.get('host') || '').split(':')[0];
  if (hostname.startsWith('demo.')) return true;
  return false;
}

/** Returns true if this path requires platform-admin role. */
function isAdminRoute(req: NextRequest): boolean {
  const { pathname } = req.nextUrl;
  return ADMIN_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'));
}

/**
 * Pass-through middleware — dev / demo environments.
 * Admin routes allowed only on demo subdomain or DEMO_MODE env.
 * No tenant ID grants admin privileges.
 */
function bypassMiddleware(req: NextRequest): NextResponse {
  const tenant   = extractTenant(req);
  const hostname = (req.headers.get('host') || '').split(':')[0];
  const isDemo   = hostname.startsWith('demo.') || isEnvDemoMode;

  if (isAdminRoute(req) && !isDemo) {
    const url = req.nextUrl.clone();
    url.pathname = '/pm';
    url.searchParams.set('error', 'admin_required');
    return NextResponse.redirect(url);
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-tenant-id', tenant);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

/**
 * Clerk-protected middleware — production with valid keys.
 * Admin access requires: user.publicMetadata.role === 'admin'
 * Tenant identity does NOT grant admin privileges.
 */
const clerkProtectedMiddleware = clerkMiddleware((auth, req) => {
  const tenant = extractTenant(req);

  if (isAdminRoute(req)) {
    const { sessionClaims } = auth();
    // @ts-expect-error: publicMetadata typed loosely by Clerk SDK
    const role = sessionClaims?.publicMetadata?.role as string | undefined;
    if (role !== 'admin') {
      const url = req.nextUrl.clone();
      url.pathname = '/pm';
      url.searchParams.set('error', 'admin_required');
      return NextResponse.redirect(url);
    }
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-tenant-id', tenant);
  if (isProtectedRoute(req)) {
    const { userId } = auth();
    if (!userId) {
      const loginUrl = new URL('/login', req.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
});

export default function middleware(req: NextRequest) {
  if (shouldBypassAuth(req)) return bypassMiddleware(req);
  // @ts-expect-error: clerkMiddleware returns compatible handler type
  return clerkProtectedMiddleware(req);
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
