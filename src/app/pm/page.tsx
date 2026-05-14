'use client';
import {
  Box, Flex, HStack, Text, Spinner, Button, useDisclosure, useToast,
} from '@chakra-ui/react';
import { useEffect, useState, useCallback, useRef } from 'react';

import { Ticket, Summary } from '../../components/pm/types';
import { ExecutionView } from '../../components/pm/ExecutionView';
import { isDemoMode, pmFetch } from '@/lib/demoApi';
import { DemoBanner } from '@/components/pm/DemoBanner';
import { SummaryBar } from '@/components/pm/SummaryBar';
import { NewTicketModal } from '@/components/pm/NewTicketModal';
import { TodayBriefsView } from '@/components/pm/TodayBriefsView';
import { useWorkspaceMode } from '@/lib/useWorkspaceMode';

const PM_API = '/pm-api';

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PMPage() {
  const [tickets, setTickets]         = useState<Ticket[]>([]);
  const [summary, setSummary]         = useState<Summary | null>(null);
  const [loading, setLoading]         = useState(true);
  const [summaryLoading, setSummaryL] = useState(true);
  const [fetchError, setFetchError]   = useState<string | null>(null);
  const [selectedTicket, setSelected] = useState<Ticket | null>(null);
  const [refreshing, setRefreshing]   = useState(false);

  const { isOpen: isNewTicketOpen, onOpen: openNewTicket, onClose: closeNewTicket } = useDisclosure();
  const { mode: wsMode } = useWorkspaceMode();
  const isOpsMode = wsMode === 'operations';

  const ingestRunningRef = useRef(false);
  const lastIngestRef    = useRef(0);
  const toast            = useToast();

  const fetchTickets = useCallback(async () => {
    try {
      setFetchError(null);
      const tResp = (await pmFetch('/api/tickets?status=open&limit=200', PM_API)) as Record<string, unknown>;
      const tData: Ticket[] = Array.isArray(tResp) ? tResp : ((tResp?.tickets as Ticket[]) || []);
      setTickets(tData);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setFetchError(`Fetch failed: ${msg}`);
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSummary = useCallback(async () => {
    try {
      const sData = (await pmFetch('/api/summary', PM_API)) as Summary;
      setSummary(sData);
    } catch (e) { console.error(e); }
    finally { setSummaryL(false); }
  }, []);

  const triggerIngest = useCallback(async () => {
    if (ingestRunningRef.current) return;
    const now = Date.now();
    if (now - lastIngestRef.current < 30000) return;
    ingestRunningRef.current = true;
    lastIngestRef.current = now;
    try {
      await fetch(`${PM_API}/api/ingest/email`, { method: 'POST', credentials: 'include' });
    } catch (e) {
      console.warn('[Signal] ingest trigger failed:', e);
    } finally {
      ingestRunningRef.current = false;
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await triggerIngest();
      await new Promise(r => setTimeout(r, 3000));
      await Promise.all([fetchTickets(), fetchSummary()]);
    } finally {
      setRefreshing(false);
    }
  }, [refreshing, fetchTickets, fetchSummary, triggerIngest]);

  // Fetch a ticket by key and open ExecutionView
  const fetchAndOpenTicket = useCallback(async (ticketKey: string) => {
    // Check if we already have it in local state
    const cached = tickets.find(t => t.ticket_key === ticketKey);
    if (cached) { setSelected(cached); return; }
    try {
      const resp = (await pmFetch(`/api/tickets/${ticketKey}`, PM_API)) as Ticket | { ticket?: Ticket };
      // API may return ticket directly or nested under 'ticket'
      const t: Ticket | null = (resp as { ticket?: Ticket })?.ticket ?? (resp as Ticket) ?? null;
      if (t && t.ticket_key) {
        setSelected(t);
      } else {
        // Ticket not found — show toast, do not silently ignore
        toast({
          title: 'Ticket not found',
          description: `Could not load ${ticketKey}`,
          status: 'error',
          duration: 4000,
          isClosable: true,
          position: 'bottom-right',
        });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast({
        title: 'Failed to open ticket',
        description: msg,
        status: 'error',
        duration: 4000,
        isClosable: true,
        position: 'bottom-right',
      });
    }
  }, [tickets, toast]);

  useEffect(() => {
    const run = async () => {
      await triggerIngest();
      await new Promise(r => setTimeout(r, 2000));
      fetchTickets();
      fetchSummary();
    };
    run();
    const iv = setInterval(() => { fetchTickets(); fetchSummary(); }, 60000);
    return () => clearInterval(iv);
  }, [fetchTickets, fetchSummary, triggerIngest]);

  // ── Execution view: full-screen replacement ──────────────────────────────
  if (selectedTicket) {
    return (
      <Box h="100dvh" display="flex" flexDirection="column" bg="gray.950" overflowX="hidden">
        <Box flex={1} minH={0} overflowY="auto">
          <ExecutionView
            ticket={selectedTicket}
            onBack={() => setSelected(null)}
          />
        </Box>
      </Box>
    );
  }

  // ── Dashboard: full-width TodayBriefsView ─────────────────────────────────
  return (
    <Box h="100dvh" display="flex" flexDirection="column" bg="gray.950" overflowX="hidden">
      {isDemoMode() && <DemoBanner />}
      <SummaryBar summary={summary} loading={summaryLoading} />

      {/* Top toolbar */}
      <HStack
        px={3} py={1.5}
        borderBottom="1px solid" borderColor="gray.800"
        flexShrink={0}
        justify="space-between"
        bg="gray.950"
      >
        <HStack spacing={2}>
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
            title="Refresh from database"
          >
            ↺ REFRESH
          </Button>
          {fetchError && !loading && (
            <Text fontSize="2xs" fontFamily="mono" color="red.400" noOfLines={1}>
              ⚠ {fetchError}
            </Text>
          )}
        </HStack>
        {isOpsMode && (
          <Button
            size="xs"
            bg="blue.800"
            color="blue.200"
            fontFamily="mono"
            fontSize="2xs"
            _hover={{ bg: 'blue.700' }}
            letterSpacing="wider"
            onClick={openNewTicket}
          >
            + NEW TICKET
          </Button>
        )}
      </HStack>

      {/* Main content: TodayBriefsView fills remaining space */}
      <Box flex={1} minH={0} overflow="hidden">
        <TodayBriefsView
          pmApi={PM_API}
          onOpenTicket={fetchAndOpenTicket}
        />
      </Box>

      <NewTicketModal
        isOpen={isNewTicketOpen}
        onClose={closeNewTicket}
        onCreated={() => { fetchTickets(); fetchSummary(); }}
      />
    </Box>
  );
}
