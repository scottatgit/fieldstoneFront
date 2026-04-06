'use client';
import {
  Box, Flex, HStack, VStack, Text, Badge, Spinner,
} from '@chakra-ui/react';
import { useEffect, useState, useCallback } from 'react';
import { Ticket } from '@/components/pm/types';
import { ReadinessBadge, TrustDot } from '@/components/pm/SignalBadge';
import { pmFetch } from '@/lib/demoApi';
import Link from 'next/link';

const PM_API = '/pm-api'; // always use relative proxy — never localhost in cloud

// ─── Inline markdown renderer (mirrors PrepBriefDrawer) ──────────────────────
function renderMarkdown(md: string): string {
  const NL = '\n';
  const out = md
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^---$/gm, '<hr/>')
    .replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/^\|[-| :]+\|$/gm, '');

  const lines = out.split(NL);
  const result: string[] = [];
  let inList = false;
  let inTable = false;

  for (const line of lines) {
    const isLi      = line.trimStart().startsWith('- ') || /^\d+\.\s/.test(line.trimStart());
    const isTblRow  = /^\| .+ \|$/.test(line.trim());

    if (isTblRow) {
      const cells = line.split('|').slice(1, -1);
      const tr = '<tr>' + cells.map(c => `<td>${c.trim()}</td>`).join('') + '</tr>';
      if (!inTable) { result.push('<table>'); inTable = true; }
      result.push(tr);
    } else {
      if (inTable) { result.push('</table>'); inTable = false; }
      if (isLi) {
        const text = line.trimStart().replace(/^-\s/, '').replace(/^\d+\.\s/, '');
        if (!inList) { result.push('<ul>'); inList = true; }
        result.push(`<li>${text}</li>`);
      } else {
        if (inList) { result.push('</ul>'); inList = false; }
        result.push(line ? `<p>${line}</p>` : '');
      }
    }
  }
  if (inList)  result.push('</ul>');
  if (inTable) result.push('</table>');
  return result.join(NL);
}

// ─── Ticket row in left panel ─────────────────────────────────────────────────
function TicketRow({ ticket, selected, onClick }: {
  ticket: Ticket;
  selected: boolean;
  onClick: () => void;
}) {
  const client = ticket.client_display_name || ticket.sender_name || ticket.client_key || '—';
  const title  = ticket.title_clean || ticket.title || 'Untitled';

  return (
    <Box
      as="button"
      onClick={onClick}
      w="full"
      px={3} py={2.5}
      borderRadius="md"
      border="1px solid"
      borderColor={selected ? 'blue.500' : 'gray.800'}
      bg={selected ? 'blue.950' : 'transparent'}
      _hover={{ borderColor: selected ? 'blue.500' : 'gray.600', bg: selected ? 'blue.950' : 'gray.900' }}
      transition="all 0.1s"
      textAlign="left"
      mb={1}
    >
      <VStack align="stretch" spacing={0.5}>
        <Text
          fontSize="xs" fontWeight="bold" color={selected ? 'blue.200' : 'gray.200'}
          noOfLines={1} fontFamily="mono"
        >
          {client}
        </Text>
        <Text fontSize="2xs" color="gray.400" noOfLines={2} lineHeight="short">
          {title}
        </Text>
        <HStack spacing={1.5} mt={0.5}>
          {ticket.readiness_signal && (
            <ReadinessBadge score={ticket.readiness_score} />
          )}
          {ticket.trust_signal && (
            <TrustDot score={ticket.trust_score} />
          )}
          {ticket.decision_label && (
            <Badge
              fontSize="2xs" fontFamily="mono" variant="subtle" colorScheme="purple"
              px={1.5} py={0.5} borderRadius="sm"
            >
              {ticket.decision_label}
            </Badge>
          )}
        </HStack>
      </VStack>
    </Box>
  );
}

