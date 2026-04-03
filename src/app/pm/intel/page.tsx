'use client';
import {
  Box, Flex, Heading, Text, Badge, Button, Spinner, Select,
  HStack, VStack, Divider, Progress,
  Table, Thead, Tbody, Tr, Th, Td, TableContainer,
  Tabs, TabList, Tab, TabPanels, TabPanel,
  Stat, StatLabel, StatNumber, Modal, ModalOverlay, ModalContent,
  ModalHeader, ModalBody, ModalCloseButton,
  SimpleGrid, Collapse, useDisclosure,
} from '@chakra-ui/react';
import { useEffect, useState, useCallback } from 'react'
import React from 'react';
import { pmFetch } from '@/lib/demoApi';
import { useUser } from '@/lib/useUser';
import { DemoBanner } from '@/components/pm/DemoBanner';
import { SummaryBar } from '@/components/pm/SummaryBar';

const API = '/pm-api'; // always use relative proxy — hardcoded to avoid localhost fallback on Vercel

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

interface IntelEntry {
  id: string;
  client_key?: string | null;
  tool_id?: string | null;
  pattern: string;
  observation: string;
  resolution: string;
  confidence: 'low' | 'medium' | 'high';
  tags: string[];
  source_ticket?: string | null;
  observed_at: string;
  created_by: string;
  created_at: string;
  kb_status?: 'none' | 'proposed' | 'approved';  // 13A
  kb_promoted_at?: string | null;
  kb_promoted_by?: string | null;
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


function IntelPageKBPromotion({ entry, onUpdate }: {
  entry: IntelEntry;
  onUpdate: (id: string, status: string) => void;
}) {
  const [status, setStatus] = React.useState<string>(entry.kb_status || 'none');
  const [saving, setSaving] = React.useState(false);

  const updateStatus = async (newStatus: 'proposed' | 'approved') => {
    setSaving(true);
    try {
      const res = await fetch(`/api/intel/${entry.id}/kb-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kb_status: newStatus, promoted_by: 'pm' }),
      });
      if (res.ok) { setStatus(newStatus); onUpdate(entry.id, newStatus); }
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const badgeScheme = status === 'approved' ? 'green' : status === 'proposed' ? 'blue' : 'gray';
  const badgeLabel  = status === 'approved' ? '🟢 Approved' : status === 'proposed' ? '🔵 Proposed' : '⚪ Not in KB';
  return (
    <Box border="1px solid" borderColor="gray.700" borderRadius="md" p={3} bg="blackAlpha.400" mt={1}>
      <Text fontSize="2xs" color="gray.400" fontFamily="mono" mb={2}>KNOWLEDGE BASE PROMOTION</Text>
      <HStack justify="space-between" flexWrap="wrap" gap={2}>
        <Badge colorScheme={badgeScheme} fontSize="xs" px={2} py={0.5}>{badgeLabel}</Badge>
        <HStack spacing={2}>
          {status === 'none' && (
            <Button size="xs" colorScheme="blue" variant="outline" isLoading={saving}
              onClick={() => updateStatus('proposed')}>Propose for KB</Button>
          )}
          {status === 'proposed' && (
            <Button size="xs" colorScheme="green" variant="outline" isLoading={saving}
              onClick={() => updateStatus('approved')}>Approve to KB</Button>
          )}
          {status === 'approved' && (
            <Text fontSize="xs" color="green.400">✅ Synced to KB</Text>
          )}
        </HStack>
      </HStack>
    </Box>
  );
}



interface TrendItem {
  pattern: string;
  tool_id: string | null;
  occurrences: number;
  clients: number;
  first_seen: string;
  last_seen: string;
  trend_status: 'normal' | 'emerging' | 'outbreak';
}
export default function IntelDashboard() {
  const { user } = useUser();
  const [events, setEvents]         = useState<OutbreakEvent[]>([]);
  const [tools,  setTools]           = useState<ToolRow[]>([]);
  const [lastRun, setLastRun]        = useState<string>('');
  const [loading, setLoading]        = useState(true);
  const [running, setRunning]        = useState(false);
  const [intelEntries, setIntelEntries] = useState<IntelEntry[]>([]);
  const [intelLoading, setIntelLoading] = useState(false);
  const [intelFilter, setIntelFilter]   = useState({ client: '', tool: '', confidence: '' });
  const [intelSort, setIntelSort]       = useState<'recent'|'confidence'>('recent');
  const [selectedIntel, setSelectedIntel] = useState<IntelEntry | null>(null);
  const [filterOptions, setFilterOptions] = useState<{ client_keys: string[]; tool_ids: string[] }>({ client_keys: [], tool_ids: [] });
  const [trends, setTrends]               = useState<TrendItem[]>([]);
  const [trendsLoading, setTrendsLoading] = useState(false);
  const { isOpen: detailOpen, onOpen: openDetail, onClose: closeDetail } = useDisclosure();

  const fetchIntel = useCallback(async () => {
    setIntelLoading(true);
    try {
      const params = new URLSearchParams();
      if (intelFilter.client)     params.set('client_key',  intelFilter.client);
      if (intelFilter.tool)       params.set('tool_id',     intelFilter.tool);
      if (intelFilter.confidence) params.set('confidence',  intelFilter.confidence);
      params.set('limit', '50');
      const res = await pmFetch(`/api/intel?${params}`, API);
      setIntelEntries((res as any)?.items ?? []);
    } catch (e) { console.error('[Intel] fetchIntel error:', e); } finally { setIntelLoading(false); }
  }, [intelFilter]);


  const fetchTrends = useCallback(async () => {
    setTrendsLoading(true);
    try {
      const tenantParam = user?.tenant_id ? `?tenant_id=${user.tenant_id}` : '';
      const res = await pmFetch(`/api/intel/trends${tenantParam}`, API);
      setTrends((res as any)?.items ?? []);
    } catch { /* silent */ } finally { setTrendsLoading(false); }
  }, [user?.tenant_id]);

  const fetchAll = useCallback(async () => {
    try {
      const [evRes, trRes] = await Promise.allSettled([
        pmFetch('/api/intel/outbreaks', API),
        pmFetch('/api/nodes/tools',     API),
      ]);
      if (evRes.status === 'fulfilled') setEvents((evRes.value as any)?.events ?? []);
      if (trRes.status === 'fulfilled') {
        const sorted = [...((trRes.value as any)?.tools ?? [])].sort(
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

  useEffect(() => { fetchIntel(); }, [fetchIntel]);
  useEffect(() => { fetchTrends(); }, [fetchTrends]);

  useEffect(() => {
    pmFetch('/api/intel/filter-options', API)
      .then((d) => setFilterOptions(d as any))
      .catch(() => {});
  }, []);

  const runNow = async () => {
    setRunning(true);
    try { await pmFetch('/api/intel/run', API); await fetchAll(); }
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
    <Box bg="gray.900" minH="100dvh" display="flex" flexDirection="column" overflowX="hidden" w="100%" sx={{ maxWidth: '100vw', boxSizing: 'border-box' }}>
      <DemoBanner />
      <SummaryBar summary={null} loading={false} />
      <Box px={{ base: 3, md: 6 }} py={{ base: 3, md: 6 }} w="100%" maxW="1200px" mx="auto" overflowX="hidden">
      {/* Header */}
      <Flex justify="space-between" align={{ base: "flex-start", md: "center" }} mb={6} flexWrap="wrap" gap={3} direction={{ base: "column", md: "row" }}>
        <VStack align="start" spacing={0}>
          <HStack flexWrap="wrap">
            <Heading size={{ base: "sm", md: "md" }} color="gray.100">🧠 Cross-Client Intelligence</Heading>
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
      <SimpleGrid columns={{ base: 2, md: 4 }} gap={{ base: 2, md: 4 }} mb={6}>
        {([
          { label: 'Active Outbreaks', value: active.length,    color: active.length    > 0 ? 'red.400'    : 'green.400' },
          { label: 'At-Risk Clients',  value: atRiskAll.length, color: atRiskAll.length > 0 ? 'orange.400' : 'green.400' },
          { label: 'Tools Tracked',    value: tools.length,     color: 'blue.400' },
          { label: 'Resolved Events',  value: resolved.length,  color: 'gray.400' },
        ] as {label:string;value:number;color:string}[]).map(({ label, value, color }) => (
          <Box key={label} p={{ base: 2, md: 3 }} borderRadius="md" border="1px" borderColor="gray.700" bg="gray.800" minW={0} overflow="hidden">
            <Stat>
              <StatLabel fontSize="xs" color="gray.500" whiteSpace="normal" lineHeight="short">{label}</StatLabel>
              <StatNumber fontSize={{ base: "xl", md: "2xl" }} color={color}>{value}</StatNumber>
            </Stat>
          </Box>
        ))}
      </SimpleGrid>

      {/* Tabs */}
      <Tabs colorScheme="blue" variant="enclosed">
        <TabList borderColor="gray.700" overflowX="auto" flexWrap="nowrap" sx={{ '&::-webkit-scrollbar': { display: 'none' } }}>
          <Tab color="gray.400" _selected={{ color: 'white', bg: 'gray.800' }} whiteSpace="nowrap" fontSize={{ base: 'xs', md: 'sm' }}>
            🚨 Outbreaks ({active.length})
          </Tab>
          <Tab color="gray.400" _selected={{ color: 'white', bg: 'gray.800' }} whiteSpace="nowrap" fontSize={{ base: 'xs', md: 'sm' }}>
            ⚠️ At-Risk ({atRiskAll.length})
          </Tab>
          <Tab color="gray.400" _selected={{ color: 'white', bg: 'gray.800' }} whiteSpace="nowrap" fontSize={{ base: 'xs', md: 'sm' }}>
            📈 Tool Risk Scores
          </Tab>
          <Tab color="gray.400" _selected={{ color: 'white', bg: 'gray.800' }} whiteSpace="nowrap" fontSize={{ base: 'xs', md: 'sm' }}>
            🕐 History ({resolved.length})
          </Tab>
          <Tab color="gray.400" _selected={{ color: 'white', bg: 'gray.800' }} whiteSpace="nowrap" fontSize={{ base: 'xs', md: 'sm' }}>
            🧠 Intel Entries ({intelEntries.length})
          </Tab>
          <Tab color="gray.400" _selected={{ color: 'white', bg: 'gray.800' }} whiteSpace="nowrap" fontSize={{ base: 'xs', md: 'sm' }}>
            📊 Trends {trends.filter(t => t.trend_status !== 'normal').length > 0 ? `(${trends.filter(t => t.trend_status !== 'normal').length})` : ''}
          </Tab>
        </TabList>

        <TabPanels overflowX="hidden">
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


          {/* Intel Entries Tab */}
          <TabPanel px={0}>
            {/* Filters */}
            <HStack mb={4} spacing={3} flexWrap="wrap" align="flex-start">
              <Select size="sm" w={{ base: "full", md: "200px" }} maxW={{ base: "full", md: "200px" }} bg="gray.800" border="1px solid" borderColor="gray.600"
                color="gray.200" fontSize="xs" placeholder="All clients"
                value={intelFilter.client}
                onChange={(e) => setIntelFilter((f) => ({ ...f, client: e.target.value }))}>
                {filterOptions.client_keys.map((k) => (
                  <option key={k} value={k} style={{background:'#1a202c'}}>{k}</option>
                ))}
              </Select>
              <Select size="sm" w={{ base: "full", md: "160px" }} maxW={{ base: "full", md: "160px" }} bg="gray.800" border="1px solid" borderColor="gray.600"
                color="gray.200" fontSize="xs" placeholder="All tools"
                value={intelFilter.tool}
                onChange={(e) => setIntelFilter((f) => ({ ...f, tool: e.target.value }))}>
                {filterOptions.tool_ids.map((t) => (
                  <option key={t} value={t} style={{background:'#1a202c'}}>{t}</option>
                ))}
              </Select>
              <Select size="sm" w={{ base: "full", md: "140px" }} maxW={{ base: "full", md: "140px" }} bg="gray.800" border="1px solid" borderColor="gray.600"
                color="gray.200" fontSize="xs" placeholder="Any confidence"
                value={intelFilter.confidence}
                onChange={(e) => setIntelFilter((f) => ({ ...f, confidence: e.target.value }))}>
                {["high","medium","low"].map((c) => (
                  <option key={c} value={c} style={{background:'#1a202c'}}>{c}</option>
                ))}
              </Select>
              <HStack spacing={1}>
                {(["recent", "confidence"] as const).map((s) => (
                  <Button key={s} size="xs" variant={intelSort === s ? "solid" : "outline"}
                    colorScheme="blue"
                    onClick={() => {
                      setIntelSort(s);
                    }}>
                    {s === "recent" ? "🕐 Recent" : "⭐ Confidence"}
                  </Button>
                ))}
              </HStack>
              {(intelFilter.client || intelFilter.tool || intelFilter.confidence) && (
                <Button size="xs" variant="ghost" colorScheme="gray"
                  onClick={() => setIntelFilter({ client: '', tool: '', confidence: '' })}>
                  Clear
                </Button>
              )}
            </HStack>

            {intelLoading ? (
              <Flex py={8} align="center" justify="center"><Spinner color="blue.400" size="sm" /></Flex>
            ) : intelEntries.length === 0 ? (
              <Flex py={12} align="center" justify="center" direction="column" gap={2}>
                <Text fontSize="3xl">🧠</Text>
                <Text color="gray.500">No Intel entries yet</Text>
                <Text fontSize="xs" color="gray.600">Use the Pilot chip "Propose Intel entry" during a visit to create the first one</Text>
              </Flex>
            ) : (
              <Box>
                {/* Intel Detail Modal */}
                <Modal isOpen={detailOpen} onClose={closeDetail} size="lg" isCentered>
                  <ModalOverlay bg="blackAlpha.800" />
                  <ModalContent bg="gray.900" border="1px solid" borderColor="blue.700" color="gray.100">
                    <ModalHeader fontSize="sm" fontFamily="mono" color="blue.300"
                      borderBottom="1px solid" borderColor="gray.700" pb={3}>
                      🧠 Intel Entry
                      {selectedIntel && (
                        <Badge ml={3} fontSize="0.65em" verticalAlign="middle"
                          colorScheme={selectedIntel.confidence === 'high' ? 'green' : selectedIntel.confidence === 'medium' ? 'yellow' : 'gray'}>
                          {selectedIntel.confidence}
                        </Badge>
                      )}
                    </ModalHeader>
                    <ModalCloseButton color="gray.400" />
                    <ModalBody py={4}>
                      {selectedIntel && (
                        <VStack align="stretch" spacing={4} fontSize="sm">
                          <Box>
                            <Text fontSize="2xs" color="blue.400" fontFamily="mono" mb={1}>PATTERN</Text>
                            <Text fontWeight="bold" color="white">{selectedIntel.pattern}</Text>
                          </Box>
                          <Box>
                            <Text fontSize="2xs" color="gray.400" fontFamily="mono" mb={1}>OBSERVATION</Text>
                            <Text color="gray.300" lineHeight="tall">{selectedIntel.observation}</Text>
                          </Box>
                          <Box>
                            <Text fontSize="2xs" color="green.400" fontFamily="mono" mb={1}>RESOLUTION</Text>
                            <Text color="gray.200" lineHeight="tall">{selectedIntel.resolution}</Text>
                          </Box>
                          <Divider borderColor="gray.700" />
                          <HStack spacing={4} fontSize="xs" color="gray.500" flexWrap="wrap">
                            {selectedIntel.client_key && <Text>Site: <Text as="span" color="gray.300">{selectedIntel.client_key}</Text></Text>}
                            {selectedIntel.tool_id    && <Text>Tool: <Text as="span" color="blue.300">{selectedIntel.tool_id}</Text></Text>}
                            {selectedIntel.source_ticket && <Text>Ticket: <Text as="span" color="gray.300">#{selectedIntel.source_ticket}</Text></Text>}
                            <Text>Observed: <Text as="span" color="gray.300">{(selectedIntel.observed_at || '').slice(0,10)}</Text></Text>
                            <Text>By: <Text as="span" color="gray.400">{selectedIntel.created_by}</Text></Text>
                          </HStack>
                          {selectedIntel.tags?.length > 0 && (
                            <HStack flexWrap="wrap" spacing={1}>
                              {selectedIntel.tags.map((t: string, i: number) => (
                                <Badge key={i} variant="outline" colorScheme="gray" fontSize="2xs">{t}</Badge>
                              ))}
                            </HStack>
                          )}
                          {/* 13B: KB Promotion controls in Intel page modal */}
                          <IntelPageKBPromotion entry={selectedIntel} onUpdate={(id, status) => {
                            setIntelEntries(prev => prev.map(e =>
                              e.id === id ? { ...e, kb_status: status as IntelEntry['kb_status'] } : e
                            ));
                          }} />
                        </VStack>
                      )}
                    </ModalBody>
                  </ModalContent>
                </Modal>

                {/* Entry List */}
                <VStack align="stretch" spacing={2}>
                  {[...intelEntries]
                    .sort((a, b) => {
                      if (intelSort === 'confidence') {
                        const order = { high: 0, medium: 1, low: 2 };
                        return (order[a.confidence] ?? 3) - (order[b.confidence] ?? 3);
                      }
                      return new Date(b.observed_at).getTime() - new Date(a.observed_at).getTime();
                    })
                    .map((entry) => (
                      <Box key={entry.id}
                        border="1px solid" borderColor="gray.700" borderRadius="md" p={3} bg="gray.800"
                        cursor="pointer" _hover={{ borderColor: 'blue.600', bg: 'gray.750' }}
                        transition="all 0.15s"
                        onClick={() => { setSelectedIntel(entry); openDetail(); }}>
                        <Flex justify="space-between" align="flex-start" gap={2}>
                          <VStack align="flex-start" spacing={1} flex={1} minW={0}>
                            <Text fontWeight="bold" fontSize="sm" color="gray.100" noOfLines={1}>
                              {entry.pattern}
                            </Text>
                            <Text fontSize="xs" color="gray.400" noOfLines={2} lineHeight="short">
                              {entry.resolution}
                            </Text>
                            <HStack spacing={2} flexWrap="wrap" pt={0.5}>
                              {entry.client_key && (
                                <Badge variant="outline" colorScheme="gray" fontSize="2xs">{entry.client_key}</Badge>
                              )}
                              {entry.tool_id && (
                                <Badge colorScheme="blue" variant="subtle" fontSize="2xs">{entry.tool_id}</Badge>
                              )}
                              {entry.tags?.slice(0,3).map((t: string, i: number) => (
                                <Badge key={i} variant="outline" colorScheme="gray" fontSize="2xs">{t}</Badge>
                              ))}
                            </HStack>
                          </VStack>
                          <VStack align="flex-end" spacing={1} flexShrink={0}>
                            <Badge fontSize="xs"
                              colorScheme={entry.confidence === 'high' ? 'green' : entry.confidence === 'medium' ? 'yellow' : 'gray'}>
                              {entry.confidence}
                            </Badge>
                            {/* 13C: KB Status badge */}
                            {entry.kb_status === 'approved' && (
                              <Badge fontSize="2xs" colorScheme="green" variant="subtle">🟢 KB</Badge>
                            )}
                            {entry.kb_status === 'proposed' && (
                              <Badge fontSize="2xs" colorScheme="blue" variant="subtle">🔵 Proposed</Badge>
                            )}
                            <Text fontSize="2xs" color="gray.600">
                              {(entry.observed_at || '').slice(0,10)}
                            </Text>
                          </VStack>
                        </Flex>
                      </Box>
                    ))
                  }
                </VStack>
              </Box>
            )}
          </TabPanel>

          {/* Phase 28: Trends */}
          <TabPanel px={0}>
            {trendsLoading ? (
              <Flex justify="center" py={8}><Spinner color="blue.400" /></Flex>
            ) : trends.length === 0 ? (
              <Flex py={12} align="center" justify="center" direction="column" gap={2}>
                <Text fontSize="3xl">📊</Text>
                <Text color="gray.400" fontWeight="medium">No pattern trends yet</Text>
                <Text fontSize="xs" color="gray.500">Trends appear after multiple intel entries are saved</Text>
              </Flex>
            ) : (
              <VStack align="stretch" spacing={3} mt={2}>
                {trends.map((t, i) => (
                  <Box key={i}
                    bg="gray.800" rounded="lg" p={4}
                    borderLeft="4px solid"
                    borderColor={
                      t.trend_status === 'outbreak' ? 'red.400' :
                      t.trend_status === 'emerging' ? 'orange.400' : 'gray.600'
                    }
                  >
                    <Flex justify="space-between" align="flex-start" wrap="wrap" gap={2}>
                      <Box flex={1}>
                        <HStack mb={1} spacing={2}>
                          {t.trend_status === 'outbreak' && (
                            <Badge colorScheme="red" fontSize="xs">🚨 OUTBREAK</Badge>
                          )}
                          {t.trend_status === 'emerging' && (
                            <Badge colorScheme="orange" fontSize="xs">⚠️ EMERGING</Badge>
                          )}
                          {t.trend_status === 'normal' && (
                            <Badge colorScheme="gray" fontSize="xs">normal</Badge>
                          )}
                          {t.tool_id && (
                            <Badge colorScheme="blue" fontSize="xs">{t.tool_id}</Badge>
                          )}
                        </HStack>
                        <Text fontWeight="semibold" color="white" fontSize="sm" mb={1}>
                          {t.pattern}
                        </Text>
                      </Box>
                      <VStack align="flex-end" spacing={0} minW="80px">
                        <Text fontSize="lg" fontWeight="bold" color="white">{t.occurrences}</Text>
                        <Text fontSize="xs" color="gray.400">occurrences</Text>
                      </VStack>
                    </Flex>
                    <HStack mt={2} spacing={4} fontSize="xs" color="gray.400">
                      <Text>👥 {t.clients} client{t.clients !== 1 ? 's' : ''}</Text>
                      <Text>📅 Last: {t.last_seen || '—'}</Text>
                      {t.first_seen && t.first_seen !== t.last_seen && (
                        <Text>First: {t.first_seen}</Text>
                      )}
                    </HStack>
                  </Box>
                ))}
              </VStack>
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
    </Box>
  );
}
