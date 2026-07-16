/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'openbeautyfacts.org' },
      { protocol: 'https', hostname: 'images.openbeautyfacts.org' },
    ],
  },
};

module.exports = nextConfig;
