'use client';

import React from 'react';
import { useUser } from '@/lib/useUser';
import { useRouter } from 'next/navigation';
import { SignalUserButton } from '@/components/SignalUserButton';
import {
  Box, Button, Container, Flex, Grid, Heading, Stack,
  Text, Badge, VStack, HStack, Divider,
} from '@chakra-ui/react';
import { motion, Variants } from 'framer-motion';

const MotionBox = motion(Box as any);

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.55, delay: i * 0.1, ease: 'easeOut' },
  }),
};

const BG       = '#0d1117';
const BG2      = '#111827';
const BORDER   = '#1f2937';
const BLUE     = '#63B3ED';
const BLUE_DIM = '#1e3a5f';

function Section({ children, bg = BG, py = 20 }: { children: React.ReactNode; bg?: string; py?: number }) {
  return (
    <Box as="section" bg={bg} py={py}>
      <Container maxW="6xl" px={{ base: 5, md: 10 }}>
        {children}
      </Container>
    </Box>
  );
}

function BriefMock() {
  return (
    <Box
      bg="#111827" border="1px solid" borderColor={BORDER}
      borderRadius="xl" p={5} fontFamily="mono"
      fontSize={{ base: 'xs', md: 'sm' }}
      boxShadow="0 0 40px rgba(99,179,237,0.08)"
      maxW="420px" w="full"
    >
      <HStack mb={4} spacing={2}>
        <Text fontSize="2xs" fontWeight="black" letterSpacing="widest" color={BLUE}>SIGNAL</Text>
        <Text fontSize="2xs" color="gray.600">—</Text>
        <Text fontSize="2xs" color="gray.500">PREP BRIEF</Text>
      </HStack>
      <Box mb={4}>
        <Text fontSize="2xs" fontWeight="bold" color="gray.500" letterSpacing="widest" mb={1}>SITUATION</Text>
        <Text color="white" fontSize="sm" lineHeight="short">
          Front desk workstation cannot connect to Eaglesoft server
        </Text>
      </Box>
      <Divider borderColor={BORDER} mb={4} />
      <Box mb={4}>
        <Text fontSize="2xs" fontWeight="bold" color="gray.500" letterSpacing="widest" mb={1}>EXPECTATION</Text>
        <Text color="gray.300" fontSize="xs">
          Restore connectivity before morning patients arrive
        </Text>
      </Box>
      <Box mb={4} bg="red.950" border="1px solid" borderColor="red.900" borderRadius="md" p={3}>
        <Text fontSize="2xs" fontWeight="bold" color="red.400" letterSpacing="widest" mb={2}>RISK FLAGS</Text>
        <HStack spacing={2} align="flex-start">
          <Text color="red.400" fontSize="xs">⚠</Text>
          <Text color="red.300" fontSize="xs">Potential patient care interruption if not resolved by 8 AM</Text>
        </HStack>
      </Box>
      <Box bg={BLUE_DIM} border="1px solid" borderColor="blue.800" borderRadius="md" p={3}>
        <HStack mb={1} spacing={2}>
          <Text fontSize="2xs" fontWeight="bold" color={BLUE} letterSpacing="widest">GLOBAL INTEL</Text>
          <Badge colorScheme="blue" fontSize="2xs">3 ORGS</Badge>
        </HStack>
        <Text color="blue.200" fontSize="xs">
          Eaglesoft instability after network switch reboot — restart service, verify database path
        </Text>
      </Box>
    </Box>
  );
}

