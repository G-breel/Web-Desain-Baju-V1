import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lwdiyfkfbmhzunsyjogi.supabase.co',
      },
    ],
  },
};

export default nextConfig;
