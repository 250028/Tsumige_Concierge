import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        // RAWGのゲームカバー画像
        protocol: 'https',
        hostname: 'media.rawg.io',
      },
      {
        // ローカルアップロード画像（開発環境）
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
};

export default nextConfig;