function Nav() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  return (
    <Box
      as="nav" bg={BG} borderBottom="1px solid" borderColor={BORDER}
      px={{ base: 5, md: 10 }} py={3} position="sticky" top={0} zIndex={100}
    >
      <Flex align="center" justify="space-between" maxW="6xl" mx="auto">
        <Text fontSize="sm" fontWeight="black" fontFamily="mono" letterSpacing="widest" color={BLUE}>
          SIGNAL
        </Text>
        <HStack spacing={{ base: 3, md: 6 }}>
          <Text fontSize="xs" color="gray.500" fontFamily="mono" display={{ base: 'none', md: 'block' }}>
            by Fieldstone
          </Text>
          <Button
            as="a" href="https://demo.signal.fieldstone.pro/pm"
            size="xs" variant="ghost"
            color="gray.400" fontFamily="mono" fontSize="xs"
            _hover={{ color: 'white' }}
          >
            DEMO
          </Button>
          {isLoaded && isSignedIn ? (
            <HStack spacing={3}>
              <Button
                as="a" href="/pm"
                size="sm"
                bg={BLUE} color="gray.900"
                fontFamily="mono" fontSize="xs"
                fontWeight="bold" letterSpacing="wider"
                _hover={{ bg: '#90cdf4' }}
                px={5}
              >
                DASHBOARD
              </Button>
              <SignalUserButton />
            </HStack>
          ) : (
            <HStack spacing={3}>
              <Button
                onClick={() => router.push('/login')}
                size="sm" variant="outline"
                borderColor="gray.600" color="gray.300"
                fontFamily="mono" fontSize="xs"
                fontWeight="bold" letterSpacing="wider"
                _hover={{ borderColor: BLUE, color: BLUE }}
                px={5}
              >
                SIGN IN
              </Button>
              <Button
                onClick={() => router.push('/signup')}
                size="sm"
                bg={BLUE} color="gray.900"
                fontFamily="mono" fontSize="xs"
                fontWeight="bold" letterSpacing="wider"
                _hover={{ bg: '#90cdf4' }}
                px={5}
              >
                GET STARTED
              </Button>
            </HStack>
          )}
        </HStack>
      </Flex>
    </Box>
  );
}

function Hero() {
  const router = useRouter();
  return (
    <Section py={24}>
      <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={12} alignItems="center">
        <VStack align="flex-start" spacing={6}>
          <MotionBox initial="hidden" animate="visible" custom={0} variants={fadeUp}>
            <Badge colorScheme="blue" fontFamily="mono" fontSize="2xs" letterSpacing="widest" px={3} py={1}>
              OPERATIONAL INTELLIGENCE
            </Badge>
          </MotionBox>
          <MotionBox initial="hidden" animate="visible" custom={1} variants={fadeUp}>
            <Heading as="h1" fontSize={{ base: '4xl', md: '5xl', lg: '6xl' }} fontWeight="black" lineHeight={1.05} color="white">
              Signal
            </Heading>
            <Heading as="h2" fontSize={{ base: 'xl', md: '2xl' }} fontWeight="medium" color="gray.400" mt={2} lineHeight="short">
              Operational Intelligence<br />for Service Teams
            </Heading>
          </MotionBox>
          <MotionBox initial="hidden" animate="visible" custom={2} variants={fadeUp}>
            <VStack align="flex-start" spacing={2}>
              <Text color="gray.200" fontSize={{ base: 'sm', md: 'md' }} fontWeight="medium">
                Signal turns service tickets into operational intelligence.
              </Text>
              <Text color="gray.500" fontSize={{ base: 'sm', md: 'md' }}>Prepare technicians before they arrive,</Text>
              <Text color="gray.500" fontSize={{ base: 'sm', md: 'md' }}>capture what happens onsite,</Text>
              <Text color="gray.500" fontSize={{ base: 'sm', md: 'md' }}>and build a growing intelligence network across your organization.</Text>
            </VStack>
          </MotionBox>
          <MotionBox initial="hidden" animate="visible" custom={3} variants={fadeUp}>
            <Stack direction={{ base: 'column', sm: 'row' }} spacing={3}>
              <Button onClick={() => router.push('/signup')} colorScheme="blue" size="md" fontFamily="mono" fontWeight="bold" letterSpacing="wider" px={8}>
                START FREE TRIAL
              </Button>
              <Button as="a" href="https://demo.signal.fieldstone.pro/pm" variant="outline" size="md" borderColor="gray.600" color="gray.300" fontFamily="mono" fontWeight="bold" letterSpacing="wider" px={8} _hover={{ borderColor: BLUE, color: BLUE }}>
                WATCH DEMO
              </Button>
            </Stack>
          </MotionBox>
        </VStack>
        <MotionBox initial="hidden" animate="visible" variants={fadeUp} custom={2} display="flex" justifyContent={{ base: 'center', lg: 'flex-end' }}>
          <BriefMock />
        </MotionBox>
      </Grid>
    </Section>
  );
}

