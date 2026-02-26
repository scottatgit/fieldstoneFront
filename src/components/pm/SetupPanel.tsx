'use client';
import {
  Box, VStack, HStack, Text, Input, Button, Badge,
  Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon,
  FormControl, FormLabel, FormHelperText,
  InputGroup, InputRightElement, IconButton,
  Divider, Spinner, Flex, Select, Switch,
  useToast,
} from '@chakra-ui/react';
import { useState, useEffect, useCallback } from 'react';

const PM_API = process.env.NEXT_PUBLIC_PM_API_URL || 'http://localhost:8100';

// ─── Types ───────────────────────────────────────────────────────────────────
interface SettingsMap { [key: string]: string; }
interface TestResult { status: 'ok' | 'error' | 'idle' | 'loading'; message: string; }

// ─── Field definitions ───────────────────────────────────────────────────────
type FieldDef = {
  key: string;
  label: string;
  helper?: string;
  secret?: boolean;
  type?: 'text' | 'select' | 'toggle';
  options?: string[];
  placeholder?: string;
};

const SECTIONS: { title: string; icon: string; fields: FieldDef[] }[] = [
  {
    title: 'Email / IMAP',
    icon: '📧',
    fields: [
      { key: 'GMAIL_ADDRESS',      label: 'Gmail Address',       placeholder: 'you@gmail.com' },
      { key: 'GMAIL_APP_PASSWORD', label: 'Gmail App Password',  secret: true, placeholder: 'xxxx xxxx xxxx xxxx' },
      { key: 'SMTP_USER',          label: 'SMTP Username',       placeholder: 'you@gmail.com' },
      { key: 'SMTP_PASS',          label: 'SMTP Password',       secret: true },
      { key: 'SMTP_HOST',          label: 'SMTP Host',           placeholder: 'smtp.gmail.com' },
      { key: 'SMTP_PORT',          label: 'SMTP Port',           placeholder: '587' },
      { key: 'IMAP_HOST',          label: 'IMAP Host',           placeholder: 'imap.gmail.com' },
      { key: 'IMAP_USER',          label: 'IMAP Username',       placeholder: 'you@gmail.com' },
      { key: 'IMAP_PASS',          label: 'IMAP Password',       secret: true },
    ],
  },
  {
    title: 'AI Configuration',
    icon: '🤖',
    fields: [
      {
        key: 'MODEL_PROVIDER', label: 'Provider',
        type: 'select', options: ['openai', 'anthropic'],
        helper: 'openai = OpenAI-compatible (includes Ollama)',
      },
      { key: 'OPENAI_API_BASE',  label: 'API Base URL',      placeholder: 'http://192.168.1.225:11434/v1', helper: 'Ollama or OpenAI endpoint' },
      { key: 'OPENAI_API_KEY',   label: 'API Key',           secret: true, placeholder: 'ollama / sk-...' },
      { key: 'MODEL_NAME',       label: 'Default Model',     placeholder: 'deepseek-coder:6.7b-instruct-q4_K_M' },
      { key: 'AI_FAST_MODEL',    label: 'Fast Model',        placeholder: 'For summaries & classification', helper: 'Quick, low-cost tasks' },
      { key: 'AI_STRONG_MODEL',  label: 'Strong Model',      placeholder: 'For signal analysis & drafts', helper: 'Complex reasoning tasks' },
      { key: 'ANTHROPIC_API_KEY',label: 'Anthropic API Key', secret: true, placeholder: 'sk-ant-...', helper: 'Only needed if using Anthropic' },
      { key: 'AI_BUDGET_DAILY_USD', label: 'Daily Budget (USD)', placeholder: '0.0', helper: '0 = unlimited (free/local)' },
      { key: 'AI_CACHE_TTL_HOURS',  label: 'Cache TTL (hours)',  placeholder: '24' },
      { key: 'AI_CACHE_ENABLED',    label: 'Cache Enabled',      placeholder: 'true' },
      { key: 'AI_TIMEOUT_SECS',     label: 'Timeout (seconds)',  placeholder: '60' },
      { key: 'AI_FALLBACK_URL',     label: 'Fallback URL',       placeholder: 'https://api.openai.com/v1', helper: 'Optional backup provider' },
      { key: 'AI_FALLBACK_KEY',     label: 'Fallback API Key',   secret: true },
      { key: 'AI_FALLBACK_MODEL',   label: 'Fallback Model',     placeholder: 'gpt-4o-mini' },
    ],
  },
  {
    title: 'Agent Zero',
    icon: '🔗',
    fields: [
      { key: 'AGENT_ZERO_URL',     label: 'Agent Zero URL',     placeholder: 'http://localhost' },
      { key: 'AGENT_ZERO_API_KEY', label: 'Agent Zero API Key', secret: true },
    ],
  },
  {
    title: 'Discord',
    icon: '🎮',
    fields: [
      { key: 'DISCORD_BOT_TOKEN', label: 'Bot Token', secret: true, placeholder: 'MTQ...', helper: 'From Discord Developer Portal' },
    ],
  },
  {
    title: 'GitHub',
    icon: '🐙',
    fields: [
      { key: 'GITHUB_TOKEN', label: 'Personal Access Token', secret: true, placeholder: 'github_pat_...', helper: 'Required for repo sync' },
    ],
  },
];

