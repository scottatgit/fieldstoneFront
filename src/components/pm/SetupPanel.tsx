'use client';
import {
  Box, VStack, HStack, Text, Input, Button, Badge,
  Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon,
  FormControl, FormLabel, FormHelperText,
  InputGroup, InputRightElement, IconButton,
  Divider, Spinner, Flex, Select,
  useToast,
} from '@chakra-ui/react';
import { useState, useEffect, useCallback, useRef } from 'react';

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
  type?: 'text' | 'select' | 'toggle' | 'heading';
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
      // ── Google OAuth 2.0 ──
      { key: '_oauth_heading',       label: 'Google OAuth 2.0',    type: 'heading', helper: 'Alternative to App Password — use if 2FA blocks SMTP/IMAP' },
      { key: 'GOOGLE_CLIENT_ID',     label: 'OAuth Client ID',     placeholder: '123456789.apps.googleusercontent.com' },
      { key: 'GOOGLE_CLIENT_SECRET', label: 'OAuth Client Secret', secret: true, placeholder: 'GOCSPX-...' },
      { key: 'GOOGLE_REFRESH_TOKEN', label: 'OAuth Refresh Token', secret: true, placeholder: '1//0g...' },
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
      // ── AI OAuth 2.0 ──
      { key: '_ai_oauth_heading', label: 'AI OAuth 2.0 (Provider-Agnostic)', type: 'heading', helper: 'Use OAuth instead of API keys — works with Google Vertex AI, Azure OpenAI, OpenAI Platform, and custom providers' },
      {
        key: 'AI_OAUTH_PROVIDER', label: 'OAuth Provider',
        type: 'select', options: ['', 'google', 'azure', 'openai', 'custom'],
        helper: 'google=Vertex AI/Gemini · azure=Azure OpenAI · openai=OpenAI Platform · custom=any OAuth2 endpoint',
      },
      { key: 'AI_OAUTH_CLIENT_ID',     label: 'OAuth Client ID',     placeholder: 'client id from your provider' },
      { key: 'AI_OAUTH_CLIENT_SECRET', label: 'OAuth Client Secret', secret: true, placeholder: 'client secret' },
      { key: 'AI_OAUTH_REFRESH_TOKEN', label: 'OAuth Refresh Token', secret: true, placeholder: 'refresh token from OAuth flow' },
      { key: 'AI_OAUTH_TOKEN_URL',     label: 'Token Endpoint URL',  placeholder: 'https://oauth2.googleapis.com/token', helper: 'Required for custom provider; auto-set for google/azure/openai' },
      { key: 'AI_OAUTH_SCOPE',         label: 'OAuth Scope(s)',       placeholder: 'https://www.googleapis.com/auth/cloud-platform', helper: 'Space-separated scopes' },
      { key: 'AZURE_TENANT_ID',        label: 'Azure Tenant ID',     placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', helper: 'Azure AD only — leave blank for other providers' },
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
  {
    title: 'Notifications',
    icon: '\U0001f514',
    fields: [
      { key: 'slack_webhook',       label: 'Slack Webhook URL',   placeholder: 'https://hooks.slack.com/services/...' },
      { key: 'discord_webhook',     label: 'Discord Webhook URL', placeholder: 'https://discord.com/api/webhooks/...' },
      { key: 'email_alerts',        label: 'Alert Email Address', placeholder: 'ops@yourcompany.com' },
      { key: '_notif_events',       label: 'Notify on Events',    type: 'heading' as const },
      { key: 'notify_outbreak',     label: 'Outbreak Detected',   placeholder: 'true' },
      { key: 'notify_trial_ending', label: 'Trial Ending',        placeholder: 'true' },
      { key: 'notify_suspended',    label: 'Tenant Suspended',    placeholder: 'true' },
      { key: 'notify_pattern',      label: 'Pattern Emerging',    placeholder: 'true' },
    ],
  },
  {
    title: 'Platform',
    icon: '\U0001f3e2',
    fields: [
      { key: '_platform_info',   label: 'Tenant Information', type: 'heading' as const, helper: 'Contact support to change plan or subdomain' },
      { key: 'TENANT_NAME',     label: 'Organization Name',  placeholder: 'Your organization name' },
      { key: 'TENANT_SUBDOMAIN',label: 'Subdomain',          placeholder: 'yourcompany.fieldstone.pro', helper: 'Read-only' },
      { key: 'TENANT_PLAN',     label: 'Plan',               placeholder: 'starter', helper: 'Read-only' },
      { key: 'TENANT_TRIAL',    label: 'Trial Ends',         placeholder: 'N/A', helper: 'Read-only' },
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

  if (field.type === 'heading') {
    return (
      <FormControl>
        <Divider borderColor="blue.700" mt={2} mb={1} />
        <Text fontSize="xs" fontFamily="mono" color="blue.300"
          textTransform="uppercase" letterSpacing="wider" fontWeight="bold" mb={1}>
          {field.label}
        </Text>
        {field.helper && (
          <FormHelperText fontSize="xs" color="gray.500" mt={0} mb={2}>{field.helper}</FormHelperText>
        )}
      </FormControl>
    );
  }

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

// ─── OAuth Connect Button ─────────────────────────────────────────────────────
function OAuthConnectButton({ provider, onSuccess }: { provider: string; onSuccess: () => void }) {
  const [status, setStatus] = useState<'idle' | 'waiting' | 'success' | 'error'>('idle');
  const [msg, setMsg] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  };

  const handleConnect = () => {
    if (!provider) { setMsg('Select a provider first'); setStatus('error'); return; }
    setStatus('waiting');
    setMsg('Waiting for authorization...');

    // Open OAuth popup
    const popup = window.open(
      `http://localhost:8100/api/oauth/initiate?provider=${provider}`,
      'oauth_popup',
      'width=520,height=680,scrollbars=yes,resizable=yes'
    );

    // Poll for completion every 2s
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`http://localhost:8100/api/oauth/status?provider=${provider}`);
        const data = await res.json();
        if (data.completed) {
          stopPolling();
          popup?.close();
          setStatus('success');
          setMsg(data.has_refresh
            ? '✅ Connected! Refresh token saved.'
            : '⚠️ Connected but no refresh token — check scope includes offline_access');
          setTimeout(onSuccess, 1000);
        }
      } catch { /* ignore poll errors */ }
    }, 2000);

    // Cleanup after 5 minutes
    setTimeout(() => {
      stopPolling();
      if (status !== 'success') {
        setStatus('error');
        setMsg('Timed out — authorization not completed within 5 minutes');
      }
    }, 300000);
  };

  useEffect(() => () => stopPolling(), []);

  const providerLabels: Record<string, string> = {
    google: 'Google (Vertex AI)',
    azure:  'Azure OpenAI',
    openai: 'OpenAI Platform',
    custom: 'Custom Provider',
  };
  const label = (providerLabels[provider] || provider || 'PROVIDER').toUpperCase();

  return (
    <Box mt={2}>
      <HStack spacing={3} align="center" flexWrap="wrap">
        <Button
          size="sm" colorScheme="purple" variant="outline"
          onClick={handleConnect}
          isLoading={status === 'waiting'}
          loadingText="Waiting..."
          isDisabled={!provider || status === 'waiting'}
          fontFamily="mono" fontSize="xs" letterSpacing="wider"
        >
          🔗 CONNECT WITH {label}
        </Button>
        {status === 'success' && (
          <Text fontSize="xs" color="green.400" fontFamily="mono">{msg}</Text>
        )}
        {status === 'error' && (
          <Text fontSize="xs" color="red.400" fontFamily="mono">{msg}</Text>
        )}
      </HStack>
      {status === 'waiting' && (
        <Text fontSize="xs" color="gray.500" mt={1} fontFamily="mono">
          Complete the authorization in the popup window...
        </Text>
      )}
    </Box>
  );
}

