"use client";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Box, Text, Slider, SliderTrack, SliderFilledTrack, SliderThumb, VStack } from "@chakra-ui/react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { RootState, AppDispatch } from "@/redux/store";
import { fetchPostsAndTags } from "@/redux/slices/tagsSlice";

// Define the Post interface
interface Post {
  id: string;
  title: string;
  description: string;
  image: string;
  price: number;
  tags: string[];
}

const FunnelComponent = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [selectedPostIndex, setSelectedPostIndex] = useState(0); // Slider index state
  const { posts, status } = useSelector((state: RootState) => state.tags);

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchPostsAndTags());
    }
  }, [dispatch, status]);

  const handleSliderChange = (value: number) => {
    setSelectedPostIndex(value);
  };

  const topCard = posts[selectedPostIndex];

  return (
    <Box width="100vw" height="100vh" display="flex">
      {/* Vertical Slider on the left */}
      <VStack width="10%" height="80vh" justifyContent="center" alignItems="center" spacing={4}>
        <Text fontSize="lg" fontWeight="bold">Select Post</Text>
        {posts.length > 0 && (
          <Slider
            orientation="vertical"
            defaultValue={0}
            min={0}
            max={posts.length - 1}
            step={1}
            height="70vh"
            onChange={handleSliderChange}
          >
            <SliderTrack>
              <SliderFilledTrack />
            </SliderTrack>
            <SliderThumb />
          </Slider>
        )}
      </VStack>

      {/* Main 3D Funnel Canvas and Information Display */}
      <Box width="90%" height="100vh" display="flex" flexDirection="column" alignItems="center">
        <Text fontSize="2xl" fontWeight="bold" mt={4}>3D Funnel with Posts</Text>
        
        {/* Display the top card's information */}
        {topCard && (
          <Box textAlign="center" p={4} mb={2} borderWidth="1px" borderRadius="lg">
            <Text fontSize="lg" fontWeight="bold">{topCard.title}</Text>
            <Text fontSize="md">{topCard.description}</Text>
            <Text fontSize="md" color="gray.600">Price: ${topCard.price}</Text>
          </Box>
        )}

        {status === "loading" && <Text>Loading data...</Text>}
        {status === "failed" && <Text>Error loading data</Text>}
        {status === "succeeded" && posts.length > 0 ? (
          <Canvas
            style={{ width: "100%", height: "80vh" }}
            camera={{
              position: [0, 10, 0],
              fov: 35,
            }}
            onCreated={({ camera }) => {
              camera.rotation.x = -Math.PI / 2;
            }}
          >
            <ambientLight />
            <pointLight position={[10, 10, 10]} />
            <Funnel items={posts} selectedIndex={selectedPostIndex} />
          </Canvas>
        ) : (
          <Text>No posts available</Text>
        )}
      </Box>
    </Box>
  );
};

interface FunnelProps {
  items: Post[];
  selectedIndex: number;
}

const Funnel = ({ items, selectedIndex }: FunnelProps) => {
  return (
    <mesh>
      <cylinderGeometry args={[2.5, 3.5, 4, 32]} /> {/* Reduced height for a flatter funnel */}
      {/* @ts-ignore */}
      <meshStandardMaterial color="lightblue" wireframe />

      {items.map((item, index) => (
        <FunnelImage
          key={item.id}
          position={getPositionOnSpiral(index, items.length, selectedIndex)}
          image={item.image}
          scale={getScaleOnSpiral(index, items.length, selectedIndex)}
          isActive={index === selectedIndex}
        />
      ))}
    </mesh>
  );
};

interface FunnelImageProps {
  position: [number, number, number];
  image: string;
  scale: number;
  isActive: boolean;
}

const FunnelImage = ({ position, image, scale, isActive }: FunnelImageProps) => {
  const imageScale = isActive ? scale * 1.2 : scale; // Highlight top card with scale
  return (
    <mesh position={position} scale={[imageScale, imageScale, imageScale]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[1, 1]} />
      {/* @ts-ignore */}
      <meshBasicMaterial map={new THREE.TextureLoader().load(image)} transparent={true} />
    </mesh>
  );
};

// Utility function to position items in a spiral with one card at the top
const getPositionOnSpiral = (
  index: number,
  totalItems: number,
  selectedIndex: number
): [number, number, number] => {
  const angle = index * 0.4;
  const radius = 2 - (index / totalItems) * 1.5; // Control radius tightness

  // Move the top card to a prominent position, and stack other cards around the spiral
  const baseHeight = -index * 0.2; // Base height for each item
  const height = index === selectedIndex ? 1.5 : baseHeight; // Lift the top card higher
  return [Math.sin(angle) * radius, height, Math.cos(angle) * radius];
};

// Utility function to scale items smaller as they go down the spiral
const getScaleOnSpiral = (index: number, totalItems: number, selectedIndex: number): number => {
  return index === selectedIndex ? 1.2 : 1 - (index / totalItems) * 0.5;
};

export default FunnelComponent;
