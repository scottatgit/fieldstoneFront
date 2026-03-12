'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@/lib/useUser';
import {
  Box, VStack, HStack, Text, Badge, Button, Spinner,
  Alert, AlertIcon, AlertDescription,
} from '@chakra-ui/react';
import { ChakraProvider } from '@chakra-ui/react';
import pmTheme from '@/components/pm/pmTheme';

interface InviteMeta {
  tenant_name: string;
  role: string;
  expires_at: string;
  valid: boolean;
}

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const router    = useRouter();
  const { isLoaded, isSignedIn } = useUser();

  const [meta,    setMeta]    = useState<InviteMeta | null>(null);
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [joined,  setJoined]  = useState(false);

  // Fetch invite metadata (no auth needed for meta)
  useEffect(() => {
    if (!token) return;
    fetch(`/api/invite/${token}`)
      .then(async r => {
        if (r.status === 410) { setError('This invite has expired or has already been used.'); return; }
        if (r.status === 404) { setError('Invite not found.'); return; }
        if (!r.ok)            { setError('Could not load invite.'); return; }
        setMeta(await r.json());
      })
      .catch(() => setError('Could not reach server.'))
      .finally(() => setLoading(false));
  }, [token]);

  // Redirect to signup if not signed in
  useEffect(() => {
    if (!isLoaded || loading || error) return;
    if (!isSignedIn) {
      router.push(`/signup?invite=${token}`);
    }
  }, [isLoaded, isSignedIn, loading, error, token, router]);

  async function handleJoin() {
    setJoining(true);
    try {
      // Cookie is sent automatically — no Authorization header needed
      const res = await fetch(`/api/invite/${token}/accept`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (res.status === 410) { setError('This invite has expired or has already been used.'); return; }
      if (!res.ok) { setError(data.detail || 'Failed to join workspace.'); return; }
      setJoined(true);
      setTimeout(() => router.push('/pm'), 1500);
    } catch {
      setError('Failed to connect to server.');
    } finally {
      setJoining(false);
    }
  }

  const roleLabel: Record<string, string> = {
    technician: 'Technician', viewer: 'Viewer', tenant_admin: 'Admin',
  };

  return (
    <ChakraProvider theme={pmTheme}>
      <Box minH="100vh" bg="gray.950" display="flex" alignItems="center" justifyContent="center" p={4}>
        <Box maxW="420px" w="full" bg="gray.900" border="1px solid" borderColor="blue.800" borderRadius="xl" p={8}>
          {loading && (
            <VStack spacing={4}>
              <Spinner color="blue.400" size="lg" />
              <Text color="gray.500" fontSize="sm" fontFamily="mono">Loading invite...</Text>
            </VStack>
          )}
          {!loading && error && (
            <VStack spacing={4}>
              <Text fontSize="2xl">⚠️</Text>
              <Text fontWeight="bold" color="red.300" fontFamily="mono" textAlign="center">{error}</Text>
              <Button size="sm" variant="outline" colorScheme="gray" onClick={() => router.push('/login')}>Go to Login</Button>
            </VStack>
          )}
          {!loading && !error && meta && !joined && (
            <VStack align="stretch" spacing={6}>
              <VStack align="start" spacing={1}>
                <HStack spacing={2}>
                  <Text fontSize="lg" fontWeight="black" fontFamily="mono" color="blue.300" letterSpacing="widest">SIGNAL</Text>
                  <Badge colorScheme="blue" fontSize="2xs" fontFamily="mono">INVITE</Badge>
                </HStack>
                <Text fontSize="xs" color="gray.400">You have been invited to join a workspace.</Text>
              </VStack>
              <Box p={4} bg="gray.800" borderRadius="md" border="1px solid" borderColor="gray.700">
                <VStack align="start" spacing={2}>
                  <HStack justify="space-between" w="full">
                    <Text fontSize="xs" color="gray.400" fontFamily="mono">WORKSPACE</Text>
                    <Text fontSize="sm" fontWeight="bold" color="white">{meta.tenant_name}</Text>
                  </HStack>
                  <HStack justify="space-between" w="full">
                    <Text fontSize="xs" color="gray.400" fontFamily="mono">ROLE</Text>
                    <Badge colorScheme={meta.role === 'technician' ? 'blue' : 'gray'} fontSize="xs">{roleLabel[meta.role] || meta.role}</Badge>
                  </HStack>
                  <HStack justify="space-between" w="full">
                    <Text fontSize="xs" color="gray.400" fontFamily="mono">EXPIRES</Text>
                    <Text fontSize="xs" color="gray.400">{new Date(meta.expires_at).toLocaleString()}</Text>
                  </HStack>
                </VStack>
              </Box>
              <Button colorScheme="blue" onClick={handleJoin} isLoading={joining} loadingText="Joining..." fontFamily="mono" fontWeight="bold" w="full">Join Workspace</Button>
              <Text fontSize="2xs" color="gray.600" fontFamily="mono" textAlign="center">By joining, you accept the role assigned above.</Text>
            </VStack>
          )}
          {joined && (
            <VStack spacing={4}>
              <Text fontSize="2xl">✅</Text>
              <Text fontWeight="bold" color="green.300" fontFamily="mono" textAlign="center">Workspace joined! Redirecting...</Text>
              <Spinner color="green.400" size="sm" />
            </VStack>
          )}
        </Box>
      </Box>
    </ChakraProvider>
  );
}
