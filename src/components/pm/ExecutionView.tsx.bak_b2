'use client';
import React from 'react';
import {
  Box, Button, Flex, HStack, VStack, Text, Badge, Spinner,
  Textarea, Select, Collapse, useToast, Divider, Checkbox,
} from '@chakra-ui/react';
import { useEffect, useState, useRef, useCallback } from 'react';
import { Ticket, TicketContext, TicketSignals } from './types';
import { ReadinessBadge, TrustDot, DecisionBadge } from './SignalBadge';
import TicketSignalAI from './TicketSignalAI';
import { isDemoMode, demoFetch, getActiveTenant } from '@/lib/demoApi';

// Demo-aware fetch wrapper for ExecutionView
async function exFetch(url: string, options?: RequestInit): Promise<Response> {
  if (isDemoMode()) {
    // Strip host + /pm-api prefix for demoFetch routing
    const endpoint = url.replace(/^https?:\/\/[^/]+/, '').replace(/^\/pm-api/, '');
    const data = await demoFetch(endpoint);
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
  work_performed:   string;
  outcome:          string;
  recommendations:  string[];
  ai_close_note?:   string;
  ai_outcome_type?: string;
  ai_generated?:    boolean;
}

interface ExpSignal {
  auto_value:       string | null;
  effective_value:  string | null;
  confidence_state: string;
  human_inputs:     { type: string; author: string; note: string | null; created_at: string }[];
}

interface Checklist {
  spoke_with_manager:    boolean;
  walkthrough_completed: boolean;
  checked_additional:    boolean;
  systems_verified:      boolean;
  photos_uploaded:       boolean;
  quote_confirmed:       boolean;
  manager_notified:      boolean;
}





const EMPTY_CHECKLIST: Checklist = {
  spoke_with_manager:    false,
  walkthrough_completed: false,
  checked_additional:    false,
  systems_verified:      false,
  photos_uploaded:       false,
  quote_confirmed:       false,
  manager_notified:      false,
};

const CHECKLIST_LABELS: { key: keyof Checklist; label: string }[] = [
  { key: 'spoke_with_manager',    label: 'Spoke with Office Manager' },
  { key: 'walkthrough_completed', label: 'Final walkthrough completed' },
  { key: 'checked_additional',    label: 'Checked for additional issues' },
  { key: 'systems_verified',      label: 'Verified PMS / Imaging / Phones operational' },
  { key: 'photos_uploaded',       label: 'Photos uploaded (if install)' },
  { key: 'quote_confirmed',       label: 'Quote approval confirmed (if equipment installed)' },
  { key: 'manager_notified',      label: 'Manager notified (if unresolved)' },
];

const OUTCOMES = [
  { key: 'resolved',  label: '✅ Resolved',  color: 'green'  },
  { key: 'mitigated', label: '⚡ Mitigated', color: 'yellow' },
  { key: 'at_risk',   label: '⚠️ At Risk',   color: 'orange' },
  { key: 'escalated', label: '🔴 Escalated', color: 'red'    },
] as const;

function cleanTitle(raw: string | null | undefined): string {
  if (!raw) return '';
  let t = raw.replace(/[\r\n]+/g, ' ').trim();
  t = t.replace(/^(Fw|Re|Fwd):\s*/i, '');
  t = t.replace(/^Project\s+Ticket#?\d+\/[^\/]+\/[^\/]+\//i, '').trim();
  t = t.replace(/^Project\s+Ticket\s*#?\d+\s*[-–]?\s*/i, '').trim();
  return t || raw.trim();
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



// ── Custom Visit Time Picker (mobile-friendly) ────────────────────────────────
function parseISOToParts(iso: string | null): { date: string; hour: string; minute: string; ampm: 'AM' | 'PM' } {
  if (!iso) return { date: '', hour: '9', minute: '00', ampm: 'AM' };
  const d = new Date(iso);
  if (isNaN(d.getTime())) return { date: '', hour: '9', minute: '00', ampm: 'AM' };
  const pad = (n: number) => String(n).padStart(2, '0');
  const dateStr = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  let h = d.getHours();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  const snap = [0, 15, 30, 45].reduce((prev, cur) => Math.abs(cur - d.getMinutes()) < Math.abs(prev - d.getMinutes()) ? cur : prev, 0);
  return { date: dateStr, hour: String(h), minute: pad(snap), ampm };
}

function partsToISO(date: string, hour: string, minute: string, ampm: 'AM' | 'PM'): string {
  if (!date) return '';
  let h = parseInt(hour, 10) % 12;
  if (ampm === 'PM') h += 12;
  return `${date}T${String(h).padStart(2, '0')}:${minute}`;
}

function VisitTimePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const initial = parseISOToParts(value);
  const [date,  setDate]  = useState(initial.date);
  const [hour,  setHour]  = useState(initial.hour);
  const [min,   setMin]   = useState(initial.minute);
  const [ampm,  setAmpm]  = useState<'AM' | 'PM'>(initial.ampm);

  const emit = (d: string, h: string, m: string, ap: 'AM' | 'PM') => {
    const iso = partsToISO(d, h, m, ap);
    if (iso) onChange(iso);
  };

  const inputStyle = {
    bg: 'gray.900', border: '1px solid', borderColor: 'gray.700', borderRadius: 'md',
    color: 'gray.200', fontSize: 'sm', px: 2, py: 2, cursor: 'pointer',
    minH: '44px',
    _focus: { outline: 'none', borderColor: 'blue.500' },
    sx: { colorScheme: 'dark' },
  } as const;

  return (
    <Box>
      {/* Date row */}
      <Box as='input' type='date' value={date}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setDate(e.target.value); emit(e.target.value, hour, min, ampm); }}
        w='full' mb={2} {...inputStyle} />
      {/* Time row */}
      <HStack spacing={2}>
        {/* Hour */}
        <Box as='select' value={hour}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { setHour(e.target.value); emit(date, e.target.value, min, ampm); }}
          flex={1} {...inputStyle}>
          {[1,2,3,4,5,6,7,8,9,10,11,12].map(h => (
            <option key={h} value={String(h)}>{h}</option>
          ))}
        </Box>
        {/* Minute */}
        <Box as='select' value={min}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { setMin(e.target.value); emit(date, hour, e.target.value, ampm); }}
          flex={1} {...inputStyle}>
          {['00','15','30','45'].map(m => (
            <option key={m} value={m}>:{m}</option>
          ))}
        </Box>
        {/* AM/PM toggle */}
        <HStack spacing={0} border='1px solid' borderColor='gray.700' borderRadius='md' overflow='hidden' flexShrink={0}>
          {([['AM'], ['PM']] as const).map(([ap]) => (
            <Box key={ap} as='button' onClick={() => { setAmpm(ap); emit(date, hour, min, ap); }}
              px={3} minH='44px'
              bg={ampm === ap ? 'blue.800' : 'gray.900'}
              color={ampm === ap ? 'blue.200' : 'gray.500'}
              fontSize='sm' fontWeight='bold' cursor='pointer'
              borderRight={ap === 'AM' ? '1px solid' : 'none'} borderColor='gray.700'>
              {ap}
            </Box>
          ))}
        </HStack>
      </HStack>
    </Box>
  );
}


