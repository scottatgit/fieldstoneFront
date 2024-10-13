"Use Client"
import { useState, useEffect } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  Box,
  Text,
  Image,
  Grid,
  GridItem,
  Link,
  HStack
  //Badge,
  //Button
} from "@chakra-ui/react";
import axios from "axios";

interface ShowcasedUser {
  _id: string;
  name: string;
  bio?: string;
  profilePicture?: string;
  bannerImage?: string;
  socialLinks?: {
    twitter?: string;
    instagram?: string;
    youtube?: string;
    website?: string;
  };
}

interface Post {
  _id: string;
  title: string;
  description: string;
  affiliateLink: string;
  image?: string;
  price: number;
  clicks: number;
  likes: number;
}

const ShowcaseModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [showcasedUser, setShowcasedUser] = useState<ShowcasedUser | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShowcaseUserData = async () => {
      try {
        const userProfileResponse = await axios.get<ShowcasedUser>("/api/users/showcase");
        setShowcasedUser(userProfileResponse.data);

        const postsResponse = await axios.get<Post[]>(`/api/posts/user/${userProfileResponse.data._id}`);
        setPosts(postsResponse.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching showcase data:", error);
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchShowcaseUserData();
    }
  }, [isOpen]);

  if (!isOpen || !showcasedUser) return null;

  const displayedPosts = posts.slice(0, 3); // Show only 3 posts

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Now In The Showcase Review!</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {/* Banner Image }
          {showcasedUser.bannerImage && (
            <Box mb="4" borderRadius="md" overflow="hidden">
              <Image
                src={showcasedUser.bannerImage}
                alt={`${showcasedUser.name}'s Banner`}
                width="100%"
                height="200px"
                objectFit="cover"
              />
            </Box>
          )*/}

          {/* Profile Picture and Bio */}
          <HStack spacing={4} mb="4">
            {showcasedUser.profilePicture && (
              <Image
                src={showcasedUser.profilePicture}
                alt={showcasedUser.name}
                width="80px"
                height="80px"
                borderRadius="full"
                objectFit="cover"
                border="2px solid gray"
              />
            )}
            <Box>
              <Text fontSize="lg" fontWeight="bold">{showcasedUser.name}</Text>
              {showcasedUser.bio && <Text color="gray.600">{showcasedUser.bio}</Text>}
            </Box>
          </HStack>

          {/* Social Links */}
          {showcasedUser.socialLinks && (
            <HStack spacing={4} mb="4">
              {showcasedUser.socialLinks.twitter && <Link href={showcasedUser.socialLinks.twitter} isExternal color="blue.500">Twitter</Link>}
              {showcasedUser.socialLinks.instagram && <Link href={showcasedUser.socialLinks.instagram} isExternal color="pink.500">Instagram</Link>}
              {showcasedUser.socialLinks.youtube && <Link href={showcasedUser.socialLinks.youtube} isExternal color="red.500">YouTube</Link>}
              {showcasedUser.socialLinks.website && <Link href={showcasedUser.socialLinks.website} isExternal color="teal.500">Website</Link>}
            </HStack>
          )}

          {/* Display a limited number of posts */}
          <Text fontSize="xl" fontWeight="bold" mb="4">Content</Text>
          {loading ? (
            <Text>Loading...</Text>
          ) : displayedPosts.length > 0 ? (
            <Grid templateColumns="repeat(auto-fill, minmax(150px, 1fr))" gap={4}>
              {displayedPosts.map(post => (
                <GridItem key={post._id} bg="white" borderRadius="lg" overflow="hidden" boxShadow="lg">
                  {post.image && <Image src={post.image} alt={post.title} width="100%" height="150px" objectFit="cover" />}
                  <Box p="4">
                    <Text fontWeight="bold">{post.title}</Text>
                    <Text fontSize="sm" color="gray.600" noOfLines={6}>{post.description}</Text>
                    
                    <Link href={post.affiliateLink} isExternal color="teal.500">Learn More</Link>
                    
                  </Box>
                </GridItem>
              ))}
            </Grid>
          ) : (
            <Text>No content available.</Text>
          )}

          {/* Link to full Pod page if more posts exist */}
          {posts.length > 3 && (
            <Box textAlign="center" mt="6">
              <Link href={`/pod/${showcasedUser._id}`} color="teal.500" fontWeight="bold">See More Content</Link>
            </Box>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ShowcaseModal;
