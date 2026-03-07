'use client';
import React from 'react';
import {
  Box, VStack, HStack, Text, Textarea, IconButton,
  Flex, Spinner, Badge, Divider, Tooltip, Modal,
  ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton,
  useBreakpointValue,
} from '@chakra-ui/react';
import { useState, useRef, useEffect, useCallback, KeyboardEvent, ChangeEvent } from 'react';
import { Ticket, TicketContext, TicketSignals } from './types';
import { isDemoMode } from '@/lib/demoApi';

const PM_API = process.env.NEXT_PUBLIC_PM_API_URL || 'http://localhost:8100';

function uid() { return Math.random().toString(36).slice(2); }

// Extract key facts from assistant response into working memory
function extractFacts(text: string, prev: Record<string,string>): Record<string,string> {
  const updated = { ...prev };
  // Observed fix pattern
  const fixMatch = text.match(/(?:fix(?:ed)?|resolv(?:ed)?|restart(?:ed)?|replac(?:ed)?)\s+(?:by\s+)?([^.\n,]{10,60})/i);
  if (fixMatch) updated['observed_fix'] = fixMatch[1].trim();
  // Remaining issue pattern
  const remainMatch = text.match(/(?:still|but|however|remaining|unresolved)[:\s]+([^.\n]{10,80})/i);
  if (remainMatch) updated['remaining_issue'] = remainMatch[1].trim();
  // Device/hardware mentioned
  const hwMatch = text.match(/(?:the\s+)?(\w+(?:\s+\w+){0,3}?)\s+(?:is|was|appears)\s+(?:dead|failed|faulty|bad|broken|offline)/i);
  if (hwMatch) updated['failed_component'] = hwMatch[1].trim();
  // Root cause
  const causeMatch = text.match(/(?:root\s+cause|caused\s+by|due\s+to)[:\s]+([^.\n]{10,80})/i);
  if (causeMatch) updated['root_cause'] = causeMatch[1].trim();
  return updated;
}


function timeAgoShort(iso?: string | null): string {
  if (!iso) return '';
  try {
    const ms = Date.now() - new Date(iso).getTime();
    const d = Math.floor(ms / 86_400_000);
    const h = Math.floor(ms / 3_600_000);
    if (d > 30) return `${Math.floor(d/30)}mo ago`;
    if (d > 0)  return `${d}d ago`;
    if (h > 0)  return `${h}h ago`;
    return 'just now';
  } catch { return ''; }
}

function renderMd(text: string): string {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^#{1,3} (.+)$/gm, '<strong style="color:#90CDF4;font-size:1.05em">$1</strong>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, (m: string) => `<ul>${m}</ul>`)
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/\n/g, '<br/>');
}

// Phase 25 structured output types
interface LikelihoodCause {
  cause: string;
  probability: 'high' | 'medium' | 'low';
  first_step: string;
}
interface LikelyCausesData  { type: 'likely_causes'; causes: LikelihoodCause[]; }
interface ChecklistData     { type: 'checklist'; steps: string[]; }
interface QuestionItem      { question: string; reason: string; }
interface QuestionsData     { type: 'questions'; items: QuestionItem[]; }
type StructuredData = LikelyCausesData | ChecklistData | QuestionsData;

interface PilotMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  images?: string[];
  timestamp: Date;
  artifact?: 'closing' | 'internal' | 'kb' | 'intel';
  chip_type?: string;
  structured_data?: StructuredData | null;
}

interface PilotChip { label: string; prompt: string; artifact?: string; chip_type?: string; }

function getChips(ctx: TicketContext | null, _ticket: Ticket): PilotChip[] {
  const chips: PilotChip[] = [
    { label: '📋 5-min checklist',  prompt: 'Give me a concise 5-minute onsite checklist for this situation.', chip_type: 'checklist' },
    { label: '🔍 Likely causes',    prompt: 'What are the top 3 most likely causes for this issue?', chip_type: 'likely_causes' },
    { label: '❓ Questions to ask', prompt: 'What are the most important questions I should ask the client onsite?', chip_type: 'questions' },
    { label: '✉️ Closing note',     prompt: 'Generate a professional client-facing closing note based on the context and our conversation.', artifact: 'closing' },
    { label: '📝 Internal note',    prompt: 'Generate a detailed internal technician note for ConnectWise based on the context and our conversation.', artifact: 'internal' },
    { label: '🧠 KB entry',         prompt: 'Generate a knowledge base entry capturing what was learned about this environment and issue.', artifact: 'kb' },
  ];
  if (ctx?.clinical_workflow_impact) {
    chips.unshift({ label: '🏥 Clinical impact', prompt: 'What clinical workflows might be affected and what is the fallback protocol?' });
  }
  if (ctx?.emotion_tone === 'frustrated') {
    chips.unshift({ label: '🤝 Client relations', prompt: 'This client appears frustrated. How should I approach the conversation to rebuild trust?' });
  }
  // Intel proposal chip — no 'Use prior intel' (already injected in context sidebar)
  chips.unshift({ label: '🧠 Propose Intel entry', prompt: 'Propose an Intel entry based on what we have discussed and the ticket context.', artifact: 'intel' });
  return chips.slice(0, 8);
}

export interface IntelEntry {
  id: string;
  client_key?: string | null;
  tool_id?: string | null;
  pattern: string;
  observation: string;
  resolution: string;
  confidence: 'low' | 'medium' | 'high';
  tags: string[];
  source_ticket?: string | null;
  observed_at: string;
  created_by: string;
  created_at: string;
  kb_status?: 'none' | 'proposed' | 'approved';   // 13A
  kb_promoted_at?: string | null;
  kb_promoted_by?: string | null;
}

