'use client';
import { ChakraProvider, Box, HStack, Text, Button } from '@chakra-ui/react';
import pmTheme from '@/components/pm/pmTheme';
import SetupWizard from '@/components/pm/SetupWizard';
import { SummaryBar } from '@/components/pm/SummaryBar';
import { DemoBanner } from '@/components/pm/DemoBanner';

export default function AdvancedSettingsPage() {
  return (
    <ChakraProvider theme={pmTheme}>
      <DemoBanner />
      <SummaryBar summary={null} loading={false} />
      <Box bg="gray.950" minH="100vh" pt={4}>
        {/* Back link */}
        <Box px={6} pb={2}>
          <HStack spacing={2}>
            <Button
              size="xs"
              variant="ghost"
              color="gray.500"
              fontFamily="mono"
              onClick={() => { window.location.href = '/pm/setup'; }}
            >
              ← SIGNAL AI
            </Button>
            <Text fontSize="xs" color="gray.700" fontFamily="mono">/</Text>
            <Text fontSize="xs" color="gray.500" fontFamily="mono">ADVANCED SETTINGS</Text>
          </HStack>
        </Box>
        <SetupWizard />
      </Box>
    </ChakraProvider>
  );
}
