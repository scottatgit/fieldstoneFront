// src/theme.ts
import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  colors: {
    amazonBlue: {
      500: '#0073e6',  // Primary blue for nav and buttons
      600: '#005bb5',  // Hover effect for buttons
    },
    amazonYellow: {
      500: '#ffb700',  // Primary yellow for call-to-action
      600: '#cc9200',  // Hover yellow for call-to-action
    },
  },
  fonts: {
    heading: `'amazonSans', sans-serif`,
    body: `'amazonSans', sans-serif`,
  },
  components: {
    Button: {
      variants: {
        solid: {
          bg: 'amazonBlue.500',
          color: 'white',
          _hover: {
            bg: 'amazonBlue.600',
          },
        },
        cta: {
          bg: 'amazonYellow.500',
          color: 'black',
          _hover: {
            bg: 'amazonYellow.600',
          },
        },
      },
    },
  },
});

export default theme;