function Problem() {
  const bullets = [
    { icon: '📋', text: 'No site history' },
    { icon: '🔄', text: 'No recurring issue context' },
    { icon: '⚠️', text: 'No operational risk signals' },
    { icon: '🤝', text: 'No shared technician knowledge' },
  ];
  return (
    <Section bg={BG2} py={20}>
      <MotionBox initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
        <VStack spacing={10} align="center" textAlign="center">
          <VStack spacing={3}>
            <Text fontSize="2xs" fontFamily="mono" fontWeight="bold" color={BLUE} letterSpacing="widest">THE PROBLEM</Text>
            <Heading fontSize={{ base: '3xl', md: '4xl' }} color="white" fontWeight="black">
              Technicians Walk In Blind
            </Heading>
            <Text color="gray.400" maxW="520px" fontSize={{ base: 'sm', md: 'md' }}>
              Service tickets rarely contain the real operational context. By the time a technician
              arrives onsite, the critical information is scattered or missing.
            </Text>
          </VStack>
          <Grid templateColumns={{ base: '1fr 1fr', md: 'repeat(4, 1fr)' }} gap={4} w="full" maxW="800px">
            {bullets.map(({ icon, text }) => (
              <Box key={text} bg={BG} border="1px solid" borderColor={BORDER} borderRadius="lg" p={5} textAlign="center">
                <Text fontSize="2xl" mb={2}>{icon}</Text>
                <Text fontSize="xs" color="gray.400" fontFamily="mono">{text}</Text>
              </Box>
            ))}
          </Grid>
          <Box bg={BLUE_DIM} border="1px solid" borderColor="blue.700" borderRadius="lg" px={8} py={4}>
            <Text color={BLUE} fontFamily="mono" fontSize="sm" fontWeight="bold">
              Signal fixes this by extracting intelligence from every ticket.
            </Text>
          </Box>
        </VStack>
      </MotionBox>
    </Section>
  );
}

function WhatSignalDoes() {
  const cols = [
    {
      icon: '📋', title: 'Prepare the Visit',
      lead: 'Signal generates an operational brief before the technician arrives.',
      items: ['Situation', 'Expectation', 'Constraints', 'Risk Signals', 'Client Context'],
    },
    {
      icon: '🤖', title: 'Assist the Work',
      lead: 'Pilot helps technicians solve problems on-site.',
      items: ['Likely causes', '5-minute checklist', 'Questions to ask', 'Closing note draft', 'Internal documentation'],
    },
    {
      icon: '🧠', title: 'Build Operational Memory',
      lead: "Every ticket becomes part of the organization's intelligence network.",
      items: ['Recurring problems', 'Tool instability', 'Site patterns', 'Operational signals'],
    },
  ];
  return (
    <Section py={20}>
      <VStack spacing={12}>
        <MotionBox initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} w="full">
          <VStack spacing={3} textAlign="center">
            <Text fontSize="2xs" fontFamily="mono" fontWeight="bold" color={BLUE} letterSpacing="widest">WHAT SIGNAL DOES</Text>
            <Heading fontSize={{ base: '3xl', md: '4xl' }} color="white" fontWeight="black">
              Signal Extracts Intelligence from Every Ticket
            </Heading>
          </VStack>
        </MotionBox>
        <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={6} w="full">
          {cols.map(({ icon, title, lead, items }, i) => (
            <MotionBox key={title} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i} variants={fadeUp}>
              <Box h="full" bg={BG2} border="1px solid" borderColor={BORDER} borderRadius="xl" p={6}
                _hover={{ borderColor: 'blue.700', boxShadow: '0 0 20px rgba(99,179,237,0.06)' }} transition="all 0.2s">
                <VStack align="flex-start" spacing={4} h="full">
                  <Text fontSize="2xl">{icon}</Text>
                  <VStack align="flex-start" spacing={1}>
                    <Text fontSize="sm" fontWeight="black" color="white" fontFamily="mono">{title}</Text>
                    <Text fontSize="xs" color="gray.400">{lead}</Text>
                  </VStack>
                  <Divider borderColor={BORDER} />
                  <VStack align="flex-start" spacing={1} flex={1}>
                    {items.map(item => (
                      <HStack key={item} spacing={2}>
                        <Box w="4px" h="4px" borderRadius="full" bg={BLUE} flexShrink={0} mt="2px" />
                        <Text fontSize="xs" color="gray.400" fontFamily="mono">{item}</Text>
                      </HStack>
                    ))}
                  </VStack>
                </VStack>
              </Box>
            </MotionBox>
          ))}
        </Grid>
      </VStack>
    </Section>
  );
}

