'use client';
import { Flex, HStack, VStack, Text, Spinner } from '@chakra-ui/react';
import { Summary } from './types';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import { isDemoMode } from '../../lib/demoApi';

const NAV_TABS = [
  { label: 'TODAY',  href: '/pm'        },
  { label: 'INTEL',  href: '/pm/intel'  },
  { label: 'SETUP',  href: '/pm/setup'  },
  { label: 'DOCS',   href: '/pm/docs'   },
  { label: 'ADMIN',  href: '/pm/admin'  },
];

export function SummaryBar({ summary, loading }: { summary: Summary | null; loading: boolean }) {
  const pathname = usePathname();
  const demo = isDemoMode();

  const navBar = (
    <Flex
      px={3} py={0} bg="gray.900" borderBottom="1px solid" borderColor="gray.700"
      align="stretch" overflowX="auto" flexShrink={0}
      css={{ '&::-webkit-scrollbar': { display: 'none' } }}
      justify="space-between"
    >
      <HStack spacing={0} align="stretch">
        {NAV_TABS.map(tab => {
          const isActive =
            tab.href === '/pm'
              ? pathname === '/pm'
              : pathname.startsWith(tab.href);
          return (
            <Link key={tab.href} href={tab.href} style={{ textDecoration: 'none' }}>
              <Flex
                align="center" justify="center"
                px={4} minH="44px" minW="60px"
                borderBottom="2px solid"
                borderColor={isActive ? 'blue.400' : 'transparent'}
                color={isActive ? 'white' : 'gray.500'}
                _hover={{ color: 'gray.200', borderColor: isActive ? 'blue.400' : 'gray.600' }}
                transition="all 0.15s"
                cursor="pointer"
              >
                <Text fontSize="xs" fontWeight={isActive ? 'black' : 'medium'} fontFamily="mono" letterSpacing="wider">
                  {tab.label}
                </Text>
              </Flex>
            </Link>
          );
        })}
      </HStack>
      {!demo && (
        <Flex align="center" px={3}>
          <UserButton
            afterSignOutUrl="/login"
            appearance={{
              elements: {
                avatarBox: { width: 28, height: 28 },
              },
            }}
          />
        </Flex>
      )}
    </Flex>
  );

  if (loading) return (
    <>
      {navBar}
      <Flex px={4} py={2} bg="gray.900" borderBottom="1px solid" borderColor="gray.700"
        align="center" justify="center" h="40px">
        <Spinner size="sm" color="blue.400" />
      </Flex>
    </>
  );

  if (!summary) return navBar;

  return (
    <>
      {navBar}
      <Flex
        px={4} py={2} bg="gray.900" borderBottom="1px solid" borderColor="gray.700"
        align="center" justify="space-between" flexWrap="wrap" gap={2} flexShrink={0}
      >
        <HStack spacing={1}>
          <Text fontSize="xs" fontWeight="black" color="gray.600" fontFamily="mono" letterSpacing="wider">IPQUEST PM</Text>
          <Text fontSize="xs" color="gray.700" fontFamily="mono">·</Text>
          <Text fontSize="xs" color="gray.600" fontFamily="mono">
            {typeof window !== 'undefined' ? new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : ''}
          </Text>
        </HStack>
        <HStack spacing={4} flexWrap="wrap">
          <VStack spacing={0}>
            <Text fontSize="md" fontWeight="black" color="white" lineHeight={1}>{summary.total_open}</Text>
            <Text fontSize="2xs" color="gray.500" fontFamily="mono">OPEN</Text>
          </VStack>
          <VStack spacing={0}>
            <Text fontSize="md" fontWeight="black" color="blue.300" lineHeight={1}>{summary.today_count}</Text>
            <Text fontSize="2xs" color="gray.500" fontFamily="mono">TODAY</Text>
          </VStack>
          <VStack spacing={0}>
            <Text fontSize="md" fontWeight="black" color={summary.declining_trust_count > 0 ? 'red.400' : 'green.400'} lineHeight={1}>
              {summary.declining_trust_count}
            </Text>
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
    </>
  );
}
