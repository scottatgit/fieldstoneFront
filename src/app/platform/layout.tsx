'use client';
import { ChakraProvider, Box, Flex, Spinner, Text } from '@chakra-ui/react';
import { useUser } from '@/lib/useUser';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PlatformNav } from '@/components/platform/PlatformNav';
import pmTheme from '@/components/pm/pmTheme';

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace('/login?redirect_url=' + encodeURIComponent(window.location.href));
    }
  }, [isLoaded, isSignedIn, router]);

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

  if (!isSignedIn) {
    return (
      <ChakraProvider theme={pmTheme}>
        <Box bg="gray.950" h="100dvh">
          <Flex h="100%" align="center" justify="center">
            <Text fontSize="xs" color="gray.600" fontFamily="mono">Redirecting to login...</Text>
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