interface IntelCandidate {
  client_key?: string | null;
  tool_id?: string | null;
  pattern: string;
  observation: string;
  resolution: string;
  confidence: 'low' | 'medium' | 'high';
  tags: string[];
  source_ticket?: string | null;
  source?: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function IntelCandidateCard({
  candidate, _ticketKey, onConfirm, onIgnore, saving, saved
}: {
  candidate: IntelCandidate;
  _ticketKey: string;
  onConfirm: (c: IntelCandidate) => void;
  onIgnore: () => void;
  saving: boolean;
  saved: boolean;
}) {
  const [local, setLocal] = React.useState<IntelCandidate>(candidate);
  const update = (k: keyof IntelCandidate, v: string) => setLocal((p) => ({ ...p, [k]: v }));
  // 13E: Duplicate detection
  const [similar, setSimilar] = React.useState<{id:string;pattern:string;confidence:string}[]>([]);
  React.useEffect(() => {
    if (!local.pattern || local.pattern.length < 10) return;
    const params = new URLSearchParams();
    if (local.client_key) params.set('client_key', local.client_key);
    if (local.tool_id)    params.set('tool_id', local.tool_id);
    params.set('pattern', local.pattern);
    fetch(`/api/intel/similar?${params}`)
      .then(r => r.json())
      .then(d => setSimilar(d.similar || []))
      .catch(() => {});
  }, [local.pattern, local.client_key, local.tool_id]);
  return (
    <Box border="1px solid" borderColor="blue.600" borderRadius="md" p={3} mb={3} bg="blackAlpha.500">
      <HStack mb={2} justify="space-between">
        <Text fontSize="xs" fontWeight="bold" color="blue.300" letterSpacing="wider">🧠 INTEL CANDIDATE</Text>
        <Badge colorScheme={local.confidence === 'high' ? 'green' : local.confidence === 'medium' ? 'yellow' : 'gray'} fontSize="0.65em">
          {local.confidence} confidence
        </Badge>
      </HStack>
      <VStack align="stretch" spacing={2} fontSize="xs">
        <Box>
          <Text color="gray.400" mb={0.5}>Pattern</Text>
          <Box as="textarea" value={local.pattern} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => update('pattern', e.target.value)}
            style={{width:'100%',background:'#1a202c',border:'1px solid #2d3748',borderRadius:4,padding:'4px 6px',color:'#e2e8f0',fontSize:'0.75rem',resize:'vertical',minHeight:40}} />
        </Box>
        <Box>
          <Text color="gray.400" mb={0.5}>Observation</Text>
          <Box as="textarea" value={local.observation} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => update('observation', e.target.value)}
            style={{width:'100%',background:'#1a202c',border:'1px solid #2d3748',borderRadius:4,padding:'4px 6px',color:'#e2e8f0',fontSize:'0.75rem',resize:'vertical',minHeight:40}} />
        </Box>
        <Box>
          <Text color="gray.400" mb={0.5}>Resolution</Text>
          <Box as="textarea" value={local.resolution} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => update('resolution', e.target.value)}
            style={{width:'100%',background:'#1a202c',border:'1px solid #2d3748',borderRadius:4,padding:'4px 6px',color:'#e2e8f0',fontSize:'0.75rem',resize:'vertical',minHeight:40}} />
        </Box>
        {local.tool_id && <Text color="gray.500">Tool: <Text as="span" color="blue.300">{local.tool_id}</Text></Text>}
        {local.tags?.length > 0 && <Text color="gray.500">Tags: <Text as="span" color="gray.300">{local.tags.join(', ')}</Text></Text>}
      </VStack>
      {/* 13E: Duplicate warning */}
      {similar.length > 0 && !saved && (
        <Box mt={2} p={2} borderRadius="md" bg="yellow.900" border="1px solid" borderColor="yellow.600">
          <Text fontSize="2xs" color="yellow.300" fontWeight="bold" mb={1}>⚠️ Possible similar Intel exists:</Text>
          {similar.map(s => (
            <Text key={s.id} fontSize="2xs" color="yellow.200" fontStyle="italic" noOfLines={1}>
              &ldquo;{s.pattern}&rdquo;
            </Text>
          ))}
        </Box>
      )}
      <HStack mt={3} spacing={2}>
        {saved ? (
          <Text fontSize="xs" color="green.400" fontWeight="bold">✅ Saved to Intel</Text>
        ) : (
          <Box as="button" onClick={() => onConfirm(local)}
            disabled={saving}
            style={{padding:'4px 12px',borderRadius:4,background:'#2b6cb0',color:'white',fontSize:'0.75rem',cursor:saving?'wait':'pointer',opacity:saving?0.7:1}}>
            {saving ? 'Saving…' : 'Confirm → Save to Intel'}
          </Box>
        )}
        <Box as="button" onClick={onIgnore}
          style={{padding:'4px 12px',borderRadius:4,background:'transparent',border:'1px solid #4a5568',color:'#a0aec0',fontSize:'0.75rem',cursor:'pointer'}}>
          Ignore
        </Box>
      </HStack>
    </Box>
  );
}



