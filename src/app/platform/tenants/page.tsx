'use client';
import {
  Box, VStack, HStack, Text, Badge, Button, Input,
  SimpleGrid, Spinner, Flex, InputGroup, InputLeftElement,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';

const PM_API = process.env.NEXT_PUBLIC_PM_API_URL || 'http://localhost:8100';

interface Tenant {
  tenant_id: string;
  name: string;
  subdomain: string;
  plan: string;
  status: string;
  trial_ends_at: string | null;
  seat_count: number;
  ticket_count: number;
  created_at: string;
}

const STATUS_COLOR: Record<string, string> = {
  active: 'green', trial: 'blue', past_due: 'orange', suspended: 'red',
};

export default function TenantsPage() {
  const [tenants, setTenants]   = useState<Tenant[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');

  useEffect(() => {
    fetch(`${PM_API}/api/admin/tenants`)
      .then(r => r.ok ? r.json() : { tenants: [] })
      .then(d => setTenants(d.tenants || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = tenants.filter(t =>
    t.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.subdomain?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box p={6} maxW="1200px" mx="auto">
      <VStack spacing={6} align="stretch">
        <HStack justify="space-between">
          <VStack align="start" spacing={0}>
            <Text fontSize="xl" fontWeight="black" color="white" fontFamily="mono"
              letterSpacing="wider">TENANTS</Text>
            <Text fontSize="xs" color="gray.500" fontFamily="mono">
              {tenants.length} workspaces registered
            </Text>
          </VStack>
        </HStack>

        {/* Search */}
        <InputGroup size="sm" maxW="320px">
          <InputLeftElement pointerEvents="none">
            <Text fontSize="xs" color="gray.600">🔍</Text>
          </InputLeftElement>
          <Input
            pl={8} bg="gray.900" borderColor="gray.700" color="white"
            placeholder="Search tenants..."
            value={search} onChange={e => setSearch(e.target.value)}
            _placeholder={{ color: 'gray.600' }}
            _focus={{ borderColor: 'orange.500', boxShadow: 'none' }}
          />
        </InputGroup>

        {loading ? (
          <Flex justify="center" py={12}><Spinner color="orange.400" size="lg" /></Flex>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={3}>
            {filtered.map(tenant => (
              <Box key={tenant.tenant_id} p={4} bg="gray.900" borderRadius="md"
                border="1px solid" borderColor="gray.800"
                _hover={{ borderColor: 'orange.700' }} transition="border-color 0.15s">
                <VStack spacing={3} align="stretch">
                  <HStack justify="space-between">
                    <VStack spacing={0} align="start">
                      <Text fontSize="sm" fontWeight="bold" color="white" fontFamily="mono">
                        {tenant.name || tenant.tenant_id}
                      </Text>
                      <Text fontSize="xs" color="gray.500" fontFamily="mono">
                        {tenant.subdomain}.fieldstone.pro
                      </Text>
                    </VStack>
                    <Badge colorScheme={STATUS_COLOR[tenant.status] || 'gray'}
                      fontSize="9px" fontFamily="mono">
                      {(tenant.status || 'unknown').toUpperCase()}
                    </Badge>
                  </HStack>

                  <SimpleGrid columns={3} spacing={2}>
                    <VStack spacing={0} align="start">
                      <Text fontSize="sm" fontWeight="bold" color="white">
                        {tenant.seat_count ?? '—'}
                      </Text>
                      <Text fontSize="9px" color="gray.600" fontFamily="mono">SEATS</Text>
                    </VStack>
                    <VStack spacing={0} align="start">
                      <Text fontSize="sm" fontWeight="bold" color="white">
                        {tenant.ticket_count ?? '—'}
                      </Text>
                      <Text fontSize="9px" color="gray.600" fontFamily="mono">TICKETS</Text>
                    </VStack>
                    <VStack spacing={0} align="start">
                      <Text fontSize="xs" fontWeight="bold" color="white">
                        {tenant.plan || 'starter'}
                      </Text>
                      <Text fontSize="9px" color="gray.600" fontFamily="mono">PLAN</Text>
                    </VStack>
                  </SimpleGrid>

                  <HStack spacing={2}>
                    <Button size="xs" colorScheme="orange" variant="outline"
                      fontFamily="mono" fontSize="9px" letterSpacing="wider"
                      as="a" href={`https://${tenant.subdomain}.fieldstone.pro/pm`}
                      target="_blank">
                      OPEN WORKSPACE
                    </Button>
                    <Button size="xs" variant="ghost" color="gray.500"
                      fontFamily="mono" fontSize="9px"
                      as="a" href={`/platform/tenants/${tenant.tenant_id}`}>
                      DETAILS
                    </Button>
                  </HStack>
                </VStack>
              </Box>
            ))}
          </SimpleGrid>
        )}

        {!loading && filtered.length === 0 && (
          <Box p={8} textAlign="center">
            <Text color="gray.600" fontFamily="mono" fontSize="sm">
              {search ? 'No tenants match your search' : 'No tenants registered yet'}
            </Text>
          </Box>
        )}
      </VStack>
    </Box>
  );
}
