/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuration for both Vercel and static hosting
  output: process.env.BUILD_STATIC ? 'export' : undefined,
  trailingSlash: process.env.BUILD_STATIC ? true : false,
  distDir: process.env.BUILD_STATIC ? 'static-build' : '.next',
  
  // Production optimizations for Vercel
  serverExternalPackages: [],
  
  // Image optimization for production
  images: {
    domains: ['localhost', 'vercel.app'],
    formats: ['image/webp', 'image/avif'],
    unoptimized: process.env.BUILD_STATIC ? true : false,
  },
  
  // Performance optimizations
  compress: true,
  
  async headers() {
    return [
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig
