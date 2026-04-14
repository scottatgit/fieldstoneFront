'use client';
import {
  Box, VStack, Text, HStack, Badge, Button, Input,
  Alert, AlertIcon, AlertDescription, Code, Divider,
  SimpleGrid, Spinner, useToast, Collapse,
} from '@chakra-ui/react';
import { useState, useEffect, useCallback } from 'react';
import * as QRCode from 'qrcode';

// ── Types ──────────────────────────────────────────────────────────────────
interface MfaStatus { mfa_enabled: boolean; recovery_codes_remaining: number; }
type Step = 'status' | 'setup' | 'recovery' | 'disable';

type FetchFn = (endpoint: string, options?: RequestInit) => Promise<unknown>;

interface MfaSettingsProps {
  /** Authenticated fetch function — should send cookie/credentials automatically */
  fetchFn: FetchFn;
  /** Optional: show the break-glass note (platform admin only). Default false. */
  showBreakGlassNote?: boolean;
  /** Optional: label shown in the header badge. Omit for no badge. */
  roleBadge?: string;
  /** Optional: subtitle line. Default: 'Account authentication settings' */
  subtitle?: string;
}

/**
 * MfaSettings — shared TOTP MFA management UI.
 * FST-034-MFA-ALL-USERS Phase 2 — available to all authenticated users.
 *
 * Caller provides fetchFn (cookie-authenticated). No role guard here —
 * that is the responsibility of the parent page.
 */
