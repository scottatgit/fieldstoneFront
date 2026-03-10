'use client';
import { Box, VStack, Text, HStack, Badge, SimpleGrid } from '@chakra-ui/react';

const INTEGRATIONS = [
  { name: 'ConnectWise',   status: 'active',       desc: 'Ticket ingestion via email parser' },
  { name: 'Discord',       status: 'active',       desc: 'Tank/Pilot bot for field technicians' },
  { name: 'Stripe',        status: 'active',       desc: 'Seat-based subscription billing' },
  { name: 'Clerk',         status: 'active',       desc: 'Authentication and user management' },
  { name: 'OpenRouter',    status: 'active',       desc: 'Multi-model AI routing' },
  { name: 'Slack',         status: 'coming_soon',  desc: 'Team notifications and alerts' },
  { name: 'PagerDuty',     status: 'coming_soon',  desc: 'Outbreak and critical alerts' },
  { name: 'Zapier',        status: 'coming_soon',  desc: 'Workflow automation' },
];

const STATUS_COLOR: Record<string, string> = { active: 'green', coming_soon: 'gray', error: 'red' };
const STATUS_LABEL: Record<string, string> = { active: 'ACTIVE', coming_soon: 'COMING SOON', error: 'ERROR' };

export default function PlatformIntegrationsPage() {
  return (
    <Box p={6} maxW="1200px" mx="auto">
      <VStack spacing={6} align="stretch">
        <HStack justify="space-between">
          <VStack align="start" spacing={0}>
            <Text fontSize="xl" fontWeight="black" color="white" fontFamily="mono" letterSpacing="wider">INTEGRATIONS</Text>
            <Text fontSize="xs" color="gray.500" fontFamily="mono">Platform-wide service connections</Text>
          </VStack>
        </HStack>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={3}>
          {INTEGRATIONS.map(i => (
            <Box key={i.name} p={4} bg="gray.900" borderRadius="md"
              border="1px solid" borderColor="gray.800">
              <HStack justify="space-between" mb={2}>
                <Text fontSize="sm" fontWeight="bold" color="white" fontFamily="mono">{i.name}</Text>
                <Badge colorScheme={STATUS_COLOR[i.status]} fontSize="9px" fontFamily="mono">
                  {STATUS_LABEL[i.status]}
                </Badge>
              </HStack>
              <Text fontSize="xs" color="gray.500">{i.desc}</Text>
            </Box>
          ))}
        </SimpleGrid>
      </VStack>
    </Box>
  );
}
