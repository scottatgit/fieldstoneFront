import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

const BASE_DOMAIN    = process.env.NEXT_PUBLIC_BASE_DOMAIN    || 'fieldstone.pro';
const DEFAULT_TENANT = process.env.NEXT_PUBLIC_DEFAULT_TENANT || 'ipquest';

// Detect if Clerk is properly configured
const CLERK_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '';
const hasValidClerkKey =
  CLERK_KEY.startsWith('pk_') &&
  !CLERK_KEY.includes('placeholder') &&
  CLERK_KEY.length > 20;

const isEnvDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

const isProtectedRoute = createRouteMatcher(['(pm\.*)']);

/**
 * Extract tenant from subdomain.
 * ipquest.fieldstone.pro → 'ipquest'
 * fieldstone.pro         → DEFAULT_TENANT
 * localhost              → DEFAULT_TENANT
 */
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

/**
 * Returns true if this request should bypass Clerk auth.
 * Conditions:
 *  1. NEXT_PUBLIC_DEMO_MODE=true (env flag)
 *  2. No valid Clerk key configured
 *  3. Subdomain is 'demo' (demo.fieldstone.pro always bypasses auth)
 */
function shouldBypassAuth(req: NextRequest): boolean {
  if (isEnvDemoMode || !hasValidClerkKey) return true;
  const host     = req.headers.get('host') || '';
  const hostname = host.split(':')[0];
  if (hostname.startsWith('demo.')) return true;
  return false;
}

const ADMIN_ROUTES = ['/pm/admin'];
const ADMIN_TENANT  = 'ipquest';

/**
 * Returns true if this request is for an admin-only route.
 */
function isAdminRoute(req: NextRequest): boolean {
  const { pathname } = req.nextUrl;
  return ADMIN_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'));
}

/**
 * Pass-through middleware — used when auth should be bypassed
 */
function bypassMiddleware(req: NextRequest): NextResponse {
  const tenant = extractTenant(req);

  // Block non-admin tenants from /pm/admin/* routes
  if (isAdminRoute(req) && tenant !== ADMIN_TENANT) {
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
 * Clerk-protected middleware — used in production with valid keys
 */
const clerkProtectedMiddleware = clerkMiddleware((auth, req) => {
  const tenant = extractTenant(req);

  // Block non-admin tenants from /pm/admin/* routes (same guard as bypassMiddleware)
  if (isAdminRoute(req) && tenant !== ADMIN_TENANT) {
    const url = req.nextUrl.clone();
    url.pathname = '/pm';
    url.searchParams.set('error', 'admin_required');
    return NextResponse.redirect(url);
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-tenant-id', tenant);

  // Protect PM routes — redirect to /login if not authenticated
  if (isProtectedRoute(req)) {
    const { userId } = auth();
    if (!userId) {
      const loginUrl = new URL('/login', req.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
});

// Export the appropriate middleware based on config
export default function middleware(req: NextRequest) {
  if (shouldBypassAuth(req)) {
    return bypassMiddleware(req);
  }
  // @ts-expect-error: clerkMiddleware returns compatible handler type
  return clerkProtectedMiddleware(req);
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)'  ,
  ],
};
