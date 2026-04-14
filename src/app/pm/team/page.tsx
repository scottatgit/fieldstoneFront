'use client';
import {
  Box, Flex, HStack, VStack, Text, Badge, Button, Spinner,
  Table, Thead, Tbody, Tr, Th, Td, TableContainer,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton,
  Input, Select, FormControl, FormLabel,
  useDisclosure, AlertDialog, AlertDialogBody, AlertDialogFooter,
  AlertDialogHeader, AlertDialogContent, AlertDialogOverlay,
  Stat, StatLabel, StatNumber, SimpleGrid, ChakraProvider,
} from '@chakra-ui/react';
import { useEffect, useState, useRef, useCallback } from 'react';
import { SummaryBar } from '@/components/pm/SummaryBar';
import { DemoBanner } from '@/components/pm/DemoBanner';
import { pmFetch, isDemoMode } from '@/lib/demoApi';
import pmTheme from '@/components/pm/pmTheme';

const API = '/pm-api'; // always use relative proxy — hardcoded to avoid localhost fallback on Vercel

interface TenantUser {
  id: string;
  tenant_id: string;
  clerk_user_id?: string;
  name: string;
  email?: string;
  role: string;
  assigned_to_alias?: string;
  last_active_at?: string;
  created_at: string;
  totp_enabled?: boolean;
}

function timeAgo(iso?: string): string {
  if (!iso) return 'Never';
  try {
    const ms = Date.now() - new Date(iso).getTime();
    const m = Math.floor(ms / 60000);
    const h = Math.floor(ms / 3600000);
    const d = Math.floor(ms / 86400000);
    if (m < 2) return 'Just now';
    if (h < 1) return `${m}m ago`;
    if (h < 24) return `${h}h ago`;
    if (d < 7) return `${d}d ago`;
    return new Date(iso).toLocaleDateString();
  } catch { return '—'; }
}

function RoleBadge({ role }: { role: string }) {
  const schemes: Record<string, string> = {
    tenant_admin: 'purple', technician: 'blue', viewer: 'gray', assistant: 'green',
  };
  const labels: Record<string, string> = {
    tenant_admin: 'Admin', technician: 'Technician', viewer: 'Viewer', assistant: 'AI Pilot',
  };
  return <Badge colorScheme={schemes[role] || 'gray'} fontSize="xs">{labels[role] || role}</Badge>;
}

