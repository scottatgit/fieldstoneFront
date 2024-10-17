"use client";
import { ChakraProvider, Box, Text, Button } from "@chakra-ui/react";
import theme from "../theme";
import { useState } from "react";
import RegisterModal from "../components/RegisterModal";

export default function Landing() {
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  const handleRegisterOpen = () => setIsRegisterOpen(true);
  const handleRegisterClose = () => setIsRegisterOpen(false);

  return (
    <ChakraProvider theme={theme}>
      <Box as="main" className="max-w-4xl mx-auto py-10 px-6">
        <Box textAlign="center" py={10}>
          <Text fontSize="4xl" fontWeight="bold" mb={4}>
            Transform Your Business with Cutting-Edge AI Frameworks
          </Text>
          <Text fontSize="lg" color="gray.600" mb={8}>
            We empower businesses with tailored AI solutions and access to top resources to drive growth and innovation.
          </Text>
          <Button colorScheme="blue" size="lg" onClick={handleRegisterOpen}>
            Free Checklist
          </Button>
        </Box>

        {/* Register Modal */}
        <RegisterModal isOpen={isRegisterOpen} onClose={handleRegisterClose} />
      </Box>
    </ChakraProvider>
  );
}
