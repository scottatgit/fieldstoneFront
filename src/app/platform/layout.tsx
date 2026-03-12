'use client';
import { ChakraProvider, Box, Flex, Spinner, Text } from '@chakra-ui/react';
import { useUser } from '@/lib/useUser';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PlatformNav } from '@/components/platform/PlatformNav';
import pmTheme from '@/components/pm/pmTheme';

const SIGNAL_DOMAIN = process.env.NEXT_PUBLIC_SIGNAL_DOMAIN || 'signal.fieldstone.pro';

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    // Not signed in → login
    if (!isSignedIn) {
      router.replace('/login?redirect_url=' + encodeURIComponent(window.location.href));
      return;
    }

    // Signed in but not platform_admin → bounce to their workspace
    if (user && user.role !== 'platform_admin') {
      const proto = window.location.protocol;
      const dest = user.slug
        ? `${proto}//${user.slug}.${SIGNAL_DOMAIN}/pm`
        : `${proto}//${SIGNAL_DOMAIN}/redirect`;
      window.location.href = dest;
    }
  }, [isLoaded, isSignedIn, user, router]);

  // Loading state
  if (!isLoaded) {
    return (
      <ChakraProvider theme={pmTheme}>
        <Box bg="gray.950" h="100dvh">
          <Flex h="100%" align="center" justify="center" direction="column" gap={3}>
            <Spinner color="orange.400" size="lg" />
            <Text fontSize="xs" color="gray.600" fontFamily="mono" letterSpacing="wider">LOADING SIGNAL...</Text>
          </Flex>
        </Box>
      </ChakraProvider>
    );
  }

  // Not signed in or insufficient role — blank while redirect fires
  if (!isSignedIn || (user && user.role !== 'platform_admin')) {
    return (
      <ChakraProvider theme={pmTheme}>
        <Box bg="gray.950" h="100dvh">
          <Flex h="100%" align="center" justify="center">
            <Text fontSize="xs" color="gray.600" fontFamily="mono">Redirecting...</Text>
          </Flex>
        </Box>
      </ChakraProvider>
    );
  }

  return (
    <ChakraProvider theme={pmTheme}>
      <Box display="flex" flexDirection="column" h="100dvh" bg="gray.950" overflow="hidden">
        <PlatformNav />
        <Box flex={1} overflowY="auto">{children}</Box>
      </Box>
    </ChakraProvider>
  );
}
