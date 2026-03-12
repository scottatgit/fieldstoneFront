/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box, Flex, Heading, Text, Button, Badge, Spinner, VStack, HStack,
  Grid, GridItem, SimpleGrid, Divider, Progress,
  Table, Thead, Tbody, Tr, Th, Td,
  Modal, ModalOverlay, ModalContent, ModalHeader,
  ModalBody, ModalFooter, ModalCloseButton,
  FormControl, FormLabel, Input, Select, Textarea,
  AlertDialog, AlertDialogBody, AlertDialogFooter,
  AlertDialogHeader, AlertDialogContent, AlertDialogOverlay,
  useDisclosure, useToast, Tooltip, Icon,
} from '@chakra-ui/react';
import { isDemoMode, demoFetch } from '../../../../../lib/demoApi';

const API_BASE = process.env.NEXT_PUBLIC_PM_API_URL || '/pm-api';
const ADMIN_HEADERS = {
  'Content-Type': 'application/json',
  'x-tenant-id':  'ipquest',
  'x-admin-key':  'signal-internal-2026',
};
const SYSTEM_TENANTS = ['ipquest', 'demo', 'internal'];

// ── Types ────────────────────────────────────────────────────────────────────
interface TenantSetup {
  has_org: boolean;
  imap_connected: boolean;
  ai_configured: boolean;
  notifications_configured: boolean;
  first_ingestion_at: string | null;
  activation_state: 'not_started' | 'partial' | 'active' | 'complete';
  setup_completion_pct: number;
}

interface TenantDetail {
  id: string;
  name: string;
  subdomain: string;
  plan: string;
  billing_status: string;
  trial_starts_at: string | null;
  trial_ends_at: string | null;
  created_at: string;
  updated_at?: string | null;
  clerk_org_id: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  suspension_reason: string | null;
  suspended_at: string | null;
  suspended_by: string | null;
  setup: TenantSetup;
}

interface TenantUsers {
  total_users: number;
  active_last_30_days: number;
  pilot_count: number;
  billable_seat_candidate_count: number;
  role_breakdown: Record<string, number>;
  items: Array<{
    id: string;
    name: string;
    email: string | null;
    role: string;
    assigned_to_alias: string | null;
    last_active_at: string | null;
    has_clerk_user: boolean;
    active_last_30d: boolean;
  }>;
}

interface TenantUsage {
  ticket_count: number;
  intel_count: number;
  outbreak_count: number;
  last_user_activity_at: string | null;
  last_ticket_created_at: string | null;
  latest_ingestion_at: string | null;
  tenant_state_summary: 'active' | 'inactive' | 'not_activated';
}

interface IngestionJob {
  ticket_id: string;
  status: string;
  error: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  duration_ms: number | null;
}

interface TenantIngestion {
  items: IngestionJob[];
  total: number;
}

interface BillingEvent {
  event_type: string;
  stripe_event_id: string | null;
  payload: string | null;
  created_at: string;
}

interface TenantBillingAdmin {
  name: string;
  plan: string;
  billing_status: string;
  trial_ends_at: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_seat_count: number;
  last_seat_sync_at: string | null;
  seats: {
    total_active: number;
    admin_count: number;
    technician_count: number;
    free_seats: number;
    billable_seats: number;
    users: Array<{ id: string; name: string; role: string; last_active_at: string | null }>;
  };
  recent_events: BillingEvent[];
  stripe_configured: boolean;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
  catch { return iso.slice(0, 10); }
}

function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return iso.slice(0, 16); }
}

function fmtDuration(ms: number | null): string {
  if (ms === null || ms === undefined) return '—';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

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
  return <Badge colorScheme={color} fontSize="xs" px={2} py={0.5}>{label}</Badge>;
}

function planBadge(plan: string) {
  const map: Record<string, string> = {
    starter:  'cyan',
    pro:      'teal',
    internal: 'gray',
    demo:     'purple',
  };
  return <Badge colorScheme={map[plan] ?? 'gray'} variant="outline" fontSize="xs" px={2} py={0.5}>{plan}</Badge>;
}

function activationBadge(state: string) {
  const map: Record<string, { color: string; label: string }> = {
    not_started: { color: 'gray',   label: 'Not Started' },
    partial:     { color: 'yellow', label: 'Partial'     },
    active:      { color: 'blue',   label: 'Active'      },
    complete:    { color: 'green',  label: 'Complete'    },
  };
  const { color, label } = map[state] ?? { color: 'gray', label: state };
  return <Badge colorScheme={color} fontSize="xs">{label}</Badge>;
}

function stateBadge(state: string) {
  const map: Record<string, { color: string; label: string }> = {
    active:        { color: 'green',  label: 'Active'        },
    inactive:      { color: 'yellow', label: 'Inactive'      },
    not_activated: { color: 'gray',   label: 'Not Activated' },
  };
  const { color, label } = map[state] ?? { color: 'gray', label: state };
  return <Badge colorScheme={color} fontSize="xs">{label}</Badge>;
}