export default function TeamPage() {
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalUsers, setTotalUsers] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);

  const { isOpen: addOpen, onOpen: openAdd, onClose: closeAdd } = useDisclosure();
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('technician');
  const [newAlias, setNewAlias] = useState('');
  const [saving, setSaving] = useState(false);

  const { isOpen: editOpen, onOpen: openEdit, onClose: closeEdit } = useDisclosure();
  const [editUser, setEditUser] = useState<TenantUser | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editAlias, setEditAlias] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const { isOpen: delOpen, onOpen: openDel, onClose: closeDel } = useDisclosure();
  const [delUser, setDelUser] = useState<TenantUser | null>(null);
  const [deleting, setDeleting] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);

  // FST-037: Tenant-admin MFA reset state
  const { isOpen: mfaResetOpen, onOpen: openMfaReset, onClose: closeMfaReset } = useDisclosure();
  const [mfaResetUser, setMfaResetUser] = useState<TenantUser | null>(null);
  const [mfaResetting, setMfaResetting] = useState(false);
  const [mfaResetDone, setMfaResetDone] = useState(false);
  const [mfaResetError, setMfaResetError] = useState('');
  const mfaCancelRef = useRef<HTMLButtonElement>(null);

  // Invite state
  const [inviteRole,   setInviteRole]   = useState('technician');
  const [inviteUrl,    setInviteUrl]    = useState('');
  const [inviteExp,    setInviteExp]    = useState('');
  const [inviteLoading,setInviteLoading]= useState(false);
  const [inviteError,  setInviteError]  = useState('');

  async function handleGenerateInvite() {
    setInviteLoading(true); setInviteUrl(''); setInviteError('');
    try {
      const res = await fetch(`${API}/api/tenant/invites`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: inviteRole }),
      });
      const data = await res.json();
      if (!res.ok) { setInviteError(data.detail || 'Failed to generate invite'); return; }
      setInviteUrl(data.invite_url);
      setInviteExp(new Date(data.expires_at).toLocaleString());
    } catch {
      setInviteError('Could not connect to server');
    } finally {
      setInviteLoading(false);
    }
  }

  const fetchUsers = useCallback(async () => {
    try {
      const res = await pmFetch('/api/tenant/users', API) as Record<string, unknown>;
      setUsers((res?.items as TenantUser[]) ?? []);
      setTotalUsers((res?.total_users as number) ?? 0);
      setActiveUsers((res?.active_last_30_days as number) ?? 0);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  async function handleAddMember() {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      await pmFetch('/api/tenant/users', API, {
        method: 'POST',
        body: JSON.stringify({ name: newName.trim(), email: newEmail.trim(), role: newRole, assigned_to_alias: newAlias.trim() || newName.trim() }),
      });
      setNewName(''); setNewEmail(''); setNewRole('technician'); setNewAlias('');
      closeAdd(); fetchUsers();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  }

  function startEdit(u: TenantUser) {
    setEditUser(u); setEditName(u.name); setEditEmail(u.email || '');
    setEditRole(u.role); setEditAlias(u.assigned_to_alias || u.name);
    openEdit();
  }

  async function handleEditSave() {
    if (!editUser) return;
    setEditSaving(true);
    try {
      await pmFetch(`/api/tenant/users/${editUser.id}`, API, {
        method: 'PATCH',
        body: JSON.stringify({ name: editName, email: editEmail, role: editRole, assigned_to_alias: editAlias || editName }),
      });
      closeEdit(); fetchUsers();
    } catch (e) { console.error(e); }
    finally { setEditSaving(false); }
  }

  async function handleDelete() {
    if (!delUser) return;
    setDeleting(true);
    try {
      await pmFetch(`/api/tenant/users/${delUser.id}`, API, { method: 'DELETE' });
      closeDel(); fetchUsers();
    } catch (e) { console.error(e); }
    finally { setDeleting(false); }
  }

  // FST-037: Tenant-admin MFA reset — same-tenant only, calls POST /api/tenant/users/{id}/mfa/reset
  function startMfaReset(u: TenantUser) {
    setMfaResetUser(u); setMfaResetDone(false); setMfaResetError('');
    openMfaReset();
  }

  async function handleMfaReset() {
    if (!mfaResetUser) return;
    setMfaResetting(true); setMfaResetError('');
    try {
      await pmFetch(`/api/tenant/users/${mfaResetUser.id}/mfa/reset`, API, { method: 'POST' });
      setMfaResetDone(true); fetchUsers();
    } catch (e) {
      setMfaResetError(e instanceof Error ? e.message : 'Reset failed');
    } finally { setMfaResetting(false); }
  }

  const isPilot = (u: TenantUser) => u.role === 'assistant';

  return (
    <ChakraProvider theme={pmTheme}>
      <Box minH="100dvh" bg="gray.950" display="flex" flexDirection="column">
        {isDemoMode() && <DemoBanner />}
        <SummaryBar summary={null} loading={false} />
        <Box p={{ base: 4, md: 6 }} maxW="1100px" mx="auto" w="full">
          <Flex justify="space-between" align="center" mb={6} flexWrap="wrap" gap={3}>
            <VStack align="start" spacing={0}>
              <Text fontSize="xs" fontFamily="mono" color="gray.500" letterSpacing="wider">SIGNAL</Text>
              <Text fontSize="xl" fontWeight="black" fontFamily="mono" color="white" letterSpacing="tight">TEAM</Text>
              <Text fontSize="xs" color="gray.500">Manage technicians and roles for this workspace</Text>
            </VStack>
            <Button size="sm" colorScheme="blue" fontFamily="mono" fontWeight="bold" onClick={openAdd}>+ Add Member</Button>
          </Flex>
          <SimpleGrid columns={{ base: 2, md: 3 }} gap={4} mb={6}>
            {([
              { label: 'TOTAL MEMBERS', value: totalUsers, color: 'blue.300' },
              { label: 'ACTIVE (30d)', value: activeUsers, color: 'green.300' },
              { label: 'AI MEMBERS', value: users.filter(u => isPilot(u)).length, color: 'purple.300' },
            ] as { label: string; value: number; color: string }[]).map(({ label, value, color }) => (
              <Box key={label} p={3} borderRadius="md" border="1px" borderColor="gray.700" bg="gray.900">
                <Stat>
                  <StatLabel fontSize="xs" color="gray.500" fontFamily="mono">{label}</StatLabel>
                  <StatNumber fontSize="2xl" color={color}>{value}</StatNumber>
                </Stat>
              </Box>
            ))}
          </SimpleGrid>
          {loading ? (
            <Flex justify="center" py={12}><Spinner color="blue.400" /></Flex>
          ) : (
            <Box border="1px solid" borderColor="gray.700" borderRadius="lg" overflow="hidden">
              <TableContainer>
                <Table size="sm" variant="simple">
                  <Thead bg="gray.900">
                    <Tr>{['NAME','ROLE','ALIAS','EMAIL','LAST ACTIVE','MFA','ACTIONS'].map(h => (
                      <Th key={h} color="gray.400" fontFamily="mono" fontSize="2xs" borderColor="gray.700">{h}</Th>
                    ))}</Tr>
                  </Thead>
                  <Tbody>
                    {users.map(u => (
                      <Tr key={u.id} borderColor="gray.800" bg={isPilot(u) ? 'rgba(128,90,213,0.05)' : 'transparent'} _hover={{ bg: 'gray.900' }}>
                        <Td borderColor="gray.800">
                          <HStack spacing={2}>
                            <Box w={2} h={2} borderRadius="full" bg={u.last_active_at && Date.now() - new Date(u.last_active_at).getTime() < 86400000 ? 'green.400' : 'gray.600'} />
                            <Text fontSize="sm" color="gray.100" fontWeight={isPilot(u) ? 'bold' : 'normal'}>{u.name}</Text>
                          </HStack>
                        </Td>
                        <Td borderColor="gray.800"><RoleBadge role={u.role} /></Td>
                        <Td borderColor="gray.800"><Text fontSize="xs" fontFamily="mono" color="gray.400">{u.assigned_to_alias || '—'}</Text></Td>
                        <Td borderColor="gray.800"><Text fontSize="xs" color="gray.500">{u.email || '—'}</Text></Td>
                        <Td borderColor="gray.800"><Text fontSize="xs" color={u.last_active_at ? 'gray.300' : 'gray.600'}>{timeAgo(u.last_active_at)}</Text></Td>
                        <Td borderColor="gray.800">
                          {u.totp_enabled
                            ? <Badge colorScheme="purple" fontSize="2xs" fontFamily="mono">MFA ON</Badge>
                            : <Text fontSize="2xs" color="gray.600" fontFamily="mono">—</Text>}
                        </Td>
                        <Td borderColor="gray.800">
                          {!isPilot(u) ? (
                            <HStack spacing={2}>
                              <Button size="xs" variant="ghost" colorScheme="blue" onClick={() => startEdit(u)}>Edit</Button>
                              <Button size="xs" variant="ghost" colorScheme="red" onClick={() => { setDelUser(u); openDel(); }}>Remove</Button>
                              {u.totp_enabled && (
                                <Button size="xs" variant="ghost" colorScheme="orange" onClick={() => startMfaReset(u)}>Reset MFA</Button>
                              )}
                            </HStack>
                          ) : <Text fontSize="2xs" color="purple.500" fontFamily="mono">system</Text>}
                        </Td>
                      </Tr>
                    ))}
                    {users.length === 0 && <Tr><Td colSpan={7} textAlign="center" py={8} color="gray.500" borderColor="gray.800">No team members yet.</Td></Tr>}
                  </Tbody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </Box>

        {/* ── Invite Team Member ── */}
        <Box
          mt={6} p={5} bg="gray.900"
          border="1px solid" borderColor="blue.800"
          borderRadius="xl"
        >
          <VStack align="stretch" spacing={4}>
            <Text fontSize="xs" fontWeight="bold" fontFamily="mono" color="blue.300" letterSpacing="wider">
              INVITE TEAM MEMBER
            </Text>
            <HStack spacing={3} flexWrap="wrap">
              <Box>
                <Text fontSize="2xs" color="gray.400" fontFamily="mono" mb={1}>ROLE</Text>
                <Select
                  size="sm" w="160px"
                  bg="gray.800" borderColor="gray.600" color="gray.100"
                  value={inviteRole}
                  onChange={e => { setInviteRole(e.target.value); setInviteUrl(''); }}
                >
                  <option value="technician">Technician</option>
                  <option value="viewer">Viewer</option>
                </Select>
              </Box>
              <Box alignSelf="flex-end">
                <Button
                  size="sm" colorScheme="blue"
                  fontFamily="mono" fontWeight="bold"
                  isLoading={inviteLoading}
                  onClick={handleGenerateInvite}
                >
                  Generate Invite Link
                </Button>
              </Box>
            </HStack>

            {inviteError && (
              <Text fontSize="xs" color="red.400" fontFamily="mono">{inviteError}</Text>
            )}

            {inviteUrl && (
              <Box p={3} bg="gray.800" borderRadius="md" border="1px solid" borderColor="green.700">
                <VStack align="stretch" spacing={2}>
                  <HStack justify="space-between">
                    <Text fontSize="2xs" color="green.400" fontFamily="mono" fontWeight="bold">INVITE LINK READY</Text>
                    <Text fontSize="2xs" color="gray.500" fontFamily="mono">Expires {inviteExp}</Text>
                  </HStack>
                  <HStack spacing={2}>
                    <Box
                      flex={1} px={3} py={1.5}
                      bg="gray.900" borderRadius="sm"
                      border="1px solid" borderColor="gray.600"
                      fontFamily="mono" fontSize="2xs" color="blue.300"
                      overflow="hidden" whiteSpace="nowrap" textOverflow="ellipsis"
                      as="code"
                    >
                      {inviteUrl}
                    </Box>
                    <Button
                      size="xs" colorScheme="gray" fontFamily="mono"
                      onClick={() => navigator.clipboard.writeText(inviteUrl)}
                    >
                      Copy
                    </Button>
                  </HStack>
                  <Text fontSize="2xs" color="gray.600" fontFamily="mono">
                    Single-use · Valid for 48 hours · Role locked to {inviteRole}
                  </Text>
                </VStack>
              </Box>
            )}
          </VStack>
        </Box>

        <Modal isOpen={addOpen} onClose={closeAdd} isCentered>
          <ModalOverlay bg="blackAlpha.800" />
          <ModalContent bg="gray.900" border="1px solid" borderColor="blue.700" color="gray.100">
            <ModalHeader fontSize="sm" fontFamily="mono" color="blue.300" borderBottom="1px solid" borderColor="gray.700">+ ADD TEAM MEMBER</ModalHeader>
            <ModalCloseButton color="gray.400" />
            <ModalBody py={4}><VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel fontSize="xs" color="gray.400" fontFamily="mono">NAME</FormLabel>
                <Input size="sm" bg="gray.800" borderColor="gray.600" color="gray.100" placeholder="Mike Johnson" value={newName} onChange={e => setNewName(e.target.value)} />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="xs" color="gray.400" fontFamily="mono">EMAIL</FormLabel>
                <Input size="sm" bg="gray.800" borderColor="gray.600" color="gray.100" placeholder="mike@company.com" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="xs" color="gray.400" fontFamily="mono">ROLE</FormLabel>
                <Select size="sm" bg="gray.800" borderColor="gray.600" color="gray.100" value={newRole} onChange={e => setNewRole(e.target.value)}>
                  <option value="technician">Technician</option>
                  <option value="tenant_admin">Admin</option>
                  <option value="viewer">Viewer</option>
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel fontSize="xs" color="gray.400" fontFamily="mono">TICKET ALIAS</FormLabel>
                <Input size="sm" bg="gray.800" borderColor="gray.600" color="gray.100" placeholder="Matches Assigned To in tickets" value={newAlias} onChange={e => setNewAlias(e.target.value)} />
              </FormControl>
            </VStack></ModalBody>
            <ModalFooter borderTop="1px solid" borderColor="gray.700" gap={2}>
              <Button size="sm" variant="ghost" colorScheme="gray" onClick={closeAdd}>Cancel</Button>
              <Button size="sm" colorScheme="blue" isLoading={saving} isDisabled={!newName.trim()} onClick={handleAddMember}>Add Member</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        <Modal isOpen={editOpen} onClose={closeEdit} isCentered>
          <ModalOverlay bg="blackAlpha.800" />
          <ModalContent bg="gray.900" border="1px solid" borderColor="blue.700" color="gray.100">
            <ModalHeader fontSize="sm" fontFamily="mono" color="blue.300" borderBottom="1px solid" borderColor="gray.700">EDIT MEMBER</ModalHeader>
            <ModalCloseButton color="gray.400" />
            <ModalBody py={4}><VStack spacing={4}>
              <FormControl><FormLabel fontSize="xs" color="gray.400" fontFamily="mono">NAME</FormLabel><Input size="sm" bg="gray.800" borderColor="gray.600" color="gray.100" value={editName} onChange={e => setEditName(e.target.value)} /></FormControl>
              <FormControl><FormLabel fontSize="xs" color="gray.400" fontFamily="mono">EMAIL</FormLabel><Input size="sm" bg="gray.800" borderColor="gray.600" color="gray.100" value={editEmail} onChange={e => setEditEmail(e.target.value)} /></FormControl>
              <FormControl><FormLabel fontSize="xs" color="gray.400" fontFamily="mono">ROLE</FormLabel>
                <Select size="sm" bg="gray.800" borderColor="gray.600" color="gray.100" value={editRole} onChange={e => setEditRole(e.target.value)}>
                  <option value="technician">Technician</option>
                  <option value="tenant_admin">Admin</option>
                  <option value="viewer">Viewer</option>
                </Select>
              </FormControl>
              <FormControl><FormLabel fontSize="xs" color="gray.400" fontFamily="mono">TICKET ALIAS</FormLabel><Input size="sm" bg="gray.800" borderColor="gray.600" color="gray.100" value={editAlias} onChange={e => setEditAlias(e.target.value)} /></FormControl>
            </VStack></ModalBody>
            <ModalFooter borderTop="1px solid" borderColor="gray.700" gap={2}>
              <Button size="sm" variant="ghost" colorScheme="gray" onClick={closeEdit}>Cancel</Button>
              <Button size="sm" colorScheme="blue" isLoading={editSaving} onClick={handleEditSave}>Save</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        <AlertDialog isOpen={delOpen} leastDestructiveRef={cancelRef} onClose={closeDel} isCentered>
          <AlertDialogOverlay bg="blackAlpha.800">
            <AlertDialogContent bg="gray.900" border="1px solid" borderColor="red.700" color="gray.100">
              <AlertDialogHeader fontSize="sm" fontFamily="mono" color="red.300" borderBottom="1px solid" borderColor="gray.700">REMOVE MEMBER</AlertDialogHeader>
              <AlertDialogBody py={4} fontSize="sm">Remove <Text as="span" fontWeight="bold" color="white">{delUser?.name}</Text> from this workspace? This cannot be undone.</AlertDialogBody>
              <AlertDialogFooter gap={2}>
                <Button ref={cancelRef} size="sm" variant="ghost" colorScheme="gray" onClick={closeDel}>Cancel</Button>
                <Button size="sm" colorScheme="red" isLoading={deleting} onClick={handleDelete}>Remove</Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>

        {/* FST-037: Tenant-admin MFA reset confirmation dialog.
            Calls POST /api/tenant/users/{id}/mfa/reset (same-tenant only).
            Backend enforces: tenant isolation + cannot reset platform_admin. */}
        <AlertDialog isOpen={mfaResetOpen} leastDestructiveRef={mfaCancelRef} onClose={closeMfaReset} isCentered>
          <AlertDialogOverlay bg="blackAlpha.800">
            <AlertDialogContent bg="gray.900" border="1px solid" borderColor="orange.700" color="gray.100">
              <AlertDialogHeader fontSize="sm" fontFamily="mono" color="orange.300" borderBottom="1px solid" borderColor="gray.700">RESET MFA</AlertDialogHeader>
              <AlertDialogBody py={4} fontSize="sm">
                {mfaResetDone ? (
                  <Text color="green.300" fontFamily="mono" fontSize="xs">✓ MFA cleared for {mfaResetUser?.name}. They must re-enrol from security settings.</Text>
                ) : (
                  <VStack align="stretch" spacing={3}>
                    <Text>Reset MFA for <Text as="span" fontWeight="bold" color="white">{mfaResetUser?.name}</Text>?</Text>
                    <Box p={3} bg="gray.800" borderRadius="md" border="1px solid" borderColor="orange.800">
                      <VStack align="stretch" spacing={1}>
                        <Text fontSize="xs" color="orange.300" fontFamily="mono" fontWeight="bold">THIS WILL PERMANENTLY:</Text>
                        <Text fontSize="xs" color="gray.300">• Disable TOTP for this account</Text>
                        <Text fontSize="xs" color="gray.300">• Delete the authenticator secret</Text>
                        <Text fontSize="xs" color="gray.300">• Delete all recovery codes</Text>
                      </VStack>
                    </Box>
                    <Text fontSize="xs" color="gray.500">The user will need to re-enrol MFA from their security settings.</Text>
                    {mfaResetError && <Text fontSize="xs" color="red.400" fontFamily="mono">{mfaResetError}</Text>}
                  </VStack>
                )}
              </AlertDialogBody>
              <AlertDialogFooter gap={2}>
                <Button ref={mfaCancelRef} size="sm" variant="ghost" colorScheme="gray" onClick={closeMfaReset}>
                  {mfaResetDone ? 'Close' : 'Cancel'}
                </Button>
                {!mfaResetDone && (
                  <Button size="sm" colorScheme="orange" isLoading={mfaResetting} onClick={handleMfaReset}>
                    Reset MFA
                  </Button>
                )}
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
      </Box>
    </ChakraProvider>
  );
}
