'use client';
import {
  Box, Flex, Heading, Text, Badge, Button, Spinner, Select,
  Input, Textarea, FormControl, FormLabel,
  HStack, VStack, Divider, Progress, Tooltip,
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
  category?: string;
  risk_score?: RiskScore;   // S6: object, not number
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

// Provenance badge: classifies intel entry source into human-readable label
function sourceLabel(createdBy: string): { label: string; scheme: string } {
  if (!createdBy) return { label: 'unknown', scheme: 'gray' };
  const cb = createdBy.toLowerCase();
  if (cb === 'pilot' || cb.startsWith('ai') || cb === 'intel_cycle' || cb === 'tower')
    return { label: 'AI', scheme: 'purple' };
  if (cb === 'pm' || cb === 'admin' || cb === 'platform')
    return { label: 'platform', scheme: 'blue' };
  return { label: 'manual', scheme: 'gray' };
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
// ─── FST-083: Intel Manage Tab interfaces ────────────────────────────────────
interface IntelManageEntry {
  id: string;
  pattern: string;
  observation: string;
  resolution: string;
  confidence: 'low' | 'medium' | 'high';
  tags: string[];
  source_ticket?: string | null;
  tool_id?: string | null;
  client_key?: string | null;
  observed_at: string;
  created_by: string;
  // manage fields
  state?: string;               // observed|useful|promoted|suppressed
  integration?: string;         // msp|programming|general
  scope?: string;               // raw
  scope_normalized?: string;    // company_private|tool_shared
  used_count?: number;
  last_used_at?: string | null;
  last_used_in_ticket?: string | null;
  last_used_by_flow?: string | null;
  days_since_last_used?: number | null;
  never_used?: boolean;
  archived_at?: string | null;
}

interface ManageStateCounts {
  observed: number;
  useful: number;
  promoted: number;
  suppressed: number;
}

// ─── FST-083: ManageTab component ────────────────────────────────────────────
function ManageTab() {
  const API_BASE = '/pm-api';

  // ── filter state ──
  const [scopeFilter, setScopeFilter]           = React.useState('');
  const [integFilter, setIntegFilter]           = React.useState('');
  const [stateFilter, setStateFilter]           = React.useState('');
  const [neverUsed, setNeverUsed]               = React.useState(false);
  const [sortBy, setSortBy]                     = React.useState('days_since_last_used');
  const [includeArchived, setIncludeArchived]   = React.useState(false);

  // ── data state ──
  const [entries, setEntries]       = React.useState<IntelManageEntry[]>([]);
  const [stateCounts, setStateCounts] = React.useState<ManageStateCounts>({ observed: 0, useful: 0, promoted: 0, suppressed: 0 });
  const [loading, setLoading]       = React.useState(false);
  const [total, setTotal]           = React.useState(0);

  // ── selection state ──
  const [selected, setSelected] = React.useState<Set<string>>(new Set<string>());
  const [bulkLoading, setBulkLoading] = React.useState(false);

  // ── detail drawer ──
  const [drawer, setDrawer] = React.useState<IntelManageEntry | null>(null);

  // ── action loading per row ──
  const [rowLoading, setRowLoading] = React.useState<Record<string, boolean>>({});

  // ── fetch ──
  const fetchManage = React.useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (scopeFilter)    p.set('scope', scopeFilter);
      if (integFilter)    p.set('integration', integFilter);
      if (stateFilter)    p.set('state', stateFilter);
      if (neverUsed)      p.set('never_used', 'true');
      if (includeArchived) p.set('include_archived', 'true');
      p.set('sort_by', sortBy);
      p.set('limit', '200');
      const res = await pmFetch(`/api/intel/manage?${p}`, API_BASE);
      const data = res as any;
      setEntries(data?.items ?? []);
      setTotal(data?.total ?? 0);
      setStateCounts(data?.state_counts ?? { observed: 0, useful: 0, promoted: 0, suppressed: 0 });
    } catch (e) { console.error('[Manage] fetch error', e); }
    finally { setLoading(false); }
  }, [scopeFilter, integFilter, stateFilter, neverUsed, sortBy, includeArchived]);

  React.useEffect(() => { fetchManage(); }, [fetchManage]);

  // ── row action ──
  const rowAction = async (id: string, state: string, integration?: string) => {
    setRowLoading(r => ({ ...r, [id]: true }));
    try {
      await pmFetch(`/api/intel/${id}/manage`, API_BASE, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state, ...(integration ? { integration } : {}) }),
      });
      await fetchManage();
      if (drawer?.id === id) setDrawer(null);
    } catch (e) { console.error('[Manage] row action error', e); }
    finally { setRowLoading(r => ({ ...r, [id]: false })); }
  };

  // ── bulk action ──
  const bulkAction = async (action: string) => {
    if (selected.size === 0) return;
    setBulkLoading(true);
    try {
      await pmFetch('/api/intel/bulk-action', API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selected), action }),
      });
      setSelected(new Set());
      await fetchManage();
    } catch (e) { console.error('[Manage] bulk action error', e); }
    finally { setBulkLoading(false); }
  };

  // ── selection helpers ──
  const toggleSelect = (id: string) => {
    setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };
  const selectAll = () => setSelected(new Set(entries.map(e => e.id)));
  const clearAll  = () => setSelected(new Set());

  // ── helpers ──
  const stateScheme: Record<string, string> = {
    observed: 'gray', useful: 'blue', promoted: 'green', suppressed: 'red',
  };
  const integScheme: Record<string, string> = {
    msp: 'orange', programming: 'purple', general: 'gray',
  };
  const scopeScheme: Record<string, string> = {
    company_private: 'teal', tool_shared: 'cyan',
  };
  const confScheme: Record<string, string> = {
    high: 'green', medium: 'yellow', low: 'gray',
  };
  const daysLabel = (e: IntelManageEntry): string => {
    if (e.never_used || e.used_count === 0) return 'never';
    if (e.days_since_last_used == null) return '—';
    return `${e.days_since_last_used}d`;
  };
  const daysColor = (e: IntelManageEntry): string => {
    if (e.never_used || e.used_count === 0) return 'orange.400';
    const d = e.days_since_last_used ?? 0;
    if (d > 90) return 'red.400';
    if (d > 30) return 'orange.300';
    return 'gray.400';
  };

  return (
    <Box>
      {/* ── Stats Strip ─────────────────────────────────────────────────────── */}
      <HStack spacing={2} mb={4} flexWrap="wrap">
        {(['observed','useful','promoted','suppressed'] as const).map(s => (
          <Button
            key={s}
            size="xs"
            variant={stateFilter === s ? 'solid' : 'outline'}
            colorScheme={stateScheme[s]}
            onClick={() => setStateFilter(f => f === s ? '' : s)}
          >
            {s}: {stateCounts[s]}
          </Button>
        ))}
        <Text fontSize="2xs" color="gray.600" ml={1}>click to filter</Text>
      </HStack>

      {/* ── Filter Bar ──────────────────────────────────────────────────────── */}
      <HStack mb={4} spacing={2} flexWrap="wrap" align="flex-start">
        {/* Scope */}
        <Select
          size="sm" w="160px" bg="gray.800" border="1px solid" borderColor="gray.600"
          color="gray.200" fontSize="xs" placeholder="All scopes"
          value={scopeFilter} onChange={e => setScopeFilter(e.target.value)}
        >
          <option value="company_private" style={{background:'#1a202c'}}>🏢 company private</option>
          <option value="tool_shared"     style={{background:'#1a202c'}}>🔧 tool shared</option>
        </Select>

        {/* Integration */}
        <Select
          size="sm" w="150px" bg="gray.800" border="1px solid" borderColor="gray.600"
          color="gray.200" fontSize="xs" placeholder="All integrations"
          value={integFilter} onChange={e => setIntegFilter(e.target.value)}
        >
          <option value="msp"         style={{background:'#1a202c'}}>🛠 MSP</option>
          <option value="programming" style={{background:'#1a202c'}}>💻 Programming</option>
          <option value="general"     style={{background:'#1a202c'}}>⚙️ General</option>
        </Select>

        {/* Sort */}
        <Select
          size="sm" w="190px" bg="gray.800" border="1px solid" borderColor="gray.600"
          color="gray.200" fontSize="xs"
          value={sortBy} onChange={e => setSortBy(e.target.value)}
        >
          <option value="days_since_last_used" style={{background:'#1a202c'}}>⏱ Most stale first</option>
          <option value="used_count"           style={{background:'#1a202c'}}>📊 Most used first</option>
          <option value="confidence"           style={{background:'#1a202c'}}>⭐ Confidence</option>
          <option value="observed_at"          style={{background:'#1a202c'}}>🕐 Newest first</option>
        </Select>

        {/* Never Used — first-class filter */}
        <Button
          size="sm"
          variant={neverUsed ? 'solid' : 'outline'}
          colorScheme="orange"
          onClick={() => setNeverUsed(v => !v)}
          leftIcon={<Text fontSize="xs">👁</Text>}
        >
          Never Used
        </Button>

        {/* Include Archived */}
        <Button
          size="sm"
          variant={includeArchived ? 'solid' : 'outline'}
          colorScheme="gray"
          onClick={() => setIncludeArchived(v => !v)}
        >
          {includeArchived ? '🗄 +Archived' : '🗄 Archived'}
        </Button>

        {/* Clear */}
        {(scopeFilter || integFilter || stateFilter || neverUsed) && (
          <Button size="sm" variant="ghost" colorScheme="gray"
            onClick={() => { setScopeFilter(''); setIntegFilter(''); setStateFilter(''); setNeverUsed(false); }}
          >
            Clear
          </Button>
        )}

        <Text fontSize="xs" color="gray.500" ml="auto" alignSelf="center">
          {total} entries
        </Text>
      </HStack>

      {/* ── Bulk Action Bar ──────────────────────────────────────────────────── */}
      {selected.size > 0 && (
        <Box mb={3} p={2} bg="blue.900" borderRadius="md" border="1px solid" borderColor="blue.600">
          <HStack spacing={2} flexWrap="wrap">
            <Text fontSize="xs" color="blue.200" fontWeight="semibold">{selected.size} selected</Text>
            <Button size="xs" colorScheme="red"    variant="outline" isLoading={bulkLoading} onClick={() => bulkAction('suppress')}>Suppress all</Button>
            <Button size="xs" colorScheme="gray"   variant="outline" isLoading={bulkLoading} onClick={() => bulkAction('archive')}>Archive all</Button>
            <Button size="xs" colorScheme="yellow" variant="outline" isLoading={bulkLoading} onClick={() => bulkAction('mark_merge_candidate')}>⇌ Mark merge</Button>
            <Button size="xs" colorScheme="green"  variant="outline" isLoading={bulkLoading} onClick={() => bulkAction('restore')}>↩ Restore</Button>
            <Button size="xs" variant="ghost" colorScheme="gray" onClick={clearAll}>Clear</Button>
            <Button size="xs" variant="ghost" colorScheme="gray" onClick={selectAll} ml="auto">Select all ({entries.length})</Button>
          </HStack>
        </Box>
      )}

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      {loading ? (
        <Flex py={8} align="center" justify="center"><Spinner color="blue.400" size="sm" /></Flex>
      ) : entries.length === 0 ? (
        <Flex py={12} align="center" justify="center" direction="column" gap={2}>
          <Text fontSize="3xl">🗂️</Text>
          <Text color="gray.400">No intel entries match the current filters</Text>
          <Text fontSize="xs" color="gray.600">Try clearing filters or adjusting the state filter</Text>
        </Flex>
      ) : (
        <TableContainer overflowX="auto">
          <Table size="sm" variant="simple">
            <Thead>
              <Tr borderColor="gray.700">
                <Th w="32px" px={2}>
                  <input
                    type="checkbox"
                    checked={selected.size === entries.length && entries.length > 0}
                    onChange={e => e.target.checked ? selectAll() : clearAll()}
                    style={{cursor:'pointer'}}
                  />
                </Th>
                <Th color="gray.400" fontSize="2xs">PATTERN</Th>
                <Th color="gray.400" fontSize="2xs" w="90px">INTEG</Th>
                <Th color="gray.400" fontSize="2xs" w="100px">SCOPE</Th>
                <Th color="gray.400" fontSize="2xs" w="90px">STATE</Th>
                <Th color="gray.400" fontSize="2xs" w="80px">CONF</Th>
                <Th color="gray.400" fontSize="2xs" w="55px">USED</Th>
                <Th color="gray.400" fontSize="2xs" w="80px">LAST USED</Th>
                <Th color="gray.400" fontSize="2xs" w="80px">TICKET</Th>
                <Th color="gray.400" fontSize="2xs">ACTIONS</Th>
              </Tr>
            </Thead>
            <Tbody>
              {entries.map(entry => (
                <Tr
                  key={entry.id}
                  borderColor="gray.700"
                  bg={selected.has(entry.id) ? 'blue.900' : 'transparent'}
                  opacity={entry.archived_at ? 0.5 : 1}
                  _hover={{ bg: selected.has(entry.id) ? 'blue.800' : 'gray.800' }}
                >
                  {/* Checkbox */}
                  <Td px={2}>
                    <input
                      type="checkbox"
                      checked={selected.has(entry.id)}
                      onChange={() => toggleSelect(entry.id)}
                      style={{cursor:'pointer'}}
                    />
                  </Td>

                  {/* Pattern */}
                  <Td maxW="240px" isTruncated>
                    <Text
                      fontSize="xs" color="gray.100" noOfLines={1}
                      cursor="pointer" _hover={{ color: 'blue.300' }}
                      onClick={() => setDrawer(entry)}
                      title={entry.pattern}
                    >
                      {entry.pattern}
                    </Text>
                  </Td>

                  {/* Integration */}
                  <Td>
                    <Badge
                      fontSize="2xs"
                      colorScheme={integScheme[entry.integration ?? 'general'] ?? 'gray'}
                      variant="subtle"
                    >
                      {entry.integration ?? 'general'}
                    </Badge>
                  </Td>

                  {/* Scope */}
                  <Td>
                    <Badge
                      fontSize="2xs"
                      colorScheme={scopeScheme[entry.scope_normalized ?? 'company_private'] ?? 'gray'}
                      variant="outline"
                    >
                      {entry.scope_normalized === 'tool_shared' ? 'tool' : 'company'}
                    </Badge>
                  </Td>

                  {/* State */}
                  <Td>
                    <Badge
                      fontSize="2xs"
                      colorScheme={stateScheme[entry.state ?? 'observed'] ?? 'gray'}
                    >
                      {entry.state ?? 'observed'}
                    </Badge>
                    {entry.archived_at && (
                      <Badge fontSize="2xs" colorScheme="gray" ml={1} variant="outline">archived</Badge>
                    )}
                  </Td>

                  {/* Confidence */}
                  <Td>
                    <Badge fontSize="2xs" colorScheme={confScheme[entry.confidence] ?? 'gray'}>
                      {entry.confidence}
                    </Badge>
                  </Td>

                  {/* Used count */}
                  <Td>
                    <Text fontSize="xs" color={(entry.used_count ?? 0) === 0 ? 'orange.400' : 'gray.300'}>
                      {entry.used_count ?? 0}
                    </Text>
                  </Td>

                  {/* Last used / days */}
                  <Td>
                    <Text fontSize="xs" color={daysColor(entry)} fontWeight={(entry.never_used) ? 'semibold' : 'normal'}>
                      {daysLabel(entry)}
                    </Text>
                  </Td>

                  {/* Source ticket */}
                  <Td>
                    {entry.last_used_in_ticket || entry.source_ticket ? (
                      <Text fontSize="2xs" color="blue.400" fontFamily="mono">
                        #{entry.last_used_in_ticket || entry.source_ticket}
                      </Text>
                    ) : (
                      <Text fontSize="2xs" color="gray.700">—</Text>
                    )}
                  </Td>

                  {/* Actions */}
                  <Td>
                    <HStack spacing={1} flexWrap="nowrap">
                      {/* Keep — no API call, just visual */}
                      <Tooltip label="Leave as-is (no change)" fontSize="2xs">
                        <Button size="2xs" variant="ghost" colorScheme="gray"
                          fontSize="2xs" px={1}
                          isDisabled={rowLoading[entry.id]}
                        >
                          ✓
                        </Button>
                      </Tooltip>
                      {/* Mark Useful */}
                      {(entry.state ?? 'observed') !== 'useful' && (entry.state ?? 'observed') !== 'promoted' && (
                        <Tooltip label="Mark useful" fontSize="2xs">
                          <Button size="2xs" variant="outline" colorScheme="blue"
                            fontSize="2xs" px={1}
                            isLoading={rowLoading[entry.id]}
                            onClick={() => rowAction(entry.id, 'useful')}
                          >
                            U
                          </Button>
                        </Tooltip>
                      )}
                      {/* Promote */}
                      {(entry.state ?? 'observed') !== 'promoted' && (
                        <Tooltip label="Promote" fontSize="2xs">
                          <Button size="2xs" variant="outline" colorScheme="green"
                            fontSize="2xs" px={1}
                            isLoading={rowLoading[entry.id]}
                            onClick={() => rowAction(entry.id, 'promoted')}
                          >
                            ↑
                          </Button>
                        </Tooltip>
                      )}
                      {/* Suppress */}
                      {(entry.state ?? 'observed') !== 'suppressed' && (
                        <Tooltip label="Suppress" fontSize="2xs">
                          <Button size="2xs" variant="outline" colorScheme="red"
                            fontSize="2xs" px={1}
                            isLoading={rowLoading[entry.id]}
                            onClick={() => rowAction(entry.id, 'suppressed')}
                          >
                            ✕
                          </Button>
                        </Tooltip>
                      )}
                      {/* Restore (if suppressed) */}
                      {(entry.state === 'suppressed' || entry.archived_at) && (
                        <Tooltip label="Restore to observed" fontSize="2xs">
                          <Button size="2xs" variant="outline" colorScheme="yellow"
                            fontSize="2xs" px={1}
                            isLoading={rowLoading[entry.id]}
                            onClick={() => rowAction(entry.id, 'observed')}
                          >
                            ↩
                          </Button>
                        </Tooltip>
                      )}
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
      )}

      {/* ── Detail Drawer ─────────────────────────────────────────────────── */}
      {drawer && (
        <Box
          position="fixed" top={0} right={0} h="100vh" w={{ base: '100vw', md: '420px' }}
          bg="gray.900" border="1px solid" borderColor="blue.700" zIndex={1000}
          overflowY="auto" p={5} shadow="2xl"
        >
          <Flex justify="space-between" align="center" mb={4}>
            <Text fontSize="sm" fontWeight="bold" color="blue.300">🧠 Intel Detail</Text>
            <Button size="xs" variant="ghost" colorScheme="gray" onClick={() => setDrawer(null)}>✕ Close</Button>
          </Flex>

          <VStack align="stretch" spacing={4} fontSize="sm">
            <Box>
              <Text fontSize="2xs" color="blue.400" fontFamily="mono" mb={1}>PATTERN</Text>
              <Text fontWeight="bold" color="white">{drawer.pattern}</Text>
            </Box>
            <Box>
              <Text fontSize="2xs" color="gray.400" fontFamily="mono" mb={1}>OBSERVATION</Text>
              <Text color="gray.300" lineHeight="tall" fontSize="xs">{drawer.observation}</Text>
            </Box>
            <Box>
              <Text fontSize="2xs" color="green.400" fontFamily="mono" mb={1}>RESOLUTION</Text>
              <Text color="gray.200" lineHeight="tall" fontSize="xs">{drawer.resolution}</Text>
            </Box>

            <Divider borderColor="gray.700" />

            {/* Lifecycle fields */}
            <SimpleGrid columns={2} gap={3} fontSize="xs">
              <Box>
                <Text color="gray.500" mb={1} fontSize="2xs">STATE</Text>
                <Badge colorScheme={stateScheme[drawer.state ?? 'observed']}>{drawer.state ?? 'observed'}</Badge>
              </Box>
              <Box>
                <Text color="gray.500" mb={1} fontSize="2xs">INTEGRATION</Text>
                <Badge colorScheme={integScheme[drawer.integration ?? 'general']} variant="subtle">{drawer.integration ?? 'general'}</Badge>
              </Box>
              <Box>
                <Text color="gray.500" mb={1} fontSize="2xs">SCOPE</Text>
                <Badge colorScheme={scopeScheme[drawer.scope_normalized ?? 'company_private']} variant="outline">
                  {drawer.scope_normalized === 'tool_shared' ? 'tool shared' : 'company private'}
                </Badge>
              </Box>
              <Box>
                <Text color="gray.500" mb={1} fontSize="2xs">CONFIDENCE</Text>
                <Badge colorScheme={confScheme[drawer.confidence]}>{drawer.confidence}</Badge>
              </Box>
              <Box>
                <Text color="gray.500" mb={1} fontSize="2xs">USED COUNT</Text>
                <Text color={(drawer.used_count ?? 0) === 0 ? 'orange.400' : 'gray.200'}>{drawer.used_count ?? 0}</Text>
              </Box>
              <Box>
                <Text color="gray.500" mb={1} fontSize="2xs">LAST USED</Text>
                <Text color={daysColor(drawer)}>{daysLabel(drawer)}</Text>
              </Box>
              {drawer.last_used_in_ticket && (
                <Box>
                  <Text color="gray.500" mb={1} fontSize="2xs">LAST TICKET</Text>
                  <Text color="blue.400" fontFamily="mono">#{drawer.last_used_in_ticket}</Text>
                </Box>
              )}
              {drawer.last_used_by_flow && (
                <Box>
                  <Text color="gray.500" mb={1} fontSize="2xs">LAST FLOW</Text>
                  <Text color="gray.300">{drawer.last_used_by_flow}</Text>
                </Box>
              )}
              {drawer.source_ticket && (
                <Box>
                  <Text color="gray.500" mb={1} fontSize="2xs">SOURCE TICKET</Text>
                  <Text color="blue.400" fontFamily="mono">#{drawer.source_ticket}</Text>
                </Box>
              )}
              <Box>
                <Text color="gray.500" mb={1} fontSize="2xs">OBSERVED</Text>
                <Text color="gray.400">{timeAgo(drawer.observed_at)}</Text>
              </Box>
            </SimpleGrid>

            {drawer.tags?.length > 0 && (
              <HStack flexWrap="wrap" spacing={1}>
                {drawer.tags.map((t: string, i: number) => (
                  <Badge key={i} variant="outline" colorScheme="gray" fontSize="2xs">{t}</Badge>
                ))}
              </HStack>
            )}

            <Divider borderColor="gray.700" />

            {/* Drawer actions */}
            <Text fontSize="2xs" color="gray.500" fontFamily="mono">LIFECYCLE ACTIONS</Text>
            <HStack flexWrap="wrap" spacing={2}>
              <Button size="xs" colorScheme="blue" variant="outline"
                isLoading={rowLoading[drawer.id]}
                onClick={() => rowAction(drawer.id, 'useful')}
                isDisabled={(drawer.state === 'useful' || drawer.state === 'promoted')}
              >
                Mark Useful
              </Button>
              <Button size="xs" colorScheme="green" variant="outline"
                isLoading={rowLoading[drawer.id]}
                onClick={() => rowAction(drawer.id, 'promoted')}
                isDisabled={drawer.state === 'promoted'}
              >
                ↑ Promote
              </Button>
              <Button size="xs" colorScheme="red" variant="outline"
                isLoading={rowLoading[drawer.id]}
                onClick={() => rowAction(drawer.id, 'suppressed')}
                isDisabled={drawer.state === 'suppressed'}
              >
                ✕ Suppress
              </Button>
              <Button size="xs" colorScheme="gray" variant="outline"
                isLoading={bulkLoading}
                onClick={async () => { await bulkAction('archive'); setDrawer(null); }}
                isDisabled={!!drawer.archived_at}
              >
                🗄 Archive
              </Button>
              {(drawer.state === 'suppressed' || drawer.archived_at) && (
                <Button size="xs" colorScheme="yellow" variant="outline"
                  isLoading={rowLoading[drawer.id]}
                  onClick={() => rowAction(drawer.id, 'observed')}
                >
                  ↩ Restore
                </Button>
              )}
            </HStack>

            {/* Integration setter */}
            <Box>
              <Text fontSize="2xs" color="gray.500" fontFamily="mono" mb={2}>SET INTEGRATION</Text>
              <HStack spacing={2}>
                {['msp','programming','general'].map(integ => (
                  <Button key={integ} size="xs"
                    variant={drawer.integration === integ ? 'solid' : 'outline'}
                    colorScheme={integScheme[integ]}
                    isLoading={rowLoading[drawer.id]}
                    onClick={() => rowAction(drawer.id, drawer.state ?? 'observed', integ)}
                  >
                    {integ}
                  </Button>
                ))}
              </HStack>
            </Box>
          </VStack>
        </Box>
      )}
    </Box>
  );
}



// FST-085: Research candidate card type
interface ResearchCandidate {
  id: string;
  title: string;
  pattern: string;
  observation: string;
  resolution: string;
  tool_id: string;
  confidence: string;
  proposed_tags: string[];
  source_label: string;
  risk_note: string;
}

// ── FST-085: ResearchTab Component ───────────────────────────────────────────
function ResearchTab() {
  const { user } = useUser();

  // Form state
  const [tool, setTool] = React.useState('');
  const [problem, setProblem] = React.useState('');
  const [sourcePreference, setSourcePreference] = React.useState('existing_intel');
  const [outputType, setOutputType] = React.useState('troubleshooting_pattern');
  const [scopeTarget, setScopeTarget] = React.useState('tenant_private');

  // Results state
  const [candidates, setCandidates] = React.useState<ResearchCandidate[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [dismissed, setDismissed] = React.useState<string[]>([]);
  const [saveStatus, setSaveStatus] = React.useState<Record<string, string>>({});

  const handleResearch = async () => {
    if (!tool.trim() || !problem.trim()) {
      setError('Tool/Product and Problem focus are required.');
      return;
    }
    setError('');
    setLoading(true);
    setCandidates([]);
    setSaveStatus({});
    setDismissed([]);
    try {
      const res = await pmFetch('/api/intel/research', API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: tool.trim(),
          problem: problem.trim(),
          source_preference: sourcePreference,
          output_type: outputType,
          scope_target: scopeTarget,
        }),
      }) as ResearchCandidate[];
      setCandidates(Array.isArray(res) ? res : []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Research failed: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (candidate: ResearchCandidate, saveAs: string) => {
    setSaveStatus(prev => ({ ...prev, [candidate.id]: 'saving' }));
    try {
      await pmFetch('/api/intel/research/save', API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidate, save_as: saveAs }),
      });
      setSaveStatus(prev => ({
        ...prev,
        [candidate.id]: saveAs === 'msp_shared_candidate'
          ? 'msp_saved'
          : 'private_saved',
      }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setSaveStatus(prev => ({ ...prev, [candidate.id]: `error:${msg}` }));
    }
  };

  const handleDismiss = (id: string) => {
    setDismissed(prev => [...prev, id]);
  };

  const visibleCandidates = candidates.filter(c => !dismissed.includes(c.id));

  const inputStyle = {
    bg: 'gray.800',
    borderColor: 'gray.600',
    color: 'white',
    _placeholder: { color: 'gray.500' },
    _focus: { borderColor: 'blue.400' },
  };

  return (
    <Box pt={4}>
      {/* Research Form */}
      <Box bg="gray.800" p={5} borderRadius="md" mb={5} border="1px solid" borderColor="gray.700">
        <Text fontSize="md" fontWeight="bold" color="white" mb={1}>🔬 Intel Research</Text>
        <Text fontSize="xs" color="gray.500" mb={4}>Candidates are AI-synthesised from existing intel and general knowledge. Unverified until saved and reviewed. MSP shared candidates are submitted as <strong>observed</strong> only.</Text>
        <VStack spacing={4} align="stretch">
          <FormControl isRequired>
            <FormLabel color="gray.300" fontSize="sm">Tool / Product</FormLabel>
            <Input
              {...inputStyle}
              placeholder="e.g. dentrix, quickbooks, office365"
              value={tool}
              onChange={e => setTool(e.target.value)}
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel color="gray.300" fontSize="sm">Problem Focus</FormLabel>
            <Textarea
              {...inputStyle}
              placeholder="Describe the issue or topic to research…"
              value={problem}
              onChange={e => setProblem(e.target.value)}
              rows={3}
            />
          </FormControl>

          <Flex gap={4} direction={{ base: 'column', md: 'row' }}>
            <FormControl>
              <FormLabel color="gray.300" fontSize="sm">Source Preference</FormLabel>
              <Select
                {...inputStyle}
                value={sourcePreference}
                onChange={e => setSourcePreference(e.target.value)}
              >
                <option value="existing_intel">Existing Signal Intel</option>
                <option value="msp_field">MSP Field Knowledge</option>
                <option value="vendor_doc_placeholder" disabled>Vendor Docs (coming soon)</option>
                <option value="community_placeholder" disabled>Community Hints (coming soon)</option>
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel color="gray.300" fontSize="sm">Output Type</FormLabel>
              <Select
                {...inputStyle}
                value={outputType}
                onChange={e => setOutputType(e.target.value)}
              >
                <option value="troubleshooting_pattern">Troubleshooting Pattern</option>
                <option value="install_requirement">Install Requirement</option>
                <option value="known_issue">Known Issue</option>
                <option value="compatibility_note">Compatibility Note</option>
                <option value="common_fix">Common Fix</option>
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel color="gray.300" fontSize="sm">Scope</FormLabel>
              <Select
                {...inputStyle}
                value={scopeTarget}
                onChange={e => setScopeTarget(e.target.value)}
              >
                <option value="tenant_private">Tenant-Private</option>
                <option value="msp_shared_candidate">MSP Shared Candidate (observed — pending review)</option>
              </Select>
            </FormControl>
          </Flex>

          <Button
            colorScheme="blue"
            onClick={handleResearch}
            isLoading={loading}
            loadingText="Researching…"
            alignSelf="flex-start"
          >
            🔬 Research
          </Button>
        </VStack>
      </Box>

      {/* Error */}
      {error && (
        <Box bg="red.900" border="1px solid" borderColor="red.600" borderRadius="md" p={3} mb={4}>
          <Text color="red.200" fontSize="sm">⛔ {error}</Text>
        </Box>
      )}

      {/* Loading */}
      {loading && (
        <Flex justify="center" py={8}>
          <Spinner size="xl" color="blue.400" />
          <Text ml={4} color="gray.400" alignSelf="center">Synthesizing intel candidates…</Text>
        </Flex>
      )}

      {/* Empty state */}
      {!loading && !error && candidates.length > 0 && visibleCandidates.length === 0 && (
        <Text color="gray.500" textAlign="center" py={6}>All candidates dismissed.</Text>
      )}
      {!loading && !error && candidates.length === 0 && tool && (
        <Text color="gray.500" textAlign="center" py={6}>No candidates found. Try adjusting your search.</Text>
      )}

      {/* Candidate Cards */}
      <VStack spacing={4} align="stretch">
        {visibleCandidates.map(card => {
          const status = saveStatus[card.id];
          const isUnverified = card.proposed_tags?.some((t: string) => t === 'src:tower' || t === 'src:unverified');

          return (
            <Box
              key={card.id}
              bg="gray.800"
              border="1px solid"
              borderColor="gray.700"
              borderRadius="md"
              p={4}
            >
              {/* Title + confidence */}
              <Flex justify="space-between" align="flex-start" mb={2}>
                <Text fontWeight="bold" color="white" fontSize="sm" flex={1} mr={2}>{card.title}</Text>
                <Badge
                  colorScheme={card.confidence === 'high' ? 'green' : card.confidence === 'medium' ? 'yellow' : 'red'}
                  fontSize="xs"
                  flexShrink={0}
                >
                  {card.confidence}
                </Badge>
              </Flex>

              {/* Observation */}
              {card.observation && (
                <Box mb={2}>
                  <Text fontSize="xs" color="gray.400" fontWeight="semibold" mb={1}>OBSERVATION</Text>
                  <Text fontSize="sm" color="gray.200">{card.observation}</Text>
                </Box>
              )}

              {/* Resolution */}
              {card.resolution && (
                <Box mb={2}>
                  <Text fontSize="xs" color="gray.400" fontWeight="semibold" mb={1}>RESOLUTION</Text>
                  <Text fontSize="sm" color="gray.200">{card.resolution}</Text>
                </Box>
              )}

              {/* Tags */}
              {card.proposed_tags?.length > 0 && (
                <Flex wrap="wrap" gap={1} mb={2}>
                  {card.proposed_tags.map((tag: string) => (
                    <Badge key={tag} colorScheme="gray" fontSize="xs" variant="outline">{tag}</Badge>
                  ))}
                </Flex>
              )}

              {/* Source label */}
              {card.source_label && (
                <Text fontSize="xs" color="gray.500" fontStyle="italic" mb={2}>{card.source_label}</Text>
              )}

              {/* Risk note */}
              {isUnverified && (
                <Box bg="orange.900" border="1px solid" borderColor="orange.600" borderRadius="sm" px={2} py={1} mb={3}>
                  <Text fontSize="xs" color="orange.200">⚠️ {card.risk_note || 'Unverified — AI-synthesised from general knowledge. Review before saving or sharing.'}</Text>
                </Box>
              )}

              {/* Status messages */}
              {status === 'private_saved' && (
                <Box bg="green.900" border="1px solid" borderColor="green.600" borderRadius="sm" px={2} py={1} mb={3}>
                  <Text fontSize="xs" color="green.200">✅ Saved to your private intel</Text>
                </Box>
              )}
              {status === 'msp_saved' && (
                <Box bg="green.900" border="1px solid" borderColor="green.600" borderRadius="sm" px={2} py={1} mb={3}>
                  <Text fontSize="xs" color="green.200">✅ Submitted as MSP shared candidate (pending review)</Text>
                </Box>
              )}
              {status && status.startsWith('error:') && (
                <Box bg="red.900" border="1px solid" borderColor="red.600" borderRadius="sm" px={2} py={1} mb={3}>
                  <Text fontSize="xs" color="red.200">⛔ {status.replace('error:', 'Submission blocked: ')}</Text>
                </Box>
              )}

              {/* Action buttons */}
              {!status || status === 'saving' ? (
                <Flex gap={2} wrap="wrap">
                  <Button
                    size="xs"
                    colorScheme="blue"
                    variant="outline"
                    isLoading={status === 'saving'}
                    onClick={() => handleSave(card, 'tenant_private')}
                  >
                    💾 Save as Private Intel
                  </Button>
                  <Button
                    size="xs"
                    colorScheme="purple"
                    variant="outline"
                    isLoading={status === 'saving'}
                    onClick={() => handleSave(card, 'msp_shared_candidate')}
                  >
                    📤 Submit as MSP Candidate
                  </Button>
                  <Button
                    size="xs"
                    colorScheme="gray"
                    variant="ghost"
                    onClick={() => handleDismiss(card.id)}
                  >
                    ✕ Dismiss
                  </Button>
                </Flex>
              ) : null}
            </Box>
          );
        })}
      </VStack>
    </Box>
  );
}
// ── End FST-085 ResearchTab ───────────────────────────────────────────────────



// ─── CLIENT-STORY-003: BriefClient interface ──────────────────────────────
interface BriefClient {
  client_key:          string;
  client_display_name: string;
  brief_count:         number;
  last_closed_at:      string | null;
  data_quality:        'empty' | 'thin' | 'usable';
}

// ─── CLIENT-STORY-002: ClientStoryPanel ──────────────────────────────────────
interface FcbTrustSummary {
  avg_at_open: number | null;
  avg_at_close: number | null;
  delta: number | null;
  trend: 'improving' | 'declining' | 'stable' | 'unknown';
  latest: number | null;
  min_in_window: number | null;
}

interface ClientStoryData {
  client_key: string;
  client_display_name: string | null;
  generated_at: string;
  window_days: number;
  window_from: string;
  window_to: string;
  data_quality: 'empty' | 'thin' | 'usable';
  has_pre_fcb_history?: boolean;
  summary: {
    total_briefs: number;
    outcome_distribution: Record<string, number>;
    open_risk_count: number;
    trust: FcbTrustSummary;
    expectation_drift: Record<string, number>;
    confidence_distribution: Record<string, number>;
    low_confidence_count: number;
  };
  issue_patterns: {
    category_counts: { category: string; count: number }[];
    recurring_categories: string[];
    impact_distribution: Record<string, number>;
    emotion_distribution: Record<string, number>;
    asset_type_counts: { type: string; count: number }[];
    asset_hostname_counts: { hostname: string; count: number }[];
  };
  risk_indicators: {
    unresolved_briefs: {
      brief_id: string;
      ticket_key: string;
      outcome_type: string;
      issue_category: string | null;
      impact_level: string | null;
      closed_at: string;
    }[];
    missing_context_pattern_counts: Record<string, number>;
    high_emotion_count: number;
    risk_flag_summary: string[];
  };
  timeline: {
    brief_id: string;
    ticket_key: string;
    outcome_type: string | null;
    issue_category: string | null;
    impact_level: string | null;
    trust_at_close: number | null;
    confidence: string | null;
    missing_context_flags: string[];
    ai_generated: boolean;
    closed_at: string;
    // FCB-PHI-001E: scrubbed prose fields (never expose raw ai_close_note)
    ai_close_note_scrubbed: string | null;
    phi_flags: string[] | null;
    phi_scrubbed_at: string | null;
  }[];
}

function trustTrendColor(trend: string): string {
  if (trend === 'improving') return 'green.400';
  if (trend === 'declining') return 'red.400';
  return 'gray.400';
}

function trustTrendIcon(trend: string): string {
  if (trend === 'improving') return '↑';
  if (trend === 'declining') return '↓';
  if (trend === 'stable')    return '→';
  return '?';
}

function dataQualityScheme(q: string): string {
  if (q === 'usable') return 'green';
  if (q === 'thin')   return 'orange';
  return 'gray';
}

function outcomeScheme(outcome: string): string {
  if (outcome === 'resolved')  return 'green';
  if (outcome === 'mitigated') return 'blue';
  if (outcome === 'at_risk')   return 'orange';
  if (outcome === 'escalated') return 'red';
  return 'gray';
}

function impactScheme(level: string): string {
  if (level === 'high')   return 'red';
  if (level === 'medium') return 'orange';
  if (level === 'low')    return 'green';
  return 'gray';
}

function confSchemeStory(c: string): string {
  if (c === 'high')       return 'green';
  if (c === 'standard')   return 'blue';
  if (c === 'low')        return 'orange';
  if (c === 'incomplete') return 'red';
  return 'gray';
}

function fmtTrust(v: number | null): string {
  if (v == null) return '—';
  return (v * 100).toFixed(0) + '%';
}

// FCB-PHI-001E: prose display state helper
// SYNC WARNING: phi pattern logic must stay in sync with _scrub_phi() in api.py
// and scripts/backfill_phi_scrub.py. See FCB-PHI-SHARED-001 for unification ticket.
// NEVER reference raw ai_close_note — intentionally absent from ClientStoryData type.
type ProseState = 'suppress' | 'clean' | 'redacted';

function proseDisplayState(t: {
  ai_close_note_scrubbed: string | null;
  phi_flags: string[] | null;
  phi_scrubbed_at: string | null;
}): ProseState {
  if (!t.phi_scrubbed_at)                          return 'suppress'; // not yet processed
  if (!t.ai_close_note_scrubbed)                   return 'suppress'; // no scrubbed prose stored
  if ((t.phi_flags ?? []).includes('NO_PROSE'))    return 'suppress'; // source note was null
  if ((t.phi_flags ?? []).length === 0)            return 'clean';
  return 'redacted';
}

function ClientStoryPanel({ clientKey }: { clientKey: string }) {
  const [story, setStory]     = React.useState<ClientStoryData | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError]     = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!clientKey) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setStory(null);
    pmFetch(`/api/clients/${encodeURIComponent(clientKey)}/story`, '/pm-api')
      .then((d) => { if (!cancelled) setStory(d as ClientStoryData); })
      .catch((e) => { if (!cancelled) setError(String(e?.message ?? 'Failed to load story')); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [clientKey]);

  // FCB-PHI-001E: track expanded prose per timeline item
  // clean items pre-expanded; redacted items collapsed until user opens
  const [expandedBriefs, setExpandedBriefs] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    if (!story) return;
    const cleanIds = new Set(
      story.timeline
        .filter(t => proseDisplayState(t) === 'clean')
        .map(t => t.brief_id)
    );
    setExpandedBriefs(cleanIds);
  }, [story?.generated_at]);

  function toggleProseExpand(briefId: string) {
    setExpandedBriefs(prev => {
      const next = new Set(prev);
      if (next.has(briefId)) next.delete(briefId);
      else next.add(briefId);
      return next;
    });
  }

  if (loading) return (
    <Flex py={8} align="center" justify="center" gap={3}>
      <Spinner size="sm" color="blue.400" />
      <Text fontSize="sm" color="gray.400">Loading client story…</Text>
    </Flex>
  );

  if (error) return (
    <Box p={3} bg="red.900" border="1px solid" borderColor="red.600" borderRadius="md">
      <Text fontSize="sm" color="red.200">⛔ {error}</Text>
    </Box>
  );

  if (!story) return null;

  const { summary, issue_patterns: ip, risk_indicators: ri, timeline, data_quality, has_pre_fcb_history } = story;

  // ── Empty state ──────────────────────────────────────────────────────────
  if (data_quality === 'empty') return (
    <Box py={6} px={4} bg="gray.800" borderRadius="md" border="1px solid" borderColor="gray.700">
      <VStack spacing={2} align="center">
        <Text fontSize="2xl">📋</Text>
        <Text color="gray.300" fontWeight="medium">No closed brief history yet</Text>
        <Text fontSize="xs" color="gray.500" textAlign="center">
          Final Closed Briefs are generated when tickets are closed. History will appear here as tickets complete.
        </Text>
        {has_pre_fcb_history && (
          <Box mt={2} p={2} bg="blue.900" borderRadius="sm" border="1px solid" borderColor="blue.700">
            <Text fontSize="xs" color="blue.300">ℹ️ This client has older closed tickets from before the Brief system was activated. History shown from activation onward.</Text>
          </Box>
        )}
      </VStack>
    </Box>
  );

  return (
    <VStack align="stretch" spacing={4}>
      {/* ── Header strip ────────────────────────────────────────────────── */}
      <Flex justify="space-between" align="center" flexWrap="wrap" gap={2}>
        <HStack spacing={2}>
          <Text fontSize="sm" fontWeight="bold" color="gray.100">
            {story.client_display_name ?? story.client_key}
          </Text>
          <Badge colorScheme={dataQualityScheme(data_quality)} fontSize="2xs">
            {data_quality === 'thin' ? '⚠️ thin data' : '✅ usable'}
          </Badge>
          {has_pre_fcb_history && (
            <Badge colorScheme="gray" fontSize="2xs" variant="outline">pre-brief history exists</Badge>
          )}
        </HStack>
        <Text fontSize="2xs" color="gray.600">
          {story.window_days}d window · {summary.total_briefs} brief{summary.total_briefs !== 1 ? 's' : ''} · generated {timeAgo(story.generated_at)}
        </Text>
      </Flex>

      {/* ── Thin data warning ────────────────────────────────────────────── */}
      {data_quality === 'thin' && (
        <Box p={2} bg="orange.900" border="1px solid" borderColor="orange.700" borderRadius="md">
          <Text fontSize="xs" color="orange.200">
            ⚠️ Only {summary.total_briefs} brief{summary.total_briefs !== 1 ? 's' : ''} in this window — patterns may not be representative.
          </Text>
        </Box>
      )}

      {/* ── Summary row ─────────────────────────────────────────────────── */}
      <SimpleGrid columns={{ base: 2, md: 4 }} gap={3}>
        <Box p={3} bg="gray.800" borderRadius="md" border="1px solid" borderColor="gray.700">
          <Text fontSize="2xs" color="gray.500" mb={1}>TOTAL BRIEFS</Text>
          <Text fontSize="xl" fontWeight="bold" color="white">{summary.total_briefs}</Text>
        </Box>
        <Box p={3} bg="gray.800" borderRadius="md" border="1px solid" borderColor="gray.700">
          <Text fontSize="2xs" color="gray.500" mb={1}>OPEN RISK</Text>
          <Text fontSize="xl" fontWeight="bold" color={summary.open_risk_count > 0 ? 'orange.400' : 'green.400'}>
            {summary.open_risk_count}
          </Text>
        </Box>
        <Box p={3} bg="gray.800" borderRadius="md" border="1px solid" borderColor="gray.700">
          <Text fontSize="2xs" color="gray.500" mb={1}>TRUST TREND</Text>
          <HStack spacing={1} align="baseline">
            <Text fontSize="xl" fontWeight="bold" color={trustTrendColor(summary.trust.trend)}>
              {trustTrendIcon(summary.trust.trend)}
            </Text>
            <Text fontSize="sm" color={trustTrendColor(summary.trust.trend)}>{summary.trust.trend}</Text>
          </HStack>
          <Text fontSize="2xs" color="gray.500">
            {fmtTrust(summary.trust.avg_at_open)} → {fmtTrust(summary.trust.avg_at_close)}
          </Text>
        </Box>
        <Box p={3} bg="gray.800" borderRadius="md" border="1px solid" borderColor="gray.700">
          <Text fontSize="2xs" color="gray.500" mb={1}>LOW CONFIDENCE</Text>
          <Text fontSize="xl" fontWeight="bold" color={summary.low_confidence_count > 0 ? 'orange.400' : 'green.400'}>
            {summary.low_confidence_count}
          </Text>
        </Box>
      </SimpleGrid>

      {/* ── Outcome + Expectation Drift ─────────────────────────────────── */}
      <SimpleGrid columns={{ base: 1, md: 2 }} gap={3}>
        <Box p={3} bg="gray.800" borderRadius="md" border="1px solid" borderColor="gray.700">
          <Text fontSize="2xs" color="gray.500" mb={2} fontFamily="mono">OUTCOME DISTRIBUTION</Text>
          <HStack spacing={2} flexWrap="wrap">
            {Object.entries(summary.outcome_distribution).map(([k, v]) => (
              <Badge key={k} colorScheme={outcomeScheme(k)} fontSize="xs">
                {k}: {v}
              </Badge>
            ))}
          </HStack>
        </Box>
        <Box p={3} bg="gray.800" borderRadius="md" border="1px solid" borderColor="gray.700">
          <Text fontSize="2xs" color="gray.500" mb={2} fontFamily="mono">EXPECTATION DRIFT</Text>
          <HStack spacing={2} flexWrap="wrap">
            {Object.entries(summary.expectation_drift).map(([k, v]) => (
              <Badge key={k} colorScheme={k === 'met' ? 'green' : k === 'unmet' ? 'red' : 'gray'} fontSize="xs">
                {k}: {v}
              </Badge>
            ))}
          </HStack>
        </Box>
      </SimpleGrid>

      {/* ── Trust detail + Confidence ────────────────────────────────────── */}
      <SimpleGrid columns={{ base: 1, md: 2 }} gap={3}>
        <Box p={3} bg="gray.800" borderRadius="md" border="1px solid" borderColor="gray.700">
          <Text fontSize="2xs" color="gray.500" mb={2} fontFamily="mono">TRUST DETAIL</Text>
          <SimpleGrid columns={3} gap={2}>
            <Box>
              <Text fontSize="2xs" color="gray.600">latest</Text>
              <Text fontSize="sm" color="white" fontWeight="semibold">{fmtTrust(summary.trust.latest)}</Text>
            </Box>
            <Box>
              <Text fontSize="2xs" color="gray.600">avg close</Text>
              <Text fontSize="sm" color="white" fontWeight="semibold">{fmtTrust(summary.trust.avg_at_close)}</Text>
            </Box>
            <Box>
              <Text fontSize="2xs" color="gray.600">min</Text>
              <Text fontSize="sm" color={summary.trust.min_in_window != null && summary.trust.min_in_window < 0.4 ? 'red.400' : 'white'} fontWeight="semibold">
                {fmtTrust(summary.trust.min_in_window)}
              </Text>
            </Box>
          </SimpleGrid>
        </Box>
        <Box p={3} bg="gray.800" borderRadius="md" border="1px solid" borderColor="gray.700">
          <Text fontSize="2xs" color="gray.500" mb={2} fontFamily="mono">CONFIDENCE</Text>
          <HStack spacing={2} flexWrap="wrap">
            {Object.entries(summary.confidence_distribution).map(([k, v]) => (
              <Badge key={k} colorScheme={confSchemeStory(k)} fontSize="xs">
                {k}: {v}
              </Badge>
            ))}
          </HStack>
        </Box>
      </SimpleGrid>

      {/* ── Issue Patterns ───────────────────────────────────────────────── */}
      <Box p={3} bg="gray.800" borderRadius="md" border="1px solid" borderColor="gray.700">
        <Text fontSize="2xs" color="gray.500" mb={3} fontFamily="mono">ISSUE PATTERNS</Text>
        <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
          <Box>
            <Text fontSize="2xs" color="gray.600" mb={1}>Categories</Text>
            <VStack align="stretch" spacing={1}>
              {ip.category_counts.slice(0, 6).map(({ category, count }) => (
                <Flex key={category} justify="space-between" align="center">
                  <HStack spacing={1}>
                    <Text fontSize="xs" color="gray.200">{category || '—'}</Text>
                    {ip.recurring_categories.includes(category) && (
                      <Badge colorScheme="orange" fontSize="2xs" variant="subtle">recurring</Badge>
                    )}
                  </HStack>
                  <Text fontSize="xs" color="gray.400">{count}</Text>
                </Flex>
              ))}
              {ip.category_counts.length === 0 && <Text fontSize="xs" color="gray.600">None recorded</Text>}
            </VStack>
          </Box>
          <Box>
            <Text fontSize="2xs" color="gray.600" mb={1}>Impact</Text>
            <HStack spacing={2} flexWrap="wrap">
              {Object.entries(ip.impact_distribution).map(([k, v]) => (
                <Badge key={k} colorScheme={impactScheme(k)} fontSize="xs">{k}: {v}</Badge>
              ))}
            </HStack>
            <Text fontSize="2xs" color="gray.600" mt={3} mb={1}>Emotion</Text>
            <HStack spacing={2} flexWrap="wrap">
              {Object.entries(ip.emotion_distribution).map(([k, v]) => (
                <Badge key={k} colorScheme={k === 'frustrated' || k === 'urgent' ? 'orange' : 'gray'} fontSize="xs" variant="subtle">
                  {k}: {v}
                </Badge>
              ))}
            </HStack>
          </Box>
          <Box>
            <Text fontSize="2xs" color="gray.600" mb={1}>Asset Types</Text>
            <VStack align="stretch" spacing={1}>
              {ip.asset_type_counts.slice(0, 4).map(({ type, count }) => (
                <Flex key={type} justify="space-between">
                  <Text fontSize="xs" color="gray.200">{type || '—'}</Text>
                  <Text fontSize="xs" color="gray.400">{count}</Text>
                </Flex>
              ))}
              {ip.asset_type_counts.length === 0 && <Text fontSize="xs" color="gray.600">None recorded</Text>}
            </VStack>
          </Box>
        </SimpleGrid>
      </Box>

      {/* ── Risk Indicators ──────────────────────────────────────────────── */}
      {(ri.unresolved_briefs.length > 0 || ri.high_emotion_count > 0 || ri.risk_flag_summary.length > 0) && (
        <Box p={3} bg="gray.800" borderRadius="md" border="1px solid" borderColor="red.800">
          <Text fontSize="2xs" color="red.400" mb={3} fontFamily="mono">RISK INDICATORS</Text>
          <VStack align="stretch" spacing={2}>
            {ri.unresolved_briefs.length > 0 && (
              <Box>
                <Text fontSize="2xs" color="gray.500" mb={1}>Unresolved / At-Risk</Text>
                <VStack align="stretch" spacing={1}>
                  {ri.unresolved_briefs.map((b) => (
                    <Flex key={b.brief_id} justify="space-between" align="center"
                      p={1} bg="gray.750" borderRadius="sm" flexWrap="wrap" gap={1}>
                      <HStack spacing={2}>
                        <Text fontSize="xs" color="blue.400" fontFamily="mono">#{b.ticket_key}</Text>
                        <Badge colorScheme={outcomeScheme(b.outcome_type)} fontSize="2xs">{b.outcome_type}</Badge>
                        {b.issue_category && (
                          <Text fontSize="2xs" color="gray.400">{b.issue_category}</Text>
                        )}
                      </HStack>
                      <Text fontSize="2xs" color="gray.600">{b.closed_at ? timeAgo(b.closed_at) : '—'}</Text>
                    </Flex>
                  ))}
                </VStack>
              </Box>
            )}
            <HStack spacing={4} flexWrap="wrap">
              {ri.high_emotion_count > 0 && (
                <HStack spacing={1}>
                  <Badge colorScheme="orange" fontSize="xs">😤 high emotion: {ri.high_emotion_count}</Badge>
                </HStack>
              )}
              {ri.risk_flag_summary.length > 0 && (
                <HStack spacing={1} flexWrap="wrap">
                  {ri.risk_flag_summary.map((f) => (
                    <Badge key={f} colorScheme="red" fontSize="xs" variant="outline">{f}</Badge>
                  ))}
                </HStack>
              )}
            </HStack>
            {Object.keys(ri.missing_context_pattern_counts).length > 0 && (
              <Box>
                <Text fontSize="2xs" color="gray.500" mb={1}>Missing Context</Text>
                <HStack spacing={2} flexWrap="wrap">
                  {Object.entries(ri.missing_context_pattern_counts).map(([k, v]) => (
                    <Badge key={k} colorScheme="gray" fontSize="2xs" variant="outline">{k}: {v}</Badge>
                  ))}
                </HStack>
              </Box>
            )}
          </VStack>
        </Box>
      )}

      {/* ── Timeline ─────────────────────────────────────────────────────── */}
      {timeline.length > 0 && (
        <Box p={3} bg="gray.800" borderRadius="md" border="1px solid" borderColor="gray.700">
          <Text fontSize="2xs" color="gray.500" mb={3} fontFamily="mono">RECENT TIMELINE</Text>
          <VStack align="stretch" spacing={2}>
            {timeline.map((t) => {
              const ps = proseDisplayState(t);
              const isExpanded = expandedBriefs.has(t.brief_id);
              return (
                <Box key={t.brief_id}
                  bg="gray.850" borderRadius="sm"
                  border="1px solid"
                  borderColor={ps === 'redacted' ? 'orange.800' : 'gray.700'}>
                  {/* ── Structured row — existing fields unchanged ── */}
                  <Flex justify="space-between" align="center"
                    p={2} flexWrap="wrap" gap={2}>
                    <HStack spacing={2} flexWrap="wrap">
                      <Text fontSize="xs" color="blue.400" fontFamily="mono">#{t.ticket_key}</Text>
                      {t.outcome_type && (
                        <Badge colorScheme={outcomeScheme(t.outcome_type)} fontSize="2xs">{t.outcome_type}</Badge>
                      )}
                      {t.issue_category && (
                        <Text fontSize="2xs" color="gray.400">{t.issue_category}</Text>
                      )}
                      {t.impact_level && (
                        <Badge colorScheme={impactScheme(t.impact_level)} fontSize="2xs" variant="subtle">{t.impact_level}</Badge>
                      )}
                      {t.ai_generated && (
                        <Badge colorScheme="purple" fontSize="2xs" variant="outline">AI</Badge>
                      )}
                    </HStack>
                    <HStack spacing={3}>
                      {t.trust_at_close != null && (
                        <Text fontSize="2xs" color="gray.400">trust {fmtTrust(t.trust_at_close)}</Text>
                      )}
                      {t.confidence && (
                        <Badge colorScheme={confSchemeStory(t.confidence)} fontSize="2xs" variant="subtle">{t.confidence}</Badge>
                      )}
                      <Text fontSize="2xs" color="gray.600">{timeAgo(t.closed_at)}</Text>
                      {/* Prose toggle — only rendered when prose is available */}
                      {ps !== 'suppress' && (
                        <Text
                          fontSize="2xs"
                          color={ps === 'redacted' ? 'orange.400' : 'gray.500'}
                          cursor="pointer"
                          userSelect="none"
                          onClick={() => toggleProseExpand(t.brief_id)}
                          title={ps === 'redacted' ? 'Close note (some content redacted)' : 'Close note'}
                        >
                          {isExpanded ? '▴ note' : '▾ note'}{ps === 'redacted' ? ' ⚠' : ''}
                        </Text>
                      )}
                    </HStack>
                  </Flex>
                  {/* ── Scrubbed prose — PHI-safe, source: ai_close_note_scrubbed only ── */}
                  {ps !== 'suppress' && isExpanded && (
                    <Box
                      px={3} pb={2} pt={1}
                      borderTop="1px solid"
                      borderColor={ps === 'redacted' ? 'orange.800' : 'gray.700'}>
                      {ps === 'redacted' && (
                        <HStack spacing={1} mb={1}>
                          <Badge colorScheme="orange" fontSize="2xs" variant="subtle">⚠ Some content auto-redacted</Badge>
                        </HStack>
                      )}
                      <Text
                        fontSize="xs"
                        color={ps === 'redacted' ? 'orange.200' : 'gray.300'}
                        fontStyle="italic"
                        lineHeight="1.5">
                        {t.ai_close_note_scrubbed}
                      </Text>
                    </Box>
                  )}
                </Box>
              );
            })}
          </VStack>
        </Box>
      )}
    </VStack>
  );
}
// ─── WBL-005b: WorkingBriefSummary interface ────────────────────────────────
interface WorkingBriefSummary {
  brief_id:            string;
  ticket_key:          string;
  workspace_id:        string;
  status:              string;
  ticket_status:       string;
  client_key:          string | null;
  client_display_name: string | null;
  ticket_title:        string | null;
  refresh_status:      string;
  refresh_trigger:     string | null;
  confidence:          string | null;
  notes_since_refresh: number;
  last_refreshed_at:   string | null;
  last_updated:        string;
  created_at:          string;
  situation:           string | null;
  expectation:         string | null;
  constraints:         string | null;
}

