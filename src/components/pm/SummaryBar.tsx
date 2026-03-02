'use client';
import { Flex, HStack, VStack, Text, Spinner } from '@chakra-ui/react';
import { Summary } from './types';
import Link from 'next/link';


export function SummaryBar({ summary, loading }: { summary: Summary | null; loading: boolean }) {
  if (loading) return (
    <Flex px={4} py={2} bg="gray.900" borderBottom="1px solid" borderColor="gray.700"
      align="center" justify="center" h="48px">
      <Spinner size="sm" color="blue.400" />
    </Flex>
  );
  if (!summary) return null;
  return (
    <Flex px={4} py={2} bg="gray.900" borderBottom="1px solid" borderColor="gray.700"
      align="center" justify="space-between" flexWrap="wrap" gap={2} flexShrink={0}>
      <HStack spacing={3}>
        <Text fontSize="sm" fontWeight="black" color="white" fontFamily="mono" letterSpacing="wider">IPQUEST PM</Text>
        <Text fontSize="xs" color="gray.600" fontFamily="mono">
          {typeof window !== 'undefined' ? new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : ''}
        </Text>
        <Link href="/pm/setup"><Text fontSize="xs" color="gray.500" fontFamily="mono" _hover={{ color: 'blue.400' }} cursor="pointer">Setup</Text></Link>
        <Link href="/pm/intel"><Text fontSize="xs" fontWeight="medium" color="purple.400" opacity={0.8} _hover={{ opacity: 1 }} cursor="pointer" ml={2}>Intel</Text></Link>
        <Link href="/pm/docs"><Text fontSize="xs" fontWeight="medium" color="cyan.400" opacity={0.8} _hover={{ opacity: 1 }} cursor="pointer" ml={2}>Docs</Text></Link>
        <Link href="/pm/admin"><Text fontSize="xs" fontWeight="medium" color="teal.400" opacity={0.8} _hover={{ opacity: 1 }} cursor="pointer" ml={2}>Admin</Text></Link>
      </HStack>
      <HStack spacing={4} flexWrap="wrap">
        <VStack spacing={0}><Text fontSize="lg" fontWeight="black" color="white" lineHeight={1}>{summary.total_open}</Text><Text fontSize="2xs" color="gray.500" fontFamily="mono">OPEN</Text></VStack>
        <VStack spacing={0}><Text fontSize="lg" fontWeight="black" color="blue.300" lineHeight={1}>{summary.today_count}</Text><Text fontSize="2xs" color="gray.500" fontFamily="mono">TODAY</Text></VStack>
        <VStack spacing={0}>
          <Text fontSize="lg" fontWeight="black" color={summary.declining_trust_count > 0 ? 'red.400' : 'green.400'} lineHeight={1}>{summary.declining_trust_count}</Text>
          <Text fontSize="2xs" color="gray.500" fontFamily="mono">DECLINING</Text>
        </VStack>
        <VStack spacing={0}>
          <HStack spacing={1}>
            <Text fontSize="xs" color="green.400" fontWeight="bold">{summary.readiness.high}</Text>
            <Text fontSize="xs" color="gray.600">/</Text>
            <Text fontSize="xs" color="yellow.400" fontWeight="bold">{summary.readiness.medium}</Text>
            <Text fontSize="xs" color="gray.600">/</Text>
            <Text fontSize="xs" color="red.400" fontWeight="bold">{summary.readiness.low}</Text>
          </HStack>
          <Text fontSize="2xs" color="gray.500" fontFamily="mono">HI/MED/LO</Text>
        </VStack>
      </HStack>
    </Flex>
  );
}
