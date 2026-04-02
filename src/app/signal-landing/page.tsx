import React from 'react';
import { AnalyticsTracker } from '@/components/AnalyticsTracker';
import { TrackedButton } from '@/components/TrackedButton';
import {
  Box, Button, Container, Flex, Heading, Stack, Text, VStack, HStack, SimpleGrid,
} from '@chakra-ui/react';

const BG      = '#0d1117';
const SURFACE = '#111827';
const SURFACE2 = '#0f1923';
const BLUE    = '#63B3ED';
const BLUE_DIM = '#2d5a82';
const BORDER  = '#1f2937';
const MUTED   = 'gray.400';
const DIM     = 'gray.500';
const DIM2    = 'gray.600';

export const metadata = {
  title: 'Signal — Turn Tickets Into Operational Intelligence | Work Intelligence Platform',
  description:
    'Signal turns every ticket, email, and request into a decision-ready operational brief — and builds living company intelligence that grows stronger with every piece of work. Built for service teams, MSPs, and any request-driven operation.',
  keywords: [
    'work intelligence platform',
    'ticket intelligence',
    'operational intelligence',
    'service intelligence',
    'operational brief',
    'MSP software',
    'outbreak detection',
    'request-driven teams',
    'growing company intelligence',
    'service team software',
    'field operations intelligence',
    'Signal',
    'Fieldstone',
  ],
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://signal.fieldstone.pro' },
  openGraph: {
    type: 'website',
    url: 'https://signal.fieldstone.pro',
    siteName: 'Signal',
    title: 'Signal — Turn Tickets Into Operational Intelligence',
    description:
      'Every ticket becomes intelligence. Signal reads your work, builds a decision-ready operational brief, and grows company intelligence that compounds over time. Built for teams that run on requests.',
    images: [
      {
        url: 'https://signal.fieldstone.pro/og-signal.png',
        width: 1200,
        height: 630,
        alt: 'Signal — Work Intelligence Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Signal — Turn Tickets Into Operational Intelligence',
    description:
      'Every ticket becomes intelligence. Signal builds decision-ready operational briefs and growing company intelligence from your daily work queue.',
    images: ['https://signal.fieldstone.pro/og-signal.png'],
  },
};

// ─────────────────────────────────────────────
// Nav
// ─────────────────────────────────────────────

function Nav() {
  return (
    <Box
      as="nav"
      borderBottom="1px solid"
      borderColor={BORDER}
      py={4}
      position="sticky"
      top={0}
      zIndex={10}
      bg={BG}
    >
      <Container maxW="5xl">
        <Flex justify="space-between" align="center">
          <HStack spacing={2}>
            <Box w={2} h={2} bg={BLUE} borderRadius="full" />
            <Text fontWeight="700" fontSize="lg" letterSpacing="0.12em" color="white">
              SIGNAL
            </Text>
          </HStack>
          <HStack spacing={5}>
            <Text
              as="a"
              href="https://www.fieldstone.pro"
              fontSize="sm"
              color={DIM2}
              fontWeight="500"
              _hover={{ color: BLUE }}
              display={{ base: 'none', sm: 'block' }}
            >
              Fieldstone.pro
            </Text>
            <Button
              as="a"
              href="/login"
              size="sm"
              variant="ghost"
              color={DIM}
              fontWeight="600"
              _hover={{ color: BLUE }}
            >
              Sign In
            </Button>
            <Button
              as="a"
              href="/signup"
              size="sm"
              bg={BLUE}
              color="#0d1117"
              fontWeight="700"
              _hover={{ opacity: 0.85 }}
            >
              Get Started
            </Button>
          </HStack>
        </Flex>
      </Container>
    </Box>
  );
}

// ─────────────────────────────────────────────
// Hero
// ─────────────────────────────────────────────

function Hero() {
  return (
    <Box pt={{ base: 20, md: 28 }} pb={{ base: 12, md: 18 }} textAlign="center">
      <Container maxW="3xl">
        <VStack spacing={7}>
          <Text
            fontSize="xs"
            fontWeight="700"
            letterSpacing="0.25em"
            color={BLUE}
            textTransform="uppercase"
          >
            Work Intelligence Platform
          </Text>
          <Heading
            as="h1"
            fontSize={{ base: '4xl', md: '6xl' }}
            fontWeight="800"
            lineHeight="1.08"
            letterSpacing="-0.02em"
          >
            Turn raw work into
            <Box as="span" color={BLUE}> living intelligence.</Box>
          </Heading>
          <Text fontSize={{ base: 'lg', md: 'xl' }} color={MUTED} maxW="2xl" lineHeight="1.75">
            Signal takes a plain email, ticket, or request and turns it into a
            decision-ready operational brief — while every piece of work builds into
            growing company intelligence.
          </Text>
          <Stack direction={{ base: 'column', sm: 'row' }} spacing={4} pt={2}>
            <Button
              as="a"
              href="/signup"
              size="lg"
              bg={BLUE}
              color="#0d1117"
              fontWeight="700"
              px={10}
              _hover={{ opacity: 0.85 }}
            >
              Get Started Free
            </Button>
            <Button
              as="a"
              href="https://demo.signal.fieldstone.pro/pm"
              size="lg"
              variant="outline"
              borderColor={BORDER}
              color="gray.300"
              fontWeight="600"
              px={10}
              _hover={{ borderColor: BLUE, color: BLUE }}
            >
              See a Live Demo
            </Button>
          </Stack>
        </VStack>
      </Container>
    </Box>
  );
}

// ─────────────────────────────────────────────
// Transformation — this → this → this
// ─────────────────────────────────────────────

function Transformation() {
  return (
    <Box
      bg={SURFACE}
      borderTop="1px solid"
      borderBottom="1px solid"
      borderColor={BORDER}
      py={{ base: 16, md: 24 }}
    >
      <Container maxW="5xl">
        <VStack spacing={3} mb={14} textAlign="center">
          <Text fontSize="xs" fontWeight="700" letterSpacing="0.2em" color={BLUE} textTransform="uppercase">
            Ticket &#8594; Signals &#8594; Living intelligence
          </Text>
          <Heading as="h2" fontSize={{ base: '2xl', md: '3xl' }} fontWeight="800">
            Signal turns a ticket into signals and builds living intelligence.
          </Heading>
          <Text fontSize="md" color={MUTED} maxW="xl" lineHeight="1.8" pt={1}>
            Raw work comes in. Signal reads it, extracts what matters, and returns
            a brief your team can act on — while every ticket adds to the intelligence
            layer underneath.
          </Text>
        </VStack>

        <Stack direction={{ base: 'column', md: 'row' }} spacing={0} align="stretch">

          {/* Left: raw input */}
          <Box
            flex={1}
            p={8}
            bg={BG}
            border="1px solid"
            borderColor={BORDER}
            borderRadius={{ base: 'xl', md: 'xl 0 0 xl' }}
          >
            <VStack align="flex-start" spacing={5}>
              <Text fontSize="2xs" fontWeight="700" letterSpacing="0.18em" color={DIM} textTransform="uppercase">
                You receive
              </Text>
              <Heading fontSize="lg" fontWeight="700" color="white">
                A plain inbound item.
              </Heading>
              <VStack align="flex-start" spacing={3} w="full">
                {[
                  'An email with no structure',
                  'A ticket with minimal detail',
                  'A request with no context',
                  'A recurring issue with no pattern',
                ].map((item) => (
                  <HStack key={item} spacing={3} align="flex-start">
                    <Box mt={1.5} w={1.5} h={1.5} bg={BORDER} borderRadius="full" flexShrink={0} />
                    <Text fontSize="sm" color={DIM} lineHeight="1.7">{item}</Text>
                  </HStack>
                ))}
              </VStack>
            </VStack>
          </Box>

          {/* Center: the brief — highlighted */}
          <Box
            flex={1.2}
            p={8}
            bg={SURFACE2}
            border="1px solid"
            borderColor={BLUE_DIM}
            position="relative"
            zIndex={1}
            mx={{ base: 0, md: -1 }}
            borderRadius={{ base: 'xl', md: 'xl' }}
            boxShadow={`0 0 40px rgba(99,179,237,0.08)`}
          >
            <VStack align="flex-start" spacing={5}>
              <HStack>
                <Text fontSize="2xs" fontWeight="700" letterSpacing="0.18em" color={BLUE} textTransform="uppercase">
                  Signal turns it into
                </Text>
              </HStack>
              <Heading fontSize="lg" fontWeight="700" color="white">
                A decision-ready brief.
              </Heading>
              <VStack align="flex-start" spacing={3} w="full">
                {[
                  { label: 'Situation', desc: 'What is happening at this site, right now' },
                  { label: 'Signals', desc: 'What the work is revealing operationally' },
                  { label: 'Risk flags', desc: 'What needs immediate attention' },
                  { label: 'Response guidance', desc: 'How to approach this engagement' },
                  { label: 'Decision context', desc: 'Why this moment matters' },
                ].map((item) => (
                  <Box key={item.label} w="full">
                    <Text fontSize="xs" fontWeight="700" color={BLUE} mb={0.5}>
                      {item.label}
                    </Text>
                    <Text fontSize="sm" color={MUTED} lineHeight="1.6">
                      {item.desc}
                    </Text>
                  </Box>
                ))}
              </VStack>
            </VStack>
          </Box>

          {/* Right: living intelligence */}
          <Box
            flex={1}
            p={8}
            bg={BG}
            border="1px solid"
            borderColor={BORDER}
            borderRadius={{ base: 'xl', md: '0 xl xl 0' }}
          >
            <VStack align="flex-start" spacing={5}>
              <Text fontSize="2xs" fontWeight="700" letterSpacing="0.18em" color={DIM} textTransform="uppercase">
                And builds
              </Text>
              <Heading fontSize="lg" fontWeight="700" color="white">
                Living company intelligence.
              </Heading>
              <VStack align="flex-start" spacing={3} w="full">
                {[
                  'Operational memory that grows over time',
                  'Recurring patterns surfaced automatically',
                  'Risk themes tracked across the work queue',
                  'Intelligence that compounds with every ticket',
                ].map((item) => (
                  <HStack key={item} spacing={3} align="flex-start">
                    <Box mt={1.5} w={1.5} h={1.5} bg={BLUE} borderRadius="full" flexShrink={0} />
                    <Text fontSize="sm" color={MUTED} lineHeight="1.7">{item}</Text>
                  </HStack>
                ))}
              </VStack>
            </VStack>
          </Box>

        </Stack>
      </Container>
    </Box>
  );
}

// ─────────────────────────────────────────────
// The Brief — what it actually is
// ─────────────────────────────────────────────

function TheBrief() {
  return (
    <Box py={{ base: 16, md: 24 }}>
      <Container maxW="5xl">
        <Stack direction={{ base: 'column', md: 'row' }} spacing={16} align="flex-start">
          <VStack align="flex-start" spacing={6} flex={1}>
            <Text fontSize="xs" fontWeight="700" letterSpacing="0.2em" color={BLUE} textTransform="uppercase">
              The brief
            </Text>
            <Heading as="h2" fontSize={{ base: '2xl', md: '3xl' }} fontWeight="800" lineHeight="1.2">
              Not a summary.
              <Box as="span" color={BLUE}> A read of the moment.</Box>
            </Heading>
            <Text fontSize="md" color={MUTED} lineHeight="1.85">
              Most tools produce a summary. Signal produces a brief.
            </Text>
            <Text fontSize="md" color={MUTED} lineHeight="1.85">
              The difference is what it tells you. A summary describes the past.
              A Signal brief tells your team the operational state of the moment —
              what is live, what is at risk, what the client is expecting, and how
              to walk in ready.
            </Text>
            <Text fontSize="md" color="white" fontWeight="600" lineHeight="1.85">
              That is not information. That is readiness.
            </Text>
            <Button
              as="a"
              href="/signup"
              size="md"
              bg={BLUE}
              color="#0d1117"
              fontWeight="700"
              _hover={{ opacity: 0.85 }}
            >
              Try Signal Free
            </Button>
          </VStack>
          <VStack align="flex-start" spacing={4} flex={1}>
            {[
              {
                label: 'Readiness',
                desc: 'What is the site posture going into this visit or response?',
              },
              {
                label: 'Trust signals',
                desc: 'Is this relationship stable, strained, or at a decision point?',
              },
              {
                label: 'Constraints',
                desc: 'What timelines, sensitivities, or prior commitments are in play?',
              },
              {
                label: 'Risk flags',
                desc: 'What patterns or exposures should drive urgency right now?',
              },
              {
                label: 'Decision posture',
                desc: 'What does the team need to act well — not just act fast?',
              },
            ].map((item) => (
              <Box
                key={item.label}
                p={5}
                bg={SURFACE}
                border="1px solid"
                borderColor={BORDER}
                borderRadius="lg"
                w="full"
              >
                <Text fontSize="sm" fontWeight="700" color={BLUE} mb={1}>
                  {item.label}
                </Text>
                <Text fontSize="sm" color={MUTED} lineHeight="1.7">
                  {item.desc}
                </Text>
              </Box>
            ))}
          </VStack>
        </Stack>
      </Container>
    </Box>
  );
}

// ─────────────────────────────────────────────
// Growing Intelligence
// ─────────────────────────────────────────────

function GrowingIntelligence() {
  const levels = [
    {
      number: '01',
      title: 'Every ticket adds structure.',
      desc:
        'Signal reads each ticket for category, risk, tools involved, and outcome. That structure is stored, not discarded. The work accumulates into operational knowledge.',
    },
    {
      number: '02',
      title: 'Your workspace builds memory.',
      desc:
        'Over time, Signal knows what is recurring, what has been resolved, and what is trending in your environment. The next response is faster because the last one taught the system.',
    },
    {
      number: '03',
      title: 'Patterns surface across the work.',
      desc:
        'Signal watches for themes that transcend a single ticket. Recurring failures, emerging risk patterns, and outbreak behavior are flagged early — before they become visible problems.',
    },
  ];

  return (
    <Box
      bg={SURFACE}
      borderTop="1px solid"
      borderBottom="1px solid"
      borderColor={BORDER}
      py={{ base: 16, md: 24 }}
    >
      <Container maxW="5xl">
        <VStack spacing={3} mb={14} textAlign="center">
          <Text fontSize="xs" fontWeight="700" letterSpacing="0.2em" color={BLUE} textTransform="uppercase">
            How it compounds
          </Text>
          <Heading as="h2" fontSize={{ base: '2xl', md: '3xl' }} fontWeight="800">
            Intelligence that grows with every ticket.
          </Heading>
          <Text fontSize="md" color={MUTED} maxW="xl" lineHeight="1.8">
            Signal does not just process work. It builds operational knowledge —
            at the ticket level, the workspace level, and across the broader pattern network.
          </Text>
        </VStack>
        <VStack spacing={5}>
          {levels.map((level) => (
            <Box
              key={level.number}
              p={8}
              bg={BG}
              border="1px solid"
              borderColor={BORDER}
              borderRadius="xl"
              w="full"
            >
              <Stack direction={{ base: 'column', md: 'row' }} spacing={8} align="flex-start">
                <Text
                  fontSize="4xl"
                  fontWeight="800"
                  color={BORDER}
                  lineHeight={1}
                  minW="60px"
                >
                  {level.number}
                </Text>
                <VStack align="flex-start" spacing={2}>
                  <Heading fontSize="xl" fontWeight="800" color="white">
                    {level.title}
                  </Heading>
                  <Text fontSize="md" color={MUTED} lineHeight="1.85">
                    {level.desc}
                  </Text>
                </VStack>
              </Stack>
            </Box>
          ))}
        </VStack>
      </Container>
    </Box>
  );
}

// ─────────────────────────────────────────────
// Network Intelligence
// ─────────────────────────────────────────────

function NetworkIntelligence() {
  return (
    <Box py={{ base: 16, md: 24 }}>
      <Container maxW="5xl">
        <Stack direction={{ base: 'column', md: 'row' }} spacing={16} align="center">
          <VStack align="flex-start" spacing={5} flex={1}>
            <Text fontSize="xs" fontWeight="700" letterSpacing="0.2em" color={BLUE} textTransform="uppercase">
              Network intelligence
            </Text>
            <Heading as="h2" fontSize={{ base: '2xl', md: '3xl' }} fontWeight="800" lineHeight="1.2">
              Your team is not the only one seeing this.
            </Heading>
            <Text fontSize="md" color={MUTED} lineHeight="1.85">
              Signal watches for patterns that transcend a single ticket or a single client.
              When a tool starts failing across environments, Signal flags it.
              When a risk theme is escalating, Signal sees it first.
            </Text>
            <Text fontSize="md" color={MUTED} lineHeight="1.85">
              This intelligence is pattern-based and abstracted. No private details cross
              workspace boundaries. What travels is the shape of the problem — not the
              client behind it.
            </Text>
            <Text fontSize="md" color={MUTED} lineHeight="1.85">
              The result is a network that gets smarter as it grows, while your data stays yours.
            </Text>
          </VStack>
          <VStack align="flex-start" spacing={4} flex={1}>
            {[
              'Recurring tool failure detection across environments',
              'Outbreak pattern identification before escalation',
              'Risk theme surfacing across the broader network',
              'Abstracted intelligence — no raw cross-workspace data',
              'Pattern-based, policy-controlled, safe by design',
            ].map((point) => (
              <HStack key={point} spacing={3} align="flex-start">
                <Box mt={1.5} w={1.5} h={1.5} bg={BLUE} borderRadius="full" flexShrink={0} />
                <Text fontSize="sm" color={MUTED} lineHeight="1.7">{ point}</Text>
              </HStack>
            ))}
          </VStack>
        </Stack>
      </Container>
    </Box>
  );
}

// ─────────────────────────────────────────────
// Who It's For
// ─────────────────────────────────────────────

function WhoItsFor() {
  const segments = [
    {
      title: 'MSPs and service providers',
      desc:
        'Manage client environments and dispatch boards with intelligence that grows with every engagement.',
    },
    {
      title: 'Internal IT and operations teams',
      desc:
        'Build operational clarity from your daily work queue that persists across staff changes and shifting priorities.',
    },
    {
      title: 'Software and support organizations',
      desc:
        'Surface the patterns in your support stream and build institutional knowledge from every interaction.',
    },
    {
      title: 'Field operations teams',
      desc:
        'Walk into every site prepared. Signal gives your team the situational context they need before the first question is asked.',
    },
  ];

  return (
    <Box
      bg={SURFACE}
      borderTop="1px solid"
      borderBottom="1px solid"
      borderColor={BORDER}
      py={{ base: 16, md: 24 }}
    >
      <Container maxW="5xl">
        <VStack spacing={3} mb={14} textAlign="center">
          <Text fontSize="xs" fontWeight="700" letterSpacing="0.2em" color={BLUE} textTransform="uppercase">
            Built for
          </Text>
          <Heading as="h2" fontSize={{ base: '2xl', md: '3xl' }} fontWeight="800">
            Any team that runs on requests.
          </Heading>
          <Text fontSize="md" color={MUTED} maxW="xl" lineHeight="1.8">
            If your team handles tickets, requests, or operational work —
            Signal turns that work into intelligence.
          </Text>
        </VStack>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
          {segments.map((s) => (
            <Box
              key={s.title}
              p={7}
              bg={BG}
              border="1px solid"
              borderColor={BORDER}
              borderRadius="xl"
            >
              <Heading fontSize="md" fontWeight="700" color="white" mb={3}>
                {s.title}
              </Heading>
              <Text fontSize="sm" color={MUTED} lineHeight="1.85">{ s.desc}</Text>
            </Box>
          ))}
        </SimpleGrid>
      </Container>
    </Box>
  );
}

// ─────────────────────────────────────────────
// Close CTA
// ─────────────────────────────────────────────

function CloseCTA() {
  return (
    <Box py={{ base: 20, md: 32 }}>
      <Container maxW="3xl" textAlign="center">
        <VStack spacing={7}>
          <Text fontSize="xs" fontWeight="700" letterSpacing="0.2em" color={BLUE} textTransform="uppercase">
            Get started
          </Text>
          <Heading as="h2" fontSize={{ base: '3xl', md: '4xl' }} fontWeight="800" lineHeight="1.15">
            See what your work is trying to tell you.
          </Heading>
          <Text fontSize="lg" color={MUTED} maxW="lg" lineHeight="1.75">
            Connect your inbox. Signal reads the work, builds the brief,
            and grows company intelligence from every ticket you close.
          </Text>
          <Stack direction={{ base: 'column', sm: 'row' }} spacing={4} pt={2}>
            <Button
              as="a"
              href="/signup"
              size="lg"
              bg={BLUE}
              color="#0d1117"
              fontWeight="700"
              px={10}
              _hover={{ opacity: 0.85 }}
            >
              Start Free
            </Button>
            <Button
              as="a"
              href="https://demo.signal.fieldstone.pro/pm"
              size="lg"
              variant="outline"
              borderColor={BORDER}
              color="gray.300"
              fontWeight="600"
              px={10}
              _hover={{ borderColor: BLUE, color: BLUE }}
            >
              Explore the Demo
            </Button>
          </Stack>
        </VStack>
      </Container>
    </Box>
  );
}

// ─────────────────────────────────────────────
// Footer
// ─────────────────────────────────────────────

function Footer() {
  return (
    <Box borderTop="1px solid" borderColor={BORDER} py={8}>
      <Container maxW="5xl">
        <Flex
          justify="space-between"
          align="center"
          flexDir={{ base: 'column', sm: 'row' }}
          gap={4}
        >
          <HStack spacing={2}>
            <Box w={1.5} h={1.5} bg={BLUE} borderRadius="full" />
            <Text fontSize="sm" color={DIM2}>
              Signal by Fieldstone AI
            </Text>
          </HStack>
          <HStack spacing={6}>
            <Text as="a" href="/login" fontSize="sm" color={DIM} _hover={{ color: BLUE }} cursor="pointer">Sign In</Text>
            <Text as="a" href="/signup" fontSize="sm" color={DIM} _hover={{ color: BLUE }} cursor="pointer">Sign Up</Text>
            <Text as="a" href="https://demo.signal.fieldstone.pro/pm" fontSize="sm" color={DIM} _hover={{ color: BLUE }} cursor="pointer">Demo</Text>
            <Text as="a" href="https://www.fieldstone.pro" fontSize="sm" color={DIM} _hover={{ color: BLUE }} cursor="pointer">Fieldstone</Text>
          </HStack>
        </Flex>
      </Container>
    </Box>
  );
}


// ─────────────────────────────────────────────
// Structured Data (JSON-LD)
// ─────────────────────────────────────────────

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Signal',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  url: 'https://signal.fieldstone.pro',
  description:
    'Signal turns every ticket, email, and request into a decision-ready operational brief and builds living company intelligence that compounds over time.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
    description: 'Free tier available',
  },
  creator: {
    '@type': 'Organization',
    name: 'Fieldstone AI',
    url: 'https://www.fieldstone.pro',
  },
};

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default function SignalLandingPage() {
  return (
    <Box minH="100vh" bg={BG} color="white">
      {/* FST-AN-001C: page_view tracking */}
      <AnalyticsTracker />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Nav />
      <Hero />
      <Transformation />
      <TheBrief />
      <GrowingIntelligence />
      <NetworkIntelligence />
      <WhoItsFor />
      <CloseCTA />
      <Footer />
    </Box>
  );
}
