'use client';
import {
  Box, Flex, Text, VStack, HStack, Badge, Divider, Tooltip,
  Table, Thead, Tbody, Tr, Th, Td, TableContainer, Icon
} from '@chakra-ui/react';
import { WarningIcon, InfoIcon, CheckIcon } from '@chakra-ui/icons';

// ---------------------------------------------------------------------------
// Data model
// ---------------------------------------------------------------------------

type Ownership = 'production' | 'dev-only' | 'legacy' | 'deprecated' | 'unknown';
type AuthGate  = 'jwt-required' | 'admin-key' | 'public' | 'internal-only';
type Status    = 'active' | 'passive' | 'scheduled' | 'disabled';
type SurfaceType = 'api-service' | 'background-job' | 'bot' | 'deploy-script'
                 | 'frontend-route' | 'admin-surface' | 'deprecated-endpoint' | 'script';

interface RuntimeSurface {
  name: string;
  path?: string;
  type: SurfaceType;
  ownership: Ownership;
  authGate: AuthGate;
  status: Status;
  note?: string;
  risk?: string;
}

// ---------------------------------------------------------------------------
// Audit-sourced data (2026-03-29 — verified from codebase + server inspection)
// ---------------------------------------------------------------------------

const ACTIVE_SERVICES: RuntimeSurface[] = [
  {
    name: 'Signal API (FastAPI)',
    path: 'SecondBrain/api.py',
    type: 'api-service',
    ownership: 'production',
    authGate: 'jwt-required',
    status: 'active',
    note: '117 routes · uvicorn :8100 · ~5,500 lines',
  },
  {
    name: 'signal-api systemd service',
    path: '/etc/systemd/system/signal-api.service',
    type: 'background-job',
    ownership: 'production',
    authGate: 'internal-only',
    status: 'active',
    note: 'Managed by systemctl on DigitalOcean droplet',
  },
  {
    name: 'signal-db-backup',
    path: '/etc/cron.daily/signal-db-backup',
    type: 'background-job',
    ownership: 'production',
    authGate: 'internal-only',
    status: 'scheduled',
    note: 'Daily · 14-day retention · deploy/backup_db.py',
  },
];

const BACKGROUND_SCRIPTS: RuntimeSurface[] = [
  { name: 'weekly_summary.py',       path: 'second_brain/', type: 'script', ownership: 'legacy',  authGate: 'internal-only', status: 'passive', note: 'No cron entry · no tenant isolation' },
  { name: 'today_calendar.py',       path: 'second_brain/', type: 'script', ownership: 'legacy',  authGate: 'internal-only', status: 'passive', note: 'No cron entry · no tenant isolation' },
  { name: 'sync_internal_calendar.py', path: 'second_brain/', type: 'script', ownership: 'legacy', authGate: 'internal-only', status: 'passive', note: 'No cron entry · no tenant isolation' },
  { name: 'send_digest.py',           path: 'second_brain/', type: 'script', ownership: 'legacy',  authGate: 'internal-only', status: 'passive', note: 'smtplib — DigitalOcean blocks 465/587 · hardcoded recipient' },
  { name: 'prep_brief.py',            path: 'second_brain/', type: 'script', ownership: 'legacy',  authGate: 'internal-only', status: 'passive', note: 'No cron entry · no tenant isolation' },
  { name: 'memory_daily_sync.py',     path: 'second_brain/', type: 'script', ownership: 'legacy',  authGate: 'internal-only', status: 'passive', note: 'Hardcoded /a0/usr/workdir — container-bound path' },
  { name: 'memory_bridge.py',         path: 'second_brain/', type: 'script', ownership: 'legacy',  authGate: 'internal-only', status: 'passive', note: 'Hardcoded /a0/usr/workdir/memory — container-bound path' },
  { name: 'list_pending_replies.py',  path: 'second_brain/', type: 'script', ownership: 'legacy',  authGate: 'internal-only', status: 'passive', note: 'No cron entry · no tenant isolation' },
  { name: 'populate_client_tools.py', path: 'second_brain/', type: 'script', ownership: 'legacy',  authGate: 'internal-only', status: 'passive', note: 'No cron entry · no tenant isolation' },
  { name: 'ingest_emails_imap.py',    path: 'second_brain/', type: 'script', ownership: 'deprecated', authGate: 'internal-only', status: 'disabled', note: 'Deprecated header added · no tenant isolation · delete after /api/ingest/run 410-hit window clears', risk: 'Writes to processed_messages with workspace_id=default if invoked' },
  { name: 'init_db.py',               path: 'second_brain/', type: 'script', ownership: 'production', authGate: 'internal-only', status: 'passive', note: 'Migration runner — invoke via scripts/ only' },
  { name: 'migrate_tenants.py',       path: 'second_brain/', type: 'script', ownership: 'production', authGate: 'internal-only', status: 'passive', note: 'One-time tenant normalisation — do not re-run' },
  { name: 'clients.py',               path: 'second_brain/', type: 'script', ownership: 'production', authGate: 'internal-only', status: 'passive', note: 'CW client sync · Python 3.8 compatible' },
  { name: 'decision_signal.py',       path: 'second_brain/', type: 'script', ownership: 'production', authGate: 'internal-only', status: 'passive', note: 'Signal scoring library — imported by api.py' },
  { name: 'ticket_intel_extractor.py',path: 'second_brain/', type: 'script', ownership: 'production', authGate: 'internal-only', status: 'passive', note: 'AI extraction library — imported by api.py' },
  { name: 'sb_ai.py',                 path: 'second_brain/', type: 'script', ownership: 'production', authGate: 'internal-only', status: 'passive', note: 'OpenRouter AI client — imported by api.py' },
  { name: 'signals.py',               path: 'second_brain/', type: 'script', ownership: 'production', authGate: 'internal-only', status: 'passive', note: 'Signal model definitions — imported by api.py' },
];

