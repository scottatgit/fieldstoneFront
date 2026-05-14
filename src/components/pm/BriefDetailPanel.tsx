'use client';
import {
  Box, Flex, Text, Badge, VStack, HStack, Spinner, Button, Divider,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { pmFetch } from '@/lib/demoApi';
import { WorkingBriefDetail, JsonArrayish } from './types';

interface Props {
  ticketKey: string;
  onOpenBriefingRoom: () => void;
  onViewEvidence: () => void;
  pmApi: string;
}

export function safeJsonArray<T>(val: JsonArrayish<T>): T[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try { const p = JSON.parse(val); return Array.isArray(p) ? p : []; }
    catch { return []; }
  }
  return [];
}

// safeStr: coerce any API value to a renderable string.
// Prevents React #31 ('Objects are not valid as a React child').
export function safeStr(val: unknown): string {
  if (val == null) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  // Object or array: extract common text fields or JSON-preview
  if (typeof val === 'object') {
    const v = val as Record<string, unknown>;
    const text = v['text'] ?? v['content'] ?? v['message'] ?? v['summary'] ?? v['value'] ?? v['label'];
    if (text != null && typeof text === 'string') return text;
    try { return JSON.stringify(val); } catch { return '[object]'; }
  }
  return String(val);
}

// safeJsonArrayStr: like safeJsonArray but always returns string[],
// coercing any object items to strings via safeStr.
export function safeJsonArrayStr(val: JsonArrayish<unknown>): string[] {
  const items = safeJsonArray<unknown>(val);
  return items.map(safeStr).filter(s => s.length > 0);
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box>
      <Text fontSize='2xs' fontFamily='mono' fontWeight='bold' color='gray.500'
        letterSpacing='wider' mb={1} textTransform='uppercase'>
        {label}
      </Text>
      {children}
    </Box>
  );
}

function ProseBlock({ text }: { text: string | null | undefined }) {
  const s = safeStr(text);
  if (!s) return <Text fontSize='2xs' color='gray.700' fontFamily='mono'>—</Text>;
  return <Text fontSize='xs' color='gray.300' lineHeight='1.5'>{s}</Text>;
}

function TagList({ items, color = 'gray' }: { items: string[]; color?: string }) {
  if (!items.length) return <Text fontSize='2xs' color='gray.700' fontFamily='mono'>—</Text>;
  return (
    <VStack align='start' spacing={1}>
      {items.map((item, i) => (
        <HStack key={i} spacing={2} align='flex-start'>
          <Box w={1.5} h={1.5} borderRadius='full' bg={`${color}.400`} mt={1.5} flexShrink={0} />
          <Text fontSize='xs' color='gray.300' lineHeight='1.4'>{item}</Text>
        </HStack>
      ))}
    </VStack>
  );
}

