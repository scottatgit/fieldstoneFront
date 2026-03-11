'use client';
import { Box, VStack, HStack, Text, Badge } from '@chakra-ui/react';

interface Props {
  onCreate: () => void;
  onJoin:   () => void;
  onReclaim: () => void;
}

export function Step1PathSelect({ onCreate, onJoin, onReclaim }: Props) {
  return (
    <VStack align="stretch" spacing={6}>
      <VStack align="start" spacing={1}>
        <HStack spacing={2}>
          <Text fontSize="lg" fontWeight="black" fontFamily="mono" color="blue.300" letterSpacing="widest">
            SIGNAL
          </Text>
          <Badge colorScheme="blue" fontSize="2xs" fontFamily="mono">WELCOME</Badge>
        </HStack>
        <Text fontSize="sm" fontWeight="bold" color="gray.100">Welcome to Signal</Text>
        <Text fontSize="xs" color="gray.400">How would you like to get started?</Text>
      </VStack>

      <VStack align="stretch" spacing={3}>
        <Box
          as="button" onClick={onCreate}
          p={5} borderRadius="lg"
          border="1px solid" borderColor="blue.700"
          bg="blue.950" textAlign="left"
          _hover={{ borderColor: 'blue.400', bg: 'blue.900' }}
          transition="all 0.15s"
        >
          <VStack align="start" spacing={1}>
            <Text fontSize="sm" fontWeight="bold" color="blue.200" fontFamily="mono">CREATE A WORKSPACE</Text>
            <Text fontSize="xs" color="gray.400">Set up a new Signal workspace for your team.</Text>
          </VStack>
        </Box>

        <Box
          as="button" onClick={onJoin}
          p={5} borderRadius="lg"
          border="1px solid" borderColor="gray.700"
          bg="gray.800" textAlign="left"
          _hover={{ borderColor: 'gray.500', bg: 'gray.750' }}
          transition="all 0.15s"
        >
          <VStack align="start" spacing={1}>
            <Text fontSize="sm" fontWeight="bold" color="gray.200" fontFamily="mono">JOIN A WORKSPACE</Text>
            <Text fontSize="xs" color="gray.400">Accept an invite link from your admin.</Text>
          </VStack>
        </Box>

        <Box
          as="button" onClick={onReclaim}
          p={5} borderRadius="lg"
          border="1px solid" borderColor="purple.800"
          bg="purple.950" textAlign="left"
          _hover={{ borderColor: 'purple.500', bg: 'purple.900' }}
          transition="all 0.15s"
        >
          <VStack align="start" spacing={1}>
            <Text fontSize="sm" fontWeight="bold" color="purple.200" fontFamily="mono">ACCESS EXISTING WORKSPACE</Text>
            <Text fontSize="xs" color="gray.400">Already have a workspace? Link your account by slug.</Text>
          </VStack>
        </Box>
      </VStack>
    </VStack>
  );
}
