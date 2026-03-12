/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
'use client';
import { useEffect, useState, useCallback } from 'react';
import {
  Box, Flex, Heading, Text, Button, Badge, Spinner,
  Table, Thead, Tbody, Tr, Th, Td,
  Modal, ModalOverlay, ModalContent, ModalHeader,
  ModalBody, ModalFooter, ModalCloseButton,
  FormControl, FormLabel, Input, Select,
  useDisclosure, useToast, VStack, HStack,
  AlertDialog, AlertDialogBody, AlertDialogFooter,
  AlertDialogHeader, AlertDialogContent, AlertDialogOverlay,
  IconButton, Tooltip,
} from '@chakra-ui/react';
import { useRef } from 'react';
import { SummaryBar } from '../../../../components/pm/SummaryBar';
import type { Summary } from '../../../../components/pm/types';
import { isDemoMode, demoFetch } from '../../../../lib/demoApi';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_PM_API_URL || '/pm-api';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  plan: string;
  billing_status: string;
  trial_ends_at: string | null;
  created_at: string;
  clerk_org_id: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  suspension_reason: string | null;
  suspended_at: string | null;
  suspended_by: string | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function billingBadge(status: string) {
  const map: Record<string, { color: string; label: string }> = {
    trial:     { color: 'blue',   label: 'Trial'     },
    active:    { color: 'green',  label: 'Active'    },
    suspended: { color: 'red',    label: 'Suspended' },
    demo:      { color: 'purple', label: 'Demo'      },
    internal:  { color: 'gray',   label: 'Internal'  },
    past_due:  { color: 'orange', label: 'Past Due'  },
  };
  const { color, label } = map[status] ?? { color: 'gray', label: status };
  return <Badge colorScheme={color} fontSize="2xs">{label}</Badge>;
}

function planBadge(plan: string) {
  const map: Record<string, string> = {
    starter:  'cyan',
    pro:      'teal',
    internal: 'gray',
    demo:     'purple',
  };
  return <Badge colorScheme={map[plan] ?? 'gray'} variant="outline" fontSize="2xs">{plan}</Badge>;
}

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
  catch { return iso.slice(0, 10); }
}

