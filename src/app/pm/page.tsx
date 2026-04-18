'use client';
import {
  Box, Flex, Grid, GridItem, HStack, VStack, Text, Badge,
  Input, Spinner, Button, useDisclosure, Tooltip,
  Popover, PopoverTrigger, PopoverContent, PopoverBody, PopoverArrow,
}  from '@chakra-ui/react';
import { useEffect, useState, useCallback, useRef } from 'react';

import { Ticket, Summary } from '../../components/pm/types';
import { TicketCard } from '../../components/pm/TicketCard';
import { ExecutionView } from '../../components/pm/ExecutionView';
import { isDemoMode, pmFetch } from '@/lib/demoApi';
import { DemoBanner } from '@/components/pm/DemoBanner';
import { SummaryBar } from '@/components/pm/SummaryBar';
import { NewTicketModal } from '@/components/pm/NewTicketModal';
import { useWorkspaceMode } from '@/lib/useWorkspaceMode'; // MODE-004

const PM_API      = '/pm-api'; // always use relative proxy path — NEXT_PUBLIC_PM_API_URL ignored (was set to demo domain on Vercel)
const DEFAULT_TECH = process.env.NEXT_PUBLIC_DEFAULT_TECH || 'Scott Everett';

// ─── Effective visit time helper ─────────────────────────────────────────────
// Priority: PM-set visit_datetime > email Date Assigned (appointment_at)
function effectiveVisit(t: Ticket): string {
  return t.effective_visit_time || t.visit_datetime || t.appointment_at || '';
}

// ─── Visit Filter ─────────────────────────────────────────────────────────────
type VisitFilter = 'today' | 'tomorrow' | 'unscheduled' | 'all';

function filterTickets(tickets: Ticket[], vf: VisitFilter, myOnly: boolean, tech: string): Ticket[] {
  if (!Array.isArray(tickets)) return [];
  const today    = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  return tickets.filter(t => {
    if (t.status === 'closed') return false;
    // My Tickets filter
    if (myOnly && tech) {
      const assigned = (t.assigned_to || '').toLowerCase();
      if (!assigned.includes(tech.split(' ')[0].toLowerCase())) return false;
    }
    const vd = effectiveVisit(t).slice(0, 10);
    if (vf === 'today')       return vd === today;
    if (vf === 'tomorrow')    return vd === tomorrow;
    if (vf === 'unscheduled') return !effectiveVisit(t);
    return true; // 'all'
  });
}