function Platform() {
  const modules = [
    { tag: 'LIVE', tagColor: 'green', name: 'Signal: Tickets', desc: 'Operational intelligence for service tickets. Prep briefs, Pilot AI, and growing intel network.' },
    { tag: 'COMING SOON', tagColor: 'gray', name: 'Signal: Ops', desc: 'Operational command center for service organizations. Scheduling, dispatch, and capacity.' },
    { tag: 'COMING SOON', tagColor: 'gray', name: 'Signal: Sales', desc: 'Turn service signals into sales opportunities. Surface recurring issues that need upgrades.' },
  ];
  return (
    <Section bg={BG2} py={20}>
      <VStack spacing={12}>
        <MotionBox initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} w="full">
          <VStack spacing={3} textAlign="center">
            <Text fontSize="2xs" fontFamily="mono" fontWeight="bold" color={BLUE} letterSpacing="widest">PLATFORM</Text>
            <Heading fontSize={{ base: '3xl', md: '4xl' }} color="white" fontWeight="black">The Signal Platform</Heading>
            <Box fontFamily="mono" fontSize="xs" color="gray.500" bg={BG} border="1px solid" borderColor={BORDER}
              borderRadius="md" px={6} py={4} textAlign="left" display="inline-block">
              <Text color="gray.400">Fieldstone Platform</Text>
              <Text ml={3} color="gray.500">{'\u2514\u2500 '}<Text as="span" color={BLUE}>Signal</Text></Text>
              <Text ml={9} color="gray.500">{'\u251C\u2500 '}<Text as="span" color="green.400">Tickets</Text><Text as="span" color="green.700"> ← live</Text></Text>
              <Text ml={9} color="gray.600">{'\u251C\u2500 Ops '}<Text as="span" color="gray.700">(coming soon)</Text></Text>
              <Text ml={9} color="gray.600">{'\u2514\u2500 Sales '}<Text as="span" color="gray.700">(coming soon)</Text></Text>
            </Box>
          </VStack>
        </MotionBox>
        <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={5} w="full">
          {modules.map(({ tag, tagColor, name, desc }, i) => (
            <MotionBox key={name} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i} variants={fadeUp}>
              <Box h="full" bg={BG} border="1px solid" borderColor={tagColor === 'green' ? 'green.800' : BORDER} borderRadius="xl" p={6}>
                <VStack align="flex-start" spacing={3}>
                  <Badge colorScheme={tagColor} fontFamily="mono" fontSize="2xs" letterSpacing="widest">{tag}</Badge>
                  <Text fontWeight="black" color="white" fontFamily="mono" fontSize="sm">{name}</Text>
                  <Text fontSize="xs" color="gray.500">{desc}</Text>
                </VStack>
              </Box>
            </MotionBox>
          ))}
        </Grid>
      </VStack>
    </Section>
  );
}

