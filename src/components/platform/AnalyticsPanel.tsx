'use client';
// src/components/platform/AnalyticsPanel.tsx
// FST-AN-001E: First-party analytics readout for /platform/ops.
// Aggregate-only. No raw events. No per-user data. No cross-workspace exposure.

import {
  Box, Flex, Text, SimpleGrid, VStack, Divider, Spinner,
  HStack, Badge,
} from '@chakra-ui/react';
import { useState, useEffect, useCallback } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://api.fieldstone.pro';

interface AnalyticsFunnel {
  landing_views:       number;
  signups_started:     number;
  signups_completed:   number;
  login_views:         number;
  login_completions:   number;
  workspaces_created:  number;
}

interface AnalyticsRates {
  landing_to_signup_started:    number | null;
  signup_started_to_completed:  number | null;
  login_view_to_completed:      number | null;
  signup_to_workspace:          number | null;
}

interface AnalyticsSummary {
  ok:           boolean;
  window_days:  number;
  since_date:   string;
  ts:           string;
  page_views: {
    total:      number;
    by_domain:  Record<string, number>;
    by_route:   Record<string, number>;
  };
  cta: {
    total:      number;
    by_label:   Record<string, number>;
  };
  funnel:  AnalyticsFunnel;
  rates:   AnalyticsRates;
  daily_events: Record<string, number>;
  // FST-AN-002: product usage (authenticated workspace surfaces, aggregate only)
  product_usage?: {
    briefs_viewed: number;
    intel_viewed: number;
    tickets_closed_tracked: number;
    active_workspaces_7d: number;
  };
  // FST-AN-003B: workspace-level activation funnel
  activation_funnel?: {
    workspaces_created: number;
    reached_brief:      number;
    reached_intel:      number;
    reached_close:      number;
  };
}

// Reuse Panel pattern from ops/page.tsx
function APanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box bg="gray.900" border="1px solid" borderColor="gray.800" borderRadius="md" overflow="hidden">
      <Flex px={4} py={3} align="center" borderBottom="1px solid" borderColor="gray.800">
        <Text fontSize="xs" fontFamily="mono" fontWeight="black" letterSpacing="widest"
          textTransform="uppercase" color="blue.400">{title}</Text>
      </Flex>
      <Box p={4}>{children}</Box>
    </Box>
  );
}

function AStat({
  label, value, color = 'white', sub,
}: { label: string; value: number | string; color?: string; sub?: string }) {
  return (
    <Box p={3} bg="gray.950" borderRadius="sm" border="1px solid" borderColor="gray.800">
      <Text fontSize="xl" fontWeight="black" color={color} lineHeight={1} mb={1}>{value}</Text>
      <Text fontSize="10px" fontFamily="mono" color="gray.500" textTransform="uppercase"
        letterSpacing="wider">{label}</Text>
      {sub && <Text fontSize="9px" color="gray.600" mt={0.5}>{sub}</Text>}
    </Box>
  );
}

function ConvRate({ label, value }: { label: string; value: number | null | undefined }) {
  if (value == null) return (
    <Box>
      <Text fontSize="10px" color="gray.500" fontFamily="mono" mb={1}>{label}</Text>
      <Text color="gray.600">&#8212;</Text>
    </Box>
  );
  const color = value >= 50 ? 'green.400' : value >= 20 ? 'yellow.400' : 'red.400';
  return (
    <Box>
      <Text fontSize="10px" color="gray.500" fontFamily="mono" mb={1}>{label}</Text>
      <Text fontSize="xl" fontWeight="black" color={color}>{value}%</Text>
    </Box>
  );
}

