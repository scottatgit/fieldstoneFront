'use client';
import { Box, Flex, Text, Link } from '@chakra-ui/react';
import { isDemoMode } from '@/lib/demoApi';

export function DemoBanner() {
  if (!isDemoMode()) return null;
  return (
    <Box
      bg="indigo.900"
      borderBottom="1px solid"
      borderColor="indigo.700"
      py={1.5}
      px={4}
      flexShrink={0}
    >
      <Flex align="center" justify="center" gap={2} flexWrap="wrap">
        <Text fontSize="xs" color="gray.300">
          <Text as="strong" color="white">Signal Demo</Text>
          {' '}— Explore how Signal extracts intelligence from service operations.
        </Text>
        <Link
          href="https://signal.fieldstone.pro/"
          fontSize="xs"
          color="blue.300"
          fontWeight="semibold"
          _hover={{ color: 'white', textDecoration: 'underline' }}
          isExternal
        >
          Get Signal for your team →
        </Link>
      </Flex>
    </Box>
  );
}
