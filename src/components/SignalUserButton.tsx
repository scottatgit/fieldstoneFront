'use client';
import { useRouter } from 'next/navigation';
import { Flex, Text, Box, Menu, MenuButton, MenuList, MenuItem, Avatar } from '@chakra-ui/react';
import { useUser, clearUserCache } from '@/lib/useUser';

interface Props {
  afterSignOutUrl?: string;
  size?: number;
}

export function SignalUserButton({ afterSignOutUrl = '/login', size = 32 }: Props) {
  const { user } = useUser();
  const router = useRouter();

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch { /* ignore */ }
    clearUserCache();
    window.location.href = afterSignOutUrl;
  }

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <Menu>
      <MenuButton>
        <Flex
          w={`${size}px`} h={`${size}px`}
          borderRadius='full' bg='blue.600'
          align='center' justify='center'
          cursor='pointer' _hover={{ bg: 'blue.500' }}
          fontSize='xs' fontWeight='bold' color='white'
          fontFamily='mono'
        >
          {initials}
        </Flex>
      </MenuButton>
      <MenuList bg='gray.900' border='1px solid' borderColor='gray.700' minW='180px'>
        {user && (
          <Box px={3} py={2} borderBottom='1px solid' borderColor='gray.700'>
            <Text fontSize='xs' fontWeight='bold' color='white' fontFamily='mono'>{user.name}</Text>
            <Text fontSize='2xs' color='gray.500' fontFamily='mono'>{user.email}</Text>
          </Box>
        )}
        <MenuItem
          bg='transparent' _hover={{ bg: 'gray.800' }}
          fontSize='xs' fontFamily='mono' color='red.400'
          onClick={handleLogout}
        >
          Sign out
        </MenuItem>
      </MenuList>
    </Menu>
  );
}
