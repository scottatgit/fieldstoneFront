'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Flex, VStack, Spinner, Text } from '@chakra-ui/react';

const BASE_DOMAIN   = process.env.NEXT_PUBLIC_BASE_DOMAIN   || 'fieldstone.pro';
const SIGNAL_DOMAIN = process.env.NEXT_PUBLIC_SIGNAL_DOMAIN || ('signal.' + BASE_DOMAIN);

export default function PostLoginRedirect() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const didRun = useRef(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (didRun.current) return;
    didRun.current = true;

    async function route() {
      if (!isSignedIn) {
        window.location.href = '/login';
        return;
      }

      try {
        const token = await getToken();
        if (!token) {
          window.location.href = '/pm/onboarding';
          return;
        }

        const res = await fetch('/api/user/workspaces', {
          headers: { Authorization: 'Bearer ' + token },
        });

        if (res.ok) {
          const data = await res.json();
          const list: Array<{ slug: string }> = Array.isArray(data)
            ? data
            : ((data as { workspaces?: Array<{ slug: string }> }).workspaces ?? []);

          if (list.length > 0) {
            const slug = list[0].slug;
            const proto = window.location.protocol;
            window.location.href = `${proto}//${slug}.${SIGNAL_DOMAIN}/pm`;
            return;
          }
        }

        // No workspaces OR any API error — onboarding
        window.location.href = '/pm/onboarding';

      } catch (_err) {
        window.location.href = '/pm/onboarding';
      }
    }

    void route();
  }, [isLoaded, isSignedIn, getToken]);

  return (
    <Flex minH="100vh" align="center" justify="center" bg="gray.900">
      <VStack spacing={4}>
        <Spinner size="md" color="blue.400" thickness="2px" />
        <Text fontSize="xs" color="gray.600" fontFamily="mono" letterSpacing="widest">
          LOADING...
        </Text>
      </VStack>
    </Flex>
  );
}
