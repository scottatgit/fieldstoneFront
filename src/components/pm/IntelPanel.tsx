'use client';
import {
  Box, Flex, HStack, VStack, Text, Badge, Button,
  Progress, Spinner, Divider,
} from '@chakra-ui/react';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_PM_API_URL || 'http://localhost:8100';

interface OutbreakEvent {
  tool_id: string;
  status: string;
  classification?: string;
  affected_clients?: unknown[];
  at_risk_clients?: unknown[];
  first_seen?: string;
}

interface ToolRow {
  id: string;
  name?: string;
  vendor?: string;
  risk_score?: number;
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
  const [events, setEvents]   = useState<OutbreakEvent[]>([]);
  const [tools, setTools]     = useState<ToolRow[]>([]);
  const [lastRun, setLastRun] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [evRes, trRes] = await Promise.allSettled([
        fetch(`${API}/api/intel/outbreaks`).then(r => r.json()),
        fetch(`${API}/api/nodes/tools`).then(r => r.json()),
      ]);
      if (evRes.status === 'fulfilled') setEvents(evRes.value?.events ?? []);
      if (trRes.status === 'fulfilled') {
        const sorted = [...(trRes.value?.tools ?? [])].sort(
          (a: ToolRow, b: ToolRow) => (b.risk_score ?? 0) - (a.risk_score ?? 0)
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
    try { await fetch(`${API}/api/intel/run`, { method: 'POST' }); await fetchAll(); }
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

        {/* Center: top 5 tool risk mini-bars */}
        <HStack spacing={4} display={{ base: 'none', lg: 'flex' }}>
          {top5.map(t => (
            <VStack key={t.id} spacing={0} align="center" minW="48px">
              <Progress
                value={t.risk_score ?? 0}
                colorScheme={(
                  (t.risk_score ?? 0) >= 70 ? 'red' :
                  (t.risk_score ?? 0) >= 40 ? 'orange' : 'green'
                )}
                size="xs" w="48px" borderRadius="full"
              />
              <Text fontSize="0.6em" color="gray.500" mt={0.5}>
                {(t.name ?? t.id).slice(0, 9)}
              </Text>
            </VStack>
          ))}
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
