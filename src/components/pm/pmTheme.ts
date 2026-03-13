import { extendTheme } from '@chakra-ui/react';

const pmTheme = extendTheme({
  config: {
    initialColorMode: 'dark',
    useSystemColorMode: false,
  },
  styles: {
    global: {
      'html, body': {
        overflowX: 'hidden',
        maxWidth: '100%',
        width: '100%',
      },
      body: {
        bg: '#0a0e17',
        color: 'white',
        margin: 0,
        padding: 0,
        overflowX: 'hidden',
        overflowY: 'auto',
      },
      '#__next': {
        minHeight: '100dvh',
        overflowX: 'hidden',
        maxWidth: '100%',
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