// ─── Visit Filter Sidebar ─────────────────────────────────────────────────────
function VisitFilterSidebar({
  tickets, activeFilter, onFilter, myOnly, onToggleMy, tech
}: {
  tickets: Ticket[];
  activeFilter: VisitFilter;
  onFilter: (f: VisitFilter) => void;
  myOnly: boolean;
  onToggleMy: () => void;
  tech: string;
}) {
  const today    = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

  // Count using same effective visit logic + my filter
  function countFor(vf: VisitFilter): number {
    return tickets.filter(t => {
      if (t.status === 'closed') return false;
      if (myOnly && tech) {
        const assigned = (t.assigned_to || '').toLowerCase();
        if (!assigned.includes(tech.split(' ')[0].toLowerCase())) return false;
      }
      const vd = effectiveVisit(t).slice(0, 10);
      if (vf === 'today')       return vd === today;
      if (vf === 'tomorrow')    return vd === tomorrow;
      if (vf === 'unscheduled') return !effectiveVisit(t);
      return t.status !== 'closed';
    }).length;
  }

  const FILTERS: { key: VisitFilter; label: string; myLabel: string; color: string }[] = [
    { key: 'today',       label: 'Today',       myLabel: 'My Today',       color: 'blue'   },
    { key: 'tomorrow',    label: 'Tomorrow',    myLabel: 'My Tomorrow',    color: 'purple' },
    { key: 'unscheduled', label: 'Unscheduled', myLabel: 'Unscheduled',    color: 'orange' },
    { key: 'all',         label: 'All Open',    myLabel: 'My Open',        color: 'gray'   },
  ];

  return (
    <VStack align="stretch" spacing={0} h="full">
      <HStack px={3} py={2} borderBottom="1px solid" borderColor="gray.700" flexShrink={0} justify="space-between">
        <Text fontSize="xs" fontWeight="bold" color="gray.400" fontFamily="mono" letterSpacing="wider">DISPATCH</Text>
      </HStack>

      {/* My / All toggle */}
      <HStack px={2} py={2} spacing={1} borderBottom="1px solid" borderColor="gray.800">
        <Box
          as="button" onClick={() => !myOnly && onToggleMy()}
          flex={1} py={1} borderRadius="sm" fontSize="2xs" fontFamily="mono" fontWeight="bold"
          bg={myOnly ? 'blue.700' : 'transparent'}
          color={myOnly ? 'white' : 'gray.500'}
          border="1px solid" borderColor={myOnly ? 'blue.500' : 'gray.700'}
          _hover={{ borderColor: 'blue.500' }} transition="all 0.1s"
        >
          MINE
        </Box>
        <Box
          as="button" onClick={() => myOnly && onToggleMy()}
          flex={1} py={1} borderRadius="sm" fontSize="2xs" fontFamily="mono" fontWeight="bold"
          bg={!myOnly ? 'gray.700' : 'transparent'}
          color={!myOnly ? 'white' : 'gray.500'}
          border="1px solid" borderColor={!myOnly ? 'gray.500' : 'gray.700'}
          _hover={{ borderColor: 'gray.400' }} transition="all 0.1s"
        >
          ALL
        </Box>
      </HStack>

      {myOnly && (
        <Box px={3} py={1} bg="blue.950">
          <Text fontSize="2xs" color="blue.400" fontFamily="mono" noOfLines={1}>
            {tech.split(' ')[0]}
          </Text>
        </Box>
      )}

      <VStack align="stretch" spacing={1} p={2} flex={1}>
        {FILTERS.map(({ key, label, myLabel, color }) => (
          <Box
            key={key}
            as="button"
            onClick={() => onFilter(key)}
            px={3} py={2.5}
            borderRadius="md"
            border="1px solid"
            borderColor={activeFilter === key ? `${color}.600` : 'gray.800'}
            bg={activeFilter === key ? `${color}.900` : 'transparent'}
            cursor="pointer"
            _hover={{ bg: activeFilter === key ? `${color}.900` : 'gray.800', borderColor: `${color}.600` }}
            transition="all 0.1s"
            textAlign="left"
          >
            <Flex justify="space-between" align="center">
              <Text fontSize="xs" fontFamily="mono"
                color={activeFilter === key ? `${color}.200` : 'gray.400'}
                fontWeight={activeFilter === key ? 'bold' : 'normal'}>
                {myOnly ? myLabel : label}
              </Text>
              <Badge
                colorScheme={activeFilter === key ? color : 'gray'}
                fontSize="2xs" variant={activeFilter === key ? 'solid' : 'subtle'}>
                {countFor(key)}
              </Badge>
            </Flex>
          </Box>
        ))}
      </VStack>
    </VStack>
  );
}

// ─── Inline DateTime Picker ───────────────────────────────────────────────────
function VisitDatePicker({ ticket, onSaved, isOpsMode = true }: { ticket: Ticket; onSaved?: () => void; isOpsMode?: boolean }) {
  const [editing, setEditing]   = useState(false);
  const [value, setValue]       = useState(ticket.visit_datetime || '');
  const [saving, setSaving]     = useState(false);
  const debounceRef             = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dtLocal = value
    ? new Date(value).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    : 'Set visit time';

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setValue(v);
    setSaving(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        await fetch(`${PM_API}/api/tickets/${ticket.ticket_key}/visit-datetime`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ visit_datetime: v || null }),
        });
        setSaving(false);
        onSaved?.();
      } catch { setSaving(false); }
    }, 600);
  }

  if (editing) return (
    <HStack spacing={1}>
      <Input
        type="datetime-local"
        value={value}
        onChange={handleChange}
        onBlur={() => setEditing(false)}
        autoFocus
        size="xs"
        bg="gray.800"
        borderColor="blue.600"
        color="blue.200"
        fontSize="2xs"
        fontFamily="mono"
        w="auto"
        _focus={{ borderColor: 'blue.400', boxShadow: 'none' }}
      />
      {saving && <Spinner size="xs" color="blue.400" />}
    </HStack>
  );

  // MODE-004: read-only in intelligence mode — no edit affordance
  if (!isOpsMode) return (
    <Box fontSize="2xs" fontFamily="mono" color={value ? 'blue.300' : 'gray.700'}>
      {dtLocal}
    </Box>
  );

  return (
    <Box
      as="button"
      onClick={e => { e.stopPropagation(); setEditing(true); }}
      fontSize="2xs"
      fontFamily="mono"
      color={value ? 'blue.400' : 'gray.700'}
      _hover={{ color: 'blue.300' }}
      cursor="pointer"
      title="Override visit time"
    >
      ✏️ {dtLocal}
    </Box>
  );
}

