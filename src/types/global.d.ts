// Global type declarations for Fieldstone
// Declares process.env without requiring @types/node installation

declare const process: {
  env: {
    NODE_ENV: 'development' | 'production' | 'test';
    NEXT_PUBLIC_API_URL?: string;
    NEXT_PUBLIC_PM_API_URL?: string;
    NEXT_PUBLIC_DEMO_MODE?: string;
    NEXT_PUBLIC_DEFAULT_TENANT?: string;
    NEXT_PUBLIC_BASE_DOMAIN?: string;
    NEXT_PUBLIC_SIGNAL_DOMAIN?: string;
    NEXT_PUBLIC_DEFAULT_TECH?: string;
    NEXT_PUBLIC_API_BASE_URL?: string;
    [key: string]: string | undefined;
  };
};
