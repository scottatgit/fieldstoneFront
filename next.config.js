module.exports = {
  async rewrites() {
    return [
      // Proxy API requests to DigitalOcean backend
      {
        source: '/api/:path*',
        destination: 'https://api.kreationation.com/api/:path*',  // Proxy to your backend on DigitalOcean
      },
      // Proxy uploads path for serving and uploading files
      {
        source: '/uploads/:path*',
        destination: 'https://api.kreationation.com/uploads/:path*',  // Proxy to your uploads folder on the backend
      },
    ];
  },
};
