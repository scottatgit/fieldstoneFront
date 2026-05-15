'use client';
import {
  Box, Flex, Text, Badge, VStack, HStack, Spinner, Button, Divider, Grid, GridItem, Textarea,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { pmFetch } from '@/lib/demoApi';
import {
  WorkingBriefDetail, ClientStory, ClosedBriefSummary, JsonArrayish,
  ClientStorySummary, ClientStoryIssuePatterns, ClientStoryRiskIndicators,
  ClientStoryTimeline,
} from './types';
import { safeJsonArray, safeStr, safeJsonArrayStr } from './BriefDetailPanel';

interface Props {
  ticketKey: string;
  clientKey: string | null;
  clientName: string;
  brief: WorkingBriefDetail | null;
  onClose: () => void;
  onViewEvidence: () => void;
  pmApi: string;
  onNoteSaved?: () => void;
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


// ── Readable question label helper ───────────────────────────────────────────
const FLAG_LABELS: Record<string, string> = {
  no_context_summary:      'What context is missing from this brief?',
  no_resolution_direction: 'What direction should this work move toward?',
  no_expectation:          'What does the client expect as the outcome?',
  no_constraints:          'Are there access, timing, vendor, or environment constraints?',
  no_situation:            'What is the current situation and problem description?',
  no_follow_up_items:      'What follow-up actions are needed after this work?',
  no_risk_flags:           'Are there any known risks or blockers?',
  no_intel_snapshot:       'Is there relevant tool or client intel that should inform this brief?',
  low_confidence:          'What additional detail would increase confidence in this brief?',
  missing_client_context:  'What client-specific context is needed to proceed?',
};

function toReadableQuestion(flag: string): string {
  // If it already looks like a sentence (contains spaces), return as-is
  if (flag.includes(' ')) return flag;
  // Check known flag map
  if (FLAG_LABELS[flag]) return FLAG_LABELS[flag];
  // Humanize unknown snake_case flags
  return flag.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase()) + '?';
}

interface QuestionCardProps {
  q: string;
  index: number;
  ticketKey: string;
  pmApi: string;
  onSaved?: () => void;
}

function QuestionCard({ q, index, ticketKey, pmApi, onSaved }: QuestionCardProps) {
  type SaveState = 'idle' | 'saving' | 'saved' | 'error';
  const [answer, setAnswer] = useState('');
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSave = async () => {
    if (!answer.trim() || saveState === 'saving' || saveState === 'saved') return;
    setSaveState('saving');
    setErrorMsg(null);
    const noteContent = [
      '**Briefing Room — Question Answered**',
      '',
      `**Question:** ${q}`,
      '',
      `**Answer:** ${answer.trim()}`,
      '',
      '**Source:** Briefing Room',
    ].join('\n');
    try {
      const res = await pmFetch(
        `/api/tickets/${ticketKey}/notes`,
        pmApi,
        { method: 'POST', body: JSON.stringify({ content: noteContent, author: 'briefing_room', note_source: 'manual' }) },
      );
      if (res && (res as { status?: string }).status === 'error') {
        throw new Error((res as { message?: string }).message || 'Save failed');
      }
      setSaveState('saved');
      onSaved?.();
    } catch (e: unknown) {
      setSaveState('error');
      setErrorMsg(e instanceof Error ? e.message : 'Failed to save. Try again.');
    }
  };

  return (
    <Box px={3} py={2.5} bg='gray.800' border='1px solid' borderColor='yellow.900'
      borderRadius='md' mb={2}>
      <HStack spacing={2} align='flex-start' mb={saveState === 'saved' ? 0 : 2}>
        <Box
          flexShrink={0} w={5} h={5} borderRadius='full'
          bg={saveState === 'saved' ? 'green.900' : 'yellow.900'}
          border='1px solid'
          borderColor={saveState === 'saved' ? 'green.600' : 'yellow.700'}
          display='flex' alignItems='center' justifyContent='center' mt={0.5}
        >
          {saveState === 'saved' ? (
            <Text fontSize='2xs' fontWeight='black' fontFamily='mono' color='green.400'>✓</Text>
          ) : (
            <Text fontSize='2xs' fontWeight='black' fontFamily='mono' color='yellow.400'>{index + 1}</Text>
          )}
        </Box>
        <Text fontSize='xs' color={saveState === 'saved' ? 'gray.400' : 'gray.200'} lineHeight='1.5'>{toReadableQuestion(q)}</Text>
      </HStack>
      {saveState !== 'saved' && (
        <VStack align='stretch' spacing={1.5} mt={1} pl={7}>
          <Textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder='Answer this question...'
            size='xs'
            rows={2}
            bg='gray.900'
            border='1px solid'
            borderColor='gray.600'
            color='gray.100'
            fontSize='xs'
            resize='vertical'
            isDisabled={saveState === 'saving'}
            _placeholder={{ color: 'gray.600' }}
            _focus={{ borderColor: 'yellow.600', boxShadow: 'none' }}
          />
          {errorMsg && (
            <Text fontSize='2xs' color='red.400'>{errorMsg}</Text>
          )}
          <Button
            size='xs'
            colorScheme='yellow'
            variant='ghost'
            alignSelf='flex-end'
            isLoading={saveState === 'saving'}
            loadingText='Saving...'
            isDisabled={!answer.trim() || saveState === 'saving'}
            onClick={handleSave}
          >
            Save to Notes
          </Button>
        </VStack>
      )}
      {saveState === 'saved' && (
        <Text pl={7} fontSize='2xs' color='green.400' mt={0.5}>✓ Saved to notes</Text>
      )}
    </Box>
  );
}

export function BriefingRoomView({
  ticketKey, clientKey, clientName, brief, onClose, onViewEvidence, pmApi, onNoteSaved,
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

  const missingFlags = safeJsonArrayStr(brief?.missing_context_flags as JsonArrayish<unknown>);
  const riskFlags = safeJsonArrayStr(brief?.risk_flags as JsonArrayish<unknown>);
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
                  {/* ── Client overview stats ── */}
                  {story && story.summary && (
                    <>
                      <Box>
                        <SectionLabel>Client Overview</SectionLabel>
                        <HStack spacing={2} flexWrap='wrap'>
                          <Badge colorScheme='gray' fontSize='2xs' variant='subtle'>
                            {story.summary.total_briefs} brief{story.summary.total_briefs !== 1 ? 's' : ''}
                          </Badge>
                          {story.summary.open_risk_count > 0 && (
                            <Badge colorScheme='red' fontSize='2xs' variant='subtle'>
                              {story.summary.open_risk_count} at-risk
                            </Badge>
                          )}
                          {story.summary.trust?.trend && story.summary.trust.trend !== 'unknown' && (
                            <Badge
                              colorScheme={
                                story.summary.trust.trend === 'improving' ? 'green' :
                                story.summary.trust.trend === 'declining' ? 'red' : 'gray'
                              }
                              fontSize='2xs' variant='subtle'
                            >
                              trust: {story.summary.trust.trend}
                            </Badge>
                          )}
                          {story.data_quality === 'thin' && (
                            <Badge colorScheme='orange' fontSize='2xs' variant='subtle'>limited history</Badge>
                          )}
                          {story.data_quality === 'empty' && (
                            <Badge colorScheme='gray' fontSize='2xs' variant='subtle'>no history yet</Badge>
                          )}
                        </HStack>
                      </Box>

                      {/* Outcome distribution */}
                      {story.summary.total_briefs > 0 && (
                        <>
                          <Divider borderColor='gray.800' />
                          <Box>
                            <SectionLabel>Outcomes ({story.window_days}d window)</SectionLabel>
                            <HStack spacing={1.5} flexWrap='wrap'>
                              {story.summary.outcome_distribution.resolved > 0 && (
                                <Badge colorScheme='green' fontSize='2xs' variant='subtle'>
                                  {story.summary.outcome_distribution.resolved} resolved
                                </Badge>
                              )}
                              {story.summary.outcome_distribution.mitigated > 0 && (
                                <Badge colorScheme='blue' fontSize='2xs' variant='subtle'>
                                  {story.summary.outcome_distribution.mitigated} mitigated
                                </Badge>
                              )}
                              {story.summary.outcome_distribution.at_risk > 0 && (
                                <Badge colorScheme='orange' fontSize='2xs' variant='subtle'>
                                  {story.summary.outcome_distribution.at_risk} at-risk
                                </Badge>
                              )}
                              {story.summary.outcome_distribution.escalated > 0 && (
                                <Badge colorScheme='red' fontSize='2xs' variant='subtle'>
                                  {story.summary.outcome_distribution.escalated} escalated
                                </Badge>
                              )}
                            </HStack>
                          </Box>
                        </>
                      )}

                      {/* Recurring patterns */}
                      {(story.issue_patterns?.recurring_categories ?? []).length > 0 && (
                        <>
                          <Divider borderColor='gray.800' />
                          <Box>
                            <SectionLabel>Recurring Patterns</SectionLabel>
                            <HStack spacing={1.5} flexWrap='wrap'>
                              {(story.issue_patterns.recurring_categories ?? []).slice(0, 4).map((cat, i) => (
                                <Badge key={i} colorScheme='purple' fontSize='2xs' variant='subtle'>
                                  {safeStr(cat)}
                                </Badge>
                              ))}
                            </HStack>
                          </Box>
                        </>
                      )}

                      {/* Risk flag summary */}
                      {(story.risk_indicators?.risk_flag_summary ?? []).length > 0 && (
                        <>
                          <Divider borderColor='gray.800' />
                          <Box>
                            <SectionLabel>Known Risk Flags</SectionLabel>
                            <VStack align='stretch' spacing={1}>
                              {(story.risk_indicators.risk_flag_summary ?? []).slice(0, 3).map((flag, i) => (
                                <HStack key={i} spacing={2} align='flex-start'>
                                  <Box w={1.5} h={1.5} borderRadius='full'
                                    bg='red.400' mt={1.5} flexShrink={0} />
                                  <Text fontSize='2xs' color='gray.400' lineHeight='1.4'>
                                    {safeStr(flag)}
                                  </Text>
                                </HStack>
                              ))}
                            </VStack>
                          </Box>
                        </>
                      )}
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
                                {safeStr(b.primary_issue) || b.ticket_key}
                              </Text>
                              <HStack spacing={1.5} mt={0.5}>
                                {b.outcome_type && (
                                  <Badge colorScheme='gray' fontSize='2xs' variant='subtle'>
                                    {safeStr(b.outcome_type)}
                                  </Badge>
                                )}
                                {b.issue_category && (
                                  <Text fontSize='2xs' fontFamily='mono' color='gray.600'>
                                    {safeStr(b.issue_category)}
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
                        ? <Text fontSize='xs' color='gray.300' lineHeight='1.5'>{safeStr(brief.situation)}</Text>
                        : <Text fontSize='2xs' color='gray.700' fontFamily='mono'>—</Text>
                      }
                    </Box>

                    <Divider borderColor='gray.800' />

                    <Box>
                      <SectionLabel>Expectation</SectionLabel>
                      {brief.expectation
                        ? <Text fontSize='xs' color='gray.300' lineHeight='1.5'>{safeStr(brief.expectation)}</Text>
                        : <Text fontSize='2xs' color='gray.700' fontFamily='mono'>—</Text>
                      }
                    </Box>

                    {brief.resolution_direction && (
                      <>
                        <Divider borderColor='gray.800' />
                        <Box>
                          <SectionLabel>Resolution Direction</SectionLabel>
                          <Text fontSize='xs' color='gray.300' lineHeight='1.5'>
                            {safeStr(brief.resolution_direction)}
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
                      {missingFlags.length} open question{missingFlags.length !== 1 ? 's' : ''} · answer saves as a note
                    </Text>
                    {missingFlags.map((q, i) => (
                      <QuestionCard key={i} q={q} index={i} ticketKey={ticketKey} pmApi={pmApi} onSaved={onNoteSaved} />
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
