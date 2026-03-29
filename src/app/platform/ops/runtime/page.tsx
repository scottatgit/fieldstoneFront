'use client';
import {
  Box, Flex, Text, VStack, HStack, Badge, Divider, Tooltip,
  Table, Thead, Tbody, Tr, Th, Td, TableContainer,
} from '@chakra-ui/react';
import { WarningIcon, CheckIcon } from '@chakra-ui/icons';
import surfacesData from './surfaces.json';

// ---------------------------------------------------------------------------
// Types — must match surfaces.json shape
// ---------------------------------------------------------------------------

type Ownership  = 'production' | 'dev-only' | 'legacy' | 'deprecated' | 'unknown';
type AuthGate   = 'jwt-required' | 'admin-key' | 'public' | 'internal-only';
type Status     = 'active' | 'passive' | 'scheduled' | 'disabled';
type Provenance = 'code-derived' | 'runtime-derived' | 'audit-snapshot' | 'curated-metadata';

interface RuntimeSurface {
  name: string;
  path?: string;
  type: string;
  ownership: Ownership;
  authGate: AuthGate;
  status: Status;
  note?: string;
  risk?: string;
}

interface SectionDef {
  title: string;
  provenance: Provenance[];
  provenanceNote: string;
  footerNote: string;
  items: RuntimeSurface[];
}

// ---------------------------------------------------------------------------
// Badge helpers
// ---------------------------------------------------------------------------

function OwnershipBadge({ v }: { v: Ownership }) {
  const s: Record<Ownership, string> = {
    production: 'green', 'dev-only': 'blue', legacy: 'yellow', deprecated: 'orange', unknown: 'red',
  };
  return <Badge colorScheme={s[v]} fontSize="9px" fontFamily="mono" letterSpacing="wider" textTransform="uppercase" px={2} py={0.5}>{v}</Badge>;
}

function StatusBadge({ v }: { v: Status }) {
  const s: Record<Status, string> = { active: 'green', passive: 'gray', scheduled: 'cyan', disabled: 'orange' };
  return <Badge colorScheme={s[v]} fontSize="9px" fontFamily="mono" letterSpacing="wider" textTransform="uppercase" px={2} py={0.5}>{v}</Badge>;
}

function AuthBadge({ v }: { v: AuthGate }) {
  const c: Record<AuthGate, string> = {
    'jwt-required': 'purple.300', 'admin-key': 'orange.300', public: 'red.400', 'internal-only': 'gray.500',
  };
  return <Text fontSize="9px" fontFamily="mono" color={c[v]} textTransform="uppercase" letterSpacing="wider">{v}</Text>;
}

function ProvenanceBadge({ v }: { v: Provenance }) {
  const cfg: Record<Provenance, { color: string; label: string; tip: string }> = {
    'code-derived':    { color: 'cyan.400',   label: 'code',    tip: 'Derivable from source files — CI-checked on push' },
    'runtime-derived': { color: 'purple.400', label: 'runtime', tip: 'Requires server access to verify — not automatically checked' },
    'audit-snapshot':  { color: 'yellow.400', label: 'snapshot', tip: 'Manually verified at audit date — may drift silently' },
    'curated-metadata':{ color: 'gray.500',   label: 'curated', tip: 'Human-maintained — no automated source of truth' },
  };
  const { color, label, tip } = cfg[v];
  return (
    <Tooltip label={tip} placement="top" fontSize="xs" maxW="260px">
      <Box
        px={1.5} py={0.5} borderRadius="sm"
        border="1px solid" borderColor={color}
        cursor="help" flexShrink={0}
      >
        <Text fontSize="9px" fontFamily="mono" color={color} letterSpacing="wider" textTransform="uppercase" lineHeight={1}>{label}</Text>
      </Box>
    </Tooltip>
  );
}

// ---------------------------------------------------------------------------
// Section panel
// ---------------------------------------------------------------------------

