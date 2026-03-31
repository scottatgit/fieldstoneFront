"use client";
import React from 'react';
import {
  Box, Button, Container, Flex, Heading, Stack, Text, VStack, HStack, Divider,
} from '@chakra-ui/react';
import { ChakraProvider } from '@chakra-ui/react';
import theme from '../theme';

const BG     = '#0d1117';
const BLUE   = '#63B3ED';
const BORDER = '#1f2937';

export default function FieldstonePage() {
  return (
    <ChakraProvider theme={theme}>
      <Box minH="100vh" bg={BG} color="white">
        {/* Nav */}
        <Box borderBottom="1px solid" borderColor={BORDER} py={4}>
          <Container maxW="5xl">
            <Flex justify="space-between" align="center">
              <HStack spacing={2}>
                <Box w={2} h={2} bg={BLUE} borderRadius="full" />
                <Text fontWeight="700" fontSize="lg" letterSpacing="0.1em" color="white">
                  SIGNAL
                </Text>
              </HStack>
              <Button
                  size="sm"
                  bg={BLUE}
                  color="#0d1117"
                  fontWeight="700"
                  _hover={{ opacity: 0.85 }}
                  as='a' href='https://signal.fieldstone.pro/login'
                >
                  Sign In
                </Button>
            </Flex>
          </Container>
        </Box>

        {/* Hero */}
        <Container maxW="5xl" py={{ base: 20, md: 32 }}>
          <VStack spacing={8} textAlign="center">
            <Box>
              <Text
                fontSize="xs"
                fontWeight="700"
                letterSpacing="0.2em"
                color={BLUE}
                mb={4}
                textTransform="uppercase"
              >
                Work Intelligence
              </Text>
              <Heading
                fontSize={{ base: "3xl", md: "5xl" }}
                fontWeight="800"
                lineHeight="1.15"
                mb={6}
              >
                Signal
              </Heading>
              <Text
                fontSize={{ base: "md", md: "lg" }}
                color="gray.400"
                maxW="xl"
                mx="auto"
              >
                Work intelligence for ticket-driven and request-driven operations.
                Capture, understand, advise, and learn — across any team that runs on work queues.
              </Text>
            </Box>

            {/* Primary CTAs */}
            <Stack
              direction={{ base: "column", sm: "row" }}
              spacing={4}
              pt={4}
            >
              <Button
                as="a"
                href="https://signal.fieldstone.pro/signup"
                size="lg"
                bg={BLUE}
                color="#0d1117"
                fontWeight="700"
                px={8}
                _hover={{ opacity: 0.85 }}
              >
                Get Started
              </Button>
              <Button
                as="a"
                href="https://demo.signal.fieldstone.pro/pm"
                size="lg"
                variant="outline"
                borderColor={BORDER}
                color="gray.300"
                fontWeight="600"
                px={8}
                _hover={{ borderColor: BLUE, color: BLUE }}
              >
                View Demo
              </Button>
            </Stack>

            {/* Secondary links */}
            <HStack spacing={6} pt={2} divider={<Divider orientation="vertical" h="16px" borderColor={BORDER} />}>
              <Button
                as="a"
                href="https://admin.signal.fieldstone.pro"
                variant="ghost"
                size="sm"
                color="gray.500"
                _hover={{ color: BLUE }}
              >
                Admin Console
              </Button>
              <Button
                  variant="ghost"
                  size="sm"
                  color="gray.500"
                  _hover={{ color: BLUE }}
                  as='a' href='https://signal.fieldstone.pro/signup'
                >
                  Create Account
                </Button>
            </HStack>
          </VStack>
        </Container>

        {/* Product cards */}
        <Container maxW="5xl" pb={24}>
          <Divider borderColor={BORDER} mb={16} />
          <Stack
            direction={{ base: "column", md: "row" }}
            spacing={6}
          >
            {[
              {
                title: "Signal",
                desc: "Operational intelligence for teams that run on tickets, requests, and service queues. Surface patterns, draft outcomes, and act with context.",
                href: "https://signal.fieldstone.pro/login",
                label: "Sign In →",
              },
              {
                title: "Admin Console",
                desc: "Cross-tenant operational dashboards. Monitor ingestion pipelines, outbreak alerts, and platform health.",
                href: "https://admin.signal.fieldstone.pro",
                label: "Open Console",
              },
              {
                title: "Demo Environment",
                desc: "Explore Signal with realistic data. No account required. Full feature access.",
                href: "https://demo.signal.fieldstone.pro/pm",
                label: "Launch Demo",
              },
            ].map((card) => (
              <Box
                key={card.title}
                flex={1}
                p={6}
                bg="#111827"
                border="1px solid"
                borderColor={BORDER}
                borderRadius="lg"
              >
                <Text fontWeight="700" fontSize="md" mb={2} color="white">
                  {card.title}
                </Text>
                <Text fontSize="sm" color="gray.400" mb={5} lineHeight="1.7">
                  {card.desc}
                </Text>
                <Button
                  as="a"
                  href={card.href}
                  size="sm"
                  variant="outline"
                  borderColor={BORDER}
                  color={BLUE}
                  _hover={{ bg: BLUE, color: "#0d1117" }}
                >
                  {card.label} →
                </Button>
              </Box>
            ))}
          </Stack>
        </Container>

        {/* Footer */}
        <Box borderTop="1px solid" borderColor={BORDER} py={8}>
          <Container maxW="5xl">
            <Flex justify="space-between" align="center" flexDir={{ base: "column", sm: "row" }} gap={4}>
              <Text fontSize="sm" color="gray.600">
                © 2026 Fieldstone AI. All rights reserved.
              </Text>
              <HStack spacing={6}>
                <Text as="a" href="https://signal.fieldstone.pro" fontSize="sm" color="gray.500" _hover={{ color: BLUE }} cursor="pointer">
                  Signal
                </Text>
                <Text fontSize="sm" color="gray.500" _hover={{ color: BLUE }} cursor="pointer" as='a' href='https://signal.fieldstone.pro/login'>
                    Sign In
                  </Text>
                <Text fontSize="sm" color="gray.500" _hover={{ color: BLUE }} cursor="pointer" as='a' href='https://signal.fieldstone.pro/signup'>
                    Sign Up
                  </Text>
              </HStack>
            </Flex>
          </Container>
        </Box>
      </Box>
    </ChakraProvider>
  );
}
