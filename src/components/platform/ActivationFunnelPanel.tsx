'use client';
// src/components/platform/ActivationFunnelPanel.tsx
// FST-AN-003B/C: Workspace-level activation funnel readout.
// Shows how many workspaces reached each stage of Signal's core value loop:
//   workspace_created → brief_viewed → intel_viewed → ticket_closed
//
// Privacy: aggregate-only. No per-workspace rows. No per-user data.
// Source: GET /api/analytics/summary (admin-authenticated, existing endpoint).
// Rollback: remove <ActivationFunnelPanel /> from ops/page.tsx — zero cascade.

import {
  Box, Flex, Text, VStack, HStack, Spinner, SimpleGrid,
} from '@chakra-ui/react';
import { useState, useEffect, useCallback } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://api.fieldstone.pro';

interface ActivationFunnel {
  workspaces_created: number;
  reached_brief:      number;
  reached_intel:      number;
  reached_close:      number;
}

interface SummaryWithActivation {
  ok:                boolean;
  window_days:       number;
  since_date:        string;
  ts:                string;
  activation_funnel: ActivationFunnel;
}

function safe_pct(num: number, den: number): string {
  if (!den) return '—';
  return `${Math.round((num / den) * 100)}%`;
}

function FunnelStage({
  step, label, sublabel, count, dropoff, isLast,
}: {
  step:     string;
  label:    string;
  sublabel: string;
  count:    number;
  dropoff:  string | null;
  isLast:   boolean;
}) {
  return (
    <VStack spacing={0} align="stretch">
      <Box
        px={4} py={3}
        bg="gray.950"
        border="1px solid"
        borderColor={count > 0 ? 'blue.800' : 'gray.800'}
        borderRadius="md"
      >
        <Flex justify="space-between" align="center">
          <HStack spacing={3}>
            <Text
              fontSize="9px"
              fontFamily="mono"
              color="gray.600"
              textTransform="uppercase"
              letterSpacing="widest"
              minW="14px"
            >
              {step}
            </Text>
            <VStack spacing={0} align="start">
              <Text fontSize="xs" fontFamily="mono" color={count > 0 ? 'gray.200' : 'gray.600'}>
                {label}
              </Text>
              <Text fontSize="10px" color="gray.600">{sublabel}</Text>
            </VStack>
          </HStack>
          <Text
            fontSize="2xl"
            fontWeight="black"
            fontFamily="mono"
            color={count > 0 ? 'blue.300' : 'gray.700'}
            lineHeight={1}
          >
            {count}
          </Text>
        </Flex>
      </Box>

      {!isLast && (
        <Flex direction="column" align="center" py={1}>
          <Box w="1px" h={3} bg="gray.700" />
          {dropoff !== null && (
            <Text fontSize="9px" fontFamily="mono" color="gray.600">
              {dropoff} reached next
            </Text>
          )}
          <Box w="1px" h={3} bg="gray.700" />
        </Flex>
      )}
    </VStack>
  );
}

export function ActivationFunnelPanel() {
  const [data, setData]       = useState<ActivationFunnel | null>(null);
  const [meta, setMeta]       = useState<{ window_days: number; since_date: string; ts: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr]         = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`${API}/api/analytics/summary`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const json = await res.json() as SummaryWithActivation;
      if (!json.activation_funnel) throw new Error('activation_funnel missing from summary');
      setData(json.activation_funnel);
      setMeta({ window_days: json.window_days, since_date: json.since_date, ts: json.ts });
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'load_error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const title = meta
    ? `Activation Funnel · ${meta.window_days}d · since ${meta.since_date}`
    : 'Activation Funnel';

  return (
    <Box
      bg="gray.900"
      border="1px solid"
      borderColor="gray.800"
      borderRadius="md"
      overflow="hidden"
    >
      {/* Panel header */}
      <Flex
        px={4} py={3}
        align="center"
        justify="space-between"
        borderBottom="1px solid"
        borderColor="gray.800"
      >
        <Text
          fontSize="xs"
          fontFamily="mono"
          fontWeight="black"
          letterSpacing="widest"
          textTransform="uppercase"
          color="blue.400"
        >
          {title}
        </Text>
      </Flex>

      <Box p={4}>
        {loading && (
          <Flex justify="center" py={6}>
            <Spinner color="blue.400" size="sm" />
          </Flex>
        )}

        {err && !loading && (
          <Text fontSize="xs" color="red.400" fontFamily="mono">{err}</Text>
        )}

        {data && !loading && (
          <VStack spacing={0} align="stretch">

            {/* Summary stats */}
            <SimpleGrid columns={4} gap={2} mb={4}>
              <Box px={2} py={2} bg="gray.950" borderRadius="sm" textAlign="center">
                <Text fontSize="lg" fontWeight="black" fontFamily="mono"
                  color={data.workspaces_created > 0 ? 'blue.300' : 'gray.700'}>
                  {data.workspaces_created}
                </Text>
                <Text fontSize="9px" fontFamily="mono" color="gray.600"
                  textTransform="uppercase">Created</Text>
              </Box>
              <Box px={2} py={2} bg="gray.950" borderRadius="sm" textAlign="center">
                <Text fontSize="lg" fontWeight="black" fontFamily="mono"
                  color={data.reached_brief > 0 ? 'blue.300' : 'gray.700'}>
                  {data.reached_brief}
                </Text>
                <Text fontSize="9px" fontFamily="mono" color="gray.600"
                  textTransform="uppercase">Brief</Text>
              </Box>
              <Box px={2} py={2} bg="gray.950" borderRadius="sm" textAlign="center">
                <Text fontSize="lg" fontWeight="black" fontFamily="mono"
                  color={data.reached_intel > 0 ? 'purple.300' : 'gray.700'}>
                  {data.reached_intel}
                </Text>
                <Text fontSize="9px" fontFamily="mono" color="gray.600"
                  textTransform="uppercase">Intel</Text>
              </Box>
              <Box px={2} py={2} bg="gray.950" borderRadius="sm" textAlign="center">
                <Text fontSize="lg" fontWeight="black" fontFamily="mono"
                  color={data.reached_close > 0 ? 'green.400' : 'gray.700'}>
                  {data.reached_close}
                </Text>
                <Text fontSize="9px" fontFamily="mono" color="gray.600"
                  textTransform="uppercase">Closed</Text>
              </Box>
            </SimpleGrid>

            {/* Stage-by-stage funnel */}
            <FunnelStage
              step="1"
              label="workspace_created"
              sublabel="workspace provisioned"
              count={data.workspaces_created}
              dropoff={safe_pct(data.reached_brief, data.workspaces_created)}
              isLast={false}
            />
            <FunnelStage
              step="2"
              label="brief_viewed"
              sublabel="opened dispatch brief"
              count={data.reached_brief}
              dropoff={safe_pct(data.reached_intel, data.reached_brief)}
              isLast={false}
            />
            <FunnelStage
              step="3"
              label="intel_viewed"
              sublabel="opened intelligence panel"
              count={data.reached_intel}
              dropoff={safe_pct(data.reached_close, data.reached_intel)}
              isLast={false}
            />
            <FunnelStage
              step="4"
              label="ticket_closed"
              sublabel="completed first closure"
              count={data.reached_close}
              dropoff={null}
              isLast={true}
            />

            <Text fontSize="9px" color="gray.700" fontFamily="mono" mt={3}>
              workspace-distinct counts · aggregate only · no raw events
              {meta && ` · ${new Date(meta.ts).toLocaleTimeString()}`}
            </Text>
          </VStack>
        )}
      </Box>
    </Box>
  );
}
