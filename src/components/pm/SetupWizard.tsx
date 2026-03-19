/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';
import { useState, useCallback, useEffect } from 'react';
import {
  Box, VStack, HStack, Text, Input, Button, Badge,
  InputGroup, InputRightElement, IconButton,
  Spinner, useToast, Divider, Alert, AlertIcon,
} from '@chakra-ui/react';

const PM_API = '/pm-api';

type Status = 'idle' | 'loading' | 'ok' | 'error';
const STEPS = ['Email', 'AI', 'Integrations', 'Launch'];

function SecretInput({ value, placeholder, onChange }: {
  value: string; placeholder?: string; onChange: (v: string) => void;
}) {
  const [show, setShow] = useState(false);
  return (
    <InputGroup size="sm">
      <Input bg="gray.800" borderColor="gray.700" color="white" fontFamily="mono"
        type={show ? 'text' : 'password'} value={value} placeholder={placeholder || ''}
        onChange={e => onChange(e.target.value)}
        _focus={{ borderColor: 'blue.400', boxShadow: 'none' }}
        _placeholder={{ color: 'gray.600' }} />
      <InputRightElement>
        <IconButton aria-label="toggle" size="xs" variant="ghost" color="gray.500"
          onClick={() => setShow(s => !s)}
          icon={<Text fontSize="10px">{show ? 'HIDE' : 'SHOW'}</Text>} />
      </InputRightElement>
    </InputGroup>
  );
}

function Field({ label, hint, children }: {
  label: string; hint?: string; children: React.ReactNode;
}) {
  return (
    <VStack align="stretch" spacing={1}>
      <Text fontSize="xs" color="gray.400" fontFamily="mono"
        textTransform="uppercase" letterSpacing="wider">{label}</Text>
      {children}
      {hint && <Text fontSize="10px" color="gray.600" fontFamily="mono">{hint}</Text>}
    </VStack>
  );
}

function StatusBadge({ status, message }: { status: Status; message?: string }) {
  if (status === 'idle') return null;
  const color = status === 'loading' ? 'blue' : status === 'ok' ? 'green' : 'red';
  const label = status === 'loading' ? 'TESTING...' : status === 'ok' ? 'CONNECTED' : 'FAILED';
  return (
    <HStack spacing={2} mt={1}>
      {status === 'loading' && <Spinner size="xs" color="blue.400" />}
      <Badge colorScheme={color} fontSize="9px" fontFamily="mono">{label}</Badge>
      {message && (
        <Text fontSize="10px" color={status === 'ok' ? 'green.400' : 'red.400'}
          fontFamily="mono">{message}</Text>
      )}
    </HStack>
  );
}

