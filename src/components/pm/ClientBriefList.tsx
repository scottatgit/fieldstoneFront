'use client';
import {
  Box, Flex, Text, Badge, VStack, HStack, Spinner,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { pmFetch } from '@/lib/demoApi';
import { WorkingBriefSummary, ClientBriefGroup } from './types';

interface Props {
  onSelectClient: (key: string, name: string) => void;
  selectedClientKey: string | null;
  pmApi: string;
}

function buildClientGroups(briefs: WorkingBriefSummary[]): ClientBriefGroup[] {
  const map = new Map<string, ClientBriefGroup>();
  for (const b of briefs) {
    const key = b.client_key || '(unknown)';
    const name = b.client_display_name || b.client_key || '(unknown)';
    const existing = map.get(key);
    const isStale = (b.notes_since_refresh ?? 0) > 0;
    if (existing) {
      existing.open_brief_count += 1;
      if (isStale) existing.stale_count += 1;
      if (b.last_updated && (!existing.last_updated || b.last_updated > existing.last_updated)) {
        existing.last_updated = b.last_updated;
      }
    } else {
      map.set(key, {
        client_key: key,
        client_display_name: name,
        open_brief_count: 1,
        stale_count: isStale ? 1 : 0,
        last_updated: b.last_updated,
      });
    }
  }
  return Array.from(map.values()).sort((a, b) =>
    (b.last_updated ?? '').localeCompare(a.last_updated ?? ''),
  );
}

export function ClientBriefList({ onSelectClient, selectedClientKey, pmApi }: Props) {
  const [clients, setClients] = useState<ClientBriefGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    pmFetch('/api/working-briefs?status=open&limit=100', pmApi)
      .then((data: unknown) => {
        if (cancelled) return;
        const resp = data as { briefs?: WorkingBriefSummary[] };
        const briefs: WorkingBriefSummary[] = Array.isArray(resp)
          ? (resp as WorkingBriefSummary[])
          : (resp?.briefs ?? []);
        setClients(buildClientGroups(briefs));
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Failed to load clients');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [pmApi]);

  if (loading) return (
    <Flex flex={1} align='center' justify='center' direction='column' gap={2} py={4}>
      <Spinner color='blue.400' size='sm' />
      <Text fontSize='2xs' fontFamily='mono' color='gray.600'>Loading clients...</Text>
    </Flex>
  );

  if (error) return (
    <Box px={3} py={2} mx={2} my={2} bg='red.900' border='1px solid' borderColor='red.700' borderRadius='md'>
      <Text fontSize='2xs' fontFamily='mono' color='red.300'>⚠ {error}</Text>
    </Box>
  );

  if (clients.length === 0) return (
    <Flex flex={1} align='center' justify='center' p={4}>
      <VStack spacing={2}>
        <Text fontSize='xs' color='gray.600' fontFamily='mono'>No open briefs</Text>
        <Text fontSize='2xs' color='gray.700' textAlign='center'>Briefs appear here when tickets are ingested and working briefs are created.</Text>
      </VStack>
    </Flex>
  );

  return (
    <Box flex={1} overflowY='auto'
      css={{ '&::-webkit-scrollbar': { width: '3px' }, '&::-webkit-scrollbar-thumb': { background: '#2D3748', borderRadius: '2px' } }}
    >
      <VStack align='stretch' spacing={0} p={2}>
        {clients.map(c => (
          <Box
            key={c.client_key}
            as='button'
            onClick={() => onSelectClient(c.client_key, c.client_display_name)}
            px={3} py={2.5}
            borderRadius='md'
            border='1px solid'
            mb={1}
            borderColor={selectedClientKey === c.client_key ? 'blue.600' : 'gray.800'}
            bg={selectedClientKey === c.client_key ? 'blue.950' : 'transparent'}
            _hover={{ borderColor: 'gray.600', bg: 'gray.900' }}
            transition='all 0.1s'
            textAlign='left'
            w='full'
          >
            <VStack align='start' spacing={0.5}>
              <Text
                fontSize='xs'
                fontFamily='mono'
                fontWeight={selectedClientKey === c.client_key ? 'bold' : 'normal'}
                color={selectedClientKey === c.client_key ? 'blue.200' : 'gray.200'}
                noOfLines={1}
              >
                {c.client_display_name}
              </Text>
              <HStack spacing={1.5}>
                <Badge
                  colorScheme={selectedClientKey === c.client_key ? 'blue' : 'gray'}
                  fontSize='2xs'
                  variant={selectedClientKey === c.client_key ? 'solid' : 'subtle'}
                >
                  {c.open_brief_count} brief{c.open_brief_count !== 1 ? 's' : ''}
                </Badge>
                {c.stale_count > 0 && (
                  <Badge colorScheme='orange' fontSize='2xs' variant='subtle'>
                    {c.stale_count} stale
                  </Badge>
                )}
              </HStack>
            </VStack>
          </Box>
        ))}
      </VStack>
    </Box>
  );
}
