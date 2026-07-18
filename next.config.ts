import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Cloudflare Workers ne supporte pas le serveur d'optimisation d'images Next.js
    unoptimized: true,
  },
};

export default nextConfig;
