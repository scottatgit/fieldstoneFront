'use client';

import React, { useRef } from 'react';
import {
  Box,
  Button,
  Container,
  Flex,
  Grid,
  Heading,
  Stack,
  Text,
  Badge,
  VStack,
  HStack,
  Divider,
} from '@chakra-ui/react';
import { motion, Variants } from 'framer-motion';

// ---------------------------------------------------------------------------
// Motion wrappers
// ---------------------------------------------------------------------------
const MotionBox = motion(Box as any);

// ---------------------------------------------------------------------------
// Reusable animation variants
// ---------------------------------------------------------------------------
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.12, ease: 'easeOut' },
  }),
};

const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.8 } },
};

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------
interface PainPoint {
  icon: string;
  title: string;
  description: string;
}

const painPoints: PainPoint[] = [
  {
    icon: '📋',
    title: 'Ticket Overload',
    description: '26 open tickets, no context on which needs attention or what the client actually expects.',
  },
  {
    icon: '🚪',
    title: 'Walking In Blind',
    description: 'No site history, no client relationship context — technicians arrive unprepared every time.',
  },
  {
    icon: '🎲',
    title: 'No Prep',
    description: 'Technicians improvise instead of execute. Every visit is a gamble with client satisfaction.',
  },
];

interface Signal {
  emoji: string;
  name: string;
  description: string;
  example: string;
  color: string;
  bgColor: string;
}

const signals: Signal[] = [
  {
    emoji: '🟢',
    name: 'Readiness',
    description: 'Are you prepared to execute?',
    example: 'HIGH (83/100) — All context in place',
    color: '#22C55E',
    bgColor: 'rgba(34,197,94,0.08)',
  },
  {
    emoji: '➡️',
    name: 'Trust',
    description: 'Client relationship health',
    example: 'NEUTRAL — Standard delivery expected',
    color: '#3B82F6',
    bgColor: 'rgba(59,130,246,0.08)',
  },
  {
    emoji: '🎯',
    name: 'Expectation',
    description: 'What the client expects delivered',
    example: 'Complete installation before leaving',
    color: '#A855F7',
    bgColor: 'rgba(168,85,247,0.08)',
  },
  {
    emoji: '⚠️',
    name: 'Constraint',
    description: 'Time and access restrictions',
    example: 'Lunch 12–1 PM, back by 1:30',
    color: '#F59E0B',
    bgColor: 'rgba(245,158,11,0.08)',
  },
  {
    emoji: '🔷',
    name: 'Decision',
    description: 'What you must decide on-site',
    example: '[GO/NO-GO] Verify systems operational',
    color: '#06B6D4',
    bgColor: 'rgba(6,182,212,0.08)',
  },
];

interface Step {
  emoji: string;
  title: string;
  description: string;
}

const steps: Step[] = [
  {
    emoji: '📥',
    title: 'Ingest',
    description: 'Tickets and emails flow in automatically',
  },
  {
    emoji: '📡',
    title: 'Analyze',
    description: 'Signal engine scores every open ticket',
  },
  {
    emoji: '📋',
    title: 'Brief',
    description: 'Prep brief delivered before every visit',
  },
];

interface ComingSoonCard {
  emoji: string;
  name: string;
  description: string;
}

