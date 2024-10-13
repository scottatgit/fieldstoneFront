import { Box, Text } from '@chakra-ui/react';

const GamePage = () => {
  return (
    <Box p="6">
      <Text fontSize="2xl" fontWeight="bold" mb="4">
        Games
      </Text>
      <Text fontWeight="bold">Your Entries:</Text>
      <Text>10 entries in the past month</Text>
      <Text fontWeight="bold" mt="4">Recent Wins:</Text>
      <Text>Ad space won:  Banners won: Position won: </Text>
    </Box>
  );
};

export default GamePage;
