const path = require('path');
const isStaticExport = process.env.STATIC_EXPORT === '1';

// Vercel sets VERCEL=1 automatically in all cloud deployments.
// Never proxy to localhost:8100 in cloud — that port does not exist on Vercel.
const isVercel = !!process.env.VERCEL;

module.exports = {
  output: isStaticExport ? 'export' : undefined,
  distDir: isStaticExport ? 'out' : '.next',
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
    };
    return config;
  },
  ...(isStaticExport ? {} : {
    async redirects() {
      return [
        {
          source: '/privacy-policy',
          destination: '/privacy',
          permanent: true,
        },
      ];
    },
    async rewrites() {
      const rules = [];

      // Proxy /pm-api/ to the correct backend
      if (isVercel) {
        // On Vercel: route to production API
        rules.push({
          source: '/pm-api/:path*',
          destination: `${process.env.NEXT_PUBLIC_API_URL || 'https://api.fieldstone.pro'}/:path*`,
        });
      } else {
        // Local dev: route to localhost
        rules.push({
          source: '/pm-api/:path*',
          destination: 'http://localhost:8100/:path*',
        });
      }

      // External API rewrites — always active
      rules.push(
        {
          source: '/api/:path*',
          destination: `${process.env.NEXT_PUBLIC_API_URL || 'https://api.fieldstone.pro'}/api/:path*`,
        },
        {
          source: '/uploads/:path*',
          destination: `${process.env.NEXT_PUBLIC_API_URL || 'https://api.fieldstone.pro'}/uploads/:path*`,
        }
      );

      return rules;
    },
  }),
};