function StepEmail({ onNext }: { onNext: () => void }) {
  const [host, setHost] = useState('imap.gmail.com');
  const [port, setPort] = useState('993');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [msg, setMsg] = useState('');

  // Microsoft OAuth state
  const [detectedProvider, setDetectedProvider] = useState<'microsoft' | 'google' | 'imap' | null>(null);
  const [detectingProvider, setDetectingProvider] = useState(false);
  const [msConnected, setMsConnected] = useState(false);
  const [msError, setMsError] = useState('');
  const [authError, setAuthError] = useState(false);
  const [tenantSlug, setTenantSlug] = useState('');
  const [connectingMs, setConnectingMs] = useState(false);

  const toast = useToast();

  // On mount: check URL params for OAuth callback result + fetch tenant info
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('ms_connected') === '1') {
      setMsConnected(true);
      setStatus('ok');
      setMsg('Microsoft mailbox connected');
    }
    const errParam = params.get('ms_error');
    if (errParam) {
      setMsError(decodeURIComponent(errParam));
      setStatus('error');
      setMsg('Microsoft connection failed');
    }

    // Fetch tenant slug for OAuth start URL
    fetch(PM_API + '/api/auth/me', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.slug) setTenantSlug(d.slug); })
      .catch(() => {});

    // Fetch setup status to check connection_status
    fetch(PM_API + '/api/setup/status', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.connection_status === 'auth_error') setAuthError(true);
        if (d?.connection_status === 'connected' && d?.imap_config?.provider === 'microsoft_graph') {
          setMsConnected(true);
          setStatus('ok');
          setMsg('Microsoft mailbox connected — ' + (d?.imap_config?.mailbox || ''));
        }
      })
      .catch(() => {});
  }, []);

  // Detect provider from email domain via MX lookup
  const detectProvider = useCallback(async (emailVal: string) => {
    if (!emailVal || !emailVal.includes('@')) { setDetectedProvider(null); return; }
    setDetectingProvider(true);
    try {
      const r = await fetch(`/api/auth/detect-provider?email=${encodeURIComponent(emailVal)}`);
      const d = await r.json();
      setDetectedProvider(d.provider === 'microsoft' ? 'microsoft' : d.provider === 'google' ? 'google' : 'imap');
    } catch { setDetectedProvider(null); }
    finally { setDetectingProvider(false); }
  }, []);

  // Debounce provider detection on email change
  useEffect(() => {
    if (!email) { setDetectedProvider(null); return; }
    const t = setTimeout(() => detectProvider(email), 600);
    return () => clearTimeout(t);
  }, [email, detectProvider]);

  const connectMicrosoft = useCallback(async () => {
    if (!tenantSlug) {
      toast({ title: 'Cannot determine tenant. Please refresh and try again.', status: 'warning', duration: 3000, isClosable: true });
      return;
    }
    setConnectingMs(true);
    try {
      const r = await fetch(`/api/auth/microsoft/start?tenant_slug=${encodeURIComponent(tenantSlug)}`);
      const d = await r.json();
      if (d.auth_url) {
        window.location.href = d.auth_url;
      } else {
        toast({ title: 'Could not generate Microsoft auth URL', status: 'error', duration: 3000, isClosable: true });
      }
    } catch (e: unknown) {
      toast({ title: 'Error starting Microsoft auth', status: 'error', duration: 3000, isClosable: true });
    } finally {
      setConnectingMs(false);
    }
  }, [tenantSlug, toast]);

  const test = useCallback(async () => {
    if (!email || !pass) {
      toast({ title: 'Fill in email and password', status: 'warning', duration: 2000, isClosable: true });
      return;
    }
    setStatus('loading'); setMsg('');
    try {
      await fetch(PM_API + '/api/settings', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: { imap_host: host, imap_port: port, imap_user: email, imap_pass: pass } }),
      });
      const r2 = await fetch(PM_API + '/api/imap/test', { method: 'POST', credentials: 'include' });
      const d = await r2.json();
      if (d.success || d.ok) { setStatus('ok'); setMsg(d.message || 'Inbox reachable'); }
      else { setStatus('error'); setMsg(d.error || d.detail || 'Could not connect'); }
    } catch (e: unknown) { setStatus('error'); setMsg(e instanceof Error ? e.message : 'Error'); }
  }, [host, port, email, pass, toast]);

  return (
    <VStack spacing={5} align="stretch">
      <VStack align="start" spacing={1}>
        <Text fontSize="lg" fontWeight="black" color="white" fontFamily="mono">Connect Your Inbox</Text>
        <Text fontSize="sm" color="gray.400">Signal reads your support email to automatically capture and analyze tickets. We only read, never send.</Text>
      </VStack>

      {/* Auth error reconnect warning */}
      {authError && !msConnected && (
        <Box p={3} bg="orange.900" borderRadius="md" border="1px solid" borderColor="orange.700">
          <HStack justify="space-between">
            <Text fontSize="xs" color="orange.300" fontFamily="mono">⚠️ Microsoft connection needs attention.</Text>
            <Button size="xs" colorScheme="orange" fontFamily="mono"
              onClick={connectMicrosoft} isLoading={connectingMs} loadingText="CONNECTING...">
              RECONNECT MICROSOFT →
            </Button>
          </HStack>
        </Box>
      )}

      {/* Microsoft OAuth success banner */}
      {msConnected && (
        <Box p={3} bg="green.900" borderRadius="md" border="1px solid" borderColor="green.700">
          <Text fontSize="xs" color="green.300" fontFamily="mono">✅ {msg || 'Microsoft mailbox connected'}</Text>
        </Box>
      )}

      {/* Microsoft OAuth error banner */}
      {msError && (
        <Box p={3} bg="red.900" borderRadius="md" border="1px solid" borderColor="red.700">
          <Text fontSize="xs" color="red.300" fontFamily="mono">❌ Microsoft error: {msError}</Text>
        </Box>
      )}

      <Field label="Email Address">
        <HStack spacing={2}>
          <Input size="sm" bg="gray.800" borderColor="gray.700" color="white" fontFamily="mono"
            type="email" value={email} placeholder="support@yourcompany.com"
            onChange={e => setEmail(e.target.value)}
            _placeholder={{ color: 'gray.600' }} _focus={{ borderColor: 'blue.400', boxShadow: 'none' }} />
          {detectingProvider && <Spinner size="xs" color="gray.500" />}
        </HStack>
        {detectedProvider === 'microsoft' && (
          <Text fontSize="10px" color="blue.400" fontFamily="mono" mt={1}>↑ Microsoft / Outlook domain detected</Text>
        )}
        {detectedProvider === 'google' && (
          <Text fontSize="10px" color="gray.500" fontFamily="mono" mt={1}>↑ Google Workspace detected — use App Password below</Text>
        )}
      </Field>

      {/* Microsoft connect button — shown when microsoft domain detected or already connected */}
      {(detectedProvider === 'microsoft' || msConnected) && (
        <Box p={4} bg="gray.800" borderRadius="md" border="1px solid" borderColor={msConnected ? 'green.700' : 'blue.800'}>
          <VStack align="start" spacing={2}>
            <HStack justify="space-between" w="100%">
              <VStack align="start" spacing={0}>
                <Text fontSize="sm" fontWeight="bold" color="white" fontFamily="mono">Microsoft / Office 365</Text>
                <Text fontSize="10px" color="gray.500" fontFamily="mono">OAuth2 — no password needed</Text>
              </VStack>
              {msConnected
                ? <Badge colorScheme="green" fontSize="9px" fontFamily="mono">CONNECTED</Badge>
                : <Badge colorScheme="blue" fontSize="9px" fontFamily="mono">RECOMMENDED</Badge>
              }
            </HStack>
            {!msConnected && (
              <Button size="sm" colorScheme="blue" fontFamily="mono" w="100%"
                onClick={connectMicrosoft} isLoading={connectingMs} loadingText="OPENING MICROSOFT...">
                🔐 CONNECT WITH MICROSOFT
              </Button>
            )}
            {msConnected && (
              <Button size="xs" variant="ghost" color="gray.500" fontFamily="mono"
                onClick={connectMicrosoft} isLoading={connectingMs}>
                Reconnect
              </Button>
            )}
          </VStack>
        </Box>
      )}

      {/* Manual IMAP section — always visible as fallback */}
      <Box>
        <Text fontSize="10px" color="gray.600" fontFamily="mono" mb={3} textTransform="uppercase" letterSpacing="wider">
          {detectedProvider === 'microsoft' ? '— or configure IMAP manually —' : 'IMAP Configuration'}
        </Text>
        <VStack spacing={3}>
          <Field label="IMAP Server" hint="Gmail: imap.gmail.com  |  Office 365: outlook.office365.com">
            <Input size="sm" bg="gray.800" borderColor="gray.700" color="white" fontFamily="mono"
              value={host} onChange={e => setHost(e.target.value)}
              _focus={{ borderColor: 'blue.400', boxShadow: 'none' }} />
          </Field>
          <Field label="Port" hint="Usually 993 for SSL">
            <Input size="sm" bg="gray.800" borderColor="gray.700" color="white" fontFamily="mono"
              value={port} onChange={e => setPort(e.target.value)}
              _focus={{ borderColor: 'blue.400', boxShadow: 'none' }} />
          </Field>
          <Field label="Password / App Password"
            hint="Gmail users: create an App Password at myaccount.google.com/apppasswords">
            <SecretInput value={pass} placeholder="App password or email password" onChange={setPass} />
          </Field>
        </VStack>
      </Box>

      <StatusBadge status={status} message={msg} />
      <HStack spacing={3} pt={2}>
        {!msConnected && (
          <Button size="sm" colorScheme="blue" fontFamily="mono" onClick={test}
            isLoading={status === 'loading'} loadingText="TESTING...">TEST IMAP</Button>
        )}
        {(status === 'ok' || msConnected) && (
          <Button size="sm" colorScheme="green" fontFamily="mono" onClick={onNext}>NEXT: AI SETUP</Button>
        )}
        <Button size="sm" variant="ghost" color="gray.500" fontFamily="mono" onClick={onNext}>SKIP</Button>
      </HStack>
    </VStack>
  );
}

