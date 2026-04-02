import React from 'react';
import {
  Box, Button, Container, Flex, Heading, Stack, Text, VStack, HStack, SimpleGrid,
} from '@chakra-ui/react';

const BG      = '#0d1117';
const SURFACE = '#111827';
const BLUE    = '#63B3ED';
const BORDER  = '#1f2937';
const MUTED   = 'gray.400';
const DIM     = 'gray.500';
const DIM2    = 'gray.600';

export const metadata = {
  title: 'Signal — Work Intelligence Platform',
  description:
    'Signal turns your daily work queue into operational intelligence. Every ticket surfaces risk, builds context, and grows your team\'s understanding of what\'s really happening.',
  keywords: [
    'work intelligence',
    'ticket intelligence',
    'MSP software',
    'operational intelligence',
    'outbreak detection',
    'service team software',
    'Signal',
    'Fieldstone',
  ],
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://signal.fieldstone.pro' },
  openGraph: {
    type: 'website',
    url: 'https://signal.fieldstone.pro',
    siteName: 'Signal',
    title: 'Signal — Work Intelligence Platform',
    description:
      'Every ticket becomes intelligence. Signal helps teams see risk earlier, act with context, and build operational knowledge that grows over time.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Signal — Work Intelligence Platform',
    description:
      'Every ticket becomes intelligence. Signal helps teams see risk earlier, act with context, and build operational knowledge that grows over time.',
  },
};

// ─────────────────────────────────────────────
// Sub-components
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
          <HStack spacing={3}>
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

