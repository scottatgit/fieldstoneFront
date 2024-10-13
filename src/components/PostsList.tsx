// src/components/PostsList.tsx

"use client";  // Add this line to make it a Client Component

import { Box, Input, Select, Text, SimpleGrid } from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import axios from 'axios';

// Post type definition
interface Post {
  _id: string;
  title: string;
  description: string;
  price: number;
  user: string;
  category: string;
}

const PostsList = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    // Fetch posts data from API
    const fetchPosts = async () => {
      try {
        const response = await axios.get<Post[]>('/api/posts'); // Adjust endpoint as needed
        setPosts(response.data);
      } catch (error) {
        console.error('Error fetching posts:', error);
      }
    };
    fetchPosts();
  }, []);

  // Filter posts based on search and category
  const filteredPosts = posts.filter((post) => {
    const matchesCategory = category ? post.category === category : true;
    const matchesSearch = searchQuery
      ? post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.price.toString().includes(searchQuery)
      : true;
    return matchesCategory && matchesSearch;
  });

  return (
    <Box>
      {/* Category Dropdown */}
      <Select placeholder="Select category" onChange={(e) => setCategory(e.target.value)} mb="4">
        <option value="category1">Category 1</option>
        <option value="category2">Category 2</option>
        {/* Add more categories */}
      </Select>

      {/* Search Input */}
      <Input
        placeholder="Search by title, user, price, or description"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        mb="4"
      />

      {/* Posts Grid */}
      <SimpleGrid columns={[1, 2, 3]} spacing="6">
        {filteredPosts.length ? (
          filteredPosts.map((post) => (
            <Box key={post._id} borderWidth="1px" borderRadius="lg" p="4">
              <Text fontWeight="bold">{post.title}</Text>
              <Text>{post.description}</Text>
              <Text>Price: ${post.price}</Text>
              <Text>User: {post.user}</Text>
            </Box>
          ))
        ) : (
          <Text>No content found.</Text>
        )}
      </SimpleGrid>
    </Box>
  );
};

export default PostsList;
