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
    async rewrites() {
      const rules = [];

      // Only proxy to local SecondBrain API when running locally.
      // On Vercel all /pm-api/ calls are intercepted by demoApi.ts (demo mode).
      if (!isVercel) {
        rules.push({
          source: '/pm-api/:path*',
          destination: 'http://localhost:8100/:path*',
        });
      }

      // External API rewrites — always active
      rules.push(
        {
          source: '/api/:path*',
          destination: 'https://api.brandie.cc/api/:path*',
        },
        {
          source: '/uploads/:path*',
          destination: 'https://api.brandie.cc/uploads/:path*',
        }
      );

      return rules;
    },
  }),
};
