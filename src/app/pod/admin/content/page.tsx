"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import {
  Box,
  VStack,
  Text,
  Button,
  Wrap,
  WrapItem,
  Tag,
  HStack,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  useToast,
  useDisclosure,
  Link as ChakraLink,
  Image,
} from "@chakra-ui/react";
import { CloseIcon, EditIcon } from "@chakra-ui/icons";
import NextLink from "next/link";
import CreatePostPage from "../create-post/page"; // Adjusted path

// Define UserProfile interface
interface UserProfile {
  _id: string;
  name: string;
  email: string;
  bio?: string;
  profilePicture?: string;
  bannerImage?: string;
  socialLinks?: {
    twitter?: string;
    instagram?: string;
    youtube?: string;
    website?: string;
    X?: string;
    Facebook?: string;
    LinkedIn?: string;
  };
}

// Define Post interface
interface Post {
  _id: string;
  title: string;
  description: string;
  price: number;
  affiliateLink: string;
  image?: string;
  category: string;
  tags?: string[];
}

const ContentManagementPage = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isEditModalOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const [postToEdit, setPostToEdit] = useState<Post | null>(null);
  

  // Fetch posts and tags
  useEffect(() => {
    fetchPostsAndTags();
  }, []);

  const fetchPostsAndTags = async () => {
    try {
      const token = localStorage.getItem("token");

      const userResponse = await axios.get<UserProfile>("/api/users/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const postsResponse = await axios.get<Post[]>(`/api/posts/user/${userResponse.data._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPosts(postsResponse.data);
      setFilteredPosts(postsResponse.data);

      const tagsResponse = await axios.get<string[]>("https://api.kreationation.com/api/tags");
      setAvailableTags(tagsResponse.data);
    } catch (error) {
      console.error("Error fetching posts or tags:", error);
    }
  };

  // Function to refresh content after adding or updating a post
  const onContentChange = async () => {
    await fetchPostsAndTags(); // Refetch the posts and tags
  };

  useEffect(() => {
    if (selectedTags.length === 0) {
      setFilteredPosts(posts);
    } else {
      const filtered = posts.filter((post) =>
        selectedTags.every((tag) => post.tags?.includes(tag))
      );
      setFilteredPosts(filtered);
    }
  }, [selectedTags, posts]);

  const handleTagClick = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleClearAllTags = () => {
    setSelectedTags([]);
  };
// Set postToEdit to null and open the modal for "Add Content"
    const handleAddContent = () => {
      setPostToEdit(null);
      onOpen();
    };
  const handleEditPost = (post: Post) => {
    setPostToEdit(post);
    onEditOpen();
  };

  const handleDeletePost = async (postId: string) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`/api/posts/${postId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPosts(posts.filter((post) => post._id !== postId));
      setFilteredPosts(filteredPosts.filter((post) => post._id !== postId));

      toast({ title: "Post deleted.", status: "success", duration: 3000, isClosable: true });
    } catch (error) {
      console.error("Error deleting post:", error);
      toast({ title: "Error deleting post.", status: "error", duration: 3000, isClosable: true });
    }
  };

  return (
    <Box p="6">
      <ChakraLink as={NextLink} href="/pod/admin/profile" color="teal.500" fontWeight="bold">
        Manage Profile
      </ChakraLink>

      <VStack spacing={6} align="flex-start" w="full">
        <HStack justifyContent="space-between" w="full">
          <ChakraLink as={NextLink} href="/pod/" color="teal.500" fontWeight="bold">
            View Landing Pad
          </ChakraLink>
          <Text fontSize="sm" color="gray.600"></Text>
        </HStack>
      </VStack>

      <HStack spacing={6} align="flex-start" w="full">
        {/* Tags Filtering Section on the left */}
        <Box width="250px" bg="gray.50" p="4" borderRadius="md">
          <Text fontSize="lg" fontWeight="bold" mb="2">
            Filter by Tags
          </Text>
          <Wrap spacing={2}>
            {availableTags.map((tag) => (
              <WrapItem key={tag}>
                <Tag
                  size="md"
                  variant={selectedTags.includes(tag) ? "solid" : "outline"}
                  colorScheme="teal"
                  cursor="pointer"
                  onClick={() => handleTagClick(tag)}
                >
                  {tag}
                </Tag>
              </WrapItem>
            ))}
          </Wrap>
          {selectedTags.length > 0 && (
            <Button mt="4" size="sm" colorScheme="red" onClick={handleClearAllTags}>
              Clear All Tags
            </Button>
          )}
        </Box>

        {/* Content Section on the right */}
        <VStack spacing={6} align="flex-start" w="full">
          <Box display="flex" justifyContent="center" width="100%">
            <Button colorScheme="blue" onClick={handleAddContent}>
              Add Content
            </Button>
          </Box>

          <Box mt="8" width="100%">
            {filteredPosts.length > 0 ? (
              <Box
                display="grid"
                gridTemplateColumns="repeat(auto-fill, minmax(180px, 1fr))"
                gridGap="16px"
                justifyItems="center"
                maxWidth="1000px"
                mx="auto"
              >
                {filteredPosts.map((post) => (
                  <Box
                    key={post._id}
                    p="4"
                    bg="white"
                    borderWidth="1px"
                    borderRadius="lg"
                    overflow="hidden"
                    boxShadow="lg"
                    position="relative"
                    transition="box-shadow 0.2s ease-in-out"
                    _hover={{ boxShadow: "xl" }}
                    maxWidth="200px"
                  >
                    <IconButton
                      aria-label="Delete post"
                      icon={<CloseIcon />}
                      colorScheme="red"
                      size="sm"
                      position="absolute"
                      top="2"
                      right="2"
                      onClick={() => handleDeletePost(post._id)}
                    />

                    <IconButton
                      aria-label="Edit post"
                      icon={<EditIcon />}
                      colorScheme="yellow"
                      size="sm"
                      position="absolute"
                      top="2"
                      right="10"
                      onClick={() => handleEditPost(post)}
                    />

                    {post.image && (
                      <Image
                        src={post.image}
                        alt={post.title}
                        w="100%"
                        h="270px"
                        objectFit="contain"
                        borderTopRadius="lg"
                      />
                    )}

                    <Box p="4">
                      <Text fontWeight="bold" fontSize="lg" mb="2">
                        {post.title}
                      </Text>
                      <Text fontSize="sm" color="gray.600" mb="2">
                        {post.description}
                      </Text>
                      <Text fontWeight="bold" color="blue.600">
                        ${post.price.toFixed(2)}
                      </Text>
                    </Box>
                  </Box>
                ))}
              </Box>
            ) : (
              <Text>No content available</Text>
            )}
          </Box>
        </VStack>
      </HStack>

      {/* Modal for Adding or Editing Content */}
      <Modal isOpen={isOpen || isEditModalOpen} onClose={isEditModalOpen ? onEditClose : onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{postToEdit ? "Edit Content" : "Create New Content"}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <CreatePostPage
              postToEdit={postToEdit}
              onClose={isEditModalOpen ? onEditClose : onClose}
              onContentChange={onContentChange} // Pass the function to refresh content
              setPostToEdit={setPostToEdit}  // Pass the setter function
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ContentManagementPage;
