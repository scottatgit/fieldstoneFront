'use client';
import { Box, VStack, Text, HStack, Badge } from '@chakra-ui/react';

export default function PlatformNotificationsPage() {
  return (
    <Box p={6} maxW="1200px" mx="auto">
      <VStack spacing={6} align="stretch">
        <HStack justify="space-between">
          <VStack align="start" spacing={0}>
            <Text fontSize="xl" fontWeight="black" color="white" fontFamily="mono" letterSpacing="wider">NOTIFICATIONS</Text>
            <Text fontSize="xs" color="gray.500" fontFamily="mono">System alerts and platform events</Text>
          </VStack>
          <Badge colorScheme="gray" fontSize="xs" fontFamily="mono" px={3} py={1}>0 UNREAD</Badge>
        </HStack>
        <Box p={8} bg="gray.900" borderRadius="md" border="1px solid" borderColor="gray.800" textAlign="center">
          <Text color="gray.600" fontFamily="mono" fontSize="sm">No new notifications</Text>
          <Text color="gray.700" fontFamily="mono" fontSize="xs" mt={2}>Outbreak alerts, billing events, and ingestion failures will appear here</Text>
        </Box>
      </VStack>
    </Box>
  );
}
