import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

const BASE_DOMAIN    = process.env.NEXT_PUBLIC_BASE_DOMAIN    || 'fieldstone.pro';
const DEFAULT_TENANT = process.env.NEXT_PUBLIC_DEFAULT_TENANT || 'ipquest';

const CLERK_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '';
const hasValidClerkKey =
  CLERK_KEY.startsWith('pk_') &&
  !CLERK_KEY.includes('placeholder') &&
  CLERK_KEY.length > 20;

const RESERVED_SLUGS = new Set([
  'www', 'app', 'admin', 'demo', 'api',
]);


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


/** Extract raw subdomain slug (not resolved to tenant_id). Returns null for reserved/localhost. */
function extractSlug(req: NextRequest): string | null {
  const host     = req.headers.get('host') || '';
  const hostname = host.split(':')[0];
  if (hostname === 'localhost' || hostname === '127.0.0.1') return null;
  if (hostname.endsWith(`.${BASE_DOMAIN}`)) {
    const subdomain = hostname.replace(`.${BASE_DOMAIN}`, '');
    if (RESERVED_SLUGS.has(subdomain)) return null;
    return subdomain;
  }
  return null;
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
  const slug = extractSlug(req);
  if (slug) requestHeaders.set('x-tenant-slug', slug);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

/**
 * Clerk-protected middleware — production with valid keys.
 * Admin access requires: user.publicMetadata.role === 'admin'
 * Tenant identity does NOT grant admin privileges.
 */
const clerkProtectedMiddleware = clerkMiddleware((auth, req) => {
  const tenant = extractTenant(req);
  const { pathname } = req.nextUrl;

  // Gate protected routes — redirect to login if not authenticated
  if (isProtectedRoute(req)) {
    const { userId, sessionClaims } = auth();
    if (!userId) {
      const loginUrl = new URL('/login', req.url);
      return NextResponse.redirect(loginUrl);
    }

    // @ts-expect-error: publicMetadata typed loosely by Clerk SDK
    const role = sessionClaims?.publicMetadata?.role as string | undefined;
    // @ts-expect-error: publicMetadata typed loosely by Clerk SDK
    const tenantId = sessionClaims?.publicMetadata?.tenant_id as string | undefined;

    // Role-aware redirect: admin lands on /pm/admin, no tenant goes to onboarding
    if (pathname === '/pm') {
      if (role === 'admin') {
        const url = req.nextUrl.clone();
        url.pathname = '/pm/admin';
        return NextResponse.redirect(url);
      }
      if (!tenantId) {
        const url = req.nextUrl.clone();
        url.pathname = '/pm/onboarding';
        return NextResponse.redirect(url);
      }
    }

    // Admin route guard — non-admins blocked
    if (isAdminRoute(req) && role !== 'admin') {
      const url = req.nextUrl.clone();
      url.pathname = '/pm';
      url.searchParams.set('error', 'admin_required');
      return NextResponse.redirect(url);
    }
  }

  const requestHeaders = new Headers(req.headers);
  const slug = extractSlug(req);
  if (slug) requestHeaders.set('x-tenant-slug', slug);
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