function Hero() {
  return (
    <Box pt={{ base: 20, md: 32 }} pb={{ base: 16, md: 24 }} textAlign="center">
      <Container maxW="3xl">
        <VStack spacing={8}>
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
            fontSize={{ base: '4xl', md: '6xl' }}
            fontWeight="800"
            lineHeight="1.08"
            letterSpacing="-0.02em"
          >
            Every ticket becomes
            <Box as="span" color={BLUE}> intelligence.</Box>
          </Heading>
          <Text fontSize={{ base: 'lg', md: 'xl' }} color={MUTED} maxW="2xl" lineHeight="1.7">
            Signal turns your daily work queue into visible operational intelligence — so your team
            understands what is happening, not just what is broken.
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

function WhyItMatters() {
  return (
    <Box bg={SURFACE} borderTop="1px solid" borderBottom="1px solid" borderColor={BORDER} py={{ base: 16, md: 24 }}>
      <Container maxW="3xl" textAlign="center">
        <VStack spacing={6}>
          <Text fontSize="xs" fontWeight="700" letterSpacing="0.2em" color={BLUE} textTransform="uppercase">
            The problem
          </Text>
          <Heading fontSize={{ base: '2xl', md: '3xl' }} fontWeight="800" lineHeight="1.2">
            The signals are already there.
          </Heading>
          <Text fontSize={{ base: 'md', md: 'lg' }} color={MUTED} lineHeight="1.85">
            Your team generates operational intelligence every single day — in tickets, in notes, in recurring
            issues that keep coming back. The problem is not a lack of data.
          </Text>
          <Text fontSize={{ base: 'md', md: 'lg' }} color={MUTED} lineHeight="1.85">
            The problem is that nothing connects it. Tickets close. Patterns stay invisible.
            Teams move fast and context disappears.
          </Text>
          <Text fontSize={{ base: 'md', md: 'lg' }} color="white" fontWeight="600" lineHeight="1.85">
            Signal connects it. Every ticket adds to the picture. Over time, the picture becomes intelligence.
          </Text>
        </VStack>
      </Container>
    </Box>
  );
}

function ThreeValues() {
  const values = [
    {
      eyebrow: 'Risk',
      heading: 'See risk earlier.',
      body:
        'Before a problem escalates, Signal has already flagged it. Recurring patterns, rising issue counts, and environmental warnings surface automatically — before your client calls.',
    },
    {
      eyebrow: 'Context',
      heading: 'Act with context.',
      body:
        'Signal does not just tell your team what to do next. It tells them why it matters right now — what the site history says, what constraints are in play, what risks are live.',
    },
    {
      eyebrow: 'Intelligence',
      heading: 'Learn from every ticket.',
      body:
        'Each ticket builds the picture. Each closure adds structure. Over time, your workspace accumulates operational memory that makes the next response faster and more precise.',
    },
  ];

  return (
    <Box py={{ base: 16, md: 24 }}>
      <Container maxW="5xl">
        <VStack spacing={3} mb={14} textAlign="center">
          <Text fontSize="xs" fontWeight="700" letterSpacing="0.2em" color={BLUE} textTransform="uppercase">
            What changes
          </Text>
          <Heading fontSize={{ base: '2xl', md: '3xl' }} fontWeight="800">
            Three outcomes that matter.
          </Heading>
        </VStack>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
          {values.map((v) => (
            <Box
              key={v.heading}
              p={8}
              bg={SURFACE}
              border="1px solid"
              borderColor={BORDER}
              borderRadius="xl"
            >
              <Text
                fontSize="2xs"
                fontWeight="700"
                letterSpacing="0.18em"
                color={BLUE}
                textTransform="uppercase"
                mb={4}
              >
                {v.eyebrow}
              </Text>
              <Heading fontSize="xl" fontWeight="800" mb={4} color="white">
                {v.heading}
              </Heading>
              <Text fontSize="sm" color={MUTED} lineHeight="1.9">
                {v.body}
              </Text>
            </Box>
          ))}
        </SimpleGrid>
      </Container>
    </Box>
  );
}

function SituationSection() {
  return (
    <Box bg={SURFACE} borderTop="1px solid" borderBottom="1px solid" borderColor={BORDER} py={{ base: 16, md: 24 }}>
      <Container maxW="5xl">
        <Stack direction={{ base: 'column', md: 'row' }} spacing={16} align="flex-start">
          <VStack align="flex-start" spacing={5} flex={1}>
            <Text fontSize="xs" fontWeight="700" letterSpacing="0.2em" color={BLUE} textTransform="uppercase">
              Situation awareness
            </Text>
            <Heading fontSize={{ base: '2xl', md: '3xl' }} fontWeight="800" lineHeight="1.2">
              Signal reads the moment, not just the task.
            </Heading>
            <Text fontSize="md" color={MUTED} lineHeight="1.85">
              Most tools tell you what is open and what is overdue. Signal tells you what it means.
            </Text>
            <Text fontSize="md" color={MUTED} lineHeight="1.85">
              Before your team walks into a site — or opens a ticket — Signal has already assembled the
              operational picture: what has happened here, what is at risk, what the client\'s
              expectations are, and what your team should watch for.
            </Text>
            <Text fontSize="md" color={MUTED} lineHeight="1.85">
              That is not a summary. That is readiness.
            </Text>
          </VStack>
          <VStack align="flex-start" spacing={4} flex={1}>
            {[
              { label: 'Readiness', desc: 'What is the site posture going into this visit or response?' },
              { label: 'Trust signals', desc: 'Is this relationship stable, strained, or at a decision point?' },
              { label: 'Constraints', desc: 'What do we know about timelines, sensitivities, or prior commitments?' },
              { label: 'Risk flags', desc: 'What recurring patterns or open exposure points should drive urgency?' },
              { label: 'Decision posture', desc: 'What context does the team need to act well — not just act fast?' },
            ].map((item) => (
              <Box
                key={item.label}
                p={5}
                bg={BG}
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

function GrowingIntelligence() {
  const levels = [
    {
      number: '01',
      title: 'Ticket intelligence',
      desc:
        'Every ticket is read for structure, risk, and meaning. Categories, patterns, tools involved, and outcome context are extracted automatically at close.',
    },
    {
      number: '02',
      title: 'Workspace intelligence',
      desc:
        'Over time, your workspace builds operational memory. Signal knows what is recurring, what has been resolved, and what is trending in your environment.',
    },
    {
      number: '03',
      title: 'Broader pattern intelligence',
      desc:
        'Intelligence compounds across workspaces. Signal surfaces recurring tool failures, outbreak behavior, and risk themes — abstracted, aggregated, and safe.',
    },
  ];

  return (
    <Box py={{ base: 16, md: 24 }}>
      <Container maxW="5xl">
        <VStack spacing={3} mb={14} textAlign="center">
          <Text fontSize="xs" fontWeight="700" letterSpacing="0.2em" color={BLUE} textTransform="uppercase">
            How signal grows
          </Text>
          <Heading fontSize={{ base: '2xl', md: '3xl' }} fontWeight="800">
            Local context. Growing intelligence.
          </Heading>
          <Text fontSize="md" color={MUTED} maxW="xl" lineHeight="1.8">
            Signal does not just organize work. It builds operational knowledge — at the ticket level,
            the workspace level, and across the broader pattern network.
          </Text>
        </VStack>
        <VStack spacing={5}>
          {levels.map((level, i) => (
            <Box
              key={level.number}
              p={8}
              bg={SURFACE}
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

function NetworkIntelligence() {
  return (
    <Box bg={SURFACE} borderTop="1px solid" borderBottom="1px solid" borderColor={BORDER} py={{ base: 16, md: 24 }}>
      <Container maxW="5xl">
        <Stack direction={{ base: 'column', md: 'row' }} spacing={16} align="center">
          <VStack align="flex-start" spacing={5} flex={1}>
            <Text fontSize="xs" fontWeight="700" letterSpacing="0.2em" color={BLUE} textTransform="uppercase">
              Network intelligence
            </Text>
            <Heading fontSize={{ base: '2xl', md: '3xl' }} fontWeight="800" lineHeight="1.2">
              Your team is not the only one seeing this.
            </Heading>
            <Text fontSize="md" color={MUTED} lineHeight="1.85">
              Signal watches for patterns that transcend a single ticket or a single client. When a
              tool starts failing across environments, Signal flags it. When an issue type is escalating
              across workspaces, Signal sees it first.
            </Text>
            <Text fontSize="md" color={MUTED} lineHeight="1.85">
              This intelligence is pattern-based and abstracted. No private details cross workspace
              boundaries. What travels is the shape of the problem — not the client behind it.
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
                <Text fontSize="sm" color={MUTED} lineHeight="1.7">
                  {point}
                </Text>
              </HStack>
            ))}
          </VStack>
        </Stack>
      </Container>
    </Box>
  );
}

function WhoItsFor() {
  const segments = [
    {
      title: 'MSPs and service providers',
      desc: 'Manage client environments, dispatch boards, and recurring issues across accounts — with intelligence that grows with every engagement.',
    },
    {
      title: 'Internal IT and operations teams',
      desc: 'Track the work your team handles every day and build operational clarity that persists across staff changes and shifting priorities.',
    },
    {
      title: 'Software and support organizations',
      desc: 'Understand what your users are actually experiencing, surface the patterns that matter, and build institutional knowledge from every support interaction.',
    },
    {
      title: 'Field operations teams',
      desc: 'Walk into every site prepared. Signal gives your team the situational context they need before the first question is asked.',
    },
  ];

  return (
    <Box py={{ base: 16, md: 24 }}>
      <Container maxW="5xl">
        <VStack spacing={3} mb={14} textAlign="center">
          <Text fontSize="xs" fontWeight="700" letterSpacing="0.2em" color={BLUE} textTransform="uppercase">
            Built for
          </Text>
          <Heading fontSize={{ base: '2xl', md: '3xl' }} fontWeight="800">
            Any team that runs on requests.
          </Heading>
          <Text fontSize="md" color={MUTED} maxW="xl" lineHeight="1.8">
            If your team handles tickets, requests, or operational work — Signal turns that work into intelligence.
          </Text>
        </VStack>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
          {segments.map((s) => (
            <Box
              key={s.title}
              p={7}
              bg={SURFACE}
              border="1px solid"
              borderColor={BORDER}
              borderRadius="xl"
            >
              <Heading fontSize="md" fontWeight="700" color="white" mb={3}>
                {s.title}
              </Heading>
              <Text fontSize="sm" color={MUTED} lineHeight="1.85">
                {s.desc}
              </Text>
            </Box>
          ))}
        </SimpleGrid>
      </Container>
    </Box>
  );
}

function CloseCTA() {
  return (
    <Box bg={SURFACE} borderTop="1px solid" borderColor={BORDER} py={{ base: 20, md: 32 }}>
      <Container maxW="3xl" textAlign="center">
        <VStack spacing={7}>
          <Text fontSize="xs" fontWeight="700" letterSpacing="0.2em" color={BLUE} textTransform="uppercase">
            Get started
          </Text>
          <Heading fontSize={{ base: '3xl', md: '4xl' }} fontWeight="800" lineHeight="1.15">
            See what your work is trying to tell you.
          </Heading>
          <Text fontSize="lg" color={MUTED} maxW="lg" lineHeight="1.75">
            Connect your inbox. Signal reads the work, surfaces the intelligence, and helps your team
            respond with clarity.
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
            <Text as="a" href="/login" fontSize="sm" color={DIM} _hover={{ color: BLUE }} cursor="pointer">
              Sign In
            </Text>
            <Text as="a" href="/signup" fontSize="sm" color={DIM} _hover={{ color: BLUE }} cursor="pointer">
              Sign Up
            </Text>
            <Text as="a" href="https://demo.signal.fieldstone.pro/pm" fontSize="sm" color={DIM} _hover={{ color: BLUE }} cursor="pointer">
              Demo
            </Text>
            <Text as="a" href="https://www.fieldstone.pro" fontSize="sm" color={DIM} _hover={{ color: BLUE }} cursor="pointer">
              Fieldstone
            </Text>
          </HStack>
        </Flex>
      </Container>
    </Box>
  );
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default function SignalLandingPage() {
  return (
    <Box minH="100vh" bg={BG} color="white">
        <Nav />
        <Hero />
        <WhyItMatters />
        <ThreeValues />
        <SituationSection />
        <GrowingIntelligence />
        <NetworkIntelligence />
        <WhoItsFor />
        <CloseCTA />
        <Footer />
    </Box>
  );
}