function StepAI({ onNext }: { onNext: () => void }) {
  const [key, setKey] = useState('');
  const [provider, setProvider] = useState<'openai' | 'openrouter'>('openai');
  const [status, setStatus] = useState<Status>('idle');
  const [msg, setMsg] = useState('');
  const toast = useToast();
  const save = useCallback(async () => {
    if (!key) { toast({ title: 'Enter an API key', status: 'warning', duration: 2000, isClosable: true }); return; }
    setStatus('loading'); setMsg('');
    try {
      const field = provider === 'openai' ? 'openai_api_key' : 'openrouter_api_key';
      const r = await fetch(PM_API + '/api/settings', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: key }),
      });
      if (!r.ok) throw new Error(await r.text());
      setStatus('ok'); setMsg('API key saved');
    } catch (e: unknown) { setStatus('error'); setMsg(e instanceof Error ? e.message : 'Error'); }
  }, [key, provider, toast]);
  return (
    <VStack spacing={5} align="stretch">
      <VStack align="start" spacing={1}>
        <Text fontSize="lg" fontWeight="black" color="white" fontFamily="mono">Connect Your AI</Text>
        <Text fontSize="sm" color="gray.400">Signal uses AI to classify tickets and generate technician briefs. Bring your own API key - you control the costs.</Text>
      </VStack>
      <Field label="AI Provider">
        <HStack spacing={2}>
          {(['openai', 'openrouter'] as const).map(p => (
            <Button key={p} size="xs" fontFamily="mono"
              colorScheme={provider === p ? 'blue' : 'gray'}
              variant={provider === p ? 'solid' : 'outline'}
              onClick={() => setProvider(p)}>
              {p === 'openai' ? 'OPENAI (GPT-4o)' : 'OPENROUTER'}
            </Button>
          ))}
        </HStack>
      </Field>
      <Field label={provider === 'openai' ? 'OpenAI API Key' : 'OpenRouter API Key'}
        hint={provider === 'openai' ? 'Get key at platform.openai.com/api-keys' : 'Get key at openrouter.ai/keys'}>
        <SecretInput value={key} placeholder={provider === 'openai' ? 'sk-...' : 'sk-or-...'} onChange={setKey} />
      </Field>
      <StatusBadge status={status} message={msg} />
      <HStack spacing={3} pt={2}>
        <Button size="sm" colorScheme="blue" fontFamily="mono" onClick={save}
          isLoading={status === 'loading'} loadingText="SAVING...">SAVE AND CONTINUE</Button>
        {status === 'ok' && (
          <Button size="sm" colorScheme="green" fontFamily="mono" onClick={onNext}>NEXT: INTEGRATIONS</Button>
        )}
        <Button size="sm" variant="ghost" color="gray.500" fontFamily="mono" onClick={onNext}>SKIP</Button>
      </HStack>
    </VStack>
  );
}

