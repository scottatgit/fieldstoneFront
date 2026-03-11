'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter, usePathname } from 'next/navigation';
import { Flex, VStack, Text, Spinner } from '@chakra-ui/react';

const BASE_DOMAIN   = process.env.NEXT_PUBLIC_BASE_DOMAIN   || 'fieldstone.pro';
const SIGNAL_DOMAIN = process.env.NEXT_PUBLIC_SIGNAL_DOMAIN || ('signal.' + BASE_DOMAIN);
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

interface Workspace { slug: string; tenant_id: string; name: string; role: string; }

export function WorkspaceGuard({ children }: { children: React.ReactNode }) {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const router   = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  // These paths must render immediately — no workspace check
  const isBypassPath = [
    '/pm/onboarding',
    '/pm/redirect',
    '/redirect',
  ].some(p => (pathname ?? '').startsWith(p));

  useEffect(() => {
    if (isBypassPath) { setChecking(false); return; }
    if (!isLoaded) return;

    // Not signed in — middleware should have redirected, but guard as fallback
    if (!isSignedIn) {
      const proto  = typeof window !== 'undefined' ? window.location.protocol : 'https:';
      window.location.href = `${proto}//${SIGNAL_DOMAIN}/login`;
      return;
    }

    let cancelled = false;

    async function check() {
      try {
        const token = await getToken();
        if (!token) {
          window.location.href = `https://${SIGNAL_DOMAIN}/pm/onboarding`;
          return;
        }

        const res = await fetch('/api/user/workspaces', {
          headers: { Authorization: 'Bearer ' + token },
        });

        if (!res.ok) {
          if (!cancelled) setChecking(false);
          return;
        }

        const data = await res.json();
        const list: Workspace[] = Array.isArray(data)
          ? data
          : ((data as { workspaces?: Workspace[] }).workspaces ?? []);

        if (cancelled) return;

        if (list.length === 0) {
          window.location.href = `https://${SIGNAL_DOMAIN}/pm/onboarding`;
          return;
        }

        const currentSlug = getCurrentSlug();

        if (currentSlug === null) {
          // On root/platform domain with a workspace — redirect to it
          const proto = window.location.protocol;
          window.location.href = `${proto}//${list[0].slug}.${SIGNAL_DOMAIN}/pm`;
          return;
        }

        // Check user is linked to THIS workspace
        const linked = list.find(w => w.slug === currentSlug);
        if (!linked) {
          // User has workspaces but not this one — send to their correct workspace
          const proto = window.location.protocol;
          window.location.href = `${proto}//${list[0].slug}.${SIGNAL_DOMAIN}/pm`;
          return;
        }

        if (!cancelled) setChecking(false);
      } catch (_err) {
        if (!cancelled) setChecking(false);
      }
    }

    void check();
    return () => { cancelled = true; };
  }, [isLoaded, isSignedIn, isBypassPath, getToken, router]);

  if (checking && !isBypassPath) {
    return (
      <Flex minH="100vh" align="center" justify="center" bg="gray.900">
        <VStack spacing={4}>
          <Spinner size="md" color="blue.400" thickness="2px" />
          <Text fontSize="xs" color="gray.600" fontFamily="mono" letterSpacing="widest">
            LOADING WORKSPACE...
          </Text>
        </VStack>
      </Flex>
    );
  }

  return <>{children}</>;
}
