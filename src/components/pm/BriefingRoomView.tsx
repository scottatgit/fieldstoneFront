'use client';
import {
  Box, Flex, Text, Badge, VStack, HStack, Spinner, Button, Divider, Grid, GridItem,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { pmFetch } from '@/lib/demoApi';
import {
  WorkingBriefDetail, ClientStory, ClosedBriefSummary, JsonArrayish,
} from './types';
import { safeJsonArray } from './BriefDetailPanel';

interface Props {
  ticketKey: string;
  clientKey: string | null;
  clientName: string;
  brief: WorkingBriefDetail | null;
  onClose: () => void;
  onViewEvidence: () => void;
  pmApi: string;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text fontSize='2xs' fontFamily='mono' fontWeight='bold' color='gray.500'
      letterSpacing='wider' mb={2} textTransform='uppercase'>
      {children}
    </Text>
  );
}

function PanelCard({ title, accent = 'blue', children }: {
  title: string; accent?: string; children: React.ReactNode;
}) {
  return (
    <Box
      bg='gray.900' border='1px solid' borderColor={`${accent}.900`}
      borderRadius='lg' overflow='hidden' h='full' display='flex' flexDirection='column'
    >
      <Box px={4} py={2.5} bg={`${accent}.950`} borderBottom='1px solid'
        borderColor={`${accent}.900`} flexShrink={0}>
        <Text fontSize='xs' fontFamily='mono' fontWeight='bold'
          color={`${accent}.300`} letterSpacing='wider'>
          {title}
        </Text>
      </Box>
      <Box
        flex={1} overflowY='auto' px={4} py={3}
        css={{ '&::-webkit-scrollbar': { width: '3px' }, '&::-webkit-scrollbar-thumb': { background: '#2D3748', borderRadius: '2px' } }}
      >
        {children}
      </Box>
    </Box>
  );
}

function QuestionCard({ q, index }: { q: string; index: number }) {
  return (
    <Box px={3} py={2.5} bg='gray.800' border='1px solid' borderColor='yellow.900'
      borderRadius='md' mb={2}>
      <HStack spacing={2} align='flex-start'>
        <Box
          flexShrink={0} w={5} h={5} borderRadius='full'
          bg='yellow.900' border='1px solid' borderColor='yellow.700'
          display='flex' alignItems='center' justifyContent='center' mt={0.5}
        >
          <Text fontSize='2xs' fontWeight='black' fontFamily='mono' color='yellow.400'>
            {index + 1}
          </Text>
        </Box>
        <Text fontSize='xs' color='gray.200' lineHeight='1.5'>{q}</Text>
      </HStack>
    </Box>
  );
}

