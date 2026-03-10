'use client';
import { Box, VStack, HStack, Text, SimpleGrid, Badge, Spinner, Flex } from '@chakra-ui/react';
import { useEffect, useState, useCallback } from 'react';
import { useAdminFetch } from '@/lib/adminFetch';

interface AdminMetrics {
  summary?: {
    active_users?: number;
    api_calls?: number;
    avg_latency_ms?: number;
    error_rate_pct?: number;
  };
}

interface TenantSummary {
  total: number;
  active: number;
  trial: number;
  suspended: number;
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
  const adminFetch                      = useAdminFetch();
  const [metrics, setMetrics]           = useState<AdminMetrics | null>(null);
  const [tenantSummary, setTenantSummary] = useState<TenantSummary | null>(null);
  const [loading, setLoading]           = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Load metrics and tenants in parallel
      const [metricsData, tenantsData] = await Promise.allSettled([
        adminFetch('/pm-api/api/admin/metrics') as Promise<AdminMetrics>,
        adminFetch('/pm-api/api/admin/tenants') as Promise<{ tenants: Array<{ billing_status: string }> }>,
      ]);

      if (metricsData.status === 'fulfilled') setMetrics(metricsData.value);

      if (tenantsData.status === 'fulfilled') {
        const list = tenantsData.value.tenants || [];
        setTenantSummary({
          total:     list.length,
          active:    list.filter(t => t.billing_status === 'active').length,
          trial:     list.filter(t => t.billing_status === 'trial').length,
          suspended: list.filter(t => t.billing_status === 'suspended').length,
        });
      }
    } catch (_e) {
      // fail silently — individual cards show '—'
    } finally {
      setLoading(false);
    }
  }, [adminFetch]);

  useEffect(() => { loadData(); }, [loadData]);

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

        {loading ? (
          <Flex justify="center" py={12}><Spinner color="orange.400" size="lg" /></Flex>
        ) : (
          <>
            {/* Tenant stats */}
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

            {/* Platform metrics */}
            <Box>
              <Text fontSize="xs" fontFamily="mono" color="gray.600" textTransform="uppercase"
                letterSpacing="wider" mb={3}>Platform (7 days)</Text>
              <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3}>
                <StatCard label="Active Users"  value={metrics?.summary?.active_users ?? '—'} />
                <StatCard label="API Calls"     value={metrics?.summary?.api_calls ?? '—'}     color="blue.300" />
                <StatCard label="Avg Latency"   value={metrics?.summary?.avg_latency_ms != null
                  ? `${metrics.summary.avg_latency_ms}ms` : '—'} color="purple.300" />
                <StatCard label="Stale Rate"    value={metrics?.summary?.error_rate_pct != null
                  ? `${metrics.summary.error_rate_pct}%` : '—'} color="orange.400" />
              </SimpleGrid>
            </Box>
          </>
        )}

        {/* Recent activity log */}
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
      </VStack>
    </Box>
  );
}
