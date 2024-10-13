"use client";
import { ChakraProvider, Box, Text, Button, VStack, ListItem, UnorderedList } from "@chakra-ui/react";
import theme from "./theme";

export default function FirstSteps() {
  return (
    <ChakraProvider theme={theme}>
      <Box as="main" className="max-w-4xl mx-auto py-10 px-6 first-steps-container">
        
        {/* Header Section */}
        <Box textAlign="center" py={10}>
          <Text fontSize="4xl" fontWeight="bold" mb={4} className="heading">
            Prepare for Your First Meeting
          </Text>
          <Text fontSize="lg" color="gray.600" mb={6} className="subheading">
            Start your AI journey on the right foot by gathering key information. Here’s a checklist to help you get ready!
          </Text>
        </Box>

        {/* Step Sections with Styled Headers */}
        <VStack align="start" spacing={8} className="steps-section">
          
          {/* Step 1 */}
          <Box>
            <Text fontSize="2xl" fontWeight="bold" mb={4} className="step-heading">
              Step 1: Gather Key Business Information
            </Text>
            <UnorderedList spacing={3} pl={6} className="step-list">
              <ListItem>Identify key business challenges AI could address.</ListItem>
              <ListItem>Review current data assets: ensure data availability and quality.</ListItem>
              <ListItem>Assess your current technological infrastructure for AI compatibility.</ListItem>
              <ListItem>Evaluate your team's skills and identify AI expertise gaps.</ListItem>
            </UnorderedList>
          </Box>

          {/* Step 2 */}
          <Box>
            <Text fontSize="2xl" fontWeight="bold" mb={4} className="step-heading">
              Step 2: Financial Planning and Budgeting
            </Text>
            <Text mb={4} color="gray.600" className="step-description">
              AI can require a significant investment. Prepare by outlining potential budgets, available resources, and funding options.
            </Text>
            <UnorderedList spacing={3} pl={6} className="step-list">
              <ListItem>Estimate initial and ongoing costs for AI initiatives.</ListItem>
              <ListItem>Explore available funding options, including grants and partnerships.</ListItem>
              <ListItem>Consider a phased investment approach with smaller pilot projects.</ListItem>
            </UnorderedList>
          </Box>

          {/* Step 3 */}
          <Box>
            <Text fontSize="2xl" fontWeight="bold" mb={4} className="step-heading">
              Step 3: Define AI Objectives
            </Text>
            <Text mb={4} color="gray.600" className="step-description">
              Align your AI goals with business objectives. Define specific, measurable outcomes.
            </Text>
            <UnorderedList spacing={3} pl={6} className="step-list">
              <ListItem>Identify short-term and long-term objectives for AI integration.</ListItem>
              <ListItem>Set measurable goals aligned with your broader business strategy.</ListItem>
              <ListItem>Prioritize high-impact areas where AI can provide the most value.</ListItem>
            </UnorderedList>
          </Box>
        </VStack>

        {/* CTA Section */}
        <Box textAlign="center" py={10}>
          <Button colorScheme="blue" size="lg" className="cta-button">
            Schedule Your First Meeting
          </Button>
        </Box>
      </Box>
    </ChakraProvider>
  );
}