function IntelKBPromotion({ entry }: { entry: IntelEntry }) {
  const [status, setStatus] = React.useState<string>(entry.kb_status || 'none');
  const [saving, setSaving] = React.useState(false);

  const updateStatus = async (newStatus: 'proposed' | 'approved') => {
    setSaving(true);
    try {
      const res = await fetch(`/api/intel/${entry.id}/kb-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kb_status: newStatus, promoted_by: 'pm' }),
      });
      if (res.ok) setStatus(newStatus);
    } catch (e) { console.error('KB status update failed', e); }
    finally { setSaving(false); }
  };

  const badgeScheme = status === 'approved' ? 'green' : status === 'proposed' ? 'blue' : 'gray';
  const badgeLabel  = status === 'approved' ? '🟢 Approved' : status === 'proposed' ? '🔵 Proposed' : '⚪ Not in KB';

  return (
    <Box border="1px solid" borderColor="gray.700" borderRadius="md" p={3} bg="blackAlpha.400">
      <Text fontSize="2xs" color="gray.400" fontFamily="mono" mb={2}>KNOWLEDGE BASE PROMOTION</Text>
      <HStack justify="space-between" align="center" flexWrap="wrap" gap={2}>
        <Badge colorScheme={badgeScheme} fontSize="xs" px={2} py={0.5}>{badgeLabel}</Badge>
        <HStack spacing={2}>
          {status === 'none' && (
            <Box as="button" onClick={() => updateStatus('proposed')}
              disabled={saving}
              style={{padding:'3px 10px',borderRadius:4,background:'#2b4c8c',color:'#90cdf4',fontSize:'0.7rem',cursor:'pointer',border:'1px solid #3182ce'}}>
              {saving ? '…' : 'Propose for KB'}
            </Box>
          )}
          {status === 'proposed' && (
            <Box as="button" onClick={() => updateStatus('approved')}
              disabled={saving}
              style={{padding:'3px 10px',borderRadius:4,background:'#1a4731',color:'#9ae6b4',fontSize:'0.7rem',cursor:'pointer',border:'1px solid #38a169'}}>
              {saving ? '…' : 'Approve to KB'}
            </Box>
          )}
          {status === 'approved' && (
            <Text fontSize="xs" color="green.400">✅ Synced to KB</Text>
          )}
        </HStack>
      </HStack>
      {status === 'approved' && entry.kb_promoted_at && (
        <Text fontSize="2xs" color="gray.500" mt={1}>
          Promoted {(entry.kb_promoted_at).slice(0,10)} by {entry.kb_promoted_by || 'pm'}
        </Text>
      )}
    </Box>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function IntelDetailModal({ entry, isOpen, onClose }: { entry: IntelEntry | null; isOpen: boolean; onClose: () => void }) {
  if (!entry) return null;
  const confColor = entry.confidence === 'high' ? 'green' : entry.confidence === 'medium' ? 'yellow' : 'gray';
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
      <ModalOverlay bg="blackAlpha.800" />
      <ModalContent bg="gray.900" border="1px solid" borderColor="blue.700" color="gray.100">
        <ModalHeader fontSize="sm" fontFamily="mono" color="blue.300" borderBottom="1px solid" borderColor="gray.700" pb={3}>
          🧠 Intel Entry
          <Badge ml={3} colorScheme={confColor} fontSize="0.65em" verticalAlign="middle">{entry.confidence}</Badge>
        </ModalHeader>
        <ModalCloseButton color="gray.400" />
        <ModalBody py={4}>
          <VStack align="stretch" spacing={4} fontSize="sm">
            <Box>
              <Text fontSize="2xs" color="blue.400" fontFamily="mono" mb={1}>PATTERN</Text>
              <Text fontWeight="bold" color="white">{entry.pattern}</Text>
            </Box>
            <Box>
              <Text fontSize="2xs" color="gray.400" fontFamily="mono" mb={1}>OBSERVATION</Text>
              <Text color="gray.300" lineHeight="tall">{entry.observation}</Text>
            </Box>
            <Box>
              <Text fontSize="2xs" color="green.400" fontFamily="mono" mb={1}>RESOLUTION</Text>
              <Text color="gray.200" lineHeight="tall">{entry.resolution}</Text>
            </Box>
            <Divider borderColor="gray.700" />
            <HStack spacing={6} fontSize="xs" color="gray.500" flexWrap="wrap">
              {entry.client_key && <Text>Site: <Text as="span" color="gray.300">{entry.client_key}</Text></Text>}
              {entry.tool_id    && <Text>Tool: <Text as="span" color="blue.300">{entry.tool_id}</Text></Text>}
              {entry.source_ticket && <Text>Ticket: <Text as="span" color="gray.300">#{entry.source_ticket}</Text></Text>}
              <Text>Observed: <Text as="span" color="gray.300">{(entry.observed_at || '').slice(0,10)}</Text></Text>
            </HStack>
            {entry.tags?.length > 0 && (
              <HStack flexWrap="wrap" spacing={1}>
                {entry.tags.map((t: string, i: number) => (
                  <Badge key={i} variant="outline" colorScheme="gray" fontSize="2xs">{t}</Badge>
                ))}
              </HStack>
            )}
            {/* 13B — KB Promotion section */}
            <IntelKBPromotion entry={entry} />
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

function IntelSidebarCard({ entry, onPin, onOpen }: {
  entry: IntelEntry;
  onPin: (e: IntelEntry) => void;
  onOpen: (e: IntelEntry) => void;
}) {
  const confColor = entry.confidence === 'high' ? 'green' : entry.confidence === 'medium' ? 'yellow' : 'gray';
  return (
    <Box border="1px solid" borderColor="blue.900" borderRadius="sm" p={2} bg="gray.900"
      _hover={{ borderColor: 'blue.700' }} transition="all 0.15s">
      <Text fontSize="2xs" fontWeight="bold" color="gray.200" lineHeight="short" noOfLines={2} mb={1}>
        {entry.pattern}
      </Text>
      <Text fontSize="2xs" color="gray.400" lineHeight="short" noOfLines={2} mb={1.5}>
        {entry.resolution}
      </Text>
      <HStack justify="space-between" align="center" mb={1.5}>
        <HStack spacing={1}>
          <Badge colorScheme={confColor} fontSize="2xs" variant="subtle">{entry.confidence}</Badge>
          {entry.tool_id && <Badge colorScheme="blue" fontSize="2xs" variant="outline">{entry.tool_id}</Badge>}
        </HStack>
        <Text fontSize="2xs" color="gray.600">{timeAgoShort(entry.observed_at)}</Text>
      </HStack>
      <HStack spacing={1}>
        <Box as="button" onClick={() => onPin(entry)}
          px={1.5} py={0.5} fontSize="2xs" fontFamily="mono" color="blue.400"
          bg="blue.900" borderRadius="sm" border="1px solid" borderColor="blue.800"
          _hover={{ bg: 'blue.800', color: 'blue.200' }} cursor="pointer" flexShrink={0}>
          📌 Pin
        </Box>
        <Box as="button" onClick={() => onOpen(entry)}
          px={1.5} py={0.5} fontSize="2xs" fontFamily="mono" color="gray.500"
          bg="gray.800" borderRadius="sm" border="1px solid" borderColor="gray.700"
          _hover={{ color: 'gray.300' }} cursor="pointer" flexShrink={0}>
          Open
        </Box>
      </HStack>
    </Box>
  );
}

function ContextSidebar({ ticket, ctx, signals, priorIntel, onPinIntel }: { ticket: Ticket; ctx: TicketContext | null; signals?: TicketSignals | null; priorIntel?: { client_intel: IntelEntry[]; tool_intel: IntelEntry[] }; onPinIntel?: (e: IntelEntry) => void }) {
  const situation   = ctx?.situation   || ticket.situation || ticket.title || '';
  const expectation = ctx?.expectation || '';
  const constraints = ctx?.constraints || '';
  const riskFlags: string[] = (() => {
    try {
      const raw = (ctx as unknown as Record<string, unknown> | null)?.risk_flags;
      if (Array.isArray(raw)) return raw as string[];
      if (typeof raw === 'string') return JSON.parse(raw);
    } catch { /* empty */ }
    return [];
  })();
  const sig = signals;

  return (
    <VStack align='stretch' spacing={3} p={3} overflowY='auto' h='full'
      css={{ '&::-webkit-scrollbar': { width: '3px' }, '&::-webkit-scrollbar-thumb': { background: '#2D3748' } }}>
      <Text fontSize='2xs' fontWeight='bold' color='gray.500' fontFamily='mono' textTransform='uppercase' letterSpacing='wider'>Context</Text>
      {situation && (
        <Box>
          <Text fontSize='2xs' color='blue.400' fontFamily='mono' mb={0.5}>SITUATION</Text>
          <Text fontSize='xs' color='gray.200' lineHeight='short'>{situation}</Text>
        </Box>
      )}
      {expectation && (
        <Box>
          <Text fontSize='2xs' color='green.400' fontFamily='mono' mb={0.5}>EXPECTATION</Text>
          <Text fontSize='xs' color='gray.300' lineHeight='short'>{expectation}</Text>
        </Box>
      )}
      {constraints && constraints !== 'No specific constraints detected' && (
        <Box>
          <Text fontSize='2xs' color='yellow.400' fontFamily='mono' mb={0.5}>CONSTRAINTS</Text>
          <Text fontSize='xs' color='gray.300' lineHeight='short'>{constraints}</Text>
        </Box>
      )}
      {riskFlags.length > 0 && (
        <Box>
          <Text fontSize='2xs' color='red.400' fontFamily='mono' mb={1}>RISK FLAGS</Text>
          <VStack align='stretch' spacing={1}>
            {riskFlags.map((f: string, i: number) => (
              <HStack key={i} spacing={1} align='flex-start'>
                <Text fontSize='xs' color='red.300'>⚠</Text>
                <Text fontSize='xs' color='red.200' lineHeight='short'>{f}</Text>
              </HStack>
            ))}
          </VStack>
        </Box>
      )}
      {sig && (
        <Box>
          <Divider borderColor='gray.700' my={1} />
          <Text fontSize='2xs' color='gray.500' fontFamily='mono' mb={1}>SIGNALS</Text>
          <VStack align='stretch' spacing={1}>
            {[
              { label: 'Readiness', score: sig.readiness_score, signal: sig.readiness_signal },
              { label: 'Trust',     score: sig.trust_score,     signal: sig.trust_signal },
            ].map((s) => (
              <HStack key={s.label} justify='space-between'>
                <Text fontSize='xs' color='gray.400'>{s.label}</Text>
                <Badge colorScheme={s.signal === 'HIGH' ? 'green' : s.signal === 'DECLINING' ? 'red' : 'yellow'}
                  fontSize='2xs' fontFamily='mono'>{s.score} {s.signal}</Badge>
              </HStack>
            ))}
          </VStack>
        </Box>
      )}

      {/* Prior Intel Section */}
      {(() => {
        const si = priorIntel?.client_intel || [];
        const ti = priorIntel?.tool_intel   || [];
        const has = si.length > 0 || ti.length > 0;
        return (
          <>
            <Divider borderColor='gray.700' my={1} />
            <Text fontSize='2xs' fontWeight='bold' color='blue.500' fontFamily='mono'
              textTransform='uppercase' letterSpacing='wider' mb={2}>Prior Intel</Text>
            {has ? (
              <>
                {si.length > 0 && (
                  <Box mb={2}>
                    <Text fontSize='2xs' color='gray.500' fontFamily='mono' mb={1.5}>SITE MEMORY</Text>
                    <VStack align='stretch' spacing={2}>
                      {si.map((e: IntelEntry) => (
                        <IntelSidebarCard key={e.id} entry={e}
                          onPin={onPinIntel || (() => {})}
                          onOpen={() => {}} />
                      ))}
                    </VStack>
                  </Box>
                )}
                {ti.length > 0 && (
                  <Box>
                    {si.length > 0 && <Divider borderColor='gray.800' my={1.5} />}
                    <Text fontSize='2xs' color='gray.500' fontFamily='mono' mb={1.5}>TOOL MEMORY</Text>
                    <VStack align='stretch' spacing={2}>
                      {ti.map((e: IntelEntry) => (
                        <IntelSidebarCard key={e.id} entry={e}
                          onPin={onPinIntel || (() => {})}
                          onOpen={() => {}} />
                      ))}
                    </VStack>
                  </Box>
                )}
              </>
            ) : (
              <Text fontSize='2xs' color='gray.600' fontFamily='mono' fontStyle='italic'>
                No prior intel for this site yet
              </Text>
            )}
          </>
        );
      })()}
    </VStack>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// Phase 25 — Structured output renderers
// ─────────────────────────────────────────────────────────────────────────────

function CauseCards({ data }: { data: LikelyCausesData }) {
  const probColor = (p: string) =>
    p === 'high' ? '#FC8181' : p === 'medium' ? '#F6E05E' : '#68D391';
  return (
    <VStack align="stretch" spacing={2} w="full">
      <Text fontSize="2xs" fontWeight="bold" color="gray.400" fontFamily="mono"
        textTransform="uppercase" letterSpacing="wider" mb={1}>LIKELY CAUSES</Text>
      {data.causes.map((c, i) => (
        <Box key={i} bg="gray.900" border="1px solid" borderColor="gray.700"
          borderRadius="md" p={3}>
          <HStack align="flex-start" spacing={2} mb={1}>
            <Text fontSize="xs" color="blue.300" fontWeight="bold" flexShrink={0}>
              {i + 1}.
            </Text>
            <Text fontSize="xs" color="white" fontWeight="semibold" lineHeight="short">
              {c.cause}
            </Text>
          </HStack>
          <HStack spacing={2} mb={1.5} pl={4}>
            <Box
              px={1.5} py={0.5} borderRadius="sm" fontSize="2xs" fontFamily="mono"
              fontWeight="bold" color="gray.900"
              bg={probColor(c.probability)}>
              {c.probability.toUpperCase()}
            </Box>
          </HStack>
          <HStack align="flex-start" spacing={1.5} pl={4}>
            <Text fontSize="2xs" color="gray.500" flexShrink={0}>→</Text>
            <Text fontSize="xs" color="gray.300" lineHeight="short">{c.first_step}</Text>
          </HStack>
        </Box>
      ))}
    </VStack>
  );
}

function ChecklistComponent({ data, msgId }: { data: ChecklistData; msgId: string }) {
  const [checked, setChecked] = React.useState<Record<number, boolean>>({});
  const toggle = (i: number) => setChecked((p) => ({ ...p, [i]: !p[i] }));
  const done = Object.values(checked).filter(Boolean).length;
  return (
    <VStack align="stretch" spacing={1.5} w="full">
      <HStack justify="space-between" mb={1}>
        <Text fontSize="2xs" fontWeight="bold" color="gray.400" fontFamily="mono"
          textTransform="uppercase" letterSpacing="wider">5-MINUTE CHECKLIST</Text>
        <Text fontSize="2xs" color={done === data.steps.length ? 'green.400' : 'gray.500'}
          fontFamily="mono">{done}/{data.steps.length}</Text>
      </HStack>
      {data.steps.map((step, i) => (
        <Box key={`${msgId}-${i}`}
          as="button" onClick={() => toggle(i)} textAlign="left" w="full"
          bg={checked[i] ? 'gray.900' : 'gray.800'}
          border="1px solid" borderColor={checked[i] ? 'gray.700' : 'gray.600'}
          borderRadius="md" px={3} py={2} cursor="pointer"
          _hover={{ borderColor: 'blue.600' }} transition="all 0.1s">
          <HStack spacing={2.5} align="flex-start">
            <Box
              w={4} h={4} borderRadius="sm" border="1px solid"
              borderColor={checked[i] ? 'green.500' : 'gray.500'}
              bg={checked[i] ? 'green.500' : 'transparent'}
              flexShrink={0} mt={0.5}
              display="flex" alignItems="center" justifyContent="center">
              {checked[i] && <Text fontSize="2xs" color="white" lineHeight={1}>✓</Text>}
            </Box>
            <Text fontSize="xs" color={checked[i] ? 'gray.500' : 'gray.200'}
              lineHeight="short"
              textDecoration={checked[i] ? 'line-through' : 'none'}>
              {step}
            </Text>
          </HStack>
        </Box>
      ))}
    </VStack>
  );
}

function QuestionsList({ data }: { data: QuestionsData }) {
  return (
    <VStack align="stretch" spacing={2} w="full">
      <Text fontSize="2xs" fontWeight="bold" color="gray.400" fontFamily="mono"
        textTransform="uppercase" letterSpacing="wider" mb={1}>QUESTIONS TO ASK</Text>
      {data.items.map((item, i) => (
        <Box key={i} bg="gray.900" border="1px solid" borderColor="gray.700"
          borderRadius="md" p={3}>
          <Text fontSize="xs" color="white" fontWeight="semibold" lineHeight="short" mb={1.5}>
            • {item.question}
          </Text>
          <HStack align="flex-start" spacing={1.5}>
            <Text fontSize="2xs" color="blue.500" flexShrink={0} fontFamily="mono">WHY</Text>
            <Text fontSize="2xs" color="gray.400" lineHeight="short" fontStyle="italic">
              {item.reason}
            </Text>
          </HStack>
        </Box>
      ))}
    </VStack>
  );
}

// Helper: try parse structured data from message content
function tryParseStructured(content: string): StructuredData | null {
  try {
    const m = content.match(/\{[\s\S]*\}/);
    if (!m) return null;
    const parsed = JSON.parse(m[0]) as StructuredData;
    if ('type' in parsed && ['likely_causes','checklist','questions'].includes(parsed.type)) return parsed;
  } catch { /* ignore */ }
  return null;
}

export function PilotPanel({ ticket, ctx, signals }: { ticket: Ticket; ctx: TicketContext | null; signals?: TicketSignals | null }) {
  const storageKey = `pilot_chat_${ticket.ticket_key}`;
  const autoIntelKey = `pilot_auto_intel_shown_${ticket.ticket_key}`; // Phase 27
  const [messages, setMessages] = useState<PilotMessage[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as PilotMessage[];
        return parsed.map((m: PilotMessage) => ({ ...m, timestamp: new Date(m.timestamp) }));
      }
    } catch { /* empty */ }
    return [];
  });
  const [input, setInput]                   = useState('');
  const [loading, setLoading]               = useState(false);
  const [pendingImages, setPendingImages]   = useState<{ b64: string; preview: string }[]>([]);
  const [workingMemory, setWorkingMemory]   = useState<Record<string,string>>({});
  const [_intelCandidate, setIntelCandidate] = useState<IntelCandidate | null>(null);
  const [_intelSaving, setIntelSaving]       = useState(false);
  const [_intelSaved, setIntelSaved]         = useState(false);
  const [sidebarOpen, setSidebarOpen]       = useState(true);
  const [priorIntel, setPriorIntel]         = useState<{ client_intel: IntelEntry[]; tool_intel: IntelEntry[] }>({ client_intel: [], tool_intel: [] });
  const bottomRef        = useRef<HTMLDivElement>(null);
  const sendHadImages    = useRef<boolean>(false);  // Phase 26: track if last send had images
  const fileRef   = useRef<HTMLInputElement>(null);
  const isMobile  = useBreakpointValue({ base: true, md: false });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try { localStorage.setItem(storageKey, JSON.stringify(messages)); } catch { /* empty */ }
  }, [messages, storageKey]);

  // Load prior intel on mount
  useEffect(() => {
    if (isDemoMode()) return;
    fetch(`${PM_API}/api/intel/by-ticket/${ticket.ticket_key}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setPriorIntel(d); })
      .catch(() => {/* silent */});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticket.ticket_key]);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: uid(), role: 'assistant', timestamp: new Date(),
        content: 'Ask anything or use a chip below.',
      }]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  const buildTranscript = useCallback((msgs: PilotMessage[]) =>
    msgs
      .filter((m) => !(m.role === 'assistant' && m.content === 'Ask anything or use a chip below.'))
      .map((m) => ({ role: m.role, content: m.content, images: m.images || [] }))
  , []);

  function pinIntelToChat(entry: IntelEntry) {
    const pinMsg = `Pilot, consider this prior intel:\n\n**${entry.pattern}**\n\nResolution: ${entry.resolution}\n\nHow does this apply to the current situation?`;
    send(pinMsg);
  }

  async function send(text: string, artifactType?: 'closing' | 'internal' | 'kb' | 'intel', chipType?: string) {
    const msg = text.trim();
    if (!msg && pendingImages.length === 0) return;
    const imgs = pendingImages.map((p) => p.b64);
    sendHadImages.current = imgs.length > 0;  // Phase 26: track for loading text
    setPendingImages([]);
    setInput('');
    setLoading(true);
    const userMsg: PilotMessage = {
      id: uid(), role: 'user', content: msg,
      images: pendingImages.map((p) => p.preview),
      timestamp: new Date(),
    };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    try {
      let responseText = '';
      if (isDemoMode()) {
        await new Promise((r) => setTimeout(r, 900));
        const sit = ctx?.situation || ticket.situation || ticket.title || 'this issue';
        const client = ticket.client_display_name || ticket.client_key || 'the client';
        if (artifactType === 'closing') {
          responseText = `## Client Closing Note\n\nDear ${client} team,\n\nOur technician has completed today's visit regarding **${sit}**. The issue has been addressed and all systems were verified operational before departure.\n\nPlease don't hesitate to reach out if anything else comes up.\n\nBest regards,\nFieldstone Technologies`;
        } else if (artifactType === 'internal') {
          responseText = `## Internal Note — Ticket #${ticket.ticket_key}\n\n**Issue:** ${sit}\n**Client:** ${client}\n\nOnsite diagnosis complete. Root cause identified and resolved. All systems tested and confirmed operational. No regressions observed. Full resolution notes added to ConnectWise.`;
        } else if (artifactType === 'kb') {
          responseText = `## KB Entry\n\n**Client:** ${client}\n**Pattern:** ${sit}\n\n**Environment:** Dental office — clinical workflow dependency.\n**Resolution approach:** See ticket #${ticket.ticket_key}.\n**Future note:** Verify all connected devices before closing. Client contact: ${ctx ? 'see context' : 'check KB profile'}.`;
        } else {
          responseText = `Based on **${sit}** for ${client}:\n\n1. Start with a visual check of all affected hardware\n2. Verify connectivity at the switch/router level before touching workstations\n3. Check for recent changes — software updates, moved equipment, or new devices\n\nAsk: *"Has anything changed in the office recently?"* — this question surfaces 60% of root causes.`;
        }
      } else {
        const payload = JSON.stringify({
          message: msg,
          transcript: buildTranscript(messages),
          images: imgs,
          artifact_type: artifactType || null,
          chip_type: chipType || null,
          working_memory: workingMemory,
          auto_intel_shown: (typeof window !== 'undefined' ? localStorage.getItem(autoIntelKey) === 'true' : false),
        });
        const headers = { 'Content-Type': 'application/json' };

        // ── Streaming via SSE (Phase 24A) ─────────────────────────────────
        const streamUrl = `${PM_API}/api/tickets/${ticket.ticket_key}/work/pilot/chat-stream`;
        const streamRes = await fetch(streamUrl, { method: 'POST', headers, body: payload });

        if (streamRes.ok && streamRes.body) {
          // Add placeholder assistant message immediately
          const streamId = uid();
          setMessages((prev) => [...prev, {
            id: streamId, role: 'assistant', content: '', timestamp: new Date(), artifact: artifactType,
          }]);
          setLoading(false); // stop spinner — message bubble is live

          const reader = streamRes.body.getReader();
          const decoder = new TextDecoder();
          let buf = '';
          let accumulated = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buf += decoder.decode(value, { stream: true });
            const lines = buf.split('\n');
            buf = lines.pop() ?? '';
            for (const line of lines) {
              if (!line.startsWith('data:')) continue;
              const chunk = line.slice(5).replace(/\n/g, '\n');
              if (chunk === '[DONE]') break;
              if (chunk.startsWith('[ERROR]')) { responseText = chunk; break; }
              // Phase 27: auto-intel SSE frame
              if (chunk.startsWith('[INTEL]:')) {
                try {
                  const ic = JSON.parse(chunk.slice(8)) as IntelCandidate;
                  setIntelCandidate(ic);
                  setIntelSaved(false);
                  if (typeof window !== 'undefined') localStorage.setItem(autoIntelKey, 'true');
                } catch { /* ignore */ }
                continue;
              }
              accumulated += chunk;
              // Update message content live
              setMessages((prev) => prev.map((m) =>
                m.id === streamId ? { ...m, content: accumulated } : m
              ));
            }
          }
          // Final state sync — try to parse structured JSON for chip types
          let streamStructured: StructuredData | null = null;
          if (chipType && ['likely_causes', 'checklist', 'questions'].includes(chipType)) {
            try {
              const jsonMatch = accumulated.match(/\{[\s\S]*\}/);
              if (jsonMatch) streamStructured = JSON.parse(jsonMatch[0]) as StructuredData;
            } catch { /* fallback to markdown */ }
          }
          if (streamStructured) {
            setMessages((prev) => prev.map((m) =>
              m.id === streamId ? { ...m, structured_data: streamStructured, chip_type: chipType } : m
            ));
          }
          setWorkingMemory((prev) => extractFacts(accumulated, prev));
          return; // skip the bottom setMessages call
        }

        // ── Fallback: non-streaming ───────────────────────────────────────
        const res = await fetch(`${PM_API}/api/tickets/${ticket.ticket_key}/work/pilot/chat`, {
          method: 'POST',
          headers,
          body: payload,
        });
        if (!res.ok) throw new Error(`API ${res.status}`);
        const data = await res.json();
        responseText = data.response || '(no response)';
        if (data.intel_candidate) {
          setIntelCandidate(data.intel_candidate);
          setIntelSaved(false);
          if (data.intel_candidate.source === 'auto' && typeof window !== 'undefined')
            localStorage.setItem(autoIntelKey, 'true'); // p27
        }
        // Phase 25: structured data from API
        if (data.structured_data) {
          setMessages((prev) => [...prev, {
            id: uid(), role: 'assistant', content: responseText,
            timestamp: new Date(), artifact: artifactType,
            chip_type: chipType, structured_data: data.structured_data as StructuredData,
          }]);
          setWorkingMemory((prev) => extractFacts(responseText, prev));
          setLoading(false);
          return;
        }
      }
      setWorkingMemory((prev) => extractFacts(responseText, prev));
      setMessages((prev) => [...prev, {
        id: uid(), role: 'assistant', content: responseText,
        timestamp: new Date(), artifact: artifactType,
      }]);
    } catch (e) {
      setMessages((prev) => [...prev, {
        id: uid(), role: 'assistant', timestamp: new Date(),
        content: `❌ Pilot error — ${e instanceof Error ? e.message : 'connection failed'}`,
      }]);
    } finally {
      setLoading(false);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async function saveIntel(candidate: IntelCandidate) {
    setIntelSaving(true);
    try {
      const PM_API = process.env.NEXT_PUBLIC_PM_API_URL || 'http://localhost:8100';
      const res = await fetch(`${PM_API}/api/intel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...candidate, source_ticket: ticket.ticket_key, created_by: 'pilot' }),
      });
      if (res.ok) {
        setIntelSaved(true);
        setIntelCandidate(null);
        // Refresh prior intel sidebar
        fetch(`${PM_API}/api/intel/by-ticket/${ticket.ticket_key}`)
          .then((r) => r.ok ? r.json() : null)
          .then((d) => { if (d) setPriorIntel(d); })
          .catch(() => {});
      }
      else throw new Error(`API ${res.status}`);
    } catch (e) {
      console.error('Intel save failed', e);
    } finally {
      setIntelSaving(false);
    }
  }

  function onKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); }
  }

  async function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    const results: { b64: string; preview: string }[] = [];
    for (const file of files.slice(0, 4)) {
      if (file.size > 5 * 1024 * 1024) { console.warn('Image exceeds 5MB limit, skipping:', file.name); continue; }
      const b64 = await new Promise<string>((res) => {
        const reader = new FileReader();
        reader.onload = () => { res((reader.result as string).split(',')[1] || ''); };
        reader.readAsDataURL(file);
      });
      results.push({ b64, preview: URL.createObjectURL(file) });
    }
    setPendingImages((prev) => [...prev, ...results].slice(0, 4));
    if (fileRef.current) fileRef.current.value = '';
  }

  const chips = getChips(ctx, ticket);

  return (
    <Flex h='full' overflow='hidden' bg='gray.950'>
      <Flex direction='column' flex={1} overflow='hidden'>
        {/* Header */}
        <HStack px={3} py={2} borderBottom='1px solid' borderColor='gray.700' bg='gray.900' flexShrink={0} justify='space-between'>
          <HStack spacing={2}>
            <VStack align='flex-start' spacing={0}>
              <Text fontSize='sm' fontWeight='bold' color='white' fontFamily='mono'>WORK</Text>
              <Text fontSize='2xs' color='blue.400' fontFamily='mono'>SIGNAL WORK</Text>
            </VStack>
          </HStack>
          <HStack spacing={2}>
            {(priorIntel.client_intel.length + priorIntel.tool_intel.length) > 0 && (
              <Badge colorScheme='blue' fontSize='2xs' variant='subtle'>
                {priorIntel.client_intel.length + priorIntel.tool_intel.length} intel
              </Badge>
            )}
            <Box as='button' onClick={() => setSidebarOpen((v) => !v)}
              px={2} py={1} fontSize='2xs' fontFamily='mono' color='gray.400'
              bg='gray.800' borderRadius='sm' border='1px solid' borderColor='gray.700'
              _hover={{ color: 'white', borderColor: 'gray.500' }} cursor='pointer'>
              {sidebarOpen ? 'Hide context' : 'Show context'}
            </Box>
            <Box as='button' onClick={() => { setMessages([]); try { localStorage.removeItem(storageKey); } catch { /* empty */ } }}
              px={2} py={1} fontSize='2xs' fontFamily='mono' color='gray.500'
              bg='gray.800' borderRadius='sm' border='1px solid' borderColor='gray.700'
              _hover={{ color: 'red.300', borderColor: 'red.700' }} cursor='pointer'>
              Clear
            </Box>
          </HStack>
        </HStack>
        {/* Prompt chips */}
        <HStack px={2} py={1.5} spacing={1.5} flexWrap='wrap' borderBottom='1px solid'
          borderColor='gray.800' flexShrink={0}>
          {chips.map((chip) => (
            <Box key={chip.label} as='button' onClick={() => send(chip.prompt, chip.artifact as 'closing' | 'internal' | 'kb' | 'intel' | undefined, chip.chip_type)}
              px={2} py={0.5} fontSize='2xs' fontFamily='mono' color='gray.300'
              bg='gray.800' borderRadius='sm' border='1px solid' borderColor='gray.700' whiteSpace='nowrap'
              _hover={{ bg: 'gray.700', color: 'white', borderColor: 'blue.600' }}
              transition='all 0.15s' cursor='pointer' flexShrink={0}>
              {chip.label}
            </Box>
          ))}
        </HStack>
        {/* Messages */}
        <VStack flex={1} overflowY='auto' p={3} spacing={3} align='stretch'
          css={{ '&::-webkit-scrollbar': { width: '3px' }, '&::-webkit-scrollbar-thumb': { background: '#2D3748', borderRadius: '2px' } }}>
          {messages.map((m) => (
            <Box key={m.id} alignSelf={m.role === 'user' ? 'flex-end' : 'flex-start'} maxW='88%'>
              {m.role === 'assistant' && (
                <HStack mb={0.5} spacing={1}>
                  <Text fontSize='2xs' color='blue.500' fontFamily='mono'>WORK</Text>
                  {m.artifact && (
                    <Badge fontSize='2xs'
                      colorScheme={m.artifact === 'closing' ? 'green' : m.artifact === 'internal' ? 'blue' : m.artifact === 'kb' ? 'purple' : 'orange'}>
                      {m.artifact === 'closing' ? 'CLIENT NOTE' : m.artifact === 'internal' ? 'INTERNAL' : m.artifact === 'kb' ? 'KB ENTRY' : 'INTEL'}
                    </Badge>
                  )}
                </HStack>
              )}
              {m.images && m.images.length > 0 && (
                <HStack mb={1} flexWrap='wrap' spacing={1}>
                  {m.images.map((src, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={i} src={src} alt='upload'
                      style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 4, border: '1px solid #2D3748' }} />
                  ))}
                </HStack>
              )}
              {(() => {
                // Phase 25: try structured render first
                const sd = m.structured_data ?? (m.chip_type ? tryParseStructured(m.content) : null);
                if (sd) {
                  return (
                    <Box bg='gray.850' border='1px solid' borderColor='gray.700'
                      borderRadius='md' px={3} py={3}>
                      {sd.type === 'likely_causes' && <CauseCards data={sd} />}
                      {sd.type === 'checklist' && <ChecklistComponent data={sd} msgId={m.id} />}
                      {sd.type === 'questions' && <QuestionsList data={sd} />}
                    </Box>
                  );
                }
                return (
                  <Box
                    bg={m.role === 'user' ? 'blue.900' : 'gray.800'}
                    border='1px solid'
                    borderColor={m.role === 'user' ? 'blue.700' :
                      m.artifact === 'closing' ? 'green.800' :
                      m.artifact === 'internal' ? 'blue.800' :
                      m.artifact === 'kb' ? 'purple.800' : 'gray.700'}
                    borderRadius={m.role === 'user' ? 'lg' : 'md'}
                    px={3} py={2}
                    sx={{
                      fontSize: 'xs', color: 'gray.200', lineHeight: 'tall',
                      ul: { pl: 3, my: 1 }, li: { mb: 0.5 },
                      strong: { color: 'white' },
                      code: { bg: 'gray.900', color: 'green.300', px: 1, borderRadius: 'sm', fontFamily: 'mono' },
                      blockquote: { borderLeft: '2px solid', borderColor: 'blue.600', pl: 2, color: 'gray.400', fontStyle: 'italic' },
                    }}
                    dangerouslySetInnerHTML={{ __html: renderMd(m.content) }}
                  />
                );
              })()}
              {m.artifact && (
                <Box as='button'
                  onClick={() => { if (navigator.clipboard) navigator.clipboard.writeText(m.content); }}
                  mt={0.5} fontSize='2xs' color='gray.600' fontFamily='mono'
                  _hover={{ color: 'gray.400' }} cursor='pointer'>Copy ⎘</Box>
              )}
            </Box>
          ))}
          {loading && (
            <HStack spacing={2} pl={1}>
              <Spinner size='xs' color='blue.400' />
              <Text fontSize='xs' color='gray.500' fontFamily='mono'>{sendHadImages.current ? 'Analyzing image…' : 'Pilot thinking…'}</Text>
            </HStack>
          )}
          <div ref={bottomRef} />
        </VStack>
        {/* Pending image previews */}
        {pendingImages.length > 0 && (
          <HStack px={3} py={1.5} spacing={2} borderTop='1px solid' borderColor='gray.700' bg='gray.900' flexShrink={0}>
            {pendingImages.map((p, i) => (
              <Box key={i} position='relative'>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.preview} alt='pending' style={{ width: 48, height: 36, objectFit: 'cover', borderRadius: 4 }} />
                <Box as='button' position='absolute' top='-4px' right='-4px'
                  w='14px' h='14px' bg='red.600' color='white' borderRadius='full'
                  fontSize='8px' display='flex' alignItems='center' justifyContent='center'
                  onClick={() => setPendingImages((prev) => prev.filter((_, j) => j !== i))}>×</Box>
              </Box>
            ))}
          </HStack>
        )}
        {/* Input */}
        <HStack p={2} borderTop='1px solid' borderColor='gray.700' bg='gray.900'
          position='sticky' bottom={0} zIndex={10} flexShrink={0} spacing={2} align='flex-end'
          style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}>
          <input ref={fileRef} type='file' accept='image/*' multiple hidden onChange={onFileChange} />
          <Tooltip label='Upload site photos' placement='top'>
            <IconButton aria-label='Upload image' icon={<Text fontSize='sm'>📷</Text>}
              size='sm' variant='ghost' color='gray.500'
              _hover={{ color: 'white' }} onClick={() => fileRef.current?.click()} />
          </Tooltip>
          <Textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={onKey}
            placeholder='Ask Pilot anything… (Shift+Enter for new line)'
            size='sm' rows={2} bg='gray.800' border='1px solid' borderColor='gray.600'
            color='white' fontSize='xs' _placeholder={{ color: 'gray.600' }}
            _focus={{ borderColor: 'blue.500', boxShadow: 'none' }} _hover={{ borderColor: 'gray.500' }}
            borderRadius='md' flex={1} resize='none' disabled={loading} />
          <IconButton aria-label='Send' icon={<Text fontSize='sm'>▶</Text>}
            size='sm' colorScheme='blue' onClick={() => send(input)}
            isLoading={loading} borderRadius='md' flexShrink={0} alignSelf='flex-end' />
        </HStack>
      </Flex>
      {/* Context sidebar */}
      {sidebarOpen && !isMobile && (
        <Box w='240px' flexShrink={0} borderLeft='1px solid' borderColor='gray.700' bg='gray.900' h='full' overflow='hidden'>
          <ContextSidebar ticket={ticket} ctx={ctx} signals={signals} priorIntel={priorIntel} onPinIntel={pinIntelToChat} />
        </Box>
      )}
    </Flex>
  );
}