// ─── Ticket Queue ─────────────────────────────────────────────────────────────
function TicketQueue({
  tickets, loading, selectedKey, onSelect, onDateSaved, isOpsMode = true
}: {
  tickets: Ticket[];
  loading: boolean;
  selectedKey: string | null;
  onSelect: (t: Ticket) => void;
  onDateSaved: () => void;
  isOpsMode?: boolean; // MODE-004
}) {
  if (loading) return (
    <Flex flex={1} align="center" justify="center" direction="column" gap={3}>
      <Spinner color="blue.400" size="lg" thickness="3px" />
      <Text color="gray.600" fontSize="xs" fontFamily="mono">Loading tickets...</Text>
    </Flex>
  );

  if (!tickets.length) return (
    <Flex flex={1} align="center" justify="center" p={6}>
      <Box
        maxW="380px" w="full"
        bg="gray.900" border="1px solid" borderColor="blue.800"
        borderRadius="xl" p={6}
      >
        <VStack align="stretch" spacing={5}>
          {/* Header */}
          <VStack align="start" spacing={1}>
            <HStack spacing={2}>
              <Text fontSize="lg" fontWeight="black" fontFamily="mono" color="blue.300" letterSpacing="widest">SIGNAL</Text>
              <Badge colorScheme="blue" fontSize="2xs" fontFamily="mono">TICKETS</Badge>
            </HStack>
            <Text fontSize="xs" color="gray.400">
              Signal extracts operational intelligence from your service tickets.
            </Text>
          </VStack>

          {/* Steps */}
          <VStack align="stretch" spacing={3}>
            {[
              { step: '1', label: 'Connect your ticket inbox', desc: 'Add IMAP credentials in Setup', href: '/pm/setup', action: 'Open Setup →' },
              { step: '2', label: 'Run ingestion',            desc: 'Pull emails and build ticket queue', href: null, action: null },
              { step: '3', label: 'Review your first brief',  desc: 'Open any ticket for a full prep brief', href: null, action: null },
            ].map(({ step, label, desc, href, action }) => (
              <Flex key={step} align="flex-start" gap={3}
                p={3} borderRadius="md" bg="gray.800" border="1px solid" borderColor="gray.700">
                <Box
                  flexShrink={0} w={6} h={6} borderRadius="full"
                  bg="blue.900" border="1px solid" borderColor="blue.600"
                  display="flex" alignItems="center" justifyContent="center">
                  <Text fontSize="2xs" fontWeight="black" fontFamily="mono" color="blue.300">{step}</Text>
                </Box>
                <VStack align="start" spacing={0} flex={1}>
                  <Text fontSize="xs" fontWeight="bold" color="gray.200">{label}</Text>
                  <Text fontSize="2xs" color="gray.500">{desc}</Text>
                  {href && action && (
                    <Box as="a" href={href} mt={1}
                      fontSize="2xs" fontFamily="mono" color="blue.400"
                      _hover={{ color: 'blue.300' }}>
                      {action}
                    </Box>
                  )}
                </VStack>
              </Flex>
            ))}
          </VStack>

          {/* Sub-note */}
          <Text fontSize="2xs" color="gray.600" fontFamily="mono" textAlign="center">
            Once tickets are ingested, they appear here automatically.
          </Text>
        </VStack>
      </Box>
    </Flex>
  );

  return (
    <Box flex={1} overflowY="auto"
      css={{ '&::-webkit-scrollbar': { width: '4px' }, '&::-webkit-scrollbar-thumb': { background: '#2D3748', borderRadius: '2px' } }}
    >
      <VStack align="stretch" spacing={0} p={2}>
        {tickets.map(t => (
          <Box key={t.ticket_key}
            onClick={() => onSelect(t)}
            cursor="pointer"
            borderRadius="md"
            border="1px solid"
            borderColor={selectedKey === t.ticket_key ? 'blue.600' : 'gray.800'}
            bg={selectedKey === t.ticket_key ? 'blue.950' : 'transparent'}
            _hover={{ borderColor: 'gray.600', bg: 'gray.900' }}
            transition="all 0.1s"
            mb={1}
          >
            <Box px={2} pt={1.5} pb={0.5} onClick={e => e.stopPropagation()}>
              <VisitDatePicker ticket={t} onSaved={onDateSaved} isOpsMode={isOpsMode} /> {/* MODE-004 */}
            </Box>
            <TicketCard ticket={t} isSelected={selectedKey === t.ticket_key} onClick={onSelect} />
          </Box>
        ))}
      </VStack>
    </Box>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PMPage() {
  const [tickets, setTickets]           = useState<Ticket[]>([]);
  const [summary, setSummary]           = useState<Summary | null>(null);
  const [loading, setLoading]           = useState(true);
  const [summaryLoading, setSummaryL]   = useState(true);
  const [fetchError, setFetchError]     = useState<string | null>(null);
  const [selectedTicket, setSelected]   = useState<Ticket | null>(null);
  const [visitFilter, setVisitFilter]   = useState<VisitFilter>('all');
  const [myOnly, setMyOnly]             = useState(false);
  const { isOpen: isNewTicketOpen, onOpen: openNewTicket, onClose: closeNewTicket } = useDisclosure();
  const { mode: wsMode, opsEligible, loading: modeLoading } = useWorkspaceMode(); // MODE-004/005
  const isOpsMode = wsMode === 'operations'; // true for ops/fallback, false for intelligence
  // MODE-005: upgrade path state
  const [upgrading, setUpgrading]       = useState(false);
  const [upgradeError, setUpgradeError] = useState<string | null>(null);
  const [refreshing, setRefreshing]         = useState(false);

  // MODE-005: upgrade workspace from intelligence to operations mode
  async function handleUpgradeToOps() {
    setUpgrading(true);
    setUpgradeError(null);
    try {
      const res = await fetch('/pm-api/api/workspace/upgrade-to-ops', {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const msg = body?.detail?.message || body?.detail || 'Upgrade failed. Please try again.';
        setUpgradeError(String(msg));
        setUpgrading(false);
        return;
      }
      // Success — reload to apply new mode across all surfaces
      window.location.reload();
    } catch {
      setUpgradeError('Network error. Please check connection and try again.');
      setUpgrading(false);
    }
  }

  const fetchTickets = useCallback(async () => {
    try {
      setFetchError(null);
      const tResp = (await pmFetch('/api/tickets?status=open&limit=200', PM_API)) as any;
      const tData: Ticket[] = Array.isArray(tResp) ? tResp : (tResp?.tickets || []);
      setTickets(tData);
      if (tData.length === 0) {
        const slug = typeof window !== 'undefined' ? (window.location.hostname.split('.')[0]) : 'ssr';
        console.log(`[Signal] 0 tickets for workspace '${slug}' — check ingestion or email setup`);
        // MODE-007: Empty state handled by IntelModeEmptyState panel, not a red error banner
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setFetchError(`Fetch failed: ${msg} — PM_API: ${PM_API}`);
      console.error(e);
    }
    finally { setLoading(false); }
  }, []);

  const fetchSummary = useCallback(async () => {
    try {
      const sData = (await pmFetch('/api/summary', PM_API)) as Summary;
      setSummary(sData);
    } catch (e) { console.error(e); }
    finally { setSummaryL(false); }
  }, []);

  // ── Check Tickets: safe DB refresh — NOT IMAP ingest ────────────────────────
  // Calls GET /api/tickets + GET /api/summary — reads from DB only, no email scan.
  // Auto-fetch already runs on mount + every 60s via useEffect interval below.
  const handleRefresh = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await Promise.all([fetchTickets(), fetchSummary()]);
    } finally {
      setRefreshing(false);
    }
  }, [refreshing, fetchTickets, fetchSummary]);

  useEffect(() => {
    fetchTickets();
    fetchSummary();
    const iv = setInterval(() => { fetchTickets(); fetchSummary(); }, 60000);
    return () => clearInterval(iv);
  }, [fetchTickets, fetchSummary]);

  const filteredTickets = filterTickets(tickets, visitFilter, myOnly, DEFAULT_TECH);
  const filterLabel     = myOnly
    ? ({ today: 'MY TODAY', tomorrow: 'MY TOMORROW', unscheduled: 'UNSCHEDULED', all: 'MY OPEN' } as const)[visitFilter]
    : ({ today: 'TODAY', tomorrow: 'TOMORROW', unscheduled: 'UNSCHEDULED', all: 'ALL OPEN' } as const)[visitFilter];

  // ── Execution view: full-screen replacement ──────────────────────────────
  if (selectedTicket) {
    return (
      <Box h="100dvh" display="flex" flexDirection="column" bg="gray.950" overflowX="hidden">
        {/* Phase 16: Metrics hidden in ticket view — no metadata when tech is working */}
        <Box flex={1} minH={0} overflowY="auto">
          <ExecutionView
            ticket={selectedTicket}
            onBack={() => setSelected(null)}
          />
        </Box>
      </Box>
    );
  }

  // ── Dashboard: 3-column dispatch layout ──────────────────────────────────
  return (
    <Box h="100dvh" display="flex" flexDirection="column" bg="gray.950" overflowX="hidden">
      {isDemoMode() && <DemoBanner />}
      <SummaryBar summary={summary} loading={summaryLoading} />

      <Grid
        flex={1}
        minH={0}
        templateColumns={{ base: '1fr', md: '160px 1fr' }}
        templateRows="1fr"
        gap={0}
      >
        {/* ── Left: Dispatch Filter ── */}
        <GridItem
          borderRight="1px solid"
          borderColor="gray.700"
          overflow="hidden"
          display={{ base: 'none', md: 'flex' }}
          flexDirection="column"
          bg="gray.950"
        >
          <VisitFilterSidebar
            tickets={tickets}
            activeFilter={visitFilter}
            onFilter={f => { setVisitFilter(f); setSelected(null); }}
            myOnly={myOnly}
            onToggleMy={() => setMyOnly(v => !v)}
            tech={DEFAULT_TECH}
          />
        </GridItem>

        {/* ── Center: Ticket Queue ── */}
        <GridItem
          overflowY="auto"
          display="flex"
          flexDirection="column"
          bg="gray.950"
        >
          {/* Mobile-only filter pills */}
          <Box display={{ base: 'flex', md: 'none' }} overflowX="auto" px={2} py={2}
            borderBottom="1px solid" borderColor="gray.700" flexShrink={0}
            css={{ '&::-webkit-scrollbar': { display: 'none' }, scrollbarWidth: 'none' }}>
            <HStack spacing={2} flexShrink={0}>
              {/* My/All pill */}
              <Box as="button" onClick={() => setMyOnly(v => !v)}
                px={3} py={1} borderRadius="full" border="1px solid" whiteSpace="nowrap" flexShrink={0}
                borderColor={myOnly ? 'blue.500' : 'gray.700'}
                bg={myOnly ? 'blue.900' : 'transparent'}>
                <Text fontSize="2xs" fontFamily="mono" fontWeight="bold"
                  color={myOnly ? 'blue.200' : 'gray.500'}>{myOnly ? 'Mine' : 'All'}</Text>
              </Box>
              {(['today','tomorrow','unscheduled','all'] as const).map((key) => (
                <Box key={key} as="button" onClick={() => { setVisitFilter(key); setSelected(null); }}
                  px={3} py={1} borderRadius="full" border="1px solid" whiteSpace="nowrap" flexShrink={0}
                  borderColor={visitFilter === key ? 'blue.500' : 'gray.700'}
                  bg={visitFilter === key ? 'blue.900' : 'transparent'}>
                  <Text fontSize="2xs" fontFamily="mono" fontWeight="bold"
                    color={visitFilter === key ? 'blue.200' : 'gray.500'}>
                    {key === 'today' ? 'Today' : key === 'tomorrow' ? 'Tomorrow' : key === 'unscheduled' ? 'Unsched' : 'All'}
                  </Text>
                </Box>
              ))}
            </HStack>
          </Box>

          {/* Desktop header */}
          <HStack px={3} py={2} borderBottom="1px solid" borderColor="gray.700" flexShrink={0}
            display={{ base: 'none', md: 'flex' }} justify="space-between">
            <HStack spacing={2}>
              <Text fontSize="xs" fontWeight="bold" color="gray.400" fontFamily="mono" letterSpacing="wider">
                {filterLabel}
              </Text>
              <Badge colorScheme="gray" fontSize="2xs" fontFamily="mono">{filteredTickets.length}</Badge>
              {/* CHECK TICKETS: safe DB refresh — calls GET /api/tickets only, not IMAP ingest */}
              <Button
                size="xs"
                variant="ghost"
                fontFamily="mono"
                fontSize="2xs"
                color="gray.500"
                _hover={{ color: 'blue.300', bg: 'gray.800' }}
                isLoading={refreshing}
                loadingText=""
                spinner={<Spinner size="xs" color="blue.400" />}
                onClick={handleRefresh}
                px={2}
                title="Refresh ticket list from database"
              >
                ↺ CHECK
              </Button>
            </HStack>
            {/* MODE-004/005: ticket creation + upgrade CTA */}
            {isOpsMode ? (
              <Button
                size="xs" onClick={openNewTicket}
                bg="blue.800" color="blue.200" fontFamily="mono" fontSize="2xs"
                _hover={{ bg: 'blue.700' }} letterSpacing="wider"
              >+ NEW</Button>
            ) : opsEligible ? (
              <Popover placement="bottom-end" closeOnBlur>
                <PopoverTrigger>
                  <Badge
                    colorScheme="purple" variant="subtle"
                    fontSize="2xs" fontFamily="mono" letterSpacing="wider"
                    cursor="pointer"
                    _hover={{ opacity: 0.8, ring: 1, ringColor: 'purple.400' }}
                    title="Operations Mode available — click to enable"
                  >INTELLIGENCE ↑</Badge>
                </PopoverTrigger>
                <PopoverContent
                  bg="gray.900" border="1px solid" borderColor="purple.700"
                  boxShadow="lg" maxW="280px" _focus={{ outline: 'none' }}
                >
                  <PopoverArrow bg="gray.900" borderColor="purple.700" />
                  <PopoverBody p={4}>
                    <Text fontFamily="mono" fontSize="xs" fontWeight="bold" color="purple.300" mb={2}>
                      Operations Mode available
                    </Text>
                    <Text fontSize="2xs" color="gray.300" mb={3} lineHeight="1.5">
                      Enable ticket creation, note updates, scheduling, and close workflows for this workspace.
                    </Text>
                    <Text fontSize="2xs" color="gray.500" mb={3}>
                      This switches the workspace into full Operations Mode.
                    </Text>
                    {upgradeError && (
                      <Text fontSize="2xs" color="red.300" mb={2} fontFamily="mono">
                        {upgradeError}
                      </Text>
                    )}
                    <Button
                      size="xs" width="full"
                      bg="purple.700" color="white"
                      fontFamily="mono" fontSize="2xs"
                      _hover={{ bg: 'purple.600' }}
                      isLoading={upgrading}
                      loadingText="Enabling..."
                      onClick={handleUpgradeToOps}
                    >
                      Enable Operations Mode
                    </Button>
                  </PopoverBody>
                </PopoverContent>
              </Popover>
            ) : (
              <Tooltip
                label="Intelligence Mode — signal-level visibility into your service queue. Briefs, risk flags, and trend detection without full dispatch ownership."
                fontSize="2xs" fontFamily="mono" placement="bottom-end" hasArrow
                bg="gray.800" color="gray.200" px={3} py={2} borderRadius="md"
              >
                <Badge
                  colorScheme="purple" variant="subtle"
                  fontSize="2xs" fontFamily="mono" letterSpacing="wider"
                  cursor="default"
                >INTELLIGENCE</Badge>
              </Tooltip>
            )}
          </HStack>

          {/* MODE-007: Intelligence-mode empty state (replaces dev-facing error banner) */}
          {!isOpsMode && !loading && tickets.length === 0 && (
            <Box mx={3} my={3} p={4} borderRadius="md" border="1px solid" borderColor="purple.800" bg="gray.900">
              <VStack align="stretch" spacing={3}>
                <HStack spacing={2}>
                  <Badge colorScheme="purple" fontSize="2xs" fontFamily="mono" variant="subtle">INTELLIGENCE MODE</Badge>
                  <Text fontSize="2xs" fontFamily="mono" color="gray.500">GETTING STARTED</Text>
                </HStack>
                <Text fontSize="xs" color="gray.300" lineHeight="tall">
                  Signal is monitoring your workspace in Intelligence Mode — briefs, risk signals, and trend detection
                  without full dispatch ownership.
                </Text>
                <VStack align="stretch" spacing={2}>
                  <HStack spacing={2} align="flex-start">
                    <Box w={5} h={5} borderRadius="full" bg="blue.900" border="1px solid" borderColor="blue.600"
                      display="flex" alignItems="center" justifyContent="center" flexShrink={0} mt={0.5}>
                      <Text fontSize="2xs" fontWeight="black" fontFamily="mono" color="blue.300">1</Text>
                    </Box>
                    <Box>
                      <Text fontSize="2xs" fontWeight="bold" color="gray.200">Connect your support inbox</Text>
                      <Box as="a" href="/pm/setup" fontSize="2xs" fontFamily="mono" color="blue.400" _hover={{ color: 'blue.300' }}>
                        Open Setup →
                      </Box>
                    </Box>
                  </HStack>
                  <HStack spacing={2} align="flex-start">
                    <Box w={5} h={5} borderRadius="full" bg="blue.900" border="1px solid" borderColor="blue.600"
                      display="flex" alignItems="center" justifyContent="center" flexShrink={0} mt={0.5}>
                      <Text fontSize="2xs" fontWeight="black" fontFamily="mono" color="blue.300">2</Text>
                    </Box>
                    <Box>
                      <Text fontSize="2xs" fontWeight="bold" color="gray.200">Run your first ingestion</Text>
                      <Text fontSize="2xs" color="gray.500">Use the Ingest tab on the right panel to pull your tickets.</Text>
                    </Box>
                  </HStack>
                  <HStack spacing={2} align="flex-start">
                    <Box w={5} h={5} borderRadius="full" bg="purple.900" border="1px solid" borderColor="purple.600"
                      display="flex" alignItems="center" justifyContent="center" flexShrink={0} mt={0.5}>
                      <Text fontSize="2xs" fontWeight="black" fontFamily="mono" color="purple.300">3</Text>
                    </Box>
                    <Box>
                      <Text fontSize="2xs" fontWeight="bold" color="gray.200">Open your first brief</Text>
                      <Box as="a" href="/pm/brief" fontSize="2xs" fontFamily="mono" color="purple.400" _hover={{ color: 'purple.300' }}>
                        Go to Brief →
                      </Box>
                    </Box>
                  </HStack>
                </VStack>
              </VStack>
            </Box>
          )}
          {/* Real fetch errors (network/API failures) shown to ops workspaces only */}
          {fetchError && (isOpsMode || tickets.length > 0) && (
            <Box px={3} py={2} bg="red.900" border="1px solid" borderColor="red.600" mx={2} my={1} borderRadius="md">
              <Text fontSize="2xs" fontFamily="mono" color="red.200">⚠️ {fetchError}</Text>
            </Box>
          )}
          <TicketQueue
            tickets={filteredTickets}
            loading={loading}
            selectedKey={selectedTicket ? (selectedTicket as Ticket).ticket_key : null}
            onSelect={t => setSelected(t)}
            onDateSaved={() => { fetchTickets(); fetchSummary(); }}
            isOpsMode={isOpsMode} /* MODE-004 */
          />
        </GridItem>
      </Grid>

      <NewTicketModal
        isOpen={isNewTicketOpen}
        onClose={closeNewTicket}
        onCreated={() => { fetchTickets(); fetchSummary(); }}
      />
    </Box>
  );
}
