/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box, VStack, HStack, Text, Input, Button, Badge, Spinner,
  IconButton, Divider, useToast,
} from '@chakra-ui/react';

const PM_API = '/pm-api';

const SUGGESTED_PROMPTS = [
  { label: 'Setup ticket email', icon: 'M' },
  { label: 'Upload company documentation', icon: 'D' },
  { label: 'Connect Discord', icon: 'C' },
  { label: 'Create your first SOP', icon: 'S' },
  { label: 'Import support emails', icon: 'I' },
  { label: 'Ask Signal a question', icon: '?' },
];

const INGESTION_STAGES = [
  { label: 'Connecting to mailbox...', duration: 2500 },
  { label: 'Authenticating...', duration: 2000 },
  { label: 'Retrieving messages...', duration: 6000 },
  { label: 'Parsing ticket data...', duration: 8000 },
  { label: 'Processing tickets...', duration: 12000 },
  { label: 'Finishing up...', duration: 999999 },
];

type Role = 'user' | 'signal';
type ActionStatus = 'pending' | 'confirmed' | 'failed' | 'dismissed';

interface ChatAction {
  id: string;
  type: string;
  label: string;
  payload: Record<string, unknown>;
  status: ActionStatus;
}

interface Message {
  id: string;
  role: Role;
  content: string;
  action?: ChatAction;
  timestamp: number;
}

function ActionCard({ action, onConfirm, onDismiss }: {
  action: ChatAction;
  onConfirm: () => void;
  onDismiss: () => void;
}) {
  if (action.status === "confirmed") {
    return (
      <Box mt={2} p={3} bg="green.900" borderRadius="md" border="1px solid" borderColor="green.700">
        <Text fontSize="xs" color="green.300" fontFamily="mono">✓ ACTION APPLIED</Text>
      </Box>
    );
  }
  if (action.status === "failed") {
    return (
      <Box mt={2} p={3} bg="red.900" borderRadius="md" border="1px solid" borderColor="red.700">
        <Text fontSize="xs" color="red.300" fontFamily="mono">✗ ACTION FAILED — see message above</Text>
        <Button mt={2} size="xs" variant="outline" colorScheme="red" fontFamily="mono" onClick={onDismiss}>
          DISMISS
        </Button>
      </Box>
    );
  }
  if (action.status === "dismissed") {
    return (
      <Box mt={2} p={3} bg="gray.800" borderRadius="md">
        <Text fontSize="xs" color="gray.500" fontFamily="mono">Dismissed.</Text>
      </Box>
    );
  }
  // Microsoft OAuth — show branded button instead of generic CONFIRM
  if (action.type === 'connect_microsoft_oauth') {
    return (
      <Box mt={3} p={4} bg="gray.800" borderRadius="lg" border="1px solid" borderColor="blue.600">
        <Text fontSize="xs" color="blue.400" fontFamily="mono" letterSpacing="wider" mb={2}>MICROSOFT OAUTH REQUIRED</Text>
        <Text fontSize="sm" color="gray.300" fontFamily="mono" mb={4}>
          Microsoft has disabled Basic Auth for M365 accounts. Click below to authorize Signal via OAuth — no password needed.
        </Text>
        <HStack spacing={3}>
          <Button
            size="sm"
            bg="#2f7de0"
            color="white"
            fontFamily="mono"
            _hover={{ bg: "#1a6cc7" }}
            leftIcon={<Text fontSize="xs">⊞</Text>}
            onClick={onConfirm}
          >
            Connect with Microsoft →
          </Button>
          <Button size="sm" variant="ghost" color="gray.500" fontFamily="mono" onClick={onDismiss}>Cancel</Button>
        </HStack>
      </Box>
    );
  }
  return (
    <Box mt={3} p={4} bg="gray.800" borderRadius="lg" border="1px solid" borderColor="blue.800">
      <Text fontSize="xs" color="blue.400" fontFamily="mono" letterSpacing="wider" mb={2}>PROPOSED ACTION</Text>
      <Text fontSize="sm" color="white" fontFamily="mono" mb={3}>{action.label}</Text>
      <HStack spacing={3}>
        <Button size="sm" colorScheme="blue" fontFamily="mono" onClick={onConfirm}>CONFIRM</Button>
        <Button size="sm" variant="ghost" color="gray.500" fontFamily="mono" onClick={onDismiss}>EDIT / CANCEL</Button>
      </HStack>
    </Box>
  );
}

