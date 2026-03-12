'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Flex, VStack, Spinner, Text } from '@chakra-ui/react';

const BASE_DOMAIN   = process.env.NEXT_PUBLIC_BASE_DOMAIN   || 'fieldstone.pro';
const SIGNAL_DOMAIN = process.env.NEXT_PUBLIC_SIGNAL_DOMAIN || ('signal.' + BASE_DOMAIN);

export default function PostLoginRedirect() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const didRun = useRef(false);
  const [status, setStatus] = useState('LOADING...');

  useEffect(() => {
    if (!isLoaded) return;
    if (didRun.current) return;

    // 500ms grace period for Clerk cross-domain session to propagate
    // Without this, isSignedIn can be false briefly after redirect causing a loop
    const timer = setTimeout(async () => {
      if (didRun.current) return;
      didRun.current = true;

      if (!isSignedIn) {
        // Use absolute URL — relative /login can cause loops if middleware
        // intercepts and Clerk hasn't settled the session yet
        setStatus('SIGNING IN...');
        window.location.href = `https://${SIGNAL_DOMAIN}/login`;
        return;
      }

      setStatus('CHECKING WORKSPACE...');

      try {
        const token = await getToken();
        if (!token) {
          window.location.href = `https://${SIGNAL_DOMAIN}/pm/onboarding`;
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
            setStatus('OPENING WORKSPACE...');
            window.location.href = `${proto}//${slug}.${SIGNAL_DOMAIN}/pm`;
            return;
          }
        }

        // No workspaces or API error — go to onboarding
        window.location.href = `https://${SIGNAL_DOMAIN}/pm/onboarding`;

      } catch (_err) {
        window.location.href = `https://${SIGNAL_DOMAIN}/pm/onboarding`;
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [isLoaded, isSignedIn, getToken]);

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
