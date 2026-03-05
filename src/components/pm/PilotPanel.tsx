'use client';
import React from 'react';
import {
  Box, VStack, HStack, Text, Textarea, IconButton,
  Flex, Spinner, Badge, Divider, Tooltip,
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

interface PilotMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  images?: string[];
  timestamp: Date;
  artifact?: 'closing' | 'internal' | 'kb' | 'intel';
}

interface PilotChip { label: string; prompt: string; artifact?: string; }

function getChips(ctx: TicketContext | null, ticket: Ticket): PilotChip[] {
  const chips: PilotChip[] = [
    { label: '📋 5-min checklist',  prompt: 'Give me a concise 5-minute onsite checklist for this situation.' },
    { label: '🔍 Likely causes',    prompt: 'What are the top 3 most likely causes for this issue?' },
    { label: '❓ Questions to ask', prompt: 'What are the most important questions I should ask the client onsite?' },
    { label: '✉️ Closing note',     prompt: 'Generate a professional client-facing closing note based on the context and our conversation.' },
    { label: '📝 Internal note',    prompt: 'Generate a detailed internal technician note for ConnectWise based on the context and our conversation.' },
    { label: '🧠 KB entry',         prompt: 'Generate a knowledge base entry capturing what was learned about this environment and issue.' },
  ];
  if (ctx?.clinical_workflow_impact) {
    chips.unshift({ label: '🏥 Clinical impact', prompt: 'What clinical workflows might be affected and what is the fallback protocol?' });
  }
  if (ctx?.emotion_tone === 'frustrated') {
    chips.unshift({ label: '🤝 Client relations', prompt: 'This client appears frustrated. How should I approach the conversation to rebuild trust?' });
  }
  // Always include Intel proposal chip
  chips.unshift({ label: '🧠 Propose Intel entry', prompt: 'Propose an Intel entry based on what we have discussed and the ticket context.', artifact: 'intel' });
  return chips.slice(0, 8);
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
}

function IntelCandidateCard({
  candidate, ticketKey, onConfirm, onIgnore, saving, saved
}: {
  candidate: IntelCandidate;
  ticketKey: string;
  onConfirm: (c: IntelCandidate) => void;
  onIgnore: () => void;
  saving: boolean;
  saved: boolean;
}) {
  const [local, setLocal] = React.useState<IntelCandidate>(candidate);
  const update = (k: keyof IntelCandidate, v: string) => setLocal((p) => ({ ...p, [k]: v }));
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

function ContextSidebar({ ticket, ctx, signals }: { ticket: Ticket; ctx: TicketContext | null; signals?: TicketSignals | null }) {
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
    </VStack>
  );
}

