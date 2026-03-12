'use client';

import { useEffect, useRef, useState } from 'react';
import { Flex, VStack, Spinner, Text } from '@chakra-ui/react';

const BASE_DOMAIN   = process.env.NEXT_PUBLIC_BASE_DOMAIN   || 'fieldstone.pro';
const SIGNAL_DOMAIN = process.env.NEXT_PUBLIC_SIGNAL_DOMAIN || ('signal.' + BASE_DOMAIN);

export default function PostLoginRedirect() {
  const didRun = useRef(false);
  const [status, setStatus] = useState('LOADING...');

  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;

    async function route() {
      setStatus('CHECKING SESSION...');
      try {
        // 1. Verify auth via signal_token cookie
        const meRes = await fetch('/api/auth/me', {
          credentials: 'include',
          cache: 'no-store',
        });
        if (!meRes.ok) {
          setStatus('SIGNING IN...');
          window.location.href = `https://${SIGNAL_DOMAIN}/login`;
          return;
        }
        const me = await meRes.json();

        // 2. Platform admin → route to platform hub
        if (me.role === 'platform_admin') {
          setStatus('OPENING PLATFORM...');
          window.location.href = `https://${SIGNAL_DOMAIN}/platform`;
          return;
        }

        // 3. If /me already has a slug, go directly — no extra round-trip needed
        if (me.slug) {
          setStatus('OPENING WORKSPACE...');
          const proto = window.location.protocol;
          window.location.href = `${proto}//${me.slug}.${SIGNAL_DOMAIN}/pm`;
          return;
        }

        // 3. Fallback: fetch full workspace list
        setStatus('CHECKING WORKSPACE...');
        const wsRes = await fetch('/api/user/workspaces', { credentials: 'include' });
        if (wsRes.ok) {
          const data = await wsRes.json();
          const list: Array<{ slug: string }> = Array.isArray(data)
            ? data : ((data as { workspaces?: Array<{ slug: string }> }).workspaces ?? []);
          if (list.length > 0) {
            setStatus('OPENING WORKSPACE...');
            const proto = window.location.protocol;
            window.location.href = `${proto}//${list[0].slug}.${SIGNAL_DOMAIN}/pm`;
            return;
          }
        }

        // 4. No workspaces — send to onboarding
        window.location.href = `https://${SIGNAL_DOMAIN}/pm/onboarding`;
      } catch {
        window.location.href = `https://${SIGNAL_DOMAIN}/pm/onboarding`;
      }
    }

    void route();
  }, []);

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
