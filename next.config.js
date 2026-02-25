const path = require('path');
const isStaticExport = process.env.STATIC_EXPORT === '1';

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
      return [
        {
          source: '/api/:path*',
          destination: 'https://api.kreationation.com/api/:path*',
        },
        {
          source: '/uploads/:path*',
          destination: 'https://api.kreationation.com/uploads/:path*',
        },
      ];
    },
  }),
};
