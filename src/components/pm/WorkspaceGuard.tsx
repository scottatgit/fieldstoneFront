'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import { usePathname } from 'next/navigation';
import { Flex, VStack, Text, Spinner } from '@chakra-ui/react';

const BASE_DOMAIN    = process.env.NEXT_PUBLIC_BASE_DOMAIN   || 'fieldstone.pro';
const SIGNAL_DOMAIN  = process.env.NEXT_PUBLIC_SIGNAL_DOMAIN || ('signal.' + BASE_DOMAIN);
const RESERVED_SLUGS = new Set(['www', 'app', 'admin', 'demo', 'api', 'signal', 'static']);

// How long to wait for Clerk cross-subdomain session sync before concluding not signed in
const SESSION_GRACE_MS = 3000;
// Poll interval while waiting
const POLL_INTERVAL_MS = 300;

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

interface Workspace { slug: string; tenant_id: string; name: string; role: string; }

export function WorkspaceGuard({ children }: { children: React.ReactNode }) {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const pathname  = usePathname();
  const [checking, setChecking] = useState(true);
  const [status, setStatus]     = useState('LOADING...');
  const didRun  = useRef(false);
  const startTs = useRef<number | null>(null);

  // Bypass paths — render immediately, no auth/workspace check
  const isBypassPath = [
    '/pm/onboarding',
    '/pm/redirect',
    '/redirect',
  ].some(p => (pathname ?? '').startsWith(p));

  useEffect(() => {
    if (isBypassPath) { setChecking(false); return; }
    if (!isLoaded) return;

    // Record when Clerk first reports loaded so we can enforce the grace window
    if (startTs.current === null) startTs.current = Date.now();

    // ── Cross-subdomain session sync: Clerk may report isSignedIn=false briefly
    // after landing on a tenant subdomain even if the user IS authenticated on
    // signal.fieldstone.pro.  Wait up to SESSION_GRACE_MS before acting on it.
    if (!isSignedIn) {
      const elapsed = Date.now() - (startTs.current ?? Date.now());
      if (elapsed < SESSION_GRACE_MS) {
        // Re-check after POLL_INTERVAL_MS — the useEffect will re-run when
        // isSignedIn changes, but we also set a timer so we catch the timeout.
        const t = setTimeout(() => {
          // force a re-render so the elapsed check runs again
          setStatus('SYNCING SESSION...');
        }, POLL_INTERVAL_MS);
        return () => clearTimeout(t);
      }
      // Grace period expired — user is genuinely not signed in
      setStatus('REDIRECTING...');
      window.location.href = `https://${SIGNAL_DOMAIN}/login`;
      return;
    }

    // Signed in — run workspace check exactly once
    if (didRun.current) return;
    didRun.current = true;

    async function check() {
      try {
        setStatus('CHECKING WORKSPACE...');
        const token = await getToken();
        if (!token) {
          window.location.href = `https://${SIGNAL_DOMAIN}/pm/onboarding`;
          return;
        }

        const res = await fetch('/api/user/workspaces', {
          headers: { Authorization: 'Bearer ' + token },
        });

        if (!res.ok) {
          setChecking(false);
          return;
        }

        const data = await res.json();
        const list: Workspace[] = Array.isArray(data)
          ? data
          : ((data as { workspaces?: Workspace[] }).workspaces ?? []);

        if (list.length === 0) {
          window.location.href = `https://${SIGNAL_DOMAIN}/pm/onboarding`;
          return;
        }

        const currentSlug = getCurrentSlug();

        // On platform domain with workspace — redirect to first workspace
        if (currentSlug === null) {
          const proto = window.location.protocol;
          window.location.href = `${proto}//${list[0].slug}.${SIGNAL_DOMAIN}/pm`;
          return;
        }

        // Check user is linked to THIS tenant workspace
        const linked = list.find(w => w.slug === currentSlug);
        if (!linked) {
          // Redirect to their correct workspace
          const proto = window.location.protocol;
          window.location.href = `${proto}//${list[0].slug}.${SIGNAL_DOMAIN}/pm`;
          return;
        }

        // All good — show workspace
        setStatus('READY');
        setChecking(false);
      } catch (_err) {
        setChecking(false);
      }
    }

    void check();
  });
  // Note: intentionally no deps array — we need this to re-run on every render
  // during the grace period polling loop. didRun.current prevents duplicate work.

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
