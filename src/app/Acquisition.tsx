"use client";
import { ChakraProvider, Box, Flex, Text, Button, VStack, Divider } from "@chakra-ui/react";
import theme from "../theme";
import { ArrowForwardIcon } from "@chakra-ui/icons";
import { useState } from "react";
import RegisterModal from "../components/RegisterModal";
import { useAppSelector } from "../redux/hooks"; // Assumes you have a selector to check auth status
import { useRouter } from "next/navigation";

export default function Acquisition() {
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const { isAuthenticated } = useAppSelector((state) => state.auth); // Checking if user is authenticated
  const router = useRouter();

  const handleRegisterOpen = () => setIsRegisterOpen(true);
  const handleRegisterClose = () => setIsRegisterOpen(false);

  const handleGetStarted = () => {
    if (isAuthenticated) {
      router.push('/first-steps'); // Redirect to First Steps page if authenticated
    } else {
      handleRegisterOpen(); // Open Register Modal if not authenticated
    }
  };

  return (
    <ChakraProvider theme={theme}>
      <Box as="main" className="max-w-5xl mx-auto py-12 px-6">
        
        {/* Hero Section */}
        <Box textAlign="center" py={20}>
          <Text fontSize="4xl" fontWeight="bold" mb={4}>
            Scaling AI Solutions for Maximum Impact
          </Text>
          <Text fontSize="xl" color="gray.600" mb={8}>
            Helping businesses harness the transformative power of AI with customized frameworks and trusted expertise.
          </Text>
          <Button colorScheme="blue" size="lg" rightIcon={<ArrowForwardIcon />} onClick={handleGetStarted}>
            Get Started
          </Button>
        </Box>

        {/* Value Propositions */}
        <Box py={10}>
          <Flex direction={{ base: "column", md: "row" }} textAlign="center" gap={6}>
            <VStack>
              <Text fontSize="2xl" fontWeight="bold">Comprehensive AI Frameworks</Text>
              <Text fontSize="md" color="gray.600">
                Structured implementation for sustained AI growth and scalability, tailored to meet your unique goals.
              </Text>
            </VStack>
            <VStack>
              <Text fontSize="2xl" fontWeight="bold">Exclusive Access to Resources</Text>
              <Text fontSize="md" color="gray.600">
                Gain priority access to AI resources and top freelancers to ensure your AI solutions are expertly executed.
              </Text>
            </VStack>
            <VStack>
              <Text fontSize="2xl" fontWeight="bold">Proven Track Record</Text>
              <Text fontSize="md" color="gray.600">
                Results-backed methodologies that empower businesses to thrive in an AI-driven landscape.
              </Text>
            </VStack>
          </Flex>
        </Box>

        <Divider my={12} />

        {/* Core Services Section */}
        <Box py={10}>
          <Text fontSize="3xl" fontWeight="bold" textAlign="center" mb={8}>
            Our Services
          </Text>
          <Flex direction={{ base: "column", md: "row" }} gap={6}>
            <Box textAlign="left" flex="1">
              <Text fontSize="2xl" fontWeight="bold">Text-to-Video</Text>
              <Text fontSize="md" color="gray.600" mt={2}>
                Convert content into video with AI-driven visuals, engaging your audience in an innovative way.
              </Text>
            </Box>
            <Box textAlign="left" flex="1">
              <Text fontSize="2xl" fontWeight="bold">Website Integrations</Text>
              <Text fontSize="md" color="gray.600" mt={2}>
                Seamless chatbot and AI analytics integrations to improve user experience and drive conversions.
              </Text>
            </Box>
            <Box textAlign="left" flex="1">
              <Text fontSize="2xl" fontWeight="bold">Data Analytics</Text>
              <Text fontSize="md" color="gray.600" mt={2}>
                Advanced data solutions to extract insights and support smarter, data-driven decision-making.
              </Text>
            </Box>
          </Flex>
        </Box>

        <Divider my={12} />

        {/* Call to Action*/} 
        <Box textAlign="center" py={16}>
          <Text fontSize="3xl" fontWeight="bold" mb={6}>
            Ready to Scale Your Business with AI?
          </Text>
          <Button colorScheme="blue" size="lg" rightIcon={<ArrowForwardIcon />} onClick={handleGetStarted}>
            Get Started
          </Button>
        </Box>

        {/* Register Modal */}
        <RegisterModal isOpen={isRegisterOpen} onClose={handleRegisterClose} />
      </Box>
    </ChakraProvider>
  );
}
