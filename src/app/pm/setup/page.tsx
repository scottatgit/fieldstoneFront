'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, VStack, HStack, Heading, Text, Input, Button,
  FormControl, FormLabel, FormHelperText, FormErrorMessage,
  Alert, AlertIcon, AlertDescription, Badge, Divider,
} from '@chakra-ui/react';

const API_URL = process.env.NEXT_PUBLIC_PM_API_URL || 'http://localhost:8100';

export default function SetupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ organizationId: '', name: '', subdomain: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ subdomain: string; url: string } | null>(null);

  const subdomainValid = /^[a-z0-9-]{2,30}$/.test(form.subdomain);
  const subdomainError = form.subdomain.length > 0 && !subdomainValid
    ? 'Subdomain must be 2–30 lowercase letters, numbers, or hyphens' : '';

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
    setError('');
  }

  async function handleSubmit() {
    if (!form.name || !form.subdomain || !subdomainValid) return;
    setLoading(true);
    setError('');
    try {
      const orgId = form.organizationId || `org_${form.subdomain}_${Date.now()}`;
      const res = await fetch(`${API_URL}/api/tenants/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: orgId,
          name: form.name,
          subdomain: form.subdomain.toLowerCase(),
          plan: 'starter',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to create tenant');
      setSuccess({ subdomain: data.subdomain, url: data.dashboard_url });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <Box minH="100vh" bg="gray.950" display="flex" alignItems="center" justifyContent="center" p={4}>
        <VStack spacing={6} maxW="480px" w="full" bg="gray.900"
          border="1px solid" borderColor="green.700" borderRadius="xl" p={8} textAlign="center">
          <Text fontSize="3xl">✅</Text>
          <Heading size="lg" color="green.300">Organization ready</Heading>
          <Text color="gray.400">
            <strong style={{ color: 'white' }}>{form.name}</strong> is live on Fieldstone.
          </Text>
          <Box bg="gray.800" borderRadius="lg" p={4} w="full">
            <Text fontSize="xs" color="gray.500" mb={1}>YOUR DASHBOARD</Text>
            <Text color="cyan.300" fontFamily="mono" fontSize="sm">{success.url}</Text>
          </Box>
          <Divider borderColor="gray.700" />
          <VStack spacing={2} w="full">
            <Button colorScheme="blue" w="full" onClick={() => router.push('/pm')}>Open Dashboard →</Button>
            <Button variant="ghost" color="gray.400" size="sm"
              onClick={() => { setSuccess(null); setForm({ organizationId: '', name: '', subdomain: '' }); }}>
              Create another
            </Button>
          </VStack>
        </VStack>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg="gray.950" display="flex" alignItems="center" justifyContent="center" p={4}>
      <VStack spacing={8} maxW="480px" w="full">
        <VStack spacing={2} textAlign="center">
          <HStack>
            <Text fontSize="2xl" fontWeight="bold" color="white" letterSpacing="wider">FIELDSTONE</Text>
            <Badge colorScheme="blue" fontSize="xs">SETUP</Badge>
          </HStack>
          <Text color="gray.400" fontSize="sm">Create your organization and get your private dashboard.</Text>
        </VStack>

        <Box w="full" bg="gray.900" border="1px solid" borderColor="gray.700" borderRadius="xl" p={6}>
          <VStack spacing={5}>
            <FormControl isRequired>
              <FormLabel color="gray.300" fontSize="sm">Organization Name</FormLabel>
              <Input placeholder="IPQuest Technologies"
                value={form.name} onChange={e => set('name', e.target.value)}
                bg="gray.800" borderColor="gray.600" color="white"
                _placeholder={{ color: 'gray.500' }} _focus={{ borderColor: 'blue.400' }} />
            </FormControl>

            <FormControl isRequired isInvalid={!!subdomainError}>
              <FormLabel color="gray.300" fontSize="sm">Subdomain</FormLabel>
              <HStack>
                <Input placeholder="ipquest"
                  value={form.subdomain}
                  onChange={e => set('subdomain', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  bg="gray.800" borderColor="gray.600" color="white"
                  _placeholder={{ color: 'gray.500' }} _focus={{ borderColor: 'blue.400' }} flex={1} />
                <Text color="gray.500" fontSize="sm" whiteSpace="nowrap">.fieldstone.pro</Text>
              </HStack>
              {subdomainError
                ? <FormErrorMessage>{subdomainError}</FormErrorMessage>
                : form.subdomain && subdomainValid && (
                  <FormHelperText color="green.400" fontSize="xs">✓ {form.subdomain}.fieldstone.pro</FormHelperText>
                )}
            </FormControl>

            <FormControl>
              <FormLabel color="gray.300" fontSize="sm">Clerk Org ID <Text as="span" color="gray.500" fontSize="xs">(optional in dev)</Text></FormLabel>
              <Input placeholder="org_abc123"
                value={form.organizationId} onChange={e => set('organizationId', e.target.value)}
                bg="gray.800" borderColor="gray.600" color="white"
                _placeholder={{ color: 'gray.500' }} _focus={{ borderColor: 'blue.400' }} />
            </FormControl>

            {error && (
              <Alert status="error" borderRadius="md" bg="red.900" borderColor="red.700">
                <AlertIcon />
                <AlertDescription fontSize="sm" color="red.200">{error}</AlertDescription>
              </Alert>
            )}

            <Button colorScheme="blue" w="full" size="lg"
              isLoading={loading} loadingText="Creating..."
              isDisabled={!form.name || !form.subdomain || !subdomainValid}
              onClick={handleSubmit}>
              Create Organization →
            </Button>
          </VStack>
        </Box>

        <HStack spacing={6} color="gray.600" fontSize="xs" justify="center">
          <VStack spacing={0}><Text color="white" fontWeight="bold">1</Text><Text>Account</Text></VStack>
          <Text>→</Text>
          <VStack spacing={0}><Text color="blue.400" fontWeight="bold">2</Text><Text color="blue.400">Setup</Text></VStack>
          <Text>→</Text>
          <VStack spacing={0}><Text>3</Text><Text>Dashboard</Text></VStack>
        </HStack>
      </VStack>
    </Box>
  );
}
