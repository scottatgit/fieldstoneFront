"use client";
import { ChakraProvider, Box, Flex, Text, Button, VStack, Divider } from "@chakra-ui/react";
import theme from "../theme";
import { ArrowForwardIcon } from "@chakra-ui/icons";
import { useState } from "react";
import RegisterModal from "../components/RegisterModal";
import { useAppSelector } from "../redux/hooks";
import { useRouter } from "next/navigation";

export default function Acquisition() {
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const router = useRouter();

  const handleRegisterOpen = () => setIsRegisterOpen(true);
  const handleRegisterClose = () => setIsRegisterOpen(false);

  const handleGetStarted = () => {
    if (isAuthenticated) {
      router.push('/first-steps');
    } else {
      handleRegisterOpen();
    }
  };

  return (
    <ChakraProvider theme={theme}>
      <Box as="main" className="max-w-5xl mx-auto py-12 px-6">
        
        {/* Hero Section */}
        <Box textAlign="center" py={20}>
          <Text fontSize="4xl" fontWeight="bold" mb={4}>
            AI-Powered Solutions for Business Growth
          </Text>
          <Text fontSize="xl" color="gray.600" mb={8}>
            Unlock the power of AI with solutions in **networking, software, SaaS, and social media marketing**.
          </Text>
          <Button colorScheme="blue" size="lg" rightIcon={<ArrowForwardIcon />} onClick={handleGetStarted}>
            Get The Checklist
          </Button>
        </Box>

        {/* Value Propositions */}
        <Box py={10}>
          <Flex direction={{ base: "column", md: "row" }} textAlign="center" gap={6}>
            <VStack>
              <Text fontSize="2xl" fontWeight="bold">AI-Driven Networking</Text>
              <Text fontSize="md" color="gray.600">
                Enhance **connectivity, security, and automation** with AI-powered network management.
              </Text>
            </VStack>
            <VStack>
              <Text fontSize="2xl" fontWeight="bold">SaaS-Powered Efficiency</Text>
              <Text fontSize="md" color="gray.600">
                Leverage AI-driven **SaaS tools** to streamline business operations and **automate workflows**.
              </Text>
            </VStack>
            <VStack>
              <Text fontSize="2xl" fontWeight="bold">AI in Social Media Marketing</Text>
              <Text fontSize="md" color="gray.600">
                Optimize content strategy and engagement with AI-driven **social media analytics and automation**.
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
              <Text fontSize="2xl" fontWeight="bold">AI Network Solutions</Text>
              <Text fontSize="md" color="gray.600" mt={2}>
                Automate **network security, monitoring, and performance optimization** using AI.
              </Text>
            </Box>
            <Box textAlign="left" flex="1">
              <Text fontSize="2xl" fontWeight="bold">SaaS & AI Software</Text>
              <Text fontSize="md" color="gray.600" mt={2}>
                Develop and integrate **custom AI-powered SaaS applications** for your business.
              </Text>
            </Box>
            <Box textAlign="left" flex="1">
              <Text fontSize="2xl" fontWeight="bold">Social Media AI Automation</Text>
              <Text fontSize="md" color="gray.600" mt={2}>
                Use AI to schedule posts, analyze audience insights, and optimize marketing campaigns.
              </Text>
            </Box>
          </Flex>
        </Box>

        <Divider my={12} />

        {/* Call to Action */} 
        <Box textAlign="center" py={16}>
          <Text fontSize="3xl" fontWeight="bold" mb={6}>
            Ready to Transform Your Business with AI?
          </Text>
          <Button colorScheme="blue" size="lg" rightIcon={<ArrowForwardIcon />} onClick={handleGetStarted}>
            Get The Checklist
          </Button>
        </Box>

        {/* Register Modal */}
        <RegisterModal isOpen={isRegisterOpen} onClose={handleRegisterClose} />
      </Box>
    </ChakraProvider>
  );
}