const DEV_TOOLS: RuntimeSurface[] = [
  {
    name: 'discord_bot.py',
    path: 'SecondBrain/discord_bot.py',
    type: 'bot',
    ownership: 'dev-only',
    authGate: 'internal-only',
    status: 'active',
    note: 'Runs in dev container against local second_brain.db · last gateway: 2026-03-10',
    risk: 'NO tenant isolation — writes ticket_notes/tickets by ticket_key only. Must not be pointed at production DB.',
  },
];

const PUBLIC_ROUTES: RuntimeSurface[] = [
  { name: '/login',           path: 'src/app/login/',                    type: 'frontend-route', ownership: 'production', authGate: 'public', status: 'active', note: 'Custom JWT login · expected public surface' },
  { name: '/signup',          path: 'src/app/signup/',                   type: 'frontend-route', ownership: 'production', authGate: 'public', status: 'active', note: 'Turnstile protected · creates tenant_users row only' },
  { name: '/verify-email',    path: 'src/app/(auth)/verify-email/',      type: 'frontend-route', ownership: 'production', authGate: 'public', status: 'active', note: 'Token in query param · expires 24h' },
  { name: '/verify-pending',  path: 'src/app/(auth)/verify-pending/',    type: 'frontend-route', ownership: 'production', authGate: 'public', status: 'active', note: 'Polls /api/auth/me every 5s' },
  { name: '/forgot-password', path: 'src/app/(auth)/forgot-password/',   type: 'frontend-route', ownership: 'production', authGate: 'public', status: 'active', note: 'Turnstile protected' },
  { name: '/reset-password',  path: 'src/app/(auth)/reset-password/',    type: 'frontend-route', ownership: 'production', authGate: 'public', status: 'active', note: 'Token in query param' },
  { name: '/redirect',        path: 'src/app/redirect/',                 type: 'frontend-route', ownership: 'production', authGate: 'public', status: 'active', note: 'Auth middleware redirect handler' },
  { name: '/invite/*',        path: 'src/app/invite/',                   type: 'frontend-route', ownership: 'production', authGate: 'public', status: 'active', note: 'Invite token consumption · preserved through signup redirect' },
  { name: 'fieldstone.pro (root)', path: 'src/app/page.tsx',             type: 'frontend-route', ownership: 'production', authGate: 'public', status: 'active', note: 'Marketing homepage · no auth gate expected' },
];