const SYSTEM_TENANTS = ['ipquest', 'demo', 'internal'];

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ClientsPage() {
  const [summary, setSummary]     = useState<Summary | null>(null);
  const [tenants, setTenants]     = useState<Tenant[]>([]);
  const [loading, setLoading]     = useState(true);
  const [actionTenant, setAction] = useState<Tenant | null>(null);
  const [deleteTarget, setDelete] = useState<Tenant | null>(null);

  // Create modal
  const { isOpen: isCreateOpen, onOpen: openCreate, onClose: closeCreate } = useDisclosure();
  // Edit modal
  const { isOpen: isEditOpen, onOpen: openEdit, onClose: closeEdit } = useDisclosure();
  // Delete confirm
  const { isOpen: isDeleteOpen, onOpen: openDelete, onClose: closeDelete } = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const toast = useToast();

  // Create form state
  const [form, setForm] = useState({ name: '', subdomain: '', plan: 'starter' });
  const [editForm, setEditForm] = useState({ name: '', plan: '', billing_status: '', trial_ends_at: '' as string | null });
  const [saving, setSaving] = useState(false);

  const adminHeaders = {
    'Content-Type': 'application/json',
    'x-tenant-id':  'ipquest',
    'x-admin-key':  'signal-internal-2026',
  };

  const fetchTenants = useCallback(async () => {
    setLoading(true);
    try {
      let data: { tenants: Tenant[] };
      if (isDemoMode()) {
        data = await demoFetch('/api/admin/tenants') as { tenants: Tenant[] };
      } else {
        const res = await fetch(`${API_BASE}/api/admin/tenants`, { headers: adminHeaders });
        data = await res.json();
      }
      setTenants(data.tenants ?? []);
    } catch (e) {
      toast({ title: 'Failed to load tenants', status: 'error', duration: 3000 });
    } finally {
      setLoading(false);
    }
  }, []);

  // Load summary bar
  useEffect(() => {
    fetch(`${API_BASE}/api/summary`, { headers: { 'x-tenant-id': 'ipquest' } })
      .then(r => r.json()).then(setSummary).catch(() => {});
    fetchTenants();
  }, [fetchTenants]);

  async function handleCreate() {
    if (!form.name || !form.subdomain) {
      toast({ title: 'Name and subdomain are required', status: 'warning', duration: 2500 });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/tenants`, {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Create failed');
      }
      toast({ title: `Tenant "${form.name}" created`, status: 'success', duration: 3000 });
      setForm({ name: '', subdomain: '', plan: 'starter' });
      closeCreate();
      fetchTenants();
    } catch (e: unknown) {
      toast({ title: String(e instanceof Error ? e.message : e), status: 'error', duration: 4000 });
    } finally {
      setSaving(false);
    }
  }

  function startEdit(t: Tenant) {
    setAction(t);
    setEditForm({ name: t.name, plan: t.plan, billing_status: t.billing_status, trial_ends_at: t.trial_ends_at?.slice(0, 10) ?? '' });
    openEdit();
  }

  async function handleEdit() {
    if (!actionTenant) return;
    setSaving(true);
    try {
      const patchBody = Object.fromEntries(
        Object.entries(editForm).filter(([, v]) => v !== null && v !== '')
      );
      const res = await fetch(`${API_BASE}/api/admin/tenants/${actionTenant.id}`, {
        method: 'PATCH',
        headers: adminHeaders,
        body: JSON.stringify(patchBody),
      });
      if (!res.ok) throw new Error('Update failed');
      toast({ title: 'Tenant updated', status: 'success', duration: 2500 });
      closeEdit();
      fetchTenants();
    } catch (e: unknown) {
      toast({ title: String(e instanceof Error ? e.message : e), status: 'error', duration: 3000 });
    } finally {
      setSaving(false);
    }
  }

  async function handleSuspend(t: Tenant) {
    try {
      const res = await fetch(`${API_BASE}/api/admin/tenants/${t.id}/suspend`, {
        method: 'POST', headers: adminHeaders,
      });
      const data = await res.json();
      toast({ title: data.message, status: 'info', duration: 2500 });
      fetchTenants();
    } catch {
      toast({ title: 'Suspend failed', status: 'error', duration: 3000 });
    }
  }

  function startDelete(t: Tenant) {
    setDelete(t);
    openDelete();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/tenants/${deleteTarget.id}`, {
        method: 'DELETE', headers: adminHeaders,
      });
      if (!res.ok) throw new Error('Delete failed');
      toast({ title: `"${deleteTarget.name}" deleted`, status: 'success', duration: 2500 });
      closeDelete();
      fetchTenants();
    } catch (e: unknown) {
      toast({ title: String(e instanceof Error ? e.message : e), status: 'error', duration: 3000 });
    }
  }

  return (
    <Box minH="100vh" bg="gray.950" color="gray.100">
      <SummaryBar summary={summary} loading={false} />

      <Box maxW="1200px" mx="auto" px={4} py={6}>
        <Flex justify="space-between" align="center" mb={6}>
          <VStack align="start" spacing={0}>
            <Heading size="md" color="white">Signal Clients</Heading>
            <Text fontSize="sm" color="gray.400">
              {tenants.length} tenant{tenants.length !== 1 ? 's' : ''} registered
            </Text>
          </VStack>
          <Button
            size="sm" colorScheme="blue"
            onClick={openCreate}
            leftIcon={<Text>+</Text>}
          >
            Create Client
          </Button>
        </Flex>

        {loading ? (
          <Flex justify="center" py={20}><Spinner color="blue.400" size="lg" /></Flex>
        ) : (
          <Box overflowX="auto">
            <Table variant="simple" size="sm">
              <Thead>
                <Tr>
                  <Th color="gray.400" borderColor="gray.700">Name</Th>
                  <Th color="gray.400" borderColor="gray.700">Subdomain</Th>
                  <Th color="gray.400" borderColor="gray.700">Plan</Th>
                  <Th color="gray.400" borderColor="gray.700">Status</Th>
                  <Th color="gray.400" borderColor="gray.700">Trial Ends</Th>
                  <Th color="gray.400" borderColor="gray.700">Created</Th>
                  <Th color="gray.400" borderColor="gray.700">Users</Th>
                  <Th color="gray.400" borderColor="gray.700">Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {tenants.map(t => (
                  <Tr key={t.id}
                    _hover={{ bg: 'gray.800' }}
                    opacity={t.billing_status === 'suspended' ? 0.6 : 1}
                  >
                    <Td borderColor="gray.700">
                      <Link href={`/pm/admin/clients/${t.id}`} style={{ textDecoration: 'none' }}>
                        <Text fontWeight="semibold" fontSize="sm" color="blue.200"
                          _hover={{ color: 'blue.400', textDecoration: 'underline' }}
                          cursor="pointer">
                          {t.name}
                        </Text>
                      </Link>
                      <Text fontSize="2xs" color="gray.500" fontFamily="mono">{t.id}</Text>
                    </Td>
                    <Td borderColor="gray.700">
                      <Text fontSize="sm" color="blue.300" fontFamily="mono">{t.subdomain}</Text>
                    </Td>
                    <Td borderColor="gray.700">{planBadge(t.plan)}</Td>
                    <Td borderColor="gray.700">{billingBadge(t.billing_status)}</Td>
                    <Td borderColor="gray.700">
                      <Text fontSize="xs" color="gray.400">{fmtDate(t.trial_ends_at)}</Text>
                    </Td>
                    <Td borderColor="gray.700">
                      <Text fontSize="xs" color="gray.500">{fmtDate(t.created_at)}</Text>
                    </Td>
                    <Td borderColor="gray.700">
                      <Link href={`/pm/admin/clients/${t.id}`} style={{ textDecoration: 'none' }}>
                        <Text fontSize="xs" color="gray.500" _hover={{ color: 'blue.400' }}>—</Text>
                      </Link>
                    </Td>
                    <Td borderColor="gray.700">
                      <HStack spacing={1}>
                        <Tooltip label={`Open ${t.subdomain}.signal.fieldstone.pro/pm`}>
                          <Button
                            size="xs" variant="ghost" colorScheme="blue"
                            onClick={() => window.open(`https://${t.subdomain}.signal.fieldstone.pro/pm`, '_blank')}
                          >
                            Open
                          </Button>
                        </Tooltip>
                        <Button
                          size="xs" variant="ghost" colorScheme="gray"
                          onClick={() => startEdit(t)}
                        >
                          Edit
                        </Button>
                        {!SYSTEM_TENANTS.includes(t.id) && (
                          <>
                            <Button
                              size="xs" variant="ghost"
                              colorScheme={t.billing_status === 'suspended' ? 'green' : 'orange'}
                              onClick={() => handleSuspend(t)}
                            >
                              {t.billing_status === 'suspended' ? 'Restore' : 'Suspend'}
                            </Button>
                            <Button
                              size="xs" variant="ghost" colorScheme="red"
                              onClick={() => startDelete(t)}
                            >
                              Delete
                            </Button>
                          </>
                        )}
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
            {tenants.length === 0 && (
              <Flex justify="center" py={10}>
                <Text color="gray.500">No tenants found. Create one to get started.</Text>
              </Flex>
            )}
          </Box>
        )}
      </Box>

      {/* ── Create Client Modal ── */}
      <Modal isOpen={isCreateOpen} onClose={closeCreate} isCentered>
        <ModalOverlay bg="blackAlpha.800" />
        <ModalContent bg="gray.900" border="1px solid" borderColor="gray.700">
          <ModalHeader color="white" fontSize="md">Create Client</ModalHeader>
          <ModalCloseButton color="gray.400" />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel fontSize="sm" color="gray.300">Organization Name</FormLabel>
                <Input
                  bg="gray.800" border="1px solid" borderColor="gray.600"
                  color="white" size="sm" placeholder="Acme Dental"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel fontSize="sm" color="gray.300">Subdomain</FormLabel>
                <Input
                  bg="gray.800" border="1px solid" borderColor="gray.600"
                  color="white" size="sm" placeholder="acme"
                  fontFamily="mono"
                  value={form.subdomain}
                  onChange={e => setForm(f => ({ ...f, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                />
                <Text fontSize="2xs" color="gray.500" mt={1}>
                  {form.subdomain ? `${form.subdomain}.signal.fieldstone.pro` : 'subdomain.signal.fieldstone.pro'}
                </Text>
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm" color="gray.300">Plan</FormLabel>
                <Select
                  bg="gray.800" border="1px solid" borderColor="gray.600"
                  color="white" size="sm"
                  value={form.plan}
                  onChange={e => setForm(f => ({ ...f, plan: e.target.value }))}
                >
                  <option value="starter">Starter</option>
                  <option value="pro">Pro</option>
                  <option value="internal">Internal</option>
                </Select>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter gap={2}>
            <Button size="sm" variant="ghost" colorScheme="gray" onClick={closeCreate}>Cancel</Button>
            <Button size="sm" colorScheme="blue" isLoading={saving} onClick={handleCreate}>
              Create Client
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* ── Edit Tenant Modal ── */}
      <Modal isOpen={isEditOpen} onClose={closeEdit} isCentered>
        <ModalOverlay bg="blackAlpha.800" />
        <ModalContent bg="gray.900" border="1px solid" borderColor="gray.700">
          <ModalHeader color="white" fontSize="md">Edit — {actionTenant?.name}</ModalHeader>
          <ModalCloseButton color="gray.400" />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel fontSize="sm" color="gray.300">Name</FormLabel>
                <Input
                  bg="gray.800" border="1px solid" borderColor="gray.600"
                  color="white" size="sm"
                  value={editForm.name}
                  onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm" color="gray.300">Plan</FormLabel>
                <Select
                  bg="gray.800" border="1px solid" borderColor="gray.600"
                  color="white" size="sm"
                  value={editForm.plan}
                  onChange={e => setEditForm(f => ({ ...f, plan: e.target.value }))}
                >
                  <option value="starter">Starter</option>
                  <option value="pro">Pro</option>
                  <option value="internal">Internal</option>
                  <option value="demo">Demo</option>
                </Select>
              </FormControl>
              {!SYSTEM_TENANTS.includes(actionTenant?.id ?? '') && (
                <FormControl>
                  <FormLabel fontSize="sm" color="gray.300">Billing Status</FormLabel>
                  <Select
                    bg="gray.800" border="1px solid" borderColor="gray.600"
                    color="white" size="sm"
                    value={editForm.billing_status}
                    onChange={e => setEditForm(f => ({ ...f, billing_status: e.target.value }))}
                  >
                    <option value="trial">Trial</option>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="past_due">Past Due</option>
                  </Select>
                </FormControl>
              )}
              <FormControl>
                <FormLabel fontSize="sm" color="gray.300">Trial Ends At</FormLabel>
                <Input
                  bg="gray.800" border="1px solid" borderColor="gray.600"
                  color="white" size="sm"
                  type="date"
                  value={editForm.trial_ends_at ?? ''}
                  onChange={e => setEditForm(f => ({ ...f, trial_ends_at: e.target.value }))}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter gap={2}>
            <Button size="sm" variant="ghost" colorScheme="gray" onClick={closeEdit}>Cancel</Button>
            <Button size="sm" colorScheme="blue" isLoading={saving} onClick={handleEdit}>
              Save Changes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* ── Delete Confirm ── */}
      <AlertDialog isOpen={isDeleteOpen} leastDestructiveRef={cancelRef} onClose={closeDelete} isCentered>
        <ModalOverlay bg="blackAlpha.800" />
        <AlertDialogContent bg="gray.900" border="1px solid" borderColor="red.800">
          <AlertDialogHeader fontSize="md" color="white">
            Delete "{deleteTarget?.name}"?
          </AlertDialogHeader>
          <AlertDialogBody color="gray.300" fontSize="sm">
            This will permanently delete the tenant and all associated tickets, intel, and data.
            This action cannot be undone.
          </AlertDialogBody>
          <AlertDialogFooter gap={2}>
            <Button ref={cancelRef} size="sm" variant="ghost" colorScheme="gray" onClick={closeDelete}>
              Cancel
            </Button>
            <Button size="sm" colorScheme="red" onClick={handleDelete}>
              Delete Permanently
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Box>
  );
}
