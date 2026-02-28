'use client';
import React from 'react';
import {
  Box, Flex, HStack, VStack, Text, Badge, Spinner,
  Textarea, Select, Collapse, useToast, Divider,
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

function cleanTitle(raw: string | null | undefined): string {
  if (!raw) return '';
  let t = raw.replace(/[\r\n]+/g, ' ').trim();
  t = t.replace(/^(Fw|Re|Fwd):\s*/i, '');
  t = t.replace(/^Project\s+Ticket#?\d+\/[^\/]+\/[^\/]+\//i, '').trim();
  t = t.replace(/^Project\s+Ticket\s*#?\d+\s*[-–]?\s*/i, '').trim();
  return t || raw.trim();
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
      else if (h.includes('EXPECTATION') || h.includes('CLIENT EXPECT'))         current = 'expectation';
      else if (h.includes('CONSTRAINT') || h.includes('ACCESS') || h.includes('TIME SENSITIVE')) current = 'constraints';
      else if (h.includes('DECISION') || h.includes('ACTION'))                   current = 'decision';
      else if (h.includes('RISK') || h.includes('FLAG'))                         current = 'risk_flags';
      else if (ADVANCED.some(a => h.includes(a)))                                current = 'advanced';
      else                                                                        current = 'advanced';
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

function DoorView({ ticket, refreshKey }: { ticket: Ticket; refreshKey: number }) {
  const [sections, setSections]     = useState<BriefSections | null>(null);
  const [loading, setLoading]       = useState(true);
  const [advancedOpen, setAdvanced] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`${PM_API}/api/brief/${ticket.ticket_key}`, { method: 'POST' })
      .then(r => r.json())
      .then(d => { setSections(parseBriefSections(d.brief || '')); setLoading(false); })
      .catch(() => setLoading(false));
  }, [ticket.ticket_key, refreshKey]);

  if (loading) return (
    <Flex flex={1} align="center" justify="center" direction="column" gap={3}>
      <Spinner color="blue.400" size="lg" thickness="3px" />
      <Text color="gray.500" fontSize="xs" fontFamily="mono">Loading situation...</Text>
    </Flex>
  );
  if (!sections) return (
    <Flex flex={1} align="center" justify="center">
      <Text color="gray.600" fontSize="sm">No brief available</Text>
    </Flex>
  );

  return (
    <Box flex={1} overflowY="auto" px={8} py={6}
      css={{ '&::-webkit-scrollbar': { width: '4px' }, '&::-webkit-scrollbar-thumb': { background: '#2D3748', borderRadius: '2px' } }}
      maxW="760px" mx="auto" w="full">
      <SectionBlock label="SITUATION"   content={sections.situation}   accent="blue"   />
      <SectionBlock label="EXPECTATION" content={sections.expectation} accent="purple" />
      <SectionBlock label="CONSTRAINTS" content={sections.constraints} accent="orange" />
      <SectionBlock label="DECISION"    content={sections.decision}    accent="green"  />
      {sections.risk_flags && (
        <Box mb={5} p={3} borderRadius="md" bg="blackAlpha.400" border="1px solid" borderColor="red.800">
          <Text fontSize="2xs" fontFamily="mono" fontWeight="bold" color="red.400" letterSpacing="widest" textTransform="uppercase" mb={2}>
            RISK FLAGS
          </Text>
          <Box fontSize="sm" color="red.200" lineHeight="tall"
            dangerouslySetInnerHTML={{ __html: renderInline(sections.risk_flags) }} />
        </Box>
      )}
      {sections.advanced && (
        <Box mt={4} mb={6}>
          <Box as="button" onClick={() => setAdvanced(v => !v)}
            fontSize="xs" fontFamily="mono" color="gray.500"
            _hover={{ color: 'gray.300' }} cursor="pointer"
            display="flex" alignItems="center" gap={2} mb={2}>
            {advancedOpen ? '▾' : '▸'} Advanced Context
          </Box>
          <Collapse in={advancedOpen} animateOpacity>
            <Box p={4} borderRadius="md" bg="gray.900" border="1px solid" borderColor="gray.700">
              <Box fontSize="sm" color="gray.400" lineHeight="tall"
                dangerouslySetInnerHTML={{ __html: renderInline(sections.advanced) }}
                sx={{ strong: { color: 'gray.200' }, code: { bg: 'gray.800', color: 'green.300', px: 1, borderRadius: 'sm', fontSize: 'xs' } }} />
            </Box>
          </Collapse>
        </Box>
      )}
    </Box>
  );
}

function WorkingLayer({ ticket, onSaveState, onDraftReady }: {
  ticket: Ticket; onSaveState: (s: SaveState) => void; onDraftReady?: () => void;
}) {
  const [expSignal, setExpSignal]   = useState<ExpSignal | null>(null);
  const [closeDraft, setCloseDraft] = useState<CloseDraft | null>(null);
  const [visitNotes, setVisitNotes] = useState('');
  const [expType, setExpType]       = useState('confirm');
  const [expNote, setExpNote]       = useState('');
  const [submitting, setSubmitting] = useState(false);
  const debounceRef                 = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toast                       = useToast();

  useEffect(() => {
    Promise.all([
      fetch(`${PM_API}/api/tickets/${ticket.ticket_key}/signals/expectation`).then(r => r.json()),
      fetch(`${PM_API}/api/tickets/${ticket.ticket_key}/close-draft`).then(r => r.json()),
    ]).then(([exp, draft]) => {
      setExpSignal(exp);
      setCloseDraft(draft.close_draft || null);
    }).catch(console.error);
  }, [ticket.ticket_key]);

  function handleNotesChange(val: string) {
    setVisitNotes(val);
    onSaveState('saving');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        await fetch(`${PM_API}/api/tickets/${ticket.ticket_key}/notes`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: val, author: 'PM', type: 'visit_note' }),
        });
        onSaveState('saved');
      } catch { onSaveState('error'); }
    }, 900);
  }

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
      toast({ title: 'Signal updated', status: 'success', duration: 2000, isClosable: true });
      onDraftReady?.();
    } catch { toast({ title: 'Failed to update signal', status: 'error', duration: 3000 }); }
    finally { setSubmitting(false); }
  }

  const confColor: Record<string, string> = { low: 'gray', medium: 'yellow', high: 'green' };

  return (
    <Box flex={1} overflowY="auto" px={6} py={5}
      css={{ '&::-webkit-scrollbar': { width: '4px' }, '&::-webkit-scrollbar-thumb': { background: '#2D3748', borderRadius: '2px' } }}
      maxW="760px" mx="auto" w="full">

      <Box mb={6} p={4} borderRadius="md" bg="gray.900" border="1px solid" borderColor="gray.700">
        <HStack justify="space-between" mb={3}>
          <Text fontSize="2xs" fontFamily="mono" fontWeight="bold" color="purple.400" letterSpacing="widest" textTransform="uppercase">
            Expectation Signal
          </Text>
          {expSignal && (
            <Badge colorScheme={confColor[expSignal.confidence_state] || 'gray'} fontSize="2xs" fontFamily="mono">
              {expSignal.confidence_state} confidence
            </Badge>
          )}
        </HStack>
        {expSignal ? (
          <>
            <Text fontSize="sm" color="gray.200" mb={3} lineHeight="tall">
              {expSignal.effective_value || expSignal.auto_value || 'No expectation detected'}
            </Text>
            {expSignal.human_inputs.length > 0 && (
              <VStack align="stretch" spacing={1} mb={3}>
                {expSignal.human_inputs.map((inp, i) => (
                  <HStack key={i} spacing={2}>
                    <Badge colorScheme={inp.type === 'escalate' ? 'red' : inp.type === 'weaken' ? 'orange' : 'green'} fontSize="2xs">{inp.type}</Badge>
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
                fontSize="xs" w="130px" flexShrink={0} _focus={{ borderColor: 'purple.500', boxShadow: 'none' }}>
                <option value="confirm">Confirm</option>
                <option value="escalate">Escalate</option>
                <option value="weaken">Weaken</option>
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

      <Box mb={6}>
        <Text fontSize="2xs" fontFamily="mono" fontWeight="bold" color="blue.400" letterSpacing="widest" textTransform="uppercase" mb={2}>
          Visit Notes
        </Text>
        <Textarea value={visitNotes} onChange={e => handleNotesChange(e.target.value)}
          placeholder="Field observations, actions taken, parts used..."
          bg="gray.900" borderColor="gray.700" color="gray.200" fontSize="sm" rows={5}
          _focus={{ borderColor: 'blue.500', boxShadow: 'none' }}
          _placeholder={{ color: 'gray.600' }} resize="vertical" />
      </Box>

      {closeDraft && (
        <Box p={4} borderRadius="md" bg="gray.900" border="1px solid" borderColor="gray.700" mb={6}>
          <Text fontSize="2xs" fontFamily="mono" fontWeight="bold" color="green.400" letterSpacing="widest" textTransform="uppercase" mb={3}>
            Close Draft
          </Text>
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

export function ExecutionView({ ticket, onBack }: { ticket: Ticket; onBack: () => void }) {
  const [viewMode, setViewMode]     = useState<ViewMode>('door');
  const [tankOpen, setTankOpen]     = useState(false);
  const [saveState, setSaveState]   = useState<SaveState>('idle');
  const [refreshKey, setRefreshKey] = useState(0);

  const clientName   = ticket.client_display_name || ticket.sender_name || ticket.client_key || 'Unknown';
  const displayTitle = ticket.title_clean || cleanTitle(ticket.title);

  // auto-save indicator map
  const saveIndicator = {
    idle:   null,
    saving: <HStack spacing={1}><Spinner size="xs" color="yellow.400" /><Text fontSize="2xs" fontFamily="mono" color="yellow.400">Saving...</Text></HStack>,
    saved:  <Text fontSize="2xs" fontFamily="mono" color="green.400">Saved</Text>,
    error:  <Text fontSize="2xs" fontFamily="mono" color="red.400">Connection issue</Text>,
  } as Record<SaveState, React.ReactNode>;

  const handleTankRefresh = useCallback(() => { setRefreshKey(k => k + 1); }, []);

  return (
    <Flex h="full" direction="column" bg="gray.950" overflow="hidden">

      {/* ── Header ── */}
      <Flex px={4} py={2} bg="gray.900" borderBottom="1px solid" borderColor="gray.700"
        align="center" justify="space-between" flexShrink={0} minH="48px">
        <HStack spacing={3} minW={0} flex={1} overflow="hidden">
          <Box as='button' onClick={onBack}
            fontSize='xs' fontFamily='mono' color='gray.500' cursor='pointer'
            px={2} py={1} borderRadius='sm' border='1px solid' borderColor='gray.700'
            _hover={{ borderColor: 'gray.500', color: 'white' }} flexShrink={0}>
            Back
          </Box>
          <TrustDot score={ticket.trust_score} />
          <Text fontSize="2xs" fontFamily="mono" color="gray.500" flexShrink={0}>#{ticket.ticket_key}</Text>
          <Text fontSize="sm" fontWeight="bold" color="white" noOfLines={1} flex={1} minW={0}>{clientName}</Text>
          <Text fontSize='xs' color='gray.400' noOfLines={1} display={{ base: 'none', xl: 'block' }} flexShrink={0}>{displayTitle}</Text>
          <ReadinessBadge score={ticket.readiness_score} />
          <DecisionBadge signal={ticket.decision_signal} label={ticket.decision_label} />
        </HStack>
        <HStack spacing={2} flexShrink={0} ml={3}>
          {saveIndicator[saveState]}
          {/* Door / Work toggle */}
          <HStack spacing={0} border='1px solid' borderColor='gray.700' borderRadius='md' overflow='hidden'>
            <Box as='button' onClick={() => setViewMode('door')} px={3} py={1.5}
              fontSize="2xs" fontFamily="mono" cursor="pointer"
              bg={viewMode === 'door' ? 'blue.800' : 'gray.800'}
              color={viewMode === 'door' ? 'blue.200' : 'gray.500'}
              _hover={{ color: 'white' }} borderRight='1px solid' borderColor='gray.700'>
              Door View
            </Box>
            <Box as='button' onClick={() => setViewMode('work')} px={3} py={1.5}
              fontSize="2xs" fontFamily="mono" cursor="pointer"
              bg={viewMode === 'work' ? 'purple.800' : 'gray.800'}
              color={viewMode === 'work' ? 'purple.200' : 'gray.500'}
              _hover={{ color: 'white' }}>
              Edit / Work
            </Box>
          </HStack>
          {/* Tank toggle */}
          <Box as='button' onClick={() => setTankOpen(v => !v)} px={3} py={1.5}
            fontSize="2xs" fontFamily="mono" cursor="pointer"
            bg={tankOpen ? 'gray.700' : 'gray.800'}
            color={tankOpen ? 'white' : 'gray.500'}
            border='1px solid' borderColor={tankOpen ? 'gray.500' : 'gray.700'} borderRadius='md'
            _hover={{ borderColor: 'gray.500', color: 'white' }}>
            {tankOpen ? 'Tank >' : 'Tank'}
          </Box>
        </HStack>
      </Flex>

      {/* ── Body ── */}
      <Flex flex={1} overflow="hidden">
        <Flex flex={1} direction="column" overflow="hidden" align="center">
          {viewMode === 'door'
            ? <DoorView ticket={ticket} refreshKey={refreshKey} />
            : <WorkingLayer ticket={ticket} onSaveState={setSaveState} onDraftReady={() => setRefreshKey(k => k + 1)} />
          }
        </Flex>
        {tankOpen && (
          <Box w="340px" flexShrink={0} borderLeft="1px solid" borderColor="gray.700"
            overflow="hidden" display="flex" flexDirection="column">
            <ChatPanel onCommand={handleTankRefresh} />
          </Box>
        )}
      </Flex>
    </Flex>
  );
}