// ─── Brief content panel ──────────────────────────────────────────────────────
function BriefPanel({ ticket, brief, loading, totalTickets, ticketsLoading }: {
  ticket: Ticket | null;
  brief: string;
  loading: boolean;
  totalTickets: number;
  ticketsLoading: boolean;
}) {
  if (!ticket) {
    // MODE-007: No tickets yet — show first-run guidance instead of 'SELECT A TICKET'
    if (!ticketsLoading && totalTickets === 0) return (
      <Flex flex={1} align="center" justify="center" p={8}>
        <VStack spacing={4} align="center" maxW="420px">
          <Text fontSize="2xl" color="gray.800">◎</Text>
          <VStack spacing={1} align="center">
            <Text fontSize="sm" fontWeight="bold" color="gray.400" fontFamily="mono" letterSpacing="wider">
              NO TICKETS YET
            </Text>
            <Text fontSize="xs" color="gray.600" textAlign="center" lineHeight="tall">
              Connect your support inbox and run your first ingestion.
              Signal will generate a prep brief for every ticket — risk flags, contact context, and next actions.
            </Text>
          </VStack>
          <VStack spacing={2} align="stretch" w="full" maxW="260px">
            <Box
              as="a" href="/pm/setup"
              display="block" textAlign="center"
              px={4} py={2} borderRadius="md"
              border="1px solid" borderColor="blue.700"
              bg="blue.950" color="blue.300"
              fontSize="2xs" fontFamily="mono" fontWeight="bold"
              _hover={{ bg: 'blue.900', borderColor: 'blue.500' }}
              transition="all 0.15s"
            >
              CONNECT INBOX →
            </Box>
            <Box
              as="a" href="/pm"
              display="block" textAlign="center"
              px={4} py={2} borderRadius="md"
              border="1px solid" borderColor="gray.700"
              color="gray.500"
              fontSize="2xs" fontFamily="mono"
              _hover={{ color: 'gray.300', borderColor: 'gray.600' }}
              transition="all 0.15s"
            >
              ← BACK TO DASHBOARD
            </Box>
          </VStack>
        </VStack>
      </Flex>
    );
    // Tickets exist but none selected — standard prompt
    return (
      <Flex flex={1} align="center" justify="center" p={8}>
        <VStack spacing={3} align="center" maxW="360px">
          <Text fontSize="2xl" color="gray.700">◎</Text>
          <Text fontSize="sm" fontWeight="bold" color="gray.500" fontFamily="mono">
            SELECT A TICKET
          </Text>
          <Text fontSize="xs" color="gray.600" textAlign="center">
            Choose any ticket from the left panel to generate its prep brief.
          </Text>
        </VStack>
      </Flex>
    );
  }

  if (loading) return (
    <Flex flex={1} align="center" justify="center" direction="column" gap={3}>
      <Spinner color="blue.400" size="lg" thickness="3px" />
      <Text color="gray.500" fontSize="xs" fontFamily="mono">Generating brief…</Text>
    </Flex>
  );

  if (!brief) return (
    <Flex flex={1} align="center" justify="center" p={8}>
      <Text fontSize="sm" color="gray.600" fontFamily="mono">No brief data returned.</Text>
    </Flex>
  );

  return (
    <Box
      flex={1} overflowY="auto" p={6}
      css={{
        '&::-webkit-scrollbar': { width: '4px' },
        '&::-webkit-scrollbar-thumb': { background: '#2D3748', borderRadius: '2px' },
        // Brief typography
        '& h1,& h2,& h3': { color: '#90CDF4', fontFamily: 'mono', letterSpacing: '0.05em', marginBottom: '6px', marginTop: '18px' },
        '& h2': { fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: '#63B3ED', borderBottom: '1px solid #2D3748', paddingBottom: '4px' },
        '& h3': { fontSize: '10px', color: '#90CDF4' },
        '& p':  { color: '#CBD5E0', fontSize: '13px', lineHeight: '1.7', marginBottom: '4px' },
        '& li': { color: '#CBD5E0', fontSize: '13px', lineHeight: '1.7', marginLeft: '16px', listStyleType: 'disc' },
        '& ul': { marginBottom: '8px' },
        '& strong': { color: '#E2E8F0', fontWeight: '700' },
        '& em':     { color: '#A0AEC0' },
        '& code':   { background: '#1A202C', color: '#68D391', padding: '1px 5px', borderRadius: '3px', fontSize: '11px', fontFamily: 'mono' },
        '& hr':     { border: 'none', borderTop: '1px solid #2D3748', margin: '12px 0' },
        '& blockquote': { borderLeft: '3px solid #3182CE', paddingLeft: '12px', color: '#718096', fontStyle: 'italic' },
        '& table':  { width: '100%', borderCollapse: 'collapse', marginBottom: '8px', fontSize: '12px' },
        '& td':     { border: '1px solid #2D3748', padding: '4px 8px', color: '#CBD5E0' },
      }}
      dangerouslySetInnerHTML={{ __html: renderMarkdown(brief) }}
    />
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function BriefPage() {
  const [tickets, setTickets]         = useState<Ticket[]>([]);
  const [ticketsLoading, setTLoading] = useState(true);
  const [selected, setSelected]       = useState<Ticket | null>(null);
  const [brief, setBrief]             = useState<string>('');
  const [briefLoading, setBLoading]   = useState(false);
  const [error, setError]             = useState<string | null>(null);

  // Load tickets on mount
  const fetchTickets = useCallback(async () => {
    try {
      const data = await pmFetch('/api/tickets?status=open&limit=200', PM_API) as any;
      const list: Ticket[] = Array.isArray(data) ? data : (data?.tickets || []);
      setTickets(list);
    } catch (e) {
      setError('Failed to load tickets');
    } finally {
      setTLoading(false);
    }
  }, []);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  // Load brief for selected ticket
  const loadBrief = useCallback(async (ticket: Ticket) => {
    setSelected(ticket);
    setBrief('');
    setBLoading(true);
    try {
      const res = await fetch(`${PM_API}/api/brief/${ticket.ticket_key}`, { method: 'POST' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as { brief?: string };
      setBrief(data.brief || '');
    } catch (e: any) {
      setBrief('');
      setError(`Brief failed: ${e.message}`);
    } finally {
      setBLoading(false);
    }
  }, []);

  return (
    <Box h="100dvh" display="flex" flexDirection="column" bg="gray.950" overflowX="hidden">
      {/* Header bar */}
      <HStack
        px={4} py={2.5} flexShrink={0}
        borderBottom="1px solid" borderColor="gray.700"
        justify="space-between"
      >
        <HStack spacing={3}>
          <Link href="/pm">
            <Box
              as="span" fontSize="2xs" fontFamily="mono" color="gray.500"
              _hover={{ color: 'blue.400' }} cursor="pointer" transition="color 0.1s"
            >
              ← DISPATCH
            </Box>
          </Link>
          <Text fontSize="2xs" color="gray.700">|</Text>
          <Text fontSize="xs" fontWeight="bold" fontFamily="mono" color="blue.300" letterSpacing="wider">
            BRIEF
          </Text>
          <Badge colorScheme="blue" fontSize="2xs" fontFamily="mono" variant="subtle">
            INTELLIGENCE
          </Badge>
        </HStack>
        {selected && (
          <HStack spacing={2}>
            <Text fontSize="2xs" fontFamily="mono" color="gray.500" noOfLines={1} maxW="280px">
              {selected.client_display_name || selected.client_key} — {selected.title_clean || selected.title}
            </Text>
            {selected.readiness_signal && <ReadinessBadge score={selected.readiness_score} />}
          </HStack>
        )}
      </HStack>

      {/* Error banner */}
      {error && (
        <Box px={4} py={2} bg="red.900" borderBottom="1px solid" borderColor="red.700" flexShrink={0}>
          <Text fontSize="2xs" fontFamily="mono" color="red.200">⚠ {error}</Text>
        </Box>
      )}

      {/* Body: split panel */}
      <Flex flex={1} minH={0}>

        {/* ── Left: Ticket list ── */}
        <Box
          w="340px" flexShrink={0}
          borderRight="1px solid" borderColor="gray.700"
          display="flex" flexDirection="column"
          bg="gray.950"
        >
          {/* Panel header */}
          <HStack
            px={3} py={2} flexShrink={0}
            borderBottom="1px solid" borderColor="gray.800"
            justify="space-between"
          >
            <Text fontSize="2xs" fontWeight="bold" color="gray.400" fontFamily="mono" letterSpacing="wider">
              TICKETS
            </Text>
            <Badge colorScheme="gray" fontSize="2xs" fontFamily="mono">
              {tickets.length}
            </Badge>
          </HStack>

          {/* Ticket list body */}
          {ticketsLoading ? (
            <Flex flex={1} align="center" justify="center" direction="column" gap={3}>
              <Spinner size="md" color="blue.400" thickness="2px" />
              <Text fontSize="2xs" color="gray.600" fontFamily="mono">Loading…</Text>
            </Flex>
          ) : tickets.length === 0 ? (
            <Flex flex={1} align="center" justify="center" p={6}>
              <VStack spacing={2}>
                <Text fontSize="xs" color="gray.600" fontFamily="mono">No open tickets</Text>
                <Link href="/pm/setup">
                  <Text fontSize="2xs" color="blue.500" _hover={{ color: 'blue.400' }} cursor="pointer">
                    Configure ingestion →
                  </Text>
                </Link>
              </VStack>
            </Flex>
          ) : (
            <Box
              flex={1} overflowY="auto" p={2}
              css={{
                '&::-webkit-scrollbar': { width: '4px' },
                '&::-webkit-scrollbar-thumb': { background: '#2D3748', borderRadius: '2px' },
              }}
            >
              {tickets.map(t => (
                <TicketRow
                  key={t.ticket_key}
                  ticket={t}
                  selected={selected?.ticket_key === t.ticket_key}
                  onClick={() => loadBrief(t)}
                />
              ))}
            </Box>
          )}
        </Box>

        {/* ── Right: Brief content ── */}
        <Box flex={1} display="flex" flexDirection="column" minW={0} bg="gray.950">
          <BriefPanel ticket={selected} brief={brief} loading={briefLoading} totalTickets={tickets.length} ticketsLoading={ticketsLoading} />
        </Box>
      </Flex>
    </Box>
  );
}
