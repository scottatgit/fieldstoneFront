'use client';
import {
  Box, VStack, HStack, Text, Badge, Button, Input,
  Flex, Spinner, Switch, FormLabel, FormControl,
  Divider, useToast, Textarea,
} from '@chakra-ui/react';
import { useEffect, useState, useRef } from 'react';

interface BetaConfig {
  beta_enabled: boolean;
  updated_at: string | null;
}

interface BetaInvite {
  email: string;
  status: string;
  invited_by: string | null;
  invited_at: string;
  accepted_at: string | null;
  notes: string | null;
}

const STATUS_COLOR: Record<string, string> = {
  pending:  'yellow',
  accepted: 'green',
  revoked:  'red',
};

export default function BetaAccessPage() {
  const [config, setConfig]       = useState<BetaConfig | null>(null);
  const [invites, setInvites]     = useState<BetaInvite[]>([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [revoking, setRevoking]   = useState<string | null>(null);
  const [adding, setAdding]       = useState(false);
  const [newEmail, setNewEmail]   = useState('');
  const [newNotes, setNewNotes]   = useState('');
  const [search, setSearch]       = useState('');
  const toast                     = useToast();
  const emailRef                  = useRef<HTMLInputElement>(null);

  const fetchAll = async () => {
    try {
      const [cfgRes, invRes] = await Promise.all([
        fetch('/pm-api/api/admin/beta/config',  { credentials: 'include' }),
        fetch('/pm-api/api/admin/beta/invites', { credentials: 'include' }),
      ]);
      if (cfgRes.ok)  setConfig(await cfgRes.json());
      if (invRes.ok)  { const d = await invRes.json(); setInvites(d.invites || []); }
    } catch (e) {
      toast({ title: 'Failed to load beta config', status: 'error', duration: 4000, isClosable: true });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const updateConfig = async (patch: Partial<BetaConfig>) => {
    setSaving(true);
    try {
      const res = await fetch('/pm-api/api/admin/beta/config', {
        method: 'PUT', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const data = await res.json().catch(() => ({})) as BetaConfig & { detail?: string };
      if (!res.ok) {
        toast({ title: 'Update failed', description: data.detail || `HTTP ${res.status}`, status: 'error', duration: 5000, isClosable: true });
        return;
      }
      setConfig(data);
      toast({
        title: patch.beta_enabled !== undefined
          ? (patch.beta_enabled ? 'Beta access ENABLED' : 'Beta access DISABLED')
          : 'Admission mode updated',
        status: patch.beta_enabled ? 'success' : 'warning',
        duration: 3000, isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const addInvite = async () => {
    const email = newEmail.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      toast({ title: 'Valid email required', status: 'warning', duration: 3000, isClosable: true }); return;
    }
    setAdding(true);
    try {
      const res = await fetch('/pm-api/api/admin/beta/invites', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, notes: newNotes.trim(), invited_by: 'platform_admin' }),
      });
      const data = await res.json().catch(() => ({})) as BetaInvite & { detail?: string };
      if (!res.ok) {
        toast({ title: 'Add failed', description: (data as { detail?: string }).detail || `HTTP ${res.status}`, status: 'error', duration: 5000, isClosable: true }); return;
      }
      setInvites(prev => [data, ...prev]);
      setNewEmail(''); setNewNotes('');
      toast({ title: `${email} added to beta list`, status: 'success', duration: 3000, isClosable: true });
      emailRef.current?.focus();
    } finally {
      setAdding(false);
    }
  };

  const revokeInvite = async (email: string) => {
    setRevoking(email);
    try {
      const res = await fetch(`/pm-api/api/admin/beta/invites/${encodeURIComponent(email)}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'revoked' }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({})) as { detail?: string };
        toast({ title: 'Revoke failed', description: d.detail || `HTTP ${res.status}`, status: 'error', duration: 5000, isClosable: true }); return;
      }
      setInvites(prev => prev.map(i => i.email === email ? { ...i, status: 'revoked' } : i));
      toast({ title: `${email} revoked`, status: 'warning', duration: 3000, isClosable: true });
    } finally {
      setRevoking(null);
    }
  };

  const filtered = invites.filter(i =>
    !search || i.email.toLowerCase().includes(search.toLowerCase()) ||
    (i.notes || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <Flex h="60vh" align="center" justify="center" direction="column" gap={3}>
        <Spinner color="orange.400" size="lg" />
        <Text fontSize="xs" fontFamily="mono" color="gray.600" letterSpacing="wider">LOADING BETA CONFIG...</Text>
      </Flex>
    );
  }

  return (
    <Box p={6} maxW="960px" mx="auto">
      <VStack spacing={6} align="stretch">

        {/* Header */}
        <HStack justify="space-between" align="flex-start">
          <VStack align="flex-start" spacing={1}>
            <HStack spacing={3}>
              <Text fontSize="lg" fontWeight="black" fontFamily="mono" letterSpacing="widest" color="white">BETA ACCESS</Text>
              <Badge
                colorScheme={config?.beta_enabled ? 'green' : 'red'}
                fontFamily="mono" fontSize="10px" letterSpacing="wider" px={2} py={0.5}
              >
                {config?.beta_enabled ? 'OPEN' : 'CLOSED'}
              </Badge>
            </HStack>
            <Text fontSize="xs" color="gray.500" fontFamily="mono">
              Controls new tenant admission. Existing users are never affected.
            </Text>
          </VStack>
          <Text fontSize="10px" color="gray.700" fontFamily="mono">
            {invites.length} on list · {invites.filter(i => i.status === 'accepted').length} accepted
          </Text>
        </HStack>

        <Divider borderColor="gray.800" />

        {/* Global Switch Card */}
        <Box bg="gray.900" border="1px solid" borderColor={config?.beta_enabled ? 'green.800' : 'red.900'} borderRadius="md" p={5}>
          <VStack spacing={4} align="stretch">
            <HStack justify="space-between" align="center">
              <VStack align="flex-start" spacing={0}>
                <Text fontSize="sm" fontWeight="bold" fontFamily="mono" color="white">GLOBAL BETA SWITCH</Text>
                <Text fontSize="xs" color="gray.500" fontFamily="mono" mt={1}>
                  {config?.beta_enabled
                    ? 'New signups are ALLOWED for approved emails.'
                    : 'All new signups are BLOCKED. Existing sessions unaffected.'}
                </Text>
              </VStack>
              <HStack spacing={3}>
                <Text fontSize="xs" fontFamily="mono" color={config?.beta_enabled ? 'green.400' : 'red.400'} fontWeight="bold">
                  {config?.beta_enabled ? 'ON' : 'OFF'}
                </Text>
                <Switch
                  isChecked={config?.beta_enabled ?? false}
                  onChange={e => updateConfig({ beta_enabled: e.target.checked })}
                  colorScheme="green"
                  size="lg"
                  isDisabled={saving}
                />
              </HStack>
            </HStack>



            {config?.updated_at && (
              <Text fontSize="10px" color="gray.700" fontFamily="mono">
                Last updated: {new Date(config.updated_at).toLocaleString()}
              </Text>
            )}
          </VStack>
        </Box>

        {/* Add Invite */}
        <Box bg="gray.900" border="1px solid" borderColor="gray.800" borderRadius="md" p={5}>
          <VStack spacing={3} align="stretch">
            <Text fontSize="xs" fontWeight="bold" fontFamily="mono" color="gray.400" letterSpacing="wider">ADD TO BETA LIST</Text>
            <HStack spacing={3} align="flex-end">
              <Box flex={1}>
                <Text fontSize="10px" fontFamily="mono" color="gray.600" mb={1}>EMAIL</Text>
                <Input
                  ref={emailRef}
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addInvite()}
                  placeholder="user@example.com"
                  size="sm"
                  bg="gray.800" borderColor="gray.700" color="white"
                  fontFamily="mono" fontSize="xs"
                  _placeholder={{ color: 'gray.600' }}
                  _hover={{ borderColor: 'gray.600' }}
                  _focus={{ borderColor: 'orange.500', boxShadow: 'none' }}
                />
              </Box>
              <Box flex={1}>
                <Text fontSize="10px" fontFamily="mono" color="gray.600" mb={1}>NOTES (optional)</Text>
                <Input
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  placeholder="e.g. pilot cohort A"
                  size="sm"
                  bg="gray.800" borderColor="gray.700" color="white"
                  fontFamily="mono" fontSize="xs"
                  _placeholder={{ color: 'gray.600' }}
                  _hover={{ borderColor: 'gray.600' }}
                  _focus={{ borderColor: 'orange.500', boxShadow: 'none' }}
                />
              </Box>
              <Button
                onClick={addInvite}
                isLoading={adding}
                size="sm"
                colorScheme="orange"
                fontFamily="mono"
                fontSize="xs"
                letterSpacing="wider"
                flexShrink={0}
              >
                + ADD
              </Button>
            </HStack>
          </VStack>
        </Box>

        {/* Invite List */}
        <Box bg="gray.900" border="1px solid" borderColor="gray.800" borderRadius="md" overflow="hidden">
          <HStack px={5} py={3} borderBottom="1px solid" borderColor="gray.800" justify="space-between">
            <Text fontSize="xs" fontWeight="bold" fontFamily="mono" color="gray.400" letterSpacing="wider">
              BETA COHORT — {filtered.length} ENTRIES
            </Text>
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="filter..."
              size="xs"
              w="180px"
              bg="gray.800" borderColor="gray.700" color="white"
              fontFamily="mono"
              _placeholder={{ color: 'gray.600' }}
              _focus={{ borderColor: 'orange.500', boxShadow: 'none' }}
            />
          </HStack>

          {filtered.length === 0 ? (
            <Flex align="center" justify="center" py={12}>
              <Text fontSize="xs" fontFamily="mono" color="gray.700">
                {invites.length === 0 ? 'No invites yet. Add emails above.' : 'No results match filter.'}
              </Text>
            </Flex>
          ) : (
            <VStack spacing={0} align="stretch">
              {/* Table header */}
              <HStack px={5} py={2} bg="gray.950" spacing={0}>
                <Text flex={3} fontSize="10px" fontFamily="mono" color="gray.600" letterSpacing="wider">EMAIL</Text>
                <Text flex={1} fontSize="10px" fontFamily="mono" color="gray.600" letterSpacing="wider">STATUS</Text>
                <Text flex={2} fontSize="10px" fontFamily="mono" color="gray.600" letterSpacing="wider">INVITED</Text>
                <Text flex={2} fontSize="10px" fontFamily="mono" color="gray.600" letterSpacing="wider">NOTES</Text>
                <Box flex={1} />
              </HStack>
              {filtered.map((invite, idx) => (
                <HStack
                  key={invite.email}
                  px={5} py={3} spacing={0}
                  borderTop={idx > 0 ? '1px solid' : 'none'}
                  borderColor="gray.800"
                  _hover={{ bg: 'gray.850' }}
                  align="center"
                >
                  <Text flex={3} fontSize="xs" fontFamily="mono" color={invite.status === 'revoked' ? 'gray.600' : 'white'}
                    textDecoration={invite.status === 'revoked' ? 'line-through' : 'none'}>
                    {invite.email}
                  </Text>
                  <Box flex={1}>
                    <Badge
                      colorScheme={STATUS_COLOR[invite.status] ?? 'gray'}
                      fontFamily="mono" fontSize="9px" letterSpacing="wider"
                    >
                      {invite.status.toUpperCase()}
                    </Badge>
                  </Box>
                  <Text flex={2} fontSize="10px" fontFamily="mono" color="gray.500">
                    {new Date(invite.invited_at).toLocaleDateString()}
                    {invite.accepted_at && (
                      <Text as="span" color="green.600"> · accepted {new Date(invite.accepted_at).toLocaleDateString()}</Text>
                    )}
                  </Text>
                  <Text flex={2} fontSize="10px" fontFamily="mono" color="gray.600" isTruncated>
                    {invite.notes || '—'}
                  </Text>
                  <Box flex={1} textAlign="right">
                    {invite.status !== 'revoked' && (
                      <Button
                        size="xs"
                        variant="ghost"
                        colorScheme="red"
                        fontFamily="mono"
                        fontSize="9px"
                        letterSpacing="wider"
                        isLoading={revoking === invite.email}
                        onClick={() => revokeInvite(invite.email)}
                      >
                        REVOKE
                      </Button>
                    )}
                  </Box>
                </HStack>
              ))}
            </VStack>
          )}
        </Box>

        {/* Footer note */}
        <Text fontSize="10px" fontFamily="mono" color="gray.700" textAlign="center">
          EXT-002 · Beta access is admission-layer only · Existing workspace sessions are never affected by this switch
        </Text>

      </VStack>
    </Box>
  );
}