// ─── Single field row ─────────────────────────────────────────────────────────
function SettingField({
  field, value, onChange
}: {
  field: FieldDef;
  value: string;
  onChange: (key: string, val: string) => void;
}) {
  const [show, setShow] = useState(false);
  const isSecret = field.secret;
  const isMasked = value.includes('••');

  return (
    <FormControl>
      <FormLabel
        fontSize="xs" fontFamily="mono" color="gray.400"
        textTransform="uppercase" letterSpacing="wider" mb={1}
      >
        {field.label}
      </FormLabel>
      {field.type === 'select' ? (
        <Select
          size="sm" bg="gray.800" borderColor="gray.600" color="white"
          value={value}
          onChange={e => onChange(field.key, e.target.value)}
          _hover={{ borderColor: 'blue.400' }}
          _focus={{ borderColor: 'blue.400', boxShadow: 'none' }}
        >
          {(field.options || []).map(o => (
            <option key={o} value={o} style={{ background: '#1a202c' }}>{o}</option>
          ))}
        </Select>
      ) : (
        <InputGroup size="sm">
          <Input
            bg="gray.800" borderColor="gray.600" color="white"
            fontFamily={isSecret ? 'mono' : undefined}
            type={isSecret && !show ? 'password' : 'text'}
            value={value}
            placeholder={isMasked ? '(unchanged — leave to keep current)' : (field.placeholder || '')}
            onChange={e => onChange(field.key, e.target.value)}
            onFocus={() => { if (isMasked) onChange(field.key, ''); }}
            _hover={{ borderColor: 'blue.500' }}
            _focus={{ borderColor: 'blue.400', boxShadow: 'none' }}
            _placeholder={{ color: 'gray.600' }}
          />
          {isSecret && (
            <InputRightElement>
              <IconButton
                aria-label="toggle visibility"
                size="xs" variant="ghost" color="gray.500"
                onClick={() => setShow(s => !s)}
                icon={<Text fontSize="10px">{show ? '🙈' : '👁'}</Text>}
              />
            </InputRightElement>
          )}
        </InputGroup>
      )}
      {field.helper && (
        <FormHelperText fontSize="10px" color="gray.600" mt={1}>
          {field.helper}
        </FormHelperText>
      )}
    </FormControl>
  );
}

// ─── Test result badge ────────────────────────────────────────────────────────
function TestBadge({ result }: { result: TestResult }) {
  if (result.status === 'idle') return null;
  if (result.status === 'loading') return <Spinner size="xs" color="blue.400" />;
  return (
    <Box
      mt={2} p={2} borderRadius="md" fontSize="xs" fontFamily="mono"
      bg={result.status === 'ok' ? 'green.900' : 'red.900'}
      borderWidth={1} borderColor={result.status === 'ok' ? 'green.600' : 'red.600'}
      color={result.status === 'ok' ? 'green.300' : 'red.300'}
    >
      {result.message}
    </Box>
  );
}