const comingSoon: ComingSoonCard[] = [
  {
    emoji: '🧠',
    name: 'Sales Brain',
    description: 'Client acquisition intelligence',
  },
  {
    emoji: '💰',
    name: 'Finance Brain',
    description: 'Revenue and billing signals',
  },
  {
    emoji: '⚙️',
    name: 'Ops Brain',
    description: 'Resource and scheduling optimization',
  },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Section wrapper with consistent padding */
function Section({
  children,
  bg = 'transparent',
  id,
}: {
  children: React.ReactNode;
  bg?: string;
  id?: string;
}) {
  return (
    <Box as="section" id={id} bg={bg} py={{ base: 16, md: 24 }} px={4}>
      <Container maxW="6xl">{children}</Container>
    </Box>
  );
}

/** Section heading with optional subtitle */
function SectionHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <MotionBox
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      variants={fadeIn}
      mb={12}
      textAlign="center"
    >
      <Heading
        as="h2"
        fontSize={{ base: '2xl', md: '4xl' }}
        fontWeight="extrabold"
        color="white"
        mb={3}
      >
        {title}
      </Heading>
      {subtitle && (
        <Text fontSize={{ base: 'md', md: 'lg' }} color="gray.400" maxW="2xl" mx="auto">
          {subtitle}
        </Text>
      )}
    </MotionBox>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export default function Acquisition() {
  const howItWorksRef = useRef<HTMLDivElement>(null);

  const scrollToHowItWorks = () => {
    howItWorksRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <Box
      bg="#1a1a1a"
      minH="100vh"
      color="white"
      fontFamily="'-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif'}"
    >
      {/* ================================================================
          1. HERO
          ================================================================ */}
      <Box
        as="section"
        position="relative"
        overflow="hidden"
        py={{ base: 24, md: 36 }}
        px={4}
        bg="linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 50%, #0d1a2e 100%)"
      >
        {/* Background glow */}
        <Box
          position="absolute"
          top="-200px"
          left="50%"
          transform="translateX(-50%)"
          w="800px"
          h="800px"
          borderRadius="full"
          bg="rgba(59,130,246,0.06)"
          filter="blur(80px)"
          pointerEvents="none"
        />

        <Container maxW="4xl" textAlign="center" position="relative">
          {/* Brand badge */}
          <MotionBox
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={0}
            mb={6}
          >
            <Badge
              px={4}
              py={1}
              borderRadius="full"
              bg="rgba(59,130,246,0.15)"
              color="#3B82F6"
              fontSize="sm"
              fontWeight="semibold"
              border="1px solid rgba(59,130,246,0.3)"
              textTransform="none"
            >
              Fieldstone AI · Signal-Based Intelligence
            </Badge>
          </MotionBox>

          {/* Main headline */}
          <MotionBox
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={1}
          >
            <Heading
              as="h1"
              fontSize={{ base: '5xl', md: '8xl' }}
              fontWeight="900"
              lineHeight="1"
              mb={4}
              bgGradient="linear(to-r, white, #93C5FD)"
              bgClip="text"
              letterSpacing="-2px"
            >
              Second Brain
            </Heading>
          </MotionBox>

          {/* Subtitle */}
          <MotionBox
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={2}
          >
            <Text
              fontSize={{ base: 'lg', md: '2xl' }}
              color="#93C5FD"
              fontWeight="semibold"
              mb={6}
            >
              Signal-based project intelligence for field service teams
            </Text>
          </MotionBox>

          {/* Description */}
          <MotionBox
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={3}
          >
            <Text
              fontSize={{ base: 'md', md: 'lg' }}
              color="gray.400"
              maxW="2xl"
              mx="auto"
              mb={10}
              lineHeight={1.8}
            >
              Stop walking into onsite visits blind. Second Brain ingests your
              tickets, scores 5 intelligence signals, and delivers a prep brief
              before every visit.
            </Text>
          </MotionBox>

          {/* CTA Buttons */}
          <MotionBox
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={4}
          >
            <Stack
              direction={{ base: 'column', sm: 'row' }}
              spacing={4}
              justify="center"
            >
              <Button
                as="a"
                href="mailto:scotteverett@ipquest.net?subject=Second Brain Demo Request"
                size="lg"
                bg="#3B82F6"
                color="white"
                px={8}
                py={6}
                fontSize="md"
                fontWeight="bold"
                borderRadius="xl"
                _hover={{
                  bg: '#2563EB',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 30px rgba(59,130,246,0.4)',
                }}
                transition="all 0.2s"
              >
                Book a Demo
              </Button>
              <Button
                size="lg"
                variant="outline"
                borderColor="rgba(255,255,255,0.3)"
                color="white"
                px={8}
                py={6}
                fontSize="md"
                fontWeight="semibold"
                borderRadius="xl"
                onClick={scrollToHowItWorks}
                _hover={{
                  bg: 'rgba(255,255,255,0.07)',
                  borderColor: 'white',
                  transform: 'translateY(-2px)',
                }}
                transition="all 0.2s"
              >
                See How It Works
              </Button>
              <Button
                as="a"
                href="/pm"
                size="lg"
                bg="#10B981"
                color="white"
                px={8}
                py={6}
                fontSize="md"
                fontWeight="bold"
                borderRadius="xl"
                _hover={{
                  bg: '#059669',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 30px rgba(16,185,129,0.4)',
                }}
                transition="all 0.2s"
              >
                ▶ Try Live Demo
              </Button>
            </Stack>
          </MotionBox>

          {/* Metrics strip */}
          <MotionBox
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={5}
            mt={16}
          >
            <Flex
              justify="center"
              gap={{ base: 8, md: 16 }}
              direction={{ base: 'column', sm: 'row' }}
              align="center"
            >
              {[
                { value: '5', label: 'Intelligence Signals' },
                { value: '26', label: 'Tickets Tracked' },
                { value: '18', label: 'Site Profiles' },
              ].map((m) => (
                <Box key={m.label} textAlign="center">
                  <Text
                    fontSize="3xl"
                    fontWeight="900"
                    color="#3B82F6"
                    lineHeight={1}
                  >
                    {m.value}
                  </Text>
                  <Text fontSize="sm" color="gray.500" mt={1}>
                    {m.label}
                  </Text>
                </Box>
              ))}
            </Flex>
          </MotionBox>
        </Container>
      </Box>

      {/* ================================================================
          2. PROBLEM SECTION
          ================================================================ */}
      <Section id="problem" bg="#111111">
        <SectionHeading
          title="The Field PM Problem"
          subtitle="Every day your technicians walk into client sites carrying nothing but a ticket number and hope."
        />
        <Grid
          templateColumns={{ base: '1fr', md: 'repeat(3,1fr)' }}
          gap={6}
        >
          {painPoints.map((p, i) => (
            <MotionBox
              key={p.title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={fadeUp}
              custom={i}
            >
              <Box
                bg="#1e1e1e"
                border="1px solid rgba(255,255,255,0.08)"
                borderRadius="2xl"
                p={8}
                h="full"
                _hover={{
                  borderColor: 'rgba(59,130,246,0.4)',
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
                }}
                transition="all 0.3s"
              >
                <Text fontSize="3xl" mb={4}>
                  {p.icon}
                </Text>
                <Heading
                  as="h3"
                  fontSize="xl"
                  fontWeight="bold"
                  color="white"
                  mb={3}
                >
                  {p.title}
                </Heading>
                <Text color="gray.400" lineHeight={1.7}>
                  {p.description}
                </Text>
              </Box>
            </MotionBox>
          ))}
        </Grid>
      </Section>

      {/* ================================================================
          3. SIGNAL ENGINE
          ================================================================ */}
      <Section id="signals">
        <SectionHeading
          title="Five Signals. One Brief."
          subtitle="Every ticket is scored across 5 intelligence dimensions before your technician arrives."
        />
        <Grid
          templateColumns={{ base: '1fr', sm: 'repeat(2,1fr)', lg: 'repeat(5,1fr)' }}
          gap={4}
        >
          {signals.map((s, i) => (
            <MotionBox
              key={s.name}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={fadeUp}
              custom={i}
            >
              <Box
                bg={s.bgColor}
                border={`1px solid ${s.color}33`}
                borderRadius="2xl"
                p={6}
                h="full"
                _hover={{
                  border: `1px solid ${s.color}88`,
                  transform: 'translateY(-4px)',
                  boxShadow: `0 12px 40px ${s.color}22`,
                }}
                transition="all 0.3s"
              >
                <Text fontSize="2xl" mb={3}>
                  {s.emoji}
                </Text>
                <Heading
                  as="h3"
                  fontSize="lg"
                  fontWeight="bold"
                  color={s.color}
                  mb={2}
                >
                  {s.name}
                </Heading>
                <Text color="gray.400" fontSize="sm" mb={4} lineHeight={1.6}>
                  {s.description}
                </Text>
                <Divider borderColor="rgba(255,255,255,0.08)" mb={4} />
                <Box
                  bg="rgba(0,0,0,0.3)"
                  borderRadius="lg"
                  p={3}
                  border="1px solid rgba(255,255,255,0.06)"
                >
                  <Text
                    fontSize="xs"
                    color="gray.500"
                    fontWeight="semibold"
                    textTransform="uppercase"
                    letterSpacing="wider"
                    mb={1}
                  >
                    Example Output
                  </Text>
                  <Text
                    fontSize="xs"
                    color="white"
                    fontFamily="mono"
                    lineHeight={1.5}
                  >
                    {s.example}
                  </Text>
                </Box>
              </Box>
            </MotionBox>
          ))}
        </Grid>
      </Section>

      {/* ================================================================
          4. HOW IT WORKS
          ================================================================ */}
      <Section id="how-it-works" bg="#111111">
        <Box ref={howItWorksRef}>
          <SectionHeading
            title="3 Steps to Smarter Visits"
            subtitle="From raw ticket to actionable prep brief in minutes."
          />
          <Flex
            direction={{ base: 'column', md: 'row' }}
            gap={0}
            align="center"
            justify="center"
          >
            {steps.map((step, i) => (
              <React.Fragment key={step.title}>
                <MotionBox
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.3 }}
                  variants={fadeUp}
                  custom={i}
                  flex="1"
                  maxW={{ base: 'full', md: '280px' }}
                >
                  <Box
                    bg="#1e1e1e"
                    border="1px solid rgba(255,255,255,0.08)"
                    borderRadius="2xl"
                    p={8}
                    textAlign="center"
                    _hover={{
                      borderColor: 'rgba(59,130,246,0.4)',
                      transform: 'translateY(-4px)',
                    }}
                    transition="all 0.3s"
                  >
                    <Box
                      w={16}
                      h={16}
                      borderRadius="full"
                      bg="rgba(59,130,246,0.12)"
                      border="2px solid rgba(59,130,246,0.3)"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      mx="auto"
                      mb={5}
                    >
                      <Text fontSize="2xl">{step.emoji}</Text>
                    </Box>
                    <Badge
                      bg="rgba(59,130,246,0.15)"
                      color="#3B82F6"
                      fontSize="xs"
                      fontWeight="bold"
                      px={3}
                      py={1}
                      borderRadius="full"
                      mb={3}
                      textTransform="none"
                    >
                      Step {i + 1}
                    </Badge>
                    <Heading
                      as="h3"
                      fontSize="xl"
                      fontWeight="bold"
                      color="white"
                      mb={2}
                    >
                      {step.title}
                    </Heading>
                    <Text color="gray.400" fontSize="sm" lineHeight={1.7}>
                      {step.description}
                    </Text>
                  </Box>
                </MotionBox>

                {/* Arrow connector */}
                {i < steps.length - 1 && (
                  <Box
                    display={{ base: 'none', md: 'flex' }}
                    alignItems="center"
                    px={2}
                    color="#3B82F6"
                    fontSize="2xl"
                    flexShrink={0}
                  >
                    →
                  </Box>
                )}
              </React.Fragment>
            ))}
          </Flex>
        </Box>
      </Section>

      {/* ================================================================
          5. SAMPLE PREP BRIEF
          ================================================================ */}
      <Section id="brief-preview">
        <SectionHeading
          title="See the Output"
          subtitle="This is what your technician receives before every onsite visit."
        />
        <MotionBox
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeUp}
          maxW="3xl"
          mx="auto"
        >
          <Box
            bg="#0d0d0d"
            border="1px solid rgba(59,130,246,0.3)"
            borderRadius="2xl"
            overflow="hidden"
            boxShadow="0 24px 80px rgba(0,0,0,0.6)"
          >
            {/* Terminal header bar */}
            <Flex
              bg="#161616"
              px={5}
              py={3}
              align="center"
              justify="space-between"
              borderBottom="1px solid rgba(255,255,255,0.06)"
            >
              <HStack spacing={2}>
                <Box w={3} h={3} borderRadius="full" bg="#FF5F57" />
                <Box w={3} h={3} borderRadius="full" bg="#FEBC2E" />
                <Box w={3} h={3} borderRadius="full" bg="#28C840" />
              </HStack>
              <Badge
                bg="rgba(59,130,246,0.2)"
                color="#3B82F6"
                fontSize="xs"
                fontWeight="bold"
                px={3}
                py={1}
                borderRadius="full"
                textTransform="none"
              >
                LIVE OUTPUT — Generated by Second Brain
              </Badge>
              <Text fontSize="xs" color="gray.600" fontFamily="mono">
                !brief
              </Text>
            </Flex>

            {/* Brief content */}
            <Box p={8} fontFamily="mono">
              {/* Header */}
              <Text
                color="#3B82F6"
                fontWeight="bold"
                fontSize={{ base: 'sm', md: 'md' }}
                mb={1}
              >
                ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              </Text>
              <Text color="white" fontWeight="900" fontSize={{ base: 'lg', md: 'xl' }} mb={1}>
                🧠 SECOND BRAIN — PREP BRIEF
              </Text>
              <Text color="gray.500" fontSize="sm" mb={1}>
                Site: Knox Square Dental
              </Text>
              <Text color="gray.500" fontSize="sm" mb={1}>
                Ticket: NETWORK ISSUE — Intermittent drops reported
              </Text>
              <Text color="gray.600" fontSize="xs" mb={4}>
                Generated: Tue Feb 25 2026 · 08:14 AM
              </Text>
              <Text color="#3B82F6" fontSize="sm" mb={6}>
                ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              </Text>

              {/* Signal rows */}
              <VStack spacing={4} align="stretch">
                <SignalRow
                  emoji="🟢"
                  label="READINESS"
                  value="HIGH (83/100)"
                  detail="All context in place — prior visit notes available"
                  color="#22C55E"
                />
                <SignalRow
                  emoji="➡️"
                  label="TRUST"
                  value="NEUTRAL"
                  detail="Standard delivery expected — no escalation history"
                  color="#3B82F6"
                />
                <SignalRow
                  emoji="🎯"
                  label="EXPECTATION"
                  value="INSTALL"
                  detail="Complete network switch installation before leaving"
                  color="#A855F7"
                />
                <SignalRow
                  emoji="⚠️"
                  label="CONSTRAINT"
                  value="TIME WINDOW"
                  detail="Lunch 12–1 PM • Must be clear by 1:30 PM"
                  color="#F59E0B"
                />
                <SignalRow
                  emoji="🔷"
                  label="DECISION"
                  value="[GO/NO-GO]"
                  detail="Verify all imaging systems operational before sign-off"
                  color="#06B6D4"
                />
              </VStack>

              {/* Footer */}
              <Text color="#3B82F6" fontSize="sm" mt={6} mb={2}>
                ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              </Text>
              <Text color="gray.600" fontSize="xs">
                Powered by Fieldstone AI · Second Brain v2.3
              </Text>
            </Box>
          </Box>
        </MotionBox>
      </Section>

      {/* ================================================================
          6. COMING SOON
          ================================================================ */}
      <Section id="coming-soon" bg="#111111">
        <SectionHeading
          title="More Builds Coming"
          subtitle="Second Brain is the first Fieldstone AI build. The intelligence platform is just getting started."
        />
        <Grid
          templateColumns={{ base: '1fr', md: 'repeat(3,1fr)' }}
          gap={6}
          maxW="4xl"
          mx="auto"
        >
          {comingSoon.map((c, i) => (
            <MotionBox
              key={c.name}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={fadeUp}
              custom={i}
            >
              <Box
                bg="#1a1a1a"
                border="1px solid rgba(255,255,255,0.06)"
                borderRadius="2xl"
                p={8}
                textAlign="center"
                opacity={0.65}
                filter="blur(0.3px)"
                _hover={{ opacity: 0.8, filter: 'blur(0px)' }}
                transition="all 0.3s"
                position="relative"
                overflow="hidden"
              >
                {/* Coming soon overlay badge */}
                <Badge
                  position="absolute"
                  top={4}
                  right={4}
                  bg="rgba(255,255,255,0.06)"
                  color="gray.400"
                  fontSize="xs"
                  fontWeight="semibold"
                  px={3}
                  py={1}
                  borderRadius="full"
                  border="1px solid rgba(255,255,255,0.1)"
                  textTransform="none"
                >
                  Coming Soon
                </Badge>
                <Text fontSize="3xl" mb={4}>
                  {c.emoji}
                </Text>
                <Heading
                  as="h3"
                  fontSize="xl"
                  fontWeight="bold"
                  color="gray.300"
                  mb={2}
                >
                  {c.name}
                </Heading>
                <Text color="gray.600" fontSize="sm">
                  {c.description}
                </Text>
              </Box>
            </MotionBox>
          ))}
        </Grid>
      </Section>

      {/* ================================================================
          7. CTA FOOTER
          ================================================================ */}
      <Box
        as="section"
        py={{ base: 20, md: 32 }}
        px={4}
        bg="linear-gradient(135deg, #0d1a2e 0%, #1a1a1a 100%)"
        position="relative"
        overflow="hidden"
      >
        {/* Glow */}
        <Box
          position="absolute"
          bottom="-150px"
          left="50%"
          transform="translateX(-50%)"
          w="600px"
          h="600px"
          borderRadius="full"
          bg="rgba(59,130,246,0.08)"
          filter="blur(80px)"
          pointerEvents="none"
        />

        <Container maxW="3xl" textAlign="center" position="relative">
          <MotionBox
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
          >
            <Text
              fontSize="sm"
              color="#3B82F6"
              fontWeight="semibold"
              textTransform="uppercase"
              letterSpacing="wider"
              mb={4}
            >
              Fieldstone AI
            </Text>
            <Heading
              as="h2"
              fontSize={{ base: '3xl', md: '5xl' }}
              fontWeight="900"
              color="white"
              mb={5}
              lineHeight={1.1}
            >
              Ready to stop walking in blind?
            </Heading>
            <Text
              color="gray.400"
              fontSize={{ base: 'md', md: 'lg' }}
              mb={10}
              maxW="xl"
              mx="auto"
              lineHeight={1.8}
            >
              Join field service teams using Second Brain to walk into every
              client visit prepared, confident, and in control.
            </Text>
            <Button
              as="a"
              href="mailto:scotteverett@ipquest.net?subject=Second Brain Demo Request"
              size="lg"
              bg="#3B82F6"
              color="white"
              px={12}
              py={7}
              fontSize="lg"
              fontWeight="bold"
              borderRadius="2xl"
              _hover={{
                bg: '#2563EB',
                transform: 'translateY(-3px)',
                boxShadow: '0 16px 50px rgba(59,130,246,0.5)',
              }}
              transition="all 0.25s"
              mb={12}
            >
              Book a Demo →
            </Button>
            <Button
              as="a"
              href="/pm"
              size="lg"
              bg="#10B981"
              color="white"
              px={12}
              py={7}
              fontSize="lg"
              fontWeight="bold"
              borderRadius="2xl"
              _hover={{
                bg: '#059669',
                transform: 'translateY(-3px)',
                boxShadow: '0 16px 50px rgba(16,185,129,0.4)',
              }}
              transition="all 0.25s"
              mb={6}
            >
              ▶ Try Live Demo
            </Button>

            <Divider borderColor="rgba(255,255,255,0.06)" mb={8} />

            <HStack justify="center" spacing={3}>
              <Box
                w={6}
                h={6}
                borderRadius="md"
                bg="#3B82F6"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Text fontSize="xs" fontWeight="900" color="white">
                  F
                </Text>
              </Box>
              <Text color="gray.600" fontSize="sm">
                Powered by{' '}
                <Text as="span" color="gray.400" fontWeight="semibold">
                  Fieldstone AI
                </Text>
              </Text>
            </HStack>
          </MotionBox>
        </Container>
      </Box>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// SignalRow — used in the prep brief preview
// ---------------------------------------------------------------------------
interface SignalRowProps {
  emoji: string;
  label: string;
  value: string;
  detail: string;
  color: string;
}

function SignalRow({ emoji, label, value, detail, color }: SignalRowProps) {
  return (
    <Box
      bg="rgba(255,255,255,0.03)"
      border="1px solid rgba(255,255,255,0.06)"
      borderLeft={`3px solid ${color}`}
      borderRadius="lg"
      p={4}
    >
      <Flex
        direction={{ base: 'column', sm: 'row' }}
        align={{ base: 'flex-start', sm: 'center' }}
        justify="space-between"
        gap={2}
        mb={1}
      >
        <HStack spacing={2}>
          <Text fontSize="sm">{emoji}</Text>
          <Text fontSize="xs" color="gray.500" fontWeight="bold" letterSpacing="wider">
            {label}
          </Text>
        </HStack>
        <Text
          fontSize="xs"
          fontWeight="900"
          color={color}
          fontFamily="mono"
          letterSpacing="wide"
        >
          {value}
        </Text>
      </Flex>
      <Text fontSize="xs" color="gray.500" fontFamily="mono" lineHeight={1.6}>
        {detail}
      </Text>
    </Box>
  );
}