// ─── WBL-005b: badge helpers ─────────────────────────────────────────────────
function wbRefreshScheme(s: string | null): string {
  if (s === 'current') return 'green';
  if (s === 'stale')   return 'orange';
  if (s === 'pending') return 'blue';
  if (s === 'failed')  return 'red';
  return 'gray';
}
function wbConfScheme(s: string | null): string {
  if (s === 'high')     return 'green';
  if (s === 'standard') return 'blue';
  if (s === 'low')      return 'yellow';
  return 'gray';
}

// ─── WBL-005b: WorkingBriefCard ──────────────────────────────────────────────
function WorkingBriefCard({
  wb,
  onRefresh,
  isRefreshing,
}: {
  wb: WorkingBriefSummary;
  onRefresh: (key: string) => void;
  isRefreshing: boolean;
}) {
  const { isOpen, onToggle } = useDisclosure();
  return (
    <Box
      border="1px solid" borderColor="blue.800"
      borderRadius="md" p={4} mb={3} bg="gray.850"
    >
      {/* Header row */}
      <Flex justify="space-between" align="center" flexWrap="wrap" gap={2}>
        <HStack spacing={3} flexWrap="wrap">
          <Badge colorScheme="blue" fontSize="0.65em" variant="subtle">Open Working Brief</Badge>
          <Badge colorScheme={wbRefreshScheme(wb.refresh_status)} fontSize="0.65em">
            {wb.refresh_status ?? 'unknown'}
          </Badge>
          {wb.confidence && (
            <Badge colorScheme={wbConfScheme(wb.confidence)} fontSize="0.65em" variant="outline">
              {wb.confidence}
            </Badge>
          )}
          {wb.notes_since_refresh > 0 && (
            <Badge colorScheme="orange" fontSize="0.65em" variant="outline">
              {wb.notes_since_refresh} note{wb.notes_since_refresh !== 1 ? 's' : ''} since refresh
            </Badge>
          )}
        </HStack>
        <HStack spacing={2}>
          <Text fontSize="xs" color="gray.500">
            {timeAgo(wb.last_refreshed_at ?? wb.last_updated)}
          </Text>
          <Button
            size="xs" variant="outline" colorScheme="blue"
            isLoading={isRefreshing}
            isDisabled={isRefreshing}
            onClick={() => onRefresh(wb.ticket_key)}
          >
            ↻ Refresh
          </Button>
          <Button size="xs" variant="ghost" colorScheme="gray" onClick={onToggle}>
            {isOpen ? '▲ Less' : '▼ Details'}
          </Button>
        </HStack>
      </Flex>

      {/* Ticket identity row */}
      <HStack mt={2} spacing={3} flexWrap="wrap">
        <Text fontSize="xs" fontFamily="mono" color="blue.300">{wb.ticket_key}</Text>
        {wb.client_display_name && (
          <Text fontSize="xs" color="gray.400">{wb.client_display_name}</Text>
        )}
        {wb.ticket_title && (
          <Text fontSize="xs" color="gray.300" noOfLines={1}>{wb.ticket_title}</Text>
        )}
      </HStack>

      {/* Expandable details */}
      <Collapse in={isOpen}>
        <Divider my={3} borderColor="gray.700" />
        <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
          {wb.situation && (
            <Box>
              <Text fontSize="2xs" fontWeight="semibold" color="blue.400" mb={1}
                textTransform="uppercase" letterSpacing="wide">Situation</Text>
              <Text fontSize="xs" color="gray.200">{wb.situation}</Text>
            </Box>
          )}
          {wb.expectation && (
            <Box>
              <Text fontSize="2xs" fontWeight="semibold" color="purple.400" mb={1}
                textTransform="uppercase" letterSpacing="wide">Expectation</Text>
              <Text fontSize="xs" color="gray.200">{wb.expectation}</Text>
            </Box>
          )}
          {wb.constraints && (
            <Box>
              <Text fontSize="2xs" fontWeight="semibold" color="orange.400" mb={1}
                textTransform="uppercase" letterSpacing="wide">Constraints</Text>
              <Text fontSize="xs" color="gray.200">{wb.constraints}</Text>
            </Box>
          )}
        </SimpleGrid>
        <HStack mt={3} spacing={4}>
          <Box as="a" href="/pm/brief"
            fontSize="2xs" fontFamily="mono" color="blue.400"
            _hover={{ color: 'blue.300' }}>
            → Open Brief Viewer
          </Box>
          <Text fontSize="2xs" color="gray.600">
            Updated {timeAgo(wb.last_updated)}
          </Text>
        </HStack>
      </Collapse>
    </Box>
  );
}
// ─── End WorkingBriefCard ─────────────────────────────────────────────────────

