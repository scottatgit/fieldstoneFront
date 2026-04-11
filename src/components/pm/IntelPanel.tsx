'use client';
import {
  Box, Flex, HStack, VStack, Text, Badge, Button,
  Progress, Spinner, Divider,
} from '@chakra-ui/react';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { pmFetch } from '@/lib/demoApi';
import { track } from '@/lib/analytics';
import { useUser } from '@/lib/useUser';

const API = process.env.NEXT_PUBLIC_PM_API_URL || 'http://localhost:8100';

interface OutbreakEvent {
  tool_id: string;
  status: string;
  classification?: string;
  affected_clients?: unknown[];
  at_risk_clients?: unknown[];
  first_seen?: string;
}

// S6: risk_score is now a rich object from the backend
interface RiskScore {
  tool_id: string;
  score: number;
  ticket_count: number;
  client_count: number;
  past_events: number;
  breakdown: {
    active_tickets_pts: number;
    unique_clients_pts: number;
    recurrence_pts: number;
  };
  window_hours: number;
}

interface ToolRow {
  id: string;
  name?: string;
  vendor?: string;
  risk_score?: RiskScore;   // S6: object, not number
}

function cn(c: unknown): string {
  if (typeof c === 'string') return c;
  if (c && typeof c === 'object') {
    const o = c as Record<string, unknown>;
    return String(o.name ?? o.id ?? '?');
  }
  return String(c);
}

export default function IntelPanel() {
  // FST-AN-002: workspace context for product analytics
  const { user } = useUser();

  // FST-AN-002: fire intel_viewed once on mount
  useEffect(() => {
    track('intel_viewed', { workspace_id: user?.tenant_id ?? undefined });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty — fire once on mount only

  const [events, setEvents]   = useState<OutbreakEvent[]>([]);
  const [tools, setTools]     = useState<ToolRow[]>([]);
  const [lastRun, setLastRun] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [evRes, trRes] = await Promise.allSettled([
        pmFetch('/api/intel/outbreaks', API),
        pmFetch('/api/nodes/tools',     API),
      ]);
      if (evRes.status === 'fulfilled') setEvents((evRes.value as any)?.events ?? []);
      if (trRes.status === 'fulfilled') {
        // S6: risk_score is now a RiskScore object — sort by .score
        const sorted = [...((trRes.value as any)?.tools ?? [])].sort(
          (a: ToolRow, b: ToolRow) =>
            (b.risk_score?.score ?? 0) - (a.risk_score?.score ?? 0)
        );
        setTools(sorted);
      }
      setLastRun(new Date().toLocaleTimeString());
    } catch (_) {/* silent */}
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchAll();
    const id = setInterval(fetchAll, 60_000);
    return () => clearInterval(id);
  }, [fetchAll]);

  const runNow = async () => {
    setRunning(true);
    try { await pmFetch('/api/intel/run', API); await fetchAll(); }
    catch (_) {/* silent */} finally { setRunning(false); }
  };

  const active   = events.filter(e => e.status === 'active');
  const atRiskAll = Array.from(
    new Set(active.flatMap(e => (e.at_risk_clients ?? []).map(cn)))
  );
  const top5 = tools.slice(0, 5);

  if (loading) return (
    <Flex px={4} py={3} bg="gray.900" align="center" gap={2}>
      <Spinner size="xs" color="blue.400" />
      <Text fontSize="xs" color="gray.500">Loading intel...</Text>
    </Flex>
  );

  return (
    <Box
      bg="gray.900"
      borderBottom="1px solid"
      borderColor={active.length > 0 ? 'red.700' : 'gray.700'}
      px={4} py={3}
    >
      <Flex align="center" justify="space-between" wrap="wrap" gap={3}>

        {/* Left: outbreak / at-risk badges */}
        <HStack spacing={3} flexWrap="wrap">
          <Text fontSize="xs" color="gray.400" fontWeight="semibold">🧠 INTEL</Text>
          <Divider orientation="vertical" h="16px" borderColor="gray.700" />

          {active.length === 0 ? (
            <Badge colorScheme="green" fontSize="0.7em" px={2}>✅ No Outbreaks</Badge>
          ) : (
            active.map((e, i) => (
              <Badge key={i} colorScheme="red" fontSize="0.7em" px={2}>
                🚨 {e.tool_id?.toUpperCase()} —{' '}
                {(e.affected_clients ?? []).length} affected
                {e.classification ? ` · ${e.classification}` : ''}
              </Badge>
            ))
          )}

          {atRiskAll.length > 0 && (
            <Badge colorScheme="orange" fontSize="0.7em" px={2}>
              ⚠️ {atRiskAll.length} at risk
            </Badge>
          )}
        </HStack>

        {/* Center: top 5 tool risk mini-bars — S6: use .score from object */}
        <HStack spacing={4} display={{ base: 'none', lg: 'flex' }}>
          {top5.map(t => {
            const sc = t.risk_score?.score ?? 0;
            return (
              <VStack key={t.id} spacing={0} align="center" minW="48px">
                <Progress
                  value={sc}
                  colorScheme={sc >= 70 ? 'red' : sc >= 40 ? 'orange' : 'green'}
                  size="xs" w="48px" borderRadius="full"
                />
                <Text fontSize="0.6em" color="gray.500" mt={0.5}>
                  {(t.name ?? t.id).slice(0, 9)}
                </Text>
              </VStack>
            );
          })}
        </HStack>

        {/* Right: last run + buttons */}
        <HStack spacing={2}>
          {lastRun && (
            <Text fontSize="0.65em" color="gray.600">updated {lastRun}</Text>
          )}
          <Button
            size="xs" colorScheme="blue" variant="outline"
            onClick={runNow} isLoading={running} loadingText="…"
          >
            ⚡ Run
          </Button>
          <Link href="/pm/intel">
            <Button size="xs" colorScheme="gray" variant="ghost">
              🧠 Intel →
            </Button>
          </Link>
        </HStack>

      </Flex>
    </Box>
  );
}