export function PilotPanel({ ticket, ctx, signals }: { ticket: Ticket; ctx: TicketContext | null; signals?: TicketSignals | null }) {
  const storageKey = `pilot_chat_${ticket.ticket_key}`;
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
  const [intelCandidate, setIntelCandidate] = useState<IntelCandidate | null>(null);
  const [intelSaving, setIntelSaving]       = useState(false);
  const [intelSaved, setIntelSaved]         = useState(false);
  const [sidebarOpen, setSidebarOpen]       = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef   = useRef<HTMLInputElement>(null);
  const isMobile  = useBreakpointValue({ base: true, md: false });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try { localStorage.setItem(storageKey, JSON.stringify(messages)); } catch { /* empty */ }
  }, [messages, storageKey]);

  useEffect(() => {
    if (messages.length === 0) {
      const situation = ctx?.situation || ticket.situation || ticket.title || 'this ticket';
      setMessages([{
        id: uid(), role: 'assistant', timestamp: new Date(),
        content: `## ✈️ Pilot Online\n\nGrounded in **${ticket.client_display_name || ticket.client_key || 'this client'}** — **${situation}**.\n\nUse the chips below, upload site photos, or ask me anything.`,
      }]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  const buildTranscript = useCallback((msgs: PilotMessage[]) =>
    msgs
      .filter((m) => !(m.role === 'assistant' && m.content.startsWith('## ✈️ Pilot Online')))
      .map((m) => ({ role: m.role, content: m.content, images: m.images || [] }))
  , []);

  async function send(text: string, artifactType?: 'closing' | 'internal' | 'kb' | 'intel') {
    const msg = text.trim();
    if (!msg && pendingImages.length === 0) return;
    const imgs = pendingImages.map((p) => p.b64);
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
        const res = await fetch(`${PM_API}/api/tickets/${ticket.ticket_key}/work/pilot/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: msg, transcript: buildTranscript(messages), images: imgs, artifact_type: artifactType || null, working_memory: workingMemory }),
        });
        if (!res.ok) throw new Error(`API ${res.status}`);
        const data = await res.json();
        responseText = data.response || '(no response)';
        if (data.intel_candidate) {
          setIntelCandidate(data.intel_candidate);
          setIntelSaved(false);
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

  async function saveIntel(candidate: IntelCandidate) {
    setIntelSaving(true);
    try {
      const PM_API = process.env.NEXT_PUBLIC_PM_API_URL || 'http://localhost:8100';
      const res = await fetch(`${PM_API}/api/intel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...candidate, source_ticket: ticket.ticket_key, created_by: 'pilot' }),
      });
      if (res.ok) { setIntelSaved(true); setIntelCandidate(null); }
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
            <Text fontSize='lg'>✈️</Text>
            <VStack align='flex-start' spacing={0}>
              <Text fontSize='sm' fontWeight='bold' color='white' fontFamily='mono'>PILOT</Text>
              <Text fontSize='2xs' color='blue.400' fontFamily='mono'>TECH COPILOT ● ONLINE</Text>
            </VStack>
          </HStack>
          <HStack spacing={2}>
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
            <Box key={chip.label} as='button' onClick={() => send(chip.prompt, chip.artifact as 'closing' | 'internal' | 'kb' | 'intel' | undefined)}
              px={2} py={0.5} fontSize='2xs' fontFamily='mono' color='gray.300'
              bg='gray.800' borderRadius='sm' border='1px solid' borderColor='gray.700' whiteSpace='nowrap'
              _hover={{ bg: 'gray.700', color: 'white', borderColor: 'blue.600' }}
              transition='all 0.15s' cursor='pointer' flexShrink={0}>
              {chip.label}
            </Box>
          ))}
        </HStack>
        {/* Artifact buttons */}
        <HStack px={2} py={1} spacing={1.5} borderBottom='1px solid' borderColor='gray.800' flexShrink={0}>
          <Text fontSize='2xs' color='gray.600' fontFamily='mono' mr={1}>Generate:</Text>
          {([
            { label: '✉️ Client Note',   type: 'closing'  as const, prompt: 'Generate a professional client-facing closing note based on the context and our conversation so far.' },
            { label: '📝 Internal Note', type: 'internal' as const, prompt: 'Generate a detailed internal technician note for ConnectWise based on the context and our conversation.' },
            { label: '🧠 KB Entry',      type: 'kb'       as const, prompt: 'Generate a knowledge base entry capturing what was learned about this environment and issue.' },
          ] as { label: string; type: 'closing' | 'internal' | 'kb'; prompt: string }[]).map((a) => (
            <Box key={a.type} as='button' onClick={() => send(a.prompt, a.type)}
              px={2} py={0.5} fontSize='2xs' fontFamily='mono'
              color={a.type === 'closing' ? 'green.300' : a.type === 'internal' ? 'blue.300' : 'purple.300'}
              bg='gray.900' borderRadius='sm' border='1px solid'
              borderColor={a.type === 'closing' ? 'green.800' : a.type === 'internal' ? 'blue.900' : 'purple.900'}
              _hover={{ opacity: 0.8 }} transition='all 0.15s' cursor='pointer'>
              {a.label}
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
                  <Text fontSize='2xs' color='blue.500' fontFamily='mono'>PILOT</Text>
                  {m.artifact && (
                    <Badge fontSize='2xs'
                      colorScheme={m.artifact === 'closing' ? 'green' : m.artifact === 'internal' ? 'blue' : 'purple'}>
                      {m.artifact === 'closing' ? 'CLIENT NOTE' : m.artifact === 'internal' ? 'INTERNAL' : 'KB ENTRY'}
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
              <Text fontSize='xs' color='gray.500' fontFamily='mono'>Pilot thinking…</Text>
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
        <HStack p={2} borderTop='1px solid' borderColor='gray.700' bg='gray.900' flexShrink={0} spacing={2} align='flex-end'>
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
        <Box w='200px' flexShrink={0} borderLeft='1px solid' borderColor='gray.700' bg='gray.900' h='full' overflow='hidden'>
          <ContextSidebar ticket={ticket} ctx={ctx} signals={signals} />
        </Box>
      )}
    </Flex>
  );
}
