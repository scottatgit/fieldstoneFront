'use client';
import {
  Box, Flex, Grid, GridItem, HStack, VStack, Text, Badge,
  Input, Spinner,
  Tabs, TabList, Tab, TabPanels, TabPanel,
}  from '@chakra-ui/react';
import { useEffect, useState, useCallback, useRef } from 'react';

import { Ticket, Summary } from '../../components/pm/types';
import { TicketCard } from '../../components/pm/TicketCard';
import { ExecutionView } from '../../components/pm/ExecutionView';
import IntelPanel from '@/components/pm/IntelPanel';
import { isDemoMode, pmFetch } from '@/lib/demoApi';
import { DemoBanner } from '@/components/pm/DemoBanner';
import { SummaryBar } from '@/components/pm/SummaryBar';

const PM_API      = process.env.NEXT_PUBLIC_PM_API_URL || 'http://localhost:8100';
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
function VisitDatePicker({ ticket, onSaved }: { ticket: Ticket; onSaved?: () => void }) {
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

// ─── Ingestion Banner (replaces Pilot in list view) ──────────────────────────
function IngestionBanner() {
  const [status, setStatus] = useState<'idle'|'running'|'done'|'error'>('idle');
  const [msg, setMsg]       = useState('');

  async function runIngest() {
    setStatus('running'); setMsg('');
    try {
      const r = await fetch(`${PM_API}/api/ingest`, { method: 'POST' });
      const d = await r.json();
      setMsg(d.message || JSON.stringify(d));
      setStatus('done');
    } catch (e: any) {
      setMsg(e.message || 'Error');
      setStatus('error');
    }
  }

  return (
    <VStack align="stretch" spacing={3} p={4} flex={1}>
      <HStack>
        <Text fontSize="2xs" fontFamily="mono" fontWeight="bold" color="gray.500" letterSpacing="wider">INGESTION</Text>
      </HStack>
      <Box
        p={3} borderRadius="md" border="1px solid"
        borderColor={status === 'done' ? 'green.700' : status === 'error' ? 'red.700' : 'gray.700'}
        bg={status === 'done' ? 'green.950' : status === 'error' ? 'red.950' : 'gray.900'}
      >
        <VStack align="stretch" spacing={2}>
          <Text fontSize="xs" color="gray.300">
            {status === 'idle' && 'Pull latest emails and update ticket data.'}
            {status === 'running' && '⏳ Scanning inbox...'}
            {status === 'done' && `✅ ${msg}`}
            {status === 'error' && `❌ ${msg}`}
          </Text>
          <Box
            as="button" onClick={runIngest}
            isDisabled={status === 'running'}
            px={3} py={1.5} borderRadius="sm"
            bg={status === 'running' ? 'gray.700' : 'blue.700'}
            color="white" fontSize="2xs" fontFamily="mono" fontWeight="bold"
            _hover={{ bg: status === 'running' ? 'gray.700' : 'blue.600' }}
            transition="all 0.1s" cursor={status === 'running' ? 'not-allowed' : 'pointer'}
          >
            {status === 'running' ? <Spinner size="xs" /> : 'Run Ingestion'}
          </Box>
        </VStack>
      </Box>

      <Box mt={2}>
        <Text fontSize="2xs" color="gray.600" fontFamily="mono">Open a ticket to access Pilot AI →</Text>
      </Box>
    </VStack>
  );
}

// ─── Ticket Queue ─────────────────────────────────────────────────────────────
function TicketQueue({
  tickets, loading, selectedKey, onSelect, onDateSaved
}: {
  tickets: Ticket[];
  loading: boolean;
  selectedKey: string | null;
  onSelect: (t: Ticket) => void;
  onDateSaved: () => void;
}) {
  if (loading) return (
    <Flex flex={1} align="center" justify="center" direction="column" gap={3}>
      <Spinner color="blue.400" size="lg" thickness="3px" />
      <Text color="gray.600" fontSize="xs" fontFamily="mono">Loading tickets...</Text>
    </Flex>
  );

  if (!tickets.length) return (
    <Flex flex={1} align="center" justify="center" direction="column" gap={2}>
      <Text color="gray.600" fontSize="sm">No tickets in this view</Text>
      <Text color="gray.700" fontSize="xs" fontFamily="mono">Try a different filter</Text>
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
              <VisitDatePicker ticket={t} onSaved={onDateSaved} />
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
  const [selectedTicket, setSelected]   = useState<Ticket | null>(null);
  const [visitFilter, setVisitFilter]   = useState<VisitFilter>('today');
  const [myOnly, setMyOnly]             = useState(true);
  const [activeTab, setActiveTab]       = useState(0);

  const fetchTickets = useCallback(async () => {
    try {
      const tResp = (await pmFetch('/api/tickets?status=open&limit=200', PM_API)) as any;
      const tData: Ticket[] = Array.isArray(tResp) ? tResp : (tResp?.tickets || []);
      setTickets(tData);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  const fetchSummary = useCallback(async () => {
    try {
      const sData = (await pmFetch('/api/summary', PM_API)) as Summary;
      setSummary(sData);
    } catch (e) { console.error(e); }
    finally { setSummaryL(false); }
  }, []);

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
        <SummaryBar summary={summary} loading={summaryLoading} />
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
        templateColumns={{ base: '1fr', md: '160px 1fr', lg: '180px 1fr 300px' }}
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
            display={{ base: 'none', md: 'flex' }}>
            <Text fontSize="xs" fontWeight="bold" color="gray.400" fontFamily="mono" letterSpacing="wider">
              {filterLabel}
            </Text>
            <Badge colorScheme="gray" fontSize="2xs" fontFamily="mono">{filteredTickets.length}</Badge>
          </HStack>

          <TicketQueue
            tickets={filteredTickets}
            loading={loading}
            selectedKey={selectedTicket ? (selectedTicket as Ticket).ticket_key : null}
            onSelect={t => setSelected(t)}
            onDateSaved={() => { fetchTickets(); fetchSummary(); }}
          />
        </GridItem>

        {/* ── Right: Ingestion + Intel ── */}
        <GridItem
          borderLeft="1px solid"
          borderColor="gray.700"
          overflow="hidden"
          display={{ base: 'none', lg: 'flex' }}
          flexDirection="column"
          bg="gray.950"
        >
          <Tabs
            variant="unstyled"
            index={activeTab}
            onChange={setActiveTab}
            display="flex"
            flexDirection="column"
            h="full"
          >
            <TabList px={2} pt={2} flexShrink={0} borderBottom="1px solid" borderColor="gray.700">
              <Tab
                fontSize="2xs" fontFamily="mono" fontWeight="bold" px={3} py={1.5}
                color={activeTab === 0 ? 'green.300' : 'gray.500'}
                borderBottom={activeTab === 0 ? '2px solid' : 'none'}
                borderColor="green.400"
                _selected={{}} _focus={{ boxShadow: 'none' }}
              >
                Ingest
              </Tab>
              <Tab
                fontSize="2xs" fontFamily="mono" fontWeight="bold" px={3} py={1.5}
                color={activeTab === 1 ? 'purple.300' : 'gray.500'}
                borderBottom={activeTab === 1 ? '2px solid' : 'none'}
                borderColor="purple.400"
                _selected={{}} _focus={{ boxShadow: 'none' }}
              >
                Intel
              </Tab>
            </TabList>
            <TabPanels flex={1} overflow="hidden" display="flex" flexDirection="column">
              <TabPanel p={0} flex={1} overflow="hidden" display={activeTab === 0 ? 'flex' : 'none'} flexDirection="column">
                <IngestionBanner />
              </TabPanel>
              <TabPanel p={0} flex={1} overflow={activeTab === 1 ? 'auto' : 'hidden'} display={activeTab === 1 ? 'block' : 'none'}>
                <IntelPanel />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </GridItem>
      </Grid>
    </Box>
  );
}
