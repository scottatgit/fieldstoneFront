// src/app/analytics/page.tsx

import { Box, SimpleGrid, Stat, StatLabel, StatNumber, StatHelpText, Text } from '@chakra-ui/react';

const AnalyticsPage = () => {
  return (
    <Box p="6">
      <Text fontSize="2xl" fontWeight="bold" mb="4">
        Analytics
      </Text>
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
        <Stat>
          <StatLabel>Clicks</StatLabel>
          <StatNumber>150</StatNumber>
          <StatHelpText>Past 30 days</StatHelpText>
        </Stat>
        <Stat>
          <StatLabel>Conversions</StatLabel>
          <StatNumber>12</StatNumber>
          <StatHelpText>Past 30 days</StatHelpText>
        </Stat>
        <Stat>
          <StatLabel>Revenue</StatLabel>
          <StatNumber>$240</StatNumber>
          <StatHelpText>Past 30 days</StatHelpText>
        </Stat>
      </SimpleGrid>
    </Box>
  );
};

export default AnalyticsPage;
