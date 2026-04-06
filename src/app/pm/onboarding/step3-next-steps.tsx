'use client';
import { useRouter } from 'next/navigation';
import { Box, VStack, HStack, Text, Badge, Button, Flex } from '@chakra-ui/react';

export function Step3NextSteps() {
  const router = useRouter();

  const steps = [
    { n: '1', label: 'Connect your support inbox', desc: 'Add IMAP credentials in Setup', href: '/pm/setup' },
    { n: '2', label: 'Run your first ingestion',   desc: 'Pull emails and build your ticket queue', href: null },
    { n: '3', label: 'Open your first brief',      desc: 'Signal generates a prep brief for every ticket — risk flags, context, and next actions.', href: '/pm/brief' },
  ];

  return (
    <VStack align="stretch" spacing={6}>
      <VStack align="start" spacing={1}>
        <HStack spacing={2}>
          <Text fontSize="lg" fontWeight="black" fontFamily="mono" color="blue.300" letterSpacing="widest">SIGNAL</Text>
          <Badge colorScheme="green" fontSize="2xs" fontFamily="mono">YOU'RE IN</Badge>
          <Badge colorScheme="purple" variant="subtle" fontSize="2xs" fontFamily="mono">INTELLIGENCE MODE</Badge>
        </HStack>
        <Text fontSize="sm" fontWeight="bold" color="gray.100">Workspace ready</Text>
        <Text fontSize="xs" color="gray.400">
          Your workspace is running in Intelligence Mode — briefs, risk signals, and trend detection.
          Operations controls (ticket creation, dispatch, close workflows) unlock separately.
        </Text>
      </VStack>

      <VStack align="stretch" spacing={3}>
        {steps.map(({ n, label, desc, href }) => (
          <Flex key={n} align="flex-start" gap={3}
            p={3} borderRadius="md" bg="gray.800" border="1px solid" borderColor="gray.700">
            <Box
              flexShrink={0} w={6} h={6} borderRadius="full"
              bg="blue.900" border="1px solid" borderColor="blue.600"
              display="flex" alignItems="center" justifyContent="center">
              <Text fontSize="2xs" fontWeight="black" fontFamily="mono" color="blue.300">{n}</Text>
            </Box>
            <VStack align="start" spacing={0} flex={1}>
              <Text fontSize="xs" fontWeight="bold" color="gray.200">{label}</Text>
              <Text fontSize="2xs" color="gray.500">{desc}</Text>
              {href && (
                <Box as="a" href={href} mt={1} fontSize="2xs" fontFamily="mono" color="blue.400" _hover={{ color: 'blue.300' }}>
                  Open →
                </Box>
              )}
            </VStack>
          </Flex>
        ))}
      </VStack>

      <Text fontSize="2xs" color="gray.600" textAlign="center">
        You can also invite your team from the{' '}
        <Box as="a" href="/pm/team" color="gray.500" _hover={{ color: 'gray.400' }} display="inline">Team page</Box>.
      </Text>

      <Button colorScheme="blue" w="full" fontFamily="mono" fontWeight="bold" onClick={() => router.push('/pm')}>
        Go to Dashboard
      </Button>
      <Button size="sm" variant="ghost" colorScheme="gray" w="full" onClick={() => router.push('/pm')}>
        Skip for now
      </Button>
    </VStack>
  );
}
