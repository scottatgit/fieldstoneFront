import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  config: {
    initialColorMode: 'dark',
    useSystemColorMode: false,
  },
  styles: {
    global: {
      body: {
        bg: 'gray.950',
        color: 'white',
        fontFamily: 'Arial, sans-serif',
      },
    },
  },
  colors: {
    gray: {
      950: '#0a0e17',
    },
    background: '#1a1a1a',
    foreground: '#ffffff',
    buttonBg: '#333333',
    buttonHover: '#444444',
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: '500',
        borderRadius: 'md',
      },
      variants: {
        solid: {
          bg: 'var(--button-bg)',
          color: 'var(--foreground)',
          _hover: { bg: 'var(--button-hover)' },
          _active: { bg: 'var(--button-hover)' },
        },
        outline: {
          borderColor: 'var(--foreground)',
          color: 'var(--foreground)',
          _hover: { bg: 'var(--button-hover)', borderColor: 'var(--foreground)' },
          _active: { bg: 'var(--button-hover)', borderColor: 'var(--foreground)' },
        },
      },
      defaultProps: { variant: 'solid' },
    },
  },
});

export default theme;
