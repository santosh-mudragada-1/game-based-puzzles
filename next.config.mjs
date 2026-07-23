/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Prototype uses local /public assets only.
    unoptimized: true,
  },
};

export default nextConfig;
