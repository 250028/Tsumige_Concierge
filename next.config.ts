import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // アップロード画像など動的なローカルパスを許可（Next.js 15のセキュリティ要件）
    localPatterns: [
      { pathname: '/uploads/**' },
    ],
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
