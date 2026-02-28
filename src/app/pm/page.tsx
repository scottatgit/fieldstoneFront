'use client';
import {
  Box, Flex, Grid, GridItem, HStack, VStack, Text, Badge,
  Input, Spinner,
  Tabs, TabList, Tab, TabPanels, TabPanel,
}  from '@chakra-ui/react';
import { useEffect, useState, useCallback, useRef } from 'react';

import { Ticket, Summary } from '../../components/pm/types';
import { TicketCard } from '../../components/pm/TicketCard';
import { ChatPanel } from '../../components/pm/ChatPanel';
import { ExecutionView } from '../../components/pm/ExecutionView';
import Link from 'next/link';
import IntelPanel from '@/components/pm/IntelPanel';
import { isDemoMode, pmFetch } from '@/lib/demoApi';
import { DemoBanner } from '@/components/pm/DemoBanner';

const PM_API = process.env.NEXT_PUBLIC_PM_API_URL || 'http://localhost:8100';

function cleanTitle(raw: string | null | undefined): string {
  if (!raw) return '';
  let t = raw.replace(/[\r\n]+/g, ' ').trim();
  t = t.replace(/^(Fw|Re|Fwd):\s*/i, '');
  t = t.replace(/^Project\s+Ticket#?\d+\/[^\/]+\/[^\/]+\//i, '').trim();
  t = t.replace(/^Project\s+Ticket\s*#?\d+\s*[-–]?\s*/i, '').trim();
  return t || raw.trim();
}

// ─── Summary Bar ──────────────────────────────────────────────────────────────
function SummaryBar({ summary, loading }: { summary: Summary | null; loading: boolean }) {
  if (loading) return (
    <Flex px={4} py={2} bg="gray.900" borderBottom="1px solid" borderColor="gray.700"
      align="center" justify="center" h="48px">
      <Spinner size="sm" color="blue.400" />
    </Flex>
  );
  if (!summary) return null;
  return (
    <Flex px={4} py={2} bg="gray.900" borderBottom="1px solid" borderColor="gray.700"
      align="center" justify="space-between" flexWrap="wrap" gap={2} flexShrink={0}>
      <HStack spacing={3}>
        <Text fontSize="sm" fontWeight="black" color="white" fontFamily="mono" letterSpacing="wider">IPQUEST PM</Text>
        <Text fontSize="xs" color="gray.600" fontFamily="mono">
          {typeof window !== 'undefined' ? new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : ''}
        </Text>
        <Link href="/pm/setup"><Text fontSize="xs" color="gray.500" fontFamily="mono" _hover={{ color: 'blue.400' }} cursor="pointer">Setup</Text></Link>
        <Link href="/pm/intel"><Text fontSize="xs" fontWeight="medium" color="purple.400" opacity={0.8} _hover={{ opacity: 1 }} cursor="pointer" ml={2}>Intel</Text></Link>
        <Link href="/pm/docs"><Text fontSize="xs" fontWeight="medium" color="cyan.400" opacity={0.8} _hover={{ opacity: 1 }} cursor="pointer" ml={2}>Docs</Text></Link>
      </HStack>
      <HStack spacing={4} flexWrap="wrap">
        <VStack spacing={0}><Text fontSize="lg" fontWeight="black" color="white" lineHeight={1}>{summary.total_open}</Text><Text fontSize="2xs" color="gray.500" fontFamily="mono">OPEN</Text></VStack>
        <VStack spacing={0}><Text fontSize="lg" fontWeight="black" color="blue.300" lineHeight={1}>{summary.today_count}</Text><Text fontSize="2xs" color="gray.500" fontFamily="mono">TODAY</Text></VStack>
        <VStack spacing={0}>
          <Text fontSize="lg" fontWeight="black" color={summary.declining_trust_count > 0 ? 'red.400' : 'green.400'} lineHeight={1}>{summary.declining_trust_count}</Text>
          <Text fontSize="2xs" color="gray.500" fontFamily="mono">DECLINING</Text>
        </VStack>
        <VStack spacing={0}>
          <HStack spacing={1}>
            <Text fontSize="xs" color="green.400" fontWeight="bold">{summary.readiness.high}</Text>
            <Text fontSize="xs" color="gray.600">/</Text>
            <Text fontSize="xs" color="yellow.400" fontWeight="bold">{summary.readiness.medium}</Text>
            <Text fontSize="xs" color="gray.600">/</Text>
            <Text fontSize="xs" color="red.400" fontWeight="bold">{summary.readiness.low}</Text>
          </HStack>
          <Text fontSize="2xs" color="gray.500" fontFamily="mono">HI/MED/LO</Text>
        </VStack>
      </HStack>
    </Flex>
  );
}

// ─── Visit Filter Sidebar ─────────────────────────────────────────────────────
type VisitFilter = 'today' | 'tomorrow' | 'unscheduled' | 'all';

function filterTickets(tickets: Ticket[], vf: VisitFilter): Ticket[] {
  const today    = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  return tickets.filter(t => {
    if (t.status === 'closed') return false;
    const vd = (t.visit_datetime || '').slice(0, 10);
    if (vf === 'today')       return vd === today;
    if (vf === 'tomorrow')    return vd === tomorrow;
    if (vf === 'unscheduled') return !t.visit_datetime;
    return true; // 'all'
  });
}

function VisitFilterSidebar({
  tickets, activeFilter, onFilter
}: {
  tickets: Ticket[];
  activeFilter: VisitFilter;
  onFilter: (f: VisitFilter) => void;
}) {
  const today    = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const open     = tickets.filter(t => t.status !== 'closed');

  const counts = {
    today:       open.filter(t => (t.visit_datetime || '').slice(0, 10) === today).length,
    tomorrow:    open.filter(t => (t.visit_datetime || '').slice(0, 10) === tomorrow).length,
    unscheduled: open.filter(t => !t.visit_datetime).length,
    all:         open.length,
  };

  const FILTERS: { key: VisitFilter; label: string; color: string }[] = [
    { key: 'today',       label: 'Today',       color: 'blue'   },
    { key: 'tomorrow',    label: 'Tomorrow',    color: 'purple' },
    { key: 'unscheduled', label: 'Unscheduled', color: 'orange' },
    { key: 'all',         label: 'All Open',    color: 'gray'   },
  ];

  return (
    <VStack align="stretch" spacing={0} h="full">
      <HStack px={3} py={2} borderBottom="1px solid" borderColor="gray.700" flexShrink={0}>
        <Text fontSize="xs" fontWeight="bold" color="gray.400" fontFamily="mono" letterSpacing="wider">VISITS</Text>
      </HStack>
      <VStack align="stretch" spacing={1} p={2} flex={1}>
        {FILTERS.map(({ key, label, color }) => (
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
                {label}
              </Text>
              <Badge
                colorScheme={activeFilter === key ? color : 'gray'}
                fontSize="2xs" variant={activeFilter === key ? 'solid' : 'subtle'}>
                {counts[key]}
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
    : 'Unscheduled';

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
      color={value ? 'blue.300' : 'gray.600'}
      _hover={{ color: 'blue.200' }}
      cursor="pointer"
      title="Click to schedule"
    >
      {dtLocal}
    </Box>
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
  const [activeTab, setActiveTab]       = useState(0);

  const fetchTickets = useCallback(async () => {
    try {
      const tData = (await pmFetch('/api/tickets?status=open&limit=200', PM_API)) as Ticket[];
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

  const filteredTickets = filterTickets(tickets, visitFilter);

  // ── Execution view: full-screen replacement ──────────────────────────────
  if (selectedTicket) {
    return (
      <Box h="100vh" display="flex" flexDirection="column" bg="gray.950" overflow="hidden">
        <SummaryBar summary={summary} loading={summaryLoading} />
        <Box flex={1} overflow="hidden">
          <ExecutionView
            ticket={selectedTicket}
            onBack={() => setSelected(null)}
          />
        </Box>
      </Box>
    );
  }

  // ── Dashboard: 3-column layout ───────────────────────────────────────────
  return (
    <Box h="100vh" display="flex" flexDirection="column" bg="gray.950" overflow="hidden">
      {isDemoMode() && <DemoBanner />}
      <SummaryBar summary={summary} loading={summaryLoading} />

      <Grid
        flex={1}
        overflow="hidden"
        templateColumns="160px 1fr 320px"
        templateRows="1fr"
        gap={0}
      >
        {/* ── Left: Visit Filter ── */}
        <GridItem
          borderRight="1px solid"
          borderColor="gray.700"
          overflow="hidden"
          display="flex"
          flexDirection="column"
          bg="gray.950"
        >
          <VisitFilterSidebar
            tickets={tickets}
            activeFilter={visitFilter}
            onFilter={f => { setVisitFilter(f); setSelected(null); }}
          />
        </GridItem>

        {/* ── Center: Ticket Queue ── */}
        <GridItem
          overflow="hidden"
          display="flex"
          flexDirection="column"
          bg="gray.950"
        >
          <HStack px={3} py={2} borderBottom="1px solid" borderColor="gray.700" flexShrink={0}>
            <Text fontSize="xs" fontWeight="bold" color="gray.400" fontFamily="mono" letterSpacing="wider">
              {visitFilter.toUpperCase()}
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

        {/* ── Right: Tank / Intel ── */}
        <GridItem
          borderLeft="1px solid"
          borderColor="gray.700"
          overflow="hidden"
          display="flex"
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
                Tank
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
                <ChatPanel />
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