const DEPRECATED_SURFACES: RuntimeSurface[] = [
  {
    name: 'POST /api/ingest/run',
    path: 'api.py (line ~L4200)',
    type: 'deprecated-endpoint',
    ownership: 'deprecated',
    authGate: 'jwt-required',
    status: 'disabled',
    note: 'Returns 410 Gone · emits ingest.deprecated.410 metric · delete after 7-day zero-hit window',
    risk: 'Any caller still using this path will silently fail ingestion',
  },
  {
    name: 'ingest_emails_imap.py',
    path: 'second_brain/ingest_emails_imap.py',
    type: 'script',
    ownership: 'deprecated',
    authGate: 'internal-only',
    status: 'disabled',
    note: 'Deprecation header added · no tenant isolation · gated on /api/ingest/run zero-hit window',
  },
];

// ---------------------------------------------------------------------------
// Badge helpers — match existing ops console visual language
// ---------------------------------------------------------------------------

function OwnershipBadge({ v }: { v: Ownership }) {
  const schemes: Record<Ownership, string> = {
    production: 'green',
    'dev-only':  'blue',
    legacy:      'yellow',
    deprecated:  'orange',
    unknown:     'red',
  };
  return (
    <Badge
      colorScheme={schemes[v]}
      fontSize="9px" fontFamily="mono" letterSpacing="wider"
      textTransform="uppercase" px={2} py={0.5}
    >{v}</Badge>
  );
}

function StatusBadge({ v }: { v: Status }) {
  const schemes: Record<Status, string> = {
    active:    'green',
    passive:   'gray',
    scheduled: 'cyan',
    disabled:  'orange',
  };
  return (
    <Badge
      colorScheme={schemes[v]}
      fontSize="9px" fontFamily="mono" letterSpacing="wider"
      textTransform="uppercase" px={2} py={0.5}
    >{v}</Badge>
  );
}

function AuthBadge({ v }: { v: AuthGate }) {
  const colors: Record<AuthGate, string> = {
    'jwt-required':  'purple.300',
    'admin-key':     'orange.300',
    'public':        'red.400',
    'internal-only': 'gray.500',
  };
  return (
    <Text fontSize="9px" fontFamily="mono" color={colors[v]} textTransform="uppercase" letterSpacing="wider">
      {v}
    </Text>
  );
}

// ---------------------------------------------------------------------------
// Shared section panel — matches existing ops Panel component pattern
// ---------------------------------------------------------------------------

