import { extendTheme, ThemeConfig } from "@chakra-ui/react";

// Theme configuration for Chakra UI
const config: ThemeConfig = {
  initialColorMode: "light",  // Set default color mode
  useSystemColorMode: false,  // Disables system preference-based color mode
};

// Custom color palette
const colors = {
  brand: {
    50: "#f5f7ff",
    100: "#e2e6fe",
    200: "#c5ccfc",
    300: "#a8b2fb",
    400: "#8b98f9",
    500: "#6e7ef8", // Main brand color
    600: "#5a66c7",
    700: "#454e96",
    800: "#2f3665",
    900: "#1a1e34",
  },
  gray: {
    50: "#f7fafc",
    100: "#edf2f7",
    200: "#e2e8f0",
    300: "#cbd5e0",
    400: "#a0aec0",
    500: "#718096",
    600: "#4a5568",
    700: "#2d3748",
    800: "#1a202c",
    900: "#171923",
  },
};

// Custom font sizes and styles
const fonts = {
  heading: `'Geist Sans', sans-serif`,  // Custom font for headings
  body: `'Geist Mono', sans-serif`,     // Custom font for body text
};

// Component style overrides
const components = {
  Button: {
    baseStyle: {
      fontWeight: "bold",
      borderRadius: "md",
    },
    sizes: {
      lg: {
        px: 8,
        py: 6,
        fontSize: "lg",
      },
    },
    variants: {
      solid: {
        bg: "brand.500",
        color: "white",
        _hover: {
          bg: "brand.600",
        },
      },
    },
  },
  Text: {
    baseStyle: {
      color: "gray.700",
    },
    variants: {
      header: {
        fontSize: "4xl",
        fontWeight: "bold",
        color: "gray.900",
      },
      subHeader: {
        fontSize: "2xl",
        fontWeight: "semibold",
        color: "gray.600",
      },
    },
  },
  Link: {
    baseStyle: {
      color: "brand.500",
      fontWeight: "semibold",
      _hover: {
        textDecoration: "underline",
        color: "brand.600",
      },
    },
  },
};

// Extending the theme
const theme = extendTheme({
  config,
  colors,
  fonts,
  components,
});

export default theme;
