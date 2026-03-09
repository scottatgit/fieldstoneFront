'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter, usePathname } from 'next/navigation';
import { Flex, VStack, Text, Button, Spinner } from '@chakra-ui/react';

export function WorkspaceGuard({ children }: { children: React.ReactNode }) {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const router   = useRouter();
  const pathname = usePathname();
  const [checking, setChecking]         = useState(true);
  const [hasWorkspace, setHasWorkspace] = useState(true);
  const isOnboarding = (pathname ?? '').startsWith('/pm/onboarding');

  useEffect(() => {
    if (isOnboarding)       { setChecking(false); return; }
    if (isLoaded === false) return;
    if (isSignedIn === false) { setChecking(false); return; }
    let cancelled = false;
    async function check() {
      try {
        const token = await getToken();
        if (token === null || token === undefined) { setChecking(false); return; }
        const res = await fetch('/api/user/workspaces', {
          headers: { Authorization: 'Bearer ' + token },
        });
        if (res.ok === false) { setChecking(false); return; }
        const data = await res.json();
        const list: unknown[] = Array.isArray(data) ? data : ((data as { workspaces?: unknown[] }).workspaces ?? []);
        if (cancelled) return;
        if (list.length === 0) {
          router.replace('/pm/onboarding');
        } else {
          setHasWorkspace(true);
          setChecking(false);
        }
      } catch (_err) {
        if (cancelled === false) setChecking(false);
      }
    }
    void check();
    return () => { cancelled = true; };
  }, [isLoaded, isSignedIn, isOnboarding, getToken, router]);

  if (checking && isOnboarding === false) {
    return (
      <Flex minH='100vh' align='center' justify='center' bg='gray.900'>
        <VStack spacing={4}>
          <Spinner size='md' color='blue.400' thickness='2px' />
          <Text fontSize='xs' color='gray.600' fontFamily='mono' letterSpacing='widest'>
            LOADING WORKSPACE...
          </Text>
        </VStack>
      </Flex>
    );
  }

  if (hasWorkspace === false && isOnboarding === false) {
    return (
      <Flex minH='100vh' align='center' justify='center' bg='gray.900' px={6}>
        <VStack spacing={6} maxW='400px' w='full' textAlign='center'
          bg='gray.800' border='1px solid' borderColor='gray.700'
          borderRadius='xl' p={10}>
          <Text fontSize='xs' fontWeight='black' fontFamily='mono'
            letterSpacing='widest' color='blue.400'>SIGNAL</Text>
          <VStack spacing={2}>
            <Text fontSize='xl' fontWeight='bold' color='white'>Welcome to Signal</Text>
            <Text fontSize='sm' color='gray.400'>
              You need a workspace to get started.
            </Text>
          </VStack>
          <Button
            onClick={() => router.push('/pm/onboarding')}
            bg='blue.500' color='white' size='md' w='full'
            fontFamily='mono' fontWeight='bold' letterSpacing='wider'
            fontSize='xs' _hover={{ bg: 'blue.400' }}
          >
            SET UP YOUR WORKSPACE
          </Button>
        </VStack>
      </Flex>
    );
  }

  return <>{children}</>;
}
