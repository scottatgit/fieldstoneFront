"use client"; // Ensures this component runs on the client side

import { Box, Text, Image, HStack, Link, Badge } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import axios from "axios";

// Define the Post and UserProfile types
interface Post {
  _id: string;
  title: string;
  description: string;
  affiliateLink: string;
  image?: string;
  price: number;
  clicks: number;
  likes: number;
  comments: Array<{
    userId: string;
    commentText: string;
    createdAt: Date;
  }>;
  user: string;
  createdAt: Date;
}

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
  };
  points: number;
  badges: string[];
  followers: number;
  following: number;
}

const PodPage = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          console.log("No token found, redirecting to login.");
          return;
        }

        const userProfileResponse = await axios.get<UserProfile>("/api/users/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setUserProfile(userProfileResponse.data);

        const postsResponse = await axios.get<Post[]>(`/api/posts/user/${userProfileResponse.data._id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setPosts(postsResponse.data);
      } catch (error) {
        console.error("Error fetching user data or content:", error);
      }
    };

    fetchUserData();
  }, []);

  if (!userProfile) {
    return <Text>Loading profile...</Text>;
  }

  return (
    <Box p="6">
      {userProfile.bannerImage && (
        <Image
          src={userProfile.bannerImage}
          alt="Banner Image"
          width="100%"
          height="100%"
          objectFit="cover"
          borderRadius="md"
          mb="6"
        />
      )}

      <HStack mb="6" align="center" spacing={6}>
        {userProfile.profilePicture && (
          <Image
            src={userProfile.profilePicture}
            alt="Profile Picture"
            width="100px"
            height="100px"
            borderRadius="full"
            objectFit="cover"
            border="2px solid gray"
          />
        )}

        <Box>
          <Text fontSize="2xl" fontWeight="bold">
            {userProfile.name}
          </Text>

          {userProfile.bio && (
            <Text mt="2" fontStyle="italic" color="gray.500">
              {userProfile.bio}
            </Text>
          )}

          <HStack spacing={4}>
            {userProfile.socialLinks?.twitter && (
              <Link href={userProfile.socialLinks.twitter} isExternal color="blue.500">
                Twitter
              </Link>
            )}
            {userProfile.socialLinks?.instagram && (
              <Link href={userProfile.socialLinks.instagram} isExternal color="pink.500">
                Instagram
              </Link>
            )}
            {userProfile.socialLinks?.youtube && (
              <Link href={userProfile.socialLinks.youtube} isExternal color="red.500">
                YouTube
              </Link>
            )}
            {userProfile.socialLinks?.website && (
              <Link href={userProfile.socialLinks.website} isExternal color="teal.500">
                Website
              </Link>
            )}
          </HStack>
        </Box>
      </HStack>

      <Text fontSize="xl" fontWeight="bold" mb="4">
        Content
      </Text>

      <Box
        display="grid"
        gridTemplateColumns="repeat(auto-fill, minmax(180px, 1fr))"
        gridGap="16px"
        justifyItems="center"
        maxWidth="1000px"
        mx="auto" // Center the grid container on the page
      >
        {posts.length > 0 ? (
          posts.map((post) => (
            <Box
              key={post._id}
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
              {post.image && (
                <Image
                  src={post.image}
                  alt={post.title}
                  width="100%"
                  height="270px"
                  objectFit="contain"
                  borderTopRadius="lg"
                />
              )}

              <Box p="4">
                <Text fontWeight="bold" mb="2" fontSize="lg">
                  {post.title}
                </Text>

                <Text fontSize="md" color="gray.600" mb="2">
                  {post.description}
                </Text>

                <Text fontWeight="bold" mb="2" color="blue.600">
                  ${post.price.toFixed(2)}
                </Text>

                <Link href={post.affiliateLink} isExternal color="teal.500" mb="2">
                  Learn More
                </Link>

                <Box mt="4" display="flex" justifyContent="space-between">
                  <Badge colorScheme="green">Likes: {post.likes}</Badge>
                  <Badge colorScheme="blue">Clicks: {post.clicks}</Badge>
                </Box>

                <Box mt="2">
                  <Text fontSize="sm" color="gray.500">
                    {post.comments.length} Comments
                  </Text>
                </Box>
              </Box>
            </Box>
          ))
        ) : (
          <Text>No content yet.</Text>
        )}
      </Box>
    </Box>
  );
};

export default PodPage;