function StepIntegrations({ onNext }: { onNext: () => void }) {
  const [discordToken, setDiscordToken] = useState('');
  const [discordChannel, setDiscordChannel] = useState('');
  const [saved, setSaved] = useState(false);
  const toast = useToast();
  const save = useCallback(async () => {
    try {
      await fetch(PM_API + '/api/settings', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discord_bot_token: discordToken, discord_channel_id: discordChannel }),
      });
      setSaved(true);
      toast({ title: 'Discord settings saved', status: 'success', duration: 2000, isClosable: true });
    } catch { toast({ title: 'Could not save', status: 'error', duration: 2000, isClosable: true }); }
  }, [discordToken, discordChannel, toast]);
  return (
    <VStack spacing={5} align="stretch">
      <VStack align="start" spacing={1}>
        <Text fontSize="lg" fontWeight="black" color="white" fontFamily="mono">Integrations</Text>
        <Text fontSize="sm" color="gray.400">These are optional and can be configured any time from Settings.</Text>
      </VStack>
      <Box p={4} bg="gray.800" borderRadius="md" border="1px solid" borderColor="gray.700">
        <HStack justify="space-between" mb={3}>
          <Text fontSize="sm" fontWeight="bold" color="white" fontFamily="mono">Discord</Text>
          <Badge colorScheme="gray" fontSize="9px" fontFamily="mono">OPTIONAL</Badge>
        </HStack>
        <Text fontSize="xs" color="gray.500" mb={3}>Get ticket alerts and use the Pilot AI bot in your Discord server.</Text>
        <VStack spacing={3}>
          <Field label="Bot Token" hint="discord.com/developers/applications > Bot > Token">
            <SecretInput value={discordToken} placeholder="MTxx..." onChange={setDiscordToken} />
          </Field>
          <Field label="Alert Channel ID" hint="Right-click channel > Copy Channel ID (enable Developer Mode first)">
            <Input size="sm" bg="gray.900" borderColor="gray.700" color="white" fontFamily="mono"
              value={discordChannel} placeholder="123456789012345678"
              onChange={e => setDiscordChannel(e.target.value)}
              _placeholder={{ color: 'gray.600' }} _focus={{ borderColor: 'blue.400', boxShadow: 'none' }} />
          </Field>
          {(discordToken || discordChannel) && (
            <Button size="xs" colorScheme="blue" fontFamily="mono" alignSelf="start" onClick={save}>SAVE DISCORD</Button>
          )}
        </VStack>
      </Box>
      <HStack spacing={3} pt={2}>
        <Button size="sm" colorScheme="green" fontFamily="mono" onClick={onNext}>
          {saved ? 'NEXT: LAUNCH' : 'SKIP: LAUNCH'}
        </Button>
      </HStack>
    </VStack>
  );
}