// ─── Main SetupPanel ──────────────────────────────────────────────────────────
export function SetupPanel() {
  const toast   = useToast();
  const [settings, setSettings] = useState<SettingsMap>({});
  const [loading, setLoading]   = useState(true);
  const [saving,  setSaving]    = useState(false);
  const [aiTest,  setAiTest]    = useState<TestResult>({ status: 'idle', message: '' });
  const [emailTest, setEmailTest] = useState<TestResult>({ status: 'idle', message: '' });
  const [aiUsage, setAiUsage]   = useState<any>(null);

  // Load settings
  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${PM_API}/api/settings`);
      const data = await res.json();
      setSettings(data.settings || {});
    } catch (e) {
      toast({ title: 'Failed to load settings', status: 'error', duration: 3000 });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Load AI usage
  const loadAiUsage = useCallback(async () => {
    try {
      const res = await fetch(`${PM_API}/api/settings/ai/usage`);
      const data = await res.json();
      setAiUsage(data);
    } catch {}
  }, []);

  useEffect(() => { loadSettings(); loadAiUsage(); }, [loadSettings, loadAiUsage]);

  const handleChange = (key: string, val: string) => {
    setSettings(prev => ({ ...prev, [key]: val }));
  };

  // Save
  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${PM_API}/api/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });
      const data = await res.json();
      toast({
        title: data.status === 'ok' ? '✅ Settings saved' : '❌ Save failed',
        description: data.message,
        status: data.status === 'ok' ? 'success' : 'error',
        duration: 4000,
      });
      if (data.status === 'ok') loadSettings();
    } catch (e) {
      toast({ title: 'Save failed', description: String(e), status: 'error', duration: 4000 });
    } finally {
      setSaving(false);
    }
  };

  // Test AI
  const handleTestAI = async () => {
    setAiTest({ status: 'loading', message: '' });
    try {
      const res = await fetch(`${PM_API}/api/settings/test/ai`, { method: 'POST' });
      const data = await res.json();
      setAiTest({ status: data.status, message: data.message });
      loadAiUsage();
    } catch (e) {
      setAiTest({ status: 'error', message: String(e) });
    }
  };

  // Test Email
  const handleTestEmail = async () => {
    setEmailTest({ status: 'loading', message: '' });
    try {
      const res = await fetch(`${PM_API}/api/settings/test/email`, { method: 'POST' });
      const data = await res.json();
      setEmailTest({ status: data.status, message: data.message });
    } catch (e) {
      setEmailTest({ status: 'error', message: String(e) });
    }
  };

  if (loading) return (
    <Flex h="full" align="center" justify="center">
      <Spinner color="blue.400" size="xl" />
    </Flex>
  );

  return (
    <VStack spacing={0} align="stretch" h="full" overflow="hidden">

      {/* Header */}
      <Flex
        px={6} py={4} bg="gray.900"
        borderBottom="1px solid" borderColor="gray.700"
        align="center" justify="space-between" flexShrink={0}
      >
        <VStack align="start" spacing={0}>
          <Text fontSize="lg" fontWeight="black" color="white" fontFamily="mono" letterSpacing="wider">
            ⚙️ SETUP
          </Text>
          <Text fontSize="xs" color="gray.500" fontFamily="mono">
            Configure SecondBrain connections & AI
          </Text>
        </VStack>
        <HStack spacing={3}>
          {aiUsage && (
            <VStack spacing={0} align="end">
              <Text fontSize="xs" color="gray.400" fontFamily="mono">
                AI Today: {aiUsage.total_tokens || 0} tokens
              </Text>
              <Text fontSize="10px" color="gray.600" fontFamily="mono">
                ${(aiUsage.total_cost || 0).toFixed(4)} / ${aiUsage.budget_usd || 0} budget
              </Text>
            </VStack>
          )}
          <Button
            size="sm" colorScheme="blue" onClick={handleSave}
            isLoading={saving} loadingText="Saving..."
            fontFamily="mono" letterSpacing="wider" fontSize="xs"
          >
            SAVE ALL
          </Button>
        </HStack>
      </Flex>

      {/* Scrollable body */}
      <Box flex={1} overflowY="auto" p={4}
        css={{ '&::-webkit-scrollbar': { width: '4px' }, '&::-webkit-scrollbar-thumb': { background: '#2D3748' } }}
      >
        <Accordion allowMultiple defaultIndex={[0, 1]} borderColor="gray.700">

          {SECTIONS.map(section => (
            <AccordionItem key={section.title} border="1px solid" borderColor="gray.700"
              borderRadius="md" mb={3} overflow="hidden"
            >
              <AccordionButton
                bg="gray.850" px={4} py={3}
                _hover={{ bg: 'gray.800' }}
                _expanded={{ bg: 'gray.800', borderBottom: '1px solid', borderColor: 'gray.700' }}
              >
                <HStack flex={1} spacing={2}>
                  <Text fontSize="sm">{section.icon}</Text>
                  <Text fontSize="sm" fontWeight="bold" color="white" fontFamily="mono"
                    letterSpacing="wider" textTransform="uppercase"
                  >
                    {section.title}
                  </Text>
                </HStack>
                <AccordionIcon color="gray.400" />
              </AccordionButton>

              <AccordionPanel bg="gray.900" p={4}>
                <VStack spacing={4} align="stretch">
                  {section.fields.map(field => (
                    <SettingField
                      key={field.key}
                      field={field}
                      value={settings[field.key] || ''}
                      onChange={handleChange}
                    />
                  ))}

                  {/* Test buttons per section */}
                  {section.title === 'AI Configuration' && (
                    <Box>
                      <Divider borderColor="gray.700" mb={3} />
                      <HStack spacing={3}>
                        <Button
                          size="sm" variant="outline" colorScheme="blue"
                          onClick={handleTestAI}
                          isLoading={aiTest.status === 'loading'}
                          fontFamily="mono" fontSize="xs" letterSpacing="wider"
                        >
                          🧪 TEST AI CONNECTION
                        </Button>
                        <Text fontSize="xs" color="gray.600">
                          Sends a test prompt to verify the endpoint
                        </Text>
                      </HStack>
                      <TestBadge result={aiTest} />
                    </Box>
                  )}

                  {section.title === 'Email / IMAP' && (
                    <Box>
                      <Divider borderColor="gray.700" mb={3} />
                      <HStack spacing={3}>
                        <Button
                          size="sm" variant="outline" colorScheme="green"
                          onClick={handleTestEmail}
                          isLoading={emailTest.status === 'loading'}
                          fontFamily="mono" fontSize="xs" letterSpacing="wider"
                        >
                          🔌 TEST EMAIL CONNECTION
                        </Button>
                        <Text fontSize="xs" color="gray.600">
                          Verifies IMAP login
                        </Text>
                      </HStack>
                      <TestBadge result={emailTest} />
                    </Box>
                  )}
                </VStack>
              </AccordionPanel>
            </AccordionItem>
          ))}

        </Accordion>

        {/* AI Usage Card */}
        {aiUsage && aiUsage.entries?.length > 0 && (
          <Box mt={4} p={4} bg="gray.800" borderRadius="md"
            border="1px solid" borderColor="gray.700"
          >
            <Text fontSize="xs" fontFamily="mono" color="gray.400"
              textTransform="uppercase" letterSpacing="wider" mb={3}
            >
              📊 AI Usage Today
            </Text>
            <VStack spacing={2} align="stretch">
              {aiUsage.entries.map((e: any, i: number) => (
                <HStack key={i} justify="space-between">
                  <Text fontSize="xs" color="white" fontFamily="mono">{e.model}</Text>
                  <HStack spacing={4}>
                    <Badge colorScheme="blue" fontSize="10px">{e.task_type}</Badge>
                    <Text fontSize="xs" color="gray.400">{e.calls} calls</Text>
                    <Text fontSize="xs" color="gray.400">{e.tokens} tokens</Text>
                    <Text fontSize="xs" color="green.400">${e.cost.toFixed(4)}</Text>
                  </HStack>
                </HStack>
              ))}
              <Divider borderColor="gray.700" />
              <HStack justify="space-between">
                <Text fontSize="xs" color="gray.500" fontFamily="mono">TOTAL</Text>
                <HStack spacing={4}>
                  <Text fontSize="xs" color="white" fontWeight="bold">{aiUsage.total_tokens} tokens</Text>
                  <Text fontSize="xs" color="green.300" fontWeight="bold">${aiUsage.total_cost.toFixed(4)}</Text>
                </HStack>
              </HStack>
            </VStack>
          </Box>
        )}

        {/* Save button at bottom */}
        <Box mt={4} pb={4}>
          <Button
            w="full" colorScheme="blue" onClick={handleSave}
            isLoading={saving} loadingText="Saving..."
            fontFamily="mono" letterSpacing="wider"
          >
            💾 SAVE ALL SETTINGS
          </Button>
        </Box>
      </Box>
    </VStack>
  );
}
