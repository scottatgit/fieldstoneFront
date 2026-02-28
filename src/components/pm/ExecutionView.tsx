'use client';
import React from 'react';
import {
  Box, Flex, HStack, VStack, Text, Badge, Spinner,
  Textarea, Select, Collapse, useToast, Divider, Checkbox,
} from '@chakra-ui/react';
import { useEffect, useState, useRef, useCallback } from 'react';
import { Ticket } from './types';
import { ReadinessBadge, TrustDot, DecisionBadge } from './SignalBadge';
import { ChatPanel } from './ChatPanel';

const PM_API = process.env.NEXT_PUBLIC_PM_API_URL || 'http://localhost:8100';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';
type ViewMode  = 'door' | 'work';

interface BriefSections {
  situation:   string;
  expectation: string;
  constraints: string;
  decision:    string;
  risk_flags:  string;
  advanced:    string;
}

interface CloseDraft {
  work_performed:  string;
  outcome:         string;
  recommendations: string[];
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
    decision:    join('decision'),
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


// -- Goal 1: Door View with operational header ---------------------------------
function DoorView({ ticket, refreshKey }: { ticket: Ticket; refreshKey: number }) {
  const [sections, setSections]     = useState<BriefSections | null>(null);
  const [loading, setLoading]       = useState(true);
  const [advancedOpen, setAdvanced] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`${PM_API}/api/brief/${ticket.ticket_key}`, { method: 'POST' })
      .then(r => r.json())
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

  const contactName    = ticket.sender_name || null;
  const visitFormatted = formatVisitDatetime(ticket.visit_datetime);
  const clientName     = ticket.client_display_name || ticket.client_key || '';

  return (
    <Box flex={1} overflowY='auto' px={8} py={6}
      css={{ '&::-webkit-scrollbar': { width: '4px' }, '&::-webkit-scrollbar-thumb': { background: '#2D3748', borderRadius: '2px' } }}
      maxW='760px' mx='auto' w='full'>

      {/* Operational Header */}
      <Box mb={6} pb={4} borderBottom='1px solid' borderColor='gray.800'>
        <Text fontSize='lg' fontWeight='bold' color='white' mb={1}>{clientName}</Text>
        {contactName && (
          <Text fontSize='sm' color='gray.400'>Contact: {contactName}</Text>
        )}
        {visitFormatted && (
          <Text fontSize='sm' color='blue.300' mt={1}>Visit: {visitFormatted}</Text>
        )}
      </Box>

      <SectionBlock label='SITUATION'   content={sections.situation}   accent='blue'   />
      <SectionBlock label='EXPECTATION' content={sections.expectation} accent='purple' />
      <SectionBlock label='CONSTRAINTS' content={sections.constraints} accent='orange' />
      <SectionBlock label='DECISION'    content={sections.decision}    accent='green'  />
      {sections.risk_flags && (
        <Box mb={5} p={3} borderRadius='md' bg='blackAlpha.400' border='1px solid' borderColor='red.800'>
          <Text fontSize='2xs' fontFamily='mono' fontWeight='bold' color='red.400' letterSpacing='widest' textTransform='uppercase' mb={2}>
            RISK FLAGS
          </Text>
          <Box fontSize='sm' color='red.200' lineHeight='tall'
            dangerouslySetInnerHTML={{ __html: renderInline(sections.risk_flags) }} />
        </Box>
      )}
      {sections.advanced && (
        <Box mt={4} mb={6}>
          <Box as='button' onClick={() => setAdvanced(v => !v)}
            fontSize='xs' fontFamily='mono' color='gray.500'
            _hover={{ color: 'gray.300' }} cursor='pointer'
            display='flex' alignItems='center' gap={2} mb={2}>
            {advancedOpen ? '▾' : '▸'} Advanced Context
          </Box>
          <Collapse in={advancedOpen} animateOpacity>
            <Box p={4} borderRadius='md' bg='gray.900' border='1px solid' borderColor='gray.700'>
              <Box fontSize='sm' color='gray.400' lineHeight='tall'
                dangerouslySetInnerHTML={{ __html: renderInline(sections.advanced) }}
                sx={{ strong: { color: 'gray.200' }, code: { bg: 'gray.800', color: 'green.300', px: 1, borderRadius: 'sm', fontSize: 'xs' } }} />
            </Box>
          </Collapse>
        </Box>
      )}
    </Box>
  );
}