function StepLaunch() {
  const [ingesting, setIngesting] = useState(false);
  const [result, setResult] = useState<{ tickets?: number; emails?: number } | null>(null);
  const toast = useToast();
  const runIngest = useCallback(async () => {
    setIngesting(true);
    try {
      const r = await fetch('/api/ingest-email', { method: 'POST', credentials: 'include' });
      const d = await r.json();
      setResult({ tickets: d.tickets_imported || d.ticketsImported || 0, emails: d.emails_found || d.emailsFound || 0 });
      toast({ title: 'Ingestion started', status: 'success', duration: 3000, isClosable: true });
    } catch { toast({ title: 'Could not start ingestion', status: 'error', duration: 3000, isClosable: true }); }
    finally { setIngesting(false); }
  }, [toast]);
  return (
    <VStack spacing={6} align="stretch">
      <VStack align="start" spacing={1}>
        <Text fontSize="lg" fontWeight="black" color="white" fontFamily="mono">Ready to Launch</Text>
        <Text fontSize="sm" color="gray.400">Signal is configured. Run your first ingestion to pull in tickets and let the AI get to work.</Text>
      </VStack>
      <Box p={5} bg="gray.800" borderRadius="lg" border="1px solid" borderColor="green.800">
        <Text fontSize="xs" color="green.400" fontFamily="mono" letterSpacing="wider" mb={3}>WHAT HAPPENS NEXT</Text>
        <VStack align="start" spacing={2}>
          {[
            'Signal reads your inbox for support ticket emails',
            'AI classifies urgency and extracts client signals',
            'Tickets appear on your dashboard automatically',
            'Pilot AI is ready to brief your technicians',
          ].map(s => <Text key={s} fontSize="xs" color="gray.300" fontFamily="mono">{s}</Text>)}
        </VStack>
      </Box>
      {result && (
        <Box p={4} bg="gray.900" borderRadius="md" border="1px solid" borderColor="green.700">
          <HStack spacing={6}>
            <VStack spacing={0}>
              <Text fontSize="2xl" fontWeight="black" color="white" fontFamily="mono">{result.emails ?? 0}</Text>
              <Text fontSize="9px" color="gray.500" fontFamily="mono">EMAILS FOUND</Text>
            </VStack>
            <VStack spacing={0}>
              <Text fontSize="2xl" fontWeight="black" color="white" fontFamily="mono">{result.tickets ?? 0}</Text>
              <Text fontSize="9px" color="gray.500" fontFamily="mono">TICKETS IMPORTED</Text>
            </VStack>
          </HStack>
        </Box>
      )}
      <HStack spacing={3}>
        <Button size="sm" colorScheme="green" fontFamily="mono" onClick={runIngest}
          isLoading={ingesting} loadingText="INGESTING...">RUN FIRST INGESTION</Button>
        <Button size="sm" colorScheme="blue" fontFamily="mono"
          onClick={() => { window.location.href = '/pm'; }}>GO TO DASHBOARD</Button>
      </HStack>
      <Divider borderColor="gray.800" />
      <HStack>
        <Text fontSize="10px" color="gray.600" fontFamily="mono">Need advanced settings?</Text>
        <Text fontSize="10px" color="blue.500" fontFamily="mono" cursor="pointer"
          onClick={() => { window.location.href = '/pm/setup/advanced'; }}>OPEN ADVANCED SETUP</Text>
      </HStack>
    </VStack>
  );
}