export function AnalyticsPanel() {
  const [data,    setData]    = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [err,     setErr]     = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`${API}/api/analytics/summary`, { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'fetch_error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  if (loading) return (
    <APanel title="Analytics — 7 Day">
      <Flex justify="center" py={6}><Spinner color="blue.400" size="sm" /></Flex>
    </APanel>
  );

  if (err) return (
    <APanel title="Analytics — 7 Day">
      <Text fontSize="xs" color="red.400" fontFamily="mono">{err}</Text>
    </APanel>
  );

  if (!data) return null;

  const f = data.funnel;
  const r = data.rates;

  return (
    <VStack spacing={4} align="stretch">

      {/* Page Views */}
      <APanel title={`Analytics · ${data.window_days}d · since ${data.since_date}`}>
        <VStack spacing={4} align="stretch">
          <Text fontSize="10px" fontFamily="mono" color="gray.600" textTransform="uppercase">Page Views</Text>
          <SimpleGrid columns={3} gap={2}>
            <AStat label="Total Views" value={data.page_views.total} color="blue.300" />
            <AStat label="CTA Clicks"  value={data.cta.total} />
            <AStat label="Domains"     value={Object.keys(data.page_views.by_domain).length} />
          </SimpleGrid>

          {/* Views by domain */}
          {Object.keys(data.page_views.by_domain).length > 0 && (
            <Box>
              <Text fontSize="10px" fontFamily="mono" color="gray.600" mb={2}
                textTransform="uppercase">By Domain</Text>
              <VStack spacing={1} align="stretch">
                {Object.entries(data.page_views.by_domain)
                  .sort(([, a], [, b]) => b - a)
                  .map(([domain, count]) => (
                    <Flex key={domain} justify="space-between" align="center"
                      px={2} py={1} bg="gray.950" borderRadius="sm">
                      <Text fontSize="xs" fontFamily="mono" color="gray.300">{domain}</Text>
                      <Badge colorScheme="blue" fontSize="10px" fontFamily="mono">{count}</Badge>
                    </Flex>
                  ))}
              </VStack>
            </Box>
          )}

          {/* CTA clicks by label */}
          {Object.keys(data.cta.by_label).length > 0 && (
            <Box>
              <Text fontSize="10px" fontFamily="mono" color="gray.600" mb={2}
                textTransform="uppercase">CTA Clicks</Text>
              <VStack spacing={1} align="stretch">
                {Object.entries(data.cta.by_label)
                  .sort(([, a], [, b]) => b - a)
                  .map(([label, count]) => (
                    <Flex key={label} justify="space-between" align="center"
                      px={2} py={1} bg="gray.950" borderRadius="sm">
                      <Text fontSize="xs" fontFamily="mono" color="gray.300">{label}</Text>
                      <Badge colorScheme="purple" fontSize="10px" fontFamily="mono">{count}</Badge>
                    </Flex>
                  ))}
              </VStack>
            </Box>
          )}
        </VStack>
      </APanel>

      {/* Conversion Funnel */}
      <APanel title="Conversion Funnel">
        <VStack spacing={4} align="stretch">
          <SimpleGrid columns={3} gap={2}>
            <AStat label="Landing Views"     value={f.landing_views}      color="gray.300" />
            <AStat label="Signups Started"   value={f.signups_started}    color="blue.300" />
            <AStat label="Signups Completed" value={f.signups_completed}  color="green.400" />
          </SimpleGrid>
          <SimpleGrid columns={2} gap={2}>
            <AStat label="Login Completions" value={f.login_completions}  color="blue.300" />
            <AStat label="Workspaces Created" value={f.workspaces_created} color="green.400" />
          </SimpleGrid>

          <Divider borderColor="gray.800" />
          <Text fontSize="10px" fontFamily="mono" color="gray.600" textTransform="uppercase">Conversion Rates</Text>
          <SimpleGrid columns={2} gap={3}>
            <ConvRate label="LANDING → SIGNUP STARTED"    value={r.landing_to_signup_started} />
            <ConvRate label="SIGNUP STARTED → COMPLETED"  value={r.signup_started_to_completed} />
            <ConvRate label="LOGIN VIEW → COMPLETED"       value={r.login_view_to_completed} />
            <ConvRate label="SIGNUP → WORKSPACE CREATED"  value={r.signup_to_workspace} />
          </SimpleGrid>
          {/* ── Product Usage (FST-AN-002) ─────────────────── */}
          {data.product_usage && (
            <>
              <Divider borderColor="gray.800" />
              <Text fontSize="10px" fontFamily="mono" color="gray.600" textTransform="uppercase">Product Usage · 7d</Text>
              <SimpleGrid columns={4} gap={2}>
                <AStat label="Briefs Viewed"      value={data.product_usage.briefs_viewed}          color="blue.300" />
                <AStat label="Intel Viewed"       value={data.product_usage.intel_viewed}           color="purple.300" />
                <AStat label="Tickets Closed"     value={data.product_usage.tickets_closed_tracked} color="green.400" />
                <AStat label="Active Workspaces"  value={data.product_usage.active_workspaces_7d}   color="orange.300" />
              </SimpleGrid>
            </>
          )}
          <Text fontSize="9px" color="gray.700" fontFamily="mono">
            aggregate only · no raw events · updated {new Date(data.ts).toLocaleTimeString()}
          </Text>
        </VStack>
      </APanel>

    </VStack>
  );
}
