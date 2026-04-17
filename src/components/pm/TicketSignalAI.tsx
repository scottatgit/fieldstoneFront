'use client';
import { useState, useCallback } from 'react';
import {
  Box, HStack, VStack, Text, Button, Badge, Spinner, useToast,
} from '@chakra-ui/react';
import { Ticket } from './types';
import { pmFetch } from '@/lib/demoApi';

const PM_API = '/pm-api';

// ── Types ──────────────────────────────────────────────────────────────────────
type ActionMode  = 'assist' | 'close';
type PanelState  = 'idle' | 'loading' | 'ready' | 'error';

interface OutputState {
  mode:    ActionMode | null;
  content: string;
  state:   PanelState;
}

const IDLE: OutputState = { mode: null, content: '', state: 'idle' };

// ── Note semantics (FST-057) ───────────────────────────────────────────────────
// Assist → note_source='ai_assist', type='visit_note'  (mid-work tech note)
// Close  → note_source='ai_close',  type='visit_note'  (close-ready summary)
const NOTE_META: Record<ActionMode, { source: string; label: string }> = {
  assist: { source: 'ai_assist', label: 'work note' },
  close:  { source: 'ai_close',  label: 'close note' },
};

interface PilotResponse    { response?: string; message?: string; }
interface CloseDraftResp   { close_draft?: { ai_close_note?: string; work_performed?: string }; }