// ── WorkingLayer: humanized expectation + visit time + checklist + live draft ─
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
  const notesDebounce                   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dtDebounce                      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const checkDebounce                   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toast                           = useToast();

  // ── Initial load ──────────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      fetch(`${PM_API}/api/tickets/${ticket.ticket_key}/signals/expectation`).then(r => r.json()),
      fetch(`${PM_API}/api/tickets/${ticket.ticket_key}/close-draft`).then(r => r.json()),
    ]).then(([exp, draft]) => {
      setExpSignal(exp);
      setCloseDraft(draft.close_draft || null);
    }).catch(console.error);
  }, [ticket.ticket_key]);

  // ── Refresh close draft (Goal 4) ─────────────────────────────────────────
  const refreshDraft = useCallback(() => {
    setDraftLoading(true);
    fetch(`${PM_API}/api/tickets/${ticket.ticket_key}/close-draft`)
      .then(r => r.json())
      .then(d => { setCloseDraft(d.close_draft || null); setDraftLoading(false); })
      .catch(() => setDraftLoading(false));
  }, [ticket.ticket_key]);

  // ── Visit Notes auto-save → triggers draft refresh ───────────────────────
  function handleNotesChange(val: string) {
    setVisitNotes(val);
    onSaveState('saving');
    if (notesDebounce.current) clearTimeout(notesDebounce.current);
    notesDebounce.current = setTimeout(async () => {
      try {
        await fetch(`${PM_API}/api/tickets/${ticket.ticket_key}/notes`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: val, author: 'PM', type: 'visit_note' }),
        });
        onSaveState('saved');
        refreshDraft();
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
      refreshDraft();
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
        refreshDraft();
      } catch { onSaveState('error'); }
    }, 600);
  }

  const checkedCount = Object.values(checklist).filter(Boolean).length;

  // ── Goal 2: Human-readable type labels ───────────────────────────────────
  const typeLabel: Record<string, string> = {
    confirm:  'confirm',
    escalate: 'escalate',
    weaken:   'weaken',
  };
  const inputBadgeColor = (t: string) =>
    t === 'escalate' ? 'red' : t === 'weaken' ? 'orange' : 'green';

  return (
    <Box flex={1} overflowY="auto" px={6} py={5}
      css={{ '&::-webkit-scrollbar': { width: '4px' }, '&::-webkit-scrollbar-thumb': { background: '#2D3748', borderRadius: '2px' } }}
      maxW="760px" mx="auto" w="full">

      {/* ── Goal 3: Visit Time ────────────────────────────────────────────── */}
      <Box mb={6}>
        <Text fontSize="2xs" fontFamily="mono" fontWeight="bold" color="blue.400"
          letterSpacing="widest" textTransform="uppercase" mb={2}>Visit Time</Text>
        <Box
          as="input"
          type="datetime-local"
          value={visitDt}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleVisitDtChange(e.target.value)}
          bg="gray.900" borderColor="gray.700" border="1px solid" borderRadius="md"
          color="gray.200" fontSize="sm" px={3} py={2} w="full"
          sx={{
            colorScheme: 'dark',
            '&:focus': { outline: 'none', borderColor: 'var(--chakra-colors-blue-500)' },
          }}
        />
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
        <Textarea value={visitNotes} onChange={e => handleNotesChange(e.target.value)}
          placeholder="Field observations, actions taken, parts used..."
          bg="gray.900" borderColor="gray.700" color="gray.200" fontSize="sm" rows={5}
          _focus={{ borderColor: 'blue.500', boxShadow: 'none' }}
          _placeholder={{ color: 'gray.600' }} resize="vertical" />
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

      {/* ── Goal 4: Close Draft (live recompute) ─────────────────────────── */}
      {closeDraft && (
        <Box p={4} borderRadius="md" bg="gray.900" border="1px solid" borderColor="gray.700" mb={6}
          opacity={draftLoading ? 0.6 : 1} transition="opacity 0.2s">
          <HStack justify="space-between" mb={3}>
            <Text fontSize="2xs" fontFamily="mono" fontWeight="bold" color="green.400"
              letterSpacing="widest" textTransform="uppercase">Close Draft</Text>
            {draftLoading && <Spinner size="xs" color="green.400" />}
          </HStack>
          <VStack align="stretch" spacing={3}>
            <Box>
              <Text fontSize="2xs" color="gray.500" fontFamily="mono" mb={1}>WORK PERFORMED</Text>
              <Text fontSize="sm" color="gray.300" lineHeight="tall">{closeDraft.work_performed}</Text>
            </Box>
            <Divider borderColor="gray.700" />
            <Box>
              <Text fontSize="2xs" color="gray.500" fontFamily="mono" mb={1}>OUTCOME</Text>
              <Text fontSize="sm" color="gray.300" lineHeight="tall">{closeDraft.outcome}</Text>
            </Box>
            {closeDraft.recommendations.length > 0 && (
              <>
                <Divider borderColor="gray.700" />
                <Box>
                  <Text fontSize="2xs" color="gray.500" fontFamily="mono" mb={1}>RECOMMENDATIONS</Text>
                  <VStack align="stretch" spacing={1}>
                    {closeDraft.recommendations.map((r, i) => (
                      <Text key={i} fontSize="sm" color="gray.300" lineHeight="tall">• {r}</Text>
                    ))}
                  </VStack>
                </Box>
              </>
            )}
          </VStack>
        </Box>
      )}
    </Box>
  );
}

