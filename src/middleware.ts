/**
 * Signal Platform Middleware
 * Auth: Custom JWT via HttpOnly cookie (signal_token)
 * Clerk removed — cookie is set by FastAPI with Domain=.signal.fieldstone.pro
 */
import { NextRequest, NextResponse } from 'next/server';

// ─── Configuration ────────────────────────────────────────────────────────────
const BASE_DOMAIN    = process.env.NEXT_PUBLIC_BASE_DOMAIN   || 'fieldstone.pro';
const SIGNAL_DOMAIN  = process.env.NEXT_PUBLIC_SIGNAL_DOMAIN || `signal.${BASE_DOMAIN}`;
const DEFAULT_TENANT = process.env.NEXT_PUBLIC_DEFAULT_TENANT || 'demo';
const SIGNAL_COOKIE  = 'signal_token';

// Reserved slugs — never resolve as tenant workspaces
const RESERVED_SLUGS = new Set(['www', 'app', 'admin', 'demo', 'api', 'signal', 'static']);
const SLUG_PATTERN   = /^[a-z0-9-]{2,40}$/;

// Paths that bypass auth entirely
const BYPASS_PATHS = [
  '/login', '/signup', '/sso-callback',
  '/redirect', '/pm/redirect', '/pm/onboarding',
  '/invite', '/forgot-password',
  '/reset-password',    // token redemption link from email
  '/verify-email',      // email verification link from email
  '/verify-pending',    // post-signup waiting page
];

// ─── Host Classification ──────────────────────────────────────────────────────
type HostMode = 'marketing' | 'platform' | 'admin' | 'tenant' | 'localhost' | 'demo';

function classifyHost(req: NextRequest): { mode: HostMode; slug: string | null } {
  const host     = req.headers.get('host') || '';
  const hostname = host.split(':')[0];

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return { mode: 'localhost', slug: null };
  }
  if (hostname === `admin.${SIGNAL_DOMAIN}`) {
    return { mode: 'admin', slug: null };
  }
  if (hostname === SIGNAL_DOMAIN) {
    return { mode: 'platform', slug: null };
  }
  if (hostname === `demo.${SIGNAL_DOMAIN}`) {
    return { mode: 'demo', slug: 'demo' };
  }
  if (hostname.endsWith(`.${SIGNAL_DOMAIN}`)) {
    const slug = hostname.split('.')[0];
    if (RESERVED_SLUGS.has(slug) || !SLUG_PATTERN.test(slug)) {
      return { mode: 'platform', slug: null };
    }
    return { mode: 'tenant', slug };
  }
  // Legacy *.fieldstone.pro support
  if (hostname.endsWith(`.${BASE_DOMAIN}`)) {
    const sub = hostname.replace(`.${BASE_DOMAIN}`, '');
    if (sub === 'www' || sub === 'app') return { mode: 'marketing', slug: null };
    if (sub === 'signal') return { mode: 'platform', slug: null };
    if (sub === 'admin') return { mode: 'admin', slug: null };
    if (RESERVED_SLUGS.has(sub) || !SLUG_PATTERN.test(sub)) {
      return { mode: 'platform', slug: null };
    }
    return { mode: 'tenant', slug: sub };
  }
  if (hostname === BASE_DOMAIN || hostname === `www.${BASE_DOMAIN}`) {
    return { mode: 'marketing', slug: null };
  }
  return { mode: 'marketing', slug: null };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function isBypassPath(pathname: string): boolean {
  return BYPASS_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'));
}

function hasSignalToken(req: NextRequest): boolean {
  return !!req.cookies.get(SIGNAL_COOKIE)?.value;
}

function applyPlatformRewrite(req: NextRequest, isAdmin = false): NextResponse {
  const { pathname } = req.nextUrl;
  const newPath = pathname === '/' ? '/signal'
    : pathname.startsWith('/platform') ? pathname
    : `/platform${pathname}`;
  const url = req.nextUrl.clone();
  url.pathname = newPath;
  const headers = new Headers(req.headers);
  headers.set('x-platform-mode', 'true');
  if (isAdmin) headers.set('x-admin-mode', 'true');
  return NextResponse.rewrite(url, { request: { headers } });
}

// ─── Main Middleware ──────────────────────────────────────────────────────────
export default function middleware(req: NextRequest): NextResponse {
  const { mode, slug } = classifyHost(req);
  const { pathname }   = req.nextUrl;

  // ── Demo workspace — always serve, no auth
  if (mode === 'demo') {
    const url = req.nextUrl.clone();
    if (!pathname.startsWith('/pm')) url.pathname = '/pm';
    const headers = new Headers(req.headers);
    headers.set('x-demo-mode', 'true');
    headers.set('x-tenant-slug', 'demo');
    return NextResponse.rewrite(url, { request: { headers } });
  }

  // ── Localhost dev — pass through with slug header
  if (mode === 'localhost') {
    const headers = new Headers(req.headers);
    headers.set('x-tenant-slug', slug ?? DEFAULT_TENANT);
    return NextResponse.next({ request: { headers } });
  }

  // ── Marketing root domain — no auth needed
  if (mode === 'marketing') {
    return NextResponse.next();
  }

  // ── API / upload paths — pass through (proxied to FastAPI by next.config.js)
  // CRITICAL: Must inject x-tenant-slug so resolve_workspace() on the backend knows the tenant
  if (pathname.startsWith('/api/') || pathname.startsWith('/pm-api/') || pathname.startsWith('/uploads/')) {
    const apiHeaders = new Headers(req.headers);
    // Platform/admin mode has no slug — use 'signal' tenant for platform ops
    const effectiveSlug = (mode === 'platform' || mode === 'admin')
      ? 'signal'
      : (slug ?? DEFAULT_TENANT);
    apiHeaders.set('x-tenant-slug', effectiveSlug);
    return NextResponse.next({ request: { headers: apiHeaders } });
  }

  // ── Auth bypass paths — always accessible
  if (isBypassPath(pathname)) {
    return NextResponse.next();
  }

  // ── Platform / Admin control plane (signal.fieldstone.pro)
  if (mode === 'platform' || mode === 'admin') {
    // Root platform path: authenticated users go to /redirect, others to /login
    if (pathname === '/' || pathname === '') {
      if (hasSignalToken(req)) {
        return NextResponse.redirect(new URL('/redirect', req.url));
      }
      return applyPlatformRewrite(req, mode === 'admin');
    }
    // Protected platform routes require auth
    if (pathname.startsWith('/pm') || pathname.startsWith('/platform')) {
      if (!hasSignalToken(req)) {
        return NextResponse.redirect(new URL(`https://${SIGNAL_DOMAIN}/login`, req.url));
      }
    }
    return applyPlatformRewrite(req, mode === 'admin');
  }

  // ── Tenant workspace ({slug}.signal.fieldstone.pro)
  // Cookie is readable here because it is set with Domain=.signal.fieldstone.pro
  // Auth enforcement is handled client-side by WorkspaceGuard (cleaner UX, avoids
  // middleware edge limitations). Middleware just passes tenant slug via header.
  const headers = new Headers(req.headers);
  headers.set('x-tenant-slug', slug ?? DEFAULT_TENANT);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)'  ,
    '/(api|trpc)(.*)'  ,
  ],
};