// Combine CloseDraft fields into editable text block
function draftToText(d: CloseDraft): string {
  // Prefer AI-generated close note when available
  if (d.ai_close_note) return d.ai_close_note.trim();
  const lines: string[] = [];
  if (d.work_performed) lines.push(d.work_performed);
  if (d.outcome) lines.push('\nOUTCOME\n' + d.outcome);
  if (d.recommendations?.length) {
    lines.push('\nRECOMMENDATIONS');
    d.recommendations.forEach(r => lines.push('• ' + r));
  }
  return lines.join('\n').trim();
}

// ── WorkingLayer: humanized expectation + visit time + checklist + live draft ─
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function WorkingLayer({ ticket, onSaveState, onDraftReady }: {
  ticket: Ticket; onSaveState: (s: SaveState) => void; onDraftReady?: () => void;
}) {
  const [expSignal, setExpSignal]       = useState<ExpSignal | null>(null);
  const [closeDraft, setCloseDraft]     = useState<CloseDraft | null>(null);
  const [visitNotes, setVisitNotes]     = useState('');
  const [visitDt, setVisitDt]           = useState(ticket.visit_datetime || '');
  const [expType, setExpType]           = useState('confirm');
  const [expNote, setExpNote]           = useState('');
  const [submitting, setSubmitting]     = useState(false);
  const [checklist, setChecklist]       = useState<Checklist>(EMPTY_CHECKLIST);
  const [checklistOpen, setChecklistOpen] = useState(false);
  const [draftLoading, setDraftLoading] = useState(false);
  const [draftMode, setDraftMode]       = useState<'generated' | 'custom'>('generated');
  const [draftText, setDraftText]       = useState('');
  const [outcomeType, setOutcomeType]   = useState<string | null>(null);
  const notesDebounce                   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draftReqId                      = useRef(0);
  const dtDebounce                      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const checkDebounce                   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rescoreDebounce                 = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toast                           = useToast();

  // ── Initial load ──────────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      exFetch(`${PM_API}/api/tickets/${ticket.ticket_key}/signals/expectation`).then(r => r.json()),
      exFetch(`${PM_API}/api/tickets/${ticket.ticket_key}/close-draft`).then(r => r.json()),
    ]).then(([exp, draft]) => {
      setExpSignal(exp);
      const d = draft.close_draft || null;
      setCloseDraft(d);
      if (d) setDraftText(draftToText(d));
    }).catch(console.error);
  }, [ticket.ticket_key]);

  // ── Refresh close draft (Goal 4) ─────────────────────────────────────────
  const refreshDraft = useCallback((force = false, ot?: string) => {
    const reqId = ++draftReqId.current;
    console.log('[draft] refreshDraft called, force=', force, 'reqId=', reqId, 'draftMode=', draftMode);
    setDraftLoading(true);
    const otParam = ot ? `?outcome_type=${ot}` : '';
    exFetch(`${PM_API}/api/tickets/${ticket.ticket_key}/close-draft${otParam}`)
      .then((r: Response) => r.json())
      .then(d => {
        console.log('[draft] response arrived, reqId=', reqId, 'current=', draftReqId.current, 'draft=', d?.close_draft?.work_performed?.slice(0,60));
        if (reqId !== draftReqId.current) return; // stale response — discard
        const draft = d.close_draft || null;
        setCloseDraft(draft);
        if (draft && (force || draftMode === 'generated')) {
          setDraftText(draftToText(draft));
          setDraftMode('generated');
        }
        setDraftLoading(false);
      })
      .catch(() => setDraftLoading(false));
  }, [ticket.ticket_key, draftMode]);

  // ── Outcome selection — triggers AI close draft refresh ──────────────────
  function selectOutcome(key: string) {
    setOutcomeType(key);
    setDraftMode('generated');  // reset any custom edit
    refreshDraft(true, key);
  }

  // ── Visit Notes auto-save → triggers draft refresh ───────────────────────
  function handleNotesChange(val: string) {
    setVisitNotes(val);
    onSaveState('saving');
    if (notesDebounce.current) clearTimeout(notesDebounce.current);
    notesDebounce.current = setTimeout(async () => {
      try {
        console.log('[notes] POSTing note, len=', val.length);
        await exFetch(`${PM_API}/api/tickets/${ticket.ticket_key}/notes`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: val, author: 'PM', type: 'visit_note' }),
        });
        onSaveState('saved');
        setDraftMode('generated'); // reset custom draft on notes change
        refreshDraft(true);
        // Phase A2: debounced signal rescore from working notes (5s, non-critical)
        if (rescoreDebounce.current) clearTimeout(rescoreDebounce.current);
        rescoreDebounce.current = setTimeout(async () => {
          try {
            await exFetch(`${PM_API}/api/tickets/${ticket.ticket_key}/signals/rescore`, { method: 'POST' });
          } catch {
            // Silent — rescore is background operation, non-blocking
          }
        }, 5000);
      } catch { onSaveState('error'); }
    }, 900);
  }

  // ── Visit datetime auto-save (Goal 3) ────────────────────────────────────
  function handleVisitDtChange(val: string) {
    setVisitDt(val);
    onSaveState('saving');
    if (dtDebounce.current) clearTimeout(dtDebounce.current);
    dtDebounce.current = setTimeout(async () => {
      try {
        await fetch(`${PM_API}/api/tickets/${ticket.ticket_key}/visit-datetime`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ visit_datetime: val || null }),
        });
        onSaveState('saved');
      } catch { onSaveState('error'); }
    }, 900);
  }

  // ── Expectation input submit → triggers draft refresh (Goal 4) ───────────
  async function submitExpInput() {
    setSubmitting(true);
    try {
      const res = await fetch(`${PM_API}/api/tickets/${ticket.ticket_key}/signals/expectation/input`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: expType, note: expNote || null, author: 'PM' }),
      });
      const data = await res.json();
      setExpSignal(data);
      setExpNote('');
      toast({ title: 'Expectation updated', status: 'success', duration: 2000, isClosable: true });
      onDraftReady?.();
      setDraftMode('generated');
      refreshDraft(true);
    } catch { toast({ title: 'Failed to update expectation', status: 'error', duration: 3000 }); }
    finally { setSubmitting(false); }
  }

  // ── Checklist auto-save → triggers draft refresh (Goal 5) ────────────────
  function handleChecklistChange(key: keyof Checklist, val: boolean) {
    const next = { ...checklist, [key]: val };
    setChecklist(next);
    onSaveState('saving');
    if (checkDebounce.current) clearTimeout(checkDebounce.current);
    checkDebounce.current = setTimeout(async () => {
      try {
        await fetch(`${PM_API}/api/tickets/${ticket.ticket_key}/checklist`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(next),
        });
        onSaveState('saved');
        setDraftMode('generated');
        refreshDraft(true);
      } catch { onSaveState('error'); }
    }, 600);
  }

  const checkedCount = Object.values(checklist).filter(Boolean).length;

  // ── Goal 2: Human-readable type labels ───────────────────────────────────
  const _typeLabel: Record<string, string> = {
    confirm:  'confirm',
    escalate: 'escalate',
    weaken:   'weaken',
  };
  const inputBadgeColor = (t: string) =>
    t === 'escalate' ? 'red' : t === 'weaken' ? 'orange' : 'green';

  return (
    <Box flex={1} px={{ base: 3, md: 6 }} py={{ base: 3, md: 5 }} pb={{ base: 8, md: 8 }}
      css={{ '&::-webkit-scrollbar': { width: '4px' }, '&::-webkit-scrollbar-thumb': { background: '#2D3748', borderRadius: '2px' } }}
      maxW="760px" mx="auto" w="full">

      {/* ── Goal 3: Visit Time (custom mobile picker) ───────────────────────── */}
      <Box mb={6}>
        <Text fontSize="2xs" fontFamily="mono" fontWeight="bold" color="blue.400"
          letterSpacing="widest" textTransform="uppercase" mb={2}>Visit Time</Text>
        <VisitTimePicker value={visitDt} onChange={handleVisitDtChange} />
      </Box>

      {/* ── Goal 2: Client Expectation (humanized) ────────────────────────── */}
      <Box mb={6} p={4} borderRadius="md" bg="gray.900" border="1px solid" borderColor="gray.700">
        <HStack justify="space-between" mb={3}>
          <Text fontSize="2xs" fontFamily="mono" fontWeight="bold" color="purple.400"
            letterSpacing="widest" textTransform="uppercase">Client Expectation</Text>
          {expSignal && expSignal.confidence_state === 'high' && (
            <Badge colorScheme="green" fontSize="2xs" fontFamily="mono">Verified</Badge>
          )}
          {expSignal && expSignal.confidence_state === 'medium' && (
            <Badge colorScheme="yellow" fontSize="2xs" fontFamily="mono">Reviewed</Badge>
          )}
        </HStack>
        {expSignal ? (
          <>
            <Text fontSize="sm" color="gray.200" mb={3} lineHeight="tall">
              {expSignal.effective_value || expSignal.auto_value || 'No expectation on file'}
            </Text>
            {expSignal.human_inputs?.length > 0 && (
              <VStack align="stretch" spacing={1} mb={3}>
                {expSignal.human_inputs?.map((inp, i) => (
                  <HStack key={i} spacing={2}>
                    <Badge colorScheme={inputBadgeColor(inp.type)} fontSize="2xs">
                      {inp.type === 'confirm' ? 'confirmed' : inp.type === 'escalate' ? 'adjusted' : 'clarified'}
                    </Badge>
                    <Text fontSize="xs" color="gray.400">{inp.author}</Text>
                    {inp.note && <Text fontSize="xs" color="gray.300" noOfLines={1}>{inp.note}</Text>}
                  </HStack>
                ))}
              </VStack>
            )}
            <Divider borderColor="gray.700" mb={3} />
            <HStack spacing={2} align="flex-start">
              <Select value={expType} onChange={e => setExpType(e.target.value)}
                size="sm" bg="gray.800" borderColor="gray.600" color="gray.300"
                fontSize="xs" w="175px" flexShrink={0}
                _focus={{ borderColor: 'purple.500', boxShadow: 'none' }}>
                <option value="confirm">✔ Confirm expectation</option>
                <option value="escalate">⚠ Adjust expectation</option>
                <option value="weaken">➕ Add clarification</option>
              </Select>
              <Textarea value={expNote} onChange={e => setExpNote(e.target.value)}
                placeholder="Add context or correction..." size="sm" bg="gray.800"
                borderColor="gray.600" color="gray.200" fontSize="xs" rows={2} flex={1}
                _focus={{ borderColor: 'purple.500', boxShadow: 'none' }}
                _placeholder={{ color: 'gray.600' }} resize="none" />
              <Box as="button" onClick={submitExpInput}
                px={3} py="6px" bg="purple.700" color="white" fontSize="xs"
                borderRadius="md" _hover={{ bg: 'purple.600' }} cursor="pointer"
                flexShrink={0} opacity={submitting ? 0.6 : 1}>
                {submitting ? '...' : 'Save'}
              </Box>
            </HStack>
          </>
        ) : <Flex justify="center" py={4}><Spinner size="sm" color="purple.400" /></Flex>}
      </Box>

      {/* ── Visit Notes ──────────────────────────────────────────────────── */}
      <Box mb={4}>
        <Text fontSize="2xs" fontFamily="mono" fontWeight="bold" color="blue.400"
          letterSpacing="widest" textTransform="uppercase" mb={2}>Visit Notes</Text>
        <Textarea value={visitNotes} onChange={e => {
            handleNotesChange(e.target.value);
            // Auto-grow
            const el = e.target;
            el.style.height = 'auto';
            el.style.height = el.scrollHeight + 'px';
          }}
          placeholder="Field observations, actions taken, parts used..."
          bg="gray.900" borderColor="gray.700" color="gray.200" fontSize="sm" rows={4}
          minH="120px"
          _focus={{ borderColor: 'blue.500', boxShadow: 'none' }}
          _placeholder={{ color: 'gray.600' }} resize="none"
          overflow="hidden" />
      </Box>

      {/* ── Goal 5: SOP Completion Checklist ────────────────────────────── */}
      <Box mb={6} p={4} borderRadius="md" bg="gray.900" border="1px solid" borderColor="gray.700">
        <HStack justify="space-between" mb={2}>
          <Box as="button" onClick={() => setChecklistOpen(v => !v)}
            display="flex" alignItems="center" gap={2} cursor="pointer"
            _hover={{ color: 'white' }}>
            <Text fontSize="2xs" fontFamily="mono" fontWeight="bold" color="teal.400"
              letterSpacing="widest" textTransform="uppercase">
              {checklistOpen ? '▾' : '▸'} Completion Checklist
            </Text>
          </Box>
          <Text fontSize="2xs" fontFamily="mono" color={checkedCount === 7 ? 'green.400' : 'gray.500'}>
            {checkedCount} / 7 Best Practices
          </Text>
        </HStack>
        <Collapse in={checklistOpen} animateOpacity>
          <VStack align="stretch" spacing={2} pt={2}>
            {CHECKLIST_LABELS.map(({ key, label }) => (
              <Checkbox
                key={key}
                isChecked={checklist[key]}
                onChange={e => handleChecklistChange(key, e.target.checked)}
                size="sm"
                colorScheme="teal"
                sx={{ '.chakra-checkbox__label': { fontSize: 'xs', color: 'gray.300' } }}
              >
                {label}
              </Checkbox>
            ))}
          </VStack>
        </Collapse>
      </Box>

      {/* ── Outcome Selector — AI-assisted close note trigger ─────────────── */}
      <Box mb={outcomeType || closeDraft || draftText ? 4 : 6}>
        <Text fontSize="2xs" fontFamily="mono" fontWeight="bold" color="blue.400"
          letterSpacing="widest" textTransform="uppercase" mb={2}>OUTCOME</Text>
        <HStack spacing={2} flexWrap="wrap">
          {OUTCOMES.map(({ key, label, color }) => (
            <Box
              key={key}
              as="button"
              onClick={() => selectOutcome(key)}
              px={3} py={1.5}
              borderRadius="full"
              border="1px solid"
              borderColor={outcomeType === key ? `${color}.500` : 'gray.700'}
              bg={outcomeType === key ? `${color}.900` : 'gray.900'}
              color={outcomeType === key ? `${color}.200` : 'gray.500'}
              fontSize="xs" fontFamily="mono"
              cursor="pointer"
              _hover={{ borderColor: `${color}.600`, color: `${color}.300` }}
              transition="all 0.15s"
            >
              {label}
            </Box>
          ))}
        </HStack>
      </Box>

      {/* ── Close Draft (live recompute + manual edit mode) ──────────────── */}
      {(closeDraft || draftText) && (
        <Box p={4} borderRadius="md" bg="gray.900" border="1px solid"
          borderColor={draftMode === 'custom' ? 'yellow.700' : 'gray.700'}
          mb={6} opacity={draftLoading ? 0.7 : 1} transition="opacity 0.2s, border-color 0.2s">
          <HStack justify="space-between" mb={3}>
            <HStack spacing={2}>
              <Text fontSize="2xs" fontFamily="mono" fontWeight="bold" color="green.400"
                letterSpacing="widest" textTransform="uppercase">Close Draft</Text>
              <Badge
                fontSize="2xs" fontFamily="mono" colorScheme={draftMode === 'custom' ? 'yellow' : 'green'}
                variant="subtle" px={2} py={0.5} borderRadius="sm">
                {draftMode === 'custom' ? 'CUSTOM' : 'GENERATED'}
              </Badge>
            </HStack>
            <HStack spacing={2}>
              {draftLoading && <Spinner size="xs" color="green.400" />}
              {draftMode === 'custom' && (
                <Button size="xs" variant="ghost" color="gray.400"
                  _hover={{ color: 'white' }}
                  onClick={() => {
                    if (closeDraft) { setDraftText(draftToText(closeDraft)); }
                    setDraftMode('generated');
                  }}>Reset</Button>
              )}
            </HStack>
          </HStack>
          <Textarea
            value={draftText}
            onChange={e => { setDraftText(e.target.value); setDraftMode('custom'); }}
            bg="transparent"
            border="none"
            borderRadius="md"
            color="gray.300"
            fontSize="sm"
            lineHeight="tall"
            resize="none"
            minH="180px"
            p={0}
            _focus={{ outline: 'none', boxShadow: 'none', border: 'none' }}
            _hover={{ border: 'none' }}
            placeholder="Close draft will appear here once visit notes are added..."
            sx={{
              height: 'auto',
              overflow: 'hidden',
              fontFamily: 'inherit',
            }}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = 'auto';
              el.style.height = el.scrollHeight + 'px';
            }}
          />
          <Text fontSize="2xs" color="gray.600" mt={2} fontFamily="mono">
            {draftMode === 'custom' ? 'Editing manually — notes changes will reset to generated.' : 'Auto-updating with notes and signals.'}
          </Text>
        </Box>
      )}
    </Box>
  );
}

