'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { Flex, VStack, Text, Spinner } from '@chakra-ui/react';
import { useUser } from '@/lib/useUser';
import { isDemoMode } from '@/lib/demoApi';

const BASE_DOMAIN    = process.env.NEXT_PUBLIC_BASE_DOMAIN   || 'fieldstone.pro';
const SIGNAL_DOMAIN  = process.env.NEXT_PUBLIC_SIGNAL_DOMAIN || ('signal.' + BASE_DOMAIN);
const RESERVED_SLUGS = new Set(['www', 'app', 'admin', 'demo', 'api', 'signal', 'static']);

function getCurrentSlug(): string | null {
  if (typeof window === 'undefined') return null;
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') return null;
  if (hostname.endsWith('.' + SIGNAL_DOMAIN)) {
    const sub = hostname.split('.')[0];
    return RESERVED_SLUGS.has(sub) ? null : sub;
  }
  if (hostname.endsWith('.' + BASE_DOMAIN)) {
    const sub = hostname.replace('.' + BASE_DOMAIN, '');
    return RESERVED_SLUGS.has(sub) ? null : sub;
  }
  return null;
}

export function WorkspaceGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoaded, isSignedIn } = useUser();
  const pathname  = usePathname();
  const [checking, setChecking] = useState(true);
  const [status, setStatus]     = useState('LOADING...');
  const didRoute = useRef(false);

  const isDemo      = isDemoMode();
  const isBypassPath = [
    '/pm/onboarding',
    '/pm/redirect',
    '/redirect',
  ].some(p => (pathname ?? '').startsWith(p));

  useEffect(() => {
    if (isBypassPath || isDemo) { setChecking(false); return; }
    if (!isLoaded) return;
    if (didRoute.current) return;

    if (!isSignedIn) {
      didRoute.current = true;
      setStatus('REDIRECTING...');
      window.location.href = `https://${SIGNAL_DOMAIN}/login`;
      return;
    }

    // user is loaded and signed in
    didRoute.current = true;

    if (!user) {
      setChecking(false);
      return;
    }

    // Phase 11a: Email not verified — send to verify-pending
    if (!user.email_verified) {
      setStatus('EMAIL VERIFICATION REQUIRED...');
      window.location.href = `https://${SIGNAL_DOMAIN}/verify-pending`;
      return;
    }

    // Phase 11b: Verified but no workspace yet — send to onboarding to create one
    if (!user.slug || !user.tenant_id) {
      setStatus('SETTING UP WORKSPACE...');
      window.location.href = `https://${SIGNAL_DOMAIN}/pm/onboarding`;
      return;
    }

    const currentSlug = getCurrentSlug();

    // On platform domain (no slug) — redirect to user's workspace
    if (currentSlug === null) {
      setStatus('OPENING WORKSPACE...');
      const proto = window.location.protocol;
      window.location.href = `${proto}//${user.slug}.${SIGNAL_DOMAIN}/pm`;
      return;
    }

    // On a tenant subdomain — check it matches user's workspace
    if (user.slug !== currentSlug) {
      setStatus('REDIRECTING TO YOUR WORKSPACE...');
      const proto = window.location.protocol;
      window.location.href = `${proto}//${user.slug}.${SIGNAL_DOMAIN}/pm`;
      return;
    }

    // All good
    setStatus('READY');
    setChecking(false);
  }, [isLoaded, isSignedIn, user, isBypassPath, pathname]);

  if (checking && !isBypassPath) {
    return (
      <Flex minH="100vh" align="center" justify="center" bg="gray.900">
        <VStack spacing={4}>
          <Spinner size="md" color="blue.400" thickness="2px" />
          <Text fontSize="xs" color="gray.600" fontFamily="mono" letterSpacing="widest">
            {status}
          </Text>
        </VStack>
      </Flex>
    );
  }

  return <>{children}</>;
}