export default function SetupWizard() {
  const [step, setStep] = useState(0);
  return (
    <Box minH="100vh" bg="gray.950" display="flex" alignItems="flex-start"
      justifyContent="center" pt={12} px={4}>
      <Box w="100%" maxW="560px">
        <VStack spacing={3} mb={8}>
          <HStack spacing={0} w="100%">
            {STEPS.map((s, i) => (
              <Box key={s} flex="1">
                <Box h="2px" bg={i <= step ? 'blue.500' : 'gray.800'} transition="background 0.3s" />
                <Text fontSize="9px" fontFamily="mono" textAlign="center" mt={1} letterSpacing="wider"
                  color={i === step ? 'blue.400' : i < step ? 'green.400' : 'gray.700'}>
                  {i < step ? 'DONE ' : ''}{s.toUpperCase()}
                </Text>
              </Box>
            ))}
          </HStack>
        </VStack>
        <Box p={6} bg="gray.900" borderRadius="xl" border="1px solid" borderColor="gray.800">
          {step === 0 && <StepEmail onNext={() => setStep(1)} />}
          {step === 1 && <StepAI onNext={() => setStep(2)} />}
          {step === 2 && <StepIntegrations onNext={() => setStep(3)} />}
          {step === 3 && <StepLaunch />}
        </Box>
        <HStack justify="center" spacing={2} mt={6}>
          {STEPS.map((_, i) => (
            <Box key={i} w={i === step ? '16px' : '8px'} h="2px"
              bg={i === step ? 'blue.500' : i < step ? 'green.500' : 'gray.700'}
              borderRadius="full" transition="all 0.2s" cursor="pointer"
              onClick={() => setStep(i)} />
          ))}
        </HStack>
      </Box>
    </Box>
  );
}
