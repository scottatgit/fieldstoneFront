'use client';
import { Box, VStack, Text, SimpleGrid, Badge, HStack } from '@chakra-ui/react';

function StubCard({ label, value, color = 'white' }: { label: string; value: string; color?: string }) {
  return (
    <Box p={4} bg="gray.900" borderRadius="md" border="1px solid" borderColor="gray.800">
      <Text fontSize="xl" fontWeight="black" color={color} lineHeight={1} mb={1}>{value}</Text>
      <Text fontSize="xs" fontFamily="mono" color="gray.500" textTransform="uppercase" letterSpacing="wider">{label}</Text>
    </Box>
  );
}

export default function PlatformBillingPage() {
  return (
    <Box p={6} maxW="1200px" mx="auto">
      <VStack spacing={6} align="stretch">
        <HStack justify="space-between">
          <VStack align="start" spacing={0}>
            <Text fontSize="xl" fontWeight="black" color="white" fontFamily="mono" letterSpacing="wider">BILLING</Text>
            <Text fontSize="xs" color="gray.500" fontFamily="mono">Platform-wide subscription and revenue overview</Text>
          </VStack>
          <Badge colorScheme="orange" fontSize="xs" fontFamily="mono" px={3} py={1}>STRIPE</Badge>
        </HStack>
        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3}>
          <StubCard label="MRR"            value="$—"  color="green.400" />
          <StubCard label="Active Seats"   value="—"   color="blue.400" />
          <StubCard label="Trial Seats"    value="—"   color="orange.400" />
          <StubCard label="Churned (30d)"  value="—"   color="red.400" />
        </SimpleGrid>
        <Box p={8} bg="gray.900" borderRadius="md" border="1px solid" borderColor="gray.800" textAlign="center">
          <Text color="gray.600" fontFamily="mono" fontSize="sm">Stripe billing dashboard integration — coming soon</Text>
          <Text color="gray.700" fontFamily="mono" fontSize="xs" mt={2}>Manage subscriptions at dashboard.stripe.com</Text>
        </Box>
      </VStack>
    </Box>
  );
}
