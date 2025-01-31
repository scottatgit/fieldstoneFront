import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  styles: {
    global: {
      body: {
        bg: 'var(--background)',
        color: 'var(--foreground)',
        fontFamily: 'Arial, sans-serif',
      },
    },
  },
  colors: {
    background: '#1a1a1a',
    foreground: '#ffffff',
    buttonBg: '#333333', // Dark button background
    buttonHover: '#444444', // Slightly lighter button on hover
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: '500', // Semi-bold text for buttons
        borderRadius: 'md', // Medium border radius for a modern look
      },
      variants: {
        solid: {
          bg: 'var(--button-bg)', // Using CSS variable for button background
          color: 'var(--foreground)', // Light text color for readability
          _hover: {
            bg: 'var(--button-hover)', // Hover effect
          },
          _active: {
            bg: 'var(--button-hover)', // Active state
          },
        },
        outline: {
          borderColor: 'var(--foreground)', // Light border for outline buttons
          color: 'var(--foreground)',
          _hover: {
            bg: 'var(--button-hover)',
            borderColor: 'var(--foreground)',
          },
          _active: {
            bg: 'var(--button-hover)',
            borderColor: 'var(--foreground)',
          },
        },
      },
      defaultProps: {
        variant: 'solid', // Set the default variant to solid
      },
    },
  },
});

export default theme;
