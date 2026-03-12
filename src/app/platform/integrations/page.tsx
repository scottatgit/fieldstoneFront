/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';
import { useEffect, useState } from 'react';
import {
  Box, VStack, Text, HStack, Badge, SimpleGrid,
  Spinner, Divider, Code,
} from '@chakra-ui/react';


interface BillingBucket { count: number; seats: number; }
interface StripeStatus {
  configured: boolean;
  mode: 'live' | 'test' | 'unknown';
  webhook_configured: boolean;
  webhook_url: string;
  price_configured: boolean;
  billing_summary: Record<string, BillingBucket>;
  recent_events: { type: string; at: string }[];
}

const STATUS_COLOR: Record<string, string> = { active: 'green', coming_soon: 'gray', error: 'red' };
const STATUS_LABEL: Record<string, string> = { active: 'ACTIVE', coming_soon: 'COMING SOON', error: 'ERROR' };

const STATIC_INTEGRATIONS = [
  { name: 'ConnectWise',  status: 'active',      desc: 'Ticket ingestion via IMAP email parser' },
  { name: 'Discord',      status: 'active',      desc: 'Pilot bot for field technicians' },
  { name: 'OpenRouter',   status: 'active',      desc: 'Multi-model AI routing (GPT-4o, Claude)' },
  { name: 'Slack',        status: 'coming_soon', desc: 'Team notifications and alerts' },
  { name: 'PagerDuty',    status: 'coming_soon', desc: 'Outbreak and critical alerts' },
  { name: 'Zapier',       status: 'coming_soon', desc: 'Workflow automation' },
];

function StatBox({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <Box p={3} bg="gray.800" borderRadius="md" border="1px solid" borderColor="gray.700" flex="1">
      <Text fontSize="9px" color="gray.500" fontFamily="mono" letterSpacing="wider" mb={1}>{label}</Text>
      <Text fontSize="xl" fontWeight="black" color="white" fontFamily="mono">{value}</Text>
      {sub && <Text fontSize="9px" color="gray.600" fontFamily="mono">{sub}</Text>}
    </Box>
  );
}

function CheckRow({ label, ok, detail }: { label: string; ok: boolean; detail?: string }) {
  return (
    <HStack justify="space-between" py={1}>
      <Text fontSize="xs" color="gray.400" fontFamily="mono">{label}</Text>
      <HStack spacing={2}>
        {detail && <Text fontSize="9px" color="gray.600" fontFamily="mono">{detail}</Text>}
        <Badge colorScheme={ok ? 'green' : 'red'} fontSize="9px" fontFamily="mono">
          {ok ? 'OK' : 'MISSING'}
        </Badge>
      </HStack>
    </HStack>
  );
}

