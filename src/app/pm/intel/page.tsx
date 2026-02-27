'use client';
import {
  Box, Flex, Heading, Text, Badge, Button, Spinner,
  HStack, VStack, Divider, Progress,
  Table, Thead, Tbody, Tr, Th, Td, TableContainer,
  Tabs, TabList, Tab, TabPanels, TabPanel,
  Stat, StatLabel, StatNumber,
  SimpleGrid, Collapse, useDisclosure,
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
  last_seen?: string;
  ticket_count?: number;
}

interface ToolRow {
  id: string;
  name?: string;
  vendor?: string;
  category?: string;
  risk_score?: number;
}

function cn(c: unknown): string {
  if (typeof c === 'string') return c;
  if (c && typeof c === 'object') {
    const o = c as Record<string, unknown>;
    return String(o.name ?? o.id ?? '?');
  }
  return String(c ?? '?');
}

function timeAgo(iso?: string): string {
  if (!iso) return 'unknown';
  try {
    const ms = Date.now() - new Date(iso).getTime();
    const h  = Math.floor(ms / 3_600_000);
    const m  = Math.floor((ms % 3_600_000) / 60_000);
    if (h > 48) return `${Math.floor(h / 24)}d ago`;
    if (h > 0)  return `${h}h ${m}m ago`;
    return `${m}m ago`;
  } catch { return 'unknown'; }
}

function riskScheme(s: number): string {
  return s >= 70 ? 'red' : s >= 40 ? 'orange' : 'green';
}

function OutbreakCard({ evt }: { evt: OutbreakEvent }) {
  const { isOpen, onToggle } = useDisclosure();
  const aff  = (evt.affected_clients ?? []).map(cn);
  const risk = (evt.at_risk_clients  ?? []).map(cn);
  return (
    <Box
      border="1px solid" borderColor="red.700"
      borderRadius="md" p={4} mb={3} bg="gray.850"
    >
      <Flex justify="space-between" align="center" flexWrap="wrap" gap={2}>
        <HStack spacing={3} flexWrap="wrap">
          <Text fontWeight="bold" fontSize="md" color="red.300">
            🚨 {evt.tool_id?.toUpperCase()}
          </Text>
          {evt.classification && (
            <Badge colorScheme="orange" fontSize="0.7em">{evt.classification}</Badge>
          )}
          <Badge colorScheme="red" fontSize="0.7em">
            {aff.length} affected
          </Badge>
          {risk.length > 0 && (
            <Badge colorScheme="yellow" fontSize="0.7em">{risk.length} at risk</Badge>
          )}
        </HStack>
        <HStack spacing={3}>
          <Text fontSize="xs" color="gray.500">First seen: {timeAgo(evt.first_seen)}</Text>
          <Button size="xs" variant="ghost" colorScheme="gray" onClick={onToggle}>
            {isOpen ? '▲ Less' : '▼ Details'}
          </Button>
        </HStack>
      </Flex>

      <Collapse in={isOpen}>
        <Divider my={3} borderColor="gray.700" />
        <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
          <Box>
            <Text fontSize="xs" fontWeight="semibold" color="red.400" mb={1}>AFFECTED CLIENTS</Text>
            {aff.length === 0 ? (
              <Text fontSize="xs" color="gray.500">None recorded</Text>
            ) : aff.map((c, i) => (
              <Text key={i} fontSize="sm" color="gray.200">• {c}</Text>
            ))}
          </Box>
          <Box>
            <Text fontSize="xs" fontWeight="semibold" color="orange.400" mb={1}>AT RISK (not yet affected)</Text>
            {risk.length === 0 ? (
              <Text fontSize="xs" color="gray.500">None identified</Text>
            ) : risk.map((c, i) => (
              <Text key={i} fontSize="sm" color="gray.200">• {c}</Text>
            ))}
          </Box>
        </SimpleGrid>
        {risk.length > 0 && (
          <Box mt={3} p={2} bg="orange.900" borderRadius="md">
            <Text fontSize="xs" color="orange.200" fontWeight="semibold">Recommended Action:</Text>
            <Text fontSize="xs" color="orange.300">Proactive check-in with at-risk clients — verify {evt.tool_id} patch status and run diagnostics before issue spreads.</Text>
          </Box>
        )}
      </Collapse>
    </Box>
  );
}