function HowItWorks() {
  const steps = [
    'Connect your ticket inbox',
    'Signal ingests ticket emails',
    'AI extracts operational intelligence',
    'Technicians receive a prep brief',
    'Work is captured onsite',
    'Signal builds organizational intelligence',
  ];
  return (
    <Section py={20}>
      <VStack spacing={12}>
        <MotionBox initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} w="full">
          <VStack spacing={3} textAlign="center">
            <Text fontSize="2xs" fontFamily="mono" fontWeight="bold" color={BLUE} letterSpacing="widest">HOW IT WORKS</Text>
            <Heading fontSize={{ base: '3xl', md: '4xl' }} color="white" fontWeight="black">Six Steps to Operational Intelligence</Heading>
          </VStack>
        </MotionBox>
        <Box maxW="480px" w="full">
          <VStack align="stretch" spacing={0}>
            {steps.map((step, i) => (
              <MotionBox key={step} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i * 0.5} variants={fadeUp}>
                <VStack align="stretch" spacing={0}>
                  <Flex align="center" gap={4} py={3}>
                    <Box flexShrink={0} w={8} h={8} borderRadius="full"
                      bg={i === 0 ? 'blue.800' : BG2} border="1px solid"
                      borderColor={i === 0 ? BLUE : BORDER}
                      display="flex" alignItems="center" justifyContent="center">
                      <Text fontSize="2xs" fontWeight="black" fontFamily="mono" color={i === 0 ? BLUE : 'gray.500'}>
                        {String(i + 1).padStart(2, '0')}
                      </Text>
                    </Box>
                    <Text fontSize="sm" color={i === 0 ? 'white' : 'gray.400'} fontWeight={i === 0 ? 'medium' : 'normal'}>{step}</Text>
                  </Flex>
                  {i < steps.length - 1 && <Box ml="15px" w="2px" h="16px" bg={BORDER} />}
                </VStack>
              </MotionBox>
            ))}
          </VStack>
        </Box>
      </VStack>
    </Section>
  );
}

function IntelNetwork() {
  return (
    <Section bg={BG2} py={20}>
      <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={12} alignItems="center">
        <MotionBox initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
          <VStack align="flex-start" spacing={5}>
            <Text fontSize="2xs" fontFamily="mono" fontWeight="bold" color={BLUE} letterSpacing="widest">GLOBAL INTELLIGENCE</Text>
            <Heading fontSize={{ base: '2xl', md: '3xl' }} color="white" fontWeight="black" lineHeight="short">
              A Network That Learns From Every Service Visit
            </Heading>
            <Text color="gray.400" fontSize="sm">
              Signal detects patterns across environments. When multiple organizations see the same
              tool instability or recurring issue, Signal surfaces it as global intelligence —
              injected into every relevant brief automatically.
            </Text>
            <VStack align="flex-start" spacing={2}>
              {[
                'Cross-organization pattern detection',
                'Tool and software instability tracking',
                'Anonymized — no client data shared',
                'Automatically injected into prep briefs',
              ].map(item => (
                <HStack key={item} spacing={2}>
                  <Text color="green.400" fontSize="xs">✓</Text>
                  <Text fontSize="xs" color="gray.400">{item}</Text>
                </HStack>
              ))}
            </VStack>
          </VStack>
        </MotionBox>
        <MotionBox initial="hidden" whileInView="visible" viewport={{ once: true }} custom={1} variants={fadeUp}
          display="flex" justifyContent={{ base: 'flex-start', lg: 'flex-end' }}>
          <Box bg={BLUE_DIM} border="1px solid" borderColor="blue.700" borderRadius="xl" p={6} maxW="360px" w="full" fontFamily="mono">
            <HStack mb={3} spacing={2}>
              <Text fontSize="2xs" fontWeight="bold" color={BLUE} letterSpacing="widest">GLOBAL INTEL</Text>
              <Badge colorScheme="blue" fontSize="2xs">3 ORGS AFFECTED</Badge>
            </HStack>
            <Text color="blue.200" fontSize="sm" fontWeight="medium" mb={3}>
              Eaglesoft instability detected across multiple organizations after network switch reboot.
            </Text>
            <Divider borderColor="blue.800" mb={3} />
            <Text fontSize="2xs" color="blue.400" fontWeight="bold" letterSpacing="widest" mb={2}>RECOMMENDED FIX</Text>
            <VStack align="flex-start" spacing={1}>
              <Text fontSize="xs" color="blue.300">{'\u2192'} Restart Eaglesoft service</Text>
              <Text fontSize="xs" color="blue.300">{'\u2192'} Verify database path</Text>
              <Text fontSize="xs" color="blue.300">{'\u2192'} Check Windows Event Log</Text>
            </VStack>
          </Box>
        </MotionBox>
      </Grid>
    </Section>
  );
}

