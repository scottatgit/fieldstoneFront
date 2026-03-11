import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

const BASE_DOMAIN   = process.env.NEXT_PUBLIC_BASE_DOMAIN   || 'fieldstone.pro';
const SIGNAL_DOMAIN = process.env.NEXT_PUBLIC_SIGNAL_DOMAIN || `signal.${BASE_DOMAIN}`;
// e.g. signal.fieldstone.pro

const DEFAULT_TENANT = process.env.NEXT_PUBLIC_DEFAULT_TENANT || 'demo';

const CLERK_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '';
const hasValidClerkKey =
  CLERK_KEY.startsWith('pk_') &&
  !CLERK_KEY.includes('placeholder') &&
  CLERK_KEY.length > 20;

// Reserved slugs — never resolve as tenant workspaces
const RESERVED_SLUGS = new Set(['www', 'app', 'admin', 'demo', 'api', 'signal', 'static']);

const isEnvDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

const isProtectedRoute = createRouteMatcher(['(pm\\.*)', '(platform\\.*)']);
const ADMIN_ROUTES     = ['/pm/admin'];
const PLATFORM_ROUTES  = ['/platform'];

// ─── Host classification ──────────────────────────────────────────────────────

type HostMode = 'marketing' | 'platform' | 'admin' | 'tenant' | 'localhost';

function classifyHost(req: NextRequest): { mode: HostMode; slug: string | null } {
  const host     = req.headers.get('host') || '';
  const hostname = host.split(':')[0];

  // Localhost / dev
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return { mode: 'localhost', slug: null };
  }

  // admin.signal.fieldstone.pro → admin control plane (must be checked BEFORE platform wildcard)
  if (hostname === `admin.${SIGNAL_DOMAIN}`) {
    return { mode: 'admin', slug: null };
  }

  // signal.fieldstone.pro → platform landing
  if (hostname === SIGNAL_DOMAIN) {
    return { mode: 'platform', slug: null };
  }

  // {tenant}.signal.fieldstone.pro → tenant workspace
  if (hostname.endsWith(`.${SIGNAL_DOMAIN}`)) {
    const slug = hostname.split('.')[0];
    if (RESERVED_SLUGS.has(slug)) return { mode: 'platform', slug: null };
    return { mode: 'tenant', slug };
  }

  // Legacy {tenant}.fieldstone.pro support (fallback during migration)
  if (hostname.endsWith(`.${BASE_DOMAIN}`)) {
    const subdomain = hostname.replace(`.${BASE_DOMAIN}`, '');
    if (subdomain === 'www' || subdomain === 'app') return { mode: 'marketing', slug: null };
    if (subdomain === 'signal') return { mode: 'platform', slug: null };
    if (subdomain === 'admin') return { mode: 'admin', slug: null };
    if (RESERVED_SLUGS.has(subdomain)) return { mode: 'platform', slug: null };
    return { mode: 'tenant', slug: subdomain };
  }

  // Root domain → marketing
  if (hostname === BASE_DOMAIN || hostname === `www.${BASE_DOMAIN}`) {
    return { mode: 'marketing', slug: null };
  }

  return { mode: 'marketing', slug: null };
}

// ─── Rewrites ─────────────────────────────────────────────────────────────────

function applyPlatformRewrite(req: NextRequest, isAdmin = false): NextResponse {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith('/platform')) {
    const headers = new Headers(req.headers);
    headers.set('x-platform-mode', 'true');
    if (isAdmin) headers.set('x-admin-mode', 'true');
    return NextResponse.next({ request: { headers } });
  }
  const newPath = pathname === '/' ? '/platform' : `/platform${pathname}`;
  const url = req.nextUrl.clone();
  url.pathname = newPath;
  const headers = new Headers(req.headers);
  headers.set('x-platform-mode', 'true');
  if (isAdmin) headers.set('x-admin-mode', 'true');
  return NextResponse.rewrite(url, { request: { headers } });
}

/** Returns true if auth should be bypassed (demo / no Clerk key). */
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

// ─── Bypass middleware (dev / demo) ──────────────────────────────────────────

function bypassMiddleware(req: NextRequest): NextResponse {
  const { mode, slug } = classifyHost(req);

  if (mode === 'platform' || mode === 'admin') {
    return applyPlatformRewrite(req, mode === 'admin');
  }

  if (isAdminRoute(req)) {
    const url = req.nextUrl.clone();
    url.pathname = '/pm';
    url.searchParams.set('error', 'admin_required');
    return NextResponse.redirect(url);
  }

  const requestHeaders = new Headers(req.headers);
  if (slug) requestHeaders.set('x-tenant-slug', slug);
  else {
    const fallback = req.headers.get('x-tenant-id') || DEFAULT_TENANT;
    requestHeaders.set('x-tenant-slug', fallback);
  }
  return NextResponse.next({ request: { headers: requestHeaders } });
}

// ─── Clerk-protected middleware ───────────────────────────────────────────────

const clerkProtectedMiddleware = clerkMiddleware((auth, req) => {
  const { mode, slug } = classifyHost(req);

  // Platform / admin control plane
  if (mode === 'platform' || mode === 'admin') {
    const { userId, sessionClaims } = auth();
    if (!userId) {
      return NextResponse.redirect(new URL(`https://${SIGNAL_DOMAIN}/login`, req.url));
    }
    // @ts-expect-error: Clerk publicMetadata typed loosely
    const role = sessionClaims?.publicMetadata?.role as string | undefined;
    if (role !== 'admin' && role !== 'platform_admin') {
      // Non-admins → their workspace
      return NextResponse.redirect(new URL(`https://${SIGNAL_DOMAIN}`, req.url));
    }
    return applyPlatformRewrite(req, mode === 'admin');
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

    if (pathname === '/pm' && !tenantId) {
      const url = req.nextUrl.clone();
      url.pathname = '/pm/onboarding';
      return NextResponse.redirect(url);
    }

    if (isAdminRoute(req) && role !== 'admin') {
      const url = req.nextUrl.clone();
      url.pathname = '/pm';
      url.searchParams.set('error', 'admin_required');
      return NextResponse.redirect(url);
    }

    if (isPlatformRoute(req) && role !== 'admin' && role !== 'platform_admin') {
      const url = req.nextUrl.clone();
      url.pathname = '/pm';
      return NextResponse.redirect(url);
    }
  }

  const requestHeaders = new Headers(req.headers);
  if (slug) {
    requestHeaders.set('x-tenant-slug', slug);
  } else {
    requestHeaders.set('x-tenant-slug', DEFAULT_TENANT);
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
