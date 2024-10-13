"use client";

import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalCloseButton,
  Button,
  Text,
  Wrap,
  WrapItem,
  Tag,
  Flex,
  Box,
  Image,
  VStack,
  HStack,
  Link,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useAppSelector } from "../redux/hooks";
import { RootState } from "../redux/store";

// Showcase data structure
interface ShowcasedUser {
  _id: string;
  name: string;
  bio?: string;
  profilePicture?: string;
  socialLinks?: {
    twitter?: string;
    instagram?: string;
    youtube?: string;
    website?: string;
  };
}

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginOpen: () => void;
  onRegisterOpen: () => void;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({
  isOpen,
  onClose,
  onLoginOpen,
  onRegisterOpen,
}) => {
  const [tags, setTags] = useState<string[]>([]);
  const { isAuthenticated } = useAppSelector((state: RootState) => state.auth);
  const [showcasedUser, setShowcasedUser] = useState<ShowcasedUser | null>(null);

  const router = useRouter();

  useEffect(() => {
    // Fetch tags from the API
    const fetchTags = async () => {
      try {
        const response = await axios.get<string[]>("/api/tags");
        setTags(response.data);
      } catch (error) {
        console.error("Error fetching tags:", error);
      }
    };

    const fetchShowcase = async () => {
      try {
        const showcaseResponse = await axios.get<ShowcasedUser>("/api/users/showcase");
        setShowcasedUser(showcaseResponse.data);
      } catch (error) {
        console.error("Error fetching showcase user:", error);
      }
    };

    fetchTags();
    fetchShowcase();
  }, []);

  const specialTags = ["Money", "Health", "Relationships"];

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent
        bg="white"
        display="flex"
        flexDirection="row" // Split into two columns
        maxW="85%" // Adjusted width
        mx="auto"
        mt="10"
        p="6"
      >
        {/* Close Button */}
        <ModalCloseButton size="lg" onClick={onClose} />

        {/* Left Side: Showcase Section */}
        {showcasedUser && (
          <Box
            w="40%"
            p="4"
            borderRight="1px solid gray"
            mr="6"
            display="flex"
            flexDirection="column"
            alignItems="center"  // Center the content
          >
            {/* Centered Header */}
            <Text fontSize="2xl" mb="4" fontWeight="bold" textAlign="center" width="100%">
              Todays Showcase
            </Text>

            {/* Centered Profile Picture */}
            <Image
              src={showcasedUser.profilePicture}
              alt={showcasedUser.name}
              width="80px"
              height="80px"
              borderRadius="full"
              objectFit="cover"
              border="2px solid gray"
              mb="4"
              alignSelf="center"  // Center the profile picture
            />

            {/* Name and Bio */}
            <VStack align="center" spacing={2}>
              <Text fontSize="lg" fontWeight="bold">{showcasedUser.name}</Text>
              {showcasedUser.bio && <Text color="gray.600" textAlign="center">{showcasedUser.bio}</Text>}
            </VStack>

            {/* Centered Social Links */}
            {showcasedUser.socialLinks && (
              <HStack spacing={4} mt="4" justifyContent="center" width="100%">
                {showcasedUser.socialLinks.twitter && (
                  <Link href={showcasedUser.socialLinks.twitter} isExternal color="blue.500">
                    Twitter
                  </Link>
                )}
                {showcasedUser.socialLinks.youtube && (
                  <Link href={showcasedUser.socialLinks.youtube} isExternal color="red.500">
                    YouTube
                  </Link>
                )}
                {showcasedUser.socialLinks.website && (
                  <Link href={showcasedUser.socialLinks.website} isExternal color="teal.500">
                    Website
                  </Link>
                )}
              </HStack>
            )}
          </Box>
        )}

        {/* Right Side: Existing Welcome Content */}
        <Box flex="1" display="flex" flexDirection="column" justifyContent="center">
          {/* Login and Sign Up Buttons */}
          {!isAuthenticated && (
            <Flex justify="flex-end" gap="2" mb="2">
              <Button
                colorScheme="blue"
                size="sm"  // Reduce button size
                onClick={() => {
                  onClose();
                  onLoginOpen();
                }}
              >
                Login
              </Button>
              <Button
                colorScheme="green"
                size="sm"  // Reduce button size
                onClick={() => {
                  onClose();
                  onRegisterOpen();
                }}
              >
                Sign Up
              </Button>
            </Flex>
          )}

          {/* Centered Welcome Text */}
          <Text fontSize="2xl" mb="4" fontWeight="bold" textAlign="center">
            Click Stuff!
          </Text>

          {/* Tags Display with Smaller Size */}
          <Wrap spacing="3" justify="center" maxW="100%" overflowY="auto">
            {tags.map((tag) => (
              <WrapItem key={tag}>
                <Tag
                  size="md"  // Reduced size of the tags
                  variant="solid"
                  colorScheme={specialTags.includes(tag) ? "red" : "teal"}
                  cursor="pointer"
                  onClick={() => {
                    onClose();
                    router.push(`/?tags=${encodeURIComponent(tag)}`);
                  }}
                >
                  {tag}
                </Tag>
              </WrapItem>
            ))}
          </Wrap>
        </Box>
      </ModalContent>
    </Modal>
  );
};

export default WelcomeModal;
