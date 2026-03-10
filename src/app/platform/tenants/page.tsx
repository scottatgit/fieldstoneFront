'use client';
import {
  Box, VStack, HStack, Text, Badge, Button, Input,
  SimpleGrid, Spinner, Flex, InputGroup, InputLeftElement,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';

interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  plan: string;
  billing_status: string;
  trial_ends_at: string | null;
  created_at: string;
  stripe_customer_id: string | null;
  current_seat_count: number;
}

const STATUS_COLOR: Record<string, string> = {
  active: 'green', trial: 'blue', past_due: 'orange',
  suspended: 'red', internal: 'purple', demo: 'gray',
};

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [tick, setTick]     = useState(0); // manual refresh trigger

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch('/pm-api/api/tenants')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        return res.json();
      })
      .then((data: { tenants: Tenant[] }) => {
        if (!cancelled) setTenants(data.tenants || []);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [tick]);

  const filtered = tenants.filter(t =>
    (t.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (t.subdomain || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box p={6} maxW="1200px" mx="auto">
      <VStack spacing={6} align="stretch">
        <HStack justify="space-between">
          <VStack align="start" spacing={0}>
            <Text fontSize="xl" fontWeight="black" color="white"
              fontFamily="mono" letterSpacing="wider">TENANTS</Text>
            <Text fontSize="xs" color="gray.500" fontFamily="mono">
              {loading ? '...' : `${tenants.length} workspace${tenants.length !== 1 ? 's' : ''} registered`}
            </Text>
          </VStack>
          <Button size="sm" colorScheme="orange" variant="outline"
            fontFamily="mono" fontSize="xs"
            onClick={() => setTick(t => t + 1)} isLoading={loading}>
            REFRESH
          </Button>
        </HStack>

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

        {error && (
          <Box p={3} bg="red.900" borderRadius="md" border="1px solid" borderColor="red.700">
            <Text fontSize="xs" color="red.300" fontFamily="mono">Error: {error}</Text>
          </Box>
        )}

        {loading ? (
          <Flex justify="center" py={12}>
            <Spinner color="orange.400" size="lg" />
          </Flex>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={3}>
            {filtered.map(tenant => (
              <Box key={tenant.id} p={4} bg="gray.900" borderRadius="md"
                border="1px solid" borderColor="gray.800"
                _hover={{ borderColor: 'orange.700' }} transition="border-color 0.15s">
                <VStack spacing={3} align="stretch">
                  <HStack justify="space-between">
                    <VStack spacing={0} align="start">
                      <Text fontSize="sm" fontWeight="bold" color="white" fontFamily="mono">
                        {tenant.name || tenant.id}
                      </Text>
                      <Text fontSize="xs" color="gray.500" fontFamily="mono">
                        {tenant.subdomain}.signal.fieldstone.pro
                      </Text>
                    </VStack>
                    <Badge
                      colorScheme={STATUS_COLOR[tenant.billing_status] || 'gray'}
                      fontSize="9px" fontFamily="mono">
                      {(tenant.billing_status || 'unknown').toUpperCase()}
                    </Badge>
                  </HStack>

                  <SimpleGrid columns={3} spacing={2}>
                    <VStack spacing={0} align="start">
                      <Text fontSize="xs" fontWeight="bold" color="white">
                        {tenant.plan || 'starter'}
                      </Text>
                      <Text fontSize="9px" color="gray.600" fontFamily="mono">PLAN</Text>
                    </VStack>
                    <VStack spacing={0} align="start">
                      <Text fontSize="xs" fontWeight="bold" color="white">
                        {tenant.current_seat_count ?? 0}
                      </Text>
                      <Text fontSize="9px" color="gray.600" fontFamily="mono">SEATS</Text>
                    </VStack>
                    <VStack spacing={0} align="start">
                      <Text fontSize="xs" fontWeight="bold"
                        color={tenant.stripe_customer_id ? 'green.400' : 'gray.600'}>
                        {tenant.stripe_customer_id ? '✓' : '—'}
                      </Text>
                      <Text fontSize="9px" color="gray.600" fontFamily="mono">STRIPE</Text>
                    </VStack>
                  </SimpleGrid>

                  <Button size="xs" colorScheme="orange" variant="outline"
                    fontFamily="mono" fontSize="9px" letterSpacing="wider"
                    as="a"
                    href={`https://${tenant.subdomain}.signal.fieldstone.pro/pm`}
                    target="_blank">
                    OPEN WORKSPACE ↗
                  </Button>
                </VStack>
              </Box>
            ))}
          </SimpleGrid>
        )}

        {!loading && !error && filtered.length === 0 && (
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