export function BriefDetailPanel({ ticketKey, onOpenBriefingRoom, onViewEvidence, pmApi }: Props) {
  const [detail, setDetail] = useState<WorkingBriefDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!ticketKey) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setDetail(null);
    setNotFound(false);
    pmFetch(`/api/tickets/${ticketKey}/working-brief`, pmApi)
      .then((data: unknown) => {
        if (cancelled) return;
        setDetail(data as WorkingBriefDetail);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : String(e);
        if (msg.includes('404') || msg.toLowerCase().includes('not found')) {
          setNotFound(true);
        } else {
          setError(msg || 'Failed to load brief detail');
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [ticketKey, pmApi]);

  if (loading) return (
    <Flex flex={1} align='center' justify='center' direction='column' gap={2} py={8}>
      <Spinner color='blue.400' size='sm' />
      <Text fontSize='2xs' fontFamily='mono' color='gray.600'>Loading brief...</Text>
    </Flex>
  );

  if (error) return (
    <Box px={3} py={2} m={3} bg='red.900' border='1px solid' borderColor='red.700' borderRadius='md'>
      <Text fontSize='2xs' fontFamily='mono' color='red.300'>⚠ {error}</Text>
    </Box>
  );

  if (notFound) return (
    <Flex flex={1} align='center' justify='center' p={6}>
      <VStack spacing={2}>
        <Text fontSize='xs' color='gray.600' fontFamily='mono'>No working brief yet</Text>
        <Text fontSize='2xs' color='gray.700' textAlign='center'>
          Signal has not generated a working brief for this ticket.
        </Text>
      </VStack>
    </Flex>
  );

  if (!detail) return null;

  const riskFlags = safeJsonArrayStr(detail.risk_flags);
  const followUps = safeJsonArrayStr(detail.follow_up_items);
  const missingFlags = safeJsonArrayStr(detail.missing_context_flags);
  const confLabel = detail.confidence != null
    ? detail.confidence >= 0.8 ? 'high' : detail.confidence >= 0.5 ? 'medium' : 'low'
    : null;

  return (
    <Flex direction='column' h='full' overflow='hidden'>
      {/* Header */}
      <Box px={4} py={3} borderBottom='1px solid' borderColor='gray.700' flexShrink={0}>
        <VStack align='start' spacing={2}>
          <HStack justify='space-between' w='full'>
            <HStack spacing={2}>
              <Text fontSize='2xs' fontFamily='mono' color='gray.500'>{ticketKey}</Text>
              {confLabel && (
                <Badge
                  colorScheme={confLabel === 'high' ? 'green' : confLabel === 'medium' ? 'yellow' : 'red'}
                  fontSize='2xs' variant='subtle'
                >
                  {confLabel} conf
                </Badge>
              )}
              {detail.refresh_status && (
                <Badge
                  colorScheme={
                    detail.refresh_status === 'fresh' ? 'green' :
                    detail.refresh_status === 'error' ? 'red' :
                    detail.refresh_status === 'refreshing' ? 'blue' : 'orange'
                  }
                  fontSize='2xs' variant='subtle'
                >
                  {detail.refresh_status}
                </Badge>
              )}
            </HStack>
            <HStack spacing={2}>
              <Button
                size='xs' variant='ghost'
                fontFamily='mono' fontSize='2xs'
                color='gray.500' _hover={{ color: 'gray.300', bg: 'gray.800' }}
                onClick={onViewEvidence}
              >
                source ↗
              </Button>
              <Button
                size='xs'
                bg='blue.800' color='blue.200'
                fontFamily='mono' fontSize='2xs'
                _hover={{ bg: 'blue.700' }}
                onClick={onOpenBriefingRoom}
              >
                Briefing Room →
              </Button>
            </HStack>
          </HStack>
          <Text fontSize='xs' fontFamily='mono' fontWeight='bold' color='gray.100' noOfLines={2}>
            {detail.ticket_title || ticketKey}
          </Text>
        </VStack>
      </Box>

      {/* Scrollable content */}
      <Box
        flex={1} overflowY='auto' px={4} py={3}
        css={{ '&::-webkit-scrollbar': { width: '3px' }, '&::-webkit-scrollbar-thumb': { background: '#2D3748', borderRadius: '2px' } }}
      >
        <VStack align='stretch' spacing={4}>
          <Section label='Situation'><ProseBlock text={detail.situation} /></Section>
          <Divider borderColor='gray.800' />
          <Section label='Expectation'><ProseBlock text={detail.expectation} /></Section>
          <Divider borderColor='gray.800' />
          <Section label='Constraints'><ProseBlock text={detail.constraints} /></Section>
          <Divider borderColor='gray.800' />
          <Section label='Context Summary'><ProseBlock text={detail.context_summary} /></Section>
          <Divider borderColor='gray.800' />
          <Section label='Resolution Direction'><ProseBlock text={detail.resolution_direction} /></Section>

          {followUps.length > 0 && (
            <>
              <Divider borderColor='gray.800' />
              <Section label='Follow-up Items'><TagList items={followUps} color='blue' /></Section>
            </>
          )}

          {riskFlags.length > 0 && (
            <>
              <Divider borderColor='gray.800' />
              <Section label='Risk Flags'><TagList items={riskFlags} color='red' /></Section>
            </>
          )}

          {missingFlags.length > 0 && (
            <>
              <Divider borderColor='gray.800' />
              <Section label={`Open Questions (${missingFlags.length})`}>
                <VStack align='stretch' spacing={1}>
                  {missingFlags.map((q, i) => (
                    <Box key={i} px={3} py={2} bg='gray.800' border='1px solid'
                      borderColor='yellow.900' borderRadius='md'>
                      <HStack spacing={2} align='flex-start'>
                        <Text fontSize='xs' color='yellow.400' mt={0.5} flexShrink={0}>?</Text>
                        <Text fontSize='xs' color='gray.300' lineHeight='1.4'>{q}</Text>
                      </HStack>
                    </Box>
                  ))}
                </VStack>
              </Section>
            </>
          )}

          {detail.intel_link_count > 0 && (
            <>
              <Divider borderColor='gray.800' />
              <Section label='Intel Links'>
                <Badge colorScheme='purple' fontSize='2xs' variant='subtle'>
                  {detail.intel_link_count} intel link{detail.intel_link_count !== 1 ? 's' : ''}
                </Badge>
              </Section>
            </>
          )}

          {detail.last_refreshed_at && (
            <Text fontSize='2xs' fontFamily='mono' color='gray.700'>
              Last refreshed: {new Date(detail.last_refreshed_at).toLocaleString()}
            </Text>
          )}
        </VStack>
      </Box>
    </Flex>
  );
}