function WhoItsFor() {
  const audiences = [
    { icon: '🏢', title: 'Managed Service Providers', desc: 'Give every technician the context they need before they arrive. Build an intelligence layer across your entire client base.' },
    { icon: '🖥️', title: 'Internal IT Service Teams', desc: 'Stop losing institutional knowledge when techs move on. Signal captures and organizes everything your team learns.' },
    { icon: '🔧', title: 'Field Technicians', desc: 'Walk into every site prepared. Signal tells you what to expect, what went wrong before, and what to watch for.' },
  ];
  return (
    <Section py={20}>
      <VStack spacing={12}>
        <MotionBox initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} w="full">
          <VStack spacing={3} textAlign="center">
            <Text fontSize="2xs" fontFamily="mono" fontWeight="bold" color={BLUE} letterSpacing="widest">WHO IT&#39;S FOR</Text>
            <Heading fontSize={{ base: '3xl', md: '4xl' }} color="white" fontWeight="black">Built for Service Organizations</Heading>
          </VStack>
        </MotionBox>
        <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={6} w="full">
          {audiences.map(({ icon, title, desc }, i) => (
            <MotionBox key={title} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i} variants={fadeUp}>
              <Box h="full" bg={BG2} border="1px solid" borderColor={BORDER} borderRadius="xl" p={6} textAlign="center">
                <VStack spacing={4}>
                  <Text fontSize="3xl">{icon}</Text>
                  <Text fontWeight="black" color="white" fontSize="sm">{title}</Text>
                  <Text fontSize="xs" color="gray.500">{desc}</Text>
                </VStack>
              </Box>
            </MotionBox>
          ))}
        </Grid>
      </VStack>
    </Section>
  );
}

function Pricing() {
  const router = useRouter();
  const features = [
    'Signal: Tickets',
    'Intel Network',
    'Pilot AI Assistant',
    'Mobile Workspace',
    '14-day free trial',
    'No credit card required',
  ];
  return (
    <Section bg={BG2} py={20}>
      <VStack spacing={10}>
        <MotionBox initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} w="full">
          <VStack spacing={3} textAlign="center">
            <Text fontSize="2xs" fontFamily="mono" fontWeight="bold" color={BLUE} letterSpacing="widest">PRICING</Text>
            <Heading fontSize={{ base: '3xl', md: '4xl' }} color="white" fontWeight="black">Simple, Transparent Pricing</Heading>
          </VStack>
        </MotionBox>
        <MotionBox initial="hidden" whileInView="visible" viewport={{ once: true }} custom={1} variants={fadeUp}>
          <Box bg={BG} border="1px solid" borderColor="blue.700" borderRadius="2xl" p={10}
            maxW="400px" w="full" textAlign="center" boxShadow="0 0 40px rgba(99,179,237,0.08)">
            <VStack spacing={5}>
              <Badge colorScheme="blue" fontFamily="mono" fontSize="xs" letterSpacing="widest" px={3} py={1}>STARTER</Badge>
              <VStack spacing={0}>
                <HStack align="flex-end" spacing={1}>
                  <Text fontSize="5xl" fontWeight="black" color="white" lineHeight={1}>$49</Text>
                  <Text fontSize="sm" color="gray.400" mb={2}>/technician/month</Text>
                </HStack>
                <Text fontSize="xs" color="gray.600" fontFamily="mono">billed monthly</Text>
              </VStack>
              <Divider borderColor={BORDER} />
              <VStack align="flex-start" spacing={2} w="full">
                {features.map(f => (
                  <HStack key={f} spacing={3}>
                    <Text color="green.400" fontSize="sm">✓</Text>
                    <Text fontSize="sm" color="gray.300">{f}</Text>
                  </HStack>
                ))}
              </VStack>
              <Button onClick={() => router.push('/signup')} colorScheme="blue" w="full" size="md"
                fontFamily="mono" fontWeight="bold" letterSpacing="wider" mt={2}>
                START FREE TRIAL
              </Button>
            </VStack>
          </Box>
        </MotionBox>
      </VStack>
    </Section>
  );
}

