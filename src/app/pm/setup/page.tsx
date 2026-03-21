/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';
import { useState, useEffect } from 'react';
import { ChakraProvider, Box, Spinner, Center } from '@chakra-ui/react';
import pmTheme from '@/components/pm/pmTheme';
import AIKeyGate from '@/components/pm/AIKeyGate';
import SignalAIConsole from '@/components/pm/SignalAIConsole';
import { SummaryBar } from '@/components/pm/SummaryBar';
import { isDemoMode } from '@/lib/demoApi';
import { DemoBanner } from '@/components/pm/DemoBanner';

// Stages: loading -> need_ai_key -> ready
// Note: workspace creation is handled at signup/onboarding.
// By the time a user reaches /pm/setup, they always have a workspace.
type Stage = 'loading' | 'need_ai_key' | 'ready';

const PM_API = '/pm-api';

export default function SetupPage() {
  const [stage, setStage] = useState<Stage>('loading');

  useEffect(() => {
    // Demo mode — skip all gates, go straight to Signal AI
    if (isDemoMode()) { setStage('ready'); return; }
    (async () => {
      try {
        const r = await fetch(PM_API + '/api/setup/status', { credentials: 'include' });
        const d = await r.json();
        // Workspace existence is guaranteed by the time user reaches this page.
        // Skip directly to AI key check.
        if (!d.has_ai_key) { setStage('need_ai_key'); return; }
        setStage('ready');
      } catch {
        // Fallback: require AI key — never show dumb console
        setStage('need_ai_key');
      }
    })();
  }, []);

  return (
    <ChakraProvider theme={pmTheme}>
      <DemoBanner />
      <SummaryBar summary={null} loading={false} />
      {stage === 'loading' && (
        <Center h="100vh" bg="gray.950">
          <Spinner color="blue.400" size="xl" />
        </Center>
      )}
      {stage === 'need_ai_key' && (
        <AIKeyGate onConnected={() => setStage('ready')} />
      )}
      {stage === 'ready' && <SignalAIConsole />}
    </ChakraProvider>
  );
}
