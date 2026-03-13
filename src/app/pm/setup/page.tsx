/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';
import { useState, useEffect } from 'react';
import { ChakraProvider, Box, Spinner, Center } from '@chakra-ui/react';
import pmTheme from '@/components/pm/pmTheme';
import WorkspaceCreateGate from '@/components/pm/WorkspaceCreateGate';
import AIKeyGate from '@/components/pm/AIKeyGate';
import SignalAIConsole from '@/components/pm/SignalAIConsole';
import { SummaryBar } from '@/components/pm/SummaryBar';

type Stage = 'loading' | 'need_workspace' | 'need_ai_key' | 'ready';

const PM_API = '/pm-api';

export default function SetupPage() {
  const [stage, setStage] = useState<Stage>('loading');

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(PM_API + '/api/setup/status', { credentials: 'include' });
        const d = await r.json();
        if (!d.has_workspace) { setStage('need_workspace'); return; }
        if (!d.has_ai_key) { setStage('need_ai_key'); return; }
        setStage('ready');
      } catch {
        setStage('need_ai_key'); // fallback: require AI key — never show dumb console
      }
    })();
  }, []);

  return (
    <ChakraProvider theme={pmTheme}>
      <SummaryBar summary={null} loading={false} />
      {stage === 'loading' && (
        <Center h="100vh" bg="gray.950">
          <Spinner color="blue.400" size="xl" />
        </Center>
      )}
      {stage === 'need_workspace' && (
        <WorkspaceCreateGate onCreated={() => setStage('need_ai_key')} />
      )}
      {stage === 'need_ai_key' && (
        <AIKeyGate onConnected={() => setStage('ready')} />
      )}
      {stage === 'ready' && <SignalAIConsole />}
    </ChakraProvider>
  );
}
