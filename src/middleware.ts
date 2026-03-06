import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

const isProtectedRoute = createRouteMatcher([
  '/pm(.*)',
]);

export default clerkMiddleware((auth, req) => {
  // In demo mode, allow all routes through without auth
  if (isDemoMode) return NextResponse.next();

  // Protect PM routes — redirect to /login if not authenticated
  if (isProtectedRoute(req)) {
    const { userId } = auth();
    if (!userId) {
      const loginUrl = new URL('/login', req.url);
      return NextResponse.redirect(loginUrl);
    }
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
