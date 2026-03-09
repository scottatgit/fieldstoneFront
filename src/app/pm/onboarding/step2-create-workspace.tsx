'use client';
import { useState } from 'react';
import {
  Box, VStack, HStack, Text, Badge, Button, Input,
  FormControl, FormLabel, Spinner,
} from '@chakra-ui/react';

interface Props {
  getToken: () => Promise<string | null>;
  onSuccess: () => void;
  onBack: () => void;
}

export function Step2CreateWorkspace({ getToken, onSuccess, onBack }: Props) {
  const [name,           setName]           = useState('');
  const [subdomain,      setSubdomain]      = useState('');
  const [userEditedSlug, setUserEditedSlug] = useState(false);
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState('');

  // Generate slug from any string
  function toSlug(val: string) {
    return val.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  }

  const slug      = toSlug(subdomain);
  const slugValid = /^[a-z0-9-]{2,30}$/.test(slug);

  function handleNameChange(val: string) {
    setName(val);
    // Auto-fill subdomain from name UNLESS user has manually edited it
    if (!userEditedSlug) {
      setSubdomain(toSlug(val));
    }
  }

  function handleSubdomainChange(val: string) {
    setUserEditedSlug(true);
    setSubdomain(val);
  }

  async function handleCreate() {
    if (!name.trim() || !slugValid) return;
    setLoading(true); setError('');
    try {
      const jwt = await getToken();
      if (!jwt) {
        setError('You must be signed in to create a workspace. Please log in and try again.');
        return;
      }
      const res = await fetch(`/api/tenants/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
        body: JSON.stringify({
          name:           name.trim(),
          subdomain:      slug,
          organizationId: `org_${slug}_${Date.now()}`,
          plan:           'starter',
        }),
      });
      const data = await res.json();
      if (res.status === 409) { setError('That subdomain is already taken. Try another.'); return; }
      if (res.status === 401 || res.status === 403) { setError('Session expired — please refresh and sign in again.'); return; }
      if (!res.ok) { setError(data.detail || 'Failed to create workspace.'); return; }
      // Redirect to new subdomain
      if (typeof window !== 'undefined') {
        window.location.href = `https://${slug}.fieldstone.pro/pm`;
      } else {
        onSuccess();
      }
    } catch {
      setError('Could not reach server.');
    } finally {
      setLoading(false);
    }
  }

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
          <Input
            size="sm" bg="gray.800" borderColor="gray.600" color="gray.100"
            placeholder="Acme Dental"
            value={name}
            onChange={e => handleNameChange(e.target.value)}
          />
        </FormControl>

        <FormControl isRequired isInvalid={subdomain.length > 0 && !slugValid}>
          <FormLabel fontSize="xs" color="gray.400" fontFamily="mono">SUBDOMAIN</FormLabel>
          <Input
            size="sm" bg="gray.800" borderColor="gray.600" color="gray.100"
            placeholder="acme-dental"
            value={subdomain}
            onChange={e => handleSubdomainChange(e.target.value)}
          />
          {subdomain && (
            <Text fontSize="2xs" color={slugValid ? 'blue.400' : 'red.400'} fontFamily="mono" mt={1}>
              {slugValid ? `✓ fieldstone.pro → ${slug}.fieldstone.pro` : '2–30 lowercase letters, numbers, hyphens'}
            </Text>
          )}
        </FormControl>
      </VStack>

      {error && <Text fontSize="xs" color="red.400" fontFamily="mono">{error}</Text>}

      <VStack spacing={2}>
        <Button
          colorScheme="blue" w="full" fontFamily="mono" fontWeight="bold"
          isLoading={loading} loadingText="Creating..."
          isDisabled={!name.trim() || !slugValid}
          onClick={handleCreate}
        >
          Create Workspace
        </Button>
        <Button size="sm" variant="ghost" colorScheme="gray" w="full" onClick={onBack}>
          ← Back
        </Button>
      </VStack>
    </VStack>
  );
}
