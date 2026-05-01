'use client';
import { Flex, HStack, VStack, Text, Spinner, Tooltip, Box } from '@chakra-ui/react';
import { Summary } from './types';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { isDemoMode } from '../../lib/demoApi';
import { useUser } from '@/lib/useUser';
import { SignalUserButton } from '@/components/SignalUserButton';
import { WorkspaceSwitcher } from './WorkspaceSwitcher';

// Tenant workspace navigation — platform admin tabs live at signal.fieldstone.pro
const BASE_TABS = [
  { label: 'TODAY', href: '/pm'          },
  { label: 'INTEL', href: '/pm/intel'    },
  { label: 'TEAM',  href: '/pm/team'     },
  { label: 'SIGNAL', href: '/pm/setup'   },
];

const COMING_SOON_MODULES = [
  { label: 'OPS',   tag: 'Coming Soon' },
  { label: 'SALES', tag: 'Coming Soon' },
];

export function SummaryBar({ summary, loading }: { summary: Summary | null; loading: boolean }) {
  const pathname = usePathname();
  const demo     = isDemoMode();
  const { user } = useUser();
  const isAdmin  = (user?.role) === 'admin';

  return (
    <Flex
      px={0} py={0} bg="gray.900" borderBottom="1px solid" borderColor="gray.700"
      align="stretch" flexShrink={0} justify="space-between" position="relative"
    >
      {/* Signal Wordmark */}
      <Flex
        align="center" px={4} borderRight="1px solid" borderColor="gray.700"
        flexShrink={0} bg="gray.900"
        position={{ base: 'sticky', md: 'relative' }}
        left={0} zIndex={10} minH="44px"
      >
        <Text fontSize="xs" fontWeight="black" fontFamily="mono"
          letterSpacing="widest" color="blue.400" userSelect="none">
          SIGNAL
        </Text>
      </Flex>

      {/* Workspace Switcher */}
      <WorkspaceSwitcher />

      {/* Nav tabs */}
      <Flex flex={1} overflowX="auto" align="stretch"
        css={{ '&::-webkit-scrollbar': { display: 'none' } }}>
        <HStack spacing={0} align="stretch" flex={1}>

          {BASE_TABS.map(tab => {
            const isActive = tab.href === '/pm'
              ? pathname === '/pm'
              : pathname.startsWith(tab.href);
            return (
              <Link key={tab.href} href={tab.href} style={{ textDecoration: 'none' }}>
                <Flex align="center" justify="center"
                  px={4} minH="44px" minW="60px"
                  borderBottom="2px solid"
                  borderColor={isActive ? 'blue.400' : 'transparent'}
                  color={isActive ? 'white' : 'gray.500'}
                  _hover={{ color: 'gray.200', borderColor: isActive ? 'blue.400' : 'gray.600' }}
                  transition="all 0.15s" cursor="pointer">
                  <Text fontSize="xs" fontWeight={isActive ? 'black' : 'medium'}
                    fontFamily="mono" letterSpacing="wider">
                    {tab.label}
                  </Text>
                </Flex>
              </Link>
            );
          })}

          {/* Divider */}
          <Flex align="center" px={2} flexShrink={0}>
            <Box w="1px" h="20px" bg="gray.700" />
          </Flex>

          {/* Coming Soon */}
          {COMING_SOON_MODULES.map(mod => (
            <Tooltip key={mod.label} label={`${mod.label} — ${mod.tag}`} placement="bottom" fontSize="xs">
              <Flex align="center" justify="center"
                px={4} minH="44px" minW="60px"
                borderBottom="2px solid" borderColor="transparent"
                color="gray.700" cursor="not-allowed" position="relative">
                <Text fontSize="xs" fontWeight="medium" fontFamily="mono" letterSpacing="wider">
                  {mod.label}
                </Text>
                <Text fontSize="2xs" color="gray.700" fontFamily="mono" ml={1}>•</Text>
              </Flex>
            </Tooltip>
          ))}

          {/* Admin link to control plane */}
          {isAdmin && !demo && (
            <>
              <Flex align="center" px={2} flexShrink={0}>
                <Box w="1px" h="20px" bg="gray.700" />
              </Flex>
              <Link href="/pm/admin/signal-status" style={{ textDecoration: 'none' }}>
                <Flex align="center" justify="center"
                  px={4} minH="44px" minW="60px"
                  borderBottom="2px solid"
                  borderColor={pathname.startsWith('/pm/admin/signal-status') ? 'blue.400' : 'transparent'}
                  color={pathname.startsWith('/pm/admin/signal-status') ? 'white' : 'gray.500'}
                  _hover={{ color: 'gray.200', borderColor: 'gray.600' }}
                  transition="all 0.15s" cursor="pointer">
                  <Text fontSize="xs" fontWeight={pathname.startsWith('/pm/admin/signal-status') ? 'black' : 'medium'}
                    fontFamily="mono" letterSpacing="wider">
                    STATUS
                  </Text>
                </Flex>
              </Link>
                            <Tooltip label="Open Signal Control Plane" placement="bottom" fontSize="xs">
                <Flex as="a" href="https://signal.fieldstone.pro"
                  align="center" justify="center"
                  px={4} minH="44px" minW="60px"
                  borderBottom="2px solid" borderColor="transparent"
                  color="orange.600"
                  _hover={{ color: 'orange.400', borderColor: 'orange.700' }}
                  transition="all 0.15s" cursor="pointer">
                  <Text fontSize="xs" fontWeight="medium" fontFamily="mono" letterSpacing="wider">
                    ⚡ SIGNAL
                  </Text>
                </Flex>
              </Tooltip>
            </>
          )}
        </HStack>
      </Flex>

      {/* Right: stats + user */}
      <HStack spacing={4} px={3} flexShrink={0}>
        {loading ? (
          <Spinner size="xs" color="gray.600" />
        ) : summary ? (
          <HStack spacing={3} display={{ base: 'none', lg: 'flex' }}>
            <VStack spacing={0} align="center">
              <Text fontSize="lg" fontWeight="black" color="white" lineHeight={1}>
                {summary.total_open ?? '—'}
              </Text>
              <Text fontSize="2xs" color="gray.600" fontFamily="mono" letterSpacing="wider">OPEN</Text>
            </VStack>
            <VStack spacing={0} align="center">
              <Text fontSize="lg" fontWeight="black" color="orange.400" lineHeight={1}>
                {summary.readiness.high ?? '—'}
              </Text>
              <Text fontSize="2xs" color="gray.600" fontFamily="mono" letterSpacing="wider">URGENT</Text>
            </VStack>
            <VStack spacing={0} align="center">
              <Text fontSize="lg" fontWeight="black" color="blue.400" lineHeight={1}>
                {summary.today_count ?? '—'}
              </Text>
              <Text fontSize="2xs" color="gray.600" fontFamily="mono" letterSpacing="wider">TODAY</Text>
            </VStack>
          </HStack>
        ) : null}
        {!demo && (
          <Flex align="center" px={1}>
            <SignalUserButton afterSignOutUrl="/login" size={36} />
          </Flex>
        )}
      </HStack>
    </Flex>
  );
}
