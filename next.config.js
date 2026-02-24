const path = require('path');

module.exports = {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
    };
    return config;
  },
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
};
