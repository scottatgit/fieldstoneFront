'use client';
import { Box, Flex, Text, Link } from '@chakra-ui/react';
import { isDemoMode } from '@/lib/demoApi';

export function DemoBanner() {
  if (!isDemoMode()) return null;
  return (
    <Box
      bg="purple.800"
      borderBottom="1px solid"
      borderColor="purple.600"
      py={1.5}
      px={4}
      flexShrink={0}
    >
      <Flex align="center" justify="center" gap={2} flexWrap="wrap">
        <Text fontSize="xs" color="purple.100">
          🎭 <Text as="strong" color="white">Demo Mode</Text>
          {' '}— Showing example data for illustration purposes.
        </Text>
        <Link
          href="https://fieldstone.pro"
          fontSize="xs"
          color="purple.300"
          fontWeight="semibold"
          _hover={{ color: 'white', textDecoration: 'underline' }}
          isExternal
        >
          Get SecondBrain for your MSP →
        </Link>
      </Flex>
    </Box>
  );
}
