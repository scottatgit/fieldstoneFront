import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'fieldstone.pro';
const DEFAULT_TENANT = process.env.NEXT_PUBLIC_DEFAULT_TENANT || 'ipquest';

const isProtectedRoute = createRouteMatcher(['/pm(.*)']);

/**
 * Extract tenant from subdomain.
 * ipquest.fieldstone.pro → 'ipquest'
 * fieldstone.pro         → DEFAULT_TENANT
 * localhost              → DEFAULT_TENANT
 */
function extractTenant(req: NextRequest): string {
  const host = req.headers.get('host') || '';
  // Strip port number
  const hostname = host.split(':')[0];

  // Localhost dev — use DEFAULT_TENANT
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return req.headers.get('x-tenant-id') || DEFAULT_TENANT;
  }

  // subdomain.fieldstone.pro → subdomain
  if (hostname.endsWith(`.${BASE_DOMAIN}`)) {
    const subdomain = hostname.replace(`.${BASE_DOMAIN}`, '');
    // Ignore www, app, demo as non-tenant subdomains
    if (['www', 'app', 'demo'].includes(subdomain)) return DEFAULT_TENANT;
    return subdomain;
  }

  return DEFAULT_TENANT;
}

export default clerkMiddleware((auth, req) => {
  const tenant = extractTenant(req);

  // Clone request headers and inject tenant
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-tenant-id', tenant);

  // In demo mode, allow all routes through without auth
  if (isDemoMode) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // Protect PM routes — redirect to /login if not authenticated
  if (isProtectedRoute(req)) {
    const { userId } = auth();
    if (!userId) {
      const loginUrl = new URL('/login', req.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Pass through with tenant header injected
  return NextResponse.next({ request: { headers: requestHeaders } });
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
