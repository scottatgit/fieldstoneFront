'use client';
import { Box, VStack, HStack, Text, SimpleGrid, Badge, Spinner, Flex } from '@chakra-ui/react';
import { useEffect, useState } from 'react';

const PM_API = process.env.NEXT_PUBLIC_PM_API_URL || 'http://localhost:8100';

interface PlatformStats {
  total_tenants: number;
  active_tenants: number;
  trial_tenants: number;
  suspended_tenants: number;
  total_tickets: number;
  total_ingestions_today: number;
  ai_calls_today: number;
  open_outbreaks: number;
}

function StatCard({ label, value, color = 'white', sub }: {
  label: string; value: number | string; color?: string; sub?: string;
}) {
  return (
    <Box p={4} bg="gray.900" borderRadius="md" border="1px solid" borderColor="gray.800">
      <Text fontSize="2xl" fontWeight="black" color={color} lineHeight={1} mb={1}>
        {value}
      </Text>
      <Text fontSize="xs" fontFamily="mono" color="gray.500" letterSpacing="wider"
        textTransform="uppercase">{label}</Text>
      {sub && <Text fontSize="10px" color="gray.600" mt={1}>{sub}</Text>}
    </Box>
  );
}

export default function PlatformActivityPage() {
  const [stats, setStats]     = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${PM_API}/api/admin/platform/stats`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setStats(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box p={6} maxW="1200px" mx="auto">
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <HStack justify="space-between" align="start">
          <VStack align="start" spacing={0}>
            <Text fontSize="xl" fontWeight="black" color="white" fontFamily="mono"
              letterSpacing="wider">PLATFORM ACTIVITY</Text>
            <Text fontSize="xs" color="gray.500" fontFamily="mono">
              Signal control plane — cross-tenant visibility
            </Text>
          </VStack>
          <Badge colorScheme="orange" fontSize="xs" fontFamily="mono" px={3} py={1}>
            ⚡ LIVE
          </Badge>
        </HStack>

        {/* Stats grid */}
        {loading ? (
          <Flex justify="center" py={12}><Spinner color="orange.400" size="lg" /></Flex>
        ) : (
          <>
            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3}>
              <StatCard label="Total Tenants"  value={stats?.total_tenants ?? '—'} />
              <StatCard label="Active"         value={stats?.active_tenants ?? '—'} color="green.400" />
              <StatCard label="Trials"         value={stats?.trial_tenants ?? '—'} color="blue.400" />
              <StatCard label="Suspended"      value={stats?.suspended_tenants ?? '—'} color="red.400" />
            </SimpleGrid>
            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3}>
              <StatCard label="Total Tickets"  value={stats?.total_tickets ?? '—'} />
              <StatCard label="Ingested Today" value={stats?.total_ingestions_today ?? '—'} color="blue.300" />
              <StatCard label="AI Calls Today" value={stats?.ai_calls_today ?? '—'} color="purple.300" />
              <StatCard label="Open Outbreaks" value={stats?.open_outbreaks ?? '—'} color="orange.400" />
            </SimpleGrid>
          </>
        )}

        {/* Recent activity placeholder */}
        <Box p={4} bg="gray.900" borderRadius="md" border="1px solid" borderColor="gray.800">
          <Text fontSize="xs" fontFamily="mono" color="gray.500" textTransform="uppercase"
            letterSpacing="wider" mb={3}>Recent System Events</Text>
          <VStack spacing={2} align="stretch">
            {['Ingestion completed — northshore (61 tickets)', 'AI extraction queue cleared',
              'New tenant registered — acmedental', 'Outbreak resolved — Eaglesoft (3 tenants)'
            ].map((event, i) => (
              <HStack key={i} spacing={3}>
                <Box w="6px" h="6px" bg="orange.500" borderRadius="full" flexShrink={0} />
                <Text fontSize="xs" color="gray.400" fontFamily="mono">{event}</Text>
              </HStack>
            ))}
          </VStack>
        </Box>
      </VStack>
    </Box>
  );
}