export default function IntelDashboard() {
  const [events, setEvents]   = useState<OutbreakEvent[]>([]);
  const [tools,  setTools]    = useState<ToolRow[]>([]);
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
  const resolved = events.filter(e => e.status !== 'active');
  const atRiskAll = Array.from(
    new Set(active.flatMap(e => (e.at_risk_clients ?? []).map(cn)))
  );

  if (loading) return (
    <Flex h="60vh" align="center" justify="center" bg="gray.900">
      <Spinner color="blue.400" />
      <Text ml={3} color="gray.500">Loading intelligence data...</Text>
    </Flex>
  );

  return (
    <Box p={6} maxW="1200px" mx="auto" bg="gray.900" minH="100vh">
      {/* Header */}
      <Flex justify="space-between" align="center" mb={6} flexWrap="wrap" gap={3}>
        <VStack align="start" spacing={0}>
          <HStack>
            <Link href="/pm">
              <Text fontSize="sm" color="blue.400" cursor="pointer">← PM Dashboard</Text>
            </Link>
            <Text color="gray.600">/</Text>
            <Heading size="md" color="gray.100">🧠 Cross-Client Intelligence</Heading>
          </HStack>
          <Text fontSize="xs" color="gray.500">
            Auto-refreshes every 60s · Last updated: {lastRun || 'loading...'}
          </Text>
        </VStack>
        <Button colorScheme="blue" size="sm" onClick={runNow}
                isLoading={running} loadingText="Running...">
          ⚡ Run Intel Cycle
        </Button>
      </Flex>

      {/* Stat strip */}
      <SimpleGrid columns={{ base: 2, md: 4 }} gap={4} mb={6}>
        {([
          { label: 'Active Outbreaks', value: active.length,    color: active.length    > 0 ? 'red.400'    : 'green.400' },
          { label: 'At-Risk Clients',  value: atRiskAll.length, color: atRiskAll.length > 0 ? 'orange.400' : 'green.400' },
          { label: 'Tools Tracked',    value: tools.length,     color: 'blue.400' },
          { label: 'Resolved Events',  value: resolved.length,  color: 'gray.400' },
        ] as {label:string;value:number;color:string}[]).map(({ label, value, color }) => (
          <Box key={label} p={3} borderRadius="md" border="1px" borderColor="gray.700" bg="gray.800">
            <Stat>
              <StatLabel fontSize="xs" color="gray.500">{label}</StatLabel>
              <StatNumber fontSize="2xl" color={color}>{value}</StatNumber>
            </Stat>
          </Box>
        ))}
      </SimpleGrid>

      {/* Tabs */}
      <Tabs colorScheme="blue" variant="enclosed">
        <TabList borderColor="gray.700">
          <Tab color="gray.400" _selected={{ color: 'white', bg: 'gray.800' }}>
            🚨 Outbreaks ({active.length})
          </Tab>
          <Tab color="gray.400" _selected={{ color: 'white', bg: 'gray.800' }}>
            ⚠️ At-Risk ({atRiskAll.length})
          </Tab>
          <Tab color="gray.400" _selected={{ color: 'white', bg: 'gray.800' }}>
            📈 Tool Risk Scores
          </Tab>
          <Tab color="gray.400" _selected={{ color: 'white', bg: 'gray.800' }}>
            🕐 History ({resolved.length})
          </Tab>
        </TabList>

        <TabPanels>
          {/* Outbreaks */}
          <TabPanel px={0}>
            {active.length === 0 ? (
              <Flex py={12} align="center" justify="center" direction="column" gap={2}>
                <Text fontSize="3xl">✅</Text>
                <Text color="green.400" fontWeight="medium">No active outbreaks</Text>
                <Text fontSize="xs" color="gray.500">All clients operating normally</Text>
              </Flex>
            ) : active.map((e, i) => <OutbreakCard key={i} evt={e} />)}
          </TabPanel>

          {/* At-Risk */}
          <TabPanel px={0}>
            {atRiskAll.length === 0 ? (
              <Flex py={12} align="center" justify="center" direction="column" gap={2}>
                <Text fontSize="3xl">✅</Text>
                <Text color="green.400">No at-risk clients</Text>
              </Flex>
            ) : (
              <TableContainer>
                <Table size="sm" variant="simple">
                  <Thead>
                    <Tr borderColor="gray.700">
                      <Th color="gray.400">Client</Th>
                      <Th color="gray.400">Threat Tool</Th>
                      <Th color="gray.400">Recommended Action</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {active.flatMap((e, ei) =>
                      (e.at_risk_clients ?? []).map((c, ci) => (
                        <Tr key={`${ei}-${ci}`} borderColor="gray.700">
                          <Td color="gray.200" fontWeight="medium">{cn(c)}</Td>
                          <Td>
                            <Badge colorScheme="orange">{e.tool_id}</Badge>
                          </Td>
                          <Td fontSize="xs" color="blue.400">
                            Proactive check-in + verify patch status
                          </Td>
                        </Tr>
                      ))
                    )}
                  </Tbody>
                </Table>
              </TableContainer>
            )}
          </TabPanel>

          {/* Tool Risk Scores */}
          <TabPanel px={0}>
            <TableContainer>
              <Table size="sm" variant="simple">
                <Thead>
                  <Tr borderColor="gray.700">
                    <Th color="gray.400">Tool</Th>
                    <Th color="gray.400">Vendor</Th>
                    <Th color="gray.400">Category</Th>
                    <Th color="gray.400">Risk Score</Th>
                    <Th color="gray.400">Level</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {tools.map(t => {
                    const sc = t.risk_score ?? 0;
                    const scheme = riskScheme(sc);
                    return (
                      <Tr key={t.id} borderColor="gray.700">
                        <Td color="gray.100" fontWeight="medium">{t.name ?? t.id}</Td>
                        <Td fontSize="xs" color="gray.500">{t.vendor ?? '—'}</Td>
                        <Td>
                          <Badge variant="outline" fontSize="0.7em" colorScheme="gray">
                            {t.category ?? '—'}
                          </Badge>
                        </Td>
                        <Td>
                          <HStack spacing={2}>
                            <Progress value={sc} colorScheme={scheme}
                                      size="sm" w="80px" borderRadius="full" />
                            <Text fontSize="xs" color="gray.300">{sc}</Text>
                          </HStack>
                        </Td>
                        <Td>
                          <Badge colorScheme={scheme} fontSize="0.7em">
                            {sc >= 70 ? 'HIGH' : sc >= 40 ? 'MEDIUM' : 'LOW'}
                          </Badge>
                        </Td>
                      </Tr>
                    );
                  })}
                </Tbody>
              </Table>
            </TableContainer>
          </TabPanel>

          {/* History */}
          <TabPanel px={0}>
            {resolved.length === 0 ? (
              <Flex py={12} align="center" justify="center">
                <Text color="gray.500">No resolved events yet</Text>
              </Flex>
            ) : resolved.map((e, i) => <OutbreakCard key={i} evt={e} />)}
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
}