// ─── End ClientStoryPanel ─────────────────────────────────────────────────────

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
  const [storyClient, setStoryClient] = React.useState<string>(''); // CLIENT-STORY-002
  const [briefClients, setBriefClients]               = React.useState<BriefClient[]>([]);  // CLIENT-STORY-003
  const [briefClientsLoading, setBriefClientsLoading] = React.useState<boolean>(false);      // CLIENT-STORY-003
  const [briefClientsError, setBriefClientsError]     = React.useState<boolean>(false);      // CLIENT-STORY-003
  // WBL-005b: open working briefs state
  const [openWBs,      setOpenWBs]      = useState<WorkingBriefSummary[]>([]);
  const [wbLoading,    setWbLoading]    = useState(false);
  const [wbError,      setWbError]      = useState(false);
  const [wbRefreshing, setWbRefreshing] = useState<Record<string, boolean>>({});

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

  useEffect(() => { fetchIntel(); }, [fetchIntel]);
  useEffect(() => { fetchTrends(); }, [fetchTrends]);

  useEffect(() => {
    pmFetch('/api/intel/filter-options', API)
      .then((d) => setFilterOptions(d as any))
      .catch(() => {});
  }, []);

  // CLIENT-STORY-003: fetch FCB-sourced client list for story selector
  useEffect(() => {
    setBriefClientsLoading(true);
    setBriefClientsError(false);
    pmFetch('/api/briefs/clients', API)
      .then((d: any) => {
        setBriefClients(d?.clients ?? []);
      })
      .catch((e: unknown) => {
        console.warn('[ClientStory] /api/briefs/clients failed — falling back to filterOptions.client_keys:', e);
        setBriefClientsError(true);
      })
      .finally(() => setBriefClientsLoading(false));
  }, []); // mount-only — CLIENT-STORY-003

  // WBL-005b: fetch open working briefs on mount
  useEffect(() => {
    setWbLoading(true);
    setWbError(false);
    pmFetch('/api/working-briefs', API)
      .then((d: unknown) => {
        setOpenWBs((d as any)?.briefs ?? []);
      })
      .catch((e: unknown) => {
        console.error('[WBL] /api/working-briefs failed:', e);
        setWbError(true);
      })
      .finally(() => setWbLoading(false));
  }, []); // mount-only — WBL-005b

  // WBL-005b: manual WB refresh — POST then re-fetch list
  const handleWBRefresh = async (ticketKey: string) => {
    setWbRefreshing(prev => ({ ...prev, [ticketKey]: true }));
    try {
      await pmFetch(
        `/api/tickets/${encodeURIComponent(ticketKey)}/working-brief/refresh`,
        API,
        { method: 'POST' }
      );
      const res = await pmFetch('/api/working-briefs', API);
      setOpenWBs((res as any)?.briefs ?? []);
    } catch (e) {
      console.error('[WBL] refresh failed for', ticketKey, e);
    } finally {
      setWbRefreshing(prev => ({ ...prev, [ticketKey]: false }));
    }
  };

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

  // S6: tools with a non-zero score (have seen real activity)
  const toolsWithScore = tools.filter(t => (t.risk_score?.score ?? 0) > 0);

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
          { label: 'Active Outbreaks', value: active.length,        color: active.length        > 0 ? 'red.400'    : 'green.400' },
          { label: 'At-Risk Clients',  value: atRiskAll.length,     color: atRiskAll.length     > 0 ? 'orange.400' : 'green.400' },
          { label: 'Tools w/ Score',   value: toolsWithScore.length, color: toolsWithScore.length > 0 ? 'orange.300' : 'blue.400' },
          { label: 'Intel Entries',    value: intelEntries.length,  color: intelEntries.length  > 0 ? 'blue.400'   : 'gray.400' },
        ] as {label:string;value:number;color:string}[]).map(({ label, value, color }) => (
          <Box key={label} p={{ base: 2, md: 3 }} borderRadius="md" border="1px" borderColor="gray.700" bg="gray.800" minW={0} overflow="hidden">
            <Stat>
              <StatLabel fontSize="xs" color="gray.500" whiteSpace="normal" lineHeight="short">{label}</StatLabel>
              <StatNumber fontSize={{ base: "xl", md: "2xl" }} color={color}>{value}</StatNumber>
            </Stat>
          </Box>
        ))}
      </SimpleGrid>

      {/* FST-030E: Empty-state banner for zero-history workspaces */}
      {filterOptions.tool_ids.length === 0 && (
        <Box mb={4} p={3} borderRadius="md" border="1px" borderColor="gray.700" bg="gray.850">
          <HStack spacing={3}>
            <Text fontSize="lg">🔍</Text>
            <Box>
              <Text fontSize="xs" fontWeight="medium" color="gray.300">Intel is building</Text>
              <Text fontSize="xs" color="gray.500">
                Intel activates as tickets are processed. Connect your email inbox or create a ticket to start building workspace history.
              </Text>
            </Box>
          </HStack>
        </Box>
      )}
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
            📈 Tool Risk ({toolsWithScore.length} active)
          </Tab>
          <Tab color="gray.400" _selected={{ color: 'white', bg: 'gray.800' }} whiteSpace="nowrap" fontSize={{ base: 'xs', md: 'sm' }}>
            🕐 History ({resolved.length})
          </Tab>
          <Tab color="gray.400" _selected={{ color: 'white', bg: 'gray.800' }} whiteSpace="nowrap" fontSize={{ base: 'xs', md: 'sm' }}>
            🧠 Intel ({intelEntries.length})
          </Tab>
          <Tab color="gray.400" _selected={{ color: 'white', bg: 'gray.800' }} whiteSpace="nowrap" fontSize={{ base: 'xs', md: 'sm' }}>
            📊 Trends {trends.filter(t => t.trend_status !== 'normal').length > 0 ? `(${trends.filter(t => t.trend_status !== 'normal').length})` : ''}
          </Tab>
          <Tab color="gray.400" _selected={{ color: 'white', bg: 'gray.800' }} whiteSpace="nowrap" fontSize={{ base: 'xs', md: 'sm' }}>
            🗂️ Manage
          </Tab>
          <Tab color="gray.400" _selected={{ color: 'white', bg: 'gray.800' }} whiteSpace="nowrap" fontSize={{ base: 'xs', md: 'sm' }}>
            🔬 Research
          </Tab>
        </TabList>

        <TabPanels overflowX="hidden">
          {/* Outbreaks */}
          <TabPanel px={0}>
            {active.length === 0 ? (
              <Flex py={12} align="center" justify="center" direction="column" gap={2}>
                <Text fontSize="3xl">✅</Text>
                <Text color="green.400" fontWeight="medium">No active outbreaks</Text>
                <Text fontSize="xs" color="gray.500">All monitored tools operating normally</Text>
                {lastRun && (
                  <Text fontSize="xs" color="gray.600">Last checked: {lastRun}</Text>
                )}
              </Flex>
            ) : active.map((e, i) => <OutbreakCard key={i} evt={e} />)}
          </TabPanel>

          {/* At-Risk */}
          <TabPanel px={0}>
            {atRiskAll.length === 0 ? (
              <Flex py={12} align="center" justify="center" direction="column" gap={2}>
                <Text fontSize="3xl">✅</Text>
                <Text color="green.400">No at-risk clients</Text>
                {lastRun && (
                  <Text fontSize="xs" color="gray.600">Last checked: {lastRun}</Text>
                )}
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

          {/* Tool Risk Scores — S6: show all 21 tools with rich breakdown */}
          <TabPanel px={0}>
            {tools.length === 0 ? (
              <Flex py={12} align="center" justify="center" direction="column" gap={2}>
                <Text fontSize="3xl">📈</Text>
                <Text color="gray.400" fontWeight="medium">No tools loaded</Text>
                <Text fontSize="xs" color="gray.500">Tool risk scores appear once the tool registry loads</Text>
              </Flex>
            ) : (
              <Box>
                {/* Section header: context + data freshness */}
                <HStack mb={3} justify="space-between" flexWrap="wrap" gap={2}>
                  <HStack spacing={2}>
                    <Text fontSize="xs" color="gray.500">Scored over 168h lookback window ·</Text>
                    <Text fontSize="xs" color="gray.500">{tools.length} tools registered</Text>
                    {toolsWithScore.length > 0 && (
                      <Badge colorScheme="orange" fontSize="2xs" ml={1}>
                        {toolsWithScore.length} with activity
                      </Badge>
                    )}
                  </HStack>
                  <Badge colorScheme="gray" fontSize="2xs" variant="outline">live · auto-refreshes</Badge>
                </HStack>
                <TableContainer>
                  <Table size="sm" variant="simple">
                    <Thead>
                      <Tr borderColor="gray.700">
                        <Th color="gray.400">Tool</Th>
                        <Th color="gray.400">Category</Th>
                        <Th color="gray.400">Risk Score</Th>
                        <Th color="gray.400">Level</Th>
                        <Th color="gray.400">Breakdown</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {tools.map(t => {
                        const rs  = t.risk_score;
                        const sc  = rs?.score ?? 0;
                        const scheme = riskScheme(sc);
                        const hasActivity = sc > 0;
                        return (
                          <Tr key={t.id} borderColor="gray.700"
                            opacity={hasActivity ? 1 : 0.55}>
                            <Td>
                              <VStack align="flex-start" spacing={0}>
                                <Text color={hasActivity ? 'gray.100' : 'gray.400'}
                                  fontWeight={hasActivity ? 'semibold' : 'normal'}
                                  fontSize="sm">
                                  {t.name ?? t.id}
                                </Text>
                                {t.vendor && (
                                  <Text fontSize="2xs" color="gray.600">{t.vendor}</Text>
                                )}
                              </VStack>
                            </Td>
                            <Td>
                              <Badge variant="outline" fontSize="0.7em" colorScheme="gray">
                                {t.category ?? '—'}
                              </Badge>
                            </Td>
                            <Td>
                              <HStack spacing={2}>
                                <Progress value={sc} colorScheme={scheme}
                                          size="sm" w="80px" borderRadius="full" />
                                <Text fontSize="xs" color={hasActivity ? 'gray.300' : 'gray.600'}>{sc}</Text>
                              </HStack>
                            </Td>
                            <Td>
                              <Badge colorScheme={hasActivity ? scheme : 'gray'} fontSize="0.7em">
                                {sc >= 70 ? 'HIGH' : sc >= 40 ? 'MEDIUM' : sc > 0 ? 'LOW' : '—'}
                              </Badge>
                            </Td>
                            <Td>
                              {rs && hasActivity ? (
                                <Tooltip
                                  label={`Tickets: ${rs.breakdown.active_tickets_pts}pts · Clients: ${rs.breakdown.unique_clients_pts}pts · Recurrence: ${rs.breakdown.recurrence_pts}pts`}
                                  fontSize="xs" placement="left"
                                >
                                  <HStack spacing={2} cursor="default">
                                    {rs.ticket_count > 0 && (
                                      <Badge colorScheme="blue" fontSize="2xs" variant="subtle">
                                        🎫 {rs.ticket_count}t
                                      </Badge>
                                    )}
                                    {rs.client_count > 0 && (
                                      <Badge colorScheme="orange" fontSize="2xs" variant="subtle">
                                        👥 {rs.client_count}c
                                      </Badge>
                                    )}
                                    {rs.past_events > 0 && (
                                      <Badge colorScheme="red" fontSize="2xs" variant="subtle">
                                        🔁 {rs.past_events}×
                                      </Badge>
                                    )}
                                  </HStack>
                                </Tooltip>
                              ) : (
                                <Text fontSize="xs" color="gray.700">no activity</Text>
                              )}
                            </Td>
                          </Tr>
                        );
                      })}
                    </Tbody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </TabPanel>

          {/* History — CLIENT-STORY-002: Resolved outbreaks + Client Story */}
          <TabPanel px={0}>
            {/* Existing: resolved outbreak events */}
            {resolved.length === 0 ? (
              <Flex py={6} align="center" justify="center">
                <Text color="gray.500" fontSize="sm">No resolved outbreak events</Text>
              </Flex>
            ) : resolved.map((e, i) => <OutbreakCard key={i} evt={e} />)}

            {/* WBL-005b: Open Working Briefs section */}
            <Box mb={6}>
              <HStack mb={3} spacing={3} align="center">
                <Text fontSize="sm" fontWeight="bold" color="gray.200">🗂️ Open Working Briefs</Text>
                <Text fontSize="2xs" color="gray.500">active operational memory · structured only · no archived notes</Text>
              </HStack>
              {wbLoading ? (
                <Flex py={6} align="center" justify="center">
                  <Spinner color="blue.400" size="sm" />
                </Flex>
              ) : wbError ? (
                <Flex py={4} align="center" justify="center">
                  <Text fontSize="xs" color="orange.400">⚠ Could not load working briefs</Text>
                </Flex>
              ) : openWBs.length === 0 ? (
                <Flex py={4} align="center" justify="center" direction="column" gap={1}>
                  <Text fontSize="xs" color="gray.500">No open working briefs</Text>
                  <Text fontSize="2xs" color="gray.600">Working briefs are created when tickets are opened · refresh to update</Text>
                </Flex>
              ) : (
                openWBs.map((wb) => (
                  <WorkingBriefCard
                    key={wb.brief_id}
                    wb={wb}
                    onRefresh={handleWBRefresh}
                    isRefreshing={!!wbRefreshing[wb.ticket_key]}
                  />
                ))
              )}
            </Box>

            {/* CLIENT-STORY-002: Client Story section */}
            <Divider my={6} borderColor="gray.700" />
            <Box mb={4}>
              <HStack mb={3} spacing={3} align="center">
                <Text fontSize="sm" fontWeight="bold" color="gray.200">📋 Client Story</Text>
                <Text fontSize="2xs" color="gray.500">90-day closed brief history · structured outcomes · no prose</Text>
              </HStack>
              <Select
                size="sm"
                w={{ base: "full", md: "280px" }}
                bg="gray.800"
                border="1px solid"
                borderColor="gray.600"
                color="gray.200"
                fontSize="xs"
                placeholder={briefClientsLoading ? 'Loading clients…' : briefClients.length === 0 ? 'No clients with closed briefs' : 'Select a client to view story…'}
                value={storyClient}
                onChange={(e) => setStoryClient(e.target.value)}
                isDisabled={briefClientsLoading}
              >
                {briefClients.map((c) => (
                  <option key={c.client_key} value={c.client_key} style={{ background: '#1a202c' }}>
                    {c.client_display_name || c.client_key}
                  </option>
                ))}
              </Select>
              {briefClientsError && (
                <Text fontSize="2xs" color="orange.400" mt={1}>
                  ⚠ Client list unavailable — select a client key manually if known
                </Text>
              )}
            </Box>
            {storyClient ? (
              <ClientStoryPanel clientKey={storyClient} />
            ) : (
              <Flex py={8} align="center" justify="center" direction="column" gap={2}>
                <Text fontSize="2xl">📋</Text>
                <Text color="gray.400" fontSize="sm">Select a client above to view their story</Text>
                <Text fontSize="2xs" color="gray.600">Data from Final Closed Briefs · 90-day window · workspace-scoped</Text>
              </Flex>
            )}
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
                      {selectedIntel && (() => {
                        const src = sourceLabel(selectedIntel.created_by);
                        return (
                          <Badge ml={2} fontSize="0.6em" verticalAlign="middle"
                            colorScheme={src.scheme} variant="outline">
                            {src.label}
                          </Badge>
                        );
                      })()}
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
                            <Text>Observed: <Text as="span" color="gray.300">{timeAgo(selectedIntel.observed_at)}</Text></Text>
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
                    .map((entry) => {
                      const src = sourceLabel(entry.created_by);
                      return (
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
                            {/* Provenance badge */}
                            <Badge fontSize="2xs" colorScheme={src.scheme} variant="outline">
                              {src.label}
                            </Badge>
                            {/* 13C: KB Status badge */}
                            {entry.kb_status === 'approved' && (
                              <Badge fontSize="2xs" colorScheme="green" variant="subtle">🟢 KB</Badge>
                            )}
                            {entry.kb_status === 'proposed' && (
                              <Badge fontSize="2xs" colorScheme="blue" variant="subtle">🔵 Proposed</Badge>
                            )}
                            <Text fontSize="2xs" color="gray.600">
                              {timeAgo(entry.observed_at)}
                            </Text>
                          </VStack>
                        </Flex>
                      </Box>
                      );
                    })
                  }
                </VStack>
              </Box>
            )}
          </TabPanel>

          {/* Trends */}
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
          {/* Manage Tab — FST-083 */}
          <TabPanel px={0}>
            <ManageTab />
          </TabPanel>
          {/* Research Tab — FST-085 */}
          <TabPanel px={0}>
            <ResearchTab />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
    </Box>
  );
}
