'use client';

import { useEffect, useState } from 'react';
import {
  Box, Flex, Grid, Heading, Spinner, Text, VStack,
  Badge, HStack, Divider,
} from '@chakra-ui/react';
import { SummaryBar } from '../../../../components/pm/SummaryBar';
import type { Summary } from '../../../../components/pm/types';

// ── Types ─────────────────────────────────────────────────────────────────────

interface CloseRow {
  ticket_key: string;
  closed_at: string | null;
  outcome_type: string | null;
  intel_extract_result: string | null;
}

interface SignalRow {
  ticket_key: string;
  latest_status: string | null;
  escalation_flag: boolean;
  sentiment: string | null;
  extracted_at: string | null;
}

interface AttentionItem {
  severity: 'warning' | 'info';
  message: string;
}

interface CloseIntel {
  total_closes: number;
  intel_generated: number;
  intel_failed: number;
  intel_skipped: number;
  intel_pre_fst053: number;
  last_close_at: string | null;
  last_result: string | null;
  recent_closes: CloseRow[];
}

interface DiscussionSignals {
  total_extracted: number;
  escalation_count: number;
  last_extracted_at: string | null;
  recent: SignalRow[];
}

interface SignalStatus {
  workspace_id: string;
  generated_at: string;
  close_intel: CloseIntel;
  discussion_signals: DiscussionSignals;
  attention: AttentionItem[];
}

// ── Constants ─────────────────────────────────────────────────────────────────
const PM_API = '/pm-api';

// ── Helpers ───────────────────────────────────────────────────────────────────

function resultBadge(result: string | null) {
  if (!result) return <Badge colorScheme="gray" fontSize="xs" fontFamily="mono">pre-v053</Badge>;
  const scheme: Record<string, string> = {
    generated: 'green',
    failed:    'red',
    duplicate: 'yellow',
    skipped:   'gray',
  };
  return (
    <Badge colorScheme={scheme[result] ?? 'gray'} fontSize="xs" fontFamily="mono">
      {result}
    </Badge>
  );
}

function overallHealth(data: SignalStatus): { label: string; color: string } {
  if (data.close_intel.intel_failed > 0 || data.discussion_signals.escalation_count > 0) {
    return { label: 'NEEDS ATTENTION', color: 'yellow.400' };
  }
  if (data.close_intel.total_closes === 0) {
    return { label: 'NO DATA YET', color: 'gray.400' };
  }
  return { label: 'HEALTHY', color: 'green.400' };
}

function StatCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <Box
      bg="gray.900" border="1px solid" borderColor="gray.700"
      borderRadius="lg" p={4} flex="1" minW="120px"
    >
      <Text fontSize="xs" color="gray.500" fontFamily="mono" mb={1} letterSpacing="wide">
        {label}
      </Text>
      <Text fontSize="xl" fontWeight="bold" color={color ?? 'white'} fontFamily="mono">
        {value}
      </Text>
    </Box>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <Text
      fontSize="xs" fontWeight="bold" color="gray.400" fontFamily="mono"
      letterSpacing="wider" mb={3}
    >
      {children}
    </Text>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <Box
      bg="gray.900" border="1px solid" borderColor="gray.700"
      borderRadius="lg" p={6} textAlign="center"
    >
      <Text color="gray.600" fontSize="sm" fontFamily="mono">{message}</Text>
    </Box>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SignalStatusPage() {
  const [data,    setData]    = useState<SignalStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    fetch(`${PM_API}/api/summary`, { credentials: 'include' })
      .then(r => r.json())
      .then((d: Summary) => setSummary(d))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`${PM_API}/api/admin/signal-status`, { credentials: 'include' })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((d: SignalStatus) => { setData(d); setLoading(false); })
      .catch(e => { setError((e as Error).message); setLoading(false); });
  }, []);

  const health = data ? overallHealth(data) : null;

  return (
    <Flex direction="column" minH="100dvh" bg="gray.950" overflowX="hidden">
      <SummaryBar summary={summary} loading={false} />

      <Box maxW="1400px" w="full" mx="auto" px={{ base: 4, md: 6 }} py={6}>

        {/* Page header */}
        <Flex align="center" justify="space-between" flexWrap="wrap" gap={3} mb={6}>
          <VStack align="start" spacing={0}>
            <Heading size="lg" color="white" fontFamily="mono" fontWeight="black">
              Signal Status
            </Heading>
            <Text fontSize="xs" color="gray.500" fontFamily="mono" mt={1}>
              Intelligence processing health for this workspace
            </Text>
          </VStack>
          {health && (
            <Box
              border="1px solid" borderColor="gray.700" borderRadius="md"
              px={4} py={2} bg="gray.900"
            >
              <Text fontSize="xs" color="gray.500" fontFamily="mono" mb={0.5}
                letterSpacing="wide">OVERALL STATUS</Text>
              <Text fontSize="sm" fontWeight="bold" color={health.color} fontFamily="mono">
                {health.label}
              </Text>
            </Box>
          )}
        </Flex>

        {/* Loading */}
        {loading && (
          <Flex justify="center" align="center" h="200px">
            <Spinner size="lg" color="blue.400" />
          </Flex>
        )}

        {/* Error */}
        {!loading && error && (
          <Box bg="gray.900" border="1px solid" borderColor="red.800"
            borderRadius="lg" p={6} textAlign="center">
            <Text color="red.400" fontSize="sm" fontFamily="mono">
              Unable to load Signal status — {error}
            </Text>
          </Box>
        )}

        {/* Main content */}
        {!loading && !error && data && (
          <VStack align="stretch" spacing={8}>

            {/* ── Section A: Attention ───────────────────────────────────── */}
            {data.attention.length > 0 && (
              <VStack align="stretch" spacing={2}>
                {data.attention.map((item, i) => (
                  <HStack
                    key={i}
                    bg={item.severity === 'warning' ? 'yellow.900' : 'gray.800'}
                    border="1px solid"
                    borderColor={item.severity === 'warning' ? 'yellow.700' : 'gray.700'}
                    borderRadius="md" px={4} py={3} spacing={3}
                  >
                    <Text
                      fontSize="xs" fontFamily="mono" fontWeight="bold"
                      color={item.severity === 'warning' ? 'yellow.300' : 'blue.300'}
                      minW="fit-content"
                    >
                      {item.severity === 'warning' ? '⚠ ATTENTION' : 'ℹ INFO'}
                    </Text>
                    <Text fontSize="sm" color="gray.200">
                      {item.message}
                    </Text>
                  </HStack>
                ))}
              </VStack>
            )}

            {/* ── Section B: Close Intel Summary ────────────────────────── */}
            <Box>
              <SectionHeading>CLOSE INTEL SUMMARY</SectionHeading>
              <Flex gap={3} flexWrap="wrap">
                <StatCard label="TOTAL CLOSES"   value={data.close_intel.total_closes} />
                <StatCard label="GENERATED"      value={data.close_intel.intel_generated}
                  color={data.close_intel.intel_generated > 0 ? 'green.300' : 'gray.400'} />
                <StatCard label="FAILED"         value={data.close_intel.intel_failed}
                  color={data.close_intel.intel_failed > 0 ? 'red.400' : 'gray.400'} />
                <StatCard label="SKIPPED"        value={data.close_intel.intel_skipped}
                  color="gray.400" />
                <StatCard label="LAST RESULT"
                  value={data.close_intel.last_result ?? '—'}
                  color={
                    data.close_intel.last_result === 'generated' ? 'green.300' :
                    data.close_intel.last_result === 'failed'    ? 'red.400'   : 'gray.400'
                  }
                />
              </Flex>
            </Box>

            {/* ── Section C: Recent Closes Table ────────────────────────── */}
            <Box>
              <SectionHeading>RECENT TICKET CLOSES (LAST 10)</SectionHeading>
              {data.close_intel.recent_closes.length === 0 ? (
                <EmptyState message="No ticket closes recorded for this workspace yet." />
              ) : (
                <Box
                  bg="gray.900" border="1px solid" borderColor="gray.700"
                  borderRadius="lg" overflow="hidden"
                >
                  {/* Table header */}
                  <Grid
                    templateColumns="160px 1fr 160px 140px"
                    px={4} py={2}
                    bg="gray.800"
                    borderBottom="1px solid" borderColor="gray.700"
                  >
                    {['TICKET', 'CLOSED AT', 'OUTCOME', 'INTEL RESULT'].map(h => (
                      <Text key={h} fontSize="xs" color="gray.500"
                        fontFamily="mono" fontWeight="bold" letterSpacing="wide">
                        {h}
                      </Text>
                    ))}
                  </Grid>
                  {data.close_intel.recent_closes.map((row, i) => (
                    <Grid
                      key={row.ticket_key}
                      templateColumns="160px 1fr 160px 140px"
                      px={4} py={3} alignItems="center"
                      borderBottom={i < data.close_intel.recent_closes.length - 1 ? '1px solid' : undefined}
                      borderColor="gray.800"
                      _hover={{ bg: 'gray.850' }}
                    >
                      <Text fontSize="sm" color="blue.300" fontFamily="mono"
                        fontWeight="medium">
                        {row.ticket_key}
                      </Text>
                      <Text fontSize="xs" color="gray.400" fontFamily="mono">
                        {row.closed_at ?? '—'}
                      </Text>
                      <Text fontSize="xs" color="gray.400" fontFamily="mono">
                        {row.outcome_type ?? '—'}
                      </Text>
                      <Box>{resultBadge(row.intel_extract_result)}</Box>
                    </Grid>
                  ))}
                </Box>
              )}
            </Box>

            {/* ── Section D: Discussion Signals ─────────────────────────── */}
            <Box>
              <SectionHeading>DISCUSSION SIGNAL ACTIVITY</SectionHeading>
              <Flex gap={3} flexWrap="wrap" mb={4}>
                <StatCard label="TOTAL SIGNALS"  value={data.discussion_signals.total_extracted} />
                <StatCard label="ESCALATIONS"    value={data.discussion_signals.escalation_count}
                  color={data.discussion_signals.escalation_count > 0 ? 'yellow.300' : 'gray.400'} />
                <StatCard
                  label="LAST EXTRACTED"
                  value={data.discussion_signals.last_extracted_at
                    ? data.discussion_signals.last_extracted_at.slice(0, 16).replace('T', ' ')
                    : '—'}
                  color="gray.300"
                />
              </Flex>

              {data.discussion_signals.recent.length === 0 ? (
                <EmptyState message="No discussion signals have been generated yet." />
              ) : (
                <Box
                  bg="gray.900" border="1px solid" borderColor="gray.700"
                  borderRadius="lg" overflow="hidden"
                >
                  <Grid
                    templateColumns="160px 1fr 100px 120px 160px"
                    px={4} py={2} bg="gray.800"
                    borderBottom="1px solid" borderColor="gray.700"
                  >
                    {['TICKET', 'STATUS', 'ESCALATION', 'SENTIMENT', 'EXTRACTED AT'].map(h => (
                      <Text key={h} fontSize="xs" color="gray.500"
                        fontFamily="mono" fontWeight="bold" letterSpacing="wide">
                        {h}
                      </Text>
                    ))}
                  </Grid>
                  {data.discussion_signals.recent.map((row, i) => (
                    <Grid
                      key={`${row.ticket_key}-${i}`}
                      templateColumns="160px 1fr 100px 120px 160px"
                      px={4} py={3} alignItems="center"
                      borderBottom={i < data.discussion_signals.recent.length - 1 ? '1px solid' : undefined}
                      borderColor="gray.800"
                    >
                      <Text fontSize="sm" color="blue.300" fontFamily="mono"
                        fontWeight="medium">
                        {row.ticket_key}
                      </Text>
                      <Text fontSize="xs" color="gray.300" fontFamily="mono"
                        noOfLines={1}>
                        {row.latest_status ?? '—'}
                      </Text>
                      <Box>
                        {row.escalation_flag ? (
                          <Badge colorScheme="yellow" fontSize="xs" fontFamily="mono">YES</Badge>
                        ) : (
                          <Text fontSize="xs" color="gray.600" fontFamily="mono">—</Text>
                        )}
                      </Box>
                      <Text fontSize="xs" color="gray.400" fontFamily="mono">
                        {row.sentiment ?? '—'}
                      </Text>
                      <Text fontSize="xs" color="gray.500" fontFamily="mono">
                        {row.extracted_at ?? '—'}
                      </Text>
                    </Grid>
                  ))}
                </Box>
              )}
            </Box>

            {/* Footer */}
            <Divider borderColor="gray.800" />
            <Text fontSize="xs" color="gray.600" fontFamily="mono" textAlign="right">
              Workspace: {data.workspace_id} · Generated:{' '}
              {data.generated_at.slice(0, 19).replace('T', ' ')} UTC
            </Text>

          </VStack>
        )}

      </Box>
    </Flex>
  );
}
