/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // ESLint parser can fail to resolve in monorepo CI; typecheck job catches TS errors
  eslint: { ignoreDuringBuilds: true },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'dummyimage.com' },
      { protocol: 'https', hostname: 'placehold.co' },
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
    // Allow base64 data URLs (Gemini-generated images stored as data URIs)
    dangerouslyAllowSVG: false,
  },
  // Tell Next.js where to find packages in the monorepo
  transpilePackages: ['@motixai/shared', '@motixai/api-client'],
};

export default nextConfig;