export function BriefingRoomView({
  ticketKey, clientKey, clientName, brief, onClose, onViewEvidence, pmApi,
}: Props) {
  const [story, setStory] = useState<ClientStory | null>(null);
  const [closedBriefs, setClosedBriefs] = useState<ClosedBriefSummary[]>([]);
  const [storyLoading, setStoryLoading] = useState(false);
  const [storyError, setStoryError] = useState<string | null>(null);

  useEffect(() => {
    if (!clientKey) return;
    let cancelled = false;
    setStoryLoading(true);
    setStoryError(null);

    const storyP = pmFetch(`/api/clients/${encodeURIComponent(clientKey)}/story`, pmApi);
    const briefsP = pmFetch(`/api/clients/${encodeURIComponent(clientKey)}/briefs`, pmApi);

    Promise.all([storyP, briefsP])
      .then(([storyData, briefsData]: [unknown, unknown]) => {
        if (cancelled) return;
        setStory(storyData as ClientStory);
        const bd = briefsData as { briefs?: ClosedBriefSummary[] };
        setClosedBriefs(Array.isArray(briefsData) ? (briefsData as ClosedBriefSummary[]) : (bd?.briefs ?? []));
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setStoryError(e instanceof Error ? e.message : 'Failed to load client story');
      })
      .finally(() => { if (!cancelled) setStoryLoading(false); });
    return () => { cancelled = true; };
  }, [clientKey, pmApi]);

  const missingFlags = safeJsonArray<string>(brief?.missing_context_flags as JsonArrayish<string>);
  const riskFlags = safeJsonArray<string>(brief?.risk_flags as JsonArrayish<string>);
  const confLabel = brief?.confidence != null
    ? brief.confidence >= 0.8 ? 'high' : brief.confidence >= 0.5 ? 'medium' : 'low'
    : null;

  return (
    <Flex direction='column' h='full' bg='gray.950' overflow='hidden'>
      {/* Header */}
      <Box
        px={4} py={3}
        bg='gray.900' borderBottom='1px solid' borderColor='gray.700'
        flexShrink={0}
      >
        <HStack justify='space-between'>
          <VStack align='start' spacing={0.5}>
            <HStack spacing={2}>
              <Text fontSize='xs' fontFamily='mono' fontWeight='bold'
                color='blue.300' letterSpacing='wider'>
                BRIEFING ROOM
              </Text>
              <Badge colorScheme='blue' fontSize='2xs' variant='subtle'>
                {clientName}
              </Badge>
              <Text fontSize='2xs' fontFamily='mono' color='gray.600'>{ticketKey}</Text>
            </HStack>
            <Text fontSize='2xs' color='gray.600' fontFamily='mono'>
              Read-only context aggregation · Phase 1
            </Text>
          </VStack>
          <HStack spacing={2}>
            <Button
              size='xs' variant='ghost'
              fontFamily='mono' fontSize='2xs'
              color='gray.500' _hover={{ color: 'gray.300', bg: 'gray.800' }}
              onClick={onViewEvidence}
            >
              source ticket ↗
            </Button>
            <Button
              size='xs' variant='ghost'
              fontFamily='mono' fontSize='2xs'
              color='gray.600' _hover={{ color: 'gray.300', bg: 'gray.800' }}
              onClick={onClose}
            >
              ✕ close
            </Button>
          </HStack>
        </HStack>
      </Box>

      {/* Three panels */}
      <Box flex={1} minH={0} overflow='hidden' p={3}>
        <Grid
          h='full'
          templateColumns={{ base: '1fr', lg: '1fr 1fr 1fr' }}
          templateRows={{ base: 'auto auto auto', lg: '1fr' }}
          gap={3}
        >
          {/* Panel A: What Signal Knows */}
          <GridItem overflow='hidden'>
            <PanelCard title='▸ What Signal Knows' accent='gray'>
              {storyLoading && (
                <Flex align='center' gap={2} py={4}>
                  <Spinner size='xs' color='gray.500' />
                  <Text fontSize='2xs' fontFamily='mono' color='gray.600'>Loading client story...</Text>
                </Flex>
              )}
              {storyError && (
                <Text fontSize='2xs' fontFamily='mono' color='red.400'>⚠ {storyError}</Text>
              )}
              {!storyLoading && !storyError && (
                <VStack align='stretch' spacing={4}>
                  {/* Client story summary */}
                  <Box>
                    <SectionLabel>Client History</SectionLabel>
                    {story?.summary
                      ? <Text fontSize='xs' color='gray.300' lineHeight='1.5'>{story.summary}</Text>
                      : <Text fontSize='2xs' color='gray.700' fontFamily='mono'>No history summary available</Text>
                    }
                  </Box>

                  {story && (
                    <>
                      <Divider borderColor='gray.800' />
                      <Box>
                        <SectionLabel>Prior Closed Briefs</SectionLabel>
                        <HStack spacing={3}>
                          <Badge colorScheme='gray' fontSize='2xs' variant='subtle'>
                            {story.brief_count} total
                          </Badge>
                          {story.trust_trend && (
                            <Badge
                              colorScheme={
                                story.trust_trend === 'improving' ? 'green' :
                                story.trust_trend === 'declining' ? 'red' : 'gray'
                              }
                              fontSize='2xs' variant='subtle'
                            >
                              trust: {story.trust_trend}
                            </Badge>
                          )}
                        </HStack>
                      </Box>
                    </>
                  )}

                  {closedBriefs.length > 0 && (
                    <>
                      <Divider borderColor='gray.800' />
                      <Box>
                        <SectionLabel>Recent Work ({closedBriefs.slice(0, 5).length})</SectionLabel>
                        <VStack align='stretch' spacing={1.5}>
                          {closedBriefs.slice(0, 5).map((b) => (
                            <Box key={b.brief_id} px={2.5} py={2}
                              bg='gray.800' borderRadius='md' border='1px solid'
                              borderColor='gray.700'>
                              <Text fontSize='2xs' color='gray.300' noOfLines={1}>
                                {b.primary_issue || b.ticket_key}
                              </Text>
                              <HStack spacing={1.5} mt={0.5}>
                                {b.outcome_type && (
                                  <Badge colorScheme='gray' fontSize='2xs' variant='subtle'>
                                    {b.outcome_type}
                                  </Badge>
                                )}
                                {b.issue_category && (
                                  <Text fontSize='2xs' fontFamily='mono' color='gray.600'>
                                    {b.issue_category}
                                  </Text>
                                )}
                              </HStack>
                            </Box>
                          ))}
                        </VStack>
                      </Box>
                    </>
                  )}

                  {!story && !storyLoading && (
                    <Text fontSize='2xs' color='gray.700' fontFamily='mono'>
                      No client story available
                    </Text>
                  )}
                </VStack>
              )}
            </PanelCard>
          </GridItem>

          {/* Panel B: What Signal Thinks */}
          <GridItem overflow='hidden'>
            <PanelCard title='▸ What Signal Thinks' accent='blue'>
              {!brief
                ? <Text fontSize='2xs' color='gray.700' fontFamily='mono'>No brief loaded</Text>
                : (
                  <VStack align='stretch' spacing={4}>
                    <Box>
                      <SectionLabel>Situation</SectionLabel>
                      {brief.situation
                        ? <Text fontSize='xs' color='gray.300' lineHeight='1.5'>{brief.situation}</Text>
                        : <Text fontSize='2xs' color='gray.700' fontFamily='mono'>—</Text>
                      }
                    </Box>

                    <Divider borderColor='gray.800' />

                    <Box>
                      <SectionLabel>Expectation</SectionLabel>
                      {brief.expectation
                        ? <Text fontSize='xs' color='gray.300' lineHeight='1.5'>{brief.expectation}</Text>
                        : <Text fontSize='2xs' color='gray.700' fontFamily='mono'>—</Text>
                      }
                    </Box>

                    {brief.resolution_direction && (
                      <>
                        <Divider borderColor='gray.800' />
                        <Box>
                          <SectionLabel>Resolution Direction</SectionLabel>
                          <Text fontSize='xs' color='gray.300' lineHeight='1.5'>
                            {brief.resolution_direction}
                          </Text>
                        </Box>
                      </>
                    )}

                    {riskFlags.length > 0 && (
                      <>
                        <Divider borderColor='gray.800' />
                        <Box>
                          <SectionLabel>Risk Flags</SectionLabel>
                          <VStack align='stretch' spacing={1}>
                            {riskFlags.map((flag, i) => (
                              <HStack key={i} spacing={2} align='flex-start'>
                                <Box w={1.5} h={1.5} borderRadius='full'
                                  bg='red.400' mt={1.5} flexShrink={0} />
                                <Text fontSize='xs' color='gray.300' lineHeight='1.4'>{flag}</Text>
                              </HStack>
                            ))}
                          </VStack>
                        </Box>
                      </>
                    )}

                    <Divider borderColor='gray.800' />
                    <HStack spacing={2}>
                      {confLabel && (
                        <Badge
                          colorScheme={confLabel === 'high' ? 'green' : confLabel === 'medium' ? 'yellow' : 'red'}
                          fontSize='2xs' variant='subtle'
                        >
                          {confLabel} confidence
                        </Badge>
                      )}
                      {brief.intel_link_count > 0 && (
                        <Badge colorScheme='purple' fontSize='2xs' variant='subtle'>
                          {brief.intel_link_count} intel link{brief.intel_link_count !== 1 ? 's' : ''}
                        </Badge>
                      )}
                    </HStack>
                  </VStack>
                )
              }
            </PanelCard>
          </GridItem>

          {/* Panel C: What Signal Still Needs */}
          <GridItem overflow='hidden'>
            <PanelCard title='▸ What Signal Still Needs' accent='yellow'>
              {missingFlags.length === 0
                ? (
                  <Flex align='center' justify='center' h='full' minH={24}>
                    <VStack spacing={1}>
                      <Text fontSize='xs' color='gray.600'>No open questions</Text>
                      <Text fontSize='2xs' color='gray.700' textAlign='center'>
                        Signal has sufficient context for this brief.
                      </Text>
                    </VStack>
                  </Flex>
                )
                : (
                  <VStack align='stretch' spacing={0}>
                    <Text fontSize='2xs' fontFamily='mono' color='gray.600' mb={2}>
                      {missingFlags.length} unanswered question{missingFlags.length !== 1 ? 's' : ''} · read-only in Phase 1
                    </Text>
                    {missingFlags.map((q, i) => (
                      <QuestionCard key={i} q={q} index={i} />
                    ))}
                  </VStack>
                )
              }
            </PanelCard>
          </GridItem>
        </Grid>
      </Box>
    </Flex>
  );
}
