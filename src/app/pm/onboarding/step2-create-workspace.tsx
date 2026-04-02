/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
'use client';
import { useState, useEffect, useRef } from 'react';
import {
import { track } from '@/lib/analytics'; // FST-AN-001D
  Box, VStack, HStack, Text, Badge, Button, Input, FormControl, FormLabel, Spinner,
} from '@chakra-ui/react';

const SIGNAL_DOMAIN = process.env.NEXT_PUBLIC_SIGNAL_DOMAIN || 'signal.fieldstone.pro';

interface Props {
  onSuccess: () => void;
  onBack:    () => void;
}

type SlugStatus = 'idle' | 'checking' | 'available' | 'taken' | 'reserved' | 'invalid';

export function Step2CreateWorkspace({ onSuccess, onBack }: Props) {
  const [name,           setName]           = useState('');
  const [subdomain,      setSubdomain]      = useState('');
  const [userEditedSlug, setUserEditedSlug] = useState(false);
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState('');
  const [slugStatus,     setSlugStatus]     = useState<SlugStatus>('idle');
  const [slugReason,     setSlugReason]     = useState<string | null>(null);
  const debounceRef                         = useRef<ReturnType<typeof setTimeout> | null>(null);

  function toSlug(val: string) {
    return val.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  }

  const slug      = toSlug(subdomain);
  const slugValid = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/.test(slug);

  function handleNameChange(val: string) {
    setName(val);
    if (!userEditedSlug) setSubdomain(toSlug(val));
  }
  function handleSubdomainChange(val: string) {
    setUserEditedSlug(true);
    setSubdomain(val);
  }

  // Debounced slug availability check
  useEffect(() => {
    if (!slug || !slugValid) {
      setSlugStatus(slug && subdomain ? 'invalid' : 'idle');
      setSlugReason(null);
      return;
    }
    setSlugStatus('checking');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/workspace/check-slug?slug=${encodeURIComponent(slug)}`, {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          if (data.available) {
            setSlugStatus('available');
            setSlugReason(null);
          } else {
            setSlugStatus(data.reason === 'reserved' ? 'reserved' : 'taken');
            setSlugReason(data.reason);
          }
        } else {
          setSlugStatus('idle');
        }
      } catch {
        setSlugStatus('idle');
      }
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [slug, slugValid]);

  async function handleCreate() {
    if (!name.trim() || !slugValid || slugStatus !== 'available') return;
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/workspace/create', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), slug }),
      });
      const data = await res.json() as Record<string, unknown>;
      if (res.status === 409) {
        if (String(data.detail) === 'workspace_already_exists') {
          // User already has workspace — route them there
          const slug2 = (data as Record<string,string>).slug || slug;
          track('workspace_created'); // FST-AN-001D
      window.location.href = `https://${slug2}.${SIGNAL_DOMAIN}/pm`;
          return;
        }
        setError('That workspace name is already taken. Try another.');
        return;
      }
      if (res.status === 403) {
        setError('Your email must be verified before creating a workspace.');
        return;
      }
      if (res.status === 400) {
        const detail = String(data.detail || '');
        if (detail === 'invalid_slug_format') {
          setError('Slug must be 3–30 lowercase letters, numbers, or hyphens.');
        } else {
          setError(detail || `Server error ${res.status}`);
        }
        return;
      }
      if (res.status === 401) { setError('Authentication failed — please log in again.'); return; }
      if (!res.ok) { setError(String(data.detail ?? `Server error ${res.status}`)); return; }

      // Success — redirect to the new workspace
      window.location.href = `https://${slug}.${SIGNAL_DOMAIN}/pm`;
    } catch (e) {
      setError(`Network error: ${e instanceof Error ? e.message : 'Cannot reach server'}`);
    } finally {
      setLoading(false);
    }
  }

  const slugHint = () => {
    if (!subdomain) return null;
    switch (slugStatus) {
      case 'checking':   return <Text fontSize="2xs" color="gray.400" fontFamily="mono" mt={1}>Checking availability...</Text>;
      case 'available':  return <Text fontSize="2xs" color="green.400" fontFamily="mono" mt={1}>✓ {slug}.{SIGNAL_DOMAIN} is available</Text>;
      case 'taken':      return <Text fontSize="2xs" color="red.400" fontFamily="mono" mt={1}>✗ That name is already taken</Text>;
      case 'reserved':   return <Text fontSize="2xs" color="orange.400" fontFamily="mono" mt={1}>✗ That name is reserved</Text>;
      case 'invalid':    return <Text fontSize="2xs" color="red.400" fontFamily="mono" mt={1}>3–30 lowercase letters, numbers, hyphens; must start/end with letter or number</Text>;
      default:           return slugValid ? <Text fontSize="2xs" color="blue.400" fontFamily="mono" mt={1}>{slug}.{SIGNAL_DOMAIN}</Text> : null;
    }
  };

  const canSubmit = name.trim().length > 0 && slugValid && slugStatus === 'available' && !loading;

  return (
    <VStack align="stretch" spacing={6}>
      <VStack align="start" spacing={1}>
        <HStack spacing={2}>
          <Text fontSize="lg" fontWeight="black" fontFamily="mono" color="blue.300" letterSpacing="widest">SIGNAL</Text>
          <Badge colorScheme="blue" fontSize="2xs" fontFamily="mono">NEW WORKSPACE</Badge>
        </HStack>
        <Text fontSize="sm" fontWeight="bold" color="gray.100">Create your workspace</Text>
        <Text fontSize="xs" color="gray.400">Your team will use this to access Signal.</Text>
      </VStack>
      <VStack align="stretch" spacing={4}>
        <FormControl isRequired>
          <FormLabel fontSize="xs" color="gray.400" fontFamily="mono">WORKSPACE NAME</FormLabel>
          <Input size="sm" bg="gray.800" borderColor="gray.600" color="gray.100"
            placeholder="Acme Dental" value={name} onChange={e => handleNameChange(e.target.value)} />
        </FormControl>
        <FormControl isRequired isInvalid={subdomain.length > 0 && (slugStatus === 'invalid' || slugStatus === 'taken' || slugStatus === 'reserved')}>
          <FormLabel fontSize="xs" color="gray.400" fontFamily="mono">
            SUBDOMAIN
            {slugStatus === 'checking' && <Spinner size="xs" ml={2} color="gray.500" />}
          </FormLabel>
          <Input size="sm" bg="gray.800" borderColor="gray.600" color="gray.100"
            placeholder="acme-dental" value={subdomain} onChange={e => handleSubdomainChange(e.target.value)} />
          {slugHint()}
        </FormControl>
      </VStack>
      {error && (
        <Box bg="red.900" border="1px solid" borderColor="red.600" borderRadius="md" p={3}>
          <Text fontSize="xs" color="red.300" fontFamily="mono">{error}</Text>
        </Box>
      )}
      <VStack spacing={2}>
        <Button colorScheme="blue" w="full" fontFamily="mono" fontWeight="bold"
          isLoading={loading} loadingText="Creating..."
          isDisabled={!canSubmit} onClick={handleCreate}>
          Create Workspace
        </Button>
        <Button size="sm" variant="ghost" colorScheme="gray" w="full" onClick={onBack}>← Back</Button>
      </VStack>
    </VStack>
  );
}
