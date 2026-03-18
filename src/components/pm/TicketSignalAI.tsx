'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box, HStack, Text, Input, Button, Badge, Spinner,
} from '@chakra-ui/react';
import { Ticket } from './types';
import { pmFetch } from '@/lib/demoApi';

const PM_API = '/pm-api';

const ACTION_CHIPS: { label: string; message: string }[] = [
  {
    label: '🔍 Likely causes',
    message: 'What are the most likely causes for this issue? Give me a prioritized list to check.',
  },
  {
    label: '❓ Questions to ask',
    message: 'What questions should I ask the client before starting work?',
  },
  {
    label: '📋 5-min checklist',
    message: 'Give me a quick 5-minute checklist to triage this ticket onsite.',
  },
  {
    label: '✉️ Closing note',
    message: 'Draft a professional closing note for this ticket suitable for the client.',
  },
  {
    label: '📝 Internal note',
    message: 'Write a concise internal technical note summarizing what was done.',
  },
];

type Role = 'user' | 'signal';

interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
}

interface PersistedSession {
  messages: Message[];
}

interface PilotChatResponse {
  response?: string;
  message?: string;
}

function getStorageKey(ticketKey: string): string {
  return `signal_ai_${ticketKey}`;
}

function loadSession(ticketKey: string): Message[] {
  try {
    const raw = localStorage.getItem(getStorageKey(ticketKey));
    if (!raw) return [];
    const parsed: PersistedSession = JSON.parse(raw);
    return Array.isArray(parsed.messages) ? parsed.messages : [];
  } catch {
    return [];
  }
}

function saveSession(ticketKey: string, messages: Message[]): void {
  try {
    const session: PersistedSession = { messages };
    localStorage.setItem(getStorageKey(ticketKey), JSON.stringify(session));
  } catch {
    // localStorage unavailable (SSR or private mode) — silently ignore
  }
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user';
  return (
    <Box display="flex" justifyContent={isUser ? 'flex-end' : 'flex-start'} mb={3}>
      <Box maxW="85%">
        {!isUser && (
          <Text fontSize="9px" color="blue.500" fontFamily="mono" letterSpacing="wider" mb={1}>
            SIGNAL AI
          </Text>
        )}
        <Box
          px={4} py={3} borderRadius="xl"
          bg={isUser ? 'blue.600' : 'gray.800'}
          border="1px solid"
          borderColor={isUser ? 'blue.500' : 'gray.700'}
        >
          <Text fontSize="sm" color="white" fontFamily="mono" whiteSpace="pre-wrap">
            {msg.content}
          </Text>
        </Box>
      </Box>
    </Box>
  );
}

