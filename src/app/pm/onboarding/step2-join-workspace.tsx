'use client';
import { useState, useEffect } from 'react';
import {
  Box, VStack, HStack, Text, Badge, Button, Spinner, Input, FormControl, FormLabel,
} from '@chakra-ui/react';

// getToken prop removed — auth cookie sent automatically via credentials:'include'
interface Props {
  inviteToken: string | null;
  onSuccess:   () => void;
  onBack:      () => void;
}

interface InviteMeta { tenant_name: string; role: string; expires_at: string; valid: boolean; }

export function Step2JoinWorkspace({ inviteToken, onSuccess, onBack }: Props) {
  const [token,   setToken]   = useState(inviteToken || '');
  const [meta,    setMeta]    = useState<InviteMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error,   setError]   = useState('');

  useEffect(() => { if (inviteToken) loadInvite(inviteToken); }, [inviteToken]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadInvite(t: string) {
    setLoading(true); setError(''); setMeta(null);
    try {
      const res = await fetch(`/api/invite/${t}`);
      if (res.status === 410) { setError('This invite has expired or has already been used.'); return; }
      if (res.status === 404) { setError('Invite not found. Check the link and try again.'); return; }
      if (!res.ok) { setError('Could not load invite.'); return; }
      setMeta(await res.json());
    } catch { setError('Could not reach server.'); }
    finally { setLoading(false); }
  }

  async function handleAccept() {
    const t = token.trim();
    if (!t || !meta) return;
    setJoining(true); setError('');
    try {
      const res = await fetch(`/api/invite/${t}/accept`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (res.status === 410) { setError('This invite has expired or has already been used.'); return; }
      if (!res.ok) { setError(data.detail || 'Failed to join workspace.'); return; }
      onSuccess();
    } catch { setError('Could not connect to server.'); }
    finally { setJoining(false); }
  }

  const roleLabel: Record<string, string> = { technician: 'Technician', viewer: 'Viewer', tenant_admin: 'Admin' };

  return (
    <VStack align="stretch" spacing={6}>
      <VStack align="start" spacing={1}>
        <HStack spacing={2}>
          <Text fontSize="lg" fontWeight="black" fontFamily="mono" color="blue.300" letterSpacing="widest">SIGNAL</Text>
          <Badge colorScheme="green" fontSize="2xs" fontFamily="mono">JOIN WORKSPACE</Badge>
        </HStack>
        <Text fontSize="sm" fontWeight="bold" color="gray.100">Join a workspace</Text>
        <Text fontSize="xs" color="gray.400">Enter your invite token or paste the full invite link.</Text>
      </VStack>
      {!inviteToken && (
        <FormControl>
          <FormLabel fontSize="xs" color="gray.400" fontFamily="mono">INVITE TOKEN</FormLabel>
          <HStack>
            <Input size="sm" bg="gray.800" borderColor="gray.600" color="gray.100"
              placeholder="Paste invite token..."
              value={token} onChange={e => {
                const val = e.target.value;
                const match = val.match(/\/invite\/([^/\s]+)/);
                setToken(match ? match[1] : val);
                setMeta(null); setError('');
              }} />
            <Button size="sm" colorScheme="gray" onClick={() => loadInvite(token.trim())} isLoading={loading}>Look Up</Button>
          </HStack>
        </FormControl>
      )}
      {loading && <HStack justify="center"><Spinner color="blue.400" size="sm" /><Text fontSize="xs" color="gray.500">Loading invite...</Text></HStack>}
      {error && <Text fontSize="xs" color="red.400" fontFamily="mono">{error}</Text>}
      {meta && (
        <Box p={4} bg="gray.800" borderRadius="md" border="1px solid" borderColor="blue.700">
          <VStack align="stretch" spacing={2}>
            <HStack justify="space-between">
              <Text fontSize="xs" color="gray.400" fontFamily="mono">WORKSPACE</Text>
              <Text fontSize="sm" fontWeight="bold" color="white">{meta.tenant_name}</Text>
            </HStack>
            <HStack justify="space-between">
              <Text fontSize="xs" color="gray.400" fontFamily="mono">YOUR ROLE</Text>
              <Badge colorScheme={meta.role === 'technician' ? 'blue' : 'gray'} fontSize="xs">{roleLabel[meta.role] || meta.role}</Badge>
            </HStack>
            <HStack justify="space-between">
              <Text fontSize="xs" color="gray.400" fontFamily="mono">EXPIRES</Text>
              <Text fontSize="2xs" color="gray.400">{new Date(meta.expires_at).toLocaleString()}</Text>
            </HStack>
          </VStack>
        </Box>
      )}
      <VStack spacing={2}>
        {meta && (
          <Button colorScheme="blue" w="full" fontFamily="mono" fontWeight="bold"
            isLoading={joining} loadingText="Joining..." onClick={handleAccept}>Join Workspace</Button>
        )}
        <Button size="sm" variant="ghost" colorScheme="gray" w="full" onClick={onBack}>← Back</Button>
      </VStack>
    </VStack>
  );
}
