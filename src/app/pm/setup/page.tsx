'use client';
import { Box, Flex } from '@chakra-ui/react';
import { SetupPanel } from '../../../components/pm/SetupPanel';

export default function SetupPage() {
  return (
    <Box h="100vh" bg="gray.950" overflow="hidden">
      <SetupPanel />
    </Box>
  );
}
