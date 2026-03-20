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
type Provider = 'microsoft' | 'google' | 'imap';
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

// ──────────────────────────────────────────────────────────────────────────────
// Provider card button
// ──────────────────────────────────────────────────────────────────────────────
function ProviderCard({
  id, icon, label, sub, badge, badgeColor, selected, onClick,
}: {
  id: Provider; icon: string; label: string; sub: string;
  badge?: string; badgeColor?: string; selected: boolean; onClick: () => void;
}) {
  return (
    <Box
      flex="1" p={3} borderRadius="md" cursor="pointer"
      border="1px solid"
      borderColor={selected ? 'blue.500' : 'gray.700'}
      bg={selected ? 'gray.800' : 'gray.900'}
      _hover={{ borderColor: selected ? 'blue.400' : 'gray.600', bg: 'gray.800' }}
      transition="all 0.15s"
      onClick={onClick}
    >
      <VStack align="start" spacing={1}>
        <HStack justify="space-between" w="100%">
          <Text fontSize="lg">{icon}</Text>
          {badge && (
            <Badge colorScheme={badgeColor || 'gray'} fontSize="8px" fontFamily="mono">
              {badge}
            </Badge>
          )}
        </HStack>
        <Text fontSize="xs" fontWeight="bold" color={selected ? 'white' : 'gray.300'}
          fontFamily="mono" lineHeight="tight">{label}</Text>
        <Text fontSize="9px" color="gray.500" fontFamily="mono">{sub}</Text>
      </VStack>
    </Box>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// StepEmail — three-path provider selector
// ──────────────────────────────────────────────────────────────────────────────
function StepEmail({ onNext }: { onNext: () => void }) {
  // IMAP fields (Google / manual IMAP)
  const [host, setHost] = useState('imap.gmail.com');
  const [port, setPort] = useState('993');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [testStatus, setTestStatus] = useState<Status>('idle');
  const [testMsg, setTestMsg] = useState('');

  // Provider selection
  const [selectedProvider, setSelectedProvider] = useState<Provider>('microsoft');

  // Microsoft OAuth state
  const [detectedProvider, setDetectedProvider] = useState<Provider | null>(null);
  const [detectingProvider, setDetectingProvider] = useState(false);
  const [msConnected, setMsConnected] = useState(false);
  const [msMailbox, setMsMailbox] = useState('');
  const [msError, setMsError] = useState('');
  const [authError, setAuthError] = useState(false);
  const [tenantSlug, setTenantSlug] = useState('');
  const [connectingMs, setConnectingMs] = useState(false);
  const [showAdminHelp, setShowAdminHelp] = useState(false);

  // Setup status (for connection panel)
  const [setupStatus, setSetupStatus] = useState<{
    imap_connected?: boolean;
    connection_status?: string;
    imap_config?: { provider?: string; mailbox?: string; host?: string };
  } | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const toast = useToast();

  // ── On mount ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Handle OAuth callback URL params
    const params = new URLSearchParams(window.location.search);
    if (params.get('ms_connected') === '1') {
      setMsConnected(true);
    }
    const errParam = params.get('ms_error');
    if (errParam) {
      setMsError(decodeURIComponent(errParam));
    }

    // Fetch tenant slug
    fetch(PM_API + '/api/auth/me', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.slug) setTenantSlug(d.slug); })
      .catch(() => {});

    // Fetch setup status → derive selected provider + connected state
    setStatusLoading(true);
    fetch(PM_API + '/api/setup/status', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) return;
        setSetupStatus(d);

        const cfg = d.imap_config || {};
        const connStatus = d.connection_status;

        if (connStatus === 'auth_error') setAuthError(true);

        // Derive which provider panel to open
        if (cfg.provider === 'microsoft_graph') {
          setSelectedProvider('microsoft');
          setMsConnected(true);
          setMsMailbox(cfg.mailbox || '');
          if (cfg.mailbox) setEmail(cfg.mailbox);
        } else if (cfg.host === 'imap.gmail.com') {
          setSelectedProvider('google');
          setHost('imap.gmail.com');
          setPort('993');
          if (cfg.mailbox || (d as Record<string, unknown>).imap_user) {
            setEmail((cfg.mailbox || (d as Record<string, unknown>).imap_user) as string);
          }
        } else if (cfg.host) {
          setSelectedProvider('imap');
          setHost(cfg.host);
          setPort(String(cfg.port || '993'));
        }
      })
      .catch(() => {})
      .finally(() => setStatusLoading(false));
  }, []);

  // ── Provider detection from email ─────────────────────────────────────────
  const detectProvider = useCallback(async (emailVal: string) => {
    if (!emailVal || !emailVal.includes('@')) { setDetectedProvider(null); return; }
    setDetectingProvider(true);
    try {
      const r = await fetch(`/api/auth/detect-provider?email=${encodeURIComponent(emailVal)}`);
      const d = await r.json();
      const p: Provider = d.provider === 'microsoft' ? 'microsoft' : d.provider === 'google' ? 'google' : 'imap';
      setDetectedProvider(p);
      // Note: we intentionally do NOT auto-switch selectedProvider here.
      // The user manually chose a provider card — detection only drives hint text.
    } catch { setDetectedProvider(null); }
    finally { setDetectingProvider(false); }
  }, []);

  useEffect(() => {
    if (!email) { setDetectedProvider(null); return; }
    const t = setTimeout(() => detectProvider(email), 700);
    return () => clearTimeout(t);
  }, [email, detectProvider]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const connectMicrosoft = useCallback(async () => {
    if (!tenantSlug) {
      toast({ title: 'Cannot determine tenant. Please refresh.', status: 'warning', duration: 3000, isClosable: true });
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
    } catch {
      toast({ title: 'Error starting Microsoft auth', status: 'error', duration: 3000, isClosable: true });
    } finally {
      setConnectingMs(false);
    }
  }, [tenantSlug, toast]);

  const testImap = useCallback(async () => {
    if (!email || !pass) {
      toast({ title: 'Fill in email and password', status: 'warning', duration: 2000, isClosable: true });
      return;
    }
    setTestStatus('loading'); setTestMsg('');
    try {
      await fetch(PM_API + '/api/settings', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: { imap_host: host, imap_port: port, imap_user: email, imap_pass: pass } }),
      });
      const r2 = await fetch(PM_API + '/api/imap/test', { method: 'POST', credentials: 'include' });
      const d = await r2.json();
      if (d.success || d.ok) { setTestStatus('ok'); setTestMsg(d.message || 'Inbox reachable'); }
      else { setTestStatus('error'); setTestMsg(d.error || d.detail || 'Could not connect'); }
    } catch (e: unknown) { setTestStatus('error'); setTestMsg(e instanceof Error ? e.message : 'Error'); }
  }, [host, port, email, pass, toast]);

  const triggerSync = useCallback(async () => {
    setSyncing(true);
    try {
      await fetch(PM_API + '/api/ingest/email', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      toast({ title: 'Sync triggered — check back in ~30s', status: 'success', duration: 3000, isClosable: true });
    } catch {
      toast({ title: 'Could not trigger sync', status: 'error', duration: 2000, isClosable: true });
    } finally {
      setSyncing(false);
    }
  }, [toast]);

  // ── Derived display values ─────────────────────────────────────────────────
  const cfg = setupStatus?.imap_config || {};
  const connStatus = setupStatus?.connection_status;
  const isConnected = setupStatus?.imap_connected === true || msConnected;

  const providerLabel =
    cfg.provider === 'microsoft_graph' ? 'Microsoft Graph' :
    cfg.host === 'imap.gmail.com' ? 'Google / Gmail' :
    cfg.host ? `IMAP · ${cfg.host}` : 'Unknown';

  const connectedMailbox = msMailbox || cfg.mailbox || '';

  // Is Microsoft already connected?
  const msAlreadyConnected = msConnected || cfg.provider === 'microsoft_graph';

  return (
    <VStack spacing={5} align="stretch">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <VStack align="start" spacing={1}>
        <Text fontSize="lg" fontWeight="black" color="white" fontFamily="mono">CONNECT YOUR INBOX</Text>
        <Text fontSize="sm" color="gray.400">
          Signal reads your support email to automatically capture and analyze tickets.
          We only read — never send.
        </Text>
      </VStack>

      {/* ── Connection status panel ──────────────────────────────────────── */}
      {statusLoading ? (
        <Box p={3} bg="gray.800" borderRadius="md" border="1px solid" borderColor="gray.700">
          <HStack spacing={2}>
            <Spinner size="xs" color="gray.500" />
            <Text fontSize="xs" color="gray.600" fontFamily="mono">Checking connection status...</Text>
          </HStack>
        </Box>
      ) : authError && !msAlreadyConnected ? (
        /* Auth error state */
        <Box p={3} bg="orange.900" borderRadius="md" border="1px solid" borderColor="orange.700">
          <HStack justify="space-between">
            <VStack align="start" spacing={0}>
              <HStack>
                <Badge colorScheme="orange" fontSize="9px" fontFamily="mono">AUTH ERROR</Badge>
                <Text fontSize="xs" color="orange.300" fontFamily="mono">
                  ⚠️ Microsoft connection needs reauthorization
                </Text>
              </HStack>
              <Text fontSize="10px" color="gray.500" fontFamily="mono">
                Provider: microsoft_graph | Status: auth_error
              </Text>
            </VStack>
            <Button size="xs" colorScheme="orange" fontFamily="mono"
              onClick={connectMicrosoft} isLoading={connectingMs} loadingText="CONNECTING...">
              RECONNECT →
            </Button>
          </HStack>
        </Box>
      ) : isConnected ? (
        /* Connected state */
        <Box p={3} bg="gray.800" borderRadius="md" border="1px solid" borderColor="green.800">
          <HStack justify="space-between">
            <VStack align="start" spacing={0}>
              <HStack>
                <Badge colorScheme="green" fontSize="9px" fontFamily="mono">CONNECTED</Badge>
                <Text fontSize="xs" color="gray.300" fontFamily="mono">
                  {providerLabel}{connectedMailbox ? ` · ${connectedMailbox}` : ''}
                </Text>
              </HStack>
              <Text fontSize="10px" color="gray.500" fontFamily="mono">
                Provider: {cfg.provider || 'imap'} | Status: {connStatus || 'connected'}
              </Text>
            </VStack>
            <Button size="xs" colorScheme="blue" fontFamily="mono"
              onClick={triggerSync} isLoading={syncing} loadingText="SYNCING...">
              SYNC NOW
            </Button>
          </HStack>
        </Box>
      ) : (
        /* Not connected */
        <Box p={3} bg="gray.800" borderRadius="md" border="1px solid" borderColor="gray.700">
          <Text fontSize="xs" color="gray.500" fontFamily="mono">No email source connected</Text>
        </Box>
      )}

      {/* ── OAuth success/error banners ──────────────────────────────────── */}
      {msConnected && !msError && (
        <Box p={2} bg="green.900" borderRadius="md" border="1px solid" borderColor="green.700">
          <Text fontSize="xs" color="green.300" fontFamily="mono">
            ✅ Microsoft mailbox connected{connectedMailbox ? ` — ${connectedMailbox}` : ''}
          </Text>
        </Box>
      )}
      {msError && (
        <Box p={2} bg="red.900" borderRadius="md" border="1px solid" borderColor="red.700">
          <Text fontSize="xs" color="red.300" fontFamily="mono">❌ Microsoft error: {msError}</Text>
        </Box>
      )}

      {/* ── Provider selector ────────────────────────────────────────────── */}
      <VStack align="stretch" spacing={2}>
        <Text fontSize="9px" color="gray.600" fontFamily="mono" textTransform="uppercase" letterSpacing="wider">
          SELECT PROVIDER
        </Text>
        <HStack spacing={2} align="stretch">
          <ProviderCard
            id="microsoft"
            icon="🔷"
            label="MICROSOFT / OFFICE 365"
            sub="OAuth2 — no password"
            badge={msAlreadyConnected ? 'CONNECTED' : 'RECOMMENDED'}
            badgeColor={msAlreadyConnected ? 'green' : 'blue'}
            selected={selectedProvider === 'microsoft'}
            onClick={() => setSelectedProvider('microsoft')}
          />
          <ProviderCard
            id="google"
            icon="🔴"
            label="GOOGLE / GMAIL"
            sub="App Password"
            badge={cfg.host === 'imap.gmail.com' && isConnected ? 'CONNECTED' : undefined}
            badgeColor="green"
            selected={selectedProvider === 'google'}
            onClick={() => { setSelectedProvider('google'); setHost('imap.gmail.com'); setPort('993'); }}
          />
          <ProviderCard
            id="imap"
            icon="🔲"
            label="MANUAL IMAP"
            sub="Custom server"
            badge="LEGACY"
            badgeColor="gray"
            selected={selectedProvider === 'imap'}
            onClick={() => setSelectedProvider('imap')}
          />
        </HStack>
      </VStack>

      <Divider borderColor="gray.800" />

      {/* ── Microsoft panel ──────────────────────────────────────────────── */}
      {selectedProvider === 'microsoft' && (
        <VStack spacing={3} align="stretch">
          <Field label="Email Address">
            <HStack spacing={2}>
              <Input size="sm" bg="gray.800" borderColor="gray.700" color="white" fontFamily="mono"
                type="email" value={email} placeholder="you@yourcompany.com"
                onChange={e => setEmail(e.target.value)}
                _placeholder={{ color: 'gray.600' }} _focus={{ borderColor: 'blue.400', boxShadow: 'none' }} />
              {detectingProvider && <Spinner size="xs" color="gray.500" />}
            </HStack>
            {detectedProvider && detectedProvider !== 'microsoft' && (
              <Text fontSize="10px" color="orange.400" fontFamily="mono" mt={1}>
                ↑ Domain looks like {detectedProvider} — consider switching provider above
              </Text>
            )}
          </Field>

          {msAlreadyConnected ? (
            <VStack align="stretch" spacing={2}>
              <Box p={3} bg="gray.800" borderRadius="md" border="1px solid" borderColor="green.700">
                <HStack justify="space-between">
                  <Text fontSize="xs" color="green.300" fontFamily="mono">
                    ✅ Connected as {connectedMailbox || email}
                  </Text>
                  <Button size="xs" variant="ghost" color="gray.500" fontFamily="mono"
                    onClick={connectMicrosoft} isLoading={connectingMs}>
                    Reconnect
                  </Button>
                </HStack>
              </Box>
            </VStack>
          ) : (
            <Button size="sm" colorScheme="blue" fontFamily="mono" w="100%"
              onClick={connectMicrosoft} isLoading={connectingMs} loadingText="OPENING MICROSOFT...">
              🔐 CONNECT WITH MICROSOFT
            </Button>
          )}

          <VStack spacing={2} align="stretch">
            <Box p={3} bg="gray.900" borderRadius="md" border="1px solid" borderColor="gray.800">
              <Text fontSize="10px" color="gray.500" fontFamily="mono">
                ℹ️ Microsoft disabled Basic Auth (IMAP password login) in Oct 2022.
                OAuth is required for all M365 and Outlook accounts.
              </Text>
            </Box>

            {/* Admin consent help section */}
            <Box p={3} bg="gray.900" borderRadius="md" border="1px solid" borderColor="blue.900">
              <HStack justify="space-between" mb={showAdminHelp ? 3 : 0}>
                <HStack spacing={2}>
                  <Text fontSize="10px" color="blue.400" fontFamily="mono">🔑 IT ADMIN?</Text>
                  <Text fontSize="10px" color="gray.500" fontFamily="mono">
                    Your org may require admin consent before users can connect.
                  </Text>
                </HStack>
                <Button size="xs" variant="ghost" color="blue.400" fontFamily="mono"
                  onClick={() => setShowAdminHelp(s => !s)}>
                  {showAdminHelp ? 'HIDE ▲' : 'SHOW ▼'}
                </Button>
              </HStack>

              {showAdminHelp && (
                <VStack align="stretch" spacing={3}>
                  <Text fontSize="10px" color="gray.400" fontFamily="mono">
                    If users see an &quot;Admin approval required&quot; message during sign-in,
                    a Global Admin for your Microsoft 365 organization must grant
                    one-time consent for Signal. This only needs to be done once per org.
                  </Text>

                  <VStack align="stretch" spacing={1}>
                    <Text fontSize="9px" color="gray.600" fontFamily="mono" textTransform="uppercase" letterSpacing="wider">
                      ADMIN CONSENT URL — open this as your org&apos;s Global Admin:
                    </Text>
                    <Box
                      p={2}
                      bg="gray.800"
                      borderRadius="sm"
                      border="1px solid"
                      borderColor="gray.700"
                      cursor="pointer"
                      onClick={() => {
                        const domain = email?.includes('@')
                          ? email.split('@')[1]
                          : 'yourdomain.com';
                        const url = `https://login.microsoftonline.com/${domain}/adminconsent?client_id=77bfb03f-7a7f-479d-8c9b-98dc27d4afb1&redirect_uri=https://api.fieldstone.pro/api/auth/microsoft/callback`;
                        navigator.clipboard?.writeText(url).catch(() => {});
                        window.open(url, '_blank');
                      }}
                    >
                      <Text fontSize="9px" color="blue.300" fontFamily="mono" wordBreak="break-all">
                        {`https://login.microsoftonline.com/${
                          email?.includes('@')
                            ? email.split('@')[1]
                            : 'yourdomain.com'
                        }/adminconsent?client_id=77bfb03f-7a7f-479d-8c9b-98dc27d4afb1&redirect_uri=https://api.fieldstone.pro/api/auth/microsoft/callback`}
                      </Text>
                    </Box>
                    <Text fontSize="9px" color="gray.600" fontFamily="mono">
                      ↑ Click to open in new tab — also copies to clipboard. Replace domain if needed.
                    </Text>
                  </VStack>

                  <HStack spacing={2}>
                    <Button
                      size="xs"
                      colorScheme="blue"
                      variant="outline"
                      fontFamily="mono"
                      onClick={() => {
                        const domain = email?.includes('@')
                          ? email.split('@')[1]
                          : 'yourdomain.com';
                        const url = `https://login.microsoftonline.com/${domain}/adminconsent?client_id=77bfb03f-7a7f-479d-8c9b-98dc27d4afb1&redirect_uri=https://api.fieldstone.pro/api/auth/microsoft/callback`;
                        window.open(url, '_blank');
                      }}
                    >
                      OPEN CONSENT PAGE →
                    </Button>
                    <Button
                      size="xs"
                      variant="ghost"
                      color="gray.500"
                      fontFamily="mono"
                      onClick={() => {
                        const domain = email?.includes('@')
                          ? email.split('@')[1]
                          : 'yourdomain.com';
                        const url = `https://login.microsoftonline.com/${domain}/adminconsent?client_id=77bfb03f-7a7f-479d-8c9b-98dc27d4afb1&redirect_uri=https://api.fieldstone.pro/api/auth/microsoft/callback`;
                        navigator.clipboard?.writeText(url).catch(() => {});
                      }}
                    >
                      COPY URL
                    </Button>
                  </HStack>
                </VStack>
              )}
            </Box>
          </VStack>
        </VStack>
      )}

      {/* ── Google / Gmail panel ─────────────────────────────────────────── */}
      {selectedProvider === 'google' && (
        <VStack spacing={3} align="stretch">
          <Field label="Gmail Address">
            <HStack spacing={2}>
              <Input size="sm" bg="gray.800" borderColor="gray.700" color="white" fontFamily="mono"
                type="email" value={email} placeholder="support@yourcompany.com"
                onChange={e => setEmail(e.target.value)}
                _placeholder={{ color: 'gray.600' }} _focus={{ borderColor: 'blue.400', boxShadow: 'none' }} />
              {detectingProvider && <Spinner size="xs" color="gray.500" />}
            </HStack>
            {detectedProvider === 'microsoft' && (
              <Text fontSize="10px" color="orange.400" fontFamily="mono" mt={1}>
                ↑ Microsoft domain detected — use the Microsoft tab instead
              </Text>
            )}
          </Field>
          <HStack spacing={3}>
            <Field label="IMAP Host">
              <Input size="sm" bg="gray.800" borderColor="gray.700" color="white" fontFamily="mono"
                value={host} onChange={e => setHost(e.target.value)}
                _focus={{ borderColor: 'blue.400', boxShadow: 'none' }} />
            </Field>
            <Field label="Port">
              <Input size="sm" bg="gray.800" borderColor="gray.700" color="white" fontFamily="mono"
                value={port} onChange={e => setPort(e.target.value)}
                _focus={{ borderColor: 'blue.400', boxShadow: 'none' }} />
            </Field>
          </HStack>
          <Field
            label="App Password"
            hint="Create at myaccount.google.com/apppasswords — requires 2FA enabled on your Google account">
            <SecretInput value={pass} placeholder="xxxx xxxx xxxx xxxx" onChange={setPass} />
          </Field>
          <StatusBadge status={testStatus} message={testMsg} />
          <Button size="sm" colorScheme="blue" fontFamily="mono"
            onClick={testImap} isLoading={testStatus === 'loading'} loadingText="TESTING...">
            TEST CONNECTION
          </Button>
        </VStack>
      )}

      {/* ── Manual IMAP panel ────────────────────────────────────────────── */}
      {selectedProvider === 'imap' && (
        <VStack spacing={3} align="stretch">
          <Box p={3} bg="gray.900" borderRadius="md" border="1px solid" borderColor="orange.800">
            <Text fontSize="10px" color="orange.400" fontFamily="mono">
              ⚠️ Microsoft 365 accounts cannot use IMAP — Basic Auth was permanently disabled
              in Oct 2022. Use the Microsoft option above for any @outlook.com, @hotmail.com,
              or Office 365 mailboxes.
            </Text>
          </Box>
          <Field label="IMAP Server" hint="Gmail: imap.gmail.com  |  Office 365: outlook.office365.com">
            <Input size="sm" bg="gray.800" borderColor="gray.700" color="white" fontFamily="mono"
              value={host} onChange={e => setHost(e.target.value)}
              _focus={{ borderColor: 'blue.400', boxShadow: 'none' }} />
          </Field>
          <Field label="Port" hint="Usually 993 for SSL/TLS">
            <Input size="sm" bg="gray.800" borderColor="gray.700" color="white" fontFamily="mono"
              value={port} onChange={e => setPort(e.target.value)}
              _focus={{ borderColor: 'blue.400', boxShadow: 'none' }} />
          </Field>
          <Field label="Email Address">
            <HStack spacing={2}>
              <Input size="sm" bg="gray.800" borderColor="gray.700" color="white" fontFamily="mono"
                type="email" value={email} placeholder="support@yourcompany.com"
                onChange={e => setEmail(e.target.value)}
                _placeholder={{ color: 'gray.600' }} _focus={{ borderColor: 'blue.400', boxShadow: 'none' }} />
              {detectingProvider && <Spinner size="xs" color="gray.500" />}
            </HStack>
            {detectedProvider === 'microsoft' && (
              <Text fontSize="10px" color="orange.400" fontFamily="mono" mt={1}>
                ↑ Microsoft domain detected — switch to the Microsoft tab above
              </Text>
            )}
          </Field>
          <Field label="Password / App Password"
            hint="Gmail users: create an App Password at myaccount.google.com/apppasswords">
            <SecretInput value={pass} placeholder="App password or mail password" onChange={setPass} />
          </Field>
          <StatusBadge status={testStatus} message={testMsg} />
          <Button size="sm" colorScheme="blue" fontFamily="mono"
            onClick={testImap} isLoading={testStatus === 'loading'} loadingText="TESTING...">
            TEST IMAP
          </Button>
        </VStack>
      )}

      {/* ── Navigation ───────────────────────────────────────────────────── */}
      <HStack spacing={3} pt={2}>
        {(testStatus === 'ok' || msAlreadyConnected) && (
          <Button size="sm" colorScheme="green" fontFamily="mono" onClick={onNext}>
            NEXT: AI SETUP
          </Button>
        )}
        <Button size="sm" variant="ghost" color="gray.500" fontFamily="mono" onClick={onNext}>
          SKIP
        </Button>
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
