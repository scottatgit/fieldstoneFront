'use client';
import { useState } from 'react';
import {
  VStack, HStack, Text, Badge, Button, Input,
  FormControl, FormLabel, Spinner, Alert, AlertIcon, AlertDescription,
} from '@chakra-ui/react';

// getToken prop removed — auth cookie sent automatically via credentials:'include'
interface Props {
  onBack: () => void;
}

const BASE_DOMAIN   = process.env.NEXT_PUBLIC_BASE_DOMAIN   || 'fieldstone.pro';
const SIGNAL_DOMAIN = process.env.NEXT_PUBLIC_SIGNAL_DOMAIN || ('signal.' + BASE_DOMAIN);

export function Step2ReclaimWorkspace({ onBack }: Props) {
  const [slug,    setSlug]    = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  function toSlug(val: string) {
    return val.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  }
  const cleanSlug = toSlug(slug);
  const slugValid = /^[a-z0-9-]{2,40}$/.test(cleanSlug);

  async function handleClaim() {
    if (!slugValid) return;
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/user/claim-workspace', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: cleanSlug }),
      });
      if (!res.ok) {
        let msg = `Error ${res.status}`;
        try { const b = await res.json(); msg = (b as { detail?: string })?.detail || msg; } catch { /* ok */ }
        setError(msg); return;
      }
      const data = await res.json() as { slug: string };
      window.location.href = `${window.location.protocol}//${data.slug}.${SIGNAL_DOMAIN}/pm`;
    } catch (e) {
      setError('Network error: ' + (e instanceof Error ? e.message : 'Could not reach server'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <VStack align="stretch" spacing={6}>
      <VStack align="start" spacing={1}>
        <HStack spacing={2}>
          <Text fontSize="lg" fontWeight="black" fontFamily="mono" color="blue.300" letterSpacing="widest">SIGNAL</Text>
          <Badge colorScheme="purple" fontSize="2xs" fontFamily="mono">RECLAIM</Badge>
        </HStack>
        <Text fontSize="sm" fontWeight="bold" color="gray.100">Access Existing Workspace</Text>
        <Text fontSize="xs" color="gray.400">Enter your workspace slug to link this account.</Text>
      </VStack>
      <VStack align="stretch" spacing={4}>
        <FormControl>
          <FormLabel fontSize="xs" color="gray.400" fontFamily="mono" letterSpacing="wider">WORKSPACE SLUG</FormLabel>
          <Input
            value={slug} onChange={e => setSlug(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && slugValid && !loading) void handleClaim(); }}
            placeholder="your-workspace"
            bg="gray.800" border="1px solid"
            borderColor={slug && !slugValid ? 'red.500' : 'gray.600'}
            color="gray.100" fontSize="sm" fontFamily="mono"
            _placeholder={{ color: 'gray.600' }} _focus={{ borderColor: 'blue.400', boxShadow: 'none' }}
          />
          {cleanSlug && (
            <Text fontSize="xs" color="gray.500" mt={1} fontFamily="mono">{cleanSlug}.{SIGNAL_DOMAIN}</Text>
          )}
        </FormControl>
        {error && (
          <Alert status="error" bg="red.900" borderRadius="md" border="1px solid" borderColor="red.700">
            <AlertIcon color="red.400" />
            <AlertDescription fontSize="xs" color="red.200">{error}</AlertDescription>
          </Alert>
        )}
        <Button onClick={() => { void handleClaim(); }} isDisabled={!slugValid || loading}
          colorScheme="purple" size="sm" fontFamily="mono" fontWeight="bold" letterSpacing="wider">
          {loading ? <Spinner size="sm" /> : 'LINK MY ACCOUNT'}
        </Button>
        <Button onClick={onBack} variant="ghost" size="xs" color="gray.500" fontFamily="mono" _hover={{ color: 'gray.300' }}>
          &larr; BACK
        </Button>
      </VStack>
    </VStack>
  );
}
