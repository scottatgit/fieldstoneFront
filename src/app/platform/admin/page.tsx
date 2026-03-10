'use client';
import { Box, VStack, Text, HStack, Badge, SimpleGrid, Button } from '@chakra-ui/react';

const ADMIN_ACTIONS = [
  { label: 'Run Global Ingestion',    desc: 'Trigger cross-tenant email scan',      color: 'orange' },
  { label: 'Flush AI Cache',          desc: 'Clear cached AI responses',             color: 'purple' },
  { label: 'Rebuild Embeddings',      desc: 'Regenerate semantic search vectors',    color: 'blue'   },
  { label: 'Promote Intel Patterns',  desc: 'Push emerging → global intel',          color: 'green'  },
  { label: 'Export Tenant Data',      desc: 'CSV dump for all tenants',              color: 'gray'   },
  { label: 'System Health Check',     desc: 'Run full diagnostic suite',             color: 'teal'   },
];

export default function PlatformAdminPage() {
  return (
    <Box p={6} maxW="1200px" mx="auto">
      <VStack spacing={6} align="stretch">
        <HStack justify="space-between">
          <VStack align="start" spacing={0}>
            <Text fontSize="xl" fontWeight="black" color="white" fontFamily="mono" letterSpacing="wider">ADMIN</Text>
            <Text fontSize="xs" color="gray.500" fontFamily="mono">Platform operations and system management</Text>
          </VStack>
          <Badge colorScheme="red" fontSize="xs" fontFamily="mono" px={3} py={1}>PLATFORM ADMIN ONLY</Badge>
        </HStack>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={3}>
          {ADMIN_ACTIONS.map(action => (
            <Box key={action.label} p={4} bg="gray.900" borderRadius="md"
              border="1px solid" borderColor="gray.800"
              _hover={{ borderColor: `${action.color}.700` }} transition="border-color 0.15s">
              <VStack spacing={3} align="stretch">
                <VStack spacing={0} align="start">
                  <Text fontSize="sm" fontWeight="bold" color="white" fontFamily="mono">{action.label}</Text>
                  <Text fontSize="xs" color="gray.500">{action.desc}</Text>
                </VStack>
                <Button size="xs" colorScheme={action.color} variant="outline"
                  fontFamily="mono" fontSize="9px" letterSpacing="wider" isDisabled>
                  EXECUTE
                </Button>
              </VStack>
            </Box>
          ))}
        </SimpleGrid>
        <Box p={4} bg="gray.900" borderRadius="md" border="1px solid" borderColor="yellow.900">
          <Text fontSize="xs" color="yellow.600" fontFamily="mono">
            ⚠️ Admin actions are logged and attributed to your user account.
          </Text>
        </Box>
      </VStack>
    </Box>
  );
}
