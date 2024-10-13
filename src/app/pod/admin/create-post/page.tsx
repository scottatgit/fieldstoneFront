"use client";

import { useState, useEffect } from 'react';
import {
  Box,
  Input,
  Textarea,
  Button,
  FormControl,
  FormErrorMessage,
  Text,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import axios from 'axios';
import CreatableSelect from 'react-select/creatable';
import { MultiValue, SingleValue } from 'react-select';

// Define the type for a category option and tag option
interface CategoryOption {
  label: string;
  value: string;
}

interface TagOption {
  label: string;
  value: string;
}

interface PostToEdit {
  _id: string;
  title: string;
  description: string;
  affiliateLink: string;
  price: number;
  image?: string;
  category: string;
  tags?: string[];
}

interface CreatePostPageProps {
  postToEdit?: PostToEdit;
  onClose: () => void;
  onContentChange: () => void;
  setPostToEdit: React.Dispatch<React.SetStateAction<PostToEdit | null>>;
}

interface ErrorResponse {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
}

const CreatePostPage: React.FC<CreatePostPageProps> = ({ postToEdit, onClose, onContentChange, setPostToEdit }) => {
  const [title, setTitle] = useState<string>(postToEdit?.title || '');
  const [description, setDescription] = useState<string>(postToEdit?.description || '');
  const [affiliateLink, setAffiliateLink] = useState<string>(postToEdit?.affiliateLink || '');
  const [price, setPrice] = useState<string>(postToEdit?.price.toString() || '');
  const [image, setImage] = useState<File | null>(null);
  const [category, setCategory] = useState<SingleValue<CategoryOption>>(
    postToEdit ? { label: postToEdit.category, value: postToEdit.category } : null
  );
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
  const [tags, setTags] = useState<MultiValue<TagOption>>(
    postToEdit?.tags?.map(tag => ({ label: tag, value: tag })) || []
  );
  const [availableTags, setAvailableTags] = useState<TagOption[]>([]);
  const [errors, setErrors] = useState({
    title: false,
    description: false,
    affiliateLink: false,
    price: false,
    category: false,
    image: false,
    tags: false,
  });
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [backendError, setBackendError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategoriesAndTags = async () => {
      try {
        const [categoriesResponse, tagsResponse] = await Promise.all([
          axios.get<string[]>('/api/categories'),
          axios.get<string[]>('https://api.kreationation.com/api/tags'),
        ]);
        
        setCategoryOptions(categoriesResponse.data.map(cat => ({ label: cat, value: cat })));
        setAvailableTags(tagsResponse.data.map(tag => ({ label: tag, value: tag })));
      } catch (error) {
        console.error('Error fetching categories or tags:', error);
      }
    };
    fetchCategoriesAndTags();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors = {
      title: !title,
      description: !description,
      affiliateLink: !affiliateLink,
      price: price === '' || isNaN(Number(price)) || Number(price) < 0,
      category: !category,
      image: false,
      tags: tags.length === 0,
    };

    setErrors(newErrors);
    if (Object.values(newErrors).some(error => error)) return;

    const validTags = tags.filter(tag => /^[a-zA-Z0-9- ]+$/.test(tag.value) && tag.value.trim().length > 0);
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('affiliateLink', affiliateLink);
    formData.append('price', String(Number(price)));
    formData.append('category', category ? category.value : '');
    formData.append('tags', JSON.stringify(validTags.map(tag => tag.value)));
    if (image) formData.append('image', image);

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found. User might not be authenticated.');

      if (postToEdit) {
        // PUT request for updating a post
        await axios.put(`/api/posts/${postToEdit._id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        });
        setSuccessMessage('Post updated successfully!');
      } else {
        // POST request for creating a post
        await axios.post('/api/posts', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        });
        setSuccessMessage('Post created successfully!');
      }

      setBackendError(null);
      setTitle('');
      setDescription('');
      setAffiliateLink('');
      setPrice('');
      setCategory(null);
      setTags([]);
      setImage(null);

      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
        onContentChange();
        setPostToEdit(null);  // Reset postToEdit after successful add or edit
      }, 3000);
    } catch (err) {
      const errorMessage = (err as ErrorResponse)?.response?.data?.message || 'Failed to submit the post. Please try again.';
      setBackendError(errorMessage);
    }
  };


  return (
    <Box w="100%" maxW="600px" mx="auto" p="6" borderWidth="1px" borderRadius="lg">
      <form onSubmit={handleSubmit}>
        <FormControl isInvalid={errors.title} mb="4">
          <Input
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          {errors.title && <FormErrorMessage>Title is required.</FormErrorMessage>}
        </FormControl>

        <FormControl isInvalid={errors.description} mb="4">
          <Textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
          {errors.description && <FormErrorMessage>Description is required.</FormErrorMessage>}
        </FormControl>

        <FormControl isInvalid={errors.affiliateLink} mb="4">
          <Input
            placeholder="Affiliate Link"
            value={affiliateLink}
            onChange={(e) => setAffiliateLink(e.target.value)}
            required
          />
          {errors.affiliateLink && <FormErrorMessage>Affiliate Link is required.</FormErrorMessage>}
        </FormControl>

        <FormControl isInvalid={errors.price} mb="4">
          <Input
            type="number"
            placeholder="Price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            min="0"
            step="0.01"
          />
          {errors.price && (
            <FormErrorMessage>Price must be a valid non-negative number.</FormErrorMessage>
          )}
        </FormControl>

        <FormControl isInvalid={errors.image} mb="4">
          <Text fontSize="sm" color="gray.500" mb="2">
            Recommended size: 600x300px (JPEG, PNG, GIF)
          </Text>
          <Input
            type="file"
            mb="4"
            accept="image/jpeg,image/png,image/gif"
            onChange={(e) => setImage(e.target.files ? e.target.files[0] : null)}
          />
          {errors.image && (
            <FormErrorMessage>Only JPEG, PNG, or GIF images are allowed.</FormErrorMessage>
          )}
        </FormControl>

        <FormControl isInvalid={errors.category} mb="4">
          <CreatableSelect
            options={categoryOptions}
            onChange={(newValue) => setCategory(newValue)}
            value={category}
            placeholder="Select or create a category"
            isClearable
          />
          {errors.category && <FormErrorMessage>Category is required.</FormErrorMessage>}
        </FormControl>

        <FormControl isInvalid={errors.tags} mb="4">
          <CreatableSelect
            isMulti
            options={availableTags}
            value={tags}
            onChange={(newValue) => setTags(newValue as MultiValue<TagOption>)}
            placeholder="Select or create tags"
          />
          {errors.tags && <FormErrorMessage>At least one tag is required.</FormErrorMessage>}
        </FormControl>

        <Button type="submit" colorScheme="blue" mt="4">
          {postToEdit ? 'Update Post' : 'Submit Post'}
        </Button>

        {successMessage && (
          <Alert status="success" mt="4">
            <AlertIcon />
            {successMessage}
          </Alert>
        )}

        {backendError && (
          <Text color="red.500" mt="4">
            {backendError}
          </Text>
        )}
      </form>
    </Box>
  );
};

export default CreatePostPage;
