'use client';
import {
  Box, VStack, HStack, Text, Input, IconButton,
  Flex, Spinner,
} from '@chakra-ui/react';
import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { ChatMessage } from './types';
import { isDemoMode, demoFetch } from '@/lib/demoApi';

const PM_API = process.env.NEXT_PUBLIC_PM_API_URL || 'http://localhost:8100';

const QUICK_CMDS = [
  { label: '📥 Ingest',   cmd: '!ingest'   },
  { label: '📅 Calendar', cmd: '!calendar' },
  { label: '📊 Signals',  cmd: '!signals'  },
  { label: '📋 Digest',   cmd: '!digest'   },
];

function uid() {
  return Math.random().toString(36).slice(2);
}

/** Very minimal markdown renderer for chat messages */
function renderMd(text: string): string {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^#{1,3} (.+)$/gm, '<strong style="color:#90CDF4">$1</strong>')
    .replace(/^\| .+\|$/gm, (row) => {
      if (/^\|[-| :]+\|$/.test(row)) return '';
      const cells = row.split('|').slice(1, -1);
      return '<tr>' + cells.map(c => `<td>${c.trim()}</td>`).join('') + '</tr>';
    })
    .replace(/(<tr>.*<\/tr>\n?)+/g, m => `<table>${m}</table>`)
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, m => `<ul>${m}</ul>`)
    .replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/\n/g, '<br/>');
}


