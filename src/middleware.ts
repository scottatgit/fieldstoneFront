import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

const BASE_DOMAIN    = process.env.NEXT_PUBLIC_BASE_DOMAIN    || 'fieldstone.pro';
const DEFAULT_TENANT = process.env.NEXT_PUBLIC_DEFAULT_TENANT || 'demo';

const CLERK_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '';
const hasValidClerkKey =
  CLERK_KEY.startsWith('pk_') &&
  !CLERK_KEY.includes('placeholder') &&
  CLERK_KEY.length > 20;

// Reserved slugs — never resolve as tenant workspaces
const RESERVED_SLUGS = new Set([
  'www', 'app', 'admin', 'demo', 'api', 'signal',
]);

const isEnvDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

const isProtectedRoute  = createRouteMatcher(['(pm\\.*)', '(platform\\.*)']);
const ADMIN_ROUTES      = ['/pm/admin'];
const PLATFORM_ROUTES   = ['/platform'];

/** Detect if this request is for the Signal control plane. */
function isPlatformHost(req: NextRequest): boolean {
  const hostname = (req.headers.get('host') || '').split(':')[0];
  return hostname === `signal.${BASE_DOMAIN}` || hostname === 'signal.fieldstone.pro';
}

/** Extract tenant from subdomain. */
function extractTenant(req: NextRequest): string {
  const host     = req.headers.get('host') || '';
  const hostname = host.split(':')[0];

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return req.headers.get('x-tenant-id') || DEFAULT_TENANT;
  }

  if (hostname.endsWith(`.${BASE_DOMAIN}`)) {
    const subdomain = hostname.replace(`.${BASE_DOMAIN}`, '');
    if (RESERVED_SLUGS.has(subdomain)) return DEFAULT_TENANT;
    return subdomain;
  }

  return DEFAULT_TENANT;
}

/** Extract raw subdomain slug. Returns null for reserved/localhost. */
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

/** Returns true if auth should be bypassed. */
function shouldBypassAuth(req: NextRequest): boolean {
  if (isEnvDemoMode || !hasValidClerkKey) return true;
  const hostname = (req.headers.get('host') || '').split(':')[0];
  if (hostname.startsWith('demo.')) return true;
  return false;
}

function isAdminRoute(req: NextRequest): boolean {
  const { pathname } = req.nextUrl;
  return ADMIN_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'));
}

function isPlatformRoute(req: NextRequest): boolean {
  const { pathname } = req.nextUrl;
  return PLATFORM_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'));
}

/**
 * Rewrite signal.fieldstone.pro/* → /platform/*
 * Sets x-platform-mode header so platform layout can detect context.
 */
function applyPlatformRewrite(req: NextRequest): NextResponse {
  const { pathname, search } = req.nextUrl;
  // Already under /platform — pass through
  if (pathname.startsWith('/platform')) {
    const headers = new Headers(req.headers);
    headers.set('x-platform-mode', 'true');
    return NextResponse.next({ request: { headers } });
  }
  // Rewrite / → /platform, /setup → /platform/setup, etc.
  const newPath = pathname === '/' ? '/platform' : `/platform${pathname}`;
  const url = req.nextUrl.clone();
  url.pathname = newPath;
  const headers = new Headers(req.headers);
  headers.set('x-platform-mode', 'true');
  return NextResponse.rewrite(url, { request: { headers } });
}

/** Pass-through middleware for dev/demo. */
function bypassMiddleware(req: NextRequest): NextResponse {
  // Platform host rewrite even in bypass mode
  if (isPlatformHost(req)) return applyPlatformRewrite(req);

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

/** Clerk-protected middleware for production. */
const clerkProtectedMiddleware = clerkMiddleware((auth, req) => {
  // Platform host: rewrite + require platform_admin
  if (isPlatformHost(req)) {
    const { userId, sessionClaims } = auth();
    if (!userId) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    // @ts-expect-error: Clerk publicMetadata typed loosely
    const role = sessionClaims?.publicMetadata?.role as string | undefined;
    if (role !== 'admin' && role !== 'platform_admin') {
      // Non-admins redirected to their workspace
      return NextResponse.redirect(new URL('https://fieldstone.pro/pm', req.url));
    }
    return applyPlatformRewrite(req);
  }

  // Standard tenant route protection
  if (isProtectedRoute(req)) {
    const { userId, sessionClaims } = auth();
    if (!userId) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    // @ts-expect-error: Clerk publicMetadata typed loosely
    const role     = sessionClaims?.publicMetadata?.role as string | undefined;
    // @ts-expect-error: Clerk publicMetadata typed loosely
    const tenantId = sessionClaims?.publicMetadata?.tenant_id as string | undefined;
    const { pathname } = req.nextUrl;

    // Role-aware redirect at /pm root
    if (pathname === '/pm') {
      if (!tenantId) {
        const url = req.nextUrl.clone();
        url.pathname = '/pm/onboarding';
        return NextResponse.redirect(url);
      }
    }

    // Admin route guard
    if (isAdminRoute(req) && role !== 'admin') {
      const url = req.nextUrl.clone();
      url.pathname = '/pm';
      url.searchParams.set('error', 'admin_required');
      return NextResponse.redirect(url);
    }

    // Platform route guard (direct /platform access without signal. domain)
    if (isPlatformRoute(req) && role !== 'admin' && role !== 'platform_admin') {
      const url = req.nextUrl.clone();
      url.pathname = '/pm';
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