// -- Main ExecutionView -------------------------------------------------------
export function ExecutionView({ ticket, onBack }: { ticket: Ticket; onBack: () => void }) {
  const [viewMode, setViewMode]     = useState<ViewMode>('door');
  const [saveState, _setSaveState]   = useState<SaveState>('idle');
  const [refreshKey, setRefreshKey] = useState(0);

  // ── Phase 7C: structured context + signals state ──────────────────────────
  const [ingestContext,  setIngestContext]  = useState<TicketContext | null>(null);
  const [ingestSignals,  setIngestSignals]  = useState<TicketSignals | null>(null);
  const [ingestStatus,   setIngestStatus]   = useState<string>('never_queued');
  const [isPolling,      setIsPolling]      = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

            {/* Phase 7C: context readiness banner */}
            {(ingestStatus === 'never_queued' || ingestStatus === 'failed') && (
              <Box bg="yellow.900" border="1px solid" borderColor="yellow.600" borderRadius="md" p={3} mb={3}>
                <Flex align="center" justify="space-between" gap={3}>
                  <Text fontSize="sm" color="yellow.200">
                    {ingestStatus === 'failed' ? '⚠️ Structured context failed to generate.' : '⏳ Structured context not ready.'}
                  </Text>
                  <Button size="xs" colorScheme="yellow" variant="outline" onClick={triggerIngest} isLoading={isPolling} loadingText="Running...">
                    Run Ingestion
                  </Button>
                </Flex>
              </Box>
            )}
            {ingestStatus === 'running' || ingestStatus === 'pending' ? (
              <Box bg="blue.900" border="1px solid" borderColor="blue.600" borderRadius="md" p={3} mb={3}>
                <Flex align="center" gap={2}>
                  <Spinner size="xs" color="blue.300" />
                  <Text fontSize="sm" color="blue.200">Generating structured context...</Text>
                </Flex>
              </Box>
            ) : null}

          {viewMode === 'door'
            ? <DoorView ticket={ticket} refreshKey={refreshKey} />
            : <TicketSignalAI ticket={ticket} />
          }
        </Flex>


      </Flex>
    </Flex>
  );
}