// -- Main ExecutionView -------------------------------------------------------
export function ExecutionView({ ticket, onBack }: { ticket: Ticket; onBack: () => void }) {
  const [viewMode, setViewMode]     = useState<ViewMode>('door');
  const [tankOpen, setTankOpen]     = useState(false);
  const [saveState, setSaveState]   = useState<SaveState>('idle');
  const [refreshKey, setRefreshKey] = useState(0);

  const clientName   = ticket.client_display_name || ticket.sender_name || ticket.client_key || 'Unknown';
  const displayTitle = ticket.title_clean || cleanTitle(ticket.title);

  const saveIndicator: Record<SaveState, React.ReactNode> = {
    idle:   null,
    saving: (<HStack spacing={1}><Spinner size='xs' color='yellow.400' /><Text fontSize='2xs' fontFamily='mono' color='yellow.400'>Saving...</Text></HStack>),
    saved:  (<Text fontSize='2xs' fontFamily='mono' color='green.400'>Saved</Text>),
    error:  (<Text fontSize='2xs' fontFamily='mono' color='red.400'>Connection issue</Text>),
  };

  const handleTankRefresh = useCallback(() => { setRefreshKey(k => k + 1); }, []);

  return (
    <Flex h='full' direction='column' bg='gray.950' overflow='hidden'>

      {/* Header */}
      <Flex px={4} py={2} bg='gray.900' borderBottom='1px solid' borderColor='gray.700'
        align='center' justify='space-between' flexShrink={0} minH='48px'>
        <HStack spacing={3} minW={0} flex={1} overflow='hidden'>
          <Box as='button' onClick={onBack}
            fontSize='xs' fontFamily='mono' color='gray.500' cursor='pointer'
            px={2} py={1} borderRadius='sm' border='1px solid' borderColor='gray.700'
            _hover={{ borderColor: 'gray.500', color: 'white' }} flexShrink={0}>
            Back
          </Box>
          <TrustDot score={ticket.trust_score} />
          <Text fontSize='2xs' fontFamily='mono' color='gray.500' flexShrink={0}>#{ticket.ticket_key}</Text>
          <Text fontSize='sm' fontWeight='bold' color='white' noOfLines={1} flex={1} minW={0}>{clientName}</Text>
          <Text fontSize='xs' color='gray.400' noOfLines={1} display={{ base: 'none', xl: 'block' }} flexShrink={0}>{displayTitle}</Text>
          <ReadinessBadge score={ticket.readiness_score} />
          <DecisionBadge signal={ticket.decision_signal} label={ticket.decision_label} />
        </HStack>
        <HStack spacing={2} flexShrink={0} ml={3}>
          {saveIndicator[saveState]}
          <HStack spacing={0} border='1px solid' borderColor='gray.700' borderRadius='md' overflow='hidden'>
            <Box as='button' onClick={() => setViewMode('door')} px={3} py={1.5}
              fontSize='2xs' fontFamily='mono' cursor='pointer'
              bg={viewMode === 'door' ? 'blue.800' : 'gray.800'}
              color={viewMode === 'door' ? 'blue.200' : 'gray.500'}
              _hover={{ color: 'white' }} borderRight='1px solid' borderColor='gray.700'>
              Door View
            </Box>
            <Box as='button' onClick={() => setViewMode('work')} px={3} py={1.5}
              fontSize='2xs' fontFamily='mono' cursor='pointer'
              bg={viewMode === 'work' ? 'purple.800' : 'gray.800'}
              color={viewMode === 'work' ? 'purple.200' : 'gray.500'}
              _hover={{ color: 'white' }}>
              Edit / Work
            </Box>
          </HStack>
          <Box as='button' onClick={() => setTankOpen(v => !v)} px={3} py={1.5}
            fontSize='2xs' fontFamily='mono' cursor='pointer'
            bg={tankOpen ? 'gray.700' : 'gray.800'}
            color={tankOpen ? 'white' : 'gray.500'}
            border='1px solid' borderColor={tankOpen ? 'gray.500' : 'gray.700'} borderRadius='md'
            _hover={{ borderColor: 'gray.500', color: 'white' }}>
            {tankOpen ? 'Tank >' : 'Tank'}
          </Box>
        </HStack>
      </Flex>

      {/* Body */}
      <Flex flex={1} overflow='hidden'>
        <Flex flex={1} direction='column' overflow='hidden' align='center'>
          {viewMode === 'door'
            ? <DoorView ticket={ticket} refreshKey={refreshKey} />
            : <WorkingLayer ticket={ticket} onSaveState={setSaveState} onDraftReady={() => setRefreshKey(k => k + 1)} />
          }
        </Flex>
        {tankOpen && (
          <Box w='340px' flexShrink={0} borderLeft='1px solid' borderColor='gray.700'
            overflow='hidden' display='flex' flexDirection='column'>
            <ChatPanel onCommand={handleTankRefresh} />
          </Box>
        )}
      </Flex>
    </Flex>
  );
}
