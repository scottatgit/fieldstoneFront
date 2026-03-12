/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
'use client';
import {
  Box, VStack, HStack, Text, Input, Button, Flex, Badge,
  Spinner, Radio, RadioGroup,
} from '@chakra-ui/react';
import { useState, useRef, useEffect } from 'react';

const PM_API = process.env.NEXT_PUBLIC_PM_API_URL || 'http://localhost:8100';

type Step = 'inbox' | 'ai_provider' | 'ai_key' | 'confirm' | 'done';
type AIProvider = 'openrouter' | 'openai';

interface Message {
  role: 'assistant' | 'user';
  text: string;
}

const AI_DEFAULTS = {
  openrouter: { base: 'https://openrouter.ai/api/v1', fast: 'gpt-4o-mini', strong: 'gpt-4o', hint: 'sk-or-...' },
  openai:     { base: 'https://api.openai.com/v1',   fast: 'gpt-4o-mini', strong: 'gpt-4o', hint: 'sk-proj-...' },
};

export default function PlatformSetupPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: "Welcome to Signal Setup. Let's get your workspace connected.\n\nWhat inbox should we monitor for tickets? (enter your email address)" },
  ]);
  const [input, setInput]         = useState('');
  const [step, setStep]           = useState<Step>('inbox');
  const [aiProvider, setProvider] = useState<AIProvider>('openrouter');
  const [saving, setSaving]       = useState(false);
  const [config, setConfig]       = useState<Record<string, string>>({});
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMsg = (role: 'assistant' | 'user', text: string) =>
    setMessages(prev => [...prev, { role, text }]);

  const handleSend = async () => {
    const val = input.trim();
    if (!val) return;
    setInput('');
    addMsg('user', val);

    if (step === 'inbox') {
      // Detect provider from MX / domain pattern
      const domain = val.split('@')[1]?.toLowerCase() || '';
      let provider = 'generic';
      let imapHost = '';
      let smtpHost = '';
      if (domain.includes('gmail') || domain.includes('googlemail')) {
        provider = 'Gmail'; imapHost = 'imap.gmail.com'; smtpHost = 'smtp.gmail.com';
      } else if (domain.includes('outlook') || domain.includes('hotmail') || domain.includes('microsoft') || domain.includes('office365')) {
        provider = 'Microsoft 365'; imapHost = 'outlook.office365.com'; smtpHost = 'smtp.office365.com';
      }
      setConfig(c => ({ ...c, IMAP_USER: val, SMTP_USER: val,
        ...(imapHost ? { IMAP_HOST: imapHost, SMTP_HOST: smtpHost, SMTP_PORT: '587' } : {}) }));

      const providerText = imapHost
        ? `Detected **${provider}** from your domain. IMAP set to \`${imapHost}\`.`
        : `I\'ll need your IMAP server details — you can add those in the full setup later.`;

      setTimeout(() => addMsg('assistant',
        `${providerText}\n\nNow choose your AI provider:\n\n○ OpenRouter (recommended — one key, 100+ models)\n○ OpenAI (direct access)`
      ), 400);
      setStep('ai_provider');
      return;
    }

    if (step === 'ai_key') {
      const cfg = AI_DEFAULTS[aiProvider];
      setConfig(c => ({
        ...c,
        OPENAI_API_KEY:   val,
        OPENAI_API_BASE:  cfg.base,
        MODEL_PROVIDER:   'openai',
        AI_FAST_MODEL:    cfg.fast,
        AI_STRONG_MODEL:  cfg.strong,
      }));
      setTimeout(() => addMsg('assistant',
        `Got it. Here\'s your configuration:\n\n` +
        `• Inbox: ${config.IMAP_USER}\n` +
        `• AI: ${aiProvider === 'openrouter' ? 'OpenRouter' : 'OpenAI'}\n` +
        `• Fast model: ${cfg.fast}\n` +
        `• Strong model: ${cfg.strong}\n\n` +
        `Type **confirm** to save, or **cancel** to start over.`
      ), 400);
      setStep('confirm');
      return;
    }

    if (step === 'confirm') {
      if (val.toLowerCase() === 'confirm') {
        setSaving(true);
        try {
          const res = await fetch(`${PM_API}/api/settings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ settings: config }),
          });
          const data = await res.json();
          if (data.status === 'ok') {
            addMsg('assistant', '✅ Configuration saved. Signal is ready.\n\nHead to your workspace to run the first ticket scan.');
            setStep('done');
          } else {
            addMsg('assistant', `❌ Save failed: ${data.message}. Try again or use the manual setup.`);
          }
        } catch (e) {
          addMsg('assistant', `❌ Could not reach server: ${String(e)}`);
        } finally { setSaving(false); }
      } else {
        addMsg('assistant', 'Setup cancelled. Type your inbox address to start again.');
        setStep('inbox');
        setConfig({});
      }
      return;
    }
  };

  const handleProviderSelect = (p: AIProvider) => {
    setProvider(p);
    const label = p === 'openrouter' ? 'OpenRouter' : 'OpenAI';
    const hint  = AI_DEFAULTS[p].hint;
    addMsg('user', label);
    setTimeout(() => addMsg('assistant',
      `${label} selected.\n\nEnter your ${label} API key:\n(starts with ${hint})`
    ), 300);
    setStep('ai_key');
  };

  return (
    <Box h="calc(100dvh - 44px)" display="flex" flexDirection="column" maxW="760px" mx="auto" px={4}>
      {/* Header */}
      <Box py={4} borderBottom="1px solid" borderColor="gray.800" flexShrink={0}>
        <HStack justify="space-between">
          <VStack spacing={0} align="start">
            <Text fontSize="lg" fontWeight="black" color="white" fontFamily="mono" letterSpacing="wider">
              SIGNAL SETUP
            </Text>
            <Text fontSize="xs" color="gray.500" fontFamily="mono">AI-guided workspace activation</Text>
          </VStack>
          <Badge colorScheme="orange" fontSize="xs" fontFamily="mono">
            {step === 'done' ? '✓ COMPLETE' : 'IN PROGRESS'}
          </Badge>
        </HStack>
      </Box>

      {/* Chat log */}
      <Box flex={1} overflowY="auto" py={4} display="flex" flexDirection="column" gap={3}
        css={{ '&::-webkit-scrollbar': { width: '4px' }, '&::-webkit-scrollbar-thumb': { background: '#2D3748' } }}>
        {messages.map((msg, i) => (
          <Flex key={i} justify={msg.role === 'user' ? 'flex-end' : 'flex-start'}>
            <Box
              maxW="85%" px={4} py={3} borderRadius="lg"
              bg={msg.role === 'user' ? 'blue.800' : 'gray.800'}
              border="1px solid"
              borderColor={msg.role === 'user' ? 'blue.600' : 'gray.700'}
            >
              <Text fontSize="sm" color="white" fontFamily="mono" whiteSpace="pre-wrap">
                {msg.text}
              </Text>
            </Box>
          </Flex>
        ))}

        {/* AI provider selector */}
        {step === 'ai_provider' && (
          <Flex justify="flex-start">
            <Box p={4} bg="gray.800" borderRadius="lg" border="1px solid" borderColor="gray.700">
              <RadioGroup onChange={v => handleProviderSelect(v as AIProvider)} value={aiProvider}>
                <VStack spacing={2} align="start">
                  {([
                    { val: 'openrouter', label: 'OpenRouter', sub: 'Recommended — one key, all models' },
                    { val: 'openai',     label: 'OpenAI',     sub: 'Direct API access' },
                  ] as { val: AIProvider; label: string; sub: string }[]).map(opt => (
                    <Box key={opt.val} p={3} w="280px" borderRadius="md" border="1px solid"
                      borderColor="gray.700" cursor="pointer"
                      _hover={{ borderColor: 'orange.500' }}
                      onClick={() => handleProviderSelect(opt.val)}>
                      <HStack>
                        <Radio value={opt.val} colorScheme="orange" size="sm" />
                        <VStack spacing={0} align="start">
                          <Text fontSize="sm" fontWeight="bold" color="white" fontFamily="mono">
                            {opt.label}
                          </Text>
                          <Text fontSize="xs" color="gray.500">{opt.sub}</Text>
                        </VStack>
                      </HStack>
                    </Box>
                  ))}
                </VStack>
              </RadioGroup>
            </Box>
          </Flex>
        )}

        <div ref={bottomRef} />
      </Box>

      {/* Input */}
      {step !== 'done' && step !== 'ai_provider' && (
        <Box py={3} borderTop="1px solid" borderColor="gray.800" flexShrink={0}>
          <HStack>
            <Input
              bg="gray.800" borderColor="gray.700" color="white"
              fontFamily="mono" fontSize="sm"
              placeholder={
                step === 'inbox' ? 'support@yourcompany.com' :
                step === 'ai_key' ? 'Paste your API key...' :
                step === 'confirm' ? 'Type confirm or cancel' : ''
              }
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
              type={step === 'ai_key' ? 'password' : 'text'}
              _focus={{ borderColor: 'orange.500', boxShadow: 'none' }}
              _placeholder={{ color: 'gray.600' }}
            />
            <Button colorScheme="orange" onClick={handleSend}
              isLoading={saving} fontFamily="mono" fontSize="sm" px={6}>
              →
            </Button>
          </HStack>
        </Box>
      )}

      {step === 'done' && (
        <Box py={3} borderTop="1px solid" borderColor="gray.800" flexShrink={0}>
          <Button w="full" colorScheme="orange" variant="outline"
            fontFamily="mono" as="a" href="https://signal.fieldstone.pro">
            OPEN WORKSPACE →
          </Button>
        </Box>
      )}
    </Box>
  );
}