// ── Component ─────────────────────────────────────────────────────────────────
export default function TicketSignalAI({ ticket }: { ticket: Ticket }) {
  const ticketKey = ticket.ticket_key;

  const [output,    setOutput]    = useState<OutputState>(IDLE);
  const [noteAdded, setNoteAdded] = useState(false);
  const toast = useToast();

  // ── Assist ──────────────────────────────────────────────────────────────────
  const runAssist = useCallback(async () => {
    setOutput({ mode: 'assist', content: '', state: 'loading' });
    setNoteAdded(false);
    try {
      const data = await pmFetch(
        `/api/tickets/${ticketKey}/work/pilot/chat`,
        PM_API,
        {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          // mode='assist': backend owns the prompt — no client-side text needed
          body: JSON.stringify({ message: '', mode: 'assist' }),
        }
      ) as PilotResponse;
      const text = data.response || data.message || 'No response received.';
      setOutput({ mode: 'assist', content: text, state: 'ready' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Connection error. Please retry.';
      setOutput({ mode: 'assist', content: msg, state: 'error' });
    }
  }, [ticketKey]);

  // ── Close ───────────────────────────────────────────────────────────────────
  const runClose = useCallback(async () => {
    setOutput({ mode: 'close', content: '', state: 'loading' });
    setNoteAdded(false);
    try {
      const data = await pmFetch(
        `/api/tickets/${ticketKey}/close-draft`,
        PM_API,
        { method: 'GET' }
      ) as CloseDraftResp;
      const note =
        data?.close_draft?.ai_close_note ||
        data?.close_draft?.work_performed ||
        'No close note generated — add work notes first and try again.';
      setOutput({ mode: 'close', content: note, state: 'ready' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Connection error. Please retry.';
      setOutput({ mode: 'close', content: msg, state: 'error' });
    }
  }, [ticketKey]);

  // ── Add as Note — explicit, user-triggered only ──────────────────────────────
  const addAsNote = useCallback(async () => {
    if (!output.content || !output.mode || output.state !== 'ready') return;
    const meta = NOTE_META[output.mode];
    try {
      await pmFetch(`/api/tickets/${ticketKey}/notes`, PM_API, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content:     output.content,
          author:      'tech',
          note_source: meta.source,
          type:        'visit_note',
        }),
      });
      setNoteAdded(true);
      toast({ title: `Added as ${meta.label}`, status: 'success', duration: 2500, isClosable: true });
    } catch {
      toast({ title: 'Could not save note', description: 'Check connection and retry.', status: 'error', duration: 3000, isClosable: true });
    }
  }, [output, ticketKey, toast]);

  // ── Copy ────────────────────────────────────────────────────────────────────
  const copyOutput = useCallback(() => {
    if (!output.content) return;
    navigator.clipboard.writeText(output.content)
      .then(() => toast({ title: 'Copied', status: 'info', duration: 1500 }))
      .catch(() => toast({ title: 'Copy failed', status: 'warning', duration: 1500 }));
  }, [output.content, toast]);

  const isLoading = output.state === 'loading';

  return (
    <Box h="100%" bg="gray.950" display="flex" flexDirection="column" w="full" minH={0}>

      {/* Header */}
      <Box px={5} py={3} borderBottom="1px solid" borderColor="gray.800" flexShrink={0}>
        <HStack spacing={3}>
          <Box w={2} h={2} bg="blue.400" borderRadius="full" />
          <Text fontSize="xs" fontWeight="bold" color="white" fontFamily="mono">
            SIGNAL AI
          </Text>
          <Badge colorScheme="blue" fontSize="8px" fontFamily="mono">WORK</Badge>
          <Text fontSize="2xs" color="gray.600" fontFamily="mono" ml="auto">
            #{ticketKey}
          </Text>
        </HStack>
      </Box>

      {/* Action buttons */}
      <Box px={5} py={4} flexShrink={0}>
        <HStack spacing={3}>
          <Button
            size="sm"
            colorScheme="blue"
            fontFamily="mono"
            fontSize="xs"
            px={5}
            isLoading={isLoading && output.mode === 'assist'}
            isDisabled={isLoading}
            onClick={runAssist}
            loadingText="THINKING..."
          >
            ⚡ ASSIST
          </Button>
          <Button
            size="sm"
            variant="outline"
            borderColor="gray.600"
            color="gray.300"
            fontFamily="mono"
            fontSize="xs"
            px={5}
            isLoading={isLoading && output.mode === 'close'}
            isDisabled={isLoading}
            onClick={runClose}
            loadingText="DRAFTING..."
            _hover={{ borderColor: 'green.500', color: 'green.300' }}
          >
            ✓ CLOSE NOTE
          </Button>
          {output.state !== 'idle' && !isLoading && (
            <Button
              size="sm"
              variant="ghost"
              color="gray.600"
              fontFamily="mono"
              fontSize="2xs"
              onClick={() => { setOutput(IDLE); setNoteAdded(false); }}
              _hover={{ color: 'gray.400' }}
            >
              CLEAR
            </Button>
          )}
        </HStack>
        <Text fontSize="9px" color="gray.700" fontFamily="mono" mt={2}>
          ASSIST — direction + next actions + paste-ready note &nbsp;·&nbsp;
          CLOSE NOTE — final close summary from current ticket state
        </Text>
      </Box>

      {/* Output panel */}
      <Box flex={1} px={5} pb={4} minH={0} display="flex" flexDirection="column">

        {/* Idle state */}
        {output.state === 'idle' && (
          <Box
            flex={1}
            border="1px dashed"
            borderColor="gray.800"
            borderRadius="md"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <VStack spacing={1}>
              <Text fontSize="xs" color="gray.700" fontFamily="mono">No output yet</Text>
              <Text fontSize="2xs" color="gray.800" fontFamily="mono">
                Press ASSIST or CLOSE NOTE above
              </Text>
            </VStack>
          </Box>
        )}

        {/* Loading state */}
        {isLoading && (
          <Box
            flex={1}
            border="1px solid"
            borderColor="gray.800"
            borderRadius="md"
            bg="gray.900"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <HStack spacing={3}>
              <Spinner size="sm" color="blue.400" />
              <Text fontSize="xs" color="gray.400" fontFamily="mono">
                {output.mode === 'assist' ? 'Analysing ticket context...' : 'Drafting close note...'}
              </Text>
            </HStack>
          </Box>
        )}

        {/* Ready / Error state */}
        {(output.state === 'ready' || output.state === 'error') && (
          <Box flex={1} display="flex" flexDirection="column" minH={0}>
            {/* Mode label */}
            <HStack mb={2} spacing={2}>
              <Badge
                colorScheme={output.mode === 'assist' ? 'blue' : 'green'}
                fontSize="8px"
                fontFamily="mono"
              >
                {output.mode === 'assist' ? 'ASSIST PROMPT' : 'CLOSE NOTE'}
              </Badge>
              {output.state === 'error' && (
                <Badge colorScheme="red" fontSize="8px" fontFamily="mono">ERROR</Badge>
              )}
            </HStack>

            {/* Text output */}
            <Box
              flex={1}
              overflowY="auto"
              bg="gray.900"
              border="1px solid"
              borderColor={output.state === 'error' ? 'red.800' : output.mode === 'assist' ? 'gray.700' : 'green.900'}
              borderRadius="md"
              px={4}
              py={3}
              mb={3}
              css={{
                '&::-webkit-scrollbar': { width: '4px' },
                '&::-webkit-scrollbar-thumb': { background: '#2D3748', borderRadius: '2px' },
              }}
            >
              <Text
                fontSize="xs"
                color={output.state === 'error' ? 'red.300' : 'gray.200'}
                fontFamily="mono"
                whiteSpace="pre-wrap"
                lineHeight="tall"
              >
                {output.content}
              </Text>
            </Box>

            {/* Action row — FST-058: Assist shows COPY PROMPT only; Close retains ADD AS NOTE */}
            {output.state === 'ready' && (
              <>
                {output.mode === 'assist' ? (
                  /* Assist: prompt output — copy only, no note save */
                  <VStack spacing={1} alignItems="flex-start" flexShrink={0}>
                    <Button
                      size="xs"
                      variant="outline"
                      borderColor="blue.700"
                      color="blue.300"
                      fontFamily="mono"
                      fontSize="2xs"
                      onClick={copyOutput}
                      _hover={{ borderColor: 'blue.400', color: 'white' }}
                    >
                      📋 COPY PROMPT
                    </Button>
                    <Text fontSize="9px" color="gray.600" fontFamily="mono">
                      Paste into ChatGPT, Claude, or any AI tool
                    </Text>
                  </VStack>
                ) : (
                  /* Close: note output — copy + add as note */
                  <HStack spacing={3} flexShrink={0}>
                    <Button
                      size="xs"
                      variant="outline"
                      borderColor="gray.700"
                      color="gray.400"
                      fontFamily="mono"
                      fontSize="2xs"
                      onClick={copyOutput}
                      _hover={{ borderColor: 'gray.500', color: 'white' }}
                    >
                      📋 COPY
                    </Button>
                    <Button
                      size="xs"
                      variant={noteAdded ? 'solid' : 'outline'}
                      colorScheme={noteAdded ? 'green' : 'gray'}
                      borderColor={noteAdded ? undefined : 'gray.700'}
                      color={noteAdded ? undefined : 'gray.400'}
                      fontFamily="mono"
                      fontSize="2xs"
                      onClick={addAsNote}
                      isDisabled={noteAdded}
                      _hover={noteAdded ? {} : { borderColor: 'green.600', color: 'green.300' }}
                    >
                      {noteAdded ? '✓ ADDED AS NOTE' : '+ ADD AS CLOSE NOTE'}
                    </Button>
                    <Text fontSize="9px" color="gray.700" fontFamily="mono" ml="auto">
                      Saves as visit_note / ai_close
                    </Text>
                  </HStack>
                )}
              </>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
}
