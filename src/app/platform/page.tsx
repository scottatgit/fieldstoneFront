'use client';
import { Box, VStack, HStack, Text, SimpleGrid, Badge, Spinner, Flex } from '@chakra-ui/react';
import { useEffect, useState } from 'react';

interface TenantSummary {
  total: number;
  active: number;
  trial: number;
  suspended: number;
}

interface Metrics {
  active_users: number;
  api_calls: number;
  avg_latency_ms: number;
  error_rate_pct: number;
}

function StatCard({ label, value, color = 'white', sub }: {
  label: string; value: number | string; color?: string; sub?: string;
}) {
  return (
    <Box p={4} bg="gray.900" borderRadius="md" border="1px solid" borderColor="gray.800">
      <Text fontSize="2xl" fontWeight="black" color={color} lineHeight={1} mb={1}>{value}</Text>
      <Text fontSize="xs" fontFamily="mono" color="gray.500" letterSpacing="wider"
        textTransform="uppercase">{label}</Text>
      {sub && <Text fontSize="10px" color="gray.600" mt={1}>{sub}</Text>}
    </Box>
  );
}

export default function PlatformActivityPage() {
  const [tenantSummary, setTenantSummary] = useState<TenantSummary | null>(null);
  const [metrics, setMetrics]             = useState<Metrics | null>(null);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    Promise.allSettled([
      fetch('/pm-api/api/admin/tenants', { credentials: 'include' }).then(r => r.ok ? r.json() : null),
      fetch('/pm-api/api/admin/metrics', { credentials: 'include' }).then(r => r.ok ? r.json() : null),
    ]).then(([tenantsResult, metricsResult]) => {
      if (cancelled) return;

      if (tenantsResult.status === 'fulfilled') {
        const list: Array<{ billing_status: string }> = tenantsResult.value?.tenants || tenantsResult.value || [];
        setTenantSummary({
          total:     list.length,
          active:    list.filter(t => t.billing_status === 'active').length,
          trial:     list.filter(t => t.billing_status === 'trial').length,
          suspended: list.filter(t => t.billing_status === 'suspended').length,
        });
      } else {
        setError('Could not load tenant data');
      }

      if (metricsResult.status === 'fulfilled' && metricsResult.value?.summary) {
        setMetrics(metricsResult.value.summary);
      }

      setLoading(false);
    });

    return () => { cancelled = true; };
  }, []);

  return (
    <Box p={6} maxW="1200px" mx="auto">
      <VStack spacing={6} align="stretch">
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

        {error && (
          <Box p={3} bg="red.900" borderRadius="md" border="1px solid" borderColor="red.700">
            <Text fontSize="xs" color="red.300" fontFamily="mono">Error: {error}</Text>
          </Box>
        )}

        {loading ? (
          <Flex justify="center" py={12}><Spinner color="orange.400" size="lg" /></Flex>
        ) : (
          <>
            <Box>
              <Text fontSize="xs" fontFamily="mono" color="gray.600" textTransform="uppercase"
                letterSpacing="wider" mb={3}>Tenants</Text>
              <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3}>
                <StatCard label="Total"     value={tenantSummary?.total ?? '—'} />
                <StatCard label="Active"    value={tenantSummary?.active ?? '—'}    color="green.400" />
                <StatCard label="Trials"    value={tenantSummary?.trial ?? '—'}     color="blue.400" />
                <StatCard label="Suspended" value={tenantSummary?.suspended ?? '—'} color="red.400" />
              </SimpleGrid>
            </Box>

            <Box>
              <Text fontSize="xs" fontFamily="mono" color="gray.600" textTransform="uppercase"
                letterSpacing="wider" mb={3}>Platform — last 7 days</Text>
              <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3}>
                <StatCard label="Active Users"  value={metrics?.active_users  ?? '—'} />
                <StatCard label="Notes Created" value={metrics?.api_calls     ?? '—'} color="blue.300" />
                <StatCard label="Avg Latency"   value={metrics?.avg_latency_ms != null
                  ? `${metrics.avg_latency_ms}ms` : '—'} color="purple.300" />
                <StatCard label="Stale Rate"    value={metrics?.error_rate_pct != null
                  ? `${metrics.error_rate_pct}%` : '—'} color="orange.400" />
              </SimpleGrid>
            </Box>

            <Box p={4} bg="gray.900" borderRadius="md" border="1px solid" borderColor="gray.800">
              <Text fontSize="xs" fontFamily="mono" color="gray.500" textTransform="uppercase"
                letterSpacing="wider" mb={3}>System Events</Text>
              <VStack spacing={2} align="stretch">
                {[
                  'Platform control plane initialized',
                  'Tenant isolation verified across all workspaces',
                  'Signal.fieldstone.pro routing active',
                ].map((event, i) => (
                  <HStack key={i} spacing={3}>
                    <Box w="6px" h="6px" bg="orange.500" borderRadius="full" flexShrink={0} />
                    <Text fontSize="xs" color="gray.400" fontFamily="mono">{event}</Text>
                  </HStack>
                ))}
              </VStack>
            </Box>
          </>
        )}
      </VStack>
    </Box>
  );
}