function SectionPanel({
  section, children,
}: {
  section: SectionDef;
  children: React.ReactNode;
}) {
  return (
    <Box bg="gray.900" border="1px solid" borderColor="gray.800" borderRadius="md" overflow="hidden">
      <Flex px={4} py={3} align="center" justify="space-between" borderBottom="1px solid" borderColor="gray.800" flexWrap="wrap" gap={2}>
        <HStack spacing={3} flexWrap="wrap">
          <Text fontSize="xs" fontFamily="mono" fontWeight="black" letterSpacing="widest" textTransform="uppercase" color="orange.400">
            {section.title}
          </Text>
          <Badge colorScheme="gray" fontSize="9px" fontFamily="mono" letterSpacing="wider" px={2} py={0.5}>
            {section.items.length}
          </Badge>
          <Box w="1px" h="14px" bg="gray.700" />
          <Tooltip label={section.provenanceNote} placement="top" fontSize="xs" maxW="340px">
            <HStack spacing={1.5} cursor="help">
              {section.provenance.map(p => <ProvenanceBadge key={p} v={p} />)}
            </HStack>
          </Tooltip>
        </HStack>
        <Text fontSize="9px" fontFamily="mono" color="gray.600">{section.footerNote}</Text>
      </Flex>
      <Box overflowX="auto">{children}</Box>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Surface table
// ---------------------------------------------------------------------------

function SurfaceTable({ items }: { items: RuntimeSurface[] }) {
  return (
    <TableContainer>
      <Table size="sm" variant="unstyled">
        <Thead>
          <Tr borderBottom="1px solid" borderColor="gray.800">
            {['Surface', 'Path', 'Ownership', 'Auth Gate', 'Status', 'Note'].map(h => (
              <Th key={h} px={4} py={2}>
                <Text fontSize="9px" fontFamily="mono" color="gray.600" textTransform="uppercase" letterSpacing="wider">{h}</Text>
              </Th>
            ))}
          </Tr>
        </Thead>
        <Tbody>
          {items.map((s, i) => (
            <Tr key={i} borderBottom="1px solid" borderColor="gray.900"
              _hover={{ bg: 'gray.850' }}
              bg={s.risk ? 'rgba(255,100,0,0.03)' : undefined}
            >
              <Td px={4} py={2.5}>
                <HStack spacing={2}>
                  {s.risk && (
                    <Tooltip label={s.risk} placement="top" fontSize="xs" maxW="320px">
                      <Text as="span" cursor="help"><WarningIcon color="orange.400" boxSize={3} /></Text>
                    </Tooltip>
                  )}
                  <Text fontSize="xs" fontFamily="mono" color="white" fontWeight="medium">{s.name}</Text>
                </HStack>
              </Td>
              <Td px={4} py={2.5}>
                <Text fontSize="9px" fontFamily="mono" color="gray.600">{s.path ?? '—'}</Text>
              </Td>
              <Td px={4} py={2.5}><OwnershipBadge v={s.ownership} /></Td>
              <Td px={4} py={2.5}><AuthBadge v={s.authGate} /></Td>
              <Td px={4} py={2.5}><StatusBadge v={s.status} /></Td>
              <Td px={4} py={2.5}>
                <Text fontSize="9px" fontFamily="mono" color="gray.500" maxW="380px" noOfLines={2}>{s.note ?? '—'}</Text>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  );
}

// ---------------------------------------------------------------------------
// Legend
// ---------------------------------------------------------------------------

function Legend() {
  const provenances: Provenance[] = ['code-derived', 'runtime-derived', 'audit-snapshot', 'curated-metadata'];
  const ownerships: Ownership[]   = ['production', 'dev-only', 'legacy', 'deprecated', 'unknown'];
  const statuses: Status[]        = ['active', 'passive', 'scheduled', 'disabled'];
  return (
    <Flex gap={4} flexWrap="wrap" px={4} py={3}
      bg="gray.950" border="1px solid" borderColor="gray.800" borderRadius="md" align="center"
    >
      <Text fontSize="9px" fontFamily="mono" color="gray.600" textTransform="uppercase" letterSpacing="wider">Provenance</Text>
      {provenances.map(v => <ProvenanceBadge key={v} v={v} />)}
      <Box w="1px" h="16px" bg="gray.800" />
      <Text fontSize="9px" fontFamily="mono" color="gray.600" textTransform="uppercase" letterSpacing="wider">Ownership</Text>
      {ownerships.map(v => <OwnershipBadge key={v} v={v} />)}
      <Box w="1px" h="16px" bg="gray.800" />
      <Text fontSize="9px" fontFamily="mono" color="gray.600" textTransform="uppercase" letterSpacing="wider">Status</Text>
      {statuses.map(v => <StatusBadge key={v} v={v} />)}
      <Box w="1px" h="16px" bg="gray.800" />
      <HStack spacing={1.5}>
        <WarningIcon color="orange.400" boxSize={3} />
        <Text fontSize="9px" fontFamily="mono" color="orange.400">risk — hover for detail</Text>
      </HStack>
    </Flex>
  );
}

// ---------------------------------------------------------------------------
// Audit stamp — reads from surfaces.json meta
// ---------------------------------------------------------------------------

function AuditStamp() {
  const m = surfacesData._meta;
  return (
    <Flex px={4} py={3} bg="gray.950" border="1px solid" borderColor="gray.800"
      borderRadius="md" align="center" justify="space-between" flexWrap="wrap" gap={2}
    >
      <HStack spacing={3}>
        <CheckIcon color="green.400" boxSize={3} />
        <Text fontSize="xs" fontFamily="mono" color="gray.400">
          Cron audit: <Text as="span" color="green.400">CLEAN</Text>
          {' '}— no legacy scripts scheduled on production server
        </Text>
      </HStack>
      <HStack spacing={5} flexWrap="wrap">
        <Text fontSize="9px" fontFamily="mono" color="gray.600">Audited: <Text as="span" color="gray.400">{m.audited}</Text></Text>
        <Text fontSize="9px" fontFamily="mono" color="gray.600">Front: <Text as="span" color="orange.500">{m.fieldstoneFrontCommit}</Text></Text>
        <Text fontSize="9px" fontFamily="mono" color="gray.600">API: <Text as="span" color="orange.500">{m.secondBrainCommit}</Text></Text>
        <Text fontSize="9px" fontFamily="mono" color="gray.600">v{m.version}</Text>
        <Badge colorScheme="yellow" fontSize="9px" fontFamily="mono" letterSpacing="wider">READ-ONLY · v1</Badge>
      </HStack>
    </Flex>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function RuntimeOwnershipPage() {
  const sections = surfacesData.sections as unknown as Record<string, SectionDef>;
  const allItems = Object.values(sections).flatMap(s => s.items);
  const riskCount = allItems.filter(s => !!s.risk).length;

  return (
    <Box bg="gray.950" minH="100dvh" p={4}>
      <VStack spacing={4} align="stretch">

        {/* Header */}
        <Flex align="flex-start" justify="space-between" pb={1} flexWrap="wrap" gap={3}>
          <VStack align="start" spacing={0}>
            <Text fontSize="xl" fontWeight="black" fontFamily="mono" color="white" letterSpacing="tight">
              Runtime Ownership
            </Text>
            <Text fontSize="xs" fontFamily="mono" color="gray.500">
              Every executable surface, classified by ownership, auth gate, and status.
              Read-only v1 — verified from codebase and production server inspection.
            </Text>
          </VStack>
          <HStack spacing={4}>
            <Box px={3} py={2} bg="gray.900" border="1px solid" borderColor="gray.800" borderRadius="md">
              <Text fontSize="9px" fontFamily="mono" color="gray.600" textTransform="uppercase" letterSpacing="wider">Total surfaces</Text>
              <Text fontSize="xl" fontWeight="black" color="white" lineHeight={1}>{allItems.length}</Text>
            </Box>
            <Box px={3} py={2} bg="gray.900" border="1px solid"
              borderColor={riskCount > 0 ? 'orange.800' : 'gray.800'} borderRadius="md"
            >
              <Text fontSize="9px" fontFamily="mono" color="gray.600" textTransform="uppercase" letterSpacing="wider">Risk flags</Text>
              <Text fontSize="xl" fontWeight="black" color={riskCount > 0 ? 'orange.400' : 'gray.500'} lineHeight={1}>{riskCount}</Text>
            </Box>
          </HStack>
        </Flex>

        <AuditStamp />
        <Legend />
        <Divider borderColor="gray.800" />

        {/* Sections — rendered in JSON order */}
        {Object.values(sections).map((section: SectionDef) => (
          <SectionPanel key={section.title} section={section}>
            <SurfaceTable items={section.items} />
          </SectionPanel>
        ))}

        {/* Footer */}
        <Box px={4} py={3} bg="gray.900" border="1px solid" borderColor="gray.800" borderRadius="md">
          <Text fontSize="9px" fontFamily="mono" color="gray.600" lineHeight={1.8}>
            {surfacesData._meta.note}
            &nbsp;·&nbsp; Script list and public routes are CI-drift-checked on every push.
            &nbsp;·&nbsp; Deprecated surface deletion gated on 7-day zero-hit window in{' '}
            <Text as="span" color="orange.500">ingest.deprecated.410</Text> metric.
          </Text>
        </Box>

      </VStack>
    </Box>
  );
}