/** Client-only time display — prevents SSR hydration mismatch */
function TimeDisplay({ ts }: { ts: Date }) {
  const [display, setDisplay] = useState('');
  useEffect(() => {
    setDisplay(ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  }, [ts]);
  return <span>{display}</span>;
}
export function ChatPanel({ onCommand: _onCommand }: { onCommand?: () => void } = {}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef             = useRef<HTMLDivElement>(null);

  // Add initial Pilot message client-side only (avoids SSR hydration mismatch)
  useEffect(() => {
    setMessages([{
      id: uid(),
      role: 'assistant',
      content: '## Pilot Ready\n\nFieldstone tech copilot ready. Try `!digest`, `!signals`, or `!brief <ticket_key>`.\n\nType `help` for all commands.',
      type: 'text',
      timestamp: new Date(),
    }]);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send(text: string) {
    const msg = text.trim();
    if (!msg) return;
    setInput('');
    setLoading(true);

    const userMsg: ChatMessage = {
      id: uid(), role: 'user', content: msg, type: 'text', timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      let data: { response: string; type?: string };
      if (isDemoMode()) {
        data = await demoFetch('/api/chat') as { response: string; type?: string };
      } else {
        const res = await fetch(`${PM_API}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: msg }),
        });
        data = await res.json();
      }
      const botMsg: ChatMessage = {
        id: uid(), role: 'assistant', content: data.response, type: (data.type as 'table' | 'text' | 'brief') || 'text', timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);
    } catch {
      setMessages(prev => [...prev, {
        id: uid(), role: 'assistant', content: '❌ Connection error — is the API running on port 8100?', type: 'text', timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); }
  }

  return (
    <Flex direction="column" h="full" bg="gray.950" borderLeft="1px solid" borderColor="gray.700">
      {/* Header */}
      <HStack px={3} py={2} borderBottom="1px solid" borderColor="gray.700" bg="gray.900" flexShrink={0}>
        <Text fontSize="lg">🤖</Text>
        <VStack align="flex-start" spacing={0}>
          <Text fontSize="sm" fontWeight="bold" color="white" fontFamily="mono">PILOT</Text>
          <Text fontSize="2xs" color="green.400" fontFamily="mono">FIELD COPILOT ● ONLINE</Text>
        </VStack>
      </HStack>

      {/* Quick command buttons */}
      <HStack px={2} py={1.5} spacing={1.5} flexWrap="wrap" borderBottom="1px solid" borderColor="gray.800" flexShrink={0}>
        {QUICK_CMDS.map(({ label, cmd }) => (
          <Box
            key={cmd}
            as="button"
            onClick={() => send(cmd)}
            px={2} py={0.5}
            fontSize="2xs"
            fontFamily="mono"
            color="gray.400"
            bg="gray.800"
            borderRadius="sm"
            border="1px solid"
            borderColor="gray.700"
            _hover={{ bg: 'gray.700', color: 'white', borderColor: 'gray.500' }}
            transition="all 0.15s"
            cursor="pointer"
          >
            {label}
          </Box>
        ))}
      </HStack>

      {/* Messages */}
      <VStack
        flex={1} overflowY="auto" p={3} spacing={2} align="stretch"
        css={{
          '&::-webkit-scrollbar': { width: '3px' },
          '&::-webkit-scrollbar-thumb': { background: '#2D3748', borderRadius: '2px' }
        }}
      >
        {messages.map(m => (
          <Box key={m.id} alignSelf={m.role === 'user' ? 'flex-end' : 'flex-start'} maxW="92%">
            {m.role === 'assistant' && (
              <Text fontSize="2xs" color="gray.600" mb={0.5} fontFamily="mono">PILOT</Text>
            )}
            <Box
              bg={m.role === 'user' ? 'blue.800' : 'gray.800'}
              border="1px solid"
              borderColor={m.role === 'user' ? 'blue.600' : m.type === 'brief' ? 'green.800' : 'gray.700'}
              borderRadius={m.role === 'user' ? 'lg' : 'md'}
              px={3} py={2}
              sx={{
                fontSize: 'xs',
                color: 'gray.200',
                lineHeight: 'tall',
                table: { width: '100%', borderCollapse: 'collapse', my: 1, fontSize: '2xs' },
                td: { p: '3px 6px', borderBottom: '1px solid', borderColor: 'gray.700', color: 'gray.300' },
                'td:first-of-type': { color: 'gray.400', fontFamily: 'mono' },
                ul: { pl: 3, my: 1 },
                li: { mb: 0.5 },
                strong: { color: 'white' },
                code: { bg: 'gray.900', color: 'green.300', px: 1, borderRadius: 'sm', fontFamily: 'mono' },
                blockquote: { borderLeft: '2px solid', borderColor: 'blue.600', pl: 2, color: 'gray.400', fontStyle: 'italic' },
              }}
              dangerouslySetInnerHTML={{ __html: renderMd(m.content) }}
            />
            <Text fontSize="2xs" color="gray.700" mt={0.5}
              textAlign={m.role === 'user' ? 'right' : 'left'}>
              <TimeDisplay ts={m.timestamp} />
            </Text>
          </Box>
        ))}
        {loading && (
          <HStack spacing={2} pl={1}>
            <Spinner size="xs" color="blue.400" />
            <Text fontSize="xs" color="gray.500" fontFamily="mono">Pilot thinking…</Text>
          </HStack>
        )}
        <div ref={bottomRef} />
      </VStack>

      {/* Input */}
      <HStack
        p={2} borderTop="1px solid" borderColor="gray.700" bg="gray.900" flexShrink={0} spacing={2}
      >
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={onKey}
          placeholder="!brief 3931730  or  !digest …"
          size="sm"
          bg="gray.800"
          border="1px solid"
          borderColor="gray.600"
          color="white"
          fontFamily="mono"
          fontSize="xs"
          _placeholder={{ color: 'gray.600' }}
          _focus={{ borderColor: 'blue.500', boxShadow: 'none' }}
          _hover={{ borderColor: 'gray.500' }}
          borderRadius="md"
          flex={1}
          disabled={loading}
        />
        <IconButton
          aria-label="Send"
          icon={<Text fontSize="sm">▶</Text>}
          size="sm"
          colorScheme="blue"
          variant="solid"
          onClick={() => send(input)}
          isLoading={loading}
          borderRadius="md"
          flexShrink={0}
        />
      </HStack>
    </Flex>
  );
}
