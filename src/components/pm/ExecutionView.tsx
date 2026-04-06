'use client';
import React from 'react';
import {
  Box, Button, Flex, HStack, VStack, Text, Badge, Spinner,
  Textarea, Select, Collapse, useToast, Divider, Checkbox, useBreakpointValue,
  Popover, PopoverTrigger, PopoverContent, PopoverBody, PopoverArrow,
} from '@chakra-ui/react';
import { useEffect, useState, useRef, useCallback } from 'react';
import { Ticket, TicketContext, TicketSignals } from './types';
import { ReadinessBadge, TrustDot, DecisionBadge } from './SignalBadge';
import TicketSignalAI from './TicketSignalAI';
import { isDemoMode, demoFetch, getActiveTenant } from '@/lib/demoApi';
import { useWorkspaceMode } from '@/lib/useWorkspaceMode'; // MODE-004
import { track } from '@/lib/analytics';

// Demo-aware fetch wrapper for ExecutionView
async function exFetch(url: string, options?: RequestInit): Promise<Response> {
  if (isDemoMode()) {
    // Strip host + /pm-api prefix for demoFetch routing
    const endpoint = url.replace(/^https?:\/\/[^/]+/, '').replace(/^\/pm-api/, '');
    const method   = (options?.method || 'GET').toUpperCase();
    let bodyData: unknown;
    try { bodyData = options?.body ? JSON.parse(options.body as string) : undefined; } catch { bodyData = undefined; }
    const data = await demoFetch(endpoint, method, bodyData);
    return { ok: true, json: async () => data, status: 200 } as unknown as Response;
  }
  // Live mode: inject tenant slug + JWT cookie
  const tenant = getActiveTenant();
  const merged: RequestInit = {
    ...options,
    credentials: 'include',
    headers: {
      'x-tenant-slug': tenant,
      ...(options?.headers as Record<string, string> || {}),
    },
  };
  return fetch(url, merged);
}

const PM_API = '/pm-api';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';
type ViewMode  = 'door' | 'work';

interface BriefSections {
  situation:        string;
  expectation:      string;
  constraints:      string;
  decision:         string;
  risk_flags:       string;
  advanced:         string;
  contact:          string;
  additional_notes: string;
}

interface CloseDraft {
  work_performed:           string;
  outcome:                  string;
  recommendations:          string[];
  ai_close_note?:           string;
  ai_outcome_type?:         string;
  ai_generated?:            boolean;
  expectation_drift_status?: string;  // Phase C2: met | shifted | unmet | unknown
}

interface ExpSignal {
  auto_value:       string | null;
  effective_value:  string | null;
  confidence_state: string;
  human_inputs:     { type: string; author: string; note: string | null; created_at: string }[];
}



function formatVisitDatetime(iso: string | null | undefined): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleString('en-US', {
      weekday: 'short', month: 'numeric', day: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true,
    });
  } catch { return iso; }
}

