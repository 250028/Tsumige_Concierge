import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        // RAWGのゲームカバー画像
        protocol: 'https',
        hostname: 'media.rawg.io',
      },
    ],
  },
};

export default nextConfig;
