/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Modern approach (Next.js 12.3.0+)
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
    ],
    // Legacy approach (if using older Next.js versions)
    // domains: ['res.cloudinary.com'],
  },
}

export default nextConfig
