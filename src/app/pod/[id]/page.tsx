"use client";

import React from "react";
import { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "next/navigation";
import { Box, Text, Grid, GridItem, Image, Link, HStack } from "@chakra-ui/react";

// Define the user profile and post data structures
interface UserProfile {
  _id: string;
  name: string;
  email: string;
  bio?: string;
  profilePicture?: string;
  bannerImage?: string;
  socialLinks?: {
    twitter?: string;
    Facebook?: string;
    LinkedIn?: string;
    instagram?: string;
    youtube?: string;
    website?: string;
  };
  points: number;
  badges: string[];
  followers: number;
  following: number;
}

interface Post {
  _id: string;
  title: string;
  description: string;
  affiliateLink: string;
  image?: string;
  price: number;
  //clicks: number;
  //likes: number;
  comments: Array<{
    userId: string;
    commentText: string;
    createdAt: Date;
  }>;
  user: string;
  createdAt: Date;
}

const PodPage = () => {
  const params = useParams();
  const { id } = params;

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (!id) return;
        const userProfileResponse = await axios.get<UserProfile>(`/api/users/${id}`);
        setUserProfile(userProfileResponse.data);

        const postsResponse = await axios.get<Post[]>(`/api/posts/user/${id}`);
        setPosts(postsResponse.data);
        setLoading(false);
      } catch (error) {
        setError("Failed to load user profile or content");
        setLoading(false);
      }
    };

    fetchUserData();
  }, [id]);

  if (loading) {
    return <Text>Loading...</Text>;
  }

  if (error) {
    return <Text>{error}</Text>;
  }

  if (!userProfile) {
    return <Text>No user profile found</Text>;
  }

  return (
    <Box p="6">
      {/* Display banner image */}
      {userProfile.bannerImage && (
        <Box
          position="relative"
          w="100%"
          h="100%" // Set a fixed height for the banner
          overflow="hidden"
          borderRadius="md"
          mb="6"
          bg="gray.200"
        >
          <Image
            src={`${userProfile.bannerImage}`}
            alt={`${userProfile.name}&#39;s Banner`}  // Escaped the single quote
            objectFit="cover" // Ensures the image covers the box without distortion
            w="100%"
            h="100%" // Forces the image to fill the height and width
            fallbackSrc="https://via.placeholder.com/1280x300" // Placeholder in case image fails to load
          />
        </Box>
      )}

      <HStack mb="6" align="center" spacing={6}>
        {/* Display profile picture */}
        {userProfile.profilePicture && (
          <Image
            src={`${userProfile.profilePicture}`}
            alt={`${userProfile.name}&#39;s Profile Picture`}  // Escaped the single quote
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
          <Text color="gray.600">{userProfile.email}</Text>
          {userProfile.bio && (
            <Text mt="2" fontStyle="italic" color="gray.500">
              {userProfile.bio}
            </Text>
          )}
        </Box>
      </HStack>

      {/* Social Media Links */}
      {userProfile.socialLinks && (
        <HStack mb="6" spacing={4}>
          {userProfile.socialLinks.twitter && (
            <Link href={userProfile.socialLinks.twitter} isExternal color="blue.500">
              X
            </Link>
          )}
          {userProfile.socialLinks.Facebook && (
            <Link href={userProfile.socialLinks.Facebook} isExternal color="pink.500">
              Facebook
            </Link>
          )}
          {userProfile.socialLinks.LinkedIn && (
            <Link href={userProfile.socialLinks.LinkedIn} isExternal color="pink.500">
              LinkedIn
            </Link>
          )}
          {userProfile.socialLinks.instagram && (
            <Link href={userProfile.socialLinks.instagram} isExternal color="pink.500">
              Instagram
            </Link>
          )}
          {userProfile.socialLinks.youtube && (
            <Link href={userProfile.socialLinks.youtube} isExternal color="red.500">
              YouTube
            </Link>
          )}
          {userProfile.socialLinks.website && (
            <Link href={userProfile.socialLinks.website} isExternal color="teal.500">
              Website
            </Link>
          )}
        </HStack>
      )}

      {/* Display user's posts */}
      <Text fontSize="xl" fontWeight="bold" mt="8" mb="4">
        {userProfile.name}&#39;s Content  {/* Escaped the single quote */}
      </Text>

      <Grid
        templateColumns="repeat(auto-fill, minmax(180px, 1fr))"
        gap={6}
        maxWidth="1000px"
        mx="auto"
      >
        {posts.length > 0 ? (
          posts.map((post) => (
            <GridItem
              key={post._id}
              bg="white"
              borderWidth="1px"
              borderRadius="lg"
              overflow="hidden"
              boxShadow="lg"
              transition="box-shadow 0.2s ease-in-out"
              _hover={{
                boxShadow: "xl",
              }}
              position="relative"
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
                <Link href={post.affiliateLink} isExternal color="teal.500">
                  Learn More
                </Link>
                {/* 
                <Box mt="4" display="flex" justifyContent="space-between">
                  <Badge colorScheme="green">Likes: {post.likes}</Badge>
                  <Badge colorScheme="blue">Clicks: {post.clicks}</Badge>
                </Box>*/}
              </Box>
            </GridItem>
          ))
        ) : (
          <Text>No content available for this user yet.</Text>
        )}
      </Grid>
    </Box>
  );
};

export default PodPage;