function MessageBubble({ msg, onConfirm, onDismiss }: {
  msg: Message;
  onConfirm: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  const isUser = msg.role === "user";
  return (
    <Box display="flex" justifyContent={isUser ? "flex-end" : "flex-start"} mb={3}>
      <Box maxW="80%">
        {!isUser && (
          <Text fontSize="9px" color="blue.500" fontFamily="mono" letterSpacing="wider" mb={1}>SIGNAL AI</Text>
        )}
        <Box
          px={4} py={3} borderRadius="xl"
          bg={isUser ? "blue.600" : "gray.800"}
          border="1px solid" borderColor={isUser ? "blue.500" : "gray.700"}>
          <Text fontSize="sm" color="white" fontFamily="mono" whiteSpace="pre-wrap">{msg.content}</Text>
        </Box>
        {msg.action && (
          <ActionCard
            action={msg.action}
            onConfirm={() => onConfirm(msg.id)}
            onDismiss={() => onDismiss(msg.id)}
          />
        )}
      </Box>
    </Box>
  );
}

export default function SignalAIConsole() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [ingestionStage, setIngestionStage] = useState<string | null>(null);
  const ingestionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  useEffect(() => {
    // Opening greeting
    const msgs: Message[] = [{
      id: "welcome",
      role: "signal",
      content: "Welcome to Signal.\n\nI can help you configure your workspace, set up email monitoring, upload documentation, create SOPs, and more.\n\nWhat would you like to do first?",
      timestamp: Date.now(),
    }];

    // Check URL params for OAuth callback results
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('ms_connected') === '1') {
        msgs.push({
          id: 'ms_connected',
          role: 'signal',
          content: '✅ Microsoft mailbox connected successfully.\n\nSignal will start monitoring your inbox on the next ingestion cycle. You can trigger ingestion now by saying "run ingestion".',
          timestamp: Date.now() + 1,
        });
        // Clean up URL param without navigation
        const url = new URL(window.location.href);
        url.searchParams.delete('ms_connected');
        window.history.replaceState({}, '', url.toString());
      } else if (params.get('ms_error')) {
        const errMsg = decodeURIComponent(params.get('ms_error') || 'unknown_error');
        msgs.push({
          id: 'ms_error',
          role: 'signal',
          content: `⚠️ Microsoft authorization failed: ${errMsg}\n\nPlease try again or check your Azure app registration. Say "connect Microsoft" to retry.`,
          timestamp: Date.now() + 1,
        });
        const url = new URL(window.location.href);
        url.searchParams.delete('ms_error');
        window.history.replaceState({}, '', url.toString());
      }
    }
    setMessages(msgs);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const history = messages.slice(-10).map(m => ({ role: m.role === "user" ? "user" : "assistant", content: m.content }));
      const r = await fetch(PM_API + "/api/signal/chat", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history }),
      });
      const d = await r.json();
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "signal",
        content: d.response || d.message || "I could not process that request.",
        action: d.action ? { ...d.action, id: (Date.now() + 1).toString(), status: "pending" } : undefined,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "signal",
        content: "I had trouble reaching the backend. Please check your connection.",
        timestamp: Date.now(),
      }]);
    } finally { setLoading(false); inputRef.current?.focus(); }
  }, [messages, loading]);

  const startIngestionProgress = useCallback(() => {
    let idx = 0;
    setIngestionStage(INGESTION_STAGES[0].label);
    const advance = () => {
      idx += 1;
      if (idx < INGESTION_STAGES.length) {
        setIngestionStage(INGESTION_STAGES[idx].label);
        ingestionTimerRef.current = setTimeout(advance, INGESTION_STAGES[idx].duration);
      }
    };
    ingestionTimerRef.current = setTimeout(advance, INGESTION_STAGES[0].duration);
  }, []);

  const stopIngestionProgress = useCallback(() => {
    if (ingestionTimerRef.current) {
      clearTimeout(ingestionTimerRef.current);
      ingestionTimerRef.current = null;
    }
    setIngestionStage(null);
  }, []);

  const confirmAction = useCallback(async (msgId: string) => {
    // Find action before any state mutation
    const msg = messages.find(m => m.id === msgId);
    if (!msg?.action) return;
    // Start visual progress for ingestion actions
    if (msg.action.type === 'run_ingestion') {
      startIngestionProgress();
    }
    try {
      const r = await fetch(PM_API + "/api/signal/action", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: msg.action.type, payload: msg.action.payload }),
      });
      const d = await r.json();
      if (d.ok === false) {
        // Mark action failed — keep visible, add error bubble
        setMessages(prev => prev.map(m =>
          m.id === msgId && m.action
            ? { ...m, action: { ...m.action, status: "failed" as ActionStatus } }
            : m
        ));
        stopIngestionProgress();
        setMessages(prev => [...prev, {
          id: Date.now().toString(), role: "signal",
          content: `⚠️ Action failed: ${d.message || "Unknown error"} ${
            d.detail && typeof d.detail === "string" ? `\n\nDetail: ${d.detail}` : ""
          }`,
          timestamp: Date.now(),
        }]);
        toast({
          title: "Action failed",
          description: d.message || "The action could not be completed.",
          status: "error", duration: 5000, isClosable: true,
        });
      } else {
        stopIngestionProgress();
        // Microsoft OAuth redirect — navigate to auth_url
        if (d.auth_url) {
          setMessages(prev => [...prev, {
            id: Date.now().toString(), role: "signal",
            content: "Redirecting you to Microsoft to authorize access...\n\nYou will be returned here after authorizing.",
            timestamp: Date.now(),
          }]);
          setMessages(prev => prev.map(m =>
            m.id === msgId && m.action
              ? { ...m, action: { ...m.action, status: "confirmed" as ActionStatus } }
              : m
          ));
          setTimeout(() => { window.location.href = d.auth_url; }, 800);
          return;
        }
        // Success — confirm and show result bubble
        setMessages(prev => prev.map(m =>
          m.id === msgId && m.action
            ? { ...m, action: { ...m.action, status: "confirmed" as ActionStatus } }
            : m
        ));
        setMessages(prev => [...prev, {
          id: Date.now().toString(), role: "signal",
          content: d.message || "Action completed successfully.",
          timestamp: Date.now(),
        }]);
      }
    } catch {
      stopIngestionProgress();
      // Network error — revert to pending so user can retry
      setMessages(prev => prev.map(m =>
        m.id === msgId && m.action
          ? { ...m, action: { ...m.action, status: "pending" as ActionStatus } }
          : m
      ));
      toast({
        title: "Network error",
        description: "Could not reach the backend. Please check your connection and try again.",
        status: "error", duration: 5000, isClosable: true,
      });
    }
  }, [messages, toast, startIngestionProgress, stopIngestionProgress]);

  const dismissAction = useCallback((msgId: string) => {
    setMessages(prev => prev.map(m =>
      m.id === msgId && m.action ? { ...m, action: { ...m.action, status: "dismissed" } } : m
    ));
  }, []);

  const handleFile = useCallback(async (file: File) => {
    const form = new FormData();
    form.append("file", file);
    setLoading(true);
    const uploadMsg: Message = {
      id: Date.now().toString(), role: "user",
      content: `Uploading: ${file.name}`, timestamp: Date.now(),
    };
    setMessages(prev => [...prev, uploadMsg]);
    try {
      const r = await fetch(PM_API + "/api/signal/upload", {
        method: "POST", credentials: "include", body: form,
      });
      const d = await r.json();
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(), role: "signal",
        content: d.message || `Processed ${file.name} and added it to your knowledge base.`,
        timestamp: Date.now(),
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(), role: "signal",
        content: "I had trouble processing that file.",
        timestamp: Date.now(),
      }]);
    } finally { setLoading(false); }
  }, []);

  const showingSuggestions = messages.length <= 1;

  return (
    <Box h="100vh" bg="gray.950" display="flex" flexDirection="column">
      {/* Header */}
      <Box px={6} py={4} borderBottom="1px solid" borderColor="gray.800">
        <HStack justify="space-between">
          <HStack spacing={3}>
            <Box w={2} h={2} bg="blue.400" borderRadius="full" />
            <Text fontSize="sm" fontWeight="bold" color="white" fontFamily="mono">SIGNAL AI</Text>
            <Badge colorScheme="blue" fontSize="8px" fontFamily="mono">ACTIVE</Badge>
          </HStack>
          <Button size="xs" variant="ghost" color="gray.600" fontFamily="mono"
            onClick={() => { window.location.href = "/pm/setup/advanced"; }}>
            ADVANCED SETTINGS
          </Button>
        </HStack>
      </Box>

      {/* Messages */}
      <Box flex="1" overflowY="auto" px={6} py={4}>
        {messages.map(msg => (
          <MessageBubble key={msg.id} msg={msg}
            onConfirm={confirmAction} onDismiss={dismissAction} />
        ))}
        {loading && (
          <Box display="flex" justifyContent="flex-start" mb={3}>
            <Box px={4} py={3} bg="gray.800" borderRadius="xl" border="1px solid" borderColor="gray.700">
              <HStack spacing={2}>
                <Spinner size="xs" color="blue.400" />
                <Text fontSize="xs" color="gray.400" fontFamily="mono">Signal is thinking...</Text>
              </HStack>
            </Box>
          </Box>
        )}
        {ingestionStage && (
          <Box display="flex" justifyContent="flex-start" mb={3}>
            <Box px={4} py={3} bg="blue.950" borderRadius="xl" border="1px solid" borderColor="blue.700"
              maxW="360px">
              <VStack spacing={2} align="start">
                <HStack spacing={2}>
                  <Spinner size="xs" color="blue.400" speed="0.8s" />
                  <Text fontSize="xs" color="blue.300" fontFamily="mono" fontWeight="bold" letterSpacing="wider">
                    INGESTING EMAIL
                  </Text>
                </HStack>
                <HStack spacing={2} pl={1}>
                  <Spinner size="xs" color="blue.500" speed="1.4s" />
                  <Text fontSize="xs" color="blue.200" fontFamily="mono">{ingestionStage}</Text>
                </HStack>
                <Text fontSize="9px" color="blue.600" fontFamily="mono" pl={1}>
                  This may take 30&#8211;90 seconds depending on mailbox size
                </Text>
              </VStack>
            </Box>
          </Box>
        )}
        <div ref={bottomRef} />
      </Box>

      {/* Suggested prompts */}
      {showingSuggestions && (
        <Box px={6} pb={2}>
          <Box overflowX="auto" py={1}>
            <HStack spacing={2} minW="max-content">
              {SUGGESTED_PROMPTS.map(p => (
                <Button key={p.label} size="xs" variant="outline"
                  borderColor="gray.700" color="gray.400" fontFamily="mono"
                  _hover={{ borderColor: "blue.500", color: "white" }}
                  onClick={() => sendMessage(p.label)}>
                  {p.label}
                </Button>
              ))}
            </HStack>
          </Box>
        </Box>
      )}

      {/* Input */}
      <Box px={6} py={4} borderTop="1px solid" borderColor="gray.800">
        <HStack spacing={3}>
          <input type="file" ref={fileRef} style={{ display: "none" }}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          <IconButton aria-label="Upload file" size="sm" variant="ghost" color="gray.500"
            icon={<Text fontSize="xs" fontFamily="mono">DOC</Text>}
            onClick={() => fileRef.current?.click()} />
          <Input
            ref={inputRef}
            bg="gray.900" borderColor="gray.700" color="white" fontFamily="mono"
            placeholder="Message Signal..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
            _placeholder={{ color: "gray.600" }}
            _focus={{ borderColor: "blue.400", boxShadow: "none" }}
          />
          <Button colorScheme="blue" fontFamily="mono" size="sm" px={6}
            isDisabled={!input.trim() || loading}
            onClick={() => sendMessage(input)}>SEND</Button>
        </HStack>
        <Text fontSize="9px" color="gray.700" fontFamily="mono" mt={2} textAlign="center">
          Signal AI may make mistakes. Confirm actions before they are applied.
        </Text>
      </Box>
    </Box>
  );
}
