'use client';
import {
  Box, VStack, HStack, Text, Input, Button, Badge,
  Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon,
  FormControl, FormLabel, FormHelperText,
  InputGroup, InputRightElement, IconButton,
  Divider, Spinner, Flex, Radio, RadioGroup,
  Collapse, useToast, Progress,
} from '@chakra-ui/react';
import { useState, useEffect, useCallback } from 'react';

const PM_API = process.env.NEXT_PUBLIC_PM_API_URL || 'http://localhost:8100';

// ─── Types ────────────────────────────────────────────────────────────────────
interface SettingsMap { [key: string]: string; }
interface TestResult { status: 'ok' | 'error' | 'idle' | 'loading'; message: string; }
interface SetupStatus {
  organization: boolean;
  imap_connected: boolean;
  ai_configured: boolean;
  first_ingestion_complete: boolean;
}
interface IngestResult {
  running: boolean;
  emailsFound?: number;
  ticketsImported?: number;
  aiAnalyzed?: number;
  error?: string;
  done?: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function SecretInput({ value, placeholder, onChange }: {
  value: string; placeholder?: string;
  onChange: (v: string) => void;
}) {
  const [show, setShow] = useState(false);
  const masked = value.includes('••');
  return (
    <InputGroup size="sm">
      <Input
        bg="gray.800" borderColor="gray.600" color="white" fontFamily="mono"
        type={show ? 'text' : 'password'}
        value={value}
        placeholder={masked ? '(unchanged — leave blank to keep)' : (placeholder || '')}
        onChange={e => onChange(e.target.value)}
        onFocus={() => { if (masked) onChange(''); }}
        _hover={{ borderColor: 'blue.500' }} _focus={{ borderColor: 'blue.400', boxShadow: 'none' }}
        _placeholder={{ color: 'gray.600' }}
      />
      <InputRightElement>
        <IconButton aria-label="toggle" size="xs" variant="ghost" color="gray.500"
          onClick={() => setShow(s => !s)}
          icon={<Text fontSize="10px">{show ? '🙈' : '👁'}</Text>}
        />
      </InputRightElement>
    </InputGroup>
  );
}

function PlainInput({ value, placeholder, onChange }: {
  value: string; placeholder?: string; onChange: (v: string) => void;
}) {
  return (
    <Input size="sm" bg="gray.800" borderColor="gray.600" color="white"
      value={value} placeholder={placeholder || ''}
      onChange={e => onChange(e.target.value)}
      _hover={{ borderColor: 'blue.500' }} _focus={{ borderColor: 'blue.400', boxShadow: 'none' }}
      _placeholder={{ color: 'gray.600' }}
    />
  );
}

function FieldRow({ label, helper, children }: {
  label: string; helper?: string; children: React.ReactNode;
}) {
  return (
    <FormControl>
      <FormLabel fontSize="xs" fontFamily="mono" color="gray.400"
        textTransform="uppercase" letterSpacing="wider" mb={1}>
        {label}
      </FormLabel>
      {children}
      {helper && <FormHelperText fontSize="10px" color="gray.600" mt={1}>{helper}</FormHelperText>}
    </FormControl>
  );
}

function TestBadge({ result }: { result: TestResult }) {
  if (result.status === 'idle') return null;
  if (result.status === 'loading') return <Spinner size="xs" color="blue.400" />;
  return (
    <Box mt={2} p={2} borderRadius="md" fontSize="xs" fontFamily="mono"
      bg={result.status === 'ok' ? 'green.900' : 'red.900'}
      borderWidth={1} borderColor={result.status === 'ok' ? 'green.600' : 'red.600'}
      color={result.status === 'ok' ? 'green.300' : 'red.300'}>
      {result.message}
    </Box>
  );
}

// ─── Activation Status ────────────────────────────────────────────────────────
function ActivationStatus({ status, loading }: { status: SetupStatus | null; loading: boolean }) {
  const steps: { key: keyof SetupStatus; label: string; hint: string }[] = [
    { key: 'organization',             label: 'Organization created',   hint: '' },
    { key: 'imap_connected',           label: 'Ticket inbox connected', hint: 'Connect below' },
    { key: 'first_ingestion_complete', label: 'First ingestion run',    hint: 'Run scan below' },
    { key: 'ai_configured',            label: 'AI configured',          hint: 'Enable AI below' },
  ];
  const completed = status ? steps.filter(s => status[s.key]).length : 0;
  const pct = Math.round((completed / steps.length) * 100);
  return (
    <Box p={4} bg="gray.800" borderRadius="md" border="1px solid"
      borderColor={pct === 100 ? 'green.600' : 'blue.800'}>
      <HStack justify="space-between" mb={3}>
        <Text fontSize="xs" fontFamily="mono" color="blue.300"
          textTransform="uppercase" letterSpacing="wider" fontWeight="bold">
          ⚡ Signal Activation
        </Text>
        {loading ? <Spinner size="xs" color="blue.400" /> : (
          <Badge colorScheme={pct === 100 ? 'green' : 'blue'} fontSize="10px" fontFamily="mono">
            {completed}/{steps.length} COMPLETE
          </Badge>
        )}
      </HStack>
      <Box bg="gray.700" borderRadius="full" h="4px" mb={3}>
        <Box bg={pct === 100 ? 'green.400' : 'blue.400'} borderRadius="full"
          h="4px" w={`${pct}%`} transition="width 0.5s ease" />
      </Box>
      <VStack spacing={1} align="stretch">
        {steps.map(step => (
          <HStack key={step.key} spacing={2}>
            <Text fontSize="sm" color={status?.[step.key] ? 'green.400' : 'gray.600'}>
              {status?.[step.key] ? '✓' : '○'}
            </Text>
            <Text fontSize="xs" fontFamily="mono" color={status?.[step.key] ? 'white' : 'gray.500'}>
              {step.label}
            </Text>
            {!status?.[step.key] && step.hint && (
              <Text fontSize="10px" color="blue.600" fontFamily="mono">← {step.hint}</Text>
            )}
          </HStack>
        ))}
      </VStack>
    </Box>
  );
}

// ─── Step 1: Connect Inbox ────────────────────────────────────────────────────
type EmailProvider = 'gmail' | 'microsoft365' | 'imap';

function ConnectInbox({ settings, onChange, onTest, testResult }: {
  settings: SettingsMap;
  onChange: (k: string, v: string) => void;
  onTest: () => void;
  testResult: TestResult;
}) {
  const [provider, setProvider] = useState<EmailProvider>(() => {
    const host = settings['IMAP_HOST'] || '';
    if (host.includes('gmail')) return 'gmail';
    if (host.includes('outlook') || host.includes('office365')) return 'microsoft365';
    if (host) return 'imap';
    return 'gmail';
  });

  const handleProvider = (p: EmailProvider) => {
    setProvider(p);
    if (p === 'gmail') {
      onChange('IMAP_HOST', 'imap.gmail.com');
      onChange('SMTP_HOST', 'smtp.gmail.com');
      onChange('SMTP_PORT', '587');
    } else if (p === 'microsoft365') {
      onChange('IMAP_HOST', 'outlook.office365.com');
      onChange('SMTP_HOST', 'smtp.office365.com');
      onChange('SMTP_PORT', '587');
    }
  };

  return (
    <VStack spacing={4} align="stretch">
      <Text fontSize="xs" color="gray.400" fontFamily="mono">Choose your ticket inbox provider:</Text>
      <RadioGroup value={provider} onChange={v => handleProvider(v as EmailProvider)}>
        <VStack spacing={2} align="stretch">
          {([
            { val: 'gmail',         label: 'Gmail',           sub: 'Google Workspace or personal Gmail' },
            { val: 'microsoft365',  label: 'Microsoft 365',   sub: 'Outlook / Exchange Online' },
            { val: 'imap',          label: 'Generic IMAP',    sub: 'Any mail server — enter details manually' },
          ] as { val: EmailProvider; label: string; sub: string }[]).map(opt => (
            <Box key={opt.val} p={3} borderRadius="md" border="1px solid"
              borderColor={provider === opt.val ? 'blue.500' : 'gray.700'}
              bg={provider === opt.val ? 'blue.950' : 'gray.850'}
              cursor="pointer" onClick={() => handleProvider(opt.val)}
            >
              <HStack spacing={3}>
                <Radio value={opt.val} colorScheme="blue" size="sm" />
                <VStack spacing={0} align="start">
                  <Text fontSize="sm" fontWeight="bold" color="white" fontFamily="mono">{opt.label}</Text>
                  <Text fontSize="xs" color="gray.500">{opt.sub}</Text>
                </VStack>
              </HStack>
            </Box>
          ))}
        </VStack>
      </RadioGroup>

      {/* Gmail fields */}
      {provider === 'gmail' && (
        <VStack spacing={3} align="stretch">
          <FieldRow label="Gmail Address" helper="The Gmail account that receives your ticket emails">
            <PlainInput value={settings['GMAIL_ADDRESS'] || settings['IMAP_USER'] || ''}
              placeholder="you@gmail.com"
              onChange={v => { onChange('GMAIL_ADDRESS', v); onChange('IMAP_USER', v); onChange('SMTP_USER', v); }} />
          </FieldRow>
          <FieldRow label="App Password" helper="Create at myaccount.google.com → Security → App passwords">
            <SecretInput value={settings['GMAIL_APP_PASSWORD'] || settings['IMAP_PASS'] || ''}
              placeholder="xxxx xxxx xxxx xxxx"
              onChange={v => { onChange('GMAIL_APP_PASSWORD', v); onChange('IMAP_PASS', v); onChange('SMTP_PASS', v); }} />
          </FieldRow>
        </VStack>
      )}

      {/* Microsoft 365 fields */}
      {provider === 'microsoft365' && (
        <VStack spacing={3} align="stretch">
          <FieldRow label="Email Address" helper="Your Microsoft 365 email address">
            <PlainInput value={settings['IMAP_USER'] || ''}
              placeholder="you@company.com"
              onChange={v => { onChange('IMAP_USER', v); onChange('SMTP_USER', v); }} />
          </FieldRow>
          <FieldRow label="Password" helper="Your Microsoft 365 password or app password">
            <SecretInput value={settings['IMAP_PASS'] || ''}
              placeholder="password"
              onChange={v => { onChange('IMAP_PASS', v); onChange('SMTP_PASS', v); }} />
          </FieldRow>
        </VStack>
      )}

      {/* Generic IMAP fields */}
      {provider === 'imap' && (
        <VStack spacing={3} align="stretch">
          <FieldRow label="IMAP Host">
            <PlainInput value={settings['IMAP_HOST'] || ''} placeholder="imap.yourserver.com"
              onChange={v => onChange('IMAP_HOST', v)} />
          </FieldRow>
          <FieldRow label="IMAP Username">
            <PlainInput value={settings['IMAP_USER'] || ''} placeholder="you@yourserver.com"
              onChange={v => onChange('IMAP_USER', v)} />
          </FieldRow>
          <FieldRow label="IMAP Password">
            <SecretInput value={settings['IMAP_PASS'] || ''}
              onChange={v => onChange('IMAP_PASS', v)} />
          </FieldRow>
          <FieldRow label="SMTP Host">
            <PlainInput value={settings['SMTP_HOST'] || ''} placeholder="smtp.yourserver.com"
              onChange={v => onChange('SMTP_HOST', v)} />
          </FieldRow>
          <FieldRow label="SMTP Port">
            <PlainInput value={settings['SMTP_PORT'] || '587'} placeholder="587"
              onChange={v => onChange('SMTP_PORT', v)} />
          </FieldRow>
          <FieldRow label="SMTP Username">
            <PlainInput value={settings['SMTP_USER'] || ''}
              onChange={v => onChange('SMTP_USER', v)} />
          </FieldRow>
          <FieldRow label="SMTP Password">
            <SecretInput value={settings['SMTP_PASS'] || ''}
              onChange={v => onChange('SMTP_PASS', v)} />
          </FieldRow>
        </VStack>
      )}

      <HStack spacing={3} pt={1}>
        <Button size="sm" variant="outline" colorScheme="green"
          onClick={onTest} isLoading={testResult.status === 'loading'}
          fontFamily="mono" fontSize="xs" letterSpacing="wider">
          🔌 TEST CONNECTION
        </Button>
        <Text fontSize="xs" color="gray.600">Verifies IMAP login</Text>
      </HStack>
      <TestBadge result={testResult} />
    </VStack>
  );
}

// ─── Step 2: Enable AI ────────────────────────────────────────────────────────
type AIProvider = 'openrouter' | 'openai';

function EnableAI({ settings, onChange, onTest, testResult }: {
  settings: SettingsMap;
  onChange: (k: string, v: string) => void;
  onTest: () => void;
  testResult: TestResult;
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const detectProvider = (): AIProvider => {
    const base = settings['OPENAI_API_BASE'] || '';
    if (base.includes('openrouter')) return 'openrouter';
    return 'openai';
  };
  const [provider, setProvider] = useState<AIProvider>(detectProvider);

  const handleProvider = (p: AIProvider) => {
    setProvider(p);
    if (p === 'openrouter') {
      onChange('OPENAI_API_BASE', 'https://openrouter.ai/api/v1');
      onChange('MODEL_PROVIDER', 'openai');
    } else {
      onChange('OPENAI_API_BASE', 'https://api.openai.com/v1');
      onChange('MODEL_PROVIDER', 'openai');
    }
  };

  return (
    <VStack spacing={4} align="stretch">
      <Text fontSize="xs" color="gray.400" fontFamily="mono">Choose your AI provider:</Text>

      <RadioGroup value={provider} onChange={v => handleProvider(v as AIProvider)}>
        <VStack spacing={2} align="stretch">
          <Box p={3} borderRadius="md" border="1px solid"
            borderColor={provider === 'openrouter' ? 'blue.500' : 'gray.700'}
            bg={provider === 'openrouter' ? 'blue.950' : 'gray.850'}
            cursor="pointer" onClick={() => handleProvider('openrouter')}>
            <HStack spacing={3}>
              <Radio value="openrouter" colorScheme="blue" size="sm" />
              <VStack spacing={0} align="start">
                <HStack>
                  <Text fontSize="sm" fontWeight="bold" color="white" fontFamily="mono">OpenRouter</Text>
                  <Badge colorScheme="green" fontSize="9px">RECOMMENDED</Badge>
                </HStack>
                <Text fontSize="xs" color="gray.500">One key, 100+ models — get key at openrouter.ai/keys</Text>
              </VStack>
            </HStack>
          </Box>

          <Box p={3} borderRadius="md" border="1px solid"
            borderColor={provider === 'openai' ? 'blue.500' : 'gray.700'}
            bg={provider === 'openai' ? 'blue.950' : 'gray.850'}
            cursor="pointer" onClick={() => handleProvider('openai')}>
            <HStack spacing={3}>
              <Radio value="openai" colorScheme="blue" size="sm" />
              <VStack spacing={0} align="start">
                <Text fontSize="sm" fontWeight="bold" color="white" fontFamily="mono">OpenAI</Text>
                <Text fontSize="xs" color="gray.500">Direct OpenAI access — get key at platform.openai.com/api-keys</Text>
              </VStack>
            </HStack>
          </Box>
        </VStack>
      </RadioGroup>

      {/* Key + models — same layout for both */}
      <VStack spacing={3} align="stretch">
        <FieldRow label={provider === 'openrouter' ? 'OpenRouter API Key' : 'OpenAI API Key'}
          helper={provider === 'openrouter' ? 'Starts with sk-or-...' : 'Starts with sk-proj- or sk-...'}
        >
          <SecretInput
            value={settings['OPENAI_API_KEY'] || ''}
            placeholder={provider === 'openrouter' ? 'sk-or-...' : 'sk-proj-...'}
            onChange={v => onChange('OPENAI_API_KEY', v)}
          />
        </FieldRow>

        <HStack spacing={3} align="start">
          <Box flex={1}>
            <FieldRow label="Fast Model" helper="Quick tasks (summaries, classification)">
              <PlainInput
                value={settings['AI_FAST_MODEL'] || 'gpt-4o-mini'}
                placeholder="gpt-4o-mini"
                onChange={v => onChange('AI_FAST_MODEL', v)}
              />
            </FieldRow>
          </Box>
          <Box flex={1}>
            <FieldRow label="Strong Model" helper="Deep analysis (Pilot, signal extraction)">
              <PlainInput
                value={settings['AI_STRONG_MODEL'] || 'gpt-4o'}
                placeholder="gpt-4o"
                onChange={v => onChange('AI_STRONG_MODEL', v)}
              />
            </FieldRow>
          </Box>
        </HStack>
      </VStack>

      <HStack spacing={3}>
        <Button size="sm" variant="outline" colorScheme="blue"
          onClick={onTest} isLoading={testResult.status === 'loading'}
          fontFamily="mono" fontSize="xs" letterSpacing="wider">
          🧪 TEST AI
        </Button>
        <Text fontSize="xs" color="gray.600">Sends a test prompt to verify</Text>
      </HStack>
      <TestBadge result={testResult} />

      {/* Advanced collapsed */}
      <Box border="1px solid" borderColor="gray.700" borderRadius="md" overflow="hidden">
        <HStack
          px={3} py={2} bg="gray.850" cursor="pointer" justify="space-between"
          onClick={() => setShowAdvanced(s => !s)}
          _hover={{ bg: 'gray.800' }}
        >
          <Text fontSize="xs" fontFamily="mono" color="gray.500" letterSpacing="wider">
            ▸ ADVANCED AI SETTINGS
          </Text>
          <Text fontSize="xs" color="gray.600">{showAdvanced ? '▲' : '▼'}</Text>
        </HStack>
        <Collapse in={showAdvanced}>
          <Box p={4} bg="gray.900">
            <VStack spacing={3} align="stretch">
              <Text fontSize="10px" color="gray.600" fontFamily="mono">
                These settings are for custom endpoints, local AI, and advanced configuration.
              </Text>
              <FieldRow label="Custom API Base URL" helper="Override for Ollama, LiteLLM, or custom gateway">
                <PlainInput value={settings['OPENAI_API_BASE'] || ''}
                  placeholder="http://localhost:11434/v1"
                  onChange={v => onChange('OPENAI_API_BASE', v)} />
              </FieldRow>
              <FieldRow label="Fallback API URL" helper="Secondary provider if primary fails">
                <PlainInput value={settings['AI_FALLBACK_URL'] || ''}
                  placeholder="https://api.openai.com/v1"
                  onChange={v => onChange('AI_FALLBACK_URL', v)} />
              </FieldRow>
              <FieldRow label="Fallback API Key">
                <SecretInput value={settings['AI_FALLBACK_KEY'] || ''}
                  onChange={v => onChange('AI_FALLBACK_KEY', v)} />
              </FieldRow>
              <FieldRow label="Fallback Model">
                <PlainInput value={settings['AI_FALLBACK_MODEL'] || ''}
                  placeholder="gpt-4o-mini"
                  onChange={v => onChange('AI_FALLBACK_MODEL', v)} />
              </FieldRow>
              <FieldRow label="Daily Budget (USD)" helper="0 = unlimited">
                <PlainInput value={settings['AI_BUDGET_DAILY_USD'] || '0'}
                  placeholder="1.00" onChange={v => onChange('AI_BUDGET_DAILY_USD', v)} />
              </FieldRow>
              <FieldRow label="Cache TTL (hours)">
                <PlainInput value={settings['AI_CACHE_TTL_HOURS'] || '24'}
                  placeholder="24" onChange={v => onChange('AI_CACHE_TTL_HOURS', v)} />
              </FieldRow>
              <FieldRow label="Request Timeout (seconds)">
                <PlainInput value={settings['AI_TIMEOUT_SECS'] || '60'}
                  placeholder="60" onChange={v => onChange('AI_TIMEOUT_SECS', v)} />
              </FieldRow>
            </VStack>
          </Box>
        </Collapse>
      </Box>
    </VStack>
  );
}

// ─── Step 3: First Scan ───────────────────────────────────────────────────────
function FirstScan({ onRun, result }: {
  onRun: () => void;
  result: IngestResult;
}) {
  return (
    <VStack spacing={4} align="stretch">
      <Text fontSize="xs" color="gray.400" fontFamily="mono">
        Run your first scan to import tickets and activate AI analysis.
      </Text>

      {!result.running && !result.done && !result.error && (
        <Button colorScheme="orange" onClick={onRun}
          fontFamily="mono" letterSpacing="wider" fontSize="sm">
          🚀 RUN FIRST SCAN
        </Button>
      )}

      {result.running && (
        <VStack spacing={3} align="stretch">
          <Text fontSize="xs" fontFamily="mono" color="blue.300">Scanning inbox...</Text>
          <Progress size="xs" isIndeterminate colorScheme="blue" borderRadius="full" />
          <VStack spacing={1} align="start">
            <Text fontSize="xs" color="gray.400" fontFamily="mono">✓ Connecting to inbox</Text>
            {(result.emailsFound ?? 0) > 0 && (
              <Text fontSize="xs" color="green.400" fontFamily="mono">
                ✓ {result.emailsFound} emails found
              </Text>
            )}
            {(result.ticketsImported ?? 0) > 0 && (
              <Text fontSize="xs" color="green.400" fontFamily="mono">
                ✓ {result.ticketsImported} tickets imported
              </Text>
            )}
          </VStack>
        </VStack>
      )}

      {result.done && (
        <Box p={3} bg="green.900" borderRadius="md" border="1px solid" borderColor="green.600">
          <VStack spacing={1} align="start">
            <Text fontSize="xs" fontFamily="mono" color="green.300" fontWeight="bold">
              ✅ Scan Complete — Signal is live
            </Text>
            {(result.emailsFound ?? 0) > 0 && (
              <Text fontSize="xs" color="green.400" fontFamily="mono">
                {result.emailsFound} emails scanned
              </Text>
            )}
            {(result.ticketsImported ?? 0) > 0 && (
              <Text fontSize="xs" color="green.400" fontFamily="mono">
                {result.ticketsImported} tickets imported
              </Text>
            )}
          </VStack>
        </Box>
      )}

      {result.error && (
        <Box p={3} bg="red.900" borderRadius="md" border="1px solid" borderColor="red.600">
          <Text fontSize="xs" fontFamily="mono" color="red.300">❌ {result.error}</Text>
          <Button mt={2} size="xs" colorScheme="red" variant="outline" onClick={onRun}
            fontFamily="mono" fontSize="10px">RETRY</Button>
        </Box>
      )}
    </VStack>
  );
}

// ─── Main SetupPanel ──────────────────────────────────────────────────────────
export function SetupPanel() {
  const toast = useToast();
  const [settings, setSettings] = useState<SettingsMap>({});
  const [loading, setLoading]   = useState(true);
  const [saving,  setSaving]    = useState(false);
  const [emailTest, setEmailTest] = useState<TestResult>({ status: 'idle', message: '' });
  const [aiTest,    setAiTest]    = useState<TestResult>({ status: 'idle', message: '' });
  const [setupStatus, setSetupStatus] = useState<SetupStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [ingest, setIngest] = useState<IngestResult>({ running: false });

  const loadSetupStatus = useCallback(async () => {
    setStatusLoading(true);
    try {
      const res = await fetch(`${PM_API}/api/setup/status`, { credentials: 'include' });
      const data = await res.json();
      setSetupStatus(data);
    } catch (err) { console.warn('[SetupPanel] Failed to load setup status:', err); }
    finally { setStatusLoading(false); }
  }, []);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${PM_API}/api/settings`);
      const data = await res.json();
      setSettings(data.settings || {});
    } catch {
      toast({ title: 'Failed to load settings', status: 'error', duration: 3000 });
    } finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { loadSettings(); loadSetupStatus(); }, [loadSettings, loadSetupStatus]);

  const handleChange = (k: string, v: string) => setSettings(prev => ({ ...prev, [k]: v }));

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
      if (data.status === 'ok') { loadSettings(); loadSetupStatus(); }
    } catch (e) {
      toast({ title: 'Save failed', description: String(e), status: 'error', duration: 4000 });
    } finally { setSaving(false); }
  };

  const handleTestEmail = async () => {
    setEmailTest({ status: 'loading', message: '' });
    try {
      const res = await fetch(`${PM_API}/api/settings/test/email`, { method: 'POST' });
      const data = await res.json();
      setEmailTest({ status: data.status, message: data.message });
      if (data.status === 'ok') loadSetupStatus();
    } catch (e) { setEmailTest({ status: 'error', message: String(e) }); }
  };

  const handleTestAI = async () => {
    setAiTest({ status: 'loading', message: '' });
    try {
      const res = await fetch(`${PM_API}/api/settings/test/ai`, { method: 'POST' });
      const data = await res.json();
      setAiTest({ status: data.status, message: data.message });
      if (data.status === 'ok') loadSetupStatus();
    } catch (e) { setAiTest({ status: 'error', message: String(e) }); }
  };

  const handleRunScan = async () => {
    setIngest({ running: true });
    try {
      // NOTE: /api/ingest/run is retired (returns 410). Use /api/ingest/email — adapter-based, tenant-safe.
      const res = await fetch(`${PM_API}/api/ingest/email`, { method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      const data = await res.json();
      // /api/ingest/email processes in background — poll status after delay
      if (res.ok || data.status === 'started') {
        setIngest({ running: true, emailsFound: 0, ticketsImported: 0 });
        // Poll for completion
        setTimeout(async () => {
          try {
            const sr = await fetch(`${PM_API}/api/setup/status`, { credentials: 'include' });
            const sd = await sr.json();
            setSetupStatus(sd);
            setIngest({
              running: false, done: true,
              emailsFound: data.emails_found || 0,
              ticketsImported: data.tickets_imported || 0,
            });
          } catch {
            setIngest({ running: false, done: true });
          }
        }, 8000);
      } else {
        setIngest({ running: false, error: data.message || 'Ingestion failed' });
      }
    } catch (e) {
      setIngest({ running: false, error: String(e) });
    }
  };

  if (loading) return (
    <Flex h="full" align="center" justify="center">
      <Spinner color="blue.400" size="xl" />
    </Flex>
  );

  const sectionStyle = {
    border: '1px solid', borderColor: 'gray.700', borderRadius: 'md',
    mb: 3, overflow: 'hidden',
  };

  return (
    <VStack spacing={0} align="stretch" h="full" overflow="hidden">
      {/* Header */}
      <Flex px={6} py={4} bg="gray.900" borderBottom="1px solid" borderColor="gray.700"
        align="center" justify="space-between" flexShrink={0}>
        <VStack align="start" spacing={0}>
          <Text fontSize="lg" fontWeight="black" color="white" fontFamily="mono" letterSpacing="wider">
            ⚙️ SETUP
          </Text>
          <Text fontSize="xs" color="gray.500" fontFamily="mono">
            Activate Signal for your workspace
          </Text>
        </VStack>
        <Button size="sm" colorScheme="blue" onClick={handleSave}
          isLoading={saving} loadingText="Saving..."
          fontFamily="mono" letterSpacing="wider" fontSize="xs">
          SAVE SETTINGS
        </Button>
      </Flex>

      {/* Scrollable body */}
      <Box flex={1} overflowY="auto" p={4}
        css={{ '&::-webkit-scrollbar': { width: '4px' }, '&::-webkit-scrollbar-thumb': { background: '#2D3748' } }}
      >
        {/* Activation status */}
        <Box mb={4}>
          <ActivationStatus status={setupStatus} loading={statusLoading} />
        </Box>

        <Accordion allowMultiple defaultIndex={[0, 1, 2]} borderColor="gray.700">

          {/* Step 1: Connect Inbox */}
          <AccordionItem {...sectionStyle}>
            <AccordionButton bg="gray.850" px={4} py={3}
              _hover={{ bg: 'gray.800' }}
              _expanded={{ bg: 'gray.800', borderBottom: '1px solid', borderColor: 'gray.700' }}>
              <HStack flex={1} spacing={2}>
                <Text fontSize="sm">📧</Text>
                <VStack spacing={0} align="start">
                  <Text fontSize="sm" fontWeight="bold" color="white" fontFamily="mono"
                    letterSpacing="wider">STEP 1 — CONNECT INBOX</Text>
                  <Text fontSize="10px" color={setupStatus?.imap_connected ? 'green.400' : 'gray.500'}>
                    {setupStatus?.imap_connected ? '✓ Connected' : 'Connect your ticket email inbox'}
                  </Text>
                </VStack>
              </HStack>
              <AccordionIcon color="gray.400" />
            </AccordionButton>
            <AccordionPanel bg="gray.900" p={4}>
              <ConnectInbox settings={settings} onChange={handleChange}
                onTest={handleTestEmail} testResult={emailTest} />
            </AccordionPanel>
          </AccordionItem>

          {/* Step 2: Enable AI */}
          <AccordionItem {...sectionStyle}>
            <AccordionButton bg="gray.850" px={4} py={3}
              _hover={{ bg: 'gray.800' }}
              _expanded={{ bg: 'gray.800', borderBottom: '1px solid', borderColor: 'gray.700' }}>
              <HStack flex={1} spacing={2}>
                <Text fontSize="sm">🤖</Text>
                <VStack spacing={0} align="start">
                  <Text fontSize="sm" fontWeight="bold" color="white" fontFamily="mono"
                    letterSpacing="wider">STEP 2 — ENABLE AI</Text>
                  <Text fontSize="10px" color={setupStatus?.ai_configured ? 'green.400' : 'gray.500'}>
                    {setupStatus?.ai_configured ? '✓ AI active' : 'Bring your own OpenRouter or OpenAI key'}
                  </Text>
                </VStack>
              </HStack>
              <AccordionIcon color="gray.400" />
            </AccordionButton>
            <AccordionPanel bg="gray.900" p={4}>
              <EnableAI settings={settings} onChange={handleChange}
                onTest={handleTestAI} testResult={aiTest} />
            </AccordionPanel>
          </AccordionItem>

          {/* Step 3: First Scan */}
          <AccordionItem {...sectionStyle}>
            <AccordionButton bg="gray.850" px={4} py={3}
              _hover={{ bg: 'gray.800' }}
              _expanded={{ bg: 'gray.800', borderBottom: '1px solid', borderColor: 'gray.700' }}>
              <HStack flex={1} spacing={2}>
                <Text fontSize="sm">🚀</Text>
                <VStack spacing={0} align="start">
                  <Text fontSize="sm" fontWeight="bold" color="white" fontFamily="mono"
                    letterSpacing="wider">STEP 3 — RUN FIRST SCAN</Text>
                  <Text fontSize="10px" color={setupStatus?.first_ingestion_complete ? 'green.400' : 'gray.500'}>
                    {setupStatus?.first_ingestion_complete ? '✓ Tickets imported' : 'Import tickets and activate intelligence'}
                  </Text>
                </VStack>
              </HStack>
              <AccordionIcon color="gray.400" />
            </AccordionButton>
            <AccordionPanel bg="gray.900" p={4}>
              <FirstScan onRun={handleRunScan} result={ingest} />
            </AccordionPanel>
          </AccordionItem>

          {/* Optional: Integrations */}
          <AccordionItem {...sectionStyle}>
            <AccordionButton bg="gray.850" px={4} py={3}
              _hover={{ bg: 'gray.800' }}
              _expanded={{ bg: 'gray.800', borderBottom: '1px solid', borderColor: 'gray.700' }}>
              <HStack flex={1} spacing={2}>
                <Text fontSize="sm">🔗</Text>
                <VStack spacing={0} align="start">
                  <Text fontSize="sm" fontWeight="bold" color="white" fontFamily="mono"
                    letterSpacing="wider">OPTIONAL — INTEGRATIONS</Text>
                  <Text fontSize="10px" color="gray.500">Discord, Notifications, Platform settings</Text>
                </VStack>
              </HStack>
              <AccordionIcon color="gray.400" />
            </AccordionButton>
            <AccordionPanel bg="gray.900" p={4}>
              <VStack spacing={4} align="stretch">
                <Text fontSize="xs" fontFamily="mono" color="gray.500"
                  textTransform="uppercase" letterSpacing="wider">Discord</Text>
                <FieldRow label="Bot Token" helper="From Discord Developer Portal → Your App → Bot">
                  <SecretInput value={settings['DISCORD_BOT_TOKEN'] || ''}
                    placeholder="MTQ..." onChange={v => onChange('DISCORD_BOT_TOKEN', v)} />
                </FieldRow>

                <Divider borderColor="gray.700" />
                <Text fontSize="xs" fontFamily="mono" color="gray.500"
                  textTransform="uppercase" letterSpacing="wider">Notifications</Text>
                <FieldRow label="Slack Webhook">
                  <PlainInput value={settings['slack_webhook'] || ''}
                    placeholder="https://hooks.slack.com/services/..."
                    onChange={v => onChange('slack_webhook', v)} />
                </FieldRow>
                <FieldRow label="Alert Email">
                  <PlainInput value={settings['email_alerts'] || ''}
                    placeholder="ops@yourcompany.com"
                    onChange={v => onChange('email_alerts', v)} />
                </FieldRow>

                <Divider borderColor="gray.700" />
                <Text fontSize="xs" fontFamily="mono" color="gray.500"
                  textTransform="uppercase" letterSpacing="wider">Organization</Text>
                <FieldRow label="Organization Name">
                  <PlainInput value={settings['TENANT_NAME'] || ''}
                    placeholder="Your company name"
                    onChange={v => onChange('TENANT_NAME', v)} />
                </FieldRow>
              </VStack>
            </AccordionPanel>
          </AccordionItem>

        </Accordion>

        {/* Save at bottom */}
        <Box mt={2} pb={6}>
          <Button w="full" colorScheme="blue" onClick={handleSave}
            isLoading={saving} loadingText="Saving..."
            fontFamily="mono" letterSpacing="wider">
            💾 SAVE ALL SETTINGS
          </Button>
        </Box>
      </Box>
    </VStack>
  );

  // inner helper only available in this scope
  function onChange(k: string, v: string) { handleChange(k, v); }
}
