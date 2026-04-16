import React from 'react';
import {
  Box, Container, Flex, Heading, HStack, Text, VStack, Divider,
} from '@chakra-ui/react';

const BG     = '#0d1117';
const BLUE   = '#63B3ED';
const BORDER = '#1f2937';

const EFFECTIVE_DATE = 'April 16, 2026';
const CONTACT_EMAIL  = 'privacy@fieldstone.pro';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box as="section" mb={10}>
      <Heading
        as="h2"
        fontSize={{ base: 'lg', md: 'xl' }}
        fontWeight="700"
        color="white"
        mb={4}
        pb={3}
        borderBottom="1px solid"
        borderColor={BORDER}
      >
        {title}
      </Heading>
      {children}
    </Box>
  );
}

function Para({ children }: { children: React.ReactNode }) {
  return (
    <Text fontSize="sm" color="gray.400" lineHeight="1.8" mb={4}>
      {children}
    </Text>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <Box as="ul" pl={5} mb={4}>
      {items.map((item, i) => (
        <Box as="li" key={i} fontSize="sm" color="gray.400" lineHeight="1.8" mb={1} style={{ listStyleType: 'disc' }}>
          {item}
        </Box>
      ))}
    </Box>
  );
}

export default function PrivacyPage() {
  return (
    <Box minH="100vh" bg={BG} color="white">

      {/* Nav */}
      <Box borderBottom="1px solid" borderColor={BORDER} py={4}>
        <Container maxW="5xl">
          <Flex justify="space-between" align="center">
            <HStack spacing={2}>
              <Box
                as="a"
                href="https://fieldstone.pro"
                display="flex"
                alignItems="center"
                style={{ textDecoration: 'none' }}
              >
                <Box w={2} h={2} bg={BLUE} borderRadius="full" mr={2} />
                <Text fontWeight="700" fontSize="lg" letterSpacing="0.1em" color="white">
                  FIELDSTONE
                </Text>
              </Box>
            </HStack>
            <Text
              as="a"
              href="https://signal.fieldstone.pro/login"
              fontSize="sm"
              color={BLUE}
              fontWeight="600"
              _hover={{ opacity: 0.8 }}
            >
              Sign In
            </Text>
          </Flex>
        </Container>
      </Box>

      {/* Page Header */}
      <Box borderBottom="1px solid" borderColor={BORDER} py={12} bg="#080c12">
        <Container maxW="5xl">
          <VStack spacing={3} align="flex-start">
            <Text
              fontSize="xs"
              fontWeight="700"
              letterSpacing="0.2em"
              color={BLUE}
              textTransform="uppercase"
            >
              Legal
            </Text>
            <Heading fontSize={{ base: '2xl', md: '4xl' }} fontWeight="800" lineHeight="1.2">
              Privacy Policy
            </Heading>
            <Text fontSize="sm" color="gray.500">
              Effective date: {EFFECTIVE_DATE}
            </Text>
          </VStack>
        </Container>
      </Box>

      {/* Content */}
      <Container maxW="3xl" py={16}>
        <VStack spacing={0} align="stretch">

          <Section title="1. Introduction">
            <Para>
              Fieldstone AI, Inc. (&ldquo;Fieldstone,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) respects your privacy.
              This Privacy Policy describes how we collect, use, and handle information when you
              visit our website, use our products, or otherwise interact with our services.
            </Para>
            <Para>
              This policy applies to visitors to fieldstone.pro, customers and account holders
              using our software products (including Signal), and anyone who contacts us through
              forms, email, or other channels. By using our services, you acknowledge the
              practices described in this policy.
            </Para>
          </Section>

          <Section title="2. Information We Collect">
            <Para>We may collect information in the following categories:</Para>
            <Para><Text as="span" color="white" fontWeight="600">Information you provide directly:</Text></Para>
            <BulletList items={[
              'Contact details such as name, email address, and company or organization name.',
              'Account and business information provided during signup or onboarding.',
              'Communications you submit through contact forms, demo requests, support inquiries, or email.',
            ]} />
            <Para><Text as="span" color="white" fontWeight="600">Information collected automatically:</Text></Para>
            <BulletList items={[
              'Usage data such as pages visited, features accessed, and actions taken within our products.',
              'Device and browser information including IP address, operating system, and browser type.',
              'Log data such as access timestamps, referring URLs, and error events.',
              'Analytics data collected through cookies or similar technologies, where applicable.',
            ]} />
          </Section>

          <Section title="3. How We Use Information">
            <Para>We use the information we collect to:</Para>
            <BulletList items={[
              'Provide, operate, and improve our services and products.',
              'Respond to inquiries, support requests, and communications.',
              'Manage customer accounts and support business relationships.',
              'Monitor, secure, and maintain the reliability of our platform.',
              'Analyze usage patterns to improve product performance and user experience.',
              'Send service-related communications such as account notices or updates.',
              'Comply with applicable legal obligations.',
            ]} />
          </Section>

          <Section title="4. Sharing of Information">
            <Para>
              We do not sell your personal information. We may share information in the following
              limited circumstances:
            </Para>
            <BulletList items={[
              'With service providers and infrastructure partners who process data on our behalf and are bound by appropriate confidentiality obligations.',
              'With analytics or monitoring providers used to operate and improve our services.',
              'When required by law, regulation, legal process, or governmental request.',
              'In connection with a merger, acquisition, or sale of company assets, where user data may be among the transferred assets.',
            ]} />
            <Para>
              Any third parties we engage are expected to handle information in a manner consistent
              with this policy and applicable law.
            </Para>
          </Section>

          <Section title="5. Data Retention">
            <Para>
              We retain information for as long as necessary to fulfill the purposes described in
              this policy, including providing services, maintaining account records, meeting legal
              and regulatory obligations, resolving disputes, and supporting ongoing business
              operations. When data is no longer needed, we take reasonable steps to delete or
              de-identify it.
            </Para>
          </Section>

          <Section title="6. Data Security">
            <Para>
              We apply reasonable administrative, technical, and organizational safeguards to
              protect the information we hold against unauthorized access, disclosure, alteration,
              and loss. These measures include access controls, encrypted transmission, and
              security monitoring practices appropriate to a growing software organization.
            </Para>
            <Para>
              No system can be guaranteed completely secure. If you have reason to believe your
              interaction with us is no longer secure, please contact us promptly.
            </Para>
          </Section>

          <Section title="7. Your Choices and Rights">
            <Para>
              Depending on your location and applicable law, you may have certain rights regarding
              your personal information, including the right to request access to, correction of,
              or deletion of data we hold about you.
            </Para>
            <Para>
              To make a privacy-related request or ask a question about your information, please
              contact us at{' '}
              <Text
                as="a"
                href={`mailto:${CONTACT_EMAIL}`}
                color={BLUE}
                _hover={{ opacity: 0.8 }}
              >
                {CONTACT_EMAIL}
              </Text>
              . We will respond to reasonable requests in accordance with applicable requirements.
            </Para>
          </Section>

          <Section title="8. Cookies and Analytics">
            <Para>
              Our website and products may use cookies, local storage, or similar technologies to
              support functionality and collect usage analytics. These technologies help us
              understand how our services are used and where improvements can be made. You may
              configure your browser to decline cookies, though some features may not function
              as expected if you do.
            </Para>
          </Section>

          <Section title="9. Third-Party Links and Services">
            <Para>
              Our website and products may contain links to or integrations with third-party
              websites, platforms, or services. This Privacy Policy applies only to Fieldstone
              and does not cover the practices of third parties. We encourage you to review the
              privacy policies of any third-party services you use.
            </Para>
          </Section>

          <Section title="10. Children&rsquo;s Privacy">
            <Para>
              Our services are not directed to children under the age of 13, and we do not
              knowingly collect personal information from children. If you believe we have
              inadvertently collected information from a child, please contact us so we can
              take appropriate action.
            </Para>
          </Section>

          <Section title="11. Changes to This Policy">
            <Para>
              We may update this Privacy Policy from time to time to reflect changes in our
              practices or applicable law. When we make material changes, we will revise the
              effective date at the top of this page. Your continued use of our services after
              a change is posted constitutes your acceptance of the updated policy.
            </Para>
          </Section>

          <Section title="12. Contact">
            <Para>
              If you have questions, concerns, or requests related to this Privacy Policy, please
              contact us at:
            </Para>
            <Box
              p={5}
              bg="#111827"
              border="1px solid"
              borderColor={BORDER}
              borderRadius="lg"
              mb={4}
            >
              <Text fontSize="sm" fontWeight="700" color="white" mb={1}>Fieldstone AI, Inc.</Text>
              <Text fontSize="sm" color="gray.400">
                Privacy inquiries:{' '}
                <Text
                  as="a"
                  href={`mailto:${CONTACT_EMAIL}`}
                  color={BLUE}
                  _hover={{ opacity: 0.8 }}
                >
                  {CONTACT_EMAIL}
                </Text>
              </Text>
              <Text fontSize="sm" color="gray.400">Website: fieldstone.pro</Text>
            </Box>
          </Section>

          <Divider borderColor={BORDER} mt={4} mb={10} />

          <Text fontSize="xs" color="gray.600" textAlign="center">
            This policy is provided for informational purposes and does not constitute legal advice.
            Fieldstone AI is a growing software and AI services company and this policy reflects
            our current practices as of the effective date above.
          </Text>

        </VStack>
      </Container>

      {/* Footer */}
      <Box borderTop="1px solid" borderColor={BORDER} py={8}>
        <Container maxW="5xl">
          <Flex
            justify="space-between"
            align="center"
            flexDir={{ base: 'column', sm: 'row' }}
            gap={4}
          >
            <Text fontSize="sm" color="gray.600">© 2026 Fieldstone AI. All rights reserved.</Text>
            <HStack spacing={6}>
              <Text
                as="a"
                href="/"
                fontSize="sm"
                color="gray.500"
                _hover={{ color: BLUE }}
                cursor="pointer"
              >
                Home
              </Text>
              <Text
                as="a"
                href="https://signal.fieldstone.pro"
                fontSize="sm"
                color="gray.500"
                _hover={{ color: BLUE }}
                cursor="pointer"
              >
                Signal
              </Text>
              <Text
                as="a"
                href="/privacy"
                fontSize="sm"
                color={BLUE}
                cursor="pointer"
              >
                Privacy Policy
              </Text>
            </HStack>
          </Flex>
        </Container>
      </Box>

    </Box>
  );
}
