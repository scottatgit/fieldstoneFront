'use client';

import { useEffect, useRef } from 'react';
import { Flex, VStack, Spinner, Text } from '@chakra-ui/react';

const BASE_DOMAIN   = process.env.NEXT_PUBLIC_BASE_DOMAIN   || 'fieldstone.pro';
const SIGNAL_DOMAIN = process.env.NEXT_PUBLIC_SIGNAL_DOMAIN || ('signal.' + BASE_DOMAIN);

export default function PmRedirect() {
  const didRun = useRef(false);

  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;

    async function route() {
      try {
        const meRes = await fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' });
        if (!meRes.ok) {
          window.location.href = '/login';
          return;
        }
        const me = await meRes.json();
        if (me.slug) {
          const proto = window.location.protocol;
          window.location.href = `${proto}//${me.slug}.${SIGNAL_DOMAIN}/pm`;
          return;
        }
        window.location.href = '/pm/onboarding';
      } catch {
        window.location.href = '/login';
      }
    }
    void route();
  }, []);

  return (
    <Flex minH="100vh" align="center" justify="center" bg="gray.900">
      <VStack spacing={4}>
        <Spinner size="md" color="blue.400" thickness="2px" />
        <Text fontSize="xs" color="gray.600" fontFamily="mono" letterSpacing="widest">LOADING...</Text>
      </VStack>
    </Flex>
  );
}