export default function PlatformIntegrationsPage() {
  const [stripe, setStripe] = useState<StripeStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/pm-api/api/admin/stripe/status', { credentials: 'include' })
      .then(r => r.json())
      .then(setStripe)
      .catch(() => setError('Could not load Stripe status'))
      .finally(() => setLoading(false));
  }, []);

  const totalTenants = stripe
    ? Object.values(stripe.billing_summary).reduce((a, v) => a + v.count, 0) : 0;
  const totalSeats = stripe
    ? Object.values(stripe.billing_summary).reduce((a, v) => a + v.seats, 0) : 0;

  return (
    <Box p={6} maxW="1200px" mx="auto">
      <VStack spacing={6} align="stretch">
        <HStack justify="space-between">
          <VStack align="start" spacing={0}>
            <Text fontSize="xl" fontWeight="black" color="white" fontFamily="mono" letterSpacing="wider">INTEGRATIONS</Text>
            <Text fontSize="xs" color="gray.500" fontFamily="mono">Platform-wide service connections</Text>
          </VStack>
        </HStack>

        {/* Stripe Section */}
        <Box p={5} bg="gray.900" borderRadius="lg" border="1px solid" borderColor="purple.800">
          <HStack justify="space-between" mb={4}>
            <HStack spacing={3}>
              <Text fontSize="sm" fontWeight="bold" color="white" fontFamily="mono">STRIPE</Text>
              {loading ? (
                <Spinner size="xs" color="purple.400" />
              ) : stripe ? (
                <Badge
                  colorScheme={stripe.configured ? (stripe.mode === 'live' ? 'green' : 'yellow') : 'red'}
                  fontSize="9px" fontFamily="mono"
                >
                  {stripe.configured ? (stripe.mode === 'live' ? 'LIVE' : 'TEST MODE') : 'NOT CONFIGURED'}
                </Badge>
              ) : (
                <Badge colorScheme="red" fontSize="9px">ERROR</Badge>
              )}
            </HStack>
            <Text
              fontSize="xs" color="purple.400" fontFamily="mono" cursor="pointer"
              onClick={() => window.open('https://dashboard.stripe.com', '_blank')}
              _hover={{ color: 'purple.300' }}
            >
              OPEN STRIPE DASHBOARD &rarr;
            </Text>
          </HStack>
          {error && <Text fontSize="xs" color="red.400" fontFamily="mono">{error}</Text>}
          {stripe && (
            <VStack spacing={4} align="stretch">
              <HStack spacing={3}>
                <StatBox label="ACTIVE TENANTS" value={stripe.billing_summary['active']?.count ?? 0} sub={`${stripe.billing_summary['active']?.seats ?? 0} seats`} />
                <StatBox label="IN TRIAL" value={stripe.billing_summary['trial']?.count ?? 0} sub={`${stripe.billing_summary['trial']?.seats ?? 0} seats`} />
                <StatBox label="SUSPENDED" value={stripe.billing_summary['suspended']?.count ?? 0} />
                <StatBox label="TOTAL SEATS" value={totalSeats} sub={`across ${totalTenants} tenants`} />
              </HStack>
              <Divider borderColor="gray.800" />
              <VStack spacing={0} align="stretch">
                <Text fontSize="9px" color="gray.600" fontFamily="mono" letterSpacing="wider" mb={2}>CONFIGURATION</Text>
                <CheckRow label="API Key (STRIPE_SECRET_KEY)" ok={stripe.configured} detail={stripe.mode !== 'unknown' ? stripe.mode.toUpperCase() : undefined} />
                <CheckRow label="Webhook Secret (STRIPE_WEBHOOK_SECRET)" ok={stripe.webhook_configured} />
                <CheckRow label="Price ID (STRIPE_PRICE_STARTER)" ok={stripe.price_configured} />
              </VStack>
              <Divider borderColor="gray.800" />
              <VStack align="stretch" spacing={1}>
                <Text fontSize="9px" color="gray.600" fontFamily="mono" letterSpacing="wider">WEBHOOK ENDPOINT — register in Stripe Dashboard</Text>
                <Code fontSize="xs" p={2} bg="gray.800" color="purple.300" borderRadius="md" fontFamily="mono" wordBreak="break-all">{stripe.webhook_url}</Code>
              </VStack>
              {stripe.recent_events.length > 0 && (
                <>
                  <Divider borderColor="gray.800" />
                  <VStack align="stretch" spacing={1}>
                    <Text fontSize="9px" color="gray.600" fontFamily="mono" letterSpacing="wider">RECENT BILLING EVENTS</Text>
                    {stripe.recent_events.map((e, i) => (
                      <HStack key={i} justify="space-between" py={1}>
                        <Text fontSize="xs" color="gray.300" fontFamily="mono">{e.type}</Text>
                        <Text fontSize="9px" color="gray.600" fontFamily="mono">{new Date(e.at).toLocaleString()}</Text>
                      </HStack>
                    ))}
                  </VStack>
                </>
              )}
            </VStack>
          )}
        </Box>

        <Text fontSize="9px" color="gray.600" fontFamily="mono" letterSpacing="wider">OTHER INTEGRATIONS</Text>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={3}>
          {STATIC_INTEGRATIONS.map(i => (
            <Box key={i.name} p={4} bg="gray.900" borderRadius="md" border="1px solid" borderColor="gray.800">
              <HStack justify="space-between" mb={2}>
                <Text fontSize="sm" fontWeight="bold" color="white" fontFamily="mono">{i.name}</Text>
                <Badge colorScheme={STATUS_COLOR[i.status]} fontSize="9px" fontFamily="mono">{STATUS_LABEL[i.status]}</Badge>
              </HStack>
              <Text fontSize="xs" color="gray.500">{i.desc}</Text>
            </Box>
          ))}
        </SimpleGrid>
      </VStack>
    </Box>
  );
}
