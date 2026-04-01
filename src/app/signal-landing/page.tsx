import React from 'react';
import {
  Box, Button, Container, Flex, Heading, Stack, Text, VStack, HStack, Divider,
} from '@chakra-ui/react';
import { ChakraProvider } from '@chakra-ui/react';
import theme from '../../theme';

const BG     = '#0d1117';
const BLUE   = '#63B3ED';
const BORDER = '#1f2937';

export const metadata = {
  title: 'Signal — Work Intelligence Platform',
  description: 'Signal reads your tickets, extracts structured intelligence, and surfaces outbreak patterns across your clients — automatically. Built for MSPs, software teams, and field ops.',
  openGraph: {
    type: 'website',
    url: 'https://signal.fieldstone.pro',
    title: 'Signal — Work Intelligence Platform',
    description: 'Know what is breaking before it escalates. Connect your inbox. Signal does the rest.',
    siteName: 'Signal',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Signal — Work Intelligence Platform',
    description: 'Know what is breaking before it escalates. Connect your inbox. Signal does the rest.',
  },
  alternates: {
    canonical: 'https://signal.fieldstone.pro',
  },
  robots: { index: true, follow: true },
};

export default function SignalLandingPage() {
  return (
    <ChakraProvider theme={theme}>
      <Box minH="100vh" bg={BG} color="white">

        {/* ── Nav ── */}
        <Box borderBottom="1px solid" borderColor={BORDER} py={4} position="sticky" top={0} zIndex={10} bg={BG}>
          <Container maxW="5xl">
            <Flex justify="space-between" align="center">
              <HStack spacing={2}>
                <Box w={2} h={2} bg={BLUE} borderRadius="full" />
                <Text fontWeight="700" fontSize="lg" letterSpacing="0.1em" color="white">SIGNAL</Text>
              </HStack>
              <HStack spacing={3}>
                <Button as="a" href="/login" size="sm" variant="ghost" color="gray.400" fontWeight="600" _hover={{ color: BLUE }}>
                  Sign In
                </Button>
                <Button as="a" href="/signup" size="sm" bg={BLUE} color="#0d1117" fontWeight="700" _hover={{ opacity: 0.85 }}>
                  Get Started
                </Button>
              </HStack>
            </Flex>
          </Container>
        </Box>

        {/* ── Hero ── */}
        <Container maxW="5xl" pt={{ base: 16, md: 24 }} pb={{ base: 10, md: 16 }}>
          <VStack spacing={6} textAlign="center">
            <Text fontSize="xs" fontWeight="700" letterSpacing="0.25em" color={BLUE} textTransform="uppercase">
              Work Intelligence Platform
            </Text>
            <Heading fontSize={{ base: '3xl', md: '5xl', lg: '6xl' }} fontWeight="800" lineHeight="1.1">
              Know what&#39;s breaking<br />
              <Box as="span" color={BLUE}>before it escalates.</Box>
            </Heading>
            <Text fontSize={{ base: 'md', md: 'lg' }} color="gray.400" maxW="2xl" mx="auto" lineHeight="1.7">
              Signal reads your tickets, extracts structured intelligence, and surfaces outbreak patterns across your clients — automatically.
            </Text>
            <Stack direction={{ base: 'column', sm: 'row' }} spacing={4} pt={2}>
              <Button as="a" href="/signup" size="lg" bg={BLUE} color="#0d1117" fontWeight="700" px={8} _hover={{ opacity: 0.85 }}>
                Get Started Free
              </Button>
              <Button as="a" href="https://demo.signal.fieldstone.pro/pm" size="lg" variant="outline" borderColor={BORDER} color="gray.300" fontWeight="600" px={8} _hover={{ borderColor: BLUE, color: BLUE }}>
                View Live Demo
              </Button>
            </Stack>
          </VStack>
        </Container>

        {/* ── Features ── */}
        <Container maxW="5xl" pb={{ base: 12, md: 20 }}>
          <VStack spacing={3} mb={12} textAlign="center">
            <Text fontSize="xs" fontWeight="700" letterSpacing="0.2em" color={BLUE} textTransform="uppercase">What Signal does</Text>
            <Heading fontSize={{ base: '2xl', md: '3xl' }} fontWeight="800">Everything your dispatch board should tell you</Heading>
          </VStack>
          <Stack direction={{ base: 'column', md: 'row' }} spacing={6} mb={6}>
            {[
              {
                label: 'TODAY',
                title: 'Dispatch Intelligence',
                desc: 'Filter your full ticket queue by today, tomorrow, or unscheduled. Assign visits, see priorities, and move fast — without digging through email.',
              },
              {
                label: 'INTEL',
                title: 'Outbreak Detection',
                desc: 'Signal monitors your ticket stream and flags recurring issues across clients. Know which tools are failing and which clients are at risk — in real time.',
              },
              {
                label: 'BRIEF',
                title: 'Pre-Visit Briefing',
                desc: 'Before every site visit, Signal generates a structured AI brief: recent history, known issues, and what to watch for. Know the site before you walk in.',
              },
            ].map((f) => (
              <Box key={f.title} flex={1} p={6} bg="#111827" border="1px solid" borderColor={BORDER} borderRadius="lg">
                <Text fontSize="2xs" fontWeight="700" letterSpacing="0.15em" color={BLUE} textTransform="uppercase" mb={3}>{f.label}</Text>
                <Text fontWeight="700" fontSize="lg" mb={3} color="white">{f.title}</Text>
                <Text fontSize="sm" color="gray.400" lineHeight="1.8">{f.desc}</Text>
              </Box>
            ))}
          </Stack>
          <Stack direction={{ base: 'column', md: 'row' }} spacing={6}>
            {[
              {
                label: 'AI',
                title: 'Signal AI Console',
                desc: 'Automated action proposals generated from your ticket data. Signal reads patterns, identifies friction, and surfaces what needs attention — without you having to ask.',
              },
              {
                label: 'EXTRACT',
                title: 'Entity & Friction Intelligence',
                desc: 'Every ticket is parsed for tools, categories, and friction patterns. Signal builds a structured knowledge layer on top of your raw support data.',
              },
              {
                label: 'TEAM',
                title: 'Multi-Tenant & Team Ready',
                desc: 'One workspace per client. Role-based access. Works for MSPs, software teams, and field ops. Bring your own email — Microsoft 365 and Gmail both supported.',
              },
            ].map((f) => (
              <Box key={f.title} flex={1} p={6} bg="#111827" border="1px solid" borderColor={BORDER} borderRadius="lg">
                <Text fontSize="2xs" fontWeight="700" letterSpacing="0.15em" color={BLUE} textTransform="uppercase" mb={3}>{f.label}</Text>
                <Text fontWeight="700" fontSize="lg" mb={3} color="white">{f.title}</Text>
                <Text fontSize="sm" color="gray.400" lineHeight="1.8">{f.desc}</Text>
              </Box>
            ))}
          </Stack>
        </Container>

        {/* ── Stats strip ── */}
        <Box borderTop="1px solid" borderBottom="1px solid" borderColor={BORDER} py={10} mb={{ base: 12, md: 20 }}>
          <Container maxW="5xl">
            <Stack direction={{ base: 'column', md: 'row' }} spacing={10} justify="center" align="center" textAlign="center">
              {[
                { stat: '96%', label: 'ticket classification rate' },
                { stat: 'Real-time', label: 'outbreak detection' },
                { stat: 'M365 + Gmail', label: 'email ingestion' },
                { stat: 'Any team', label: 'MSP, software, field ops' },
              ].map((s) => (
                <VStack key={s.stat} spacing={1}>
                  <Text fontSize="2xl" fontWeight="800" color={BLUE}>{s.stat}</Text>
                  <Text fontSize="sm" color="gray.500">{s.label}</Text>
                </VStack>
              ))}
            </Stack>
          </Container>
        </Box>

        {/* ── Bottom CTA ── */}
        <Container maxW="5xl" pb={{ base: 20, md: 32 }} textAlign="center">
          <VStack spacing={6}>
            <Heading fontSize={{ base: '2xl', md: '3xl' }} fontWeight="800">
              Ready to see what your tickets are telling you?
            </Heading>
            <Text fontSize="md" color="gray.400" maxW="lg">
              Connect your inbox. Signal does the rest.
            </Text>
            <Stack direction={{ base: 'column', sm: 'row' }} spacing={4}>
              <Button as="a" href="/signup" size="lg" bg={BLUE} color="#0d1117" fontWeight="700" px={10} _hover={{ opacity: 0.85 }}>
                Start Free
              </Button>
              <Button as="a" href="https://demo.signal.fieldstone.pro/pm" size="lg" variant="outline" borderColor={BORDER} color="gray.300" fontWeight="600" px={10} _hover={{ borderColor: BLUE, color: BLUE }}>
                Explore Demo
              </Button>
            </Stack>
          </VStack>
        </Container>

        {/* ── Footer ── */}
        <Box borderTop="1px solid" borderColor={BORDER} py={8}>
          <Container maxW="5xl">
            <Flex justify="space-between" align="center" flexDir={{ base: 'column', sm: 'row' }} gap={4}>
              <Text fontSize="sm" color="gray.600">© 2026 Fieldstone AI. All rights reserved.</Text>
              <HStack spacing={6}>
                <Text as="a" href="/login" fontSize="sm" color="gray.500" _hover={{ color: BLUE }} cursor="pointer">Sign In</Text>
                <Text as="a" href="/signup" fontSize="sm" color="gray.500" _hover={{ color: BLUE }} cursor="pointer">Sign Up</Text>
                <Text as="a" href="https://demo.signal.fieldstone.pro/pm" fontSize="sm" color="gray.500" _hover={{ color: BLUE }} cursor="pointer">Demo</Text>
                <Text as="a" href="https://www.fieldstone.pro" fontSize="sm" color="gray.500" _hover={{ color: BLUE }} cursor="pointer">Fieldstone</Text>
              </HStack>
            </Flex>
          </Container>
        </Box>

      </Box>
    </ChakraProvider>
  );
}