// ─── Main SetupPanel ──────────────────────────────────────────────────────────
// ─── Setup Status Panel ────────────────────────────────────────────────────
interface SetupStatus {
  organization: boolean;
  imap_connected: boolean;
  ai_configured: boolean;
  first_ingestion_complete: boolean;
}

function SetupStatusPanel({ status, loading }: { status: SetupStatus | null; loading: boolean }) {
  const steps: { key: keyof SetupStatus; label: string }[] = [
    { key: 'organization',             label: 'Organization created' },
    { key: 'imap_connected',           label: 'Ticket inbox connected' },
    { key: 'first_ingestion_complete', label: 'First ingestion run' },
    { key: 'ai_configured',            label: 'AI configured' },
  ];
  const completed = status ? steps.filter(s => status[s.key]).length : 0;
  const pct = Math.round((completed / steps.length) * 100);
  return (
    <Box mx={4} mt={4} mb={2} p={4} bg="gray.800" borderRadius="md"
      border="1px solid" borderColor={pct === 100 ? 'green.600' : 'blue.700'}>
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
          h="4px" w={pct + '%'} transition="width 0.4s ease" />
      </Box>
      <VStack spacing={1} align="stretch">
        {steps.map(step => (
          <HStack key={step.key} spacing={2}>
            <Text fontSize="xs" color={status?.[step.key] ? 'green.400' : 'gray.500'}>
              {status?.[step.key] ? '✓' : '○'}
            </Text>
            <Text fontSize="xs" fontFamily="mono"
              color={status?.[step.key] ? 'white' : 'gray.500'}>
              {step.label}
            </Text>
          </HStack>
        ))}
      </VStack>
    </Box>
  );
}

