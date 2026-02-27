'use client';

import React, { useState } from 'react';
import {
  Box, VStack, HStack, Text, Heading, Divider, Badge, Code,
  Table, Thead, Tbody, Tr, Th, Td, Input, InputGroup,
  InputLeftElement, useColorModeValue, Flex,
} from '@chakra-ui/react';

const SECTIONS = [
  { id: 'overview',           label: '1. System Overview' },
  { id: 'architecture',       label: '2. Architecture' },
  { id: 'knowledge-base',     label: '3. Node-Based Knowledge Base' },
  { id: 'cross-client-intel', label: '4. Cross-Client Intelligence' },
  { id: 'ai-wrapper',         label: '5. AI Wrapper (sb_ai.py)' },
  { id: 'tank-commands',      label: '6. Tank Discord Commands' },
  { id: 'signal-model',       label: '7. Signal Model' },
  { id: 'api-reference',      label: '8. API Reference' },
  { id: 'setup-guide',        label: '9. Setup Guide' },
  { id: 'db-schema',          label: '10. Database Schema' },
];

function scrollTo(id: string) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function SectionAnchor({ id }: { id: string }) {
  return <Box id={id} style={{ scrollMarginTop: '24px' }} />;
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  const bc = useColorModeValue('cyan.200', 'cyan.800');
  return (
    <Heading size="lg" mb={4} pb={2} borderBottom="2px solid" borderColor={bc}>
      {children}
    </Heading>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return <Heading size="sm" mb={2} mt={5} color="cyan.400">{children}</Heading>;
}

function Para({ children }: { children: React.ReactNode }) {
  const c = useColorModeValue('gray.700', 'gray.300');
  return <Text mb={3} color={c} lineHeight={1.8}>{children}</Text>;
}

function CB({ code }: { code: string }) {
  return (
    <Box as="pre" bg="gray.900" color="green.300" p={4} borderRadius="md"
      overflowX="auto" fontSize="xs" fontFamily="monospace" whiteSpace="pre" my={4}>
      {code}
    </Box>
  );
}

function DT({ headers, rows, widths }: {
  headers: string[];
  rows: (string | React.ReactNode)[][];
  widths?: string[];
}) {
  const bc   = useColorModeValue('gray.200', 'gray.700');
  const thBg = useColorModeValue('gray.100', 'gray.800');
  return (
    <Box overflowX="auto" my={4} borderRadius="md" border="1px solid" borderColor={bc}>
      <Table size="sm">
        <Thead><Tr>
          {headers.map((h, i) => (
            <Th key={i} bg={thBg} borderColor={bc} width={widths?.[i]}>{h}</Th>
          ))}
        </Tr></Thead>
        <Tbody>
          {rows.map((row, ri) => (
            <Tr key={ri}>
              {row.map((cell, ci) => (
                <Td key={ci} borderColor={bc} fontSize="xs" verticalAlign="top">{cell}</Td>
              ))}
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
}

/* ── S1: System Overview ──────────────────────────────────────────────────── */
function S1() {
  const capBg = useColorModeValue('blue.50', 'rgba(6,182,212,0.06)');
  const capBc = useColorModeValue('blue.100', 'cyan.900');
  const caps = [
    { icon: '📧', label: 'Email ingestion → ticket creation',  note: 'IMAP, idempotent via Message-ID' },
    { icon: '📊', label: 'Signal scoring per ticket',          note: 'readiness, trust, expectation, constraint, decision' },
    { icon: '🔍', label: 'Cross-client intelligence',          note: 'outbreak detection, at-risk alerting' },
    { icon: '🧠', label: 'Node-based knowledge base',          note: 'tool nodes, client nodes, living documentation' },
    { icon: '🤖', label: 'AI wrapper (sb_ai.py)',              note: 'provider-agnostic, OAuth2 primary, API key fallback' },
    { icon: '🦾', label: 'Discord bot (Tank)',                 note: '14 commands for field operations' },
    { icon: '📋', label: 'PM Dashboard',                      note: 'tickets, signals, intel, setup, docs' },
  ];
  return (
    <Box>
      <SectionAnchor id="overview" />
      <SectionHeading>1. System Overview</SectionHeading>
      <Badge colorScheme="cyan" mb={3}>SecondBrain V2.5 — Autonomous IT MSP Intelligence</Badge>
      <Para>
        SecondBrain is an autonomous IT operations assistant built for IPQuest, a dental IT MSP.
        It ingests emails, tracks tickets, detects patterns across clients, and surfaces intelligence
        to Scott (the operator) via a PM dashboard and Tank (Discord bot).
      </Para>
      <SubHeading>Core Capabilities</SubHeading>
      <VStack align="stretch" spacing={2} mb={4}>
        {caps.map(c => (
          <Box key={c.label} bg={capBg} border="1px solid" borderColor={capBc} borderRadius="md" p={3}>
            <HStack>
              <Text fontSize="lg">{c.icon}</Text>
              <Box>
                <Text fontWeight="semibold" fontSize="sm">{c.label}</Text>
                <Text fontSize="xs" color="gray.500">{c.note}</Text>
              </Box>
            </HStack>
          </Box>
        ))}
      </VStack>
    </Box>
  );
}

/* ── S2: Architecture ─────────────────────────────────────────────────────── */
function ArchBox({ label, color = 'cyan', sub }: { label: string; color?: string; sub?: string }) {
  const bg = useColorModeValue(color + '.50', color + '.900');
  const bc = useColorModeValue(color + '.200', color + '.700');
  return (
    <Box bg={bg} border="1px solid" borderColor={bc} borderRadius="md"
      px={4} py={2} textAlign="center" minW="220px">
      <Text fontSize="xs" fontWeight="bold" fontFamily="monospace">{label}</Text>
      {sub && <Text fontSize="9px" color="gray.500" mt={0.5}>{sub}</Text>}
    </Box>
  );
}

function S2() {
  const bg  = useColorModeValue('gray.50', 'rgba(255,255,255,0.02)');
  const bc  = useColorModeValue('gray.200', 'gray.700');
  const arr = useColorModeValue('gray.400', 'gray.500');
  return (
    <Box>
      <SectionAnchor id="architecture" />
      <SectionHeading>2. Architecture</SectionHeading>
      <Para>SecondBrain operates as a pipeline from raw email to actionable intelligence:</Para>
      <Box bg={bg} border="1px solid" borderColor={bc} borderRadius="lg" p={6}>
        <VStack spacing={1}>
          <ArchBox label="Email (IMAP)" color="blue" sub="Incoming client support emails" />
          <Text color={arr}>↓</Text>
          <ArchBox label="ingest_emails_imap.py" color="blue" sub="Deduplication via Message-ID" />
          <Text color={arr}>↓</Text>
          <ArchBox label="extract_and_store_entities()" color="purple" sub="cross_client_intel.py — writes to ticket_entities" />
          <Text color={arr}>↓</Text>
          <ArchBox label="run_intel_cycle()" color="orange" sub="Outbreak detection + at-risk flagging" />
          <Text color={arr}>↓</Text>
          <ArchBox label="second_brain.db  (SQLite)" color="green" sub="tickets · signals · tools · cross_client_events" />
          <Text color={arr}>↓</Text>
          <ArchBox label="api.py  (FastAPI :8100)" color="teal" sub="REST + OAuth endpoints" />
          <Text color={arr}>↓</Text>
          <HStack spacing={8} justify="center" flexWrap="wrap">
            <VStack spacing={0}>
              <ArchBox label="fieldstoneFront  (:3000)" color="cyan" />
              <Text fontSize="9px" color="gray.500" fontFamily="monospace" mt={1}>
                /pm · /pm/intel · /pm/setup · /pm/docs
              </Text>
            </VStack>
            <VStack spacing={0}>
              <ArchBox label="discord_bot.py  (Tank)" color="purple" />
              <Text fontSize="9px" color="gray.500" fontFamily="monospace" mt={1}>
                14 commands for field ops
              </Text>
            </VStack>
          </HStack>
        </VStack>
      </Box>
    </Box>
  );
}

/* ── S3: Knowledge Base ───────────────────────────────────────────────────── */
function S3() {
  const stBg = useColorModeValue('blue.50',  'rgba(59,130,246,0.07)');
  const dyBg = useColorModeValue('green.50', 'rgba(16,185,129,0.07)');
  const bc   = useColorModeValue('gray.200', 'gray.700');
  return (
    <Box>
      <SectionAnchor id="knowledge-base" />
      <SectionHeading>3. Node-Based Knowledge Base</SectionHeading>
      <Para>
        Nodes are entities — tools and clients — that store both static (manually written) and
        dynamic (auto-learned from tickets) knowledge. Every tool and client has a Markdown node
        file that grows richer over time as tickets are resolved.
      </Para>
      <SubHeading>Node Types</SubHeading>
      <DT
        headers={['Type', 'Examples', 'Location']}
        rows={[
          ['Tool Node',   'Eaglesoft, DEXIS, Carestream, Veeam', 'kb/nodes/tools/*.md'],
          ['Client Node', 'Fieldstown Dental, Mountain Brook',   'kb/nodes/clients/*.md'],
          ['Global SOPs', 'Field Tech Guidelines, Triage Playbooks', 'kb/*.md'],
        ]}
      />
      <SubHeading>Node Structure — Two Layers</SubHeading>
      <HStack align="stretch" spacing={4} mb={4} flexWrap="wrap">
        <Box flex={1} bg={stBg} border="1px solid" borderColor={bc} borderRadius="md" p={4} minW="200px">
          <Badge colorScheme="blue" mb={2}>Static Layer</Badge>
          <Text fontSize="xs" color="gray.400">
            Manually written. Known issues, vendor contacts, SOPs, integration notes.
            Preserved through every auto-regeneration cycle.
          </Text>
        </Box>
        <Box flex={1} bg={dyBg} border="1px solid" borderColor={bc} borderRadius="md" p={4} minW="200px">
          <Badge colorScheme="green" mb={2}>Dynamic Layer</Badge>
          <Text fontSize="xs" color="gray.400">
            Auto-generated below the sentinel marker. Learned from resolved tickets
            and outbreak history. Updated by closed_ticket_ingest.py on each run.
          </Text>
        </Box>
      </HStack>
      <SubHeading>Sentinel Marker</SubHeading>
      <CB code={`<!-- SENTINEL: AUTO-GENERATED BELOW — DO NOT EDIT -->

Anything ABOVE this line is preserved through every regeneration.
Anything BELOW is overwritten by closed_ticket_ingest.py on each run.`} />
      <SubHeading>Knowledge Flow</SubHeading>
      <CB code={`Ticket resolved → resolution_notes saved
       ↓
closed_ticket_ingest.py
       ↓
Extract: tool mentioned + fix applied
       ↓
Append to tool node dynamic layer (below sentinel)
       ↓
Next same issue → AI finds it → grounded answer`} />
    </Box>
  );
}

/* ── S4: Cross-Client Intelligence ───────────────────────────────────────── */
function S4() {
  const stepBg   = useColorModeValue('gray.50',    'rgba(255,255,255,0.03)');
  const stepBc   = useColorModeValue('gray.200',   'gray.700');
  const atRiskBg = useColorModeValue('orange.50',  'rgba(251,146,60,0.08)');
  const atRiskBc = useColorModeValue('orange.200', 'orange.800');
  const steps = [
    'Every ticket ingested → AI extracts tool mentions → ticket_entities table',
    'Correlation engine checks: N clients + same tool + time window',
    'If threshold hit → cross-client event created with classification',
    'At-risk clients identified (use same tool, no open ticket yet)',
    'Tank alerted, dashboard updated',
  ];
  return (
    <Box>
      <SectionAnchor id="cross-client-intel" />
      <SectionHeading>4. Cross-Client Intelligence</SectionHeading>
      <Para>
        The intelligence layer detects when the same tool causes issues across multiple clients
        simultaneously — enabling proactive response before additional clients are affected.
      </Para>
      <SubHeading>How It Works</SubHeading>
      <VStack align="stretch" spacing={2} mb={4}>
        {steps.map((s, i) => (
          <Box key={i} bg={stepBg} border="1px solid" borderColor={stepBc} borderRadius="md" p={3}>
            <HStack>
              <Badge colorScheme="purple" variant="outline" minW="22px" textAlign="center">{i + 1}</Badge>
              <Text fontSize="sm">{s}</Text>
            </HStack>
          </Box>
        ))}
      </VStack>
      <SubHeading>Event Classifications</SubHeading>
      <DT
        headers={['Classification', 'Trigger', 'Action']}
        rows={[
          [<Badge colorScheme="red">active_outbreak</Badge>,     '2+ clients, same tool, 4hr window',     'Immediate Tank alert'],
          [<Badge colorScheme="yellow">update_related</Badge>,   'Monday morning pattern',                'Check vendor release notes'],
          [<Badge colorScheme="orange">recurring</Badge>,        'Same tool, 3rd+ occurrence in 90 days', 'Create permanent SOP'],
          [<Badge colorScheme="blue">regional_outage</Badge>,    'Multiple clients, same ISP',            'Check ISP status'],
          [<Badge colorScheme="purple">vendor_triggered</Badge>, 'Matches vendor update day',             'Contact vendor support'],
        ]}
      />
      <SubHeading>Tool Risk Score</SubHeading>
      <Para>Each tool gets a 0–100 risk score based on active ticket count across all clients using that tool.</Para>
      <HStack spacing={3} mb={4} flexWrap="wrap">
        <Badge colorScheme="red"    fontSize="sm" px={3} py={1}>&gt;50 — HIGH</Badge>
        <Badge colorScheme="yellow" fontSize="sm" px={3} py={1}>25–50 — MEDIUM</Badge>
        <Badge colorScheme="green"  fontSize="sm" px={3} py={1}>&lt;25 — LOW</Badge>
      </HStack>
      <SubHeading>At-Risk Logic</SubHeading>
      <Box bg={atRiskBg} border="1px solid" borderColor={atRiskBc} borderRadius="md" p={4} mb={4}>
        <Text fontSize="sm">
          <strong>Example:</strong> Outbreak detected for Eaglesoft → any client mapped to Eaglesoft
          in <Code fontSize="xs">client_tools</Code> but with <em>no open ticket</em> is flagged
          as at-risk and surfaced in <Code fontSize="xs">/api/intel/atrisk</Code> and
          the <Code fontSize="xs">!atrisk</Code> Tank command.
        </Text>
      </Box>
    </Box>
  );
}

/* ── S5: AI Wrapper ───────────────────────────────────────────────────────── */
function S5() {
  const fastBg   = useColorModeValue('green.50', 'rgba(16,185,129,0.07)');
  const strongBg = useColorModeValue('blue.50',  'rgba(59,130,246,0.07)');
  const bc       = useColorModeValue('gray.200', 'gray.700');
  return (
    <Box>
      <SectionAnchor id="ai-wrapper" />
      <SectionHeading>5. AI Wrapper (sb_ai.py)</SectionHeading>
      <Para>
        sb_ai.py is a provider-agnostic AI layer that routes requests through a priority chain,
        handles response caching, and tracks token usage and costs.
      </Para>
      <SubHeading>Provider Priority Chain</SubHeading>
      <DT
        headers={['Priority', 'Provider', 'When Active']}
        rows={[
          ['🥇 PRIMARY',   'OAuth2 Bearer token',                      'AI_OAUTH_PROVIDER env var is set'],
          ['🥈 SECONDARY', 'Direct API key (OpenAI / Anthropic / Ollama)', 'OAuth not configured'],
          ['🥉 TERTIARY',  'Fallback URL',                             'AI_FALLBACK_URL is set'],
        ]}
      />
      <SubHeading>Available Functions</SubHeading>
      <CB code={`ask(prompt, task_type='fast')        # General purpose
summarize(text, max_words=30)        # Summarize email / ticket
classify(text, categories)           # Classify ticket type
draft_reply(title, notes, client)    # Draft client response
analyze_signal(signal_dict)          # AI signal commentary
query_kb(question, kb_text)          # KB-grounded Q&A`} />
      <SubHeading>Model Routing</SubHeading>
      <HStack spacing={4} mb={4} flexWrap="wrap">
        <Box flex={1} bg={fastBg} border="1px solid" borderColor={bc} borderRadius="md" p={3} minW="180px">
          <Badge colorScheme="green" mb={1}>task_type=&apos;fast&apos;</Badge>
          <Text fontSize="xs">Routes to <Code fontSize="xs">AI_FAST_MODEL</Code><br />
            Used for classification, summarization, signal extraction</Text>
        </Box>
        <Box flex={1} bg={strongBg} border="1px solid" borderColor={bc} borderRadius="md" p={3} minW="180px">
          <Badge colorScheme="blue" mb={1}>task_type=&apos;strong&apos;</Badge>
          <Text fontSize="xs">Routes to <Code fontSize="xs">AI_STRONG_MODEL</Code><br />
            Used for KB Q&A, draft replies, deep analysis</Text>
        </Box>
      </HStack>
      <SubHeading>OAuth2 Providers</SubHeading>
      <HStack spacing={2} mb={4} flexWrap="wrap">
        {['google (Vertex AI)', 'azure (Azure OpenAI)', 'openai', 'custom'].map(p => (
          <Badge key={p} colorScheme="purple" variant="outline" px={3} py={1}>{p}</Badge>
        ))}
      </HStack>
      <SubHeading>Features</SubHeading>
      <VStack align="stretch" spacing={1} mb={4}>
        {[
          'SQLite response caching with configurable TTL',
          'Per-call token and cost tracking stored in ai_usage table',
          'Daily budget guard with configurable spend cap',
          'Automatic token refresh with 60s expiry buffer',
          'Graceful fallback chain — never crashes on provider failure',
        ].map(f => (
          <HStack key={f}>
            <Text color="green.400">✓</Text>
            <Text fontSize="sm">{f}</Text>
          </HStack>
        ))}
      </VStack>
    </Box>
  );
}

/* ── S6: Tank Commands ────────────────────────────────────────────────────── */
const TANK_CMDS: [string, string][] = [
  ['!ingest',            'Trigger email ingestion manually'],
  ['!brief <client>',    'Generate and email prep brief for client'],
  ['!signals',           'Show all client signal scores'],
  ['!calendar',          'Show upcoming appointments'],
  ['!summary',           'Daily summary of open tickets'],
  ['!ticket <id>',       'Show full ticket details'],
  ['!note <id> <text>',  'Add note to ticket + append to resolution_notes'],
  ['!digest',            'Send daily digest email'],
  ['!reset',             'Reset conversation context'],
  ['!help',              'Show all commands'],
  ['!tool <tool_id>',    'Show tool node: risk score, clients, known issues'],
  ['!outbreak',          'Show all active cross-client outbreaks'],
  ['!atrisk',            'List all at-risk clients'],
  ['!clients <tool_id>', 'List all clients using a tool'],
];

function S6() {
  return (
    <Box>
      <SectionAnchor id="tank-commands" />
      <SectionHeading>6. Tank Discord Commands</SectionHeading>
      <Para>
        Tank is the Discord bot interface for field operations. All 14 commands are available
        from any Discord channel the bot has access to.
      </Para>
      <DT
        headers={['Command', 'Description']}
        widths={['38%', '62%']}
        rows={TANK_CMDS.map(([cmd, desc]) => [
          <Code key={cmd} fontSize="xs">{cmd}</Code>,
          desc,
        ])}
      />
    </Box>
  );
}

/* ── S7: Signal Model ─────────────────────────────────────────────────────── */
function S7() {
  const bg = useColorModeValue('gray.50', 'rgba(255,255,255,0.03)');
  const bc = useColorModeValue('gray.200', 'gray.700');
  return (
    <Box>
      <SectionAnchor id="signal-model" />
      <SectionHeading>7. Signal Model</SectionHeading>
      <Para>
        Every ticket has 5 signal dimensions scored automatically by AI during ingestion.
        Signals evolve as new emails arrive on the ticket thread.
      </Para>
      <DT
        headers={['Signal', 'Values', 'Meaning']}
        rows={[
          [<Code fontSize="xs">readiness_signal</Code>,   '🟢 HIGH / 🟡 MEDIUM / 🔴 LOW',           "Client's operational urgency"],
          [<Code fontSize="xs">trust_signal</Code>,       '📈 RISING / ➡️ NEUTRAL / 📉 DECLINING',  'Relationship health trajectory'],
          [<Code fontSize="xs">expectation_signal</Code>, 'Free text (captured)',                    "Client's stated expectation"],
          [<Code fontSize="xs">constraint_signal</Code>,  'Free text (captured)',                    'Time / resource constraints'],
          [<Code fontSize="xs">decision_signal</Code>,    'Free text (captured)',                    'Pending decisions required'],
        ]}
      />
      <SubHeading>Numeric Scores</SubHeading>
      <Box bg={bg} border="1px solid" borderColor={bc} borderRadius="md" p={4} mb={4}>
        <HStack spacing={8} flexWrap="wrap">
          <Box>
            <Text fontSize="xs" color="gray.500" mb={1}>readiness_score</Text>
            <Text fontSize="sm" fontWeight="bold">0 – 100</Text>
            <Text fontSize="xs" color="gray.500">Numeric form of readiness_signal</Text>
          </Box>
          <Box>
            <Text fontSize="xs" color="gray.500" mb={1}>trust_score</Text>
            <Text fontSize="sm" fontWeight="bold">0 – 100</Text>
            <Text fontSize="xs" color="gray.500">Numeric form of trust_signal</Text>
          </Box>
          <Box>
            <Text fontSize="xs" color="gray.500" mb={1}>Composite</Text>
            <Text fontSize="sm" fontWeight="bold">Weighted average</Text>
            <Text fontSize="xs" color="gray.500">Shown in PM dashboard ticket cards</Text>
          </Box>
        </HStack>
      </Box>
    </Box>
  );
}

/* ── S8: API Reference ────────────────────────────────────────────────────── */
function MB({ m }: { m: string }) {
  const s = m === 'GET' ? 'green' : m === 'POST' ? 'blue' : 'orange';
  return <Badge colorScheme={s} fontSize="9px">{m}</Badge>;
}

function ApiGroup({ title, rows }: { title: string; rows: [string, string, string][] }) {
  const bc   = useColorModeValue('gray.200', 'gray.700');
  const thBg = useColorModeValue('gray.100', 'gray.800');
  return (
    <Box mb={6}>
      <Text fontWeight="bold" fontSize="sm" mb={2} color="cyan.400">{title}</Text>
      <Box overflowX="auto" borderRadius="md" border="1px solid" borderColor={bc}>
        <Table size="sm">
          <Thead><Tr>
            <Th bg={thBg} borderColor={bc} width="10%">Method</Th>
            <Th bg={thBg} borderColor={bc} width="42%">Endpoint</Th>
            <Th bg={thBg} borderColor={bc}>Description</Th>
          </Tr></Thead>
          <Tbody>
            {rows.map(([m, ep, desc]) => (
              <Tr key={ep}>
                <Td borderColor={bc}><MB m={m} /></Td>
                <Td borderColor={bc}><Code fontSize="xs">{ep}</Code></Td>
                <Td borderColor={bc} fontSize="xs">{desc}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
    </Box>
  );
}

function S8() {
  return (
    <Box>
      <SectionAnchor id="api-reference" />
      <SectionHeading>8. API Reference</SectionHeading>
      <Para>All endpoints served by <Code fontSize="sm">api.py</Code> on port <Code fontSize="sm">8100</Code>.</Para>
      <ApiGroup title="Tickets" rows={[
        ['GET', '/api/tickets',         'All tickets'],
        ['GET', '/api/tickets/{key}',   'Single ticket by key'],
        ['GET', '/api/signals',         'All signal scores'],
      ]} />
      <ApiGroup title="Intelligence" rows={[
        ['GET',  '/api/intel/outbreaks',       'Active outbreaks  {events:[], count:0}'],
        ['GET',  '/api/intel/atrisk',          'At-risk clients  {at_risk:[], count:0}'],
        ['POST', '/api/intel/run',             'Trigger intel cycle manually'],
        ['GET',  '/api/intel/tool/{id}/score', 'Tool risk score (0-100)'],
      ]} />
      <ApiGroup title="Nodes / Tools" rows={[
        ['GET', '/api/nodes/tools',      'All tools  {tools:[...]}'],
        ['GET', '/api/nodes/tools/{id}', 'Tool detail + KB markdown'],
      ]} />
      <ApiGroup title="Settings" rows={[
        ['GET',  '/api/settings',             'All settings (sensitive fields masked)'],
        ['POST', '/api/settings',             'Save settings to .env'],
        ['POST', '/api/settings/test/ai',     'Test AI connection'],
        ['POST', '/api/settings/test/email',  'Test email / IMAP connection'],
        ['GET',  '/api/settings/ai/usage',    'AI token / cost stats'],
      ]} />
      <ApiGroup title="OAuth" rows={[
        ['GET', '/api/oauth/initiate?provider=X', 'Start OAuth flow → redirect to provider'],
        ['GET', '/api/oauth/callback',            'OAuth callback handler'],
        ['GET', '/api/oauth/status?provider=X',   'Poll for OAuth completion'],
      ]} />
    </Box>
  );
}

/* ── S9: Setup Guide ──────────────────────────────────────────────────────── */
function SetupStep({ n, title, detail, cmd }: { n: number; title: string; detail: string; cmd?: string }) {
  const bg = useColorModeValue('gray.50', 'rgba(255,255,255,0.03)');
  const bc = useColorModeValue('gray.200', 'gray.700');
  return (
    <Box bg={bg} border="1px solid" borderColor={bc} borderRadius="md" p={4} mb={3}>
      <HStack mb={1}>
        <Badge colorScheme="cyan">{n}</Badge>
        <Text fontWeight="bold" fontSize="sm">{title}</Text>
      </HStack>
      <Text fontSize="xs" color="gray.400" mb={cmd ? 2 : 0}>{detail}</Text>
      {cmd && <Code fontSize="xs" p={2} borderRadius="md" display="block" whiteSpace="pre">{cmd}</Code>}
    </Box>
  );
}

function S9() {
  const steps = [
    { n: 1, title: 'Configure Email (IMAP)',     detail: 'Go to /pm/setup → Email / IMAP section. Enter IMAP host, port, username, and password.' },
    { n: 2, title: 'Set AI Provider',            detail: 'AI Configuration section → Set API Base URL, API Key, fast model ID, and strong model ID.' },
    { n: 3, title: 'Configure OAuth (Optional)', detail: 'AI OAuth 2.0 section → Select provider (Google / Azure / OpenAI / custom) → click Connect.' },
    { n: 4, title: 'Set Discord Token',          detail: 'Discord section → Paste bot token. Ensure Tank has message + read permissions in your server.' },
    { n: 5, title: 'Set GitHub Token',           detail: 'GitHub section → Personal access token for KB sync (if using a GitHub-hosted knowledge base).' },
    { n: 6, title: 'Test Connections',           detail: 'Use the Test buttons for AI and Email to verify configuration before saving.' },
    { n: 7, title: 'Save All Settings',          detail: 'Click Save All Settings. Changes are written to .env immediately.' },
    { n: 8, title: 'Restart API',               detail: 'Apply config changes by restarting the API server:', cmd: 'pkill uvicorn && uvicorn api:app --host 0.0.0.0 --port 8100' },
  ];
  return (
    <Box>
      <SectionAnchor id="setup-guide" />
      <SectionHeading>9. Setup Guide</SectionHeading>
      <Para>Follow these steps in order to get SecondBrain fully operational:</Para>
      {steps.map(s => <SetupStep key={s.n} {...s} />)}
    </Box>
  );
}

/* ── S10: Database Schema ─────────────────────────────────────────────────── */
interface DC { col: string; type: string; note: string; }
interface DbTbl { name: string; desc: string; color: string; cols: DC[]; }

const DB_TABLES: DbTbl[] = [
  { name: 'tickets', desc: 'Core ticket table', color: 'blue', cols: [
    { col: 'id',               type: 'INTEGER', note: 'PRIMARY KEY autoincrement' },
    { col: 'ticket_key',       type: 'TEXT',    note: 'Unique key e.g. TK-2024-001' },
    { col: 'title',            type: 'TEXT',    note: 'Ticket subject' },
    { col: 'status',           type: 'TEXT',    note: 'open | in_progress | closed' },
    { col: 'priority',         type: 'TEXT',    note: 'high | medium | low' },
    { col: 'client_key',       type: 'TEXT',    note: 'FK → client identifier' },
    { col: 'created_at',       type: 'TEXT',    note: 'ISO timestamp' },
    { col: 'closed_at',        type: 'TEXT',    note: 'ISO timestamp or NULL' },
    { col: 'resolution_notes', type: 'TEXT',    note: 'Free text resolution' },
    { col: 'readiness_signal', type: 'TEXT',    note: 'HIGH | MEDIUM | LOW' },
    { col: 'trust_signal',     type: 'TEXT',    note: 'RISING | NEUTRAL | DECLINING' },
    { col: 'readiness_score',  type: 'INTEGER', note: '0–100' },
    { col: 'trust_score',      type: 'INTEGER', note: '0–100' },
    { col: 'lifecycle_status', type: 'TEXT',    note: 'active | archived' },
  ]},
  { name: 'tools', desc: 'Software tools in the MSP fleet', color: 'purple', cols: [
    { col: 'id',                 type: 'TEXT', note: 'Slug e.g. eaglesoft' },
    { col: 'name',               type: 'TEXT', note: 'Display name' },
    { col: 'vendor',             type: 'TEXT', note: 'Vendor company' },
    { col: 'category',           type: 'TEXT', note: 'pms | imaging | backup | network' },
    { col: 'vendor_support_url', type: 'TEXT', note: 'Support portal URL' },
    { col: 'known_issues',       type: 'TEXT', note: 'Freetext known issues' },
    { col: 'update_sensitivity', type: 'TEXT', note: 'high | medium | low' },
  ]},
  { name: 'client_tools', desc: 'Maps which tools each client uses', color: 'green', cols: [
    { col: 'client_id',     type: 'TEXT', note: 'FK → client' },
    { col: 'tool_id',       type: 'TEXT', note: 'FK → tools.id' },
    { col: 'version',       type: 'TEXT', note: 'Installed version' },
    { col: 'install_notes', type: 'TEXT', note: 'Optional notes' },
  ]},
  { name: 'ticket_entities', desc: 'AI/keyword extracted tool mentions per ticket', color: 'orange', cols: [
    { col: 'ticket_key',        type: 'TEXT', note: 'FK → tickets.ticket_key' },
    { col: 'client_id',         type: 'TEXT', note: 'Extracted client' },
    { col: 'tool_id',           type: 'TEXT', note: 'Extracted tool' },
    { col: 'confidence',        type: 'REAL', note: '0.0–1.0' },
    { col: 'extraction_method', type: 'TEXT', note: 'keyword | ai' },
    { col: 'created_at',        type: 'TEXT', note: 'ISO timestamp' },
  ]},
  { name: 'cross_client_events', desc: 'Detected outbreak and correlation events', color: 'red', cols: [
    { col: 'id',               type: 'INTEGER', note: 'PRIMARY KEY' },
    { col: 'tool_id',          type: 'TEXT',    note: 'Affected tool' },
    { col: 'detected_at',      type: 'TEXT',    note: 'ISO timestamp' },
    { col: 'affected_clients', type: 'TEXT',    note: 'JSON array of client IDs' },
    { col: 'at_risk_clients',  type: 'TEXT',    note: 'JSON array of at-risk IDs' },
    { col: 'classification',   type: 'TEXT',    note: 'active_outbreak | update_related | recurring | ...' },
    { col: 'root_cause',       type: 'TEXT',    note: 'AI-generated root cause' },
    { col: 'status',           type: 'TEXT',    note: 'open | resolved' },
    { col: 'resolution_notes', type: 'TEXT',    note: 'How it was resolved' },
  ]},
  { name: 'ai_usage', desc: 'AI token and cost tracking per call', color: 'teal', cols: [
    { col: 'id',          type: 'INTEGER', note: 'PRIMARY KEY' },
    { col: 'model',       type: 'TEXT',    note: 'Model identifier' },
    { col: 'tokens_used', type: 'INTEGER', note: 'Total tokens' },
    { col: 'cost_usd',    type: 'REAL',    note: 'Estimated cost' },
    { col: 'created_at',  type: 'TEXT',    note: 'ISO timestamp' },
  ]},
];

function S10() {
  return (
    <Box>
      <SectionAnchor id="db-schema" />
      <SectionHeading>10. Database Schema</SectionHeading>
      <Para>
        SecondBrain uses a single SQLite file at{' '}
        <Code fontSize="xs">second_brain/second_brain.db</Code>.
        Below are all key tables with column definitions.
      </Para>
      {DB_TABLES.map(t => (
        <Box key={t.name} mb={6}>
          <HStack mb={2}>
            <Badge colorScheme={t.color} fontSize="sm" px={3} py={1} fontFamily="monospace">{t.name}</Badge>
            <Text fontSize="xs" color="gray.500">{t.desc}</Text>
          </HStack>
          <DT
            headers={['Column', 'Type', 'Notes']}
            widths={['28%', '14%', '58%']}
            rows={t.cols.map(c => [
              <Code key={c.col} fontSize="xs">{c.col}</Code>,
              <Badge key={c.col + 't'} colorScheme="gray" variant="outline" fontSize="9px">{c.type}</Badge>,
              c.note,
            ])}
          />
        </Box>
      ))}
    </Box>
  );
}

/* ── Sidebar ──────────────────────────────────────────────────────────────── */
function Sidebar({ search, setSearch }: { search: string; setSearch: (v: string) => void }) {
  const inputBg   = useColorModeValue('white', '#1a2035');
  const bc        = useColorModeValue('gray.200', 'gray.700');
  const linkColor = useColorModeValue('blue.600', 'cyan.300');
  const hoverBg   = useColorModeValue('blue.50', 'whiteAlpha.100');
  const filtered  = SECTIONS.filter(s =>
    s.label.toLowerCase().includes(search.toLowerCase()));
  return (
    <VStack align="stretch" spacing={1} h="100%">
      <InputGroup size="sm" mb={2}>
        <InputLeftElement pointerEvents="none">
          <Text fontSize="xs" lineHeight={2}>🔍</Text>
        </InputLeftElement>
        <Input
          placeholder="Search sections..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          bg={inputBg} borderColor={bc}
          _focus={{ borderColor: 'cyan.400' }}
          borderRadius="md"
        />
      </InputGroup>
      <Divider borderColor={bc} mb={1} />
      {filtered.map(s => (
        <Box
          key={s.id} as="button" textAlign="left" w="100%"
          px={3} py={2} borderRadius="md" fontSize="sm"
          color={linkColor} _hover={{ bg: hoverBg }}
          onClick={() => scrollTo(s.id)}
        >
          {s.label}
        </Box>
      ))}
    </VStack>
  );
}

/* ── Page Root ────────────────────────────────────────────────────────────── */
export default function DocsPage() {
  const [search, setSearch]    = useState('');
  const [mobileNav, setMobile] = useState(false);

  const bg          = useColorModeValue('gray.100', '#0a0e17');
  const sidebarBg   = useColorModeValue('gray.50',  '#0d1117');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor   = useColorModeValue('gray.800', 'gray.100');

  return (
    <Box minH="100vh" bg={bg} color={textColor}>
      <Flex h="100vh" overflow="hidden">

        {/* Desktop sidebar */}
        <Box
          display={{ base: 'none', md: 'block' }}
          w="260px" flexShrink={0}
          bg={sidebarBg}
          borderRight="1px solid" borderColor={borderColor}
          p={4} overflowY="auto" h="100vh"
        >
          <Text fontWeight="bold" fontSize="xs" mb={3} color="cyan.400" letterSpacing="wide">
            📖 DOCS NAVIGATION
          </Text>
          <Sidebar search={search} setSearch={setSearch} />
        </Box>

        {/* Main content */}
        <Box flex={1} overflowY="auto" p={{ base: 4, md: 8 }}>

          {/* Mobile nav toggle */}
          <Box display={{ base: 'block', md: 'none' }} mb={4}>
            <Box
              as="button"
              onClick={() => setMobile(o => !o)}
              px={3} py={2} borderRadius="md" fontSize="sm"
              border="1px solid" borderColor={borderColor}
            >
              {mobileNav ? '✕ Close Nav' : '☰ Sections'}
            </Box>
            {mobileNav && (
              <Box mt={2} p={3} bg={sidebarBg}
                border="1px solid" borderColor={borderColor} borderRadius="md">
                <Sidebar search={search} setSearch={setSearch} />
              </Box>
            )}
          </Box>

          {/* Header */}
          <Box mb={8}>
            <HStack mb={2}>
              <Heading size="xl">📖 SecondBrain Docs</Heading>
              <Badge colorScheme="cyan" fontSize="sm">V2.5</Badge>
            </HStack>
            <Text color="gray.500" fontSize="sm">
              Full reference documentation for the SecondBrain autonomous IT MSP intelligence platform.
            </Text>
          </Box>

          <S1 /><Divider my={6} borderColor={borderColor} />
          <S2 /><Divider my={6} borderColor={borderColor} />
          <S3 /><Divider my={6} borderColor={borderColor} />
          <S4 /><Divider my={6} borderColor={borderColor} />
          <S5 /><Divider my={6} borderColor={borderColor} />
          <S6 /><Divider my={6} borderColor={borderColor} />
          <S7 /><Divider my={6} borderColor={borderColor} />
          <S8 /><Divider my={6} borderColor={borderColor} />
          <S9 /><Divider my={6} borderColor={borderColor} />
          <S10 />

          <Box mt={12} mb={4}>
            <Text fontSize="xs" color="gray.600" textAlign="center">
              SecondBrain V2.5 — IPQuest Dental IT MSP Platform
            </Text>
          </Box>
        </Box>
      </Flex>
    </Box>
  );
}
