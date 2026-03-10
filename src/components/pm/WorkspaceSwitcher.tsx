'use client';
import { useState, useEffect, useRef } from 'react';
import { Box, Flex, Text, VStack, Badge } from '@chakra-ui/react';
import { useAuth } from '@clerk/nextjs';

interface Workspace {
  tenant_id: string;
  slug: string;
  name: string;
  role: string;
}

const ROLE_COLORS: Record<string, string> = {
  tenant_admin: 'blue',
  technician:   'green',
  viewer:       'gray',
};

const ROLE_LABELS: Record<string, string> = {
  tenant_admin: 'Admin',
  technician:   'Tech',
  viewer:       'Viewer',
};

const SIGNAL_DOMAIN = process.env.NEXT_PUBLIC_SIGNAL_DOMAIN || 'signal.fieldstone.pro';

function getCurrentSlug(): string | null {
  if (typeof window === 'undefined') return null;
  const hostname = window.location.hostname;
  // {tenant}.signal.fieldstone.pro
  if (hostname.endsWith('.' + SIGNAL_DOMAIN)) {
    const slug = hostname.split('.')[0];
    return ['www','app','admin','demo','api','signal'].includes(slug) ? null : slug;
  }
  // Legacy {tenant}.fieldstone.pro
  const parts = hostname.split('.');
  if (parts.length >= 3) {
    const slug = parts[0];
    return ['www','app','admin','demo','api','signal'].includes(slug) ? null : slug;
  }
  return null;
}

export function WorkspaceSwitcher() {
  const { getToken } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading]       = useState(true);
  const [open, setOpen]             = useState(false);
  const [currentSlug, setCurrentSlug] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setCurrentSlug(getCurrentSlug()); }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const token = await getToken();
        if (!token) { setLoading(false); return; }
        const res = await fetch('/api/user/workspaces', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) { setLoading(false); return; }
        const data: Workspace[] = await res.json();
        if (!cancelled) setWorkspaces(data);
      } catch { /* silently fail */ } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [getToken]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (loading || workspaces.length <= 1) return null;

  const current = workspaces.find(w => w.slug === currentSlug) ?? workspaces[0];

  function switchTo(ws: Workspace) {
    if (ws.slug === currentSlug) { setOpen(false); return; }
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isLocal) {
      window.location.href = '/pm';
    } else {
      const { protocol, host } = window.location;
      window.location.href = `${protocol}//${ws.slug}.${SIGNAL_DOMAIN}/pm`;
    }
    setOpen(false);
  }

  return (
    <Box position='relative' ref={dropdownRef}>
      <Flex
        align='center' px={3} minH='44px' gap={2}
        borderRight='1px solid' borderColor='gray.700'
        cursor='pointer' _hover={{ bg: 'gray.800' }}
        onClick={() => setOpen(o => !o)} userSelect='none'
      >
        <Text fontSize='xs' fontWeight='semibold' color='gray.300' fontFamily='mono' letterSpacing='wide'>
          {current.name}
        </Text>
        <Text fontSize='10px' color='gray.500' mt='1px'>{open ? '▲' : '▼'}</Text>
      </Flex>
      {open && (
        <Box position='absolute' top='100%' left={0} zIndex={200}
          bg='gray.900' border='1px solid' borderColor='gray.700'
          borderRadius='md' minW='220px' overflow='hidden' boxShadow='lg'>
          <VStack spacing={0} align='stretch'>
            {workspaces.map(ws => {
              const isCurrent = ws.slug === currentSlug;
              return (
                <Flex key={ws.tenant_id} px={4} py={3} align='center' justify='space-between'
                  cursor={isCurrent ? 'default' : 'pointer'}
                  bg={isCurrent ? 'gray.800' : 'transparent'}
                  _hover={{ bg: isCurrent ? 'gray.800' : 'gray.750' }}
                  onClick={() => switchTo(ws)}
                  borderBottom='1px solid' borderColor='gray.800'
                >
                  <VStack spacing={0} align='flex-start'>
                    <Text fontSize='sm' fontWeight={isCurrent ? 'bold' : 'medium'}
                      color={isCurrent ? 'white' : 'gray.300'}>{ws.name}</Text>
                    <Text fontSize='xs' color='gray.600' fontFamily='mono'>
                      {ws.slug + '.' + SIGNAL_DOMAIN}
                    </Text>
                  </VStack>
                  <Flex align='center' gap={2}>
                    <Badge fontSize='2xs' colorScheme={ROLE_COLORS[ws.role] ?? 'gray'} variant='subtle'>
                      {ROLE_LABELS[ws.role] ?? ws.role}
                    </Badge>
                    {isCurrent && <Text fontSize='10px' color='blue.400'>&#9679;</Text>}
                  </Flex>
                </Flex>
              );
            })}
          </VStack>
        </Box>
      )}
    </Box>
  );
}