function jobStatusBadge(status: string) {
  const map: Record<string, string> = {
    completed: 'green',
    failed:    'red',
    running:   'blue',
    pending:   'gray',
  };
  return <Badge colorScheme={map[status] ?? 'gray'} fontSize="2xs">{status}</Badge>;
}

function roleBadge(role: string) {
  const map: Record<string, string> = {
    tenant_admin: 'purple',
    technician:   'blue',
    viewer:       'gray',
    assistant:    'teal',
  };
  return <Badge colorScheme={map[role] ?? 'gray'} variant="subtle" fontSize="2xs">{role}</Badge>;
}

// ── Section Card ─────────────────────────────────────────────────────────────
function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box bg="gray.900" border="1px solid" borderColor="gray.700" borderRadius="lg" p={5} mb={5}>
      <Heading size="sm" color="gray.200" mb={4} pb={3} borderBottom="1px solid" borderColor="gray.700">
        {title}
      </Heading>
      {children}
    </Box>
  );
}

// ── Stat Cell ────────────────────────────────────────────────────────────────
function StatCell({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Box>
      <Text fontSize="xs" color="gray.500" mb={1}>{label}</Text>
      <Text fontSize="sm" color="gray.100" fontWeight="medium">{value}</Text>
    </Box>
  );
}

// ── Setup Checklist ───────────────────────────────────────────────────────────
function CheckItem({ done, label }: { done: boolean; label: string }) {
  return (
    <HStack spacing={2}>
      <Box
        w={4} h={4} borderRadius="full" flexShrink={0}
        bg={done ? 'green.500' : 'gray.700'}
        border="1px solid"
        borderColor={done ? 'green.400' : 'gray.600'}
        display="flex" alignItems="center" justifyContent="center"
      >
        {done && <Text fontSize="2xs" color="white" lineHeight={1}>✓</Text>}
      </Box>
      <Text fontSize="sm" color={done ? 'gray.200' : 'gray.500'}>{label}</Text>
    </HStack>
  );
}

// ── Async fetch helper ────────────────────────────────────────────────────────
async function adminFetch(endpoint: string) {
  if (isDemoMode()) {
    return demoFetch(endpoint, 'GET');
  }
  const res = await fetch(`${API_BASE}${endpoint}`, { headers: ADMIN_HEADERS });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as Record<string, string>).detail || `HTTP ${res.status}`);
  }
  return res.json();
}

