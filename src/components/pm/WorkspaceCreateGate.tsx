/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';
import { useState } from 'react';
import { Box, VStack, HStack, Text, Input, Button, Badge, FormControl } from '@chakra-ui/react';

const RESERVED = ['www','admin','api','demo','signal','static','app'];
const SLUG_RE = /^[a-z0-9-]{2,40}$/;
const PM_API = '/pm-api';

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
}

export default function WorkspaceCreateGate({ onCreated }: { onCreated: (slug: string) => void }) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleName = (v: string) => {
    setName(v);
    if (!slugEdited) setSlug(slugify(v));
  };

  const handleSlug = (v: string) => {
    setSlug(v.toLowerCase().replace(/[^a-z0-9-]/g, ''));
    setSlugEdited(true);
  };

  const slugValid = SLUG_RE.test(slug) && !RESERVED.includes(slug);
  const slugHint = !slug ? '' : !SLUG_RE.test(slug) ? 'Must be 2-40 chars, lowercase letters, numbers, hyphens only'
    : RESERVED.includes(slug) ? 'This name is reserved — choose another' : '';

  const create = async () => {
    if (!name || !slugValid) return;
    setLoading(true); setError('');
    try {
      const r = await fetch(PM_API + '/api/workspace/create', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || d.error || 'Could not create workspace');
      onCreated(slug);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error creating workspace');
    } finally { setLoading(false); }
  };

  return (
    <Box minH="100vh" bg="gray.950" display="flex" alignItems="center" justifyContent="center" px={4}>
      <Box w="100%" maxW="480px">
        <VStack spacing={8} align="stretch">
          <VStack spacing={2} align="start">
            <Badge colorScheme="blue" fontFamily="mono" fontSize="9px" letterSpacing="wider">STEP 1 OF 2</Badge>
            <Text fontSize="2xl" fontWeight="black" color="white" fontFamily="mono">Create your workspace</Text>
            <Text fontSize="sm" color="gray.400">This is your team environment. You can change the display name later.</Text>
          </VStack>
          <VStack spacing={4} align="stretch">
            <FormControl>
              <Text fontSize="xs" color="gray.400" fontFamily="mono" textTransform="uppercase" letterSpacing="wider" mb={1}>Workspace Name</Text>
              <Input bg="gray.800" borderColor="gray.700" color="white" fontFamily="mono"
                placeholder="Acme Dental" value={name} onChange={e => handleName(e.target.value)}
                _placeholder={{ color: 'gray.600' }} _focus={{ borderColor: 'blue.400', boxShadow: 'none' }} />
            </FormControl>
            <FormControl isInvalid={!!slugHint}>
              <Text fontSize="xs" color="gray.400" fontFamily="mono" textTransform="uppercase" letterSpacing="wider" mb={1}>Workspace URL</Text>
              <HStack>
                <Input bg="gray.800" borderColor={slugHint ? 'red.500' : 'gray.700'} color="white" fontFamily="mono"
                  value={slug} onChange={e => handleSlug(e.target.value)}
                  _focus={{ borderColor: slugHint ? 'red.500' : 'blue.400', boxShadow: 'none' }} />
              </HStack>
              <Text fontSize="10px" color="gray.500" fontFamily="mono" mt={1}>
                {slug ? `https://${slug}.signal.fieldstone.pro` : 'your-workspace.signal.fieldstone.pro'}
              </Text>
              {slugHint && <Text fontSize="10px" color="red.400" fontFamily="mono" mt={1}>{slugHint}</Text>}
            </FormControl>
          </VStack>
          {error && <Text fontSize="sm" color="red.400" fontFamily="mono">{error}</Text>}
          <Button colorScheme="blue" fontFamily="mono" fontWeight="bold"
            isDisabled={!name || !slugValid} isLoading={loading} loadingText="CREATING..."
            onClick={create}>CREATE WORKSPACE</Button>
        </VStack>
      </Box>
    </Box>
  );
}
