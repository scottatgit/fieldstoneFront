"use client";

import { useEffect, useState, useRef } from "react";
import axios from "axios";
import {
  Box,
  Text,
  Input,
  VStack,
  HStack,
  Image,
  IconButton,
  useToast,
  Button,
  Textarea,
  Link as ChakraLink,
} from "@chakra-ui/react";
import { FaCamera } from "react-icons/fa";
import NextLink from "next/link";

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

const ProfileManagementPage = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [bannerImageFile, setBannerImageFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [bio, setBio] = useState<string>("");

  // Social Links
  const [twitter, setTwitter] = useState<string>("");
  const [instagram, setInstagram] = useState<string>("");
  const [youtube, setYoutube] = useState<string>("");
  const [website, setWebsite] = useState<string>("");
  const [X, setX] = useState<string>("");
  const [Facebook, setFacebook] = useState<string>("");
  const [LinkedIn, setLinkedIn] = useState<string>("");

  const toast = useToast();
  const bannerFileInputRef = useRef<HTMLInputElement | null>(null);
  const profileFileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("token");
        const userResponse = await axios.get<UserProfile>("/api/users/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setUserProfile(userResponse.data);
        setName(userResponse.data.name);
        setEmail(userResponse.data.email);
        setBio(userResponse.data.bio || "");

        // Set social links
        setTwitter(userResponse.data.socialLinks?.twitter || "");
        setInstagram(userResponse.data.socialLinks?.instagram || "");
        setYoutube(userResponse.data.socialLinks?.youtube || "");
        setWebsite(userResponse.data.socialLinks?.website || "");
        setX(userResponse.data.socialLinks?.X || "");
        setFacebook(userResponse.data.socialLinks?.Facebook || "");
        setLinkedIn(userResponse.data.socialLinks?.LinkedIn || "");

      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, []);

  // Handle file changes for banner and profile picture
  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: (file: File | null) => void,
    setPreview: (previewUrl: string | null) => void
  ) => {
    const file = e.target.files?.[0] || null;
    setFile(file);

    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);
    }
  };

  // Handle save profile changes
  const handleSave = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const formData = new FormData();
      if (profilePictureFile) formData.append("profilePicture", profilePictureFile);
      if (bannerImageFile) formData.append("bannerImage", bannerImageFile);
      formData.append("name", name);
      formData.append("email", email);
      if (password) formData.append("password", password);
      formData.append("bio", bio);

      // Append social links
      formData.append("socialLinks[twitter]", twitter);
      formData.append("socialLinks[instagram]", instagram);
      formData.append("socialLinks[youtube]", youtube);
      formData.append("socialLinks[website]", website);
      formData.append("socialLinks[X]", X);
      formData.append("socialLinks[Facebook]", Facebook);
      formData.append("socialLinks[LinkedIn]", LinkedIn);

      await axios.put("/api/users/profile", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      toast({
        title: "Profile updated.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      setLoading(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error updating profile.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      setLoading(false);
    }
  };

  const triggerFileInput = (inputRef: React.RefObject<HTMLInputElement>) => {
    inputRef.current?.click();
  };

  return (
    <Box p="6">
      {/* Link to Content Management Page */}
      <ChakraLink as={NextLink} href="/pod/admin/content" color="teal.500" fontWeight="bold">
        Manage Content
      </ChakraLink>

      {/* Profile Management UI */}
      {userProfile && (
        <VStack spacing={6} align="flex-start" w="full">
          <HStack justifyContent="space-between" w="full">
          <ChakraLink as={NextLink} href="/pod/" color="teal.500" fontWeight="bold">
            View Landing Pad
          </ChakraLink>
            <Text fontSize="sm" color="gray.600">
            Max banner size 1280x300 pixels.
            </Text>
          </HStack>

          {/* Banner Image Upload */}
          <Box position="relative" w="100%" h="300px" bg="gray.200" borderRadius="md">
            <Image
              src={bannerPreview || userProfile.bannerImage}
              alt="Banner"
              w="100%"
              h="100%"
              objectFit="contain"
            />
            <IconButton
              icon={<FaCamera />}
              aria-label="Change Banner"
              position="absolute"
              bottom="10px"
              right="10px"
              onClick={() => triggerFileInput(bannerFileInputRef)}
            />
            <Input
              ref={bannerFileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(e, setBannerImageFile, setBannerPreview)}
              style={{ display: "none" }}
            />
          </Box>

          {/* Profile Picture Upload */}
          <HStack align="flex-start" spacing={8} w="full">
            <Box position="relative" w="150px" h="150px">
              <Image
                src={profilePicturePreview || userProfile.profilePicture}
                alt="Profile"
                borderRadius="full"
                boxSize="150px"
                objectFit="cover"
              />
              <IconButton
                icon={<FaCamera />}
                aria-label="Change Profile Picture"
                position="absolute"
                bottom="10px"
                right="10px"
                onClick={() => triggerFileInput(profileFileInputRef)}
              />
              <Input
                ref={profileFileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, setProfilePictureFile, setProfilePicturePreview)}
                style={{ display: "none" }}
              />
            </Box>

            {/* Profile Information */}
            <VStack spacing={4} align="stretch" w="full">
              <Input placeholder="Enter your name" value={name} onChange={(e) => setName(e.target.value)} />
              <Input placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <Input
                placeholder="Enter a new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
              />
              <Textarea
                placeholder="Add a short bio..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />

              {/* Social Links */}
              <Input placeholder="Twitter URL" value={twitter} onChange={(e) => setTwitter(e.target.value)} />
              <Input placeholder="Facebook URL" value={Facebook} onChange={(e) => setFacebook(e.target.value)} />
              <Input placeholder="LinkedIn URL" value={LinkedIn} onChange={(e) => setLinkedIn(e.target.value)} />
              <Input placeholder="Instagram URL" value={instagram} onChange={(e) => setInstagram(e.target.value)} />
              <Input placeholder="YouTube URL" value={youtube} onChange={(e) => setYoutube(e.target.value)} />
              <Input placeholder="Website URL" value={website} onChange={(e) => setWebsite(e.target.value)} />

              <Button colorScheme="blue" onClick={handleSave} isLoading={loading}>
                Save Changes
              </Button>
            </VStack>
          </HStack>
        </VStack>
      )}
    </Box>
  );
};

export default ProfileManagementPage;