async function adminPatch(endpoint: string, body: Record<string, unknown>) {
  if (isDemoMode()) {
    return demoFetch(endpoint, 'PATCH', body);
  }
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'PATCH',
    headers: ADMIN_HEADERS,
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function adminPost(endpoint: string, body?: Record<string, unknown>) {
  if (isDemoMode()) {
    return demoFetch(endpoint, 'POST', body);
  }
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: ADMIN_HEADERS,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function TenantDetailPage() {
  const params    = useParams();
  const router    = useRouter();
  const toast     = useToast();
  const tenantId  = (params?.tenant_id as string) ?? '';

  const [detail,    setDetail]    = useState<TenantDetail | null>(null);
  const [users,     setUsers]     = useState<TenantUsers | null>(null);
  const [usage,     setUsage]     = useState<TenantUsage | null>(null);
  const [ingestion, setIngestion] = useState<TenantIngestion | null>(null);
  const [billingAdmin, setBillingAdmin] = useState<TenantBillingAdmin | null>(null);
  const [syncingSeats, setSyncingSeats] = useState(false);

  const [loadingDetail,    setLoadingDetail]    = useState(true);
  const [loadingUsers,     setLoadingUsers]     = useState(true);
  const [loadingUsage,     setLoadingUsage]     = useState(true);
  const [loadingIngestion, setLoadingIngestion] = useState(true);
  const [notFound,         setNotFound]         = useState(false);
  const [saving,           setSaving]           = useState(false);

  // Edit modal
  const { isOpen: isEditOpen, onOpen: openEdit, onClose: closeEdit } = useDisclosure();
  // Suspend confirm
  const { isOpen: isSuspendOpen, onOpen: openSuspend, onClose: closeSuspend } = useDisclosure();
  // Delete confirm
  const { isOpen: isDeleteOpen, onOpen: openDelete, onClose: closeDelete } = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);

  const [editForm, setEditForm] = useState({
    name: ''  , plan: '', billing_status: '',
    trial_ends_at: '', stripe_customer_id: '', stripe_subscription_id: '',
  });
  const [suspendReason, setSuspendReason] = useState('');

  const isSystem = SYSTEM_TENANTS.includes(tenantId);

  // ── Fetch all data in parallel ────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    if (!tenantId) return;
    setLoadingDetail(true); setLoadingUsers(true);
    setLoadingUsage(true);  setLoadingIngestion(true);
    setNotFound(false);

    const [d, u, us, ing, bil] = await Promise.allSettled([
      adminFetch(`/api/admin/tenants/${tenantId}`),
      adminFetch(`/api/admin/tenants/${tenantId}/users`),
      adminFetch(`/api/admin/tenants/${tenantId}/usage`),
      adminFetch(`/api/admin/tenants/${tenantId}/ingestion`),
      adminFetch(`/api/admin/tenants/${tenantId}/billing`).catch(() => null),
    ]);

    if (d.status === 'fulfilled') {
      setDetail(d.value as TenantDetail);
    } else {
      if (String(d.reason).includes('tenant_not_found') || String(d.reason).includes('404')) {
        setNotFound(true);
      }
      toast({ title: 'Failed to load tenant', description: String(d.reason), status: 'error', duration: 4000 });
    }
    setLoadingDetail(false);

    if (u.status === 'fulfilled')  setUsers(u.value as TenantUsers);
    setLoadingUsers(false);

    if (us.status === 'fulfilled') setUsage(us.value as TenantUsage);
    setLoadingUsage(false);

    if (ing.status === 'fulfilled') setIngestion(ing.value as TenantIngestion);
    if (bil && bil.status === 'fulfilled') setBillingAdmin(bil.value as TenantBillingAdmin);
    setLoadingIngestion(false);
  }, [tenantId, toast]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const syncSeats = async () => {
    setSyncingSeats(true);
    try {
      const ADMIN_BASE = process.env.NEXT_PUBLIC_ADMIN_API_URL || process.env.NEXT_PUBLIC_PM_API_URL || 'http://localhost:8100';
      await fetch(`${ADMIN_BASE}/api/admin/tenants/${tenantId}/billing/sync-seats`, {
        method: 'POST',
        headers: { 'x-admin-key': process.env.NEXT_PUBLIC_ADMIN_KEY || '', 'x-tenant-id': tenantId },
      });
      // Reload billing
      const updated = await adminFetch(`/api/admin/tenants/${tenantId}/billing`);
      setBillingAdmin(updated as TenantBillingAdmin);
    } catch (e) {
      toast({ title: 'Sync failed', description: String(e), status: 'error', duration: 3000 });
    } finally {
      setSyncingSeats(false);
    }
  };

  function startEdit() {
    if (!detail) return;
    setEditForm({
      name:                    detail.name                    ?? '',
      plan:                    detail.plan                    ?? '',
      billing_status:          detail.billing_status          ?? '',
      trial_ends_at:           detail.trial_ends_at?.slice(0, 10) ?? '',
      stripe_customer_id:      detail.stripe_customer_id      ?? '',
      stripe_subscription_id:  detail.stripe_subscription_id  ?? '',
    });
    openEdit();
  }

  async function handleEdit() {
    if (!detail) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {};
      if (editForm.name)                   payload.name                   = editForm.name;
      if (editForm.plan)                   payload.plan                   = editForm.plan;
      if (editForm.billing_status)         payload.billing_status         = editForm.billing_status;
      if (editForm.trial_ends_at)          payload.trial_ends_at          = editForm.trial_ends_at;
      if (editForm.stripe_customer_id)     payload.stripe_customer_id     = editForm.stripe_customer_id;
      if (editForm.stripe_subscription_id) payload.stripe_subscription_id = editForm.stripe_subscription_id;

      await adminPatch(`/api/admin/tenants/${tenantId}`, payload);
      toast({ title: 'Tenant updated', status: 'success', duration: 2500 });
      closeEdit();
      loadAll();
    } catch (e) {
      toast({ title: String(e instanceof Error ? e.message : e), status: 'error', duration: 3000 });
    } finally {
      setSaving(false);
    }
  }

  async function handleSuspend() {
    if (!detail) return;
    setSaving(true);
    const isCurrentlySuspended = detail.billing_status === 'suspended';
    try {
      const body: Record<string, unknown> = {};
      if (!isCurrentlySuspended && suspendReason) body.reason = suspendReason;
      const data = await adminPost(`/api/admin/tenants/${tenantId}/suspend`, body) as Record<string, string>;
      toast({ title: data.message ?? 'Status updated', status: 'info', duration: 2500 });
      closeSuspend();
      setSuspendReason('');
      loadAll();
    } catch (e) {
      toast({ title: String(e instanceof Error ? e.message : e), status: 'error', duration: 3000 });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setSaving(true);
    try {
      if (isDemoMode()) {
        await demoFetch(`/api/admin/tenants/${tenantId}`, 'DELETE');
      } else {
        const res = await fetch(`${API_BASE}/api/admin/tenants/${tenantId}`, {
          method: 'DELETE', headers: ADMIN_HEADERS,
        });
        if (!res.ok) throw new Error('Delete failed');
      }
      toast({ title: `'${detail?.name}' deleted`, status: 'success', duration: 3000 });
      router.push('/pm/admin/clients');
    } catch (e) {
      toast({ title: String(e instanceof Error ? e.message : e), status: 'error', duration: 3000 });
    } finally {
      setSaving(false);
    }
  }

  // ── Not found ─────────────────────────────────────────────────────────────
  if (notFound) {
    return (
      <Box minH="100vh" bg="gray.950" color="gray.100" px={6} py={10}>
        <Button size="sm" variant="ghost" colorScheme="gray" mb={6} onClick={() => router.push('/pm/admin/clients')}>
          ← Back to Clients
        </Button>
        <Flex direction="column" align="center" justify="center" py={20}>
          <Text fontSize="lg" color="gray.400" mb={2}>Tenant not found</Text>
          <Text fontSize="sm" color="gray.600">ID: {tenantId}</Text>
        </Flex>
      </Box>
    );
  }

  const isSuspended = detail?.billing_status === 'suspended';

  return (
    <Box minH="100vh" bg="gray.950" color="gray.100">
      <Box maxW="1100px" mx="auto" px={4} py={6}>

        {/* ── Header Bar ── */}
        <Flex align="center" justify="space-between" mb={6} flexWrap="wrap" gap={3}>
          <HStack spacing={3}>
            <Button size="sm" variant="ghost" colorScheme="gray" onClick={() => router.push('/pm/admin/clients')}>
              ← Clients
            </Button>
            {loadingDetail ? (
              <Spinner size="sm" color="blue.400" />
            ) : (
              <HStack spacing={2}>
                <Heading size="md" color="white">
                  {detail?.name ?? tenantId}
                </Heading>
                {detail && billingBadge(detail.billing_status)}
                {detail && planBadge(detail.plan)}
              </HStack>
            )}
          </HStack>

          <HStack spacing={2}>
            <Button size="sm" variant="outline" colorScheme="gray" onClick={startEdit} isDisabled={!detail}>
              Edit
            </Button>
            {!isSystem && detail && (
              <Button
                size="sm" variant="outline"
                colorScheme={isSuspended ? 'green' : 'orange'}
                onClick={openSuspend}
              >
                {isSuspended ? 'Restore' : 'Suspend'}
              </Button>
            )}
            {!isSystem && (
              <Button size="sm" variant="outline" colorScheme="red" onClick={openDelete} isDisabled={!detail}>
                Delete
              </Button>
            )}
          </HStack>
        </Flex>

        {/* ── Section 1: Overview ── */}
        <SectionCard title="Overview">
          {loadingDetail ? (
            <Flex justify="center" py={6}><Spinner color="blue.400" /></Flex>
          ) : detail ? (
            <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={5}>
              <StatCell label="Tenant ID" value={
                <Text fontFamily="mono" fontSize="sm" color="blue.300">{detail.id}</Text>
              } />
              <StatCell label="Subdomain" value={
                <Text fontFamily="mono" fontSize="sm" color="blue.300">{detail.subdomain}.signal.fieldstone.pro</Text>
              } />
              <StatCell label="Created" value={fmtDate(detail.created_at)} />
              <StatCell label="Trial Ends" value={fmtDate(detail.trial_ends_at)} />
              <StatCell label="Last Updated" value={fmtDateTime(detail.updated_at)} />
              <StatCell label="Clerk Org" value={
                <Text fontFamily="mono" fontSize="xs" color="gray.400">{
                  detail.clerk_org_id ?? 'not set'
                }</Text>
              } />
              {isSuspended && (
                <>
                  <StatCell label="Suspended At"   value={fmtDateTime(detail.suspended_at)} />
                  <StatCell label="Suspended By"   value={detail.suspended_by   ?? '—'} />
                  <StatCell label="Suspension Reason" value={
                    <Text fontSize="sm" color="orange.300">{detail.suspension_reason ?? 'No reason provided'}</Text>
                  } />
                </>
              )}
            </Grid>
          ) : (
            <Text color="gray.500">No data</Text>
          )}
        </SectionCard>

        {/* ── Section 2: Activation / Setup ── */}
        <SectionCard title="Activation &amp; Setup">
          {loadingDetail ? (
            <Flex justify="center" py={4}><Spinner size="sm" color="blue.400" /></Flex>
          ) : detail?.setup ? (
            <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={6}>
              <Box>
                <HStack mb={3} justify="space-between">
                  <Text fontSize="sm" color="gray.300">Setup Progress</Text>
                  <HStack spacing={2}>
                    {activationBadge(detail.setup.activation_state)}
                    <Text fontSize="sm" fontWeight="bold" color="white">
                      {detail.setup.setup_completion_pct}%
                    </Text>
                  </HStack>
                </HStack>
                <Progress
                  value={detail.setup.setup_completion_pct}
                  colorScheme={detail.setup.setup_completion_pct === 100 ? 'green' : 'blue'}
                  bg="gray.700" borderRadius="full" size="sm" mb={5}
                />
                <VStack align="start" spacing={2}>
                  <CheckItem done={detail.setup.has_org}                  label="Organization created" />
                  <CheckItem done={detail.setup.imap_connected}           label="Inbox connected (IMAP)" />
                  <CheckItem done={detail.setup.ai_configured}            label="AI provider configured" />
                  <CheckItem done={!!detail.setup.first_ingestion_at}     label="First ingestion completed" />
                  <CheckItem done={detail.setup.notifications_configured} label="Notifications configured" />
                </VStack>
              </Box>
              <Box>
                <Grid templateColumns="1fr 1fr" gap={4}>
                  <StatCell label="First Ingestion" value={fmtDateTime(detail.setup.first_ingestion_at)} />
                  <StatCell label="Activation State" value={activationBadge(detail.setup.activation_state)} />
                </Grid>
              </Box>
            </Grid>
          ) : (
            <Text color="gray.500" fontSize="sm">Setup data unavailable</Text>
          )}
        </SectionCard>

        {/* ── Section 3: Team / Seats ── */}
        <SectionCard title="Team &amp; Seats">
          {loadingUsers ? (
            <Flex justify="center" py={4}><Spinner size="sm" color="blue.400" /></Flex>
          ) : users ? (
            <>
              <Grid templateColumns={{ base: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }} gap={4} mb={5}>
                <Box bg="gray.800" borderRadius="md" p={3} textAlign="center">
                  <Text fontSize="2xl" fontWeight="bold" color="white">{users.total_users}</Text>
                  <Text fontSize="xs" color="gray.400">Total Members</Text>
                </Box>
                <Box bg="gray.800" borderRadius="md" p={3} textAlign="center">
                  <Text fontSize="2xl" fontWeight="bold" color="green.400">{users.active_last_30_days}</Text>
                  <Text fontSize="xs" color="gray.400">Active (30d)</Text>
                </Box>
                <Box bg="gray.800" borderRadius="md" p={3} textAlign="center">
                  <Text fontSize="2xl" fontWeight="bold" color="blue.400">{users.billable_seat_candidate_count}</Text>
                  <Text fontSize="xs" color="gray.400">Billable Seats</Text>
                </Box>
                <Box bg="gray.800" borderRadius="md" p={3} textAlign="center">
                  <Text fontSize="2xl" fontWeight="bold" color="teal.400">{users.pilot_count}</Text>
                  <Text fontSize="xs" color="gray.400">AI Assistants</Text>
                </Box>
              </Grid>
              {users.items.length > 0 ? (
                <Box overflowX="auto">
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th color="gray.400" borderColor="gray.700">Name</Th>
                        <Th color="gray.400" borderColor="gray.700">Email</Th>
                        <Th color="gray.400" borderColor="gray.700">Role</Th>
                        <Th color="gray.400" borderColor="gray.700">Alias</Th>
                        <Th color="gray.400" borderColor="gray.700">Last Active</Th>
                        <Th color="gray.400" borderColor="gray.700">Clerk</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {users.items.map(u => (
                        <Tr key={u.id} _hover={{ bg: 'gray.800' }}>
                          <Td borderColor="gray.700">
                            <Text fontSize="sm" color={u.active_last_30d ? 'gray.100' : 'gray.500'}>
                              {u.name}
                            </Text>
                          </Td>
                          <Td borderColor="gray.700">
                            <Text fontSize="xs" color="gray.400" fontFamily="mono">
                              {u.email ?? '—'}
                            </Text>
                          </Td>
                          <Td borderColor="gray.700">{roleBadge(u.role)}</Td>
                          <Td borderColor="gray.700">
                            <Text fontSize="xs" color="gray.400">{u.assigned_to_alias ?? '—'}</Text>
                          </Td>
                          <Td borderColor="gray.700">
                            <Text fontSize="xs" color={u.active_last_30d ? 'green.400' : 'gray.500'}>
                              {fmtDateTime(u.last_active_at)}
                            </Text>
                          </Td>
                          <Td borderColor="gray.700">
                            <Badge colorScheme={u.has_clerk_user ? 'green' : 'gray'} fontSize="2xs">
                              {u.has_clerk_user ? 'linked' : 'none'}
                            </Badge>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              ) : (
                <Text color="gray.500" fontSize="sm" mt={2}>No users provisioned yet.</Text>
              )}
            </>
          ) : (
            <Text color="gray.500" fontSize="sm">User data unavailable</Text>
          )}
        </SectionCard>

        {/* ── Section 4: Usage / Health ── */}
        <SectionCard title="Usage &amp; Health">
          {loadingUsage ? (
            <Flex justify="center" py={4}><Spinner size="sm" color="blue.400" /></Flex>
          ) : usage ? (
            <>
              <Grid templateColumns={{ base: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }} gap={4} mb={5}>
                <Box bg="gray.800" borderRadius="md" p={3} textAlign="center">
                  <Text fontSize="2xl" fontWeight="bold" color="white">{usage.ticket_count}</Text>
                  <Text fontSize="xs" color="gray.400">Tickets</Text>
                </Box>
                <Box bg="gray.800" borderRadius="md" p={3} textAlign="center">
                  <Text fontSize="2xl" fontWeight="bold" color="teal.400">{usage.intel_count}</Text>
                  <Text fontSize="xs" color="gray.400">Intel Entries</Text>
                </Box>
                <Box bg="gray.800" borderRadius="md" p={3} textAlign="center">
                  <Text fontSize="2xl" fontWeight="bold" color={usage.outbreak_count > 0 ? 'orange.400' : 'gray.400'}>
                    {usage.outbreak_count}
                  </Text>
                  <Text fontSize="xs" color="gray.400">Active Outbreaks</Text>
                </Box>
                <Box bg="gray.800" borderRadius="md" p={3} textAlign="center">
                  <Box mb={1}>{stateBadge(usage.tenant_state_summary)}</Box>
                  <Text fontSize="xs" color="gray.400">Health State</Text>
                </Box>
              </Grid>
              <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={4} mb={5}>
                <StatCell label="Last User Activity" value={fmtDateTime(usage.last_user_activity_at)} />
                <StatCell label="Last Ticket Created" value={fmtDateTime(usage.last_ticket_created_at)} />
                <StatCell label="Last Ingestion" value={fmtDateTime(usage.latest_ingestion_at)} />
              </Grid>
            </>
          ) : (
            <Text color="gray.500" fontSize="sm">Usage data unavailable</Text>
          )}

          {/* Ingestion Jobs */}
          <Divider borderColor="gray.700" my={4} />
          <Heading size="xs" color="gray.400" mb={3}>Recent Ingestion Jobs</Heading>
          {loadingIngestion ? (
            <Flex justify="center" py={3}><Spinner size="sm" color="blue.400" /></Flex>
          ) : ingestion && ingestion.items.length > 0 ? (
            <Box overflowX="auto">
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th color="gray.400" borderColor="gray.700">Ticket ID</Th>
                    <Th color="gray.400" borderColor="gray.700">Status</Th>
                    <Th color="gray.400" borderColor="gray.700">Created</Th>
                    <Th color="gray.400" borderColor="gray.700">Duration</Th>
                    <Th color="gray.400" borderColor="gray.700">Error</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {ingestion.items.map(job => (
                    <Tr key={job.ticket_id} _hover={{ bg: 'gray.800' }}>
                      <Td borderColor="gray.700">
                        <Text fontSize="xs" fontFamily="mono" color="blue.300">{job.ticket_id}</Text>
                      </Td>
                      <Td borderColor="gray.700">{jobStatusBadge(job.status)}</Td>
                      <Td borderColor="gray.700">
                        <Text fontSize="xs" color="gray.400">{fmtDateTime(job.created_at)}</Text>
                      </Td>
                      <Td borderColor="gray.700">
                        <Text fontSize="xs" color="gray.400">{fmtDuration(job.duration_ms)}</Text>
                      </Td>
                      <Td borderColor="gray.700">
                        {job.error ? (
                          <Tooltip label={job.error} placement="top" hasArrow>
                            <Text fontSize="xs" color="red.400" isTruncated maxW="200px" cursor="help">
                              {job.error}
                            </Text>
                          </Tooltip>
                        ) : (
                          <Text fontSize="xs" color="gray.600">—</Text>
                        )}
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          ) : (
            <Text color="gray.500" fontSize="sm">No ingestion jobs found.</Text>
          )}
        </SectionCard>

        {/* ── Section 5: Billing ── */}
        <SectionCard title="Billing">
          {loadingDetail ? (
            <Flex justify="center" py={4}><Spinner size="sm" color="blue.400" /></Flex>
          ) : detail ? (
            <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={5}>
              <StatCell label="Plan"           value={planBadge(detail.plan)} />
              <StatCell label="Billing Status" value={billingBadge(detail.billing_status)} />
              <StatCell label="Trial Ends"     value={fmtDate(detail.trial_ends_at)} />
              <StatCell label="Stripe Customer ID" value={
                <Text fontFamily="mono" fontSize="xs" color={detail.stripe_customer_id ? 'gray.300' : 'gray.600'}>
                  {detail.stripe_customer_id ?? 'not set'}
                </Text>
              } />
              <StatCell label="Stripe Subscription ID" value={
                <Text fontFamily="mono" fontSize="xs" color={detail.stripe_subscription_id ? 'gray.300' : 'gray.600'}>
                  {detail.stripe_subscription_id ?? 'not set'}
                </Text>
              } />
            </Grid>
          ) : (
            <Text color="gray.500" fontSize="sm">Billing data unavailable</Text>
          )}
        </SectionCard>

      </Box>

      {/* ── Edit Modal ── */}
      <Modal isOpen={isEditOpen} onClose={closeEdit} isCentered size="md">
        <ModalOverlay bg="blackAlpha.800" />
        <ModalContent bg="gray.900" border="1px solid" borderColor="gray.700">
          <ModalHeader color="white" fontSize="md">Edit — {detail?.name}</ModalHeader>
          <ModalCloseButton color="gray.400" />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel fontSize="sm" color="gray.300">Name</FormLabel>
                <Input bg="gray.800" border="1px solid" borderColor="gray.600" color="white" size="sm"
                  value={editForm.name}
                  onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm" color="gray.300">Plan</FormLabel>
                <Select bg="gray.800" border="1px solid" borderColor="gray.600" color="white" size="sm"
                  value={editForm.plan}
                  onChange={e => setEditForm(f => ({ ...f, plan: e.target.value }))}
                >
                  <option value="starter">Starter</option>
                  <option value="pro">Pro</option>
                  <option value="internal">Internal</option>
                  <option value="demo">Demo</option>
                </Select>
              </FormControl>
              {!isSystem && (
                <FormControl>
                  <FormLabel fontSize="sm" color="gray.300">Billing Status</FormLabel>
                  <Select bg="gray.800" border="1px solid" borderColor="gray.600" color="white" size="sm"
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
                <Input bg="gray.800" border="1px solid" borderColor="gray.600" color="white" size="sm"
                  type="date"
                  value={editForm.trial_ends_at}
                  onChange={e => setEditForm(f => ({ ...f, trial_ends_at: e.target.value }))}
                />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm" color="gray.300">Stripe Customer ID</FormLabel>
                <Input bg="gray.800" border="1px solid" borderColor="gray.600" color="white" size="sm"
                  fontFamily="mono" placeholder="cus_..."
                  value={editForm.stripe_customer_id}
                  onChange={e => setEditForm(f => ({ ...f, stripe_customer_id: e.target.value }))}
                />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm" color="gray.300">Stripe Subscription ID</FormLabel>
                <Input bg="gray.800" border="1px solid" borderColor="gray.600" color="white" size="sm"
                  fontFamily="mono" placeholder="sub_..."
                  value={editForm.stripe_subscription_id}
                  onChange={e => setEditForm(f => ({ ...f, stripe_subscription_id: e.target.value }))}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter gap={2}>
            <Button size="sm" variant="ghost" colorScheme="gray" onClick={closeEdit}>Cancel</Button>
            <Button size="sm" colorScheme="blue" isLoading={saving} onClick={handleEdit}>Save Changes</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>


      {/* ── Phase 35B: Billing ──────────────────────────────────────────── */}
      <Box mt={6}>
        <Divider borderColor="gray.700" my={4} />
        <Flex justify="space-between" align="center" mb={3}>
          <Heading size="xs" color="gray.400">Billing &amp; Seats</Heading>
          <Button
            size="xs" colorScheme="blue" variant="outline"
            isLoading={syncingSeats}
            onClick={syncSeats}
          >
            Sync Seats
          </Button>
        </Flex>

        {billingAdmin ? (
          <>
            {/* Summary row */}
            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3} mb={4}>
              <Box bg="gray.800" borderRadius="md" p={3}>
                <Text fontSize="xs" color="gray.500">Status</Text>
                <Badge colorScheme={
                  billingAdmin.billing_status === 'active' ? 'green' :
                  billingAdmin.billing_status === 'trial'  ? 'blue'  :
                  billingAdmin.billing_status === 'past_due' ? 'orange' : 'red'
                } mt={1}>
                  {billingAdmin.billing_status}
                </Badge>
              </Box>
              <Box bg="gray.800" borderRadius="md" p={3}>
                <Text fontSize="xs" color="gray.500">Billable Seats</Text>
                <Text fontWeight="bold" color="blue.300">{billingAdmin.seats?.billable_seats ?? '—'}</Text>
              </Box>
              <Box bg="gray.800" borderRadius="md" p={3}>
                <Text fontSize="xs" color="gray.500">Synced Count</Text>
                <Text fontWeight="bold" color="white">{billingAdmin.current_seat_count ?? '—'}</Text>
              </Box>
              <Box bg="gray.800" borderRadius="md" p={3}>
                <Text fontSize="xs" color="gray.500">Last Sync</Text>
                <Text fontSize="xs" color="gray.400">
                  {billingAdmin.last_seat_sync_at
                    ? new Date(billingAdmin.last_seat_sync_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    : '—'}
                </Text>
              </Box>
            </SimpleGrid>

            {/* Active Users Table */}
            {billingAdmin.seats?.users && billingAdmin.seats.users.length > 0 && (
              <Box mb={4}>
                <Text fontSize="xs" color="gray.500" mb={2}>Active Billable Users (last 30d)</Text>
                <Box overflowX="auto">
                  <Table size="sm" variant="unstyled">
                    <Thead>
                      <Tr>
                        <Th color="gray.500" fontSize="2xs" px={2}>Name</Th>
                        <Th color="gray.500" fontSize="2xs" px={2}>Role</Th>
                        <Th color="gray.500" fontSize="2xs" px={2}>Last Active</Th>
                        <Th color="gray.500" fontSize="2xs" px={2}>Billable</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {billingAdmin.seats.users.map(u => (
                        <Tr key={u.id} _hover={{ bg: 'gray.800' }}>
                          <Td px={2} py={1} fontSize="xs" color="white">{u.name}</Td>
                          <Td px={2} py={1}>
                            <Badge fontSize="2xs" colorScheme={u.role === 'tenant_admin' ? 'purple' : 'blue'}>
                              {u.role === 'tenant_admin' ? 'Admin' : 'Tech'}
                            </Badge>
                          </Td>
                          <Td px={2} py={1} fontSize="xs" color="gray.400">
                            {u.last_active_at
                              ? new Date(u.last_active_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                              : '—'}
                          </Td>
                          <Td px={2} py={1}>
                            <Badge fontSize="2xs" colorScheme="green">Yes</Badge>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              </Box>
            )}

            {/* Recent Billing Events */}
            {billingAdmin.recent_events && billingAdmin.recent_events.length > 0 && (
              <Box>
                <Text fontSize="xs" color="gray.500" mb={2}>Recent Billing Events</Text>
                <Box overflowX="auto">
                  <Table size="sm" variant="unstyled">
                    <Thead>
                      <Tr>
                        <Th color="gray.500" fontSize="2xs" px={2}>Event</Th>
                        <Th color="gray.500" fontSize="2xs" px={2}>Date</Th>
                        <Th color="gray.500" fontSize="2xs" px={2}>Payload</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {billingAdmin.recent_events.map((ev, i) => (
                        <Tr key={i} _hover={{ bg: 'gray.800' }}>
                          <Td px={2} py={1}>
                            <Badge fontSize="2xs" colorScheme={
                              ev.event_type.includes('error') ? 'red' :
                              ev.event_type.includes('sync') ? 'blue' : 'gray'
                            }>
                              {ev.event_type}
                            </Badge>
                          </Td>
                          <Td px={2} py={1} fontSize="xs" color="gray.400">
                            {ev.created_at ? new Date(ev.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                          </Td>
                          <Td px={2} py={1} fontSize="xs" color="gray.500" maxW="200px" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                            {ev.payload || '—'}
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              </Box>
            )}
          </>
        ) : (
          <Text fontSize="xs" color="gray.600">No billing data available.</Text>
        )}
      </Box>

      {/* ── Suspend / Restore Confirm ── */}
      <AlertDialog isOpen={isSuspendOpen} leastDestructiveRef={cancelRef} onClose={closeSuspend} isCentered>
        <ModalOverlay bg="blackAlpha.800" />
        <AlertDialogContent bg="gray.900" border="1px solid" borderColor="gray.700">
          <AlertDialogHeader fontSize="md" color="white">
            {isSuspended ? 'Restore' : 'Suspend'} — {detail?.name}?
          </AlertDialogHeader>
          <AlertDialogBody>
            {!isSuspended ? (
              <VStack align="start" spacing={3}>
                <Text fontSize="sm" color="gray.300">
                  This will set billing status to suspended. The tenant will lose access.
                </Text>
                <FormControl>
                  <FormLabel fontSize="sm" color="gray.400">Reason (optional)</FormLabel>
                  <Textarea
                    bg="gray.800" border="1px solid" borderColor="gray.600" color="white" size="sm"
                    placeholder="Non-payment, policy violation, etc."
                    rows={2}
                    value={suspendReason}
                    onChange={e => setSuspendReason(e.target.value)}
                  />
                </FormControl>
              </VStack>
            ) : (
              <Text fontSize="sm" color="gray.300">
                This will restore the tenant to active status and clear suspension metadata.
              </Text>
            )}
          </AlertDialogBody>
          <AlertDialogFooter gap={2}>
            <Button ref={cancelRef} size="sm" variant="ghost" colorScheme="gray" onClick={closeSuspend}>
              Cancel
            </Button>
            <Button
              size="sm"
              colorScheme={isSuspended ? 'green' : 'orange'}
              isLoading={saving}
              onClick={handleSuspend}
            >
              {isSuspended ? 'Restore Access' : 'Suspend Tenant'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Delete Confirm ── */}
      <AlertDialog isOpen={isDeleteOpen} leastDestructiveRef={cancelRef} onClose={closeDelete} isCentered>
        <ModalOverlay bg="blackAlpha.800" />
        <AlertDialogContent bg="gray.900" border="1px solid" borderColor="red.800">
          <AlertDialogHeader fontSize="md" color="white">Delete "{detail?.name}"?</AlertDialogHeader>
          <AlertDialogBody>
            <Text fontSize="sm" color="gray.300">
              This will permanently delete the tenant and all associated tickets, intel, and data.
              This action cannot be undone.
            </Text>
          </AlertDialogBody>
          <AlertDialogFooter gap={2}>
            <Button ref={cancelRef} size="sm" variant="ghost" colorScheme="gray" onClick={closeDelete}>
              Cancel
            </Button>
            <Button size="sm" colorScheme="red" isLoading={saving} onClick={handleDelete}>
              Delete Permanently
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </Box>
  );
}
