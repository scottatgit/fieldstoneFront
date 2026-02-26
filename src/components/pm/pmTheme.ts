import { extendTheme } from '@chakra-ui/react';

const pmTheme = extendTheme({
  config: {
    initialColorMode: 'dark',
    useSystemColorMode: false,
  },
  styles: {
    global: {
      body: {
        bg: '#0a0e17',
        color: 'white',
        margin: 0,
        padding: 0,
        overflow: 'hidden',
      },
      '#__next': {
        height: '100dvh',
      },
    },
  },
  colors: {
    gray: {
      950: '#0a0e17',
      900: '#111827',
      800: '#1f2937',
      700: '#374151',
      600: '#4b5563',
      500: '#6b7280',
      400: '#9ca3af',
      300: '#d1d5db',
      200: '#e5e7eb',
    },
  },
});

export default pmTheme;