function SectionPanel({
  title, count, children, note
}: {
  title: string;
  count: number;
  children: React.ReactNode;
  note?: string;
}) {
  return (
    <Box
      bg="gray.900" border="1px solid" borderColor="gray.800"
      borderRadius="md" overflow="hidden"
    >
      <Flex
        px={4} py={3} align="center" justify="space-between"
        borderBottom="1px solid" borderColor="gray.800"
      >
        <HStack spacing={3}>
          <Text
            fontSize="xs" fontFamily="mono" fontWeight="black"
            letterSpacing="widest" textTransform="uppercase" color="orange.400"
          >{title}</Text>
          <Badge
            colorScheme="gray" fontSize="9px" fontFamily="mono"
            letterSpacing="wider" px={2} py={0.5}
          >{count}</Badge>
        </HStack>
        {note && (
          <Text fontSize="9px" fontFamily="mono" color="gray.600">{note}</Text>
        )}
      </Flex>
      <Box overflowX="auto">{children}</Box>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Surface table — used by all sections
// ---------------------------------------------------------------------------

function SurfaceTable({ items, showPath = true }: { items: RuntimeSurface[]; showPath?: boolean }) {
  return (
    <TableContainer>
      <Table size="sm" variant="unstyled">
        <Thead>
          <Tr borderBottom="1px solid" borderColor="gray.800">
            <Th px={4} py={2}><Text fontSize="9px" fontFamily="mono" color="gray.600" textTransform="uppercase" letterSpacing="wider">Surface</Text></Th>
            {showPath && <Th px={4} py={2}><Text fontSize="9px" fontFamily="mono" color="gray.600" textTransform="uppercase" letterSpacing="wider">Path</Text></Th>}
            <Th px={4} py={2}><Text fontSize="9px" fontFamily="mono" color="gray.600" textTransform="uppercase" letterSpacing="wider">Ownership</Text></Th>
            <Th px={4} py={2}><Text fontSize="9px" fontFamily="mono" color="gray.600" textTransform="uppercase" letterSpacing="wider">Auth Gate</Text></Th>
            <Th px={4} py={2}><Text fontSize="9px" fontFamily="mono" color="gray.600" textTransform="uppercase" letterSpacing="wider">Status</Text></Th>
            <Th px={4} py={2}><Text fontSize="9px" fontFamily="mono" color="gray.600" textTransform="uppercase" letterSpacing="wider">Note</Text></Th>
          </Tr>
        </Thead>
        <Tbody>
          {items.map((s, i) => (
            <Tr key={i}
              borderBottom="1px solid" borderColor="gray.900"
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
              {showPath && (
                <Td px={4} py={2.5}>
                  <Text fontSize="9px" fontFamily="mono" color="gray.600">{s.path ?? '—'}</Text>
                </Td>
              )}
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
  return (
    <Flex gap={6} flexWrap="wrap" px={4} py={3}
      bg="gray.950" border="1px solid" borderColor="gray.800" borderRadius="md"
    >
      <Text fontSize="9px" fontFamily="mono" color="gray.600" textTransform="uppercase" letterSpacing="wider" alignSelf="center">Ownership →</Text>
      {(['production','dev-only','legacy','deprecated','unknown'] as Ownership[]).map(v => (
        <HStack key={v} spacing={1.5}><OwnershipBadge v={v} /></HStack>
      ))}
      <Box w="1px" bg="gray.800" alignSelf="stretch" />
      <Text fontSize="9px" fontFamily="mono" color="gray.600" textTransform="uppercase" letterSpacing="wider" alignSelf="center">Status →</Text>
      {(['active','passive','scheduled','disabled'] as Status[]).map(v => (
        <HStack key={v} spacing={1.5}><StatusBadge v={v} /></HStack>
      ))}
      <Box w="1px" bg="gray.800" alignSelf="stretch" />
      <HStack spacing={1.5}>
        <WarningIcon color="orange.400" boxSize={3} />
        <Text fontSize="9px" fontFamily="mono" color="orange.400">risk flag — hover for detail</Text>
      </HStack>
    </Flex>
  );
}

// ---------------------------------------------------------------------------
// Audit stamp
// ---------------------------------------------------------------------------

function AuditStamp() {
  return (
    <Flex
      px={4} py={3} bg="gray.950" border="1px solid" borderColor="gray.800"
      borderRadius="md" align="center" justify="space-between"
    >
      <HStack spacing={3}>
        <CheckIcon color="green.400" boxSize={3} />
        <Text fontSize="xs" fontFamily="mono" color="gray.400">Cron audit: <Text as="span" color="green.400">CLEAN</Text> — no legacy scripts scheduled on production server</Text>
      </HStack>
      <HStack spacing={6}>
        <Text fontSize="9px" fontFamily="mono" color="gray.600">Audited: 2026-03-29</Text>
        <Text fontSize="9px" fontFamily="mono" color="gray.600">fieldstoneFront: <Text as="span" color="orange.500">38d3768</Text></Text>
        <Text fontSize="9px" fontFamily="mono" color="gray.600">SecondBrain: <Text as="span" color="orange.500">7aa615b</Text></Text>
        <Badge colorScheme="yellow" fontSize="9px" fontFamily="mono" letterSpacing="wider">READ-ONLY · v1</Badge>
      </HStack>
    </Flex>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function RuntimeOwnershipPage() {
  const totalSurfaces =
    ACTIVE_SERVICES.length + BACKGROUND_SCRIPTS.length +
    DEV_TOOLS.length + PUBLIC_ROUTES.length + DEPRECATED_SURFACES.length;

  const riskCount = [...ACTIVE_SERVICES, ...BACKGROUND_SCRIPTS, ...DEV_TOOLS, ...PUBLIC_ROUTES, ...DEPRECATED_SURFACES]
    .filter(s => !!s.risk).length;

  return (
    <Box bg="gray.950" minH="100dvh" p={4}>
      <VStack spacing={4} align="stretch">

        {/* Header */}
        <Flex align="center" justify="space-between" pb={1}>
          <VStack align="start" spacing={0}>
            <Text fontSize="xl" fontWeight="black" fontFamily="mono" color="white" letterSpacing="tight">
              Runtime Ownership
            </Text>
            <Text fontSize="xs" fontFamily="mono" color="gray.500">
              Every executable surface, classified by ownership, auth gate, and status.
              Read-only — verified from codebase and production server inspection.
            </Text>
          </VStack>
          <HStack spacing={4}>
            <Box px={3} py={2} bg="gray.900" border="1px solid" borderColor="gray.800" borderRadius="md">
              <Text fontSize="9px" fontFamily="mono" color="gray.600" textTransform="uppercase" letterSpacing="wider">Total surfaces</Text>
              <Text fontSize="xl" fontWeight="black" color="white" lineHeight={1}>{totalSurfaces}</Text>
            </Box>
            <Box px={3} py={2} bg="gray.900" border="1px solid" borderColor={riskCount > 0 ? 'orange.800' : 'gray.800'} borderRadius="md">
              <Text fontSize="9px" fontFamily="mono" color="gray.600" textTransform="uppercase" letterSpacing="wider">Risk flags</Text>
              <Text fontSize="xl" fontWeight="black" color={riskCount > 0 ? 'orange.400' : 'gray.500'} lineHeight={1}>{riskCount}</Text>
            </Box>
          </HStack>
        </Flex>

        <AuditStamp />
        <Legend />
        <Divider borderColor="gray.800" />

        {/* Section 1 — Active runtime services */}
        <SectionPanel
          title="Active Runtime Services"
          count={ACTIVE_SERVICES.length}
          note="confirmed running on production server"
        >
          <SurfaceTable items={ACTIVE_SERVICES} />
        </SectionPanel>

        {/* Section 2 — Background scripts */}
        <SectionPanel
          title="Background Scripts — Server-Deployed"
          count={BACKGROUND_SCRIPTS.length}
          note="crontab verified clean · all passive unless invoked manually"
        >
          <SurfaceTable items={BACKGROUND_SCRIPTS} />
        </SectionPanel>

        {/* Section 3 — Dev-only tools */}
        <SectionPanel
          title="Dev-Only Tools"
          count={DEV_TOOLS.length}
          note="not for production server · containment documented in source"
        >
          <SurfaceTable items={DEV_TOOLS} />
        </SectionPanel>

        {/* Section 4 — Public unauthenticated routes */}
        <SectionPanel
          title="Public Unauthenticated Routes"
          count={PUBLIC_ROUTES.length}
          note="expected surfaces — any route not listed here is an anomaly"
        >
          <SurfaceTable items={PUBLIC_ROUTES} showPath={true} />
        </SectionPanel>

        {/* Section 5 — Deprecated surfaces */}
        <SectionPanel
          title="Deprecated Surfaces"
          count={DEPRECATED_SURFACES.length}
          note="retained pending deletion gate · do not add new callers"
        >
          <SurfaceTable items={DEPRECATED_SURFACES} />
        </SectionPanel>

        {/* Footer note */}
        <Box px={4} py={3} bg="gray.900" border="1px solid" borderColor="gray.800" borderRadius="md">
          <Text fontSize="9px" fontFamily="mono" color="gray.600" lineHeight={1.8}>
            This panel is static for v1. Ownership classifications are sourced from the 2026-03-29 Phase 1 runtime audit.
            &nbsp;·&nbsp; Edit controls will be added in v2 (Phase 2B).
            &nbsp;·&nbsp; Deprecated surface deletion is gated on 7-day zero-hit window in <Text as="span" color="orange.500">ingest.deprecated.410</Text> metric.
            &nbsp;·&nbsp; Background script audit should be re-run after any production env change.
          </Text>
        </Box>

      </VStack>
    </Box>
  );
}
