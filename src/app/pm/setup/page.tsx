'use client';
import { Box, Flex } from '@chakra-ui/react';
import { SetupPanel } from '../../../components/pm/SetupPanel';
import { SummaryBar } from '../../../components/pm/SummaryBar';

export default function SetupPage() {
  return (
    <Flex direction="column" minH="100dvh" bg="gray.950" overflowX="hidden">
      <SummaryBar summary={null} loading={false} />
      <Box flex={1} overflowY="auto">
        <SetupPanel />
      </Box>
    </Flex>
  );
}