function FinalCTA() {
  const router = useRouter();
  return (
    <Section py={24}>
      <MotionBox initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
        <VStack spacing={8} textAlign="center">
          <VStack spacing={4}>
            <Heading fontSize={{ base: '2xl', md: '3xl', lg: '4xl' }} color="white" fontWeight="black" lineHeight="short" maxW="600px">
              Your Service Organization Already Has Signals.
            </Heading>
            <Heading fontSize={{ base: '2xl', md: '3xl', lg: '4xl' }} color={BLUE} fontWeight="black" lineHeight="short">
              Signal Helps You See Them.
            </Heading>
          </VStack>
          <Stack direction={{ base: 'column', sm: 'row' }} spacing={4} justify="center">
            <Button onClick={() => router.push('/signup')} colorScheme="blue" size="lg"
              fontFamily="mono" fontWeight="bold" letterSpacing="wider" px={10}>
              START FREE TRIAL
            </Button>
            <Button as="a" href="mailto:demo@fieldstone.pro" variant="outline" size="lg"
              borderColor="gray.600" color="gray.300" fontFamily="mono" fontWeight="bold"
              letterSpacing="wider" px={10} _hover={{ borderColor: BLUE, color: BLUE }}>
              REQUEST DEMO
            </Button>
          </Stack>
          <Text fontSize="xs" color="gray.600" fontFamily="mono">
            14-day free trial · No credit card required · Setup in minutes
          </Text>
        </VStack>
      </MotionBox>
    </Section>
  );
}

function Footer() {
  return (
    <Box bg={BG2} borderTop="1px solid" borderColor={BORDER} py={8}>
      <Container maxW="6xl" px={{ base: 5, md: 10 }}>
        <Flex direction={{ base: 'column', md: 'row' }} justify="space-between"
          align={{ base: 'flex-start', md: 'center' }} gap={4}>
          <VStack align="flex-start" spacing={1}>
            <Text fontSize="xs" fontWeight="black" fontFamily="mono" letterSpacing="widest" color={BLUE}>SIGNAL</Text>
            <Text fontSize="2xs" color="gray.600" fontFamily="mono">by Fieldstone</Text>
          </VStack>
          <HStack spacing={6} flexWrap="wrap">
            {[
              { label: 'Dashboard', href: '/pm' },
              { label: 'Demo', href: 'https://demo.signal.fieldstone.pro/pm' },
              { label: 'Sign Up', href: '/signup' },
              { label: 'Contact', href: 'mailto:hello@fieldstone.pro' },
            ].map(({ label, href }) => (
              <Text key={label} as="a" href={href} fontSize="xs" color="gray.500"
                fontFamily="mono" _hover={{ color: 'gray.300' }} transition="color 0.15s">
                {label}
              </Text>
            ))}
          </HStack>
          <Text fontSize="2xs" color="gray.700" fontFamily="mono">© 2026 Fieldstone · Signal</Text>
        </Flex>
      </Container>
    </Box>
  );
}

export default function Acquisition() {
  return (
    <Box bg={BG} minH="100vh">
      <Nav />
      <Hero />
      <Problem />
      <WhatSignalDoes />
      <Platform />
      <HowItWorks />
      <IntelNetwork />
      <WhoItsFor />
      <Pricing />
      <FinalCTA />
      <Footer />
    </Box>
  );
}
