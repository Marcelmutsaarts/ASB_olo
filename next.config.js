/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  // WSL compatibility
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      }
    }
    return config
  },
}

module.exports = nextConfig 