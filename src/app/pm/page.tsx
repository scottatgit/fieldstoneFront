'use client';
import {
  Box, Flex, Grid, GridItem, HStack, VStack, Text, Badge,
  Input, Select, Spinner,
  Tabs, TabList, Tab, TabPanels, TabPanel,
  useDisclosure,
} from '@chakra-ui/react';
import { useEffect, useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Ticket, CalendarEvent, Summary } from '../../components/pm/types';
import { TicketCard } from '../../components/pm/TicketCard';
import { PrepBriefDrawer } from '../../components/pm/PrepBriefDrawer';
import { ChatPanel } from '../../components/pm/ChatPanel';
import Link from 'next/link';

import IntelPanel from '@/components/pm/IntelPanel';
const PM_API = process.env.NEXT_PUBLIC_PM_API_URL || 'http://localhost:8100';

function cleanTitle(raw: string | null | undefined): string {
  if (!raw) return '';
  let t = raw.replace(/[\r\n]+/g, ' ').trim();
  t = t.replace(/^(Fw|Re|Fwd):\s*/i, '');
  t = t.replace(/^Project\s+Ticket#?\d+\/[^\/]+\/[^\/]+\//i, '').trim();
  t = t.replace(/^Project\s+Ticket\s*#?\d+\s*[-–]?\s*/i, '').trim();
  return t || raw.trim();
}

// ─── Header / Summary Bar ────────────────────────────────────────────────────
function SummaryBar({ summary, loading }: { summary: Summary | null; loading: boolean }) {
  if (loading) return (
    <Flex px={4} py={2} bg="gray.900" borderBottom="1px solid" borderColor="gray.700"
      align="center" justify="center" h="48px">
      <Spinner size="sm" color="blue.400" />
    </Flex>
  );
  if (!summary) return null;

  const topSignals = Object.entries(summary.signals).slice(0, 3);

  return (
    <Flex
      px={4} py={2} bg="gray.900" borderBottom="1px solid" borderColor="gray.700"
      align="center" justify="space-between" flexWrap="wrap" gap={2} flexShrink={0}
    >
      {/* Left: brand */}
      <HStack spacing={3}>
        <Text fontSize="sm" fontWeight="black" color="white" fontFamily="mono" letterSpacing="wider">
          IPQUEST PM
        </Text>
        <Text fontSize="xs" color="gray.600" fontFamily="mono">
          {typeof window !== "undefined" ? new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : ""}
        </Text>
        <Link href="/pm/setup">
          <Text
            fontSize="xs" color="gray.500" fontFamily="mono"
            _hover={{ color: 'blue.400' }} cursor="pointer" title="Setup"
          >
            ⚙️ Setup
          </Text>
        </Link>
        <Link href="/pm/intel">
          <Text fontSize="xs" fontWeight="medium"
            color="purple.400" opacity={0.8}
            _hover={{ opacity: 1 }} cursor="pointer" title="Intel"
            ml={2}
          >
            🧠 Intel
          </Text>
        </Link>
        <Link href="/pm/docs">
          <Text
            fontSize="xs" fontWeight="medium"
            color="cyan.400" opacity={0.8}
            _hover={{ opacity: 1 }} cursor="pointer" title="Docs"
            ml={2}
          >
            📖 Docs
          </Text>
        </Link>
      </HStack>

      {/* Center: stats */}
      <HStack spacing={4} flexWrap="wrap">
        <VStack spacing={0}>
          <Text fontSize="lg" fontWeight="black" color="white" lineHeight={1}>
            {summary.total_open}
          </Text>
          <Text fontSize="2xs" color="gray.500" fontFamily="mono">OPEN</Text>
        </VStack>
        <VStack spacing={0}>
          <Text fontSize="lg" fontWeight="black" color="blue.300" lineHeight={1}>
            {summary.today_count}
          </Text>
          <Text fontSize="2xs" color="gray.500" fontFamily="mono">TODAY</Text>
        </VStack>
        <VStack spacing={0}>
          <Text fontSize="lg" fontWeight="black"
            color={summary.declining_trust_count > 0 ? 'red.400' : 'green.400'} lineHeight={1}>
            {summary.declining_trust_count}
          </Text>
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

      {/* Right: top signals */}
      <HStack spacing={1.5} flexWrap="wrap">
        {topSignals.map(([sig, cnt]) => (
          <Badge key={sig} colorScheme="gray" variant="outline" fontSize="2xs" fontFamily="mono">
            {sig} ({cnt})
          </Badge>
        ))}
      </HStack>
    </Flex>
  );
}

// ─── Calendar Sidebar ────────────────────────────────────────────────────────
function CalendarSidebar({ events, loading }: { events: CalendarEvent[]; loading: boolean }) {
  return (
    <VStack align="stretch" spacing={0} h="full">
      <HStack px={3} py={2} borderBottom="1px solid" borderColor="gray.700" flexShrink={0}>
        <Text fontSize="xs" fontWeight="bold" color="gray.400" fontFamily="mono" letterSpacing="wider">
          📅 SCHEDULE
        </Text>
        <Badge colorScheme="blue" fontSize="2xs" ml="auto">{events.length}</Badge>
      </HStack>
      {loading ? (
        <Flex p={4} justify="center"><Spinner size="sm" color="blue.400" /></Flex>
      ) : events.length === 0 ? (
        <Text p={3} fontSize="xs" color="gray.600" fontFamily="mono">No events</Text>
      ) : (
        <VStack
          align="stretch" spacing={0} overflowY="auto" flex={1}
          css={{ '&::-webkit-scrollbar': { width: '3px' }, '&::-webkit-scrollbar-thumb': { background: '#2D3748' } }}
        >
          {events.map(e => {
            const dateStr = e.starts_at_raw
              ? e.starts_at_raw.replace(/(\w+ \d+\/\d+)\/\d{4}\s+(\d+:\d+):\d+\s+(\w+)/i, '$1 $2$3')
              : (e.starts_at_iso_utc || '').slice(0, 10);
            const isPast = e.starts_at_iso_utc
              ? e.starts_at_iso_utc.slice(0, 10) < new Date().toISOString().slice(0, 10)
              : false;
            return (
              <Box
                key={e.id}
                px={3} py={2}
                borderBottom="1px solid" borderColor="gray.800"
                opacity={isPast ? 0.5 : 1}
                _hover={{ bg: 'gray.800' }}
              >
                <Text fontSize="2xs" fontFamily="mono" color={isPast ? 'gray.600' : 'blue.300'} mb={0.5}>
                  {dateStr}
                </Text>
                <Text fontSize="xs" color="white" noOfLines={2} fontWeight="medium">
                  {e.client_name || cleanTitle(e.title)}
                </Text>
                {e.client_name && (
                  <Text fontSize="2xs" color="gray.500" noOfLines={1}>
                    {cleanTitle(e.title)}
                  </Text>
                )}
                {e.assigned_to && (
                  <Text fontSize="2xs" color="gray.600" mt={0.5}>→ {e.assigned_to}</Text>
                )}
              </Box>
            );
          })}
        </VStack>
      )}
    </VStack>
  );
}

// ─── Ticket Queue ─────────────────────────────────────────────────────────────
const SIGNAL_FILTERS = ['ALL', 'VERIFY/SIGN-OFF', 'GO/NO-GO', 'RESOLVE/VERIFY', 'PROCEED/HALT', 'ASSESS/RECOMMEND'];

function TicketQueue({
  tickets, loading, onSelect, selectedKey
}: {
  tickets: Ticket[];
  loading: boolean;
  onSelect: (t: Ticket) => void;
  selectedKey: string | null;
}) {
  const [search,  setSearch]  = useState('');
  const [signal,  setSignal]  = useState('ALL');
  const [status,  setStatus]  = useState('open');

  const filtered = tickets.filter(t => {
    const matchStatus = status === 'all' || t.status === status;
    const matchSignal = signal === 'ALL' || (t.decision_label || '').includes(signal);
    const q = search.toLowerCase();
    const matchSearch = !q ||
      (t.title_clean || t.title || '').toLowerCase().includes(q) ||
      (t.client_display_name || '').toLowerCase().includes(q) ||
      t.ticket_key.includes(q);
    return matchStatus && matchSignal && matchSearch;
  });

  return (
    <Flex direction="column" h="full">
      {/* Filters */}
      <VStack px={3} pt={3} pb={2} spacing={2} flexShrink={0} borderBottom="1px solid" borderColor="gray.700">
        <HStack w="full" spacing={2}>
          <Input
            placeholder="Search tickets…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            size="sm" bg="gray.800" border="1px solid" borderColor="gray.600"
            color="white" fontSize="xs" _placeholder={{ color: 'gray.600' }}
            _focus={{ borderColor: 'blue.500', boxShadow: 'none' }}
            borderRadius="md" flex={1}
          />
          <Select
            value={status}
            onChange={e => setStatus(e.target.value)}
            size="sm" bg="gray.800" borderColor="gray.600" color="gray.300"
            fontSize="xs" w="auto" flexShrink={0} borderRadius="md"
            _focus={{ borderColor: 'blue.500', boxShadow: 'none' }}
          >
            <option value="open">Open</option>
            <option value="closed">Closed</option>
            <option value="all">All</option>
          </Select>
        </HStack>
        {/* Signal filter pills */}
        <HStack spacing={1} w="full" flexWrap="wrap">
          {['ALL', 'VERIFY', 'GO/NO-GO', 'RESOLVE', 'PROCEED', 'ASSESS'].map((s, i) => (
            <Box
              key={s}
              as="button"
              onClick={() => setSignal(SIGNAL_FILTERS[i])}
              px={2} py={0.5} fontSize="2xs" fontFamily="mono" borderRadius="sm"
              border="1px solid"
              borderColor={signal === SIGNAL_FILTERS[i] ? 'blue.500' : 'gray.700'}
              bg={signal === SIGNAL_FILTERS[i] ? 'blue.900' : 'gray.800'}
              color={signal === SIGNAL_FILTERS[i] ? 'blue.200' : 'gray.500'}
              _hover={{ borderColor: 'gray.500', color: 'white' }}
              cursor="pointer"
              transition="all 0.1s"
            >
              {s}
            </Box>
          ))}
        </HStack>
      </VStack>

      {/* Count bar */}
      <HStack px={3} py={1.5} flexShrink={0}>
        <Text fontSize="2xs" color="gray.600" fontFamily="mono">
          {filtered.length} tickets
          {search && ` matching "${search}"`}
        </Text>
      </HStack>

      {/* Cards */}
      {loading ? (
        <Flex flex={1} align="center" justify="center">
          <VStack spacing={3}>
            <Spinner color="blue.400" size="lg" thickness="3px" />
            <Text color="gray.500" fontSize="xs" fontFamily="mono">Loading tickets…</Text>
          </VStack>
        </Flex>
      ) : (
        <VStack
          align="stretch" spacing={2} p={3}
          overflowY="auto" flex={1}
          css={{ '&::-webkit-scrollbar': { width: '4px' }, '&::-webkit-scrollbar-thumb': { background: '#4A5568', borderRadius: '2px' } }}
        >
          <AnimatePresence>
            {filtered.map(t => (
              <TicketCard
                key={t.ticket_key}
                ticket={t}
                onClick={onSelect}
                isSelected={t.ticket_key === selectedKey}
              />
            ))}
          </AnimatePresence>
          {filtered.length === 0 && (
            <Text color="gray.600" fontSize="xs" fontFamily="mono" textAlign="center" pt={8}>
              No tickets match filters
            </Text>
          )}
        </VStack>
      )}
    </Flex>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PMPage() {
  const [tickets,  setTickets]  = useState<Ticket[]>([]);
  const [events,   setEvents]   = useState<CalendarEvent[]>([]);
  const [summary,  setSummary]  = useState<Summary | null>(null);
  const [loadingT, setLoadingT] = useState(true);
  const [loadingE, setLoadingE] = useState(true);
  const [loadingS, setLoadingS] = useState(true);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [mobileTab, setMobileTab] = useState(0);

  const fetchAll = useCallback(async () => {
    setLoadingT(true); setLoadingE(true); setLoadingS(true);
    try {
      const [td, cd, sd] = await Promise.all([
        fetch(`${PM_API}/api/tickets`).then(r => r.json()),
        fetch(`${PM_API}/api/calendar`).then(r => r.json()),
        fetch(`${PM_API}/api/summary`).then(r => r.json()),
      ]);
      setTickets(td.tickets || []);
      setEvents(cd.events   || []);
      setSummary(sd);
    } catch (e) {
      console.error('PM API error:', e);
    } finally {
      setLoadingT(false); setLoadingE(false); setLoadingS(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  function handleSelect(t: Ticket) {
    setSelected(t);
    onOpen();
  }

  // ── Mobile Layout ──
  const mobileLayout = (
    <Box h="100dvh" bg="gray.950" display={{ base: 'flex', lg: 'none' }} flexDirection="column">
      <SummaryBar summary={summary} loading={loadingS} />
      <IntelPanel />

      <Box flex={1} overflow="hidden">
        <Tabs index={mobileTab} onChange={setMobileTab} h="full" display="flex" flexDirection="column">
          <TabPanels flex={1} overflow="hidden">
            <TabPanel h="full" p={0} overflow="hidden">
              <TicketQueue
                tickets={tickets} loading={loadingT}
                onSelect={handleSelect} selectedKey={selected?.ticket_key || null}
              />
            </TabPanel>
            <TabPanel h="full" p={0} overflow="hidden">
              <CalendarSidebar events={events} loading={loadingE} />
            </TabPanel>
            <TabPanel h="full" p={0} overflow="hidden">
              <ChatPanel />
            </TabPanel>
          </TabPanels>

          <TabList
            bg="gray.900" borderTop="1px solid" borderColor="gray.700"
            flexShrink={0} justifyContent="space-around"
          >
            <Tab fontSize="xs" color="gray.500" _selected={{ color: 'white', borderColor: 'blue.400' }}
              fontFamily="mono" py={3}>
              🎫 Tickets
            </Tab>
            <Tab fontSize="xs" color="gray.500" _selected={{ color: 'white', borderColor: 'blue.400' }}
              fontFamily="mono" py={3}>
              📅 Calendar
            </Tab>
            <Tab fontSize="xs" color="gray.500" _selected={{ color: 'white', borderColor: 'blue.400' }}
              fontFamily="mono" py={3}>
              🤖 Tank
            </Tab>
          </TabList>
        </Tabs>
      </Box>

      <PrepBriefDrawer ticket={selected} isOpen={isOpen} onClose={onClose} />
    </Box>
  );

  // ── Desktop Layout ──
  const desktopLayout = (
    <Flex
      h="100dvh" bg="gray.950" direction="column"
      display={{ base: 'none', lg: 'flex' }}
    >
      <SummaryBar summary={summary} loading={loadingS} />

      <Grid
        templateColumns="220px 1fr 340px"
        flex={1}
        overflow="hidden"
        gap={0}
      >
        {/* ── Sidebar: Calendar ── */}
        <GridItem
          borderRight="1px solid" borderColor="gray.700"
          overflow="hidden" display="flex" flexDirection="column"
        >
          <CalendarSidebar events={events} loading={loadingE} />
        </GridItem>

        {/* ── Main: Ticket Queue ── */}
        <GridItem overflow="hidden" display="flex" flexDirection="column">
          <TicketQueue
            tickets={tickets} loading={loadingT}
            onSelect={handleSelect} selectedKey={selected?.ticket_key || null}
          />
        </GridItem>

        {/* ── Right: Chat Panel ── */}
        <GridItem overflow="hidden" display="flex" flexDirection="column">
          <ChatPanel />
        </GridItem>
      </Grid>

      <PrepBriefDrawer ticket={selected} isOpen={isOpen} onClose={onClose} />
    </Flex>
  );

  return (
    <>
      {mobileLayout}
      {desktopLayout}
    </>
  );
}
