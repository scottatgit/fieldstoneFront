'use client';
import {
  Box, Flex, Text, Badge, VStack, HStack, Spinner,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { pmFetch } from '@/lib/demoApi';
import { WorkingBriefSummary } from './types';

interface Props {
  clientKey: string;
  clientName: string;
  onSelectBrief: (brief: WorkingBriefSummary) => void;
  selectedBriefId: string | null;
  pmApi: string;
}

function refreshBadge(status: string | null, stale: number): { label: string; color: string } {
  if (!status) return { label: 'unknown', color: 'gray' };
  if (status === 'refreshing') return { label: 'refreshing', color: 'blue' };
  if (status === 'error') return { label: 'error', color: 'red' };
  if (stale > 0) return { label: 'stale', color: 'orange' };
  if (status === 'fresh') return { label: 'fresh', color: 'green' };
  return { label: status, color: 'gray' };
}

function confidenceLabel(c: number | null): string {
  if (c == null) return '';
  if (c >= 0.8) return 'high';
  if (c >= 0.5) return 'medium';
  return 'low';
}

export function OpenBriefsList({
  clientKey, clientName, onSelectBrief, selectedBriefId, pmApi,
}: Props) {
  const [briefs, setBriefs] = useState<WorkingBriefSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clientKey) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    pmFetch(`/api/working-briefs?status=open&client_key=${encodeURIComponent(clientKey)}&limit=50`, pmApi)
      .then((data: unknown) => {
        if (cancelled) return;
        const resp = data as { briefs?: WorkingBriefSummary[] };
        const list: WorkingBriefSummary[] = Array.isArray(resp)
          ? (resp as WorkingBriefSummary[])
          : (resp?.briefs ?? []);
        setBriefs(list);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Failed to load briefs');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [clientKey, pmApi]);

  if (loading) return (
    <Flex align='center' justify='center' gap={2} py={6}>
      <Spinner color='blue.400' size='sm' />
      <Text fontSize='2xs' fontFamily='mono' color='gray.600'>Loading briefs...</Text>
    </Flex>
  );

  if (error) return (
    <Box px={3} py={2} mx={2} my={2} bg='red.900' border='1px solid' borderColor='red.700' borderRadius='md'>
      <Text fontSize='2xs' fontFamily='mono' color='red.300'>⚠ {error}</Text>
    </Box>
  );

  if (briefs.length === 0) return (
    <Flex align='center' justify='center' p={4}>
      <VStack spacing={1}>
        <Text fontSize='xs' color='gray.600' fontFamily='mono'>No open briefs</Text>
        <Text fontSize='2xs' color='gray.700'>No open briefs for {clientName}.</Text>
      </VStack>
    </Flex>
  );

  return (
    <Box overflowY='auto'
      css={{ '&::-webkit-scrollbar': { width: '3px' }, '&::-webkit-scrollbar-thumb': { background: '#2D3748', borderRadius: '2px' } }}
    >
      <VStack align='stretch' spacing={0} p={2}>
        {briefs.map(b => {
          const badge = refreshBadge(b.refresh_status, b.notes_since_refresh);
          const conf = confidenceLabel(b.confidence);
          const isSelected = selectedBriefId === b.brief_id;
          return (
            <Box
              key={b.brief_id}
              as='button'
              onClick={() => onSelectBrief(b)}
              px={3} py={3}
              borderRadius='md'
              border='1px solid'
              mb={1.5}
              borderColor={isSelected ? 'blue.600' : 'gray.800'}
              bg={isSelected ? 'blue.950' : 'gray.900'}
              _hover={{ borderColor: 'gray.600', bg: isSelected ? 'blue.950' : 'gray.800' }}
              transition='all 0.1s'
              textAlign='left'
              w='full'
            >
              <VStack align='start' spacing={1.5}>
                <Text
                  fontSize='xs'
                  fontFamily='mono'
                  fontWeight='bold'
                  color={isSelected ? 'blue.200' : 'gray.100'}
                  noOfLines={2}
                >
                  {b.ticket_title || b.ticket_key}
                </Text>
                {b.situation && (
                  <Text fontSize='2xs' color='gray.500' noOfLines={2} lineHeight='1.4'>
                    {b.situation}
                  </Text>
                )}
                <HStack spacing={1.5} flexWrap='wrap'>
                  <Badge colorScheme={badge.color} fontSize='2xs' variant='subtle'>
                    {badge.label}
                  </Badge>
                  {conf && (
                    <Badge
                      colorScheme={conf === 'high' ? 'green' : conf === 'medium' ? 'yellow' : 'red'}
                      fontSize='2xs' variant='subtle'
                    >
                      {conf} conf
                    </Badge>
                  )}
                  {b.notes_since_refresh > 0 && (
                    <Badge colorScheme='orange' fontSize='2xs' variant='subtle'>
                      +{b.notes_since_refresh} note{b.notes_since_refresh > 1 ? 's' : ''}
                    </Badge>
                  )}
                  <Text fontSize='2xs' fontFamily='mono' color='gray.600'>
                    {b.ticket_key}
                  </Text>
                </HStack>
              </VStack>
            </Box>
          );
        })}
      </VStack>
    </Box>
  );
}
