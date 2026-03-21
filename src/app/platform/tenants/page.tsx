'use client';
import {
  Box, VStack, HStack, Text, Badge, Button, Input,
  SimpleGrid, Spinner, Flex, InputGroup, InputLeftElement,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody,
  ModalFooter, useDisclosure, useToast,
}  from '@chakra-ui/react';
import { useEffect, useState, useRef } from 'react';

interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  plan: string;
  billing_status: string;
  trial_ends_at: string | null;
  created_at: string;
  stripe_customer_id: string | null;
  current_seat_count: number;
}

const STATUS_COLOR: Record<string, string> = {
  active: 'green', trial: 'blue', past_due: 'orange',
  suspended: 'red', internal: 'purple', demo: 'gray',
};

const PROTECTED = ['ipquest', 'demo', 'internal', 'signal'];

export default function TenantsPage() {
  const [tenants, setTenants]           = useState<Tenant[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [search, setSearch]             = useState('');
  const [tick, setTick]                 = useState(0);
  const [deleting, setDeleting]         = useState(false);
  const [targetTenant, setTargetTenant] = useState<Tenant | null>(null);
  const [confirmText, setConfirmText]   = useState('');
  const { isOpen, onOpen, onClose }     = useDisclosure();
  const toast                           = useToast();
  const confirmRef                      = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch('/pm-api/api/admin/tenants', { credentials: 'include' })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        return res.json();
      })
      .then((data: { tenants: Tenant[] }) => {
        if (!cancelled) setTenants(data.tenants || []);
      })
      .catch((e: Error) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [tick]);

  const filtered = tenants.filter(t =>
    (t.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (t.subdomain || '').toLowerCase().includes(search.toLowerCase())
  );

  const openDeleteModal = (tenant: Tenant) => {
    setTargetTenant(tenant);
    setConfirmText('');
    onOpen();
    setTimeout(() => confirmRef.current?.focus(), 100);
  };

  const handleDelete = async () => {
    if (!targetTenant || confirmText !== targetTenant.subdomain) return;
    setDeleting(true);
    try {
      const res = await fetch(`/pm-api/api/admin/tenants/${targetTenant.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || `HTTP ${res.status}`);
      setTenants(prev => prev.filter(t => t.id !== targetTenant.id));
      toast({
        title: 'Workspace deleted',
        description: `${targetTenant.name || targetTenant.subdomain} and all data removed.`,
        status: 'success', duration: 4000, isClosable: true,
      });
      onClose();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      toast({ title: 'Delete failed', description: msg, status: 'error', duration: 6000, isClosable: true });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box p={6} maxW="1200px" mx="auto">
      <VStack spacing={6} align="stretch">

        <HStack justify="space-between">
          <VStack align="start" spacing={0}>
            <Text fontSize="xl" fontWeight="black" color="white" fontFamily="mono" letterSpacing="wider">
              TENANTS
            </Text>
            <Text fontSize="xs" color="gray.500" fontFamily="mono">
              {loading ? '...' : `${tenants.length} workspace${tenants.length !== 1 ? 's' : ''} registered`}
            </Text>
          </VStack>
          <Button size="sm" colorScheme="orange" variant="outline" fontFamily="mono" fontSize="xs"
            onClick={() => setTick(t => t + 1)} isLoading={loading}>
            REFRESH
          </Button>
        </HStack>

        <InputGroup size="sm" maxW="320px">
          <InputLeftElement pointerEvents="none">
            <Text fontSize="xs" color="gray.600">&#128269;</Text>
          </InputLeftElement>
          <Input
            pl={8} bg="gray.900" borderColor="gray.700" color="white"
            placeholder="Search tenants..."
            value={search} onChange={e => setSearch(e.target.value)}
            _placeholder={{ color: 'gray.600' }}
            _focus={{ borderColor: 'orange.500', boxShadow: 'none' }}
          />
        </InputGroup>

        {error && (
          <Box p={3} bg="red.900" borderRadius="md" border="1px solid" borderColor="red.700">
            <Text fontSize="xs" color="red.300" fontFamily="mono">Error: {error}</Text>
          </Box>
        )}

        {loading ? (
          <Flex justify="center" py={12}><Spinner color="orange.400" size="lg" /></Flex>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={3}>
            {filtered.map(tenant => {
              const isProtected = PROTECTED.includes(tenant.subdomain);
              return (
                <Box key={tenant.id} p={4} bg="gray.900" borderRadius="md"
                  border="1px solid" borderColor="gray.800"
                  _hover={{ borderColor: 'orange.700' }} transition='border-color 0.15s'>
                  <VStack spacing={3} align="stretch">
                    <HStack justify="space-between">
                      <VStack spacing={0} align="start">
                        <Text fontSize="sm" fontWeight="bold" color="white" fontFamily="mono">
                          {tenant.name || tenant.id}
                        </Text>
                        <Text fontSize="xs" color="gray.500" fontFamily="mono">
                          {tenant.subdomain}.signal.fieldstone.pro
                        </Text>
                      </VStack>
                      <Badge colorScheme={STATUS_COLOR[tenant.billing_status] || 'gray'}
                        fontSize="9px" fontFamily="mono">
                        {(tenant.billing_status || 'unknown').toUpperCase()}
                      </Badge>
                    </HStack>

                    <SimpleGrid columns={3} spacing={2}>
                      <VStack spacing={0} align="start">
                        <Text fontSize="xs" fontWeight="bold" color="white">{tenant.plan || 'starter'}</Text>
                        <Text fontSize="9px" color="gray.600" fontFamily="mono">PLAN</Text>
                      </VStack>
                      <VStack spacing={0} align="start">
                        <Text fontSize="xs" fontWeight="bold" color="white">{tenant.current_seat_count ?? 0}</Text>
                        <Text fontSize="9px" color="gray.600" fontFamily="mono">SEATS</Text>
                      </VStack>
                      <VStack spacing={0} align="start">
                        <Text fontSize="xs" fontWeight="bold"
                          color={tenant.stripe_customer_id ? 'green.400' : 'gray.600'}>
                          {tenant.stripe_customer_id ? 'Connected' : 'None'}
                        </Text>
                        <Text fontSize="9px" color="gray.600" fontFamily="mono">STRIPE</Text>
                      </VStack>
                    </SimpleGrid>

                    <HStack spacing={2}>
                      <Button size="xs" colorScheme="orange" variant="outline"
                        fontFamily="mono" fontSize="9px" letterSpacing="wider" flex={1}
                        as="a"
                        href={`https://${tenant.subdomain}.signal.fieldstone.pro/pm`}
                        target="_blank">
                        OPEN
                      </Button>
                      <Button
                        size="xs" colorScheme="red" variant="outline"
                        fontFamily="mono" fontSize="9px" letterSpacing="wider"
                        isDisabled={isProtected}
                        title={isProtected ? 'System workspace - cannot delete' : `Delete ${tenant.subdomain}`}
                        onClick={() => { if (!isProtected) openDeleteModal(tenant); }}
                      >
                        {isProtected ? 'SYSTEM' : 'DELETE'}
                      </Button>
                    </HStack>
                  </VStack>
                </Box>
              );
            })}
          </SimpleGrid>
        )}

        {!loading && !error && filtered.length === 0 && (
          <Box p={8} textAlign="center">
            <Text color="gray.600" fontFamily="mono" fontSize="sm">
              {search ? 'No tenants match your search' : 'No tenants registered yet'}
            </Text>
          </Box>
        )}

      </VStack>

      <Modal isOpen={isOpen} onClose={onClose} isCentered size="md">
        <ModalOverlay bg="blackAlpha.800" />
        <ModalContent bg="gray.900" border="1px solid" borderColor="red.800">
          <ModalHeader fontFamily="mono" fontSize="sm" color="red.400" letterSpacing="wider">
            DELETE WORKSPACE
          </ModalHeader>
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Box p={3} bg="red.900" borderRadius="md" border="1px solid" borderColor="red.700">
                <Text fontSize="xs" color="red.200" fontFamily="mono">
                  This will permanently delete{' '}
                  <Text as="span" fontWeight="bold" color="white">
                    {targetTenant?.name || targetTenant?.subdomain}
                  </Text>{' '}
                  and ALL associated data including tickets, intel entries, signals, and settings. This cannot be undone.
                </Text>
              </Box>
              <VStack spacing={1} align="stretch">
                <Text fontSize="xs" color="gray.400" fontFamily="mono">
                  Type{' '}
                  <Text as="span" color="white" fontWeight="bold">{targetTenant?.subdomain}</Text>
                  {' '}to confirm:
                </Text>
                <Input
                  ref={confirmRef}
                  size="sm" bg="gray.800" color="white" fontFamily="mono"
                  placeholder={targetTenant?.subdomain || ''}
                  _placeholder={{ color: 'gray.600' }}
                  borderColor={confirmText === targetTenant?.subdomain && confirmText !== '' ? 'red.500' : 'gray.600'}
                  _focus={{ borderColor: 'orange.500', boxShadow: 'none' }}
                  value={confirmText}
                  onChange={e => setConfirmText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && confirmText === targetTenant?.subdomain) handleDelete();
                  }}
                />
              </VStack>
            </VStack>
          </ModalBody>
          <ModalFooter gap={2}>
            <Button size="sm" variant="ghost" fontFamily="mono" fontSize="xs"
              color="gray.400" onClick={onClose} isDisabled={deleting}>
              CANCEL
            </Button>
            <Button size="sm" colorScheme="red" fontFamily="mono" fontSize="xs"
              isDisabled={confirmText !== targetTenant?.subdomain || confirmText === ''}
              isLoading={deleting} loadingText="DELETING..."
              onClick={handleDelete}>
              DELETE WORKSPACE
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

    </Box>
  );
}
