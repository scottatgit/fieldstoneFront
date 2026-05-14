'use client';
import {
  Box, Flex, Text, Badge, Grid, GridItem, HStack, VStack,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { pmFetch } from '@/lib/demoApi';
import { WorkingBriefSummary, WorkingBriefDetail } from './types';
import { ClientBriefList } from './ClientBriefList';
import { OpenBriefsList } from './OpenBriefsList';
import { BriefDetailPanel } from './BriefDetailPanel';
import { BriefingRoomView } from './BriefingRoomView';
import { EvidenceDrawer } from './EvidenceDrawer';

const PM_API = '/pm-api';

interface Props {
  onOpenTicket: (ticketKey: string) => void;
  pmApi?: string;
}

export function TodayBriefsView({ onOpenTicket }: Props) {
  const [selectedClientKey, setSelectedClientKey] = useState<string | null>(null);
  const [selectedClientName, setSelectedClientName] = useState<string>('');
  const [selectedBrief, setSelectedBrief] = useState<WorkingBriefSummary | null>(null);
  const [briefDetail, setBriefDetail] = useState<WorkingBriefDetail | null>(null);
  const [showBriefingRoom, setShowBriefingRoom] = useState(false);
  const [evidenceOpen, setEvidenceOpen] = useState(false);

  // Fetch full WBL detail when brief is selected — needed by BriefingRoom
  useEffect(() => {
    if (!selectedBrief) { setBriefDetail(null); return; }
    let cancelled = false;
    setBriefDetail(null);
    pmFetch(`/api/tickets/${selectedBrief.ticket_key}/working-brief`, PM_API)
      .then((d: unknown) => { if (!cancelled) setBriefDetail(d as WorkingBriefDetail); })
      .catch(() => { /* BriefDetailPanel shows its own error — swallow here */ });
    return () => { cancelled = true; };
  }, [selectedBrief]);

  function handleSelectClient(key: string, name: string) {
    setSelectedClientKey(key);
    setSelectedClientName(name);
    setSelectedBrief(null);
    setBriefDetail(null);
    setShowBriefingRoom(false);
  }

  function handleSelectBrief(brief: WorkingBriefSummary) {
    setSelectedBrief(brief);
    setShowBriefingRoom(false);
  }

  // Full-screen Briefing Room overlay
  if (showBriefingRoom && selectedBrief) {
    return (
      <Box h='full' display='flex' flexDirection='column' overflow='hidden'>
        <BriefingRoomView
          ticketKey={selectedBrief.ticket_key}
          clientKey={selectedBrief.client_key}
          clientName={selectedBrief.client_display_name || selectedClientName}
          brief={briefDetail}
          onClose={() => setShowBriefingRoom(false)}
          onViewEvidence={() => { setEvidenceOpen(true); }}
          pmApi={PM_API}
        />
        <EvidenceDrawer
          ticketKey={selectedBrief.ticket_key}
          ticketTitle={selectedBrief.ticket_title}
          isOpen={evidenceOpen}
          onClose={() => setEvidenceOpen(false)}
          onOpenTicket={(key) => { setEvidenceOpen(false); setShowBriefingRoom(false); onOpenTicket(key); }}
          pmApi={PM_API}
        />
      </Box>
    );
  }

  return (
    <Flex direction='column' h='full' overflow='hidden'>
      {/* Header */}
      <Box
        px={4} py={2.5}
        borderBottom='1px solid' borderColor='gray.700'
        flexShrink={0} bg='gray.950'
      >
        <HStack spacing={3}>
          <Text fontSize='xs' fontFamily='mono' fontWeight='bold'
            color='gray.400' letterSpacing='wider'>
            BRIEFS
          </Text>
          {selectedClientKey && (
            <Badge colorScheme='blue' fontSize='2xs' variant='subtle'>
              {selectedClientName}
            </Badge>
          )}
          {selectedBrief && (
            <Badge colorScheme='gray' fontSize='2xs' variant='subtle'
              fontFamily='mono'>
              {selectedBrief.ticket_key}
            </Badge>
          )}
        </HStack>
      </Box>

      {/* Three-column layout */}
      <Grid
        flex={1}
        minH={0}
        templateColumns={{
          base: '1fr',
          md: selectedBrief
            ? '180px 260px 1fr'
            : selectedClientKey
              ? '180px 1fr'
              : '220px 1fr',
        }}
        gap={0}
      >
        {/* Column 1: Client list */}
        <GridItem
          borderRight='1px solid' borderColor='gray.700'
          overflow='hidden'
          display='flex'
          flexDirection='column'
        >
          <Box
            px={3} py={2}
            borderBottom='1px solid' borderColor='gray.800'
            flexShrink={0}
          >
            <Text fontSize='2xs' fontFamily='mono' fontWeight='bold'
              color='gray.600' letterSpacing='wider'>
              CLIENTS
            </Text>
          </Box>
          <ClientBriefList
            onSelectClient={handleSelectClient}
            selectedClientKey={selectedClientKey}
            pmApi={PM_API}
          />
        </GridItem>

        {/* Column 2: Open briefs for selected client */}
        {selectedClientKey && (
          <GridItem
            borderRight={selectedBrief ? '1px solid' : undefined}
            borderColor='gray.700'
            overflow='hidden'
            display='flex'
            flexDirection='column'
          >
            <Box
              px={3} py={2}
              borderBottom='1px solid' borderColor='gray.800'
              flexShrink={0}
            >
              <Text fontSize='2xs' fontFamily='mono' fontWeight='bold'
                color='gray.600' letterSpacing='wider'
                noOfLines={1}
              >
                {selectedClientName.toUpperCase()}
              </Text>
            </Box>
            <OpenBriefsList
              clientKey={selectedClientKey}
              clientName={selectedClientName}
              onSelectBrief={handleSelectBrief}
              selectedBriefId={selectedBrief?.brief_id ?? null}
              pmApi={PM_API}
            />
          </GridItem>
        )}

        {/* Column 3: Brief detail panel */}
        {selectedBrief && (
          <GridItem
            overflow='hidden'
            display='flex'
            flexDirection='column'
          >
            <BriefDetailPanel
              ticketKey={selectedBrief.ticket_key}
              onOpenBriefingRoom={() => setShowBriefingRoom(true)}
              onViewEvidence={() => setEvidenceOpen(true)}
              pmApi={PM_API}
            />
          </GridItem>
        )}

        {/* No client selected: prompt */}
        {!selectedClientKey && (
          <GridItem
            overflow='hidden'
            display='flex'
            alignItems='center'
            justifyContent='center'
          >
            <VStack spacing={2} p={6}>
              <Text fontSize='sm' color='gray.600' fontFamily='mono'>
                Select a client to see open briefs
              </Text>
              <Text fontSize='xs' color='gray.700' textAlign='center'>
                Clients with active working briefs are listed on the left.
              </Text>
            </VStack>
          </GridItem>
        )}

        {/* Client selected, no brief selected yet */}
        {selectedClientKey && !selectedBrief && (
          <GridItem
            overflow='hidden'
            display='flex'
            alignItems='center'
            justifyContent='center'
          >
            <VStack spacing={2} p={6}>
              <Text fontSize='sm' color='gray.600' fontFamily='mono'>
                Select a brief
              </Text>
              <Text fontSize='xs' color='gray.700' textAlign='center'>
                Choose a brief to see details and enter the Briefing Room.
              </Text>
            </VStack>
          </GridItem>
        )}
      </Grid>

      {/* Evidence drawer */}
      <EvidenceDrawer
        ticketKey={selectedBrief?.ticket_key ?? null}
        ticketTitle={selectedBrief?.ticket_title}
        isOpen={evidenceOpen}
        onClose={() => setEvidenceOpen(false)}
        onOpenTicket={(key) => { setEvidenceOpen(false); onOpenTicket(key); }}
        pmApi={PM_API}
      />
    </Flex>
  );
}
