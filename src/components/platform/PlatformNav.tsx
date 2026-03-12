'use client';
import { Flex, HStack, Text, Box, Tooltip } from '@chakra-ui/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SignalUserButton } from '@/components/SignalUserButton';

const NAV_ITEMS = [
  { label: 'ACTIVITY',     href: '/platform'                },
  { label: 'TENANTS',      href: '/platform/tenants'        },
  { label: 'BILLING',      href: '/platform/billing'        },
  { label: 'SETUP',        href: '/platform/setup'          },
  { label: 'ADMIN',        href: '/platform/admin'          },
  { label: 'INTEGRATIONS', href: '/platform/integrations'   },
];

const COMING_SOON = [{ label: 'AI PROPOSALS', href: '/platform/proposals' }];

export function PlatformNav() {
  const pathname = usePathname();
  return (
    <Flex px={0} py={0} bg="gray.950" borderBottom="1px solid" borderColor="orange.900"
      align="stretch" flexShrink={0} justify="space-between">
      <Flex align="center" px={4} borderRight="1px solid" borderColor="gray.800"
        flexShrink={0} minH="44px" gap={2}>
        <Text fontSize="xs" fontWeight="black" fontFamily="mono" letterSpacing="widest" color="orange.400" userSelect="none">⚡ SIGNAL</Text>
        <Box px={2} py={0.5} bg="orange.900" borderRadius="sm">
          <Text fontSize="9px" fontFamily="mono" color="orange.300" letterSpacing="wider">CONTROL PLANE</Text>
        </Box>
      </Flex>
      <Flex flex={1} overflowX="auto" align="stretch" css={{ '&::-webkit-scrollbar': { display: 'none' } }}>
        <HStack spacing={0} align="stretch">
          {NAV_ITEMS.map(item => {
            const isActive = item.href === '/platform' ? pathname === '/platform' : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
                <Flex align="center" justify="center" px={4} minH="44px" minW="60px"
                  borderBottom="2px solid" borderColor={isActive ? 'orange.400' : 'transparent'}
                  color={isActive ? 'white' : 'gray.500'}
                  _hover={{ color: 'gray.200', borderColor: isActive ? 'orange.400' : 'gray.600' }}
                  transition="all 0.15s" cursor="pointer">
                  <Text fontSize="xs" fontWeight={isActive ? 'black' : 'medium'} fontFamily="mono" letterSpacing="wider">{item.label}</Text>
                </Flex>
              </Link>
            );
          })}
          <Flex align="center" px={2} flexShrink={0}><Box w="1px" h="20px" bg="gray.800" /></Flex>
          {COMING_SOON.map(item => (
            <Tooltip key={item.label} label="Coming soon" placement="bottom" fontSize="xs">
              <Flex align="center" justify="center" px={4} minH="44px" minW="60px"
                borderBottom="2px solid" borderColor="transparent" color="gray.700" cursor="not-allowed">
                <Text fontSize="xs" fontFamily="mono" letterSpacing="wider">{item.label}</Text>
              </Flex>
            </Tooltip>
          ))}
        </HStack>
      </Flex>
      <HStack spacing={3} px={4} flexShrink={0}>
        <Tooltip label="Back to tenant workspace" placement="bottom" fontSize="xs">
          <Link href="https://signal.fieldstone.pro" style={{ textDecoration: 'none' }}>
            <Text fontSize="xs" fontFamily="mono" color="gray.600" _hover={{ color: 'gray.400' }} transition="color 0.15s">← WORKSPACE</Text>
          </Link>
        </Tooltip>
        <Flex align="center">
          <SignalUserButton afterSignOutUrl="/login" size={32} />
        </Flex>
      </HStack>
    </Flex>
  );
}
