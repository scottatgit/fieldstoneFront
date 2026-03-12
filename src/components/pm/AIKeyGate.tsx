/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';
import { useState } from 'react';
import { Box, VStack, HStack, Text, Input, Button, Badge, InputGroup, InputRightElement, IconButton } from '@chakra-ui/react';

const PM_API = '/pm-api';

export default function AIKeyGate({ onConnected }: { onConnected: () => void }) {
  const [provider, setProvider] = useState<'openai' | 'openrouter'>('openrouter');
  const [key, setKey] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const connect = async () => {
    if (!key) return;
    setLoading(true); setError('');
    try {
      const field = provider === 'openai' ? 'openai_api_key' : 'openrouter_api_key';
      const r = await fetch(PM_API + '/api/settings', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: key }),
      });
      if (!r.ok) throw new Error(await r.text());
      onConnected();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not save key');
    } finally { setLoading(false); }
  };

  return (
    <Box minH="100vh" bg="gray.950" display="flex" alignItems="center" justifyContent="center" px={4}>
      <Box w="100%" maxW="480px">
        <VStack spacing={8} align="stretch">
          <VStack spacing={2} align="start">
            <Badge colorScheme="purple" fontFamily="mono" fontSize="9px" letterSpacing="wider">STEP 2 OF 2</Badge>
            <Text fontSize="2xl" fontWeight="black" color="white" fontFamily="mono">Connect your AI brain</Text>
            <Text fontSize="sm" color="gray.400">
              Signal uses AI to analyze tickets, brief your technicians, and guide setup. Paste your API key to activate.
            </Text>
          </VStack>
          <VStack spacing={4} align="stretch">
            <VStack align="start" spacing={2}>
              <Text fontSize="xs" color="gray.400" fontFamily="mono" textTransform="uppercase" letterSpacing="wider">Provider</Text>
              <HStack spacing={2}>
                {(["openrouter", "openai"] as const).map(p => (
                  <Button key={p} size="sm" fontFamily="mono"
                    colorScheme={provider === p ? "purple" : "gray"}
                    variant={provider === p ? "solid" : "outline"}
                    onClick={() => setProvider(p)}>
                    {p === "openai" ? "OPENAI" : "OPENROUTER"}
                  </Button>
                ))}
              </HStack>
              <Text fontSize="10px" color="gray.600" fontFamily="mono">
                {provider === "openrouter"
                  ? "Recommended — access to all models via openrouter.ai/keys"
                  : "Direct GPT-4o access via platform.openai.com/api-keys"}
              </Text>
            </VStack>
            <VStack align="start" spacing={1}>
              <Text fontSize="xs" color="gray.400" fontFamily="mono" textTransform="uppercase" letterSpacing="wider">API Key</Text>
              <InputGroup size="md">
                <Input bg="gray.800" borderColor="gray.700" color="white" fontFamily="mono" pr="4.5rem"
                  type={show ? "text" : "password"}
                  value={key} onChange={e => setKey(e.target.value)}
                  placeholder={provider === "openai" ? "sk-..." : "sk-or-..."}
                  _placeholder={{ color: "gray.600" }} _focus={{ borderColor: "purple.400", boxShadow: "none" }}
                  onKeyDown={e => { if (e.key === "Enter") connect(); }} />
                <InputRightElement width="4.5rem">
                  <Button h="1.75rem" size="xs" variant="ghost" color="gray.500" fontFamily="mono"
                    onClick={() => setShow(s => !s)}>{show ? "HIDE" : "SHOW"}</Button>
                </InputRightElement>
              </InputGroup>
            </VStack>
          </VStack>
          {error && <Text fontSize="sm" color="red.400" fontFamily="mono">{error}</Text>}
          <Button colorScheme="purple" fontFamily="mono" fontWeight="bold" size="lg"
            isDisabled={!key} isLoading={loading} loadingText="CONNECTING..."
            onClick={connect}>ACTIVATE SIGNAL AI</Button>
          <Text fontSize="10px" color="gray.700" fontFamily="mono" textAlign="center">
            Your key is stored encrypted in your workspace. Signal never shares it.
          </Text>
        </VStack>
      </Box>
    </Box>
  );
}