export default function MfaSettings({
  fetchFn,
  showBreakGlassNote = false,
  roleBadge,
  subtitle = 'Account authentication settings',
}: MfaSettingsProps) {
  const toast = useToast();

  const [step, setStep]                 = useState<Step>('status');
  const [status, setStatus]             = useState<MfaStatus | null>(null);
  const [loading, setLoading]           = useState(true);
  const [otpauthUri, setOtpauthUri]     = useState('');
  const [manualSecret, setManualSecret] = useState('');
  const [qrDataUrl, setQrDataUrl]       = useState('');
  const [showUri, setShowUri]           = useState(false);
  const [copied, setCopied]             = useState(false);
  const [code, setCode]                 = useState('');
  const [disableCode, setDisableCode]   = useState('');
  const [recoveryCodes, setRecovery]    = useState<string[]>([]);
  const [error, setError]               = useState('');
  const [busy, setBusy]                 = useState(false);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      const d = await fetchFn('/api/auth/mfa/status') as MfaStatus;
      setStatus(d);
    } catch { setStatus(null); }
    finally { setLoading(false); }
  }, [fetchFn]);

  useEffect(() => { void loadStatus(); }, [loadStatus]);

  async function startSetup() {
    setBusy(true); setError(''); setQrDataUrl(''); setShowUri(false); setCopied(false);
    try {
      const d = await fetchFn('/api/auth/mfa/setup', { method: 'POST' }) as
        { otpauth_uri: string; manual_secret?: string };
      const uri = d.otpauth_uri;
      setOtpauthUri(uri);
      const m = uri.match(/secret=([A-Z2-7]+)/i);
      setManualSecret(m ? m[1] : (d.manual_secret ?? ''));
      setCode('');
      try {
        const dataUrl = await QRCode.toDataURL(uri, {
          width: 240, margin: 2,
          color: { dark: '#000000', light: '#ffffff' },
        }) as string;
        setQrDataUrl(dataUrl);
      } catch { /* QR generation failed — manual secret shown as fallback */ }
      setStep('setup');
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Setup failed'); }
    finally { setBusy(false); }
  }

  async function confirmMfa() {
    if (!code.trim()) { setError('Enter the 6-digit code from your authenticator app.'); return; }
    setBusy(true); setError('');
    try {
      const d = await fetchFn('/api/auth/mfa/confirm', {
        method: 'POST',
        body: JSON.stringify({ code: code.trim() }),
      }) as { mfa_enabled: boolean; recovery_codes: string[] };
      setRecovery(d.recovery_codes ?? []);
      setStep('recovery');
      void loadStatus();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Verification failed — check code and try again');
    } finally { setBusy(false); }
  }

  async function disableMfa() {
    if (!disableCode.trim()) { setError('Enter your current TOTP code to confirm disable.'); return; }
    setBusy(true); setError('');
    try {
      await fetchFn('/api/auth/mfa/disable', {
        method: 'POST',
        body: JSON.stringify({ code: disableCode.trim() }),
      });
      toast({ title: 'MFA disabled', status: 'warning', duration: 4000 });
      setStep('status'); setDisableCode('');
      void loadStatus();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Disable failed — check TOTP code');
    } finally { setBusy(false); }
  }

  function copySecret() {
    navigator.clipboard.writeText(manualSecret)
      .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); })
      .catch(() => {});
  }

  return (
    <Box p={6} maxW="860px" mx="auto">
      <VStack spacing={6} align="stretch">

        {/* Header */}
        <HStack justify="space-between">
          <VStack align="start" spacing={0}>
            <Text fontSize="xl" fontWeight="black" color="white" fontFamily="mono"
              letterSpacing="wider">SECURITY</Text>
            <Text fontSize="xs" color="gray.500" fontFamily="mono">{subtitle}</Text>
          </VStack>
          {roleBadge && (
            <Badge colorScheme="blue" fontSize="xs" fontFamily="mono" px={3} py={1}>
              {roleBadge}
            </Badge>
          )}
        </HStack>

        {/* Status Card */}
        {loading ? (
          <Box p={6} bg="gray.900" borderRadius="md" border="1px solid" borderColor="gray.800">
            <HStack>
              <Spinner size="sm" color="orange.400" />
              <Text fontSize="sm" color="gray.500" fontFamily="mono">Loading...</Text>
            </HStack>
          </Box>
        ) : step === 'status' && (
          <Box p={5} bg="gray.900" borderRadius="md" border="1px solid"
            borderColor={status?.mfa_enabled ? 'green.800' : 'yellow.800'}>
            <VStack spacing={4} align="stretch">
              <HStack justify="space-between">
                <VStack align="start" spacing={0}>
                  <Text fontSize="sm" fontWeight="bold" color="white" fontFamily="mono">
                    TWO-FACTOR AUTHENTICATION
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    TOTP via Google Authenticator, Authy, or compatible app
                  </Text>
                </VStack>
                <Badge colorScheme={status?.mfa_enabled ? 'green' : 'yellow'}
                  fontFamily="mono" fontSize="xs" px={3} py={1}>
                  {status?.mfa_enabled ? 'ENABLED' : 'NOT ENABLED'}
                </Badge>
              </HStack>

              {status?.mfa_enabled && (
                <Box>
                  <Text fontSize="xs" color="gray.500" fontFamily="mono">
                    RECOVERY CODES REMAINING
                  </Text>
                  <Text fontSize="lg" fontWeight="bold" fontFamily="mono"
                    color={status.recovery_codes_remaining < 3 ? 'red.400' : 'white'}>
                    {status.recovery_codes_remaining} / 8
                  </Text>
                </Box>
              )}

              <Divider borderColor="gray.800" />

              {status?.mfa_enabled ? (
                <Button size="sm" colorScheme="red" variant="outline" fontFamily="mono"
                  fontSize="xs" letterSpacing="wider" alignSelf="start"
                  onClick={() => { setStep('disable'); setError(''); }}>
                  DISABLE MFA
                </Button>
              ) : (
                <VStack align="start" spacing={3}>
                  <Text fontSize="xs" color="gray.400">
                    MFA is not enabled. Enable it to require a one-time code at every login.
                  </Text>
                  <Button size="sm" colorScheme="orange" fontFamily="mono" fontSize="xs"
                    letterSpacing="wider" onClick={startSetup} isLoading={busy}>
                    SET UP MFA
                  </Button>
                </VStack>
              )}
            </VStack>
          </Box>
        )}

        {/* Setup Step */}
        {step === 'setup' && (
          <Box p={5} bg="gray.900" borderRadius="md" border="1px solid" borderColor="orange.800">
            <VStack spacing={6} align="stretch">
              <Text fontSize="sm" fontWeight="bold" color="white" fontFamily="mono">
                STEP 1 - ADD TO AUTHENTICATOR APP
              </Text>

              <VStack spacing={3} align="center">
                <Text fontSize="xs" color="gray.400" textAlign="center" maxW="380px">
                  Scan this QR code with{' '}
                  <Text as="span" color="orange.300" fontWeight="bold">Google Authenticator</Text>,{' '}
                  <Text as="span" color="orange.300" fontWeight="bold">Authy</Text>,{' '}
                  <Text as="span" color="orange.300" fontWeight="bold">1Password</Text>,
                  or any TOTP-compatible app.
                </Text>

                {qrDataUrl ? (
                  <Box bg="white" p={3} borderRadius="lg" border="3px solid"
                    borderColor="orange.400" display="inline-block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={qrDataUrl} alt="MFA QR Code" width={240} height={240} />
                  </Box>
                ) : (
                  <Box p={6} bg="gray.800" borderRadius="md" border="1px dashed"
                    borderColor="gray.600" textAlign="center">
                    <Text fontSize="xs" color="gray.500" fontFamily="mono">
                      QR unavailable — use manual entry below
                    </Text>
                  </Box>
                )}
              </VStack>

              <Divider borderColor="gray.800" />

              <VStack align="start" spacing={2}>
                <Text fontSize="xs" color="gray.500" fontFamily="mono">
                  MANUAL ENTRY — if you cannot scan the QR code
                </Text>
                <HStack w="full">
                  <Code flex={1} fontSize="sm" fontWeight="bold" color="orange.200"
                    bg="gray.800" p={3} borderRadius="sm" letterSpacing="widest"
                    display="block" wordBreak="break-all">
                    {manualSecret}
                  </Code>
                  <Button size="sm" variant="outline"
                    colorScheme={copied ? 'green' : 'gray'}
                    fontFamily="mono" fontSize="xs" minW="74px"
                    onClick={copySecret}>
                    {copied ? 'COPIED!' : 'COPY'}
                  </Button>
                </HStack>
              </VStack>

              <Box>
                <Button size="xs" variant="ghost" color="gray.600" fontFamily="mono"
                  fontSize="xs" onClick={() => setShowUri(v => !v)}>
                  {showUri ? 'hide raw URI' : 'advanced: copy raw otpauth:// URI'}
                </Button>
                <Collapse in={showUri} animateOpacity>
                  <Box mt={2}>
                    <Code fontSize="xs" color="gray.400" bg="gray.800" p={3}
                      borderRadius="sm" display="block"
                      whiteSpace="pre-wrap" wordBreak="break-all">
                      {otpauthUri}
                    </Code>
                  </Box>
                </Collapse>
              </Box>

              <Divider borderColor="gray.800" />

              <Text fontSize="sm" fontWeight="bold" color="white" fontFamily="mono">
                STEP 2 - VERIFY CODE
              </Text>
              <Text fontSize="xs" color="gray.400">
                After scanning, enter the 6-digit code shown in your authenticator app.
              </Text>

              <Input
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000" maxLength={6} fontFamily="mono" fontSize="xl"
                textAlign="center" letterSpacing="widest" bg="gray.800"
                border="1px solid" borderColor="gray.600" color="white"
                _placeholder={{ color: 'gray.600' }}
                onKeyDown={e => e.key === 'Enter' && void confirmMfa()}
              />

              {error && (
                <Alert status="error" bg="red.900" borderRadius="sm"
                  border="1px solid" borderColor="red.700">
                  <AlertIcon />
                  <AlertDescription fontSize="xs" fontFamily="mono">{error}</AlertDescription>
                </Alert>
              )}

              <HStack>
                <Button size="sm" colorScheme="orange" fontFamily="mono" fontSize="xs"
                  letterSpacing="wider" onClick={confirmMfa} isLoading={busy}
                  isDisabled={code.length !== 6}>
                  CONFIRM &amp; ENABLE MFA
                </Button>
                <Button size="sm" variant="ghost" color="gray.500" fontFamily="mono"
                  fontSize="xs" onClick={() => { setStep('status'); setError(''); }}>
                  CANCEL
                </Button>
              </HStack>
            </VStack>
          </Box>
        )}

        {/* Recovery Codes */}
        {step === 'recovery' && (
          <Box p={5} bg="gray.900" borderRadius="md" border="1px solid" borderColor="green.800">
            <VStack spacing={4} align="stretch">
              <Text fontSize="sm" fontWeight="bold" color="green.300" fontFamily="mono">
                MFA ENABLED
              </Text>
              <Alert status="warning" bg="yellow.900" borderRadius="sm"
                border="1px solid" borderColor="yellow.700">
                <AlertIcon />
                <AlertDescription fontSize="xs" fontFamily="mono">
                  Save these recovery codes now. They will NOT be shown again.
                  Each code can only be used once.
                </AlertDescription>
              </Alert>
              <SimpleGrid columns={2} spacing={2}>
                {recoveryCodes.map((rc, i) => (
                  <Code key={i} fontFamily="mono" fontSize="sm" bg="gray.800"
                    color="orange.200" p={2} borderRadius="sm"
                    letterSpacing="widest" textAlign="center">{rc}</Code>
                ))}
              </SimpleGrid>
              <Text fontSize="xs" color="gray.500" fontFamily="mono">
                Store in a password manager. Used codes are consumed permanently.
              </Text>
              <Button size="sm" colorScheme="green" variant="outline" fontFamily="mono"
                fontSize="xs" letterSpacing="wider" onClick={() => setStep('status')}>
                I HAVE SAVED MY CODES
              </Button>
            </VStack>
          </Box>
        )}

        {/* Disable MFA */}
        {step === 'disable' && (
          <Box p={5} bg="gray.900" borderRadius="md" border="1px solid" borderColor="red.800">
            <VStack spacing={4} align="stretch">
              <Text fontSize="sm" fontWeight="bold" color="red.300" fontFamily="mono">
                DISABLE TWO-FACTOR AUTHENTICATION
              </Text>
              <Text fontSize="xs" color="gray.400">
                Enter your current 6-digit TOTP code to confirm.
                This will remove MFA protection from your account.
              </Text>
              <Input
                value={disableCode}
                onChange={e => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000" maxLength={6} fontFamily="mono" fontSize="xl"
                textAlign="center" letterSpacing="widest" bg="gray.800"
                border="1px solid" borderColor="gray.600" color="white"
                _placeholder={{ color: 'gray.600' }}
                onKeyDown={e => e.key === 'Enter' && void disableMfa()}
              />
              {error && (
                <Alert status="error" bg="red.900" borderRadius="sm"
                  border="1px solid" borderColor="red.700">
                  <AlertIcon />
                  <AlertDescription fontSize="xs" fontFamily="mono">{error}</AlertDescription>
                </Alert>
              )}
              <HStack>
                <Button size="sm" colorScheme="red" fontFamily="mono" fontSize="xs"
                  letterSpacing="wider" onClick={disableMfa} isLoading={busy}
                  isDisabled={disableCode.length !== 6}>
                  CONFIRM DISABLE
                </Button>
                <Button size="sm" variant="ghost" color="gray.500" fontFamily="mono"
                  fontSize="xs" onClick={() => { setStep('status'); setError(''); }}>
                  CANCEL
                </Button>
              </HStack>
            </VStack>
          </Box>
        )}

        {/* Break-glass note — platform admin only */}
        {showBreakGlassNote && (
          <Box p={4} bg="gray.900" borderRadius="md" border="1px solid" borderColor="gray.800">
            <Text fontSize="xs" color="gray.600" fontFamily="mono">
              Break-glass access via{' '}
              <Code fontSize="xs" bg="gray.800" color="gray.400">x-admin-key</Code>{' '}
              header is always available and does not require TOTP.
            </Text>
          </Box>
        )}

      </VStack>
    </Box>
  );
}