export default function TicketSignalAI({ ticket }: { ticket: Ticket }) {
  const clientName = ticket.client_display_name || ticket.sender_name || ticket.client_key || 'this client';
  const ticketKey  = ticket.ticket_key;

  const makeGreeting = useCallback((): Message => ({
    id: 'welcome',
    role: 'signal',
    content: `Signal AI ready. I have context on ticket #${ticketKey} — ${clientName}. How can I help?`,
    timestamp: Date.now(),
  }), [ticketKey, clientName]);

  // Initialize messages from localStorage or greeting
  const [messages, setMessages] = useState<Message[]>(() => {
    // SSR guard — localStorage not available server-side
    if (typeof window === 'undefined') return [];
    const saved = loadSession(ticketKey);
    return saved.length > 0 ? saved : [];
  });

  const [input,   setInput]   = useState('');
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  // Set initial greeting once on mount (avoids SSR mismatch)
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([makeGreeting()]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      saveSession(ticketKey, messages);
    }
  }, [ticketKey, messages]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Re-initialize when ticket changes
  useEffect(() => {
    const saved = loadSession(ticketKey);
    setMessages(saved.length > 0 ? saved : [makeGreeting()]);
    setInput('');
    setLoading(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketKey]);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmed,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Build history from prior messages (exclude the welcome greeting)
      const history = messages
        .filter(m => m.id !== 'welcome')
        .slice(-12)
        .map(m => ({
          role:    m.role === 'user' ? 'user' : 'assistant',
          content: m.content,
        }));

      // pmFetch handles demo mode routing automatically
      const data = await pmFetch(
        `/api/tickets/${ticketKey}/work/pilot/chat`,
        PM_API,
        {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ message: trimmed, history }),
        }
      ) as PilotChatResponse;

      const aiMsg: Message = {
        id:        (Date.now() + 1).toString(),
        role:      'signal',
        content:   data.response || data.message || 'No response received.',
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, aiMsg]);

      // Persist tech message as ticket_note for intel extraction
      // Only substantive messages (>30 chars), skip demo mode
      if (trimmed.length > 30 && process.env.NEXT_PUBLIC_DEMO_MODE !== 'true') {
        pmFetch(`/api/tickets/${ticketKey}/notes`, PM_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: trimmed, author: 'tech', note_source: 'manual', type: 'visit_note' }),
        }).catch(() => {/* non-critical */});
      }
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id:        (Date.now() + 1).toString(),
          role:      'signal',
          content:   'Connection error — could not reach Signal AI. Please check your network.',
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [messages, loading, ticketKey]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <Box h="100%" bg="gray.950" display="flex" flexDirection="column" w="full">

      {/* Header */}
      <Box px={5} py={3} borderBottom="1px solid" borderColor="gray.800" flexShrink={0}>
        <HStack spacing={3}>
          <Box w={2} h={2} bg="blue.400" borderRadius="full" />
          <Text fontSize="xs" fontWeight="bold" color="white" fontFamily="mono">
            SIGNAL AI
          </Text>
          <Badge colorScheme="blue" fontSize="8px" fontFamily="mono">PILOT</Badge>
          <Text fontSize="2xs" color="gray.600" fontFamily="mono" ml="auto">
            #{ticketKey}
          </Text>
        </HStack>
      </Box>

      {/* Message list */}
      <Box
        flex="1"
        overflowY="auto"
        px={5}
        py={4}
        css={{
          '&::-webkit-scrollbar': { width: '4px' },
          '&::-webkit-scrollbar-thumb': { background: '#2D3748', borderRadius: '2px' },
        }}
      >
        {messages.map(msg => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}

        {loading && (
          <Box display="flex" justifyContent="flex-start" mb={3}>
            <Box
              px={4} py={3}
              bg="gray.800" borderRadius="xl"
              border="1px solid" borderColor="gray.700"
            >
              <HStack spacing={2}>
                <Spinner size="xs" color="blue.400" />
                <Text fontSize="xs" color="gray.400" fontFamily="mono">
                  Signal is thinking...
                </Text>
              </HStack>
            </Box>
          </Box>
        )}

        <div ref={bottomRef} />
      </Box>

      {/* Action chips */}
      {!loading && (
        <Box
          px={5}
          pb={2}
          flexShrink={0}
          overflowX="auto"
          css={{
            '&::-webkit-scrollbar': { height: '3px' },
            '&::-webkit-scrollbar-thumb': { background: '#2D3748', borderRadius: '2px' },
          }}
        >
          <HStack spacing={2} minW="max-content">
            {ACTION_CHIPS.map(chip => (
              <Button
                key={chip.label}
                size="xs"
                variant="outline"
                borderColor="gray.700"
                color="gray.400"
                fontFamily="mono"
                fontSize="2xs"
                py={1}
                px={2}
                _hover={{ borderColor: 'blue.500', color: 'white', bg: 'whiteAlpha.50' }}
                onClick={() => sendMessage(chip.message)}
                flexShrink={0}
              >
                {chip.label}
              </Button>
            ))}
          </HStack>
        </Box>
      )}

      {/* Input */}
      <Box px={5} py={4} borderTop="1px solid" borderColor="gray.800" flexShrink={0}>
        <HStack spacing={3}>
          <Input
            ref={inputRef}
            bg="gray.900"
            borderColor="gray.700"
            color="white"
            fontFamily="mono"
            fontSize="sm"
            placeholder={`Ask about #${ticketKey}...`}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            _placeholder={{ color: 'gray.600' }}
            _focus={{ borderColor: 'blue.400', boxShadow: 'none' }}
            isDisabled={loading}
          />
          <Button
            colorScheme="blue"
            fontFamily="mono"
            fontSize="xs"
            size="sm"
            px={6}
            isDisabled={!input.trim() || loading}
            isLoading={loading}
            onClick={() => sendMessage(input)}
          >
            SEND
          </Button>
        </HStack>
        <Text fontSize="9px" color="gray.700" fontFamily="mono" mt={2} textAlign="center">
          Signal AI has context on #{ticketKey}. Responses are AI-generated — verify before acting.
        </Text>
      </Box>
    </Box>
  );
}