function parseBriefSections(md: string): BriefSections {
  const ADVANCED = ['TECHNICAL','RESOLUTION STEP','CLIENT HISTORY','CROSS-CLIENT','KB REF','KNOWLEDGE BASE','HISTORICAL','INTEL','BACKGROUND'];
  const lines = md.split('\n');
  const sections: Record<string, string[]> = {};
  let current = 'preamble';
  for (const line of lines) {
    const h = line.replace(/^#+\s*/, '').trim().toUpperCase();
    if (line.startsWith('#')) {
      if      (h.includes('SITUATION') || h.includes('SUMMARY'))                current = 'situation';
      else if (h.includes('EXPECTATION') || h.includes('CLIENT EXPECT'))        current = 'expectation';
      else if (h.includes('CONSTRAINT') || h.includes('ACCESS') || h.includes('TIME SENSITIVE')) current = 'constraints';
      else if (h.includes('DECISION') || h.includes('ACTION'))                  current = 'decision';
      else if (h.includes('CONTACT'))                                            current = 'contact';
      else if (h.includes('ADDITIONAL') || h.includes('NOTES'))                 current = 'additional_notes';
      else if (h.includes('RISK') || h.includes('FLAG'))                        current = 'risk_flags';
      else if (ADVANCED.some(a => h.includes(a)))                               current = 'advanced';
      else                                                                       current = 'advanced';
      continue;
    }
    if (!sections[current]) sections[current] = [];
    sections[current].push(line);
  }
  const join = (k: string) => (sections[k] || []).join('\n').trim();
  return {
    situation:   join('situation')   || join('preamble'),
    expectation: join('expectation'),
    constraints: join('constraints'),
    contact:          join('contact'),
    additional_notes: join('additional_notes'),
    decision:         join('decision'),
    risk_flags:  join('risk_flags'),
    advanced:    join('advanced'),
  };
}

function renderInline(md: string): string {
  return md
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g,'<em>$1</em>')
    .replace(/`([^`]+)`/g,'<code>$1</code>')
    .replace(/^[-•]\s+/gm,'• ')
    .replace(/\n/g,'<br/>');
}

function SectionBlock({ label, content, accent = 'blue' }: { label: string; content: string; accent?: string }) {
  if (!content) return null;
  return (
    <Box mb={5}>
      <Text fontSize="2xs" fontFamily="mono" fontWeight="bold" color={`${accent}.400`}
        letterSpacing="widest" textTransform="uppercase" mb={2}>{label}</Text>
      <Box fontSize="sm" color="gray.200" lineHeight="tall"
        dangerouslySetInnerHTML={{ __html: renderInline(content) }}
        sx={{ strong: { color: 'white', fontWeight: 'bold' }, em: { color: 'gray.400' },
          code: { bg: 'gray.800', color: 'green.300', px: 1, borderRadius: 'sm', fontSize: 'xs', fontFamily: 'mono' } }}
      />
    </Box>
  );
}


const SIGNAL_CONFIG = [
  { key: 'readiness',   label: 'READINESS',   accent: '#63B3ED', icon: '⚡' },
  { key: 'trust',       label: 'TRUST',       accent: '#B794F4', icon: '🤝' },
  { key: 'expectation', label: 'EXPECTATION', accent: '#9F7AEA', icon: '🎯' },
  { key: 'constraint',  label: 'CONSTRAINTS', accent: '#F6AD55', icon: '⏱' },
  { key: 'decision',    label: 'DECISION',    accent: '#68D391', icon: '⚙' },
] as const;

// -- Goal 1: Brief with operational header ---------------------------------

type DeduceStatus = 'idle' | 'deducing' | 'success' | 'failed';

function needsDeduce(ticket: Ticket): boolean {
  if (ticket.deduce_status === 'done') return false;
  const hasExpectation = !!(ticket.expectation_signal?.trim());
  const hasConstraint  = !!(ticket.constraint_signal?.trim());
  const hasDecision    = !!(ticket.decision_signal?.trim());
  return !hasExpectation && !hasConstraint && !hasDecision;
}

function DoorView({ ticket, refreshKey }: { ticket: Ticket; refreshKey: number }) {
  const [sections, setSections]     = useState<BriefSections | null>(null);
  const [loading, setLoading]       = useState(true);
  const [deduced, setDeduced] = useState<{
    signals: Record<string, string>;
    risk_flags: string[];
    confidence: Record<string, number>;
    ai_used: string[];
  } | null>(null);
  const [deducing, setDeducing] = useState(false);
  const [deduceStatus, setDeduceStatus] = useState<DeduceStatus>('idle');
  const [deduceError, setDeduceError] = useState<string>('');
  const [trajectory, setTrajectory] = useState<{
    trend: string; ticket_count: number;
    avg_trust?: number; avg_readiness?: number; recurrence_rate?: number;
  } | null>(null);
  const deduceAttempted = useRef(false);

  useEffect(() => {
    setLoading(true);
    exFetch(`${PM_API}/api/brief/${ticket.ticket_key}`, { method: 'POST' })
      .then((r: Response) => r.json())
      .then(d => {
        const brief = (d.brief || '')
          .replace(/Generated by SecondBrain[^\n]*/gi, '')
          .replace(/Generated on[^\n]*/gi, '')
          .replace(/---\s*$/, '')
          .trim();
        setSections(parseBriefSections(brief));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [ticket.ticket_key, refreshKey]);

  // Phase B2: fetch client trajectory on ticket load
  useEffect(() => {
    setTrajectory(null);
    if (!ticket?.ticket_key) return;
    exFetch(`${PM_API}/api/tickets/${ticket.ticket_key}/client-trajectory`)
      .then((r: Response) => r.ok ? r.json() : Promise.reject(r.status))
      .then((d: { trend: string; ticket_count: number; avg_trust?: number; avg_readiness?: number; recurrence_rate?: number }) => {
        if (d.ticket_count >= 3) setTrajectory(d);
      })
      .catch(() => setTrajectory(null));
  }, [ticket.ticket_key, refreshKey]);


  const toast = useToast();

  const runDeduce = useCallback(async (opts?: { auto?: boolean }) => {
    if (deducing) return;
    setDeducing(true);
    setDeduceStatus('deducing');
    setDeduceError('');
    try {
      const r = await exFetch(`${PM_API}/api/tickets/${ticket.ticket_key}/signals/deduce`, { method: 'POST' });
      if (!r.ok) {
        const errText = await r.text();
        throw new Error(`API ${r.status}: ${errText.slice(0, 120)}`);
      }
      const d = await r.json();
      setDeduced(d);
      setDeduceStatus('success');
      if (opts?.auto) {
        setTimeout(() => setDeduceStatus('idle'), 4000);
      }
      if (!opts?.auto) {
        const aiCount = d.ai_used?.length ?? 0;
        toast({ title: `✅ ${aiCount} signal${aiCount !== 1 ? 's' : ''} deduced`, status: 'success', duration: 3000, isClosable: true });
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('Deduce failed', msg);
      setDeduceStatus('failed');
      setDeduceError(msg.slice(0, 200));
      if (!opts?.auto) {
        toast({ title: '❌ Deduce failed', description: msg.slice(0, 200), status: 'error', duration: 5000, isClosable: true });
      }
    } finally {
      setDeducing(false);
    }
  }, [ticket.ticket_key, deducing, toast]);

  // Auto-trigger deduce once on Brief open if signals are missing
  useEffect(() => {
    if (deduceAttempted.current) return;
    if (!needsDeduce(ticket)) return;
    deduceAttempted.current = true;
    runDeduce({ auto: true });
  }, [ticket.ticket_key]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return (
    <Flex flex={1} align='center' justify='center' direction='column' gap={3}>
      <Spinner color='blue.400' size='lg' thickness='3px' />
      <Text color='gray.500' fontSize='xs' fontFamily='mono'>Loading situation...</Text>
    </Flex>
  );
  if (!sections) return (
    <Flex flex={1} align='center' justify='center'>
      <Text color='gray.600' fontSize='sm'>No brief available</Text>
    </Flex>
  );

  const contactName    = sections?.contact?.trim() || ticket.sender_name || null;
  const contactPhone   = ticket.contact_phone || null;
  const visitFormatted = formatVisitDatetime(ticket.visit_datetime);
  const clientName     = ticket.client_display_name || ticket.client_key || '';

  // Situation fallback chain:
  // 1. sections.situation (from brief ## SITUATION header)
  // 2. ticket.situation (stored deterministic field from DB)
  // 3. cleanTitle(ticket.title) — derived from last / segment
  // 4. raw title as last resort
  const situationContent = sections?.situation?.trim() || ticket.situation?.trim() || cleanTitle(ticket.title) || ticket.title || '';

  // Format phone for tel: link (strip non-digits)
  const telHref = contactPhone ? `tel:${contactPhone.replace(/\D/g, '')}` : null;

  return (
    <Box flex={1} px={{ base: 4, md: 8 }} py={{ base: 4, md: 6 }} pb={{ base: 8, md: 8 }}
      css={{ '&::-webkit-scrollbar': { width: '4px' }, '&::-webkit-scrollbar-thumb': { background: '#2D3748', borderRadius: '2px' } }}
      maxW='760px' mx='auto' w='full'>

      {/* Operational Header */}
      <Box mb={6} pb={4} borderBottom='1px solid' borderColor='gray.800'>
        <Text fontSize={{ base: 'xl', md: 'lg' }} fontWeight='bold' color='white' mb={1}>{clientName}</Text>
        {/* Phase B2: Client trajectory badge */}
        {trajectory && trajectory.trend !== 'insufficient_data' && (
          <span style={{
            display: 'inline-block',
            fontSize: '0.7rem',
            padding: '2px 8px',
            borderRadius: '9999px',
            marginTop: '4px',
            background:
              trajectory.trend === 'improving' ? 'rgba(20,83,45,0.8)' :
              trajectory.trend === 'degrading' ? 'rgba(127,29,29,0.8)' :
              trajectory.trend === 'recurring' ? 'rgba(120,53,15,0.8)' :
              'rgba(39,39,42,0.8)',
            color:
              trajectory.trend === 'improving' ? '#86efac' :
              trajectory.trend === 'degrading' ? '#fca5a5' :
              trajectory.trend === 'recurring' ? '#fcd34d' :
              '#a1a1aa',
          }}>
            {trajectory.trend === 'improving'  ? '▲ Improving relationship' :
             trajectory.trend === 'degrading'  ? '▼ Degrading relationship' :
             trajectory.trend === 'recurring'  ? '↻ Recurring issues' :
             '→ Stable'}
            {' · '}{trajectory.ticket_count} tickets
          </span>
        )}
        {contactName && (
          <Text fontSize='sm' color='gray.400'>Contact: {contactName}</Text>
        )}
        {contactPhone && telHref && (
          <HStack spacing={2} align='center' mt={0.5}>
            <Text fontSize='sm' color='gray.500'>Office:</Text>
            <Box as='a' href={telHref}
              fontSize='sm' fontWeight='medium'
              color='teal.300'
              _hover={{ color: 'teal.200', textDecoration: 'underline' }}
              cursor='pointer'
              letterSpacing='wide'
            >
              {contactPhone}
            </Box>
          </HStack>
        )}
        {visitFormatted && (
          <Text fontSize='sm' color='blue.300' mt={1}>Visit: {visitFormatted}</Text>
        )}
      </Box>

      <SectionBlock label='SITUATION'   content={situationContent}   accent='blue'   />



      {/* SIGNALS PANEL - all 5 signals with AI deduction fallback */}
      <Box mb={5}>
        {/* Header with inline status + Deduce button */}
        <HStack mb={3} justify='space-between' align='center'>
          <HStack spacing={3} align='center'>
            <Text fontSize='2xs' fontFamily='mono' fontWeight='bold' color='gray.500' letterSpacing='widest'>OPERATIONAL SIGNALS</Text>
            {/* Inline auto-deduce status indicator */}
            {deduceStatus === 'deducing' && (
              <HStack spacing={1.5}>
                <Spinner size='xs' color='purple.400' thickness='2px' />
                <Text fontSize='2xs' fontFamily='mono' color='purple.400'>Analyzing signals...</Text>
              </HStack>
            )}
            {deduceStatus === 'success' && (
              <Text fontSize='2xs' fontFamily='mono' color='green.400'>✅ Signals deduced by AI</Text>
            )}
            {deduceStatus === 'failed' && (
              <HStack spacing={1.5}>
                <Text fontSize='2xs' fontFamily='mono' color='orange.400'>⚠️ Auto-deduce failed</Text>
                <Box as='button' onClick={() => { setDeduceStatus('idle'); runDeduce({ auto: true }); }}
                  fontSize='2xs' fontFamily='mono' color='orange.300' textDecoration='underline' cursor='pointer'
                  bg='transparent' border='none' p={0}>
                  Retry
                </Box>
              </HStack>
            )}
          </HStack>
          <Box as='button' onClick={() => runDeduce()} disabled={deducing}
            px={3} py={1} borderRadius='md' bg='purple.900' border='1px solid' borderColor='purple.600'
            fontSize='xs' fontFamily='mono' color='purple.300' _hover={{ bg: 'purple.800' }}
            cursor={deducing ? 'not-allowed' : 'pointer'} opacity={deducing ? 0.7 : 1}
          >
            {deducing ? '⏳ Analyzing...' : '⚡ AI Deduce All'}
          </Box>
        </HStack>

        <VStack spacing={2} align='stretch'>
          {SIGNAL_CONFIG.map(({ key, label, accent, icon }) => {
            const ticketVal = ticket[`${key}_signal` as keyof Ticket] as string | null;
            const deducedVal = deduced?.signals?.[key];
            const value = ticketVal || deducedVal || '';
            const isAI = !ticketVal && !!deducedVal && deduced?.ai_used?.includes(key);
            const confidence = deduced?.confidence?.[key];
            const isEmpty = !value;

            return (
              <Box key={key} p={3} borderRadius='md' bg='blackAlpha.300'
                border='1px solid' borderColor={isEmpty ? 'gray.800' : 'gray.700'}>
                <HStack mb={isEmpty ? 0 : 1.5} justify='space-between'>
                  <HStack spacing={1.5}>
                    <Text fontSize='xs'>{icon}</Text>
                    <Text fontSize='2xs' fontFamily='mono' fontWeight='bold' letterSpacing='widest'
                      color={isEmpty ? 'gray.600' : 'gray.400'}>{label}</Text>
                  </HStack>
                  {isAI && confidence && (
                    <Box px={1.5} py={0.5} borderRadius='sm' bg='purple.900' border='1px solid' borderColor='purple.700'>
                      <Text fontSize='2xs' fontFamily='mono' color='purple.400'>
                        AI ~{Math.round(confidence * 100)}%
                      </Text>
                    </Box>
                  )}
                  {ticketVal && (
                    <Box px={1.5} py={0.5} borderRadius='sm' bg='green.900' border='1px solid' borderColor='green.700'>
                      <Text fontSize='2xs' fontFamily='mono' color='green.400'>DB ✓</Text>
                    </Box>
                  )}
                </HStack>
                {isEmpty ? (
                  <Text fontSize='xs' color='gray.600' fontStyle='italic'>
                    Not detected — click AI Deduce All to analyze
                  </Text>
                ) : (
                  <Text fontSize='sm' color='gray.200' lineHeight='tall'>{value}</Text>
                )}
              </Box>
            );
          })}
        </VStack>
      </Box>

      {/* RISK FLAGS - always shown */}
      <Box mb={5} p={3} borderRadius='md' bg='blackAlpha.400' border='1px solid'
        borderColor={((deduced?.risk_flags?.length ?? 0) > 0 || sections?.risk_flags) ? 'red.800' : 'gray.800'}>
        <Text fontSize='2xs' fontFamily='mono' fontWeight='bold' letterSpacing='widest' textTransform='uppercase'
          color={((deduced?.risk_flags?.length ?? 0) > 0 || sections?.risk_flags) ? 'red.400' : 'gray.600'} mb={2}>
          RISK FLAGS
        </Text>
        {sections?.risk_flags ? (
          <Box fontSize='sm' color='red.200' lineHeight='tall'
            dangerouslySetInnerHTML={{ __html: renderInline(sections.risk_flags) }} />
        ) : deduced?.risk_flags?.length ? (
          <VStack align='stretch' spacing={1}>
            {deduced.risk_flags.map((rf, i) => (
              <HStack key={i} spacing={2}>
                <Text fontSize='xs' color='red.400'>⚠</Text>
                <Text fontSize='sm' color='red.200'>{rf}</Text>
              </HStack>
            ))}
          </VStack>
        ) : (
          <Text fontSize='xs' color='gray.600' fontStyle='italic'>No flags detected — AI Deduce may reveal risks</Text>
        )}
      </Box>
    </Box>
  );
}

function cleanTitle(raw: string | null | undefined): string {
  if (!raw) return '';
  let t = raw.replace(/[\r\n]+/g, ' ').trim();
  t = t.replace(/^(Fw|Re|Fwd):\s*/i, '');
  t = t.replace(/^Project\s+Ticket#?\d+\/[^\/]+\/[^\/]+\//i, '').trim();
  t = t.replace(/^Project\s+Ticket\s*#?\d+\s*[-–]?\s*/i, '').trim();
  return t || raw.trim();
}

const OUTCOMES = [
  { key: 'resolved',  label: '✅ Resolved',  color: 'green'  },
  { key: 'mitigated', label: '⚡ Mitigated', color: 'yellow' },
  { key: 'at_risk',   label: '⚠️ At Risk',   color: 'orange' },
  { key: 'escalated', label: '🔴 Escalated', color: 'red'    },
] as const;

interface NoteEntry {
  id: number;
  content: string;
  author: string | null;
  note_type: string | null;
  note_source: string;         // N3b: 'manual' | 'ai_chat' | 'system' | 'import'
  note_category: string;       // N2: classifier output
  route_acct_mgmt: number;     // N2: routing flag
  route_sales: number;         // N2: routing flag
  route_followup: number;      // N2: routing flag
  category_confirmed: number;  // N2: human correction flag
  created_at: string;
  intel_candidate: number;
  intel_reason: string | null;
}

const NOTE_CATEGORY_BADGE: Record<string, { label: string; color: string }> = {
  // work_note intentionally omitted — default, no badge
  client_request:    { label: '💬 request', color: 'blue'   },
  quote_opportunity: { label: '💰 quote',   color: 'green'  },
  risk_concern:      { label: '⚠️ risk',    color: 'orange' },
  follow_up:         { label: '🔁 follow',  color: 'purple' },
};

type NoteStatus = 'idle' | 'saving' | 'saved' | 'updated';

// N2b: Category correction picker options
const CATEGORY_OPTIONS: Array<{ value: string; label: string; color: string }> = [
  { value: 'work_note',         label: '🔧 Work Note',         color: 'gray'   },
  { value: 'client_request',    label: '💬 Client Request',    color: 'blue'   },
  { value: 'quote_opportunity', label: '💰 Quote Opportunity', color: 'green'  },
  { value: 'risk_concern',      label: '⚠️ Risk / Concern',    color: 'orange' },
  { value: 'follow_up',         label: '🔁 Follow Up',         color: 'purple' },
];

function formatNoteTime(iso: string): string {
  try {
    const d = new Date(iso + 'Z');
    return d.toLocaleString('en-US', {
      month: 'numeric', day: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true,
    });
  } catch { return iso; }
}

// -- Main ExecutionView -------------------------------------------------------
export function ExecutionView({ ticket, onBack }: { ticket: Ticket; onBack: () => void }) {
  // MODE-004: workspace mode gate — fail-open to 'operations' on error
  const { mode: wsMode } = useWorkspaceMode();
  const isOpsMode = wsMode === 'operations';
  // Pre-compute display values to avoid inline ternaries in JSX (SWC compat)
  const closeSectionDisplay = isOpsMode ? undefined : 'none';
  const [viewMode, setViewMode]     = useState<ViewMode>('door');
  const [saveState, _setSaveState]   = useState<SaveState>('idle');
  const [refreshKey, setRefreshKey] = useState(0);

  // ── Phase 7C: structured context + signals state ──────────────────────────
  const [ingestContext,  setIngestContext]  = useState<TicketContext | null>(null);
  const [ingestSignals,  setIngestSignals]  = useState<TicketSignals | null>(null);
  const [ingestStatus,   setIngestStatus]   = useState<string>('never_queued');
  const [isPolling,      setIsPolling]      = useState(false);

  // ── Outcome / Close (slim bar in Work view) ────────────────────────────────
  const [outcomeType,   setOutcomeType]   = useState<string | null>(null);
  const [ticketClosed,  setTicketClosed]  = useState(false);
  const [closeLoading,  setCloseLoading]  = useState(false);
  // ── Notes section state ────────────────────────────────────────────────
  const [noteText,    setNoteText]    = useState('');
  const [noteStatus,  setNoteStatus]  = useState<NoteStatus>('idle');
  const [savedNotes,  setSavedNotes]  = useState<NoteEntry[]>([]);
  const notesLoaded                   = useRef(false);
  const noteStatusTimer               = useRef<ReturnType<typeof setTimeout> | null>(null);
  // N2b: category correction
  const [correctingNoteId, setCorrectingNoteId] = useState<number | null>(null);
  const [noteErrors,       setNoteErrors]       = useState<Record<string, string>>({});
  const [showAllNotes,   setShowAllNotes]   = useState(false);
  // N3 Mobile: collapsible sections (mobile only)
  const isMobile                            = useBreakpointValue({ base: true, md: false });
  const [chatExpanded,   setChatExpanded]   = useState(false);  // default collapsed on mobile
  const [notesExpanded,  setNotesExpanded]  = useState(true);   // default expanded on mobile

  async function handleCloseTicket() {
    if (!outcomeType || closeLoading || ticketClosed) return;
    setCloseLoading(true);
    try {
      const res = await exFetch(`${PM_API}/api/tickets/${ticket.ticket_key}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outcome_type: outcomeType }),
      });
      if (res.ok) {
        setTicketClosed(true);
        // FST-AN-002: track ticket closure — no ticket content, workspace_id only
        track('ticket_closed', { workspace_id: getActiveTenant() ?? undefined });
      }
      else console.error('[close] POST /close failed', res.status);
    } catch (e) {
      console.error('[close] POST /close error', e);
    } finally {
      setCloseLoading(false);
    }
  }

  async function handleSaveNote() {
    const text = noteText.trim();
    if (!text) return;
    if (noteStatusTimer.current) clearTimeout(noteStatusTimer.current);
    setNoteStatus('saving');
    const optimisticNote: NoteEntry = {
      id: Date.now(),
      content: text,
      author: 'tech',
      note_type: 'tech_note',
      note_source: 'manual',        // N3b: human-authored
      note_category: 'work_note',   // classifier will correct on refresh
      route_acct_mgmt: 0,
      route_sales: 0,
      route_followup: 0,
      category_confirmed: 0,
      created_at: new Date().toISOString(),
      intel_candidate: text.length > 80 ? 1 : 0,
      intel_reason: null,
    };
    setSavedNotes(prev => [optimisticNote, ...prev]);
    setNoteText('');
    try {
      const res = await exFetch(`${PM_API}/api/tickets/${ticket.ticket_key}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text, author: 'tech', type: 'tech_note' }),
      });
      if (res.ok) {
        setNoteStatus('saved');
        exFetch(`${PM_API}/api/tickets/${ticket.ticket_key}/notes${showAllNotes ? '?show_all=true' : ''}`)
          .then((r: Response) => r.ok ? r.json() : Promise.reject())
          .then((d: { notes: NoteEntry[] }) => setSavedNotes(d.notes || []))
          .catch(() => {});
      } else {
        setNoteStatus('idle');
      }
    } catch {
      setNoteStatus('idle');
    }
    noteStatusTimer.current = setTimeout(() => setNoteStatus('updated'), 3000);
  }
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── N2b: Category correction ─────────────────────────────────────────────────
  const handleCategoryCorrection = useCallback(async (
    noteId: number, newCategory: string, prevCategory: string
  ) => {
    if (newCategory === prevCategory) return;
    setNoteErrors(e => { const n = { ...e }; delete n[String(noteId)]; return n; });
    setSavedNotes(prev => prev.map(n =>
      n.id === noteId ? { ...n, note_category: newCategory, category_confirmed: 1 } : n
    ));
    try {
      const r = await exFetch(
        `/pm-api/api/tickets/${ticket.ticket_key}/notes/${noteId}`,
        {
          method:  'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ note_category: newCategory }),
        }
      );
      const data = await r.json();
      if (r.ok && data.note) {
        setSavedNotes(prev => prev.map(n => n.id === noteId ? { ...data.note } : n));
      } else {
        throw new Error(data.detail || 'PATCH failed');
      }
    } catch {
      setSavedNotes(prev => prev.map(n =>
        n.id === noteId ? { ...n, note_category: prevCategory, category_confirmed: 0 } : n
      ));
      setNoteErrors(e => ({ ...e, [String(noteId)]: 'Could not save — tap to retry' }));
    }
  }, [ticket.ticket_key]);

  // Fetch /context and /ingest/status on ticket open
  const fetchContext = useCallback(async () => {
    try {
      const [ctxRes, statusRes] = await Promise.all([
        exFetch(`${PM_API}/api/tickets/${ticket.ticket_key}/context`),
        exFetch(`${PM_API}/api/tickets/${ticket.ticket_key}/ingest/status`),
      ]);
      const ctxData    = await ctxRes.json();
      const statusData = await statusRes.json();
      setIngestContext(ctxData.context   ?? null);
      setIngestSignals(ctxData.signals   ?? null);
      setIngestStatus(statusData.status  ?? 'never_queued');
    } catch {
      setIngestStatus('never_queued');
    }
  }, [ticket.ticket_key]);

  // Trigger ingestion + poll every 2s (max 30s) then refresh context
  const triggerIngest = useCallback(async () => {
    try {
      await exFetch(`${PM_API}/api/tickets/${ticket.ticket_key}/ingest`, { method: 'POST' });
      setIngestStatus('pending');
      setIsPolling(true);
      let elapsed = 0;
      pollRef.current = setInterval(async () => {
        elapsed += 2;
        try {
          const res  = await exFetch(`${PM_API}/api/tickets/${ticket.ticket_key}/ingest/status`);
          const data = await res.json();
          if (data.status === 'completed' || data.status === 'failed' || elapsed >= 30) {
            clearInterval(pollRef.current!);
            setIsPolling(false);
            setIngestStatus(data.status);
            if (data.status === 'completed') await fetchContext();
          } else {
            setIngestStatus(data.status);
          }
        } catch {
          clearInterval(pollRef.current!);
          setIsPolling(false);
        }
      }, 2000);
    } catch {
      setIngestStatus('failed');
    }
  }, [ticket.ticket_key, fetchContext]);

  // Fetch context on ticket open; clear poll on unmount
  useEffect(() => {
    fetchContext();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchContext]);

  // ── Fetch saved notes: on Work tab mount + on showAllNotes toggle ──────────
  useEffect(() => {
    if (viewMode !== 'work') return;
    notesLoaded.current = true;
    const url = showAllNotes
      ? `${PM_API}/api/tickets/${ticket.ticket_key}/notes?show_all=true`
      : `${PM_API}/api/tickets/${ticket.ticket_key}/notes`;
    exFetch(url)
      .then((r: Response) => r.ok ? r.json() : Promise.reject())
      .then((d: { notes: NoteEntry[] }) => setSavedNotes(d.notes || []))
      .catch(() => {});
  }, [viewMode, ticket.ticket_key, showAllNotes]);


  const clientName   = ticket.client_display_name || ticket.client_key || 'Unknown';

  const saveIndicator: Record<SaveState, React.ReactNode> = {
    idle:   null,
    saving: (<HStack spacing={1}><Spinner size='xs' color='yellow.400' /><Text fontSize='2xs' fontFamily='mono' color='yellow.400'>Saving...</Text></HStack>),
    saved:  (<Text fontSize='2xs' fontFamily='mono' color='green.400'>Saved</Text>),
    error:  (<Text fontSize='2xs' fontFamily='mono' color='red.400'>Connection issue</Text>),
  };

  return (
    <Flex minH='100dvh' direction='column' bg='gray.950' overflowX='hidden' maxW='100vw'>

      {/* Header */}
      <Flex px={{ base: 2, md: 4 }} py={2} bg='gray.900' borderBottom='1px solid' borderColor='gray.700'
        align='center' justify='space-between' flexShrink={0} minH='48px'>
        <HStack spacing={3} minW={0} flex={1} overflow='hidden'>
          <Box as='button' onClick={onBack}
            fontSize='xs' fontFamily='mono' color='gray.500' cursor='pointer'
            px={3} minH='44px' borderRadius='sm' border='1px solid' borderColor='gray.700'
            _hover={{ borderColor: 'gray.500', color: 'white' }} flexShrink={0}>
            Back
          </Box>
          <TrustDot score={ingestSignals?.trust_score ?? ticket.trust_score} />
          <Text fontSize='2xs' fontFamily='mono' color='gray.500' flexShrink={0}>#{ticket.ticket_key}</Text>
          <Text fontSize='sm' fontWeight='bold' color='white' noOfLines={1} flex={1} minW={0}>{clientName}</Text>
          <ReadinessBadge score={ingestSignals?.readiness_score ?? ticket.readiness_score} />
          <DecisionBadge signal={ticket.decision_signal} label={ticket.decision_label} />
        </HStack>
        <HStack spacing={2} flexShrink={0} ml={3}>
          {saveIndicator[saveState]}
          <HStack spacing={0} border='1px solid' borderColor='gray.700' borderRadius='md' overflow='hidden'>
            <Box as='button' onClick={() => setViewMode('door')} px={3} minH='44px'
              fontSize='2xs' fontFamily='mono' cursor='pointer'
              bg={viewMode === 'door' ? 'blue.800' : 'gray.800'}
              color={viewMode === 'door' ? 'blue.200' : 'gray.500'}
              _hover={{ color: 'white' }} borderRight='1px solid' borderColor='gray.700'>
              Brief
            </Box>
            <Box as='button' onClick={() => setViewMode('work')} px={3} minH='44px'
              fontSize='2xs' fontFamily='mono' cursor='pointer'
              bg={viewMode === 'work' ? 'blue.900' : 'gray.800'}
              color={viewMode === 'work' ? 'blue.200' : 'gray.500'}
              _hover={{ color: 'white' }}>
              Work
            </Box>
          </HStack>

        </HStack>
      </Flex>

      {/* Body */}
      <Flex flex={1} position='relative' minH={0}>
        <Flex flex={1} direction='column' overflowX='hidden' align='center' minH={0}>

            {/* Phase 7C structured context banner removed — auto-deduce handles this */}

          {viewMode === 'door'
            ? <DoorView ticket={ticket} refreshKey={refreshKey} />
            : (
              <Flex direction='column' flex={1} minH={0} overflow='hidden' w='100%'>
                {/* Signal AI chat — collapsible on mobile, always expanded on desktop */}
                <Box flexShrink={0} display={isMobile && !chatExpanded ? 'block' : undefined}
                  flex={isMobile ? undefined : 1} minH={0}>
                  {/* Mobile collapse header */}
                  {isMobile && (
                    <Box as='button' w='100%' onClick={() => setChatExpanded(v => !v)}
                      display='flex' alignItems='center' justifyContent='space-between'
                      px={4} minH='44px' borderBottom='1px solid'
                      borderColor='gray.800' bg='gray.950'
                      _hover={{ bg: 'gray.900' }} cursor='pointer'>
                      <Text fontSize='2xs' fontFamily='mono' color='gray.500'
                        letterSpacing='widest' textTransform='uppercase'>Signal AI Chat</Text>
                      <Text fontSize='xs' color='gray.600'>{chatExpanded ? '▲' : '▼'}</Text>
                    </Box>
                  )}
                  <Collapse in={isMobile ? chatExpanded : true} animateOpacity>
                    <Box flex={1} minH={0} overflow='hidden' h={isMobile ? '300px' : '100%'}>
                      <TicketSignalAI ticket={ticket} />
                    </Box>
                  </Collapse>
                </Box>

                {/* ── Notes section ─────────────────────────────────── */}
                <Box flexShrink={0} borderTop='1px solid' borderColor='gray.800'
                  bg='gray.950' px={4} pt={3} pb={2}>
                  {/* Header + show all toggle + mobile collapse trigger */}
                  <HStack justify='space-between' align='center' mb={isMobile && notesExpanded ? 2 : 0}
                    as={isMobile ? 'button' : undefined}
                    onClick={isMobile ? () => setNotesExpanded(v => !v) : undefined}
                    w='100%' minH={isMobile ? '44px' : undefined}
                    cursor={isMobile ? 'pointer' : undefined}>
                    <Text fontSize='2xs' fontFamily='mono' color='gray.500'
                      letterSpacing='widest' textTransform='uppercase'>Notes</Text>
                    <HStack spacing={2}>
                      {/* Show all toggle — only visible when expanded or on desktop */}
                      {(!isMobile || notesExpanded) && (
                        <Box as='button'
                          onClick={(e: React.MouseEvent) => { e.stopPropagation(); setShowAllNotes(v => !v); }}
                          px={2} py={0.5} borderRadius='sm' border='1px solid'
                          borderColor='gray.700' bg='transparent'
                          color='gray.500' fontSize='2xs' fontFamily='mono'
                          cursor='pointer' _hover={{ color: 'gray.300', borderColor: 'gray.500' }}
                          transition='all 0.1s'>
                          {showAllNotes ? 'Tech only' : 'Show all'}
                        </Box>
                      )}
                      {isMobile && (
                        <Text fontSize='xs' color='gray.600'>{notesExpanded ? '▲' : '▼'}</Text>
                      )}
                    </HStack>
                  </HStack>

                  <Collapse in={isMobile ? notesExpanded : true} animateOpacity>
                  {/* Input row — MODE-004: ops-only */}
                  {!isOpsMode && (
                    <Box py={2} mb={2}>
                      <Text fontSize='2xs' fontFamily='mono' color='gray.600' letterSpacing='wider'>NOTES · OPERATIONS MODE ONLY</Text>
                    </Box>
                  )}
                  {isOpsMode && (
                    <Flex gap={2} align='flex-start' mb={2}>
                    <Textarea
                      value={noteText}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNoteText(e.target.value)}
                      onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); handleSaveNote(); }
                      }}
                      placeholder='Add a note...'
                      size='sm'
                      rows={2}
                      resize='none'
                      bg='gray.900'
                      borderColor='gray.700'
                      color='gray.200'
                      fontSize='sm'
                      flex={1}
                      _focus={{ borderColor: 'gray.500', boxShadow: 'none' }}
                      _placeholder={{ color: 'gray.600' }}
                    />
                    <Flex direction='column' align='flex-end' gap={1} flexShrink={0}>
                      <Box as='button'
                        onClick={handleSaveNote}
                        disabled={!noteText.trim() || noteStatus === 'saving'}
                        px={3} py={2} borderRadius='md'
                        bg={noteText.trim() ? 'gray.700' : 'gray.800'}
                        color={noteText.trim() ? 'gray.200' : 'gray.600'}
                        fontSize='xs' fontFamily='mono'
                        cursor={noteText.trim() ? 'pointer' : 'default'}
                        border='1px solid'
                        borderColor={noteText.trim() ? 'gray.600' : 'gray.800'}
                        _hover={{ bg: noteText.trim() ? 'gray.600' : 'gray.800' }}
                        minH='44px' minW='72px'
                        transition='all 0.15s'
                      >
                        {noteStatus === 'saving' ? 'Saving…' : 'Save'}
                      </Box>
                      {/* Inline status */}
                      <Text fontSize='2xs' fontFamily='mono' color={
                        noteStatus === 'saving' ? 'yellow.500' :
                        noteStatus === 'saved'  ? 'green.400' :
                        noteStatus === 'updated' ? 'gray.500' : 'transparent'
                      } textAlign='right' minH='14px'>
                        {noteStatus === 'saving'  ? 'Saving…' :
                         noteStatus === 'saved'   ? 'Saved' :
                         noteStatus === 'updated' ? 'Updated just now' : ''}
                      </Text>
                    </Flex>
                  </Flex>
                  )}

                  {/* Saved notes list */}
                  {savedNotes.length > 0 ? (
                    <VStack align='stretch' spacing={0} minH='120px' maxH='220px' overflowY='auto'
                      css={{ '&::-webkit-scrollbar': { width: '3px' }, '&::-webkit-scrollbar-thumb': { background: '#2D3748', borderRadius: '2px' } }}>
                      {savedNotes.map((note, idx) => (
                        <Box key={note.id ?? idx}
                          py={2} px={1}
                          borderBottom='1px solid'
                          borderColor='gray.800'
                          _last={{ borderBottom: 'none' }}>
                          {/* Header row: time · author · badges · edit trigger */}
                          <HStack spacing={2} mb={0.5} flexWrap='wrap' align='center'>
                            <Text fontSize='2xs' fontFamily='mono' color='gray.600'>
                              {formatNoteTime(note.created_at)}
                            </Text>
                            {note.author && note.author !== 'ai_chat' && (
                              <Text fontSize='2xs' fontFamily='mono' color='gray.600'>
                                · {note.author}
                              </Text>
                            )}
                            {/* N2b: category badge — tappable to open correction popover */}
                            {note.note_category && note.note_category !== 'work_note' && (() => {
                              const badge = NOTE_CATEGORY_BADGE[note.note_category];
                              if (!badge) return null;
                              const confirmed = note.category_confirmed === 1;
                              return (
                                <Box as='button'
                                  onClick={() => setCorrectingNoteId(
                                    correctingNoteId === note.id ? null : note.id
                                  )}
                                  px={1.5} py={0.5} borderRadius='sm'
                                  bg={confirmed ? `${badge.color}.900` : `${badge.color}.950`}
                                  border='1px solid'
                                  borderColor={`${badge.color}.${confirmed ? '700' : '800'}`}
                                  cursor='pointer'
                                  _hover={{ borderColor: `${badge.color}.600` }}>
                                  <Text fontSize='2xs' fontFamily='mono'
                                    color={`${badge.color}.${confirmed ? '300' : '400'}`}>
                                    {badge.label}{confirmed ? ' ✓' : ''}
                                  </Text>
                                </Box>
                              );
                            })()}
                            {/* ai_chat badge — visible in show-all mode */}
                            {note.author === 'ai_chat' && (
                              <Box px={1.5} py={0.5} borderRadius='sm'
                                bg='gray.800' border='1px solid' borderColor='gray.700'>
                                <Text fontSize='2xs' fontFamily='mono' color='gray.500'>
                                  💬 ai
                                </Text>
                              </Box>
                            )}
                            {note.intel_candidate === 1 && (
                              <Box px={1.5} py={0.5} borderRadius='sm'
                                bg='purple.950' border='1px solid' borderColor='purple.800'>
                                <Text fontSize='2xs' fontFamily='mono' color='purple.400'>
                                  🔬
                                </Text>
                              </Box>
                            )}
                            {/* N2b: edit trigger — always visible, right-aligned */}
                            <Box flex={1} />
                            <Popover
                              isOpen={correctingNoteId === note.id}
                              onClose={() => setCorrectingNoteId(null)}
                              placement='bottom-end'
                              isLazy
                              closeOnBlur
                            >
                              <PopoverTrigger>
                                <Box as='button'
                                  onClick={() => setCorrectingNoteId(
                                    correctingNoteId === note.id ? null : note.id
                                  )}
                                  px={1} py={0.5} borderRadius='sm'
                                  color='gray.700' fontSize='2xs'
                                  cursor='pointer' minH='24px' minW='24px'
                                  _hover={{ color: 'gray.400', bg: 'gray.800' }}
                                  transition='all 0.1s'>
                                  ✏️
                                </Box>
                              </PopoverTrigger>
                              <PopoverContent
                                bg='gray.900' border='1px solid'
                                borderColor='gray.700' w='180px'
                                _focus={{ boxShadow: 'none' }}
                                boxShadow='dark-lg'>
                                <PopoverArrow bg='gray.900' />
                                <PopoverBody p={1}>
                                  <Text fontSize='2xs' fontFamily='mono' color='gray.600'
                                    px={2} pt={1} pb={1.5} letterSpacing='wider'>
                                    CATEGORY
                                  </Text>
                                  {CATEGORY_OPTIONS.map(opt => (
                                    <Box as='button' key={opt.value} w='100%'
                                      textAlign='left' px={2} py={1.5}
                                      borderRadius='sm' display='block'
                                      bg={note.note_category === opt.value
                                        ? `${opt.color}.900` : 'transparent'}
                                      color={note.note_category === opt.value
                                        ? `${opt.color}.300` : 'gray.400'}
                                      fontSize='2xs' fontFamily='mono'
                                      cursor='pointer'
                                      _hover={{ bg: 'gray.800', color: 'gray.200' }}
                                      onClick={() => {
                                        setCorrectingNoteId(null);
                                        handleCategoryCorrection(
                                          note.id, opt.value, note.note_category
                                        );
                                      }}>
                                      {opt.label}
                                      {note.note_category === opt.value && ' ●'}
                                    </Box>
                                  ))}
                                </PopoverBody>
                              </PopoverContent>
                            </Popover>
                          </HStack>
                          <Text fontSize='sm' color='gray.300' lineHeight='tall'
                            whiteSpace='pre-wrap'>
                            {note.content}
                          </Text>
                          {/* N2b: inline correction error */}
                          {noteErrors[String(note.id)] && (
                            <Text fontSize='2xs' fontFamily='mono' color='red.400'
                              mt={0.5} cursor='pointer'
                              onClick={() => {
                                setNoteErrors(e => { const n={...e}; delete n[note.id]; return n; });
                                setCorrectingNoteId(note.id);
                              }}>
                              {noteErrors[String(note.id)]}
                            </Text>
                          )}
                        </Box>
                      ))}
                    </VStack>
                  ) : (
                    <Text fontSize='xs' fontFamily='mono' color='gray.700' py={1}>
                      No notes yet — add context above
                    </Text>
                  )}
                  </Collapse>
                </Box>

                {/* ── Slim OUTCOME bar ─────────────────────────────────── */}
                <Box flexShrink={0} borderTop='1px solid' borderColor='gray.700'
                  bg='gray.900' px={4} py={3}
                  display={closeSectionDisplay}> {/* MODE-004: ops-only */}
                  <Text fontSize='2xs' fontFamily='mono' color='gray.500'
                    letterSpacing='widest' textTransform='uppercase' mb={2}>Outcome</Text>
                  <HStack spacing={2} flexWrap='wrap'>
                    {OUTCOMES.map(({ key, label, color }) => (
                      <Box as='button' key={key}
                        onClick={() => { setOutcomeType(key); setTicketClosed(false); }}
                        px={3} py={1.5} borderRadius='md' border='1px solid'
                        borderColor={outcomeType === key ? `${color}.500` : 'gray.700'}
                        bg={outcomeType === key ? `${color}.900` : 'gray.900'}
                        color={outcomeType === key ? `${color}.200` : 'gray.500'}
                        fontSize='xs' fontFamily='mono' cursor='pointer'
                        _hover={{ borderColor: `${color}.400` }}>
                        {label}
                      </Box>
                    ))}
                  </HStack>

                  {outcomeType && !ticketClosed && (
                    <Box mt={3}>
                      <Box as='button' onClick={handleCloseTicket}
                        px={4} py={2} borderRadius='md' border='1px solid'
                        borderColor='red.600' bg='red.900' color='red.200'
                        fontSize='xs' fontFamily='mono' cursor='pointer'
                        minH='44px'
                        opacity={closeLoading ? 0.6 : 1}
                        pointerEvents={closeLoading ? 'none' : 'auto'}
                        _hover={{ bg: 'red.800' }}>
                        {closeLoading ? 'Closing…' : '✓ Close Ticket'}
                      </Box>
                    </Box>
                  )}

                  {ticketClosed && (
                    <Box mt={3}>
                      <Text fontSize='xs' fontFamily='mono' color='green.400'>
                        ✓ Closed · {outcomeType} · intel + trajectory updating in background
                      </Text>
                    </Box>
                  )}
                </Box>
              </Flex>
            )
          }
        </Flex>


      </Flex>
    </Flex>
  );
}
