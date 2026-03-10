'use client';
import { ChakraProvider } from '@chakra-ui/react';
import { Box } from '@chakra-ui/react';
import { PlatformNav } from '@/components/platform/PlatformNav';
import pmTheme from '@/components/pm/pmTheme';

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return (
    <ChakraProvider theme={pmTheme}>
      <Box display="flex" flexDirection="column" h="100dvh" bg="gray.950" overflow="hidden">
        <PlatformNav />
        <Box flex={1} overflowY="auto">
          {children}
        </Box>
      </Box>
    </ChakraProvider>
  );
}
