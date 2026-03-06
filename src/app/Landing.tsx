"use client";
import { ChakraProvider, Box, Text, Button, HStack, Badge } from "@chakra-ui/react";
import theme from "../theme";
import { useState } from "react";
import RegisterModal from "../components/RegisterModal";

export default function Landing() {
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  return (
    <ChakraProvider theme={theme}>
      <Box as="main" className="max-w-4xl mx-auto py-10 px-6">
        <Box textAlign="center" py={16}>

          <Text fontSize="5xl" fontWeight="black" mb={2} letterSpacing="tight">
            Signal
          </Text>
          <Text fontSize="xl" fontWeight="medium" color="gray.500" mb={6}>
            Operational Intelligence for Service Teams
          </Text>
          <Text fontSize="lg" color="gray.600" mb={4} maxW="2xl" mx="auto">
            Signal turns ticket noise into operational signal.
          </Text>
          <Text fontSize="md" color="gray.500" mb={10} maxW="2xl" mx="auto">
            Signal surfaces the patterns, risks, and recurring issues hidden inside service operations.
          </Text>

          {/* Module preview */}
          <HStack justify="center" spacing={4} mb={10} flexWrap="wrap">
            <Badge colorScheme="blue" fontSize="sm" px={3} py={1} borderRadius="full">
              Signal: Tickets
            </Badge>
            <Badge colorScheme="gray" fontSize="sm" px={3} py={1} borderRadius="full" opacity={0.5}>
              Signal: Ops (coming soon)
            </Badge>
            <Badge colorScheme="gray" fontSize="sm" px={3} py={1} borderRadius="full" opacity={0.5}>
              Signal: Sales (coming soon)
            </Badge>
          </HStack>

          <Button colorScheme="blue" size="lg" onClick={() => setIsRegisterOpen(true)}>
            Request Access
          </Button>
        </Box>

        <RegisterModal isOpen={isRegisterOpen} onClose={() => setIsRegisterOpen(false)} />
      </Box>
    </ChakraProvider>
  );
}
