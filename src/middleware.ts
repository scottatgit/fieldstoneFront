import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

// ─── Configuration ────────────────────────────────────────────────────────────
const BASE_DOMAIN    = process.env.NEXT_PUBLIC_BASE_DOMAIN   || 'fieldstone.pro';
const SIGNAL_DOMAIN  = process.env.NEXT_PUBLIC_SIGNAL_DOMAIN || `signal.${BASE_DOMAIN}`;
const DEFAULT_TENANT = process.env.NEXT_PUBLIC_DEFAULT_TENANT || 'demo';
const CLERK_KEY      = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '';

const hasValidClerkKey =
  CLERK_KEY.startsWith('pk_') &&
  !CLERK_KEY.includes('placeholder') &&
  CLERK_KEY.length > 20;

// Reserved slugs — never resolve as tenant workspaces
const RESERVED_SLUGS = new Set(['www', 'app', 'admin', 'demo', 'api', 'signal', 'static']);
const SLUG_PATTERN   = /^[a-z0-9-]{2,40}$/;

// Routes that require login on tenant subdomains
const isProtectedRoute = createRouteMatcher(['/pm(.*)', '/platform(.*)']);

// Paths that should NEVER be rewritten to /platform/* or intercepted by guards
const BYPASS_PATHS = [
  '/login', '/signup', '/sso-callback',
  '/redirect', '/pm/redirect', '/pm/onboarding',
  '/invite',
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

function addTenantHeader(req: NextRequest, slug: string): NextResponse {
  const headers = new Headers(req.headers);
  headers.set('x-tenant-slug', slug);
  return NextResponse.next({ request: { headers } });
}

/**
 * Bypass Clerk entirely for:
 * - localhost/dev
 * - marketing root domain (fieldstone.pro)
 * - demo subdomain (demo.signal.fieldstone.pro)
 * - no valid Clerk key
 *
 * NOTE: NEXT_PUBLIC_DEMO_MODE is intentionally NOT used here.
 * The demo subdomain is handled by host classification above.
 */
function shouldBypassAuth(req: NextRequest): boolean {
  if (!hasValidClerkKey) return true;
  const hostname = (req.headers.get('host') || '').split(':')[0];
  if (hostname === 'localhost' || hostname === '127.0.0.1') return true;
  if (hostname === BASE_DOMAIN || hostname === `www.${BASE_DOMAIN}`) return true;
  if (hostname === `demo.${SIGNAL_DOMAIN}`) return true;
  return false;
}

// ─── Bypass Middleware (no-auth paths) ────────────────────────────────────────
function bypassMiddleware(req: NextRequest): NextResponse {
  const { mode, slug } = classifyHost(req);
  const { pathname }   = req.nextUrl;

  // Demo workspace — serve directly
  if (mode === 'demo') {
    const url = req.nextUrl.clone();
    if (!pathname.startsWith('/pm')) url.pathname = '/pm';
    const headers = new Headers(req.headers);
    headers.set('x-demo-mode', 'true');
    headers.set('x-tenant-slug', 'demo');
    return NextResponse.rewrite(url, { request: { headers } });
  }

  // Localhost — pass slug or default
  if (mode === 'localhost') {
    const headers = new Headers(req.headers);
    headers.set('x-tenant-slug', slug ?? DEFAULT_TENANT);
    return NextResponse.next({ request: { headers } });
  }

  // Marketing root domain
  return NextResponse.next();
}

// ─── Clerk-Protected Middleware ───────────────────────────────────────────────
const clerkProtectedMiddleware = clerkMiddleware((auth, req) => {
  const { mode, slug } = classifyHost(req);
  const { pathname }   = req.nextUrl;

  // ── Demo workspace (shouldn't reach here but guard anyway)
  if (mode === 'demo') {
    const url = req.nextUrl.clone();
    if (!pathname.startsWith('/pm')) url.pathname = '/pm';
    const headers = new Headers(req.headers);
    headers.set('x-demo-mode', 'true');
    headers.set('x-tenant-slug', 'demo');
    return NextResponse.rewrite(url, { request: { headers } });
  }

  // ── Platform / Admin control plane (signal.fieldstone.pro)
  if (mode === 'platform' || mode === 'admin') {
    // Auth pages + routing helpers: serve as-is, no rewrite
    if (isBypassPath(pathname)) {
      return NextResponse.next();
    }
    // Signed-in users trying to hit platform root → send to their workspace
    const { userId, sessionClaims } = auth();
    if (userId) {
      // @ts-expect-error: Clerk publicMetadata typed loosely
      const role = sessionClaims?.publicMetadata?.role as string | undefined;
      if (role === 'admin' || role === 'platform_admin') {
        return applyPlatformRewrite(req, true);
      }
      // Regular user on platform domain — route via /redirect
      if (pathname === '/' || pathname === '') {
        return NextResponse.redirect(new URL(`https://${SIGNAL_DOMAIN}/redirect`, req.url));
      }
    }
    // Not signed in or regular platform path → apply platform rewrite
    return applyPlatformRewrite(req, mode === 'admin');
  }

  // ── Tenant workspace ({slug}.signal.fieldstone.pro)
  if (isProtectedRoute(req)) {
    const { userId } = auth();
    if (!userId) {
      // Redirect to login on platform domain
      return NextResponse.redirect(
        new URL(`https://${SIGNAL_DOMAIN}/login?redirect_url=${encodeURIComponent(req.url)}`, req.url)
      );
    }
  }

  // Authenticated tenant route — set slug header
  const headers = new Headers(req.headers);
  headers.set('x-tenant-slug', slug ?? DEFAULT_TENANT);
  return NextResponse.next({ request: { headers } });
});

// ─── Main Export ──────────────────────────────────────────────────────────────
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
