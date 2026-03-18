'use client';
import { useEffect, useState } from 'react';
import {
  Box, Flex, Heading, Text, Badge, Button, Spinner,
  VStack, HStack, Alert, AlertIcon, Card, CardBody,
  SimpleGrid, Stat, StatLabel, StatNumber,
} from '@chakra-ui/react';
import { pmFetch } from '../../../lib/demoApi';

const API = '/pm-api'; // always use relative proxy — hardcoded to avoid localhost fallback on Vercel

interface BillingStatus {
  tenant: string;
  name: string;
  plan: string;
  billing_status: string;
  trial_ends_at: string | null;
  days_remaining: number | null;
  stripe_customer_id: string | null;
  has_subscription: boolean;
  current_seat_count: number;
  billable_seats: number;
  total_active_seats: number;
  stripe_configured: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  trial: 'blue', active: 'green', past_due: 'orange',
  suspended: 'red', demo: 'purple', internal: 'gray',
};

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  } catch { return iso.slice(0, 10); }
}

export default function BillingPage() {
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    pmFetch('/api/billing/status', API)
      .then(b => { if (b) setBilling(b as BillingStatus); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const openPortal = async () => {
    setPortalLoading(true);
    try {
      const data = await pmFetch('/api/billing/portal', API, { method: 'POST' }) as { portal_url?: string };
      if (data?.portal_url) window.location.href = data.portal_url;
    } catch { /* silent */ } finally {
      setPortalLoading(false);
    }
  };

  if (loading) return (
    <Box minH="100vh" bg="gray.950" display="flex" alignItems="center" justifyContent="center">
      <Spinner color="blue.400" size="xl" />
    </Box>
  );

  const statusColor = STATUS_COLORS[billing?.billing_status || 'trial'] || 'gray';
  const isPastDue   = billing?.billing_status === 'past_due';
  const isSuspended = billing?.billing_status === 'suspended';
  const isTrial     = billing?.billing_status === 'trial';

  return (
    <Box minH="100vh" bg="gray.950" color="white">
      <Box maxW="5xl" mx="auto" p={6}>
        <Heading size="md" mb={1} color="white">Billing</Heading>
        <Text color="gray.400" fontSize="sm" mb={6}>
          Manage your Signal subscription and seat usage.
        </Text>

        {isPastDue && (
          <Alert status="error" mb={4} borderRadius="md" bg="red.900" color="red.100">
            <AlertIcon />
            Payment failed. Update your billing to restore full access.
          </Alert>
        )}
        {isSuspended && (
          <Alert status="error" mb={4} borderRadius="md" bg="red.900" color="red.100">
            <AlertIcon />
            This account is suspended. Contact support to restore access.
          </Alert>
        )}
        {isTrial && billing?.days_remaining !== null && (billing?.days_remaining ?? 99) <= 5 && (
          <Alert status="warning" mb={4} borderRadius="md">
            <AlertIcon />
            Trial ends in {billing?.days_remaining} day{billing?.days_remaining === 1 ? '' : 's'}.
          </Alert>
        )}

        <Card bg="gray.900" border="1px solid" borderColor="gray.700" mb={4}>
          <CardBody>
            <Flex justify="space-between" align="flex-start" wrap="wrap" gap={3}>
              <VStack align="start" spacing={1}>
                <HStack>
                  <Heading size="sm" color="white">{billing?.name || 'Your Workspace'}</Heading>
                  <Badge colorScheme={statusColor} fontSize="2xs" textTransform="capitalize">
                    {billing?.billing_status || '—'}
                  </Badge>
                  <Badge colorScheme="teal" variant="outline" fontSize="2xs">
                    {billing?.plan || '—'}
                  </Badge>
                </HStack>
                {isTrial && billing?.trial_ends_at && (
                  <Text color="gray.400" fontSize="sm">
                    Trial ends {fmtDate(billing.trial_ends_at)}
                    {billing.days_remaining !== null && ` (${billing.days_remaining} days remaining)`}
                  </Text>
                )}
                {!isTrial && !billing?.has_subscription && (
                  <Text color="gray.500" fontSize="sm">No active subscription on file.</Text>
                )}
              </VStack>
              {billing?.stripe_configured && billing?.has_subscription && (
                <Button
                  size="sm" colorScheme="blue" variant="outline"
                  onClick={openPortal} isLoading={portalLoading}
                >
                  Manage Billing →
                </Button>
              )}
            </Flex>
          </CardBody>
        </Card>

        <Card bg="gray.900" border="1px solid" borderColor="gray.700" mb={4}>
          <CardBody>
            <Heading size="xs" color="gray.300" mb={4} textTransform="uppercase" letterSpacing="wider">
              Active Seats
            </Heading>
            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
              <Stat>
                <StatLabel color="gray.500" fontSize="xs">Total Active</StatLabel>
                <StatNumber color="white" fontSize="2xl">{billing?.total_active_seats ?? '—'}</StatNumber>
              </Stat>
              <Stat>
                <StatLabel color="gray.500" fontSize="xs">Billable Seats</StatLabel>
                <StatNumber color="blue.300" fontSize="2xl">{billing?.billable_seats ?? '—'}</StatNumber>
              </Stat>
              <Stat>
                <StatLabel color="gray.500" fontSize="xs">Free Seats</StatLabel>
                <StatNumber color="green.300" fontSize="2xl">1</StatNumber>
              </Stat>
              <Stat>
                <StatLabel color="gray.500" fontSize="xs">Synced Count</StatLabel>
                <StatNumber color="gray.400" fontSize="2xl">{billing?.current_seat_count ?? '—'}</StatNumber>
              </Stat>
            </SimpleGrid>
          </CardBody>
        </Card>

        <Card bg="gray.900" border="1px solid" borderColor="gray.700" mb={4}>
          <CardBody>
            <Heading size="xs" color="gray.300" mb={3} textTransform="uppercase" letterSpacing="wider">
              Subscription Details
            </Heading>
            <VStack align="start" spacing={2}>
              <HStack>
                <Text color="gray.500" fontSize="sm" w="48">Stripe Customer</Text>
                <Text fontSize="sm" color={billing?.stripe_customer_id ? 'white' : 'gray.600'}>
                  {billing?.stripe_customer_id || 'not set'}
                </Text>
              </HStack>
              <HStack>
                <Text color="gray.500" fontSize="sm" w="48">Subscription</Text>
                <Text fontSize="sm" color={billing?.has_subscription ? 'green.300' : 'gray.600'}>
                  {billing?.has_subscription ? 'Active' : 'not set'}
                </Text>
              </HStack>
              <HStack>
                <Text color="gray.500" fontSize="sm" w="48">Trial End</Text>
                <Text fontSize="sm" color="white">{fmtDate(billing?.trial_ends_at ?? null)}</Text>
              </HStack>
              <HStack>
                <Text color="gray.500" fontSize="sm" w="48">Stripe Configured</Text>
                <Badge colorScheme={billing?.stripe_configured ? 'green' : 'gray'} fontSize="2xs">
                  {billing?.stripe_configured ? 'Yes' : 'No'}
                </Badge>
              </HStack>
            </VStack>
          </CardBody>
        </Card>
      </Box>
    </Box>
  );
}