export function SetupPanel() {
  const toast   = useToast();
  const [settings, setSettings] = useState<SettingsMap>({});
  const [loading, setLoading]   = useState(true);
  const [saving,  setSaving]    = useState(false);
  const [aiTest,  setAiTest]    = useState<TestResult>({ status: 'idle', message: '' });
  const [emailTest, setEmailTest] = useState<TestResult>({ status: 'idle', message: '' });
  const [aiUsage, setAiUsage]   = useState<any>(null);
  const [setupStatus, setSetupStatus] = useState<SetupStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [ingestRunning, setIngestRunning] = useState(false);

  const loadSetupStatus = useCallback(async () => {
    setStatusLoading(true);
    try {
      const res = await fetch(`${PM_API}/api/setup/status`);
      const data = await res.json();
      setSetupStatus(data);
    } catch { /* ignore */ }
    finally { setStatusLoading(false); }
  }, []);

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

  useEffect(() => { loadSettings(); loadAiUsage(); loadSetupStatus(); }, [loadSettings, loadAiUsage, loadSetupStatus]);

  const handleChange = (key: string, val: string) => {
    setSettings(prev => ({ ...prev, [key]: val }));
  };

  const handleRunIngest = async () => {
    setIngestRunning(true);
    try {
      const res = await fetch(`${PM_API}/api/ingest/run`, { method: 'POST' });
      const data = await res.json();
      toast({
        title: data.status === 'started' ? '🚀 Ingestion Started' : '⚠ Error',
        description: data.message,
        status: data.status === 'started' ? 'info' : 'error',
        duration: 5000,
      });
      if (data.status === 'started') setTimeout(() => loadSetupStatus(), 8000);
    } catch (e) {
      toast({ title: 'Ingestion failed', description: String(e), status: 'error', duration: 4000 });
    } finally {
      setIngestRunning(false);
    }
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
            Configure Signal connections & AI
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

      {/* Setup Activation Status */}
      <SetupStatusPanel status={setupStatus} loading={statusLoading} />

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
                      {settings['AI_OAUTH_PROVIDER'] && (
                        <Box mt={3}>
                          <Divider borderColor="purple.800" mb={3} />
                          <Text fontSize="xs" fontFamily="mono" color="purple.300"
                            textTransform="uppercase" letterSpacing="wider" mb={2}>
                            🔗 OAuth Authorization Flow
                          </Text>
                          <Text fontSize="xs" color="gray.500" mb={2}>
                            Make sure Client ID and Client Secret are saved first, then click Connect to authorize.
                          </Text>
                          <OAuthConnectButton
                            provider={settings['AI_OAUTH_PROVIDER'] || ''}
                            onSuccess={loadSettings}
                          />
                        </Box>
                      )}
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
                      <Box mt={3}>
                        <Divider borderColor="gray.700" mb={3} />
                        <HStack spacing={3}>
                          <Button
                            size="sm" colorScheme="orange"
                            onClick={handleRunIngest}
                            isLoading={ingestRunning}
                            loadingText="Running..."
                            fontFamily="mono" fontSize="xs" letterSpacing="wider"
                          >
                            🚀 RUN FIRST INGESTION
                          </Button>
                          <Text fontSize="xs" color="gray.600">Scans inbox and imports tickets</Text>
                        </HStack>
                      </Box>
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
